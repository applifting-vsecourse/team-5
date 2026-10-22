import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

const connectionString = process.env.AUTH_TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Set AUTH_TEST_DATABASE_URL to an isolated, migrated PostgreSQL test database.',
  );

for (const deletedRole of ['owner', 'trainer']) {
  test(`${deletedRole} account deletion applies the complete data lifecycle in PostgreSQL`, async () => {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
    const userIds = [];
    const auth = betterAuth({
      ...betterAuthCoreConfig,
      database: prismaAdapter(prisma, { provider: 'postgresql' }),
      baseURL: 'http://localhost:4050',
      secret: 'deletion-test-secret-with-at-least-32-characters',
      trustedOrigins: ['http://localhost:3050'],
      rateLimit: { enabled: false },
      logger: { level: 'error' },
    });
    const request = (path, body, cookie) =>
      auth.handler(
        new Request(`http://localhost:4050/api/auth${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3050',
            ...(cookie && { Cookie: cookie }),
          },
          body: JSON.stringify(body),
        }),
      );
    async function register(isTrainer) {
      const response = await request('/sign-up/email', {
        name: isTrainer ? 'Trainer' : 'Owner',
        email: `${randomUUID()}@example.com`,
        password: ' space password ',
        privacyConsent: true,
        isTrainer,
      });
      const result = await response.json();
      assert.equal(response.status, 200, JSON.stringify(result));
      userIds.push(result.user.id);
      return {
        ...result.user,
        cookie: response.headers
          .getSetCookie()
          .map((value) => value.split(';')[0])
          .join('; '),
      };
    }
    async function createDogData(ownerId, trainerId) {
      const dog = await prisma.dog.create({
        data: { name: 'Test dog', color: 1, ownerId },
      });
      const goal = await prisma.trainingGoal.create({
        data: { dogId: dog.id, createdById: trainerId, title: 'Trainer goal' },
      });
      const block = await prisma.planBlock.create({
        data: {
          goalId: goal.id,
          position: 0,
          title: 'Exercise',
          instruction: 'Instruction',
        },
      });
      const training = await prisma.scheduledTraining.create({
        data: {
          dogId: dog.id,
          goalId: goal.id,
          createdById: trainerId,
          date: new Date('2026-10-22'),
        },
      });
      const log = await prisma.workoutLog.create({
        data: {
          dogId: dog.id,
          goalId: goal.id,
          authorId: trainerId,
          title: 'Workout',
          note: 'Workout note',
        },
      });
      const note = await prisma.dogNote.create({
        data: { dogId: dog.id, text: 'Private diary note' },
      });
      const trainerMessage = await prisma.trainingMessage.create({
        data: {
          workoutLogId: log.id,
          authorId: trainerId,
          text: 'Trainer reply',
        },
      });
      const ownerMessage = await prisma.trainingMessage.create({
        data: {
          workoutLogId: log.id,
          authorId: ownerId,
          text: 'Owner question',
        },
      });
      return {
        dog,
        goal,
        block,
        training,
        log,
        note,
        trainerMessage,
        ownerMessage,
      };
    }
    async function assertDogRemoved(data) {
      for (const [model, id] of [
        ['dog', data.dog.id],
        ['trainingGoal', data.goal.id],
        ['planBlock', data.block.id],
        ['scheduledTraining', data.training.id],
        ['workoutLog', data.log.id],
        ['dogNote', data.note.id],
        ['trainingMessage', data.trainerMessage.id],
        ['trainingMessage', data.ownerMessage.id],
      ])
        assert.equal(
          await prisma[model].findUnique({ where: { id } }),
          null,
          model,
        );
    }
    try {
      const owner = await register(false);
      const otherOwner = await register(false);
      const trainer = await register(true);
      const otherTrainer = await register(true);
      const ownerData = await createDogData(owner.id, trainer.id);
      const otherData = await createDogData(otherOwner.id, trainer.id);
      const trainerData = await createDogData(trainer.id, trainer.id);
      for (const clientId of [owner.id, otherOwner.id]) {
        await prisma.clientConnection.create({
          data: { clientId, trainerId: trainer.id },
        });
      }
      await prisma.dogShare.createMany({
        data: [ownerData, otherData].map((data) => ({
          dogId: data.dog.id,
          trainerId: trainer.id,
        })),
      });
      const unaffectedConnection = await prisma.clientConnection.create({
        data: { clientId: otherOwner.id, trainerId: otherTrainer.id },
      });
      const unaffectedShare = await prisma.dogShare.create({
        data: { dogId: otherData.dog.id, trainerId: otherTrainer.id },
      });
      const unaffectedMessage = await prisma.trainingMessage.create({
        data: {
          workoutLogId: otherData.log.id,
          authorId: otherTrainer.id,
          text: 'Another trainer',
        },
      });
      const invitation = await prisma.invitation.create({
        data: {
          trainerId: trainer.id,
          code: randomUUID().slice(0, 6),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const target = deletedRole === 'owner' ? owner : trainer;
      const secondLogin = await request('/sign-in/email', {
        email: target.email,
        password: ' space password ',
      });
      const secondCookie = secondLogin.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');

      // A wrong password leaves both auth and domain data untouched.
      assert.equal(
        (await request('/delete-user', { password: 'wrong' }, target.cookie))
          .status,
        400,
      );
      assert.ok(await prisma.user.findUnique({ where: { id: target.id } }));
      assert.ok(
        await prisma.dog.findUnique({ where: { id: ownerData.dog.id } }),
      );
      assert.equal(
        await prisma.clientConnection.count({
          where: { trainerId: trainer.id },
        }),
        2,
      );

      const response = await request(
        '/delete-user',
        { password: ' space password ' },
        target.cookie,
      );
      assert.equal(response.status, 200, await response.text());
      assert.equal(
        await prisma.user.findUnique({ where: { id: target.id } }),
        null,
      );
      assert.equal(
        await prisma.account.count({ where: { userId: target.id } }),
        0,
      );
      assert.equal(
        await prisma.session.count({ where: { userId: target.id } }),
        0,
      );
      for (const cookie of [target.cookie, secondCookie]) {
        const session = await auth.handler(
          new Request('http://localhost:4050/api/auth/get-session', {
            headers: { Cookie: cookie },
          }),
        );
        assert.equal(await session.json(), null);
      }

      if (deletedRole === 'owner') {
        await assertDogRemoved(ownerData);
        assert.equal(
          await prisma.clientConnection.count({
            where: { clientId: owner.id },
          }),
          0,
        );
        assert.equal(
          await prisma.dogShare.count({ where: { dogId: ownerData.dog.id } }),
          0,
        );
        assert.ok(await prisma.user.findUnique({ where: { id: trainer.id } }));
        assert.ok(
          await prisma.invitation.findUnique({ where: { id: invitation.id } }),
        );
        assert.ok(
          await prisma.trainingMessage.findUnique({
            where: { id: otherData.trainerMessage.id },
          }),
        );
      } else {
        await assertDogRemoved(trainerData);
        assert.equal(
          await prisma.clientConnection.count({
            where: { trainerId: trainer.id },
          }),
          0,
        );
        assert.equal(
          await prisma.dogShare.count({ where: { trainerId: trainer.id } }),
          0,
        );
        assert.equal(
          await prisma.invitation.count({ where: { trainerId: trainer.id } }),
          0,
        );
        for (const data of [ownerData, otherData]) {
          assert.ok(
            await prisma.dog.findUnique({ where: { id: data.dog.id } }),
          );
          assert.ok(
            await prisma.dogNote.findUnique({ where: { id: data.note.id } }),
          );
          assert.ok(
            await prisma.planBlock.findUnique({ where: { id: data.block.id } }),
          );
          assert.equal(
            (
              await prisma.trainingGoal.findUniqueOrThrow({
                where: { id: data.goal.id },
              })
            ).createdById,
            null,
          );
          assert.equal(
            (
              await prisma.scheduledTraining.findUniqueOrThrow({
                where: { id: data.training.id },
              })
            ).createdById,
            null,
          );
          assert.equal(
            (
              await prisma.workoutLog.findUniqueOrThrow({
                where: { id: data.log.id },
              })
            ).authorId,
            null,
          );
          const message = await prisma.trainingMessage.findUniqueOrThrow({
            where: { id: data.trainerMessage.id },
            include: { author: true },
          });
          assert.equal(message.authorId, null);
          assert.equal(message.author, null);
          assert.equal(message.text, 'Trainer reply');
          assert.ok(
            (
              await prisma.trainingMessage.findUniqueOrThrow({
                where: { id: data.ownerMessage.id },
              })
            ).authorId,
          );
        }
      }
      assert.ok(
        await prisma.clientConnection.findUnique({
          where: { id: unaffectedConnection.id },
        }),
      );
      assert.ok(
        await prisma.dogShare.findUnique({ where: { id: unaffectedShare.id } }),
      );
      assert.equal(
        (
          await prisma.trainingMessage.findUniqueOrThrow({
            where: { id: unaffectedMessage.id },
          })
        ).authorId,
        otherTrainer.id,
      );
    } finally {
      // Only this run's generated accounts and their dependent data are removed.
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.$disconnect();
    }
  });
}
