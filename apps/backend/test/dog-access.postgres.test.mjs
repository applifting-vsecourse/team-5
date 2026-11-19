// Access rules for dogs, goals, plans, trainings and records (#85), checked
// against a real PostgreSQL database through the real services and repositories.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { ClientRepository } from '../dist/modules/client/repositories/client.repository.js';
import { ActivityRepository } from '../dist/modules/dog/repositories/activity.repository.js';
import { DogNoteRepository } from '../dist/modules/dog/repositories/dog-note.repository.js';
import { DogRepository } from '../dist/modules/dog/repositories/dog.repository.js';
import { GoalRepository } from '../dist/modules/dog/repositories/goal.repository.js';
import { PlanBlockRepository } from '../dist/modules/dog/repositories/plan-block.repository.js';
import { ScheduledTrainingRepository } from '../dist/modules/dog/repositories/scheduled-training.repository.js';
import { ActivitiesService } from '../dist/modules/dog/services/activities.service.js';
import { DogAccessService } from '../dist/modules/dog/services/dog-access.service.js';
import { DogNotesService } from '../dist/modules/dog/services/dog-notes.service.js';
import { DogsService } from '../dist/modules/dog/services/dogs.service.js';
import { GoalsService } from '../dist/modules/dog/services/goals.service.js';
import { PlanBlocksService } from '../dist/modules/dog/services/plan-blocks.service.js';
import { TrainingsService } from '../dist/modules/dog/services/trainings.service.js';

const connectionString = process.env.AUTH_TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Set AUTH_TEST_DATABASE_URL to an isolated, migrated PostgreSQL test database.',
  );

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const dogRepository = new DogRepository(prisma);
const dogAccess = new DogAccessService(dogRepository);
const dogs = new DogsService(dogRepository, dogAccess);
const goals = new GoalsService(new GoalRepository(prisma), dogAccess);
const blocks = new PlanBlocksService(new PlanBlockRepository(prisma), goals);
const trainings = new TrainingsService(
  new ScheduledTrainingRepository(prisma),
  goals,
);
const activities = new ActivitiesService(
  new ActivityRepository(prisma),
  dogAccess,
);
const notes = new DogNotesService(new DogNoteRepository(prisma), dogAccess);

