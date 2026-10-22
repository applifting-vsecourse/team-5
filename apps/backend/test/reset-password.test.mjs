import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

function setup() {
  const database = { user: [], session: [], account: [], verification: [] };
  let sentEmail = null;
  const createAuth = () =>
    betterAuth({
      ...betterAuthCoreConfig,
      emailAndPassword: {
        ...betterAuthCoreConfig.emailAndPassword,
        sendResetPassword: async ({ user, token }) => {
          sentEmail = { user, token };
        },
      },
      database: memoryAdapter(database),
      baseURL: 'http://localhost:4050',
      trustedOrigins: ['http://localhost:3050'],
      secret: 'login-test-secret-with-at-least-32-characters',
      rateLimit: { enabled: false },
      logger: { disabled: true },
    });
  const auth = createAuth();
  const post = (path, body, cookie) =>
    auth.handler(
      new Request(`http://localhost:4050/api/auth/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3050',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  const get = (path, cookie) =>
    auth.handler(
      new Request(`http://localhost:4050/api/auth/${path}`, {
        method: 'GET',
        headers: {
          Origin: 'http://localhost:3050',
          ...(cookie ? { Cookie: cookie } : {}),
        },
      }),
    );
  const signup = () =>
    post('sign-up/email', {
      name: 'Pavel',
      email: 'pavel@example.com',
      password: 'password123',
      privacyConsent: true,
      isTrainer: false,
    });
  return { auth, database, post, get, signup, getSentEmail: () => sentEmail };
}

function cookies(response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

test('verifies reset-password token validity', async () => {
  const { post, get, signup, getSentEmail } = setup();
  await signup();

  // Nonexistent or empty token is invalid
  const emptyCheck = await get('verify-reset-password-token');
  assert.equal(emptyCheck.status, 200);
  assert.deepEqual(await emptyCheck.json(), { valid: false });

  const randomCheck = await get('verify-reset-password-token?token=nonexistent');
  assert.equal(randomCheck.status, 200);
  assert.deepEqual(await randomCheck.json(), { valid: false });

  // Request password reset
  const requestRes = await post('request-password-reset', {
    email: 'pavel@example.com',
  });
  assert.equal(requestRes.status, 200);
  const token = getSentEmail().token;
  assert.ok(token);

  // Now the token is valid
  const validCheck = await get(`verify-reset-password-token?token=${token}`);
  assert.equal(validCheck.status, 200);
  assert.deepEqual(await validCheck.json(), { valid: true });
});

test('resets password, creates session cookie, and invalidates token', async () => {
  const { post, get, signup, getSentEmail } = setup();
  await signup();

  await post('request-password-reset', {
    email: 'pavel@example.com',
  });
  const token = getSentEmail().token;

  // Reset password
  const resetRes = await post('reset-password', {
    token,
    newPassword: 'new-secure-password',
  });
  assert.equal(resetRes.status, 200);

  // Should have returned session and set session cookie
  const sessionCookie = resetRes.headers
    .getSetCookie()
    .find((cookie) => cookie.includes('session_token='));
  assert.ok(sessionCookie, 'session_token cookie should be set after reset');

  // Token is now consumed and invalid
  const reCheck = await get(`verify-reset-password-token?token=${token}`);
  assert.deepEqual(await reCheck.json(), { valid: false });

  // Cannot reuse token
  const reuseRes = await post('reset-password', {
    token,
    newPassword: 'another-password',
  });
  assert.equal(reuseRes.status, 400);

  // Old password no longer works
  const oldLogin = await post('sign-in/email', {
    email: 'pavel@example.com',
    password: 'password123',
  });
  assert.equal(oldLogin.status, 401);

  // New password works
  const newLogin = await post('sign-in/email', {
    email: 'pavel@example.com',
    password: 'new-secure-password',
  });
  assert.equal(newLogin.status, 200);
});

