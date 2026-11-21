import assert from 'node:assert/strict';
import { test } from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import {
  betterAuthCoreConfig,
  buildSocialProviders,
} from '../dist/shared/auth/config/better-auth.config.js';

function setup({
  googleClientId = 'google-test-client-id',
  googleClientSecret = 'google-test-client-secret',
} = {}) {
  const database = { user: [], session: [], account: [], verification: [] };
  const socialProviders = buildSocialProviders({
    googleClientId,
    googleClientSecret,
  });
  const auth = betterAuth({
    ...betterAuthCoreConfig,
    ...(socialProviders ? { socialProviders } : {}),
    onAPIError: { errorURL: 'http://localhost:3050/login' },
    database: memoryAdapter(database),
    baseURL: 'http://localhost:4050',
    trustedOrigins: ['http://localhost:3050'],
    secret: 'google-oauth-test-secret-with-at-least-32-chars',
    rateLimit: { enabled: false },
    logger: { disabled: true },
  });

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
        headers: cookie ? { Cookie: cookie } : {},
      }),
    );

  return { auth, database, post, get };
}

function cookies(response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

test('buildSocialProviders enables Google only when both client ID and secret are set', () => {
  assert.equal(buildSocialProviders({}), undefined);
  assert.equal(buildSocialProviders({ googleClientId: 'id-only' }), undefined);
  assert.equal(
    buildSocialProviders({ googleClientSecret: 'secret-only' }),
    undefined,
  );
  assert.equal(
    buildSocialProviders({ googleClientId: '  ', googleClientSecret: 'secret' }),
    undefined,
  );
  assert.deepEqual(
    buildSocialProviders({
      googleClientId: ' client-id ',
      googleClientSecret: ' client-secret ',
    }),
    {
      google: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
      },
    },
  );
});

test('initiates Google OAuth flow with backend callback URI and handles cancellation redirect', async () => {
  const { post, get } = setup();
  const response = await post('sign-in/social', {
    provider: 'google',
    callbackURL: 'http://localhost:3050/login',
    errorCallbackURL: 'http://localhost:3050/login',
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.redirect, true);
  assert.ok(payload.url);

  const googleAuthUrl = new URL(payload.url);
  assert.equal(googleAuthUrl.origin, 'https://accounts.google.com');
  assert.equal(
    googleAuthUrl.searchParams.get('client_id'),
    'google-test-client-id',
  );
  assert.equal(
    googleAuthUrl.searchParams.get('redirect_uri'),
    'http://localhost:4050/api/auth/callback/google',
  );
  const state = googleAuthUrl.searchParams.get('state');
  assert.ok(state);

  const callbackCookie = cookies(response);
  const cancelled = await get(
    `callback/google?error=access_denied&state=${encodeURIComponent(state)}`,
    callbackCookie,
  );
  assert.equal(cancelled.status, 302);
  const redirectLocation = new URL(cancelled.headers.get('location') ?? '');
  assert.equal(redirectLocation.origin, 'http://localhost:3050');
  assert.equal(redirectLocation.pathname, '/login');
  assert.equal(redirectLocation.searchParams.get('error'), 'access_denied');
});

test('redirects callback without state to frontend login error URL', async () => {
  const { get } = setup();
  const response = await get('callback/google?error=access_denied');
  assert.equal(response.status, 302);
  const redirectLocation = new URL(response.headers.get('location') ?? '');
  assert.equal(redirectLocation.origin, 'http://localhost:3050');
  assert.equal(redirectLocation.pathname, '/login');
  assert.equal(redirectLocation.searchParams.get('error'), 'state_not_found');
});

test('returns provider not found when Google OAuth is unconfigured while keeping email auth working', async () => {
  const { post } = setup({ googleClientId: '', googleClientSecret: '' });
  const social = await post('sign-in/social', {
    provider: 'google',
    callbackURL: 'http://localhost:3050/login',
  });
  assert.equal(social.status, 404);
  const socialError = await social.json();
  assert.equal(socialError.code, 'PROVIDER_NOT_FOUND');

  const signUp = await post('sign-up/email', {
    name: 'Jana',
    email: 'jana@example.com',
    password: 'password123',
    privacyConsent: true,
    isTrainer: false,
  });
  assert.equal(signUp.status, 200);
});

test('OAuth-only user cannot change email and can delete account without password', async () => {
  const { post, get, database } = setup();
  const signUp = await post('sign-up/email', {
    name: 'Petr',
    email: 'petr@gmail.com',
    password: 'password123',
    privacyConsent: true,
    isTrainer: false,
  });
  assert.equal(signUp.status, 200);
  const sessionCookie = cookies(signUp);

  // Convert the user's only linked account into a Google OAuth account (no credential/password).
  assert.equal(database.account.length, 1);
  database.account[0] = {
    ...database.account[0],
    providerId: 'google',
    accountId: 'google-sub-123',
    password: null,
  };

  const emailChange = await post(
    'change-email',
    { newEmail: 'other@example.com' },
    sessionCookie,
  );
  assert.equal(emailChange.status, 400);
  const emailChangeBody = await emailChange.json();
  assert.equal(emailChangeBody.code, 'OAUTH_EMAIL_CHANGE_NOT_ALLOWED');

  const deletion = await post('delete-user', {}, sessionCookie);
  assert.equal(deletion.status, 200);
  assert.equal(database.user.length, 0);
  assert.equal(database.session.length, 0);

  const sessionAfter = await get('get-session', sessionCookie);
  assert.equal(await sessionAfter.json(), null);
});
