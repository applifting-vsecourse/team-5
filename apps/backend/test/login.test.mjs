import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

function setup() {
  const database = { user: [], session: [], account: [], verification: [] };
  const createAuth = () =>
    betterAuth({
      ...betterAuthCoreConfig,
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
  const signup = (isTrainer = false) =>
    post('sign-up/email', {
      name: 'Jana',
      email: 'jana@example.com',
      password: ' space password ',
      privacyConsent: true,
      isTrainer,
    });
  return { auth, database, createAuth, post, signup };
}

function cookies(response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function getSession(auth, cookie) {
  return auth.handler(
    new Request('http://localhost:4050/api/auth/get-session', {
      headers: cookie ? { Cookie: cookie } : {},
    }),
  );
}

test('wrong password and nonexistent email return the same generic response', async () => {
  const { post, signup, database } = setup();
  assert.equal((await signup()).status, 200);
  const countBefore = database.session.length;
  const wrongPassword = await post('sign-in/email', {
    email: 'jana@example.com',
    password: 'incorrect',
    rememberMe: true,
  });
  const unknownEmail = await post('sign-in/email', {
    email: 'unknown@example.com',
    password: 'incorrect',
    rememberMe: true,
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  const error = await wrongPassword.json();
  assert.equal(error.code, 'INVALID_EMAIL_OR_PASSWORD');
  assert.deepEqual(await unknownEmail.json(), error);
  assert.equal(database.session.length, countBefore);
});

for (const isTrainer of [false, true]) {
  test(`persistent login and logout for ${isTrainer ? 'trainer' : 'owner'}`, async () => {
    const { auth, createAuth, post, signup } = setup();
    const registration = await signup(isTrainer);
    assert.equal(registration.status, 200);
    const firstDeviceCookie = cookies(registration);
    const login = await post('sign-in/email', {
      email: 'jana@example.com',
      password: ' space password ',
      rememberMe: true,
    });
    assert.equal(login.status, 200);
    const sessionCookie = login.headers
      .getSetCookie()
      .find((cookie) => cookie.includes('session_token='));
    assert.ok(sessionCookie);
    assert.match(sessionCookie, /Max-Age=[1-9]\d*/i);
    assert.match(sessionCookie, /HttpOnly/i);
    const cookie = cookies(login);

    // A reopened browser has no JS/query cache; its persistent cookie restores the session.
    const session = await getSession(createAuth(), cookie);
    assert.equal(session.status, 200);
    assert.equal(
      (await session.json()).user.role,
      isTrainer ? 'trainer' : 'user',
    );
    assert.equal(await (await getSession(auth)).json(), null);

    const logout = await post('sign-out', {}, cookie);
    assert.equal(logout.status, 200);
    assert.ok(
      logout.headers
        .getSetCookie()
        .some(
          (value) =>
            value.includes('session_token=') && /Max-Age=0/i.test(value),
        ),
    );
    // Even a retained copy of the old cookie must no longer authenticate.
    assert.equal(await (await getSession(createAuth(), cookie)).json(), null);
    const otherDevice = await (
      await getSession(auth, firstDeviceCookie)
    ).json();
    assert.equal(otherDevice.user.email, 'jana@example.com');
  });
}
