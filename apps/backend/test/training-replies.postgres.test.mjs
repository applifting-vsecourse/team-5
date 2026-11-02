import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

const require = createRequire(import.meta.url);
require('tsconfig-paths').register({
  baseUrl: fileURLToPath(new URL('../dist/', import.meta.url)),
  paths: { '@/*': ['*'] },
});
const { Test } = require('@nestjs/testing');
const {
  TrainingReplyRepository,
} = require('../dist/modules/dog/repositories/training-reply.repository.js');
const {
  PlanBlockRepository,
} = require('../dist/modules/dog/repositories/plan-block.repository.js');
const {
  GoalRepository,
} = require('../dist/modules/dog/repositories/goal.repository.js');
const {
  TrainingRepliesController,
} = require('../dist/modules/dog/controllers/training-replies.controller.js');
const { PrismaService } = require('../dist/core/prisma/prisma.service.js');

const connectionString = process.env.AUTH_TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Set AUTH_TEST_DATABASE_URL to an isolated, migrated PostgreSQL test database.',
  );

test('unread replies: authenticated HTTP, per-recipient snapshots, plan edits and deletion', async (t) => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const auth = betterAuth({
    ...betterAuthCoreConfig,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    baseURL: 'http://localhost:4050',
    secret: 'training-replies-test-secret-at-least-32-characters',
    trustedOrigins: ['http://localhost:3050'],
    rateLimit: { enabled: false },
    logger: { level: 'error' },
  });
  const users = [];
  const register = async (isTrainer = false) => {
    const response = await auth.handler(
      new Request('http://localhost:4050/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3050',
        },
        body: JSON.stringify({
          name: isTrainer ? 'Trainer' : 'Owner',
          email: `${randomUUID()}@example.com`,
          password: 'password-for-tests',
          privacyConsent: true,
          isTrainer,
        }),
      }),
    );
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    users.push(data.user.id);
    return {
      ...data.user,
      cookie: response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
    };
  };
  const module = await Test.createTestingModule({
    controllers: [TrainingRepliesController],
    providers: [
      TrainingReplyRepository,
      { provide: PrismaService, useValue: prisma },
      { provide: 'BetterAuth', useValue: auth },
    ],
  }).compile();
  const app = module.createNestApplication({ logger: false });
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const request = (user, path, body) =>
    fetch(`${base}/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(user && { Cookie: user.cookie }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  const json = async (user, path, body) => {
    const response = await request(user, path, body);
    assert.ok(
      response.ok,
      `${response.status}: ${await response.clone().text()}`,
    );
    return response.json();
  };
  const read = async (user, replyIds) => {
    const response = await request(user, 'training-replies/read', { replyIds });
    assert.equal(response.status, 204);
  };
  const repo = new TrainingReplyRepository(prisma);
  const plans = new PlanBlockRepository(prisma);
  const goals = new GoalRepository(prisma);
  try {
    const owner = await register();
    const trainer = await register(true);
    const trainer2 = await register(true);
    // Admins can manage clients as trainers too (TrainerRoleGuard).
    await prisma.user.update({
      where: { id: trainer2.id },
      data: { role: 'admin' },
    });
    const stranger = await register();
    const dog = await prisma.dog.create({
      data: { name: 'Rex', color: 1, ownerId: owner.id },
    });
    await prisma.dogShare.createMany({
      data: [trainer, trainer2].map((user) => ({
        dogId: dog.id,
        trainerId: user.id,
      })),
    });
    const goal = await prisma.trainingGoal.create({
      data: { dogId: dog.id, createdById: trainer.id, title: 'Chůze' },
    });
    const log = await prisma.workoutLog.create({
      data: {
        dogId: dog.id,
        goalId: goal.id,
        authorId: owner.id,
        title: 'Včerejší trénink',
      },
    });
    const oldLog = await prisma.workoutLog.create({
      data: {
        dogId: dog.id,
        goalId: goal.id,
        authorId: owner.id,
        title: 'Starší trénink',
      },
    });
    const training = await prisma.scheduledTraining.create({
      data: {
        dogId: dog.id,
        goalId: goal.id,
        createdById: owner.id,
        date: new Date('2026-10-24'),
      },
    });
    const path = `dogs/${dog.id}/activities/${log.id}`;
    const context = { actorId: trainer.id, replyToActivityId: log.id };
    const unread = (user) => json(user, 'training-replies');

    await t.test(
      'requires a session and rejects foreign records and invalid messages',
      async () => {
        for (const target of [
          'training-replies',
          path,
          `trainings/${training.id}/reply`,
        ])
          assert.equal((await request(null, target)).status, 401);
        assert.equal((await request(stranger, path)).status, 404);
        assert.equal(
          (await request(stranger, `${path}/messages`, { text: 'Forbidden' }))
            .status,
          404,
        );
        assert.equal(
          (
            await request(owner, `dogs/wrong/activities/${log.id}/messages`, {
              text: 'Wrong dog',
            })
          ).status,
          404,
        );
        for (const body of [
          { text: '   ' },
          { text: 'x'.repeat(2001) },
          { text: 'Hello', authorId: trainer.id },
        ])
          assert.equal(
            (await request(owner, `${path}/messages`, body)).status,
            400,
          );
        assert.equal(
          (await request(owner, 'training-replies/read', { replyIds: 'all' }))
            .status,
          400,
        );
      },
    );

    await t.test(
      'owner messages notify each shared trainer, and reading does not acknowledge for anyone else',
      async () => {
        const message = await json(owner, `${path}/messages`, {
          text: '  Jak dál?  ',
        });
        assert.equal(message.text, 'Jak dál?');
        assert.equal(message.author.id, owner.id);
        assert.equal((await unread(owner)).length, 0);
        const first = await unread(trainer);
        assert.equal(first.length, 1);
        assert.equal((await unread(trainer2)).length, 1);
        await read(
          stranger,
          first.map((reply) => reply.id),
        );
        assert.equal((await unread(trainer)).length, 1);
        const detail = await json(trainer, path);
        await read(trainer, detail.unreadReplyIds);
        assert.equal((await unread(trainer)).length, 0);
        assert.equal((await unread(trainer2)).length, 1);
      },
    );

    await t.test(
      'late messages survive stale and repeated acknowledgements across requests',
      async () => {
        await json(trainer, `${path}/messages`, { text: 'První odpověď' });
        const snapshot = await json(owner, path);
        const later = await json(trainer, `${path}/messages`, {
          text: 'Novější odpověď',
        });
        await read(owner, snapshot.unreadReplyIds);
        await read(owner, snapshot.unreadReplyIds);
        const pending = await unread(owner);
        assert.equal(pending.length, 1);
        const detail = await json(owner, path);
        assert.ok(detail.messages.some((message) => message.id === later.id));
        assert.deepEqual(
          detail.unreadReplyIds,
          pending.map((reply) => reply.id),
        );
        await read(owner, detail.unreadReplyIds);
        assert.equal((await unread(owner)).length, 0);
      },
    );

    let block;
    await t.test(
      'plan additions, updates, reorders and deletion notify only the source record and upcoming training',
      async () => {
        block = await plans.createBlock(
          {
            goalId: goal.id,
            title: 'Sedni',
            instruction: null,
            criterion: null,
          },
          context,
        );
        let pending = await unread(owner);
        assert.equal(pending.length, 1);
        assert.equal(pending[0].workoutLog.id, log.id);
        assert.equal(pending[0].scheduledTraining.id, training.id);
        assert.equal(pending[0].kind, 'PLAN_CHANGED');
        assert.equal(
          (await repo.getRecord(owner.id, dog.id, oldLog.id)).unreadReplyIds
            .length,
          0,
        );
        const record = await json(owner, path);
        assert.equal(record.planChanged, true);
        assert.equal(record.goal.blocks[0].title, 'Sedni');
        await read(owner, record.unreadReplyIds);
        const second = await plans.createBlock(
          {
            goalId: goal.id,
            title: 'Lehni',
            instruction: null,
            criterion: null,
          },
          context,
        );
        await plans.updateBlock(block.id, { instruction: 'Odměnit' }, context);
        await plans.reorderBlocks(goal.id, [second.id, block.id], context);
        await plans.deleteBlock(second.id, goal.id, context);
        await goals.updateGoal(goal.id, { principle: 'Krátké kroky' }, context);
        pending = await unread(owner);
        assert.equal(pending.length, 5);
        const plan = await json(owner, `trainings/${training.id}/reply`);
        assert.equal(plan.goal.principle, 'Krátké kroky');
        await read(owner, plan.unreadReplyIds);
        assert.equal((await unread(owner)).length, 0);
      },
    );

    await t.test(
      'own edits and no-op saves do not create replies; wrong source rolls back the edit',
      async () => {
        await plans.updateBlock(block.id, { instruction: 'Odměnit' }, context);
        await plans.reorderBlocks(goal.id, [block.id], context);
        await goals.updateGoal(goal.id, { principle: 'Krátké kroky' }, context);
        await plans.updateBlock(
          block.id,
          { title: 'Moje změna' },
          { actorId: owner.id },
        );
        assert.equal((await unread(owner)).length, 0);
        await assert.rejects(
          plans.updateBlock(
            block.id,
            { title: 'Invalid change' },
            { ...context, replyToActivityId: 'missing' },
          ),
        );
        assert.equal(
          (
            await prisma.planBlock.findUniqueOrThrow({
              where: { id: block.id },
            })
          ).title,
          'Moje změna',
        );
        assert.equal((await unread(owner)).length, 0);
        await plans.updateBlock(
          block.id,
          { title: 'Nový plán' },
          { actorId: trainer.id },
        );
        const pending = await unread(owner);
        assert.equal(pending.length, 1);
        assert.equal(pending[0].workoutLog, null);
        assert.equal(pending[0].scheduledTraining.id, training.id);
        await read(
          owner,
          pending.map((reply) => reply.id),
        );
      },
    );

    await t.test(
      'newly revoked access immediately hides old replies and rejects reading or sending',
      async () => {
        assert.equal((await unread(trainer2)).length, 1);
        await prisma.dogShare.deleteMany({ where: { trainerId: trainer2.id } });
        assert.equal((await unread(trainer2)).length, 0);
        assert.equal((await request(trainer2, path)).status, 404);
        assert.equal(
          (await request(trainer2, `${path}/messages`, { text: 'No access' }))
            .status,
          404,
        );
        await prisma.dog.update({
          where: { id: dog.id },
          data: { isArchived: true },
        });
        assert.equal((await request(owner, path)).status, 404);
        await prisma.dog.update({
          where: { id: dog.id },
          data: { isArchived: false },
        });
      },
    );

    await t.test(
      'deleting a trainer preserves an unread reply and anonymizes the message; deleting the owner removes all replies',
      async () => {
        await json(trainer, `${path}/messages`, { text: 'Poslední rada' });
        await prisma.user.delete({ where: { id: trainer.id } });
        assert.equal((await unread(owner)).length, 1);
        const record = await json(owner, path);
        assert.equal(record.messages.at(-1).author.name, 'smazaný uživatel');
        assert.equal(record.messages.at(-1).author.id, null);
        await prisma.user.delete({ where: { id: owner.id } });
        assert.equal(
          await prisma.trainingReply.count({ where: { workoutLogId: log.id } }),
          0,
        );
      },
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await app.close();
    await prisma.$disconnect();
  }
});
