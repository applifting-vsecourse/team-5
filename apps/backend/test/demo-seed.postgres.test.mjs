import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import {
  DEMO_PASSWORD,
  seedDemoDatabase,
} from '../dist/scripts/seed/seed/demo-seed.js';
import {
  seedDatabase,
  seedTrainingPlans,
} from '../dist/scripts/seed/seed/seed-database.js';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

// This suite intentionally resets the reserved demo fixtures. Use a disposable DB.
const connectionString = process.env.DEMO_TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Set DEMO_TEST_DATABASE_URL to an isolated, migrated PostgreSQL database.',
  );
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

test(
  'demo seed has valid relationships, repeatable dates, working credentials and preserves other data',
  { timeout: 180_000 },
  async () => {
    const now = new Date('2026-11-07T23:30:00Z'); // Sunday in Prague, Saturday in UTC.
    const sentinelId = 'seed-test-unrelated-owner';
    try {
      await prisma.user.create({
        data: {
          id: sentinelId,
          name: 'Unrelated user',
          email: 'unrelated@seed-test.test',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      const sentinelDog = await prisma.dog.create({
        data: { name: 'Untouched', color: 1, ownerId: sentinelId },
      });
      await seedDemoDatabase(prisma, now);
      const counts = async () =>
        Promise.all([
          prisma.user.count(),
          prisma.dog.count(),
          prisma.trainingGoal.count(),
          prisma.goalTraining.count(),
          prisma.planBlock.count(),
          prisma.scheduledTraining.count(),
          prisma.workoutLog.count(),
          prisma.trainingMessage.count(),
          prisma.dogNote.count(),
          prisma.invitation.count(),
        ]);
      const first = await counts();
      assert.equal(
        await prisma.user.count({
          where: { id: { startsWith: 'demo-user-' } },
        }),
        15,
      );
      assert.equal(
        await prisma.dog.count({ where: { id: { startsWith: 'demo-dog-' } } }),
        25,
      );
      assert.equal(
        await prisma.dog.count({ where: { owner: { role: 'trainer' } } }),
        0,
        'demo trainers have no own dogs',
      );
      assert.ok(first[6] > 800, 'large enough history for pagination');
      const auth = betterAuth({
        ...betterAuthCoreConfig,
        database: prismaAdapter(prisma, { provider: 'postgresql' }),
        baseURL: 'http://localhost:4050',
        secret: 'demo-seed-test-secret-at-least-32-characters',
        rateLimit: { enabled: false },
      });
      for (const [key, role] of [
        ['owner', 'user'],
        ['trainer', 'trainer'],
      ]) {
        const login = await auth.api.signInEmail({
          body: {
            email: `${key}@demo.trainloop.test`,
            password: DEMO_PASSWORD,
          },
          asResponse: true,
        });
        assert.equal(login.status, 200);
        assert.equal((await login.json()).user.role, role);
      }
      assert.equal(
        await prisma.dog.count({ where: { ownerId: 'demo-user-owner-empty' } }),
        0,
      );
      assert.equal(
        await prisma.clientConnection.count({
          where: { trainerId: 'demo-user-trainer-empty' },
        }),
        0,
      );
      assert.equal(
        await prisma.trainingGoal.count({ where: { dogId: 'demo-dog-3' } }),
        0,
      );
      const today = await prisma.scheduledTraining.findFirstOrThrow({
        where: { id: 'demo-dog-0-goal-0-scheduled-0' },
      });
      assert.equal(today.date.toISOString().slice(0, 10), '2026-11-08');
      const invalid = await prisma.$queryRaw`
      SELECT s.id FROM scheduled_training s
      LEFT JOIN workout_log l ON l."scheduledTrainingId" = s.id
      JOIN goal_training t ON t.id = s."trainingId"
      JOIN training_goal g ON g.id = t."goalId"
      WHERE s.id LIKE 'demo-%' AND (
        g.id <> s."goalId" OR g."dogId" <> s."dogId"
        OR (s.status = 'PLANNED' AND l.id IS NOT NULL)
        OR (s.status <> 'PLANNED' AND (l.id IS NULL OR l.status::text <> s.status::text))
        OR (l.id IS NOT NULL AND (l."dogId" <> s."dogId" OR l."goalId" <> s."goalId" OR l."trainingId" <> s."trainingId"))
      )`;
      assert.deepEqual(invalid, []);
      // Add user-created data to a demo dog: rerunning must leave it alone too.
      const custom = await prisma.dogNote.create({
        data: {
          id: 'seed-test-manual-note',
          dogId: 'demo-dog-0',
          date: now,
          title: 'Manual note',
          text: 'Keep me',
        },
      });
      const historicalLog = await prisma.workoutLog.findFirstOrThrow({
        where: {
          dogId: 'demo-dog-0',
          status: 'COMPLETED',
          scheduledTrainingId: { not: null },
        },
      });
      await prisma.trainingMessage.create({
        data: {
          id: 'seed-test-manual-message',
          workoutLogId: historicalLog.id,
          authorId: 'demo-user-owner',
          text: 'Do not remove my reply',
        },
      });
      const completedPlan = await prisma.scheduledTraining.update({
        where: { id: 'demo-dog-0-goal-0-scheduled-2' },
        data: { status: 'COMPLETED' },
      });
      await prisma.workoutLog.create({
        data: {
          id: 'seed-test-manual-log',
          dogId: completedPlan.dogId,
          goalId: completedPlan.goalId,
          trainingId: completedPlan.trainingId,
          scheduledTrainingId: completedPlan.id,
          authorId: 'demo-user-owner',
          title: 'Manual completion',
          completedAt: completedPlan.date,
        },
      });
      const withCustom = await counts();
      await seedDemoDatabase(prisma, now);
      assert.deepEqual(await counts(), withCustom, 'no duplicates on repeat');
      await seedDemoDatabase(prisma, new Date(now.getTime() + 7 * 86_400_000));
      assert.deepEqual(
        await counts(),
        withCustom,
        'dates roll forward without growing fixtures',
      );
      assert.equal(
        (
          await prisma.scheduledTraining.findUniqueOrThrow({
            where: { id: today.id },
          })
        ).date
          .toISOString()
          .slice(0, 10),
        '2026-11-15',
      );
      assert.equal(
        (await prisma.dogNote.findUniqueOrThrow({ where: { id: custom.id } }))
          .text,
        'Keep me',
      );
      assert.equal(
        (await prisma.dog.findUniqueOrThrow({ where: { id: sentinelDog.id } }))
          .name,
        'Untouched',
      );
      assert.equal(
        (
          await prisma.trainingMessage.findUniqueOrThrow({
            where: { id: 'seed-test-manual-message' },
          })
        ).text,
        'Do not remove my reply',
      );
      const preservedPlan = await prisma.scheduledTraining.findUniqueOrThrow({
        where: { id: completedPlan.id },
      });
      assert.equal(preservedPlan.status, 'COMPLETED');
      assert.equal(preservedPlan.date.getTime(), completedPlan.date.getTime());
      const previousEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        await assert.rejects(
          seedDemoDatabase(prisma, now),
          /disabled in production/,
        );
      } finally {
        if (previousEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnv;
      }
      console.log(
        'Fixture counts (users, dogs, goals, trainings, steps, schedules, logs, messages, notes, invitations):',
        first,
      );
    } finally {
      await prisma.trainingMessage.deleteMany({
        where: { id: 'seed-test-manual-message' },
      });
      await prisma.workoutLog.deleteMany({
        where: { id: 'seed-test-manual-log' },
      });
      await prisma.dogNote.deleteMany({
        where: { id: 'seed-test-manual-note' },
      });
      await prisma.user.deleteMany({ where: { id: sentinelId } });
      await prisma.$disconnect();
    }
  },
);

test(
  'regular seed adds rich plans and preserves edited terms and custom trainings',
  { timeout: 120_000 },
  async () => {
    const trainerId = 'planning-seed-trainer';
    const ownerId = 'planning-seed-owner';
    const dogId = 'planning-seed-dog';
    try {
      for (const [id, role] of [
        [trainerId, 'trainer'],
        [ownerId, 'user'],
      ]) {
        await prisma.user.create({
          data: {
            id,
            name: id,
            email: `${id}@seed-test.test`,
            emailVerified: true,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      await prisma.dog.create({
        data: { id: dogId, name: 'Rex', color: 1, ownerId },
      });
      const dogs = [
        {
          id: dogId,
          ownerId,
          discipline: 'Poslušnost',
          titles: ['Přivolání', 'Chůze u nohy', 'Odložení'],
        },
      ];
      await seedTrainingPlans(prisma, trainerId, dogs);
      const goals = await prisma.trainingGoal.findMany({
        where: { dogId },
        include: {
          sessions: {
            include: {
              steps: true,
              scheduledTrainings: { include: { workoutLog: true } },
            },
          },
        },
      });
      assert.equal(goals.length, 3);
      const sessions = goals.flatMap((goal) => goal.sessions);
      assert.equal(sessions.length, 12);
      assert.ok(sessions.every((training) => training.steps.length === 3));
      const schedules = sessions.flatMap(
        (training) => training.scheduledTrainings,
      );
      assert.equal(schedules.length, 84);
      assert.ok(schedules.some((training) => training.status === 'PLANNED'));
      assert.ok(schedules.some((training) => training.status === 'SKIPPED'));
      assert.ok(
        schedules
          .filter((training) => training.status !== 'PLANNED')
          .every(
            (training) =>
              training.workoutLog?.scheduledTrainingId === training.id,
          ),
      );
      const planned = schedules.find(
        (training) => training.status === 'PLANNED',
      );
      const moved = new Date('2030-01-15T00:00:00Z');
      await prisma.scheduledTraining.update({
        where: { id: planned.id },
        data: { date: moved },
      });
      const custom = await prisma.scheduledTraining.create({
        data: {
          dogId,
          goalId: planned.goalId,
          trainingId: planned.trainingId,
          date: new Date('2030-02-01T00:00:00Z'),
        },
      });
      const log = schedules.find((training) => training.workoutLog)?.workoutLog;
      await prisma.workoutLog.update({
        where: { id: log.id },
        data: { note: 'User feedback to preserve' },
      });
      await seedTrainingPlans(prisma, trainerId, dogs);
      assert.equal(
        await prisma.scheduledTraining.count({ where: { dogId } }),
        85,
      );
      assert.equal(
        (
          await prisma.scheduledTraining.findUniqueOrThrow({
            where: { id: planned.id },
          })
        ).date.toISOString(),
        moved.toISOString(),
      );
      assert.ok(
        await prisma.scheduledTraining.findUnique({ where: { id: custom.id } }),
      );
      assert.equal(
        (await prisma.workoutLog.findUniqueOrThrow({ where: { id: log.id } }))
          .note,
        'User feedback to preserve',
      );
    } finally {
      await prisma.user.deleteMany({
        where: { id: { in: [ownerId, trainerId] } },
      });
      await prisma.$disconnect();
    }
  },
);

test(
  'complete regular seed works on a database without its legacy training definitions',
  { timeout: 120_000 },
  async () => {
    const auth = {
      api: {
        signUpEmail: async ({ body }) => {
          await prisma.user.create({
            data: {
              id: `regular-test-${body.email}`,
              name: body.name,
              email: body.email,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        },
      },
    };
    try {
      await seedDatabase(prisma, {}, auth);
      const countFixtures = () =>
        Promise.all([
          prisma.trainingGoal.count({
            where: { id: { startsWith: 'seed-dog-' } },
          }),
          prisma.goalTraining.count({
            where: { id: { startsWith: 'seed-dog-' } },
          }),
          prisma.scheduledTraining.count({
            where: { id: { startsWith: 'seed-dog-' } },
          }),
        ]);
      assert.deepEqual(await countFixtures(), [12, 48, 336]);
      const trainer = await prisma.user.findUniqueOrThrow({
        where: { email: 'trener@trainloop.cz' },
      });
      assert.equal(
        await prisma.dog.count({ where: { ownerId: trainer.id } }),
        0,
      );
      assert.equal(
        await prisma.dogShare.count({ where: { trainerId: trainer.id } }),
        4,
      );
      await seedDatabase(prisma, {}, auth);
      assert.deepEqual(await countFixtures(), [12, 48, 336]);
    } finally {
      await prisma.$disconnect();
    }
  },
);
