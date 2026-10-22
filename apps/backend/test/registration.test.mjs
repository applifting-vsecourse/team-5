import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

// Exercise the real BetterAuth HTTP boundary, validation, hashing and cookies.
// An isolated in-memory database avoids touching anyone's development data.
function setup() {
  const database = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    ...betterAuthCoreConfig,
    database: memoryAdapter(database),
    baseURL: 'http://localhost:4050',
    secret: 'registration-test-secret-with-at-least-32-characters',
    trustedOrigins: ['http://localhost:3050'],
    rateLimit: { enabled: false },
    logger: { level: 'error' },
  });
  const signup = (overrides = {}) =>
    auth.handler(
      new Request('http://localhost:4050/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3050',
        },
        body: JSON.stringify({
          name: '  Jana Nováková  ',
          email: 'jana@example.com',
          password: ' space password ',
          privacyConsent: true,
          ...overrides,
        }),
      }),
    );
  return { auth, database, signup };
}

test('registration without an invitation or username creates an ordinary account and a working session', async () => {
  const { auth, database, signup } = setup();
  const response = await signup({ role: 'admin' });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.user.name, 'Jana Nováková');
  assert.equal(result.user.role, 'user');
  assert.ok(result.token);
  assert.equal(database.user.length, 1);
  assert.equal(database.account.length, 1);
  assert.notEqual(database.account[0].password, ' space password ');
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  assert.ok(cookie.includes('session_token='));
  const session = await auth.handler(
    new Request('http://localhost:4050/api/auth/get-session', {
      headers: { Cookie: cookie },
    }),
  );
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.email, 'jana@example.com');
  const signIn = await auth.api.signInEmail({
    body: { email: 'jana@example.com', password: ' space password ' },
  });
  assert.equal(signIn.user.id, result.user.id);
});

for (const privacyConsent of [undefined, false, 'true', 'false', 1]) {
  test(`API rejects missing or non-boolean consent: ${String(privacyConsent)}`, async () => {
    const { database, signup } = setup();
    const response = await signup({ privacyConsent });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'PRIVACY_CONSENT_REQUIRED');
    assert.equal(database.user.length, 0);
    assert.equal(database.session.length, 0);
  });
}

test('API rejects whitespace-only names', async () => {
  const { database, signup } = setup();
  const response = await signup({ name: '   ' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'NAME_REQUIRED');
  assert.equal(database.user.length, 0);
});

test('API rejects invalid email and short passwords', async () => {
  const { database, signup } = setup();
  assert.equal((await signup({ email: 'not-an-email' })).status, 400);
  const shortPassword = await signup({ password: '1234567' });
  assert.equal(shortPassword.status, 400);
  assert.equal((await shortPassword.json()).code, 'PASSWORD_TOO_SHORT');
  assert.equal(database.user.length, 0);
});

test('API accepts the minimum eight-character password', async () => {
  const { signup } = setup();
  assert.equal((await signup({ password: '12345678' })).status, 200);
});

test('duplicate email returns a recognizable error without creating another account', async () => {
  const { database, signup } = setup();
  assert.equal((await signup()).status, 200);
  const duplicate = await signup({ email: 'JANA@example.com' });
  assert.equal(duplicate.status, 422);
  assert.equal(
    (await duplicate.json()).code,
    'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
  );
  assert.equal(database.user.length, 1);
});
