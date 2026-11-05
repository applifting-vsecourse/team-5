// Isolated migration check. PGLITE_MODULE_PATH points to a temporary PGlite
// installation, so this tool adds no application/runtime dependency.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(
  process.env.PGLITE_MODULE_PATH
    ? pathToFileURL(process.env.PGLITE_MODULE_PATH).href
    : '@electric-sql/pglite'
);
const db = new PGlite();
const migrations = new URL('../prisma/migrations/', import.meta.url);
const latest = '20261105120000_training_hierarchy';
const sql = async (text) => (await db.query(text)).rows;
try {
  for (const name of (await readdir(migrations))
    .filter((name) => name < latest)
    .sort()) {
    if (!name.startsWith('20')) continue;
    await db.exec(
      await readFile(new URL(`${name}/migration.sql`, migrations), 'utf8'),
    );
  }
  await db.exec(`
    INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt")
      VALUES ('owner','Owner','owner@example.test',true,now(),now());
    INSERT INTO dog (id,name,color,"ownerId",disciplines) VALUES
      ('alik','Alík',1,'owner',ARRAY['Poslušnost']), ('rex','Rex',2,'owner',ARRAY['Poslušnost']);
    INSERT INTO training_goal (id,"dogId",title,discipline) VALUES
      ('g1','alik','Chůze u nohy','Poslušnost'), ('g2','rex','Chůze u nohy','Poslušnost'),
      ('g3','alik','Bez disciplíny',NULL);
    INSERT INTO plan_block (id,"goalId",position,title,criterion) VALUES ('b1','g1',0,'Kontakt','5 sekund');
    INSERT INTO scheduled_training (id,"goalId","dogId",date,status) VALUES ('s1','g1','alik','2026-11-05','COMPLETED');
    INSERT INTO workout_log (id,"dogId","goalId",title,"scheduledTrainingId") VALUES ('l1','alik','g1','Kontakt','s1');
  `);
  await db.exec(
    await readFile(new URL(`${latest}/migration.sql`, migrations), 'utf8'),
  );
  const categories = await sql(
    `SELECT * FROM discipline WHERE name = 'Poslušnost'`,
  );
  assert.equal(categories.length, 1, 'both dogs share the category');
  assert.equal(
    (
      await sql(
        `SELECT * FROM dog_discipline WHERE "disciplineId" = '${categories[0].id}'`,
      )
    ).length,
    2,
  );
  assert.equal(
    (await sql(`SELECT "trainingId" FROM plan_block WHERE id='b1'`))[0]
      .trainingId,
    'training-g1',
  );
  assert.equal(
    (await sql(`SELECT "trainingId" FROM scheduled_training WHERE id='s1'`))[0]
      .trainingId,
    'training-g1',
  );
  assert.equal(
    (await sql(`SELECT "trainingId" FROM workout_log WHERE id='l1'`))[0]
      .trainingId,
    'training-g1',
  );
  assert.equal(
    (await sql(`SELECT discipline FROM training_goal WHERE id='g3'`))[0]
      .discipline,
    'Obecné',
  );

  await db.exec(`
    INSERT INTO training_goal (id,"dogId",title) VALUES ('g4','rex','Nový cíl');
    INSERT INTO plan_block (id,"goalId",position,title) VALUES ('b4','g4',0,'První krok');
    INSERT INTO goal_training (id,"goalId",title,position) VALUES ('t2','g1','Obraty',1);
    INSERT INTO plan_block (id,"goalId","trainingId",position,title) VALUES ('b2','g1','t2',0,'Obrat');
    INSERT INTO scheduled_training (id,"goalId","trainingId","dogId",date) VALUES ('s2','g1','t2','alik','2026-11-06');
  `);
  assert.equal(
    (await sql(`SELECT "trainingId" FROM plan_block WHERE id='b4'`))[0]
      .trainingId,
    'training-g4',
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO plan_block (id,"goalId",position,title) VALUES ('ambiguous','g1',0,'?')`,
    ),
    /Select a concrete training/,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO plan_block (id,"goalId","trainingId",position,title) VALUES ('wrong','g2','t2',0,'?')`,
    ),
    /another goal/,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO scheduled_training (id,"goalId","trainingId","dogId",date) VALUES ('wrong','g1','t2','rex','2026-11-07')`,
    ),
    /another dog/,
  );
  await db.exec(`UPDATE dog SET disciplines = ARRAY[]::text[] WHERE id='alik'`);
  assert.equal(
    (
      await sql(
        `SELECT "isArchived" FROM dog_discipline WHERE "dogId"='alik' AND "disciplineId"='${categories[0].id}'`,
      )
    )[0].isArchived,
    true,
  );
  assert.equal(
    (
      await sql(
        `SELECT "isArchived" FROM dog_discipline WHERE "dogId"='rex' AND "disciplineId"='${categories[0].id}'`,
      )
    )[0].isArchived,
    false,
  );
  assert.equal(
    (await sql(`SELECT count(*)::int AS n FROM workout_log WHERE id='l1'`))[0]
      .n,
    1,
  );
  await db.exec(`DELETE FROM "user" WHERE id='owner'`);
  for (const table of [
    'dog',
    'dog_discipline',
    'training_goal',
    'goal_training',
    'plan_block',
    'scheduled_training',
    'workout_log',
  ]) {
    assert.equal(
      (await sql(`SELECT count(*)::int AS n FROM "${table}"`))[0].n,
      0,
      `${table} follows owner deletion`,
    );
  }
  console.log(
    'PASS: migration, shared disciplines, isolated plans, legacy compatibility, parent integrity, archive and owner deletion',
  );
} finally {
  await db.close();
}