const userIds = [];
async function createUser(role) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name: `${role} ${id.slice(0, 4)}`,
      email: `${id}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role,
    },
  });
  userIds.push(id);
  return { id, email: `${id}@example.com`, name: role, role };
}

const status = (error) => error?.getStatus?.();
const rejectsWith = (httpStatus, promise) =>
  assert.rejects(promise, (error) => status(error) === httpStatus);
const inDays = (days) => {
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
};

let owner;
let trainer; // the dog is shared with this trainer
let otherTrainer; // a trainer without a share
let stranger; // an ordinary user
let dog;
let goal;
let block;
let note;

before(async () => {
  owner = await createUser('user');
  trainer = await createUser('trainer');
  otherTrainer = await createUser('trainer');
  stranger = await createUser('user');
  dog = await prisma.dog.create({
    data: {
      name: 'Rex',
      color: 1,
      ownerId: owner.id,
      disciplines: ['Poslušnost'],
    },
  });
  await prisma.clientConnection.create({
    data: { trainerId: trainer.id, clientId: owner.id },
  });
  await prisma.dogShare.create({
    data: { dogId: dog.id, trainerId: trainer.id },
  });
  goal = await goals.createGoal(owner, dog.id, { title: 'Chůze u nohy' });
  block = await blocks.createBlock(owner, goal.id, { title: 'Sedni' });
  await activities.createActivity(owner, dog.id, { title: 'Chůze' });
  note = await notes.createNote(owner, dog.id, {
    date: inDays(-2),
    title: 'Seminář',
    text: 'Poznámka jen pro psovoda',
  });
});

after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('the owner', () => {
  test('reads and edits their own dog, goals, plan, trainings, records and notes', async () => {
    assert.equal((await dogs.getDogById(owner, dog.id)).id, dog.id);
    assert.equal(
      (await dogs.updateDog(owner, dog.id, { name: 'Rexík' })).name,
      'Rexík',
    );
    assert.equal((await goals.getGoalsByDogId(owner, dog.id)).length, 1);
    assert.equal((await goals.getGoal(owner, goal.id)).id, goal.id);
    assert.equal((await blocks.getBlocks(owner, goal.id)).length, 1);
    assert.equal(
      (await activities.getActivitiesByDogId(owner, dog.id)).total,
      1,
    );
    assert.equal((await notes.getNotesByDogId(owner, dog.id)).length, 1);
    assert.equal((await notes.getNote(owner, note.id)).id, note.id);
    const week = await trainings.getWeekTrainings(owner, inDays(-1), inDays(5));
    assert.ok(Array.isArray(week));
  });
});

describe('a trainer the dog is shared with', () => {
  test('reads the dog', async () => {
    assert.equal((await dogs.getDogById(trainer, dog.id)).id, dog.id);
  });

  test('works on the goals: lists, reads, creates, edits and deletes', async () => {
    assert.equal((await goals.getGoalsByDogId(trainer, dog.id)).length, 1);
    assert.equal((await goals.getGoal(trainer, goal.id)).id, goal.id);
    const created = await goals.createGoal(trainer, dog.id, {
      title: 'Zadání od trenéra',
    });
    assert.equal(created.createdBy.id, trainer.id);
    assert.equal(
      (await goals.updateGoal(trainer, created.id, { title: 'Upraveno' }))
        .title,
      'Upraveno',
    );
    await goals.deleteGoal(trainer, created.id);
    await rejectsWith(404, goals.getGoal(owner, created.id));
  });

  test('works on the plan blocks and schedules a training', async () => {
    assert.equal((await blocks.getBlocks(trainer, goal.id)).length, 1);
    const added = await blocks.createBlock(trainer, goal.id, {
      title: 'Zůstaň',
    });
    await blocks.updateBlock(trainer, added.id, { title: 'Zůstaň 5 s' });
    await blocks.reorderBlocks(trainer, goal.id, [added.id, block.id]);
    await blocks.deleteBlock(trainer, added.id);
    const training = await trainings.scheduleTraining(
      trainer,
      goal.id,
      inDays(2),
    );
    assert.equal(training.goalId, goal.id);
    // the owner sees the training in their own week
    const week = await trainings.getWeekTrainings(owner, inDays(0), inDays(5));
    assert.ok(week.some((item) => item.id === training.id));
    // the trainer's own week is about their own dogs, not their clients' dogs
    const trainerWeek = await trainings.getWeekTrainings(
      trainer,
      inDays(0),
      inDays(5),
    );
    assert.equal(trainerWeek.length, 0);
  });

  test("reads the dog's activity records", async () => {
    assert.equal(
      (await activities.getActivitiesByDogId(trainer, dog.id)).total,
      1,
    );
  });

  test("cannot log a workout, edit the dog's profile or touch private notes (403)", async () => {
    await rejectsWith(
      403,
      activities.createActivity(trainer, dog.id, { title: 'Podvrh' }),
    );
    await rejectsWith(403, dogs.updateDog(trainer, dog.id, { name: 'Hacked' }));
    await rejectsWith(403, notes.getNotesByDogId(trainer, dog.id));
    await rejectsWith(403, notes.getNote(trainer, note.id));
    await rejectsWith(
      403,
      notes.createNote(trainer, dog.id, { title: 'x', text: 'x' }),
    );
    await rejectsWith(403, notes.updateNote(trainer, note.id, { title: 'x' }));
    await rejectsWith(403, notes.deleteNote(trainer, note.id));
    assert.equal((await dogs.getDogById(owner, dog.id)).name, 'Rexík');
    assert.equal(
      (await activities.getActivitiesByDogId(owner, dog.id)).total,
      1,
    );
    assert.equal((await notes.getNotesByDogId(owner, dog.id)).length, 1);
  });

  test('does not get the dog among their own dogs', async () => {
    assert.deepEqual(await dogs.getDogs(trainer), []);
  });
});

for (const [label, who] of [
  ['a trainer without a share', () => otherTrainer],
  ['another user', () => stranger],
]) {
  describe(label, () => {
    test('gets 404 for the dog, goals, plan, trainings and records', async () => {
      const user = who();
      await rejectsWith(404, dogs.getDogById(user, dog.id));
      await rejectsWith(404, dogs.updateDog(user, dog.id, { name: 'Hacked' }));
      await rejectsWith(404, goals.getGoalsByDogId(user, dog.id));
      await rejectsWith(404, goals.getGoal(user, goal.id));
      await rejectsWith(404, goals.createGoal(user, dog.id, { title: 'x' }));
      await rejectsWith(404, goals.updateGoal(user, goal.id, { title: 'x' }));
      await rejectsWith(404, goals.deleteGoal(user, goal.id));
      await rejectsWith(404, blocks.getBlocks(user, goal.id));
      await rejectsWith(404, blocks.createBlock(user, goal.id, { title: 'x' }));
      await rejectsWith(
        404,
        blocks.updateBlock(user, block.id, { title: 'x' }),
      );
      await rejectsWith(404, blocks.deleteBlock(user, block.id));
      await rejectsWith(
        404,
        trainings.scheduleTraining(user, goal.id, inDays(3)),
      );
      await rejectsWith(404, trainings.getGoalTrainings(user, goal.id));
      await rejectsWith(404, activities.getActivitiesByDogId(user, dog.id));
      await rejectsWith(
        404,
        activities.createActivity(user, dog.id, { title: 'x' }),
      );
      await rejectsWith(404, notes.getNotesByDogId(user, dog.id));
      await rejectsWith(404, notes.getNote(user, note.id));
      await rejectsWith(
        404,
        notes.createNote(user, dog.id, { title: 'x', text: 'x' }),
      );
      await rejectsWith(404, notes.updateNote(user, note.id, { title: 'x' }));
      await rejectsWith(404, notes.deleteNote(user, note.id));
    });

    test('gets the same 404 as for data that does not exist', async () => {
      const user = who();
      const missing = await dogs.getDogById(user, randomUUID()).catch((e) => e);
      const foreign = await dogs.getDogById(user, dog.id).catch((e) => e);
      assert.equal(status(missing), 404);
      assert.equal(status(foreign), 404);
      assert.equal(
        missing.message.replace(/ID .* not/, 'ID _ not'),
        foreign.message.replace(/ID .* not/, 'ID _ not'),
      );
    });
  });
}

describe('when the collaboration ends (#61)', () => {
  test('only the owner can remove a dog share', async () => {
    await rejectsWith(403, dogs.endSharing(trainer, dog.id, trainer.id));
    await rejectsWith(404, dogs.endSharing(stranger, dog.id, trainer.id));
    assert.ok(await dogs.getDogById(trainer, dog.id));
  });

  test('the trainer loses access to everything at once', async () => {
    const record = await prisma.workoutLog.findFirstOrThrow({
      where: { dogId: dog.id },
    });
    await prisma.trainingMessage.create({
      data: {
        workoutLogId: record.id,
        authorId: trainer.id,
        text: 'Keep this reply',
      },
    });
    await dogs.endSharing(owner, dog.id, trainer.id);
    assert.equal(
      await prisma.clientConnection.count({
        where: { trainerId: trainer.id, clientId: owner.id },
      }),
      0,
    );
    assert.equal(
      await prisma.trainingMessage.count({
        where: { workoutLogId: record.id, text: 'Keep this reply' },
      }),
      1,
    );

    await rejectsWith(404, dogs.getDogById(trainer, dog.id));
    await rejectsWith(404, goals.getGoalsByDogId(trainer, dog.id));
    await rejectsWith(404, goals.getGoal(trainer, goal.id));
    await rejectsWith(404, goals.createGoal(trainer, dog.id, { title: 'x' }));
    await rejectsWith(404, blocks.getBlocks(trainer, goal.id));
    await rejectsWith(
      404,
      trainings.scheduleTraining(trainer, goal.id, inDays(4)),
    );
    await rejectsWith(404, activities.getActivitiesByDogId(trainer, dog.id));
    await rejectsWith(404, notes.getNotesByDogId(trainer, dog.id));
    await rejectsWith(404, notes.getNote(trainer, note.id));
  });

  test('the owner keeps the plan, trainings, records and notes', async () => {
    assert.equal((await goals.getGoalsByDogId(owner, dog.id)).length, 1);
    assert.equal((await blocks.getBlocks(owner, goal.id)).length, 1);
    assert.equal(
      (await activities.getActivitiesByDogId(owner, dog.id)).total,
      1,
    );
    assert.equal((await notes.getNotesByDogId(owner, dog.id)).length, 1);
    const week = await trainings.getWeekTrainings(owner, inDays(0), inDays(5));
    assert.ok(week.length >= 1);
  });

  test('per-dog removal preserves other shares; trainer removal includes archived dogs', async () => {
    const secondDog = await prisma.dog.create({
      data: { name: 'Baryk', color: 2, ownerId: owner.id, isArchived: true },
    });
    await prisma.clientConnection.createMany({
      data: [trainer, otherTrainer].map((t) => ({
        trainerId: t.id,
        clientId: owner.id,
      })),
    });
    await prisma.dogShare.createMany({
      data: [
        { dogId: dog.id, trainerId: trainer.id },
        { dogId: secondDog.id, trainerId: trainer.id },
        { dogId: dog.id, trainerId: otherTrainer.id },
      ],
    });
    await dogs.endSharing(owner, dog.id, trainer.id);
    const clients = new ClientRepository(prisma);
    assert.ok(await clients.getClientById(owner.id, trainer.id));
    assert.equal(await clients.endCollaboration(owner.id, stranger.id), false);
    assert.equal(await clients.endCollaboration(owner.id, trainer.id), true);
    assert.equal(
      await prisma.dogShare.count({ where: { trainerId: trainer.id } }),
      0,
    );
    assert.equal(await clients.getClientById(owner.id, trainer.id), null);
    assert.ok(await dogs.getDogById(otherTrainer, dog.id));
    assert.ok(await dogs.getDogById(owner, secondDog.id));
  });
});
