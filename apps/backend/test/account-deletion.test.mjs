import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuthCoreConfig } from '../dist/shared/auth/config/better-auth.config.js';

async function setup(isTrainer = false) {
  const database = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    ...betterAuthCoreConfig,
    database: memoryAdapter(database),
    baseURL: 'http://localhost:4050',
    secret: 'deletion-test-secret-with-at-least-32-characters',
    trustedOrigins: ['http://localhost:3050'],
    rateLimit: { enabled: false },
    logger: { level: 'error' },
  });
  const request = (path, body, cookie, origin = 'http://localhost:3050') =>
    auth.handler(
      new Request(`http://localhost:4050/api/auth${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          ...(cookie && { Cookie: cookie }),
        },
        body: JSON.stringify(body),
      }),
    );
  const signup = await request('/sign-up/email', {
    name: 'Jana',
    email: 'jana@example.com',
    password: ' space password ',
    privacyConsent: true,
    isTrainer,
  });
  assert.equal(signup.status, 200);
  const cookies = (response) =>
    response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
  const cookie = cookies(signup);
  const login = await request('/sign-in/email', {
    email: 'jana@example.com',
    password: ' space password ',
  });
  assert.equal(login.status, 200);
  return { auth, database, request, cookie, otherCookie: cookies(login) };
}

for (const isTrainer of [false, true]) {
  test(`password-confirmed deletion removes ${isTrainer ? 'trainer' : 'owner'} credentials and all sessions`, async () => {
    const { auth, database, request, cookie, otherCookie } =
      await setup(isTrainer);
    assert.equal(database.session.length, 2);
    const response = await request(
      '/delete-user',
      { password: ' space password ' },
      cookie,
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
    assert.equal(database.user.length, 0);
    assert.equal(database.account.length, 0);
    assert.equal(database.session.length, 0);
    assert.ok(
      response.headers
        .getSetCookie()
        .some((value) => value.includes('Max-Age=0')),
    );
    for (const oldCookie of [cookie, otherCookie]) {
      const session = await auth.handler(
        new Request('http://localhost:4050/api/auth/get-session', {
          headers: { Cookie: oldCookie },
        }),
      );
      assert.equal(await session.json(), null);
    }
    assert.equal(
      (
        await request('/sign-in/email', {
          email: 'jana@example.com',
          password: ' space password ',
        })
      ).status,
      401,
    );
  });
}

test('even a fresh session cannot delete with a missing, empty, malformed or wrong password', async () => {
  const { database, request, cookie } = await setup();
  for (const password of [
    undefined,
    '',
    null,
    true,
    123,
    {},
    [],
    'wrong password',
    'space password',
  ]) {
    const response = await request('/delete-user', { password }, cookie);
    assert.equal(response.status, 400, JSON.stringify(password));
    assert.equal(database.user.length, 1);
    assert.equal(database.account.length, 1);
    assert.equal(database.session.length, 2);
  }
});

test('requires a signed-in user and trusted request origin', async () => {
  const { database, request, cookie } = await setup();
  assert.equal(
    (await request('/delete-user', { password: ' space password ' })).status,
    401,
  );
  assert.equal(
    (
      await request(
        '/delete-user',
        { password: ' space password ' },
        cookie,
        'https://untrusted.example',
      )
    ).status,
    403,
  );
  assert.equal(database.user.length, 1);
});

test('a deletion callback cannot bypass password confirmation', async () => {
  const { auth, database, cookie } = await setup();
  const response = await auth.handler(
    new Request(
      'http://localhost:4050/api/auth/delete-user/callback?token=anything',
      { headers: { Cookie: cookie } },
    ),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'PASSWORD_REQUIRED');
  assert.equal(database.user.length, 1);
});

test('only the session owner can be deleted, even when a different user ID is supplied', async () => {
  const { database, request, cookie } = await setup();
  const other = await request('/sign-up/email', {
    name: 'Other',
    email: 'other@example.com',
    password: 'password123',
    privacyConsent: true,
  });
  const otherUser = (await other.json()).user;
  assert.equal(
    (
      await request(
        '/delete-user',
        { password: ' space password ', userId: otherUser.id },
        cookie,
      )
    ).status,
    200,
  );
  assert.deepEqual(
    database.user.map((user) => user.id),
    [otherUser.id],
  );
});
