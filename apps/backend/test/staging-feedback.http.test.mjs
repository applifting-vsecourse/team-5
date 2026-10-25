// Run against an isolated, seeded LOCAL comparison stack, never staging.
// pnpm backend build, start servers, then node --env-file=.env --test test/staging-feedback.http.test.mjs
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import sharp from 'sharp';
import { PrismaClient } from '../dist/generated/prisma/client.js';

const base = process.env.BACKEND_URL;
const origin = process.env.FRONTEND_URL;
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  throw new Error('Use only an isolated local comparison backend.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
let ownerCookie;
let trainerCookie;
let strangerCookie;
let dog;
let goal;
const days = [7, 9, 11].map((offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10));

async function login(email, password = 'password1') {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, await res.clone().text());
  return res.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
}

function request(path, { cookie = ownerCookie, method = 'GET', json, body } = {}) {
  return fetch(`${base}/api/${path}`, {
    method,
    headers: { Cookie: cookie, Origin: origin, ...(json ? { 'Content-Type': 'application/json' } : {}) },
    body: json ? JSON.stringify(json) : body,
  });
}

async function data(response, status = 200) {
  assert.equal(response.status, status, await response.clone().text());
  return response.json();
}

before(async () => {
  ownerCookie = await login('jan.novak@seznam.cz');
  trainerCookie = await login('trener@trainloop.cz');
  strangerCookie = await login('eva.novotna@email.cz', 'password2');
  dog = await data(await request('dogs', { method: 'POST', json: { name: 'Feedback test fixture', color: 1 } }), 201);
  const trainer = await prisma.user.findUniqueOrThrow({ where: { email: 'trener@trainloop.cz' } });
  await prisma.dogShare.create({ data: { dogId: dog.id, trainerId: trainer.id } });
  goal = await data(await request(`dogs/${dog.id}/goals`, { method: 'POST', cookie: trainerCookie, json: {
    title: 'Spolehlivá chůze u nohy', principle: 'Odměňovat klidnou chůzi.',
  } }), 201);
});

after(async () => {
  if (dog) {
    await request(`dogs/${dog.id}/photo`, { method: 'DELETE' });
    await prisma.dog.delete({ where: { id: dog.id } });
  }
  await prisma.$disconnect();
});

test('trainer and handler schedule three independent sessions for one unchanged goal', async () => {
  const sessions = await Promise.all(days.map(async (date, index) => data(await request(`goals/${goal.id}/trainings`, {
    method: 'POST', cookie: index === 1 ? ownerCookie : trainerCookie, json: { date },
  }), 201)));
  assert.equal(new Set(sessions.map((session) => session.id)).size, 3);
  const saved = await data(await request(`goals/${goal.id}/trainings`));
  assert.deepEqual(saved.map((session) => session.date), days);
  const unchanged = await data(await request(`goals/${goal.id}`));
  assert.equal(unchanged.principle, goal.principle);
  assert.equal(unchanged.status, 'ACTIVE');
  const week = await data(await request(`trainings?from=${days[0]}&to=${days[2]}`));
  assert.deepEqual(week.filter((session) => session.goal.id === goal.id).map((session) => session.date), days);
});

test('concurrent double submit creates only one session on a new day', async () => {
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const results = await Promise.all([1, 2].map(() => request(`goals/${goal.id}/trainings`, { method: 'POST', json: { date } })));
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const saved = await data(await request(`goals/${goal.id}/trainings`));
  assert.equal(saved.filter((session) => session.date === date).length, 1);
});

test('past and invalid days and unshared accounts remain rejected', async () => {
  for (const date of ['2020-01-01', '2026-02-30']) {
    assert.equal((await request(`goals/${goal.id}/trainings`, { method: 'POST', json: { date } })).status, 400);
  }
  assert.equal((await request(`goals/${goal.id}/trainings`, { cookie: strangerCookie })).status, 404);
  assert.equal((await request(`goals/${goal.id}/trainings`, { method: 'POST', cookie: strangerCookie, json: { date: days[0] } })).status, 404);
});

test('phone photo survives profile reload, replacement and removal', async () => {
  const bytes = await sharp({ create: { width: 32, height: 24, channels: 3, background: 'white' } }).jpeg().toBuffer();
  let previousUrl;
  for (const type of ['image/jpeg', 'application/octet-stream']) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type }), 'phone.jpg');
    const uploaded = await data(await request(`dogs/${dog.id}/photo`, { method: 'POST', body: form }), 201);
    const reloaded = await data(await request(`dogs/${dog.id}`));
    assert.equal(reloaded.photoUrl, uploaded.photoUrl);
    const url = `${base}/api${reloaded.photoUrl}`;
    const image = await fetch(url);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type'), /image\/webp/);
    const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    assert.equal(metadata.width, 500);
    assert.equal(metadata.height, 500);
    if (previousUrl) assert.equal((await fetch(previousUrl)).status, 404);
    previousUrl = url;
  }
  const removed = await data(await request(`dogs/${dog.id}/photo`, { method: 'DELETE' }));
  assert.equal(removed.photoUrl, null);
  assert.equal((await fetch(previousUrl)).status, 404);
});

test('trainer cannot replace an owner photo', async () => {
  const form = new FormData();
  form.append('file', new Blob(['invalid'], { type: 'image/jpeg' }), 'x.jpg');
  assert.equal((await request(`dogs/${dog.id}/photo`, { method: 'POST', cookie: trainerCookie, body: form })).status, 404);
});
