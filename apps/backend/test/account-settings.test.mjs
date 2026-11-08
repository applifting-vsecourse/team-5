import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

async function setup() {
  const database = { user: [], session: [], account: [], verification: [] };
  const emails = [];
  const auth = betterAuth({
    ...betterAuthCoreConfig,
    database: memoryAdapter(database),
    baseURL: 'http://localhost:4050',
    secret: 'account-settings-test-secret-at-least-32-characters',
    trustedOrigins: ['http://localhost:3050'],
    rateLimit: { enabled: false },
    logger: { level: 'error' },
    emailVerification: {
      sendVerificationEmail: async (email) => {
        emails.push(email);
      },
    },
  });
  let cookie = '';
  async function post(path, body) {
    const response = await auth.handler(
      new Request(`http://localhost:4050/api/auth/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3050',
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      }),
    );
    const nextCookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    if (nextCookie) cookie = nextCookie;
    return response;
  }
  assert.equal(
    (
      await post('sign-up/email', {
        name: 'Jana',
        email: 'jana@example.com',
        password: ' password123 ',
        privacyConsent: true,
      })
    ).status,
    200,
  );
  return { auth, database, emails, post };
}

test('profile changes validate names, trim them and cannot change a server-owned role', async () => {
  const { database, post } = await setup();
  assert.equal((await post('update-user', { name: '   ' })).status, 400);
  assert.equal(
    (await post('update-user', { name: 'a'.repeat(101) })).status,
    400,
  );
  assert.equal((await post('update-user', { role: 'trainer' })).status, 400);
  assert.equal(
    (await post('update-user', { name: '  Jana Nová  ' })).status,
    200,
  );
  assert.equal(database.user[0].name, 'Jana Nová');
  assert.equal(database.user[0].role, 'user');
});

test('changing email requires confirmation at the new address and preserves the current login until confirmed', async () => {
  const { database, emails, post } = await setup();
  assert.equal(
    (
      await post('change-email', {
        newEmail: 'new@example.com',
        callbackURL: 'http://localhost:3050/account',
      })
    ).status,
    200,
  );
  assert.equal(database.user[0].email, 'jana@example.com');
  assert.equal(emails.length, 1);
  assert.equal(emails[0].user.email, 'new@example.com');
  assert.match(emails[0].url, /verify-email/);
});

test('changing password checks the current password and accepts surrounding spaces', async () => {
  const { post } = await setup();
  assert.equal(
    (
      await post('change-password', {
        currentPassword: 'wrong',
        newPassword: ' next password ',
        revokeOtherSessions: true,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await post('change-password', {
        currentPassword: ' password123 ',
        newPassword: ' next password ',
        revokeOtherSessions: true,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await post('sign-in/email', {
        email: 'jana@example.com',
        password: ' next password ',
      })
    ).status,
    200,
  );
});
