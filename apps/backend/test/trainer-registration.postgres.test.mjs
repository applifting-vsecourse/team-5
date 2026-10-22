import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

const connectionString = process.env.AUTH_TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'Set AUTH_TEST_DATABASE_URL to an isolated, migrated PostgreSQL test database.',
  );
}

test('Prisma persists owner and trainer roles across fresh authentication sessions', async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const userIds = [];
  const createAuth = () =>
    betterAuth({
      ...betterAuthCoreConfig,
      database: prismaAdapter(prisma, { provider: 'postgresql' }),
      baseURL: 'http://localhost:4050',
      secret: 'registration-test-secret-with-at-least-32-characters',
      trustedOrigins: ['http://localhost:3050'],
      rateLimit: { enabled: false },
    });
  try {
    for (const isTrainer of [false, true]) {
      const email = `registration-${randomUUID()}@example.com`;
      const response = await createAuth().handler(
        new Request('http://localhost:4050/api/auth/sign-up/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3050',
          },
          body: JSON.stringify({
            name: 'Registration test',
            email,
            password: 'password123',
            privacyConsent: true,
            isTrainer,
          }),
        }),
      );
      const result = await response.json();
      assert.equal(response.status, 200, JSON.stringify(result));
      userIds.push(result.user.id);
      const expectedRole = isTrainer ? 'trainer' : 'user';
      const storedUser = await prisma.user.findUniqueOrThrow({
        where: { id: result.user.id },
      });
      assert.equal(storedUser.role, expectedRole);

      const auth = createAuth();
      const login = await auth.api.signInEmail({
        body: { email, password: 'password123' },
        asResponse: true,
      });
      assert.equal(login.status, 200);
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
      const session = await auth.handler(
        new Request('http://localhost:4050/api/auth/get-session', {
          headers: { Cookie: cookie },
        }),
      );
      assert.equal(session.status, 200);
      assert.equal((await session.json()).user.role, expectedRole);

      const update = await auth.handler(
        new Request('http://localhost:4050/api/auth/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3050',
            Cookie: cookie,
          },
          body: JSON.stringify({
            name: 'Updated registration test',
            isTrainer: !isTrainer,
          }),
        }),
      );
      assert.equal(update.status, 200);
      assert.equal(
        (await prisma.user.findUniqueOrThrow({ where: { id: result.user.id } }))
          .role,
        expectedRole,
      );
    }
  } finally {
    // Delete only users created by this run; relations cascade in the schema.
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
});
