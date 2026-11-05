BEGIN;
CREATE TABLE "discipline" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(60) NOT NULL UNIQUE
);
CREATE TABLE "dog_discipline" (
  "id" TEXT PRIMARY KEY,
  "dogId" TEXT NOT NULL REFERENCES "dog"("id") ON DELETE CASCADE,
  "disciplineId" TEXT NOT NULL REFERENCES "discipline"("id"),
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("dogId", "disciplineId")
);
CREATE TABLE "goal_training" (
  "id" TEXT PRIMARY KEY,
  "goalId" TEXT NOT NULL REFERENCES "training_goal"("id") ON DELETE CASCADE,
  "title" VARCHAR(100) NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0 CHECK ("position" >= 0),
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "goal_training_goalId_position_idx" ON "goal_training"("goalId", "position");
ALTER TABLE "dog" ADD COLUMN "weeklyTarget" INTEGER NOT NULL DEFAULT 3 CHECK ("weeklyTarget" BETWEEN 1 AND 7);
ALTER TABLE "training_goal" ADD COLUMN "disciplineId" TEXT,
  ADD COLUMN "criterion" TEXT;
ALTER TABLE "plan_block" ADD COLUMN "trainingId" TEXT;
ALTER TABLE "scheduled_training" ADD COLUMN "trainingId" TEXT;
ALTER TABLE "workout_log" ADD COLUMN "trainingId" TEXT;

CREATE TEMP TABLE legacy_disciplines ON COMMIT DROP AS
  SELECT "id" AS "dogId", unnest("disciplines") AS "name" FROM "dog"
  UNION SELECT "dogId", COALESCE(NULLIF(btrim("discipline"), ''), 'Obecné') FROM "training_goal"
;
INSERT INTO "discipline" ("id", "name")
SELECT 'discipline-' || md5("name"), "name" FROM legacy_disciplines GROUP BY "name";
INSERT INTO "dog_discipline" ("id", "dogId", "disciplineId")
SELECT 'dog-discipline-' || md5(l."dogId" || ':' || l."name"), l."dogId", d."id"
FROM legacy_disciplines l JOIN "discipline" d ON d."name" = l."name";
UPDATE "training_goal" g SET "disciplineId" = d."id", "discipline" = d."name"
FROM "discipline" d WHERE d."name" = COALESCE(NULLIF(btrim(g."discipline"), ''), 'Obecné');
INSERT INTO "goal_training" ("id", "goalId", "title", "createdAt", "updatedAt")
SELECT 'training-' || "id", "id", "title", "createdAt", "updatedAt" FROM "training_goal";
UPDATE "plan_block" SET "trainingId" = 'training-' || "goalId";
UPDATE "scheduled_training" SET "trainingId" = 'training-' || "goalId";
UPDATE "workout_log" SET "trainingId" = 'training-' || "goalId" WHERE "goalId" IS NOT NULL;

ALTER TABLE "training_goal" ALTER COLUMN "disciplineId" SET NOT NULL,
  ADD CONSTRAINT "training_goal_dogId_disciplineId_fkey" FOREIGN KEY ("dogId", "disciplineId") REFERENCES "dog_discipline"("dogId", "disciplineId");
ALTER TABLE "plan_block" ALTER COLUMN "trainingId" SET NOT NULL,
  ADD CONSTRAINT "plan_block_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "goal_training"("id") ON DELETE CASCADE;
ALTER TABLE "scheduled_training" ALTER COLUMN "trainingId" SET NOT NULL,
  ADD CONSTRAINT "scheduled_training_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "goal_training"("id");
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_trainingId_fkey"
  FOREIGN KEY ("trainingId") REFERENCES "goal_training"("id") ON DELETE SET NULL;
CREATE INDEX "plan_block_trainingId_position_idx" ON "plan_block"("trainingId", "position");
CREATE INDEX "scheduled_training_trainingId_date_idx" ON "scheduled_training"("trainingId", "date");
-- Existing duplicate legacy sessions, if any, remain available. Application
-- writes serialize on the goal row, including move/restore/reorder operations.

-- Keep the legacy dog's string list as an input/projection during the UI rollout.
CREATE FUNCTION sync_dog_disciplines() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "discipline" ("id", "name")
  SELECT 'discipline-' || md5(name), name
  FROM unnest(NEW."disciplines") AS name
  ON CONFLICT ("name") DO NOTHING;
  UPDATE "dog_discipline" dd SET "isArchived" = NOT (d."name" = ANY(NEW."disciplines")),
    "updatedAt" = CURRENT_TIMESTAMP FROM "discipline" d
    WHERE dd."dogId" = NEW."id" AND d."id" = dd."disciplineId";
  INSERT INTO "dog_discipline" ("id", "dogId", "disciplineId")
  SELECT 'dog-discipline-' || md5(NEW."id" || ':' || d."name"), NEW."id", d."id"
  FROM "discipline" d WHERE d."name" = ANY(NEW."disciplines")
  ON CONFLICT ("dogId", "disciplineId") DO UPDATE SET "isArchived" = false;
  RETURN NEW;
END $$;
CREATE TRIGGER dog_disciplines AFTER INSERT OR UPDATE OF "disciplines" ON "dog"
FOR EACH ROW EXECUTE FUNCTION sync_dog_disciplines();

CREATE FUNCTION attach_goal_discipline() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE selected_name TEXT;
BEGIN
  IF NEW."disciplineId" IS NOT NULL AND
    (TG_OP = 'INSERT' OR NEW."disciplineId" IS DISTINCT FROM OLD."disciplineId") THEN
    SELECT d."name" INTO STRICT selected_name FROM "discipline" d
      JOIN "dog_discipline" dd ON dd."disciplineId" = d."id"
      WHERE d."id" = NEW."disciplineId" AND dd."dogId" = NEW."dogId";
    NEW."discipline" := selected_name;
  ELSE
    selected_name := COALESCE(NULLIF(btrim(NEW."discipline"), ''), 'Obecné');
    INSERT INTO "discipline" ("id", "name")
      VALUES ('discipline-' || md5(selected_name), selected_name)
      ON CONFLICT ("name") DO NOTHING;
    SELECT "id" INTO NEW."disciplineId" FROM "discipline"
      WHERE "name" = selected_name;
    INSERT INTO "dog_discipline" ("id", "dogId", "disciplineId")
      VALUES ('dog-discipline-' || md5(NEW."dogId" || ':' || selected_name), NEW."dogId", NEW."disciplineId")
      ON CONFLICT ("dogId", "disciplineId") DO NOTHING;
    NEW."discipline" := selected_name;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER goal_discipline BEFORE INSERT OR UPDATE OF "discipline", "disciplineId", "dogId"
ON "training_goal" FOR EACH ROW EXECUTE FUNCTION attach_goal_discipline();

-- Resolve old clients to ONE concrete training. Ambiguous goals must use v2.
CREATE FUNCTION attach_concrete_training() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE candidates INTEGER; parent_goal TEXT; parent_dog TEXT;
BEGIN
  PERFORM "id" FROM "training_goal" WHERE "id" = NEW."goalId" FOR UPDATE;
  IF NEW."trainingId" IS NULL THEN
    SELECT count(*), min("id") INTO candidates, NEW."trainingId"
      FROM "goal_training" WHERE "goalId" = NEW."goalId";
    IF candidates > 1 THEN RAISE EXCEPTION 'Select a concrete training'; END IF;
    IF candidates = 0 THEN
      INSERT INTO "goal_training" ("id", "goalId", "title")
        SELECT 'training-' || "id", "id", "title" FROM "training_goal" WHERE "id" = NEW."goalId"
        RETURNING "id" INTO NEW."trainingId";
    END IF;
  END IF;
  SELECT t."goalId", g."dogId" INTO STRICT parent_goal, parent_dog
    FROM "goal_training" t JOIN "training_goal" g ON g."id" = t."goalId"
    WHERE t."id" = NEW."trainingId";
  IF parent_goal <> NEW."goalId" THEN RAISE EXCEPTION 'Training belongs to another goal'; END IF;
  IF TG_TABLE_NAME = 'scheduled_training' THEN
    IF parent_dog <> NEW."dogId" THEN RAISE EXCEPTION 'Training belongs to another dog'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER block_training BEFORE INSERT OR UPDATE OF "goalId", "trainingId" ON "plan_block"
FOR EACH ROW EXECUTE FUNCTION attach_concrete_training();
CREATE TRIGGER session_training BEFORE INSERT OR UPDATE OF "goalId", "trainingId", "dogId" ON "scheduled_training"
FOR EACH ROW EXECUTE FUNCTION attach_concrete_training();
COMMIT;
