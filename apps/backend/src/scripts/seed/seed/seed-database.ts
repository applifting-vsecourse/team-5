import { PrismaService } from '@/core/prisma/prisma.service';
import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { Config } from '@/shared/config/config.service';
import { createUser } from './create-user';
import { SeedTrainingCalendar } from './seed-training-calendar';

export const seedDatabase = async (
  prisma: PrismaService,
  config: Config,
  betterAuth: BetterAuth,
  now = new Date(),
): Promise<void> => {
  const auth = betterAuth;

  // `pnpm dev` runs the seed on every start, so never clobber a database that
  // already has data — that would delete the account you just made.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `Database already has ${existingUsers} user(s) — ensuring trainer, clients, and dog seed data.`,
    );
    let existingTrainer = await prisma.user.findFirst({
      where: {
        email: {
          in: ['trener@trainloop.cz', 'caffeinatedduck@example.com'],
        },
      },
    });

    if (!existingTrainer) {
      console.log('No trainer user found, creating trener@trainloop.cz');
      existingTrainer = await createUser(prisma, auth, {
        email: 'trener@trainloop.cz',
        password: 'password1',
        name: 'Marek Trenér',
        username: 'trener',
        role: 'trainer',
      });
    } else if (existingTrainer.role !== 'trainer') {
      await prisma.user.update({
        where: { id: existingTrainer.id },
        data: { role: 'trainer' },
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          in: ['eva.novotna@email.cz', 'deepduckthoughts@example.com'],
        },
      },
    });

    if (!existingUser) {
      console.log('Creating standard user eva.novotna@email.cz');
      await createUser(prisma, auth, {
        email: 'eva.novotna@email.cz',
        password: 'password2',
        name: 'Eva Novotná',
        username: 'evanow',
      });
    }

    await seedClientData(prisma, auth, existingTrainer.id, now);
    return;
  }

  console.log('Creating superadmin user');

  // Create a superadmin user. Fallback to default credentials if env vars are unset.
  const adminEmail = config.superadminEmail || 'admin@example.com';
  const adminPassword = config.superadminPassword || 'adminpassword';

  await createUser(prisma, auth, {
    email: adminEmail,
    password: adminPassword,
    name: 'Admin (Delete in Prod)',
    username: 'superadmin',
    role: 'admin',
  });

  console.log('Creating example users');

  const trainer = await createUser(prisma, auth, {
    email: 'trener@trainloop.cz',
    password: 'password1',
    name: 'Marek Trenér',
    username: 'trener',
    role: 'trainer',
  });

  await createUser(prisma, auth, {
    email: 'eva.novotna@email.cz',
    password: 'password2',
    name: 'Eva Novotná',
    username: 'evanow',
  });

  await seedClientData(prisma, auth, trainer.id, now);
};

export const seedDogData = async (
  prisma: PrismaService,
  userId: string,
  now = new Date(),
): Promise<void> => {
  console.log('Seeding dog Rex with goals and activities for user', userId);

  // 1. Upsert Dog Rex
  const rex = await prisma.dog.upsert({
    where: { id: 'dog-rex-1' },
    update: {},
    create: {
      id: 'dog-rex-1',
      name: 'Rex',
      breed: 'Border kolie',
      color: 1,
      ownerId: userId,
      disciplines: ['Poslušnost', 'Canicross'],
    },
  });

  // Concrete definitions must exist before creating their historical records.
  for (const goal of [
    {
      id: 'goal-1',
      dogId: rex.id,
      createdById: userId,
      title: 'Spolehlivá chůze u nohy',
      discipline: 'Poslušnost',
      principle:
        'Pes jde u levé nohy s hlavou u kolena. Odměna vždy z levé ruky u nohy, ne před tělem. Pozor na předbíhání v zatáčkách.',
      status: 'ACTIVE',
      order: 1,
    },
    {
      id: 'goal-2',
      dogId: rex.id,
      createdById: userId,
      title: 'Start na povel',
      discipline: 'Canicross',
      principle:
        'Startovní povel a okamžitý tah vpřed bez otáčení se na psovoda.',
      status: 'ACTIVE',
      order: 2,
    },
    {
      id: 'goal-3',
      dogId: rex.id,
      createdById: userId,
      title: 'Odložení za pohybu',
      discipline: 'Poslušnost',
      principle:
        'Pes zůstává ležet na povel i při odchodu psovoda na vzdálenost 30 metrů.',
      status: 'ACTIVE',
      order: 3,
    },
  ] as const) {
    await prisma.trainingGoal.upsert({
      where: { id: goal.id },
      update: {},
      create: goal,
    });
    await prisma.goalTraining.upsert({
      where: { id: `training-${goal.id}` },
      update: {},
      create: { id: `training-${goal.id}`, goalId: goal.id, title: goal.title },
    });
  }

  // 3. Seed Activities if none exist
  const existingActivitiesCount = await prisma.workoutLog.count({
    where: { dogId: rex.id },
  });

  if (existingActivitiesCount === 0) {
    console.log('Creating initial activities for Rex');
    const timestamp = now.getTime();
    await prisma.workoutLog.createMany({
      data: [
        {
          id: 'act-1',
          dogId: rex.id,
          goalId: 'goal-1',
          trainingId: 'training-goal-1',
          authorId: userId,
          title: 'Chůze u nohy',
          discipline: 'Poslušnost',
          status: 'COMPLETED',
          completedAt: new Date(timestamp - 1 * 24 * 60 * 60 * 1000),
          successRate: 70,
          rating: 4,
          focus: 'PARTIALLY',
          repeatedMistakes: 'NO',
          note: '„V zatáčkách předbíhal, na rovince super. Zítra kratší úseky.“',
        },
        {
          id: 'act-2',
          dogId: rex.id,
          goalId: 'goal-2',
          trainingId: 'training-goal-2',
          authorId: userId,
          title: 'Start na povel',
          discipline: 'Canicross',
          status: 'COMPLETED',
          completedAt: new Date(timestamp - 2 * 24 * 60 * 60 * 1000),
          successRate: 85,
          rating: 5,
          focus: 'YES',
          repeatedMistakes: 'NO',
          note: 'Okamžitý tah vpřed, výborná reakce na povel a udržení směru.',
        },
        {
          id: 'act-3',
          dogId: rex.id,
          goalId: 'goal-3',
          trainingId: 'training-goal-3',
          authorId: userId,
          title: 'Trénink odložení',
          discipline: 'Poslušnost',
          status: 'SKIPPED',
          completedAt: new Date(timestamp - 3 * 24 * 60 * 60 * 1000),
          skipReason:
            'Pršelo a pes byl unavený po návštěvě veterináře. Trénink jsme po dohodě přeskočili.',
          note: 'Přeskočeno po dohodě.',
        },
        {
          id: 'act-4',
          dogId: rex.id,
          authorId: userId,
          title: 'Poslušnost v parku',
          discipline: 'Poslušnost',
          status: 'COMPLETED',
          completedAt: new Date(timestamp - 5 * 24 * 60 * 60 * 1000),
          successRate: 95,
          rating: 5,
          focus: 'YES',
          repeatedMistakes: 'NO',
          note: 'Soustředil se skvěle, jen u druhého cviku byl trochu rozptýlený kolemjdoucím psem.',
        },
      ],
    });
  }

  // 3b. Seed private lesson notes for Rex (#70) — owner-only diary.
  const existingNotesCount = await prisma.dogNote.count({
    where: { dogId: rex.id },
  });
  if (existingNotesCount === 0) {
    console.log('Creating initial private notes for Rex');
    await prisma.dogNote.createMany({
      data: [
        {
          id: 'note-1',
          dogId: rex.id,
          date: new Date('2026-10-18T00:00:00.000Z'),
          title: 'Seminář poslušnosti',
          text: 'Více odměňovat u levé nohy. Kratší úseky, pak postupně prodlužovat.',
        },
        {
          id: 'note-2',
          dogId: rex.id,
          date: new Date('2026-10-05T00:00:00.000Z'),
          title: 'Lekce canicross',
          text: 'Start na povel: nejdřív klid u nohy, teprve potom tah. Neotáčet se na psa.',
        },
      ],
    });
  }

  // 4. Seed PlanBlocks (exercises / tasks) for Rex's goals
  const rexGoalBlocks = [
    // Goal 1: Spolehlivá chůze u nohy
    {
      id: 'block-1-1',
      goalId: 'goal-1',
      position: 0,
      title: 'Přiřazení k noze na pamlsek',
      instruction:
        'Ze základní pozice navést psa obloukem za zády k levé noze. Odměna okamžitě po dosednutí u nohy z levé ruky.',
      criterion:
        'Pes usedne paralelně k noze do 2 sekund bez dotyku psovoda, oční kontakt.',
    },
    {
      id: 'block-1-2',
      goalId: 'goal-1',
      position: 1,
      title: 'Chůze 10 kroků v přímém směru',
      instruction:
        'Vykročit levou nohou se zvukovým povelem „K noze“. Udržovat rytmus a odměňovat po každých 3–5 krocích.',
      criterion:
        'Pes nepředbíhá ramenem koleno psovoda a soustředí se po celou trasu 10 kroků.',
    },
    {
      id: 'block-1-3',
      goalId: 'goal-1',
      position: 2,
      title: 'Obrat za pochodu o 90° vlevo',
      instruction:
        'Při obratu vlevo jemně zpomalit tělem, navést psa do zkráceného oblouku a udržet jeho rameno u kolena.',
      criterion:
        'Pes neztrácí pozici u nohy ani při náhlém obratu do úhlu 90 stupňů.',
    },
    // Goal 2: Start na povel
    {
      id: 'block-2-1',
      goalId: 'goal-2',
      position: 0,
      title: 'Klid na startovní čáře v tahu',
      instruction:
        'Pes stojí v postroji na napnuté šňůře v klidu před psovodem. Psovod drží šňůru a čeká na uvolnění.',
      criterion:
        'Klidné čekání v tahu 10 sekund bez uskakování do stran či štěkání.',
    },
    {
      id: 'block-2-2',
      goalId: 'goal-2',
      position: 1,
      title: 'Explozivní vyběhnutí na povel GO',
      instruction:
        'Na povel „Připravit... GO!“ okamžitý přechod do plného sprintu na prvních 30 metrů.',
      criterion:
        'Okamžitá akcelerace do tahu do 1 sekundy od povelu bez ohlížení na psovoda.',
    },
    // Goal 3: Odložení za pohybu
    {
      id: 'block-3-1',
      goalId: 'goal-3',
      position: 0,
      title: 'Povel Lehni za chůze',
      instruction:
        'Při chůzi u nohy dát povel „Lehni“. Pes ihned ulehá, psovod pokračuje plynulým krokem dalších 5 kroků.',
      criterion:
        'Okamžité zalehnutí bez zaváhání do 1 sekundy a bez nutnosti zastavení psovoda.',
    },
    {
      id: 'block-3-2',
      goalId: 'goal-3',
      position: 1,
      title: 'Odstup psovoda na 20 metrů a návrat',
      instruction:
        'Po odložení psovod odchází 20 m čelem od psa, vyčká 5 sekund a vrací se k pravému boku psa.',
      criterion:
        'Pes leží klidně bez posunutí těla či vstávání po celou dobu odchodu i návratu.',
    },
  ];

  for (const block of rexGoalBlocks) {
    await prisma.planBlock.upsert({
      where: { id: block.id },
      update: {},
      create: block,
    });
  }
};

export const seedClientData = async (
  prisma: PrismaService,
  auth: BetterAuth,
  trainerId: string,
  now = new Date(),
): Promise<void> => {
  console.log('Seeding clients for trainer', trainerId);

  // 1. Client Jan Novák
  let jan = await prisma.user.findFirst({
    where: { email: 'jan.novak@seznam.cz' },
  });
  if (!jan) {
    jan = await createUser(prisma, auth, {
      email: 'jan.novak@seznam.cz',
      password: 'password1',
      name: 'Jan Novák',
      username: 'jannovak',
    });
  }

  // 2. Client Petra Svobodová
  let petra = await prisma.user.findFirst({
    where: { email: 'petra.svobodova@email.cz' },
  });
  if (!petra) {
    petra = await createUser(prisma, auth, {
      email: 'petra.svobodova@email.cz',
      password: 'password1',
      name: 'Petra Svobodová',
      username: 'petrasvobodova',
    });
  }

  // 3. Client Tomáš Dvořák
  let tomas = await prisma.user.findFirst({
    where: { email: 'tomas.dvorak@gmail.com' },
  });
  if (!tomas) {
    tomas = await createUser(prisma, auth, {
      email: 'tomas.dvorak@gmail.com',
      password: 'password1',
      name: 'Tomáš Dvořák',
      username: 'tomasdvorak',
    });
  }

  // Connect clients to trainer
  for (const client of [jan, petra, tomas]) {
    await prisma.clientConnection.upsert({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId: client.id,
        },
      },
      update: {},
      create: {
        trainerId,
        clientId: client.id,
      },
    });
  }

  // Dogs for Jan: Rex and Baryk
  const rex = await prisma.dog.upsert({
    where: { id: 'dog-rex-1' },
    update: {},
    create: {
      id: 'dog-rex-1',
      name: 'Rex',
      breed: 'Border kolie',
      color: 1,
      ownerId: jan.id,
      disciplines: ['Poslušnost', 'Canicross'],
    },
  });

  const baryk = await prisma.dog.upsert({
    where: { id: 'dog-baryk-1' },
    update: {},
    create: {
      id: 'dog-baryk-1',
      name: 'Baryk',
      breed: 'Německý ovčák',
      color: 3,
      ownerId: jan.id,
      disciplines: ['Poslušnost', 'Agility'],
    },
  });

  // Dog for Petra: Alík
  const alik = await prisma.dog.upsert({
    where: { id: 'dog-alik-1' },
    update: {},
    create: {
      id: 'dog-alik-1',
      name: 'Alík',
      breed: 'Kříženec',
      color: 2,
      ownerId: petra.id,
      disciplines: ['Nosework'],
    },
  });

  // Dog for Tomáš: Lucky
  const lucky = await prisma.dog.upsert({
    where: { id: 'dog-lucky-1' },
    update: {},
    create: {
      id: 'dog-lucky-1',
      name: 'Lucky',
      breed: 'Ohař',
      color: 4,
      ownerId: tomas.id,
      disciplines: ['Canicross'],
    },
  });

  // Share dogs with trainer
  for (const dog of [rex, baryk, alik, lucky]) {
    await prisma.dogShare.upsert({
      where: {
        dogId_trainerId: {
          dogId: dog.id,
          trainerId,
        },
      },
      update: {},
      create: {
        dogId: dog.id,
        trainerId,
      },
    });
  }

  await seedDogData(prisma, jan.id, now);

  // Baryk's goal & blocks
  const barykGoal = await prisma.trainingGoal.upsert({
    where: { id: 'goal-baryk-1' },
    update: {},
    create: {
      id: 'goal-baryk-1',
      dogId: baryk.id,
      createdById: jan.id,
      title: 'Překonání áčka v agility',
      discipline: 'Agility',
      principle:
        'Plynulý náběh v plné rychlosti, bezpečný seběh s dotykem sestupné zóny 2on/2off.',
      status: 'ACTIVE',
      order: 1,
    },
  });

  const barykBlocks = [
    {
      id: 'block-baryk-1',
      goalId: barykGoal.id,
      position: 0,
      title: 'Náběh na šikmou stěnu v plné rychlosti',
      instruction:
        'Vyslat psa na překážku ze vzdálenosti 5 metrů rovným náběhem.',
      criterion: 'Přímá trajektorie bez zaváhání před náběhem na stěnu.',
    },
    {
      id: 'block-baryk-2',
      goalId: barykGoal.id,
      position: 1,
      title: 'Zastavení v sestupné zóně 2on/2off',
      instruction:
        'Pes seběhne stěnu a zastaví zadníma nohama na barevné zóně a předníma na zemi.',
      criterion: 'Spolehlivé setrvání v zóně do zaznění uvolňovacího povelu.',
    },
  ];

  for (const block of barykBlocks) {
    await prisma.planBlock.upsert({
      where: { id: block.id },
      update: {},
      create: block,
    });
  }

  await seedTrainingPlans(
    prisma,
    trainerId,
    [
      {
        id: rex.id,
        ownerId: jan.id,
        discipline: 'Poslušnost',
        titles: [
          'Přivolání s rozptýlením',
          'Klidné míjení psů',
          'Odložení na vzdálenost',
        ],
      },
      {
        id: baryk.id,
        ownerId: jan.id,
        discipline: 'Agility',
        titles: [
          'Samostatný slalom',
          'Plynulý náběh do tunelu',
          'Zastavení v kontaktní zóně',
        ],
      },
      {
        id: alik.id,
        ownerId: petra.id,
        discipline: 'Nosework',
        titles: [
          'Označení nalezeného pachu',
          'Hledání v krabicích',
          'Samostatné prohledání prostoru',
        ],
      },
      {
        id: lucky.id,
        ownerId: tomas.id,
        discipline: 'Canicross',
        titles: [
          'Plynulý tah v postroji',
          'Změny směru na povel',
          'Klidné míjení na trati',
        ],
      },
    ],
    now,
  );

  await seedClientActivity(prisma, trainerId, { jan, petra, tomas }, now);

  // Unused invitation
  const inviteCode = 'K7M2PQ';
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await prisma.invitation.upsert({
    where: { code: inviteCode },
    update: {},
    create: {
      code: inviteCode,
      trainerId,
      expiresAt,
    },
  });
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Recent records of the trainer's clients, so the trainer overview has real
// data for every attention reason: a client message waiting for a reply (Rex),
// falling success (Baryk), a quiet dog (Lucky) and a dog doing fine (Alík).
// Dates are relative to their first seed run and preserved on subsequent deploys.
const seedClientActivity = async (
  prisma: PrismaService,
  trainerId: string,
  clients: {
    jan: { id: string };
    petra: { id: string };
    tomas: { id: string };
  },
  referenceDate = new Date(),
): Promise<void> => {
  const { jan, petra, tomas } = clients;
  const now = referenceDate.getTime();
  const records = [
    // Rex (Jan): good progress; Jan asked a question under yesterday's record.
    {
      id: 'client-act-rex-1',
      dogId: 'dog-rex-1',
      goalId: 'goal-1',
      trainingId: 'training-goal-1',
      authorId: jan.id,
      title: 'Přivolání v parku',
      discipline: 'Poslušnost',
      daysAgo: 1,
      successRate: 80,
      note: 'Na 15 m to šlo skvěle, pak ho rozptýlil jiný pes.',
    },
    {
      id: 'client-act-rex-2',
      dogId: 'dog-rex-1',
      goalId: 'goal-1',
      trainingId: 'training-goal-1',
      authorId: jan.id,
      title: 'Chůze u nohy',
      discipline: 'Poslušnost',
      daysAgo: 4,
      successRate: 75,
      note: null,
    },
    {
      id: 'client-act-rex-3',
      dogId: 'dog-rex-1',
      goalId: 'goal-2',
      trainingId: 'training-goal-2',
      authorId: jan.id,
      title: 'Přivolání na píšťalku',
      discipline: 'Poslušnost',
      daysAgo: 9,
      successRate: 70,
      note: null,
    },
    {
      id: 'client-act-rex-4',
      dogId: 'dog-rex-1',
      goalId: 'goal-2',
      trainingId: 'training-goal-2',
      authorId: jan.id,
      title: 'Start na povel',
      discipline: 'Canicross',
      daysAgo: 16,
      successRate: 65,
      note: null,
    },
    // Baryk (Jan): success rate keeps dropping.
    {
      id: 'client-act-baryk-1',
      dogId: 'dog-baryk-1',
      goalId: 'goal-baryk-1',
      trainingId: 'training-goal-baryk-1',
      authorId: jan.id,
      title: 'Náběh na áčko',
      discipline: 'Agility',
      daysAgo: 2,
      successRate: 45,
      note: null,
    },
    {
      id: 'client-act-baryk-2',
      dogId: 'dog-baryk-1',
      goalId: 'goal-baryk-1',
      trainingId: 'training-goal-baryk-1',
      authorId: jan.id,
      title: 'Zóna 2on/2off',
      discipline: 'Agility',
      daysAgo: 8,
      successRate: 60,
      note: null,
    },
    {
      id: 'client-act-baryk-3',
      dogId: 'dog-baryk-1',
      goalId: 'goal-baryk-1',
      trainingId: 'training-goal-baryk-1',
      authorId: jan.id,
      title: 'Náběh na áčko',
      discipline: 'Agility',
      daysAgo: 15,
      successRate: 68,
      note: null,
    },
    // Alík (Petra): steady, trained today.
    {
      id: 'client-act-alik-1',
      dogId: 'dog-alik-1',
      authorId: petra.id,
      title: 'Hledání pamlsku v trávě',
      discipline: 'Nosework',
      daysAgo: 0,
      successRate: 90,
      note: null,
    },
    {
      id: 'client-act-alik-2',
      dogId: 'dog-alik-1',
      authorId: petra.id,
      title: 'Krabicová hra',
      discipline: 'Nosework',
      daysAgo: 3,
      successRate: 85,
      note: null,
    },
    {
      id: 'client-act-alik-3',
      dogId: 'dog-alik-1',
      authorId: petra.id,
      title: 'Hledání pamlsku v trávě',
      discipline: 'Nosework',
      daysAgo: 10,
      successRate: 80,
      note: null,
    },
    // Lucky (Tomáš): no training for a week.
    {
      id: 'client-act-lucky-1',
      dogId: 'dog-lucky-1',
      authorId: tomas.id,
      title: 'Canicross start',
      discipline: 'Canicross',
      daysAgo: 7,
      successRate: 85,
      note: null,
    },
    {
      id: 'client-act-lucky-2',
      dogId: 'dog-lucky-1',
      authorId: tomas.id,
      title: 'Tah v postroji',
      discipline: 'Canicross',
      daysAgo: 12,
      successRate: 80,
      note: null,
    },
  ];
  for (const { daysAgo, ...record } of records) {
    // Late afternoon keeps "today" records in the past at any seed time.
    const completedAt = new Date(now - daysAgo * DAY_MS - 2 * 60 * 60 * 1000);
    await prisma.workoutLog.upsert({
      where: { id: record.id },
      update: {},
      create: { ...record, status: 'COMPLETED', completedAt },
    });
  }

  const messages = [
    {
      id: 'client-msg-rex-1',
      authorId: trainerId,
      minutesAfter: 30,
      text: 'Skvělá práce! Příště zkus přivolání s menším rozptýlením.',
    },
    {
      id: 'client-msg-rex-2',
      authorId: jan.id,
      minutesAfter: 90,
      text: 'Díky! Mám ho při rozptýlení odvolat dřív, nebo počkat?',
    },
  ];
  const rexRecord = new Date(now - DAY_MS - 2 * 60 * 60 * 1000).getTime();
  for (const message of messages) {
    const createdAt = new Date(rexRecord + message.minutesAfter * 60 * 1000);
    await prisma.trainingMessage.upsert({
      where: { id: message.id },
      update: {},
      create: {
        id: message.id,
        workoutLogId: 'client-act-rex-1',
        authorId: message.authorId,
        text: message.text,
        createdAt,
      },
    });
  }
};

// Stable IDs add rich plans on existing databases without resetting user edits or records.
export async function seedTrainingPlans(
  prisma: PrismaService,
  trainerId: string,
  dogs: { id: string; ownerId: string; discipline: string; titles: string[] }[],
  now = new Date(),
): Promise<void> {
  const today = fromCalendarDate(todayInAppZone(now));
  const day = (offset: number): Date =>
    new Date(today.getTime() + offset * DAY_MS);
  const existingDays = await prisma.scheduledTraining.findMany({
    where: {
      dog: { ownerId: { in: [...new Set(dogs.map((dog) => dog.ownerId))] } },
    },
    select: { date: true, dogId: true, dog: { select: { ownerId: true } } },
  });
  const calendar = new SeedTrainingCalendar(
    today,
    existingDays.map((training) => ({
      date: training.date,
      dogId: training.dogId,
      ownerId: training.dog.ownerId,
    })),
  );
  for (const dog of dogs) {
    for (const [g, title] of dog.titles.entries()) {
      const goalId = `seed-${dog.id}-goal-${g}`;
      await prisma.trainingGoal.upsert({
        where: { id: goalId },
        update: {},
        create: {
          id: goalId,
          dogId: dog.id,
          createdById: trainerId,
          title,
          discipline: dog.discipline,
          order: g + 10,
          status: 'ACTIVE',
          criterion:
            'Samostatné provedení v 8 z 10 pokusů ve dvou různých prostředích.',
          principle:
            'Krátké série, postupné přidávání rušivých vlivů a přesná odměna.',
          deadline: day(30 + g * 7)
            .toISOString()
            .slice(0, 10),
        },
      });
      for (let t = 0; t < 4; t++) {
        const trainingId = `${goalId}-training-${t}`;
        const trainingTitle = [
          'Základy v klidu',
          'Prodloužení vzdálenosti',
          'Práce s rozptýlením',
          'Ověření v novém prostředí',
        ][t];
        await prisma.goalTraining.upsert({
          where: { id: trainingId },
          update: {},
          create: { id: trainingId, goalId, title: trainingTitle, position: t },
        });
        for (let step = 0; step < 3; step++) {
          await prisma.planBlock.upsert({
            where: { id: `${trainingId}-step-${step}` },
            update: {},
            create: {
              id: `${trainingId}-step-${step}`,
              goalId,
              trainingId,
              position: step,
              title: [
                'Navázání kontaktu a rozehřátí',
                title,
                'Samostatné provedení a odměna',
              ][step],
              instruction:
                'Připrav odměnu, proveď pět opakování a zařaď krátkou pauzu. Při ztrátě soustředění sniž obtížnost.',
              criterion: 'Čtyři úspěšné pokusy z pěti bez opakování povelu.',
              durationMinutes: step === 1 ? 8 : 3,
            },
          });
        }
        for (let n = 0; n < 7; n++) {
          const id = `${trainingId}-date-${n}`;
          // Existing fixtures (including manual moves/completions) are never reset.
          if (await prisma.scheduledTraining.findUnique({ where: { id } }))
            continue;
          const planned = n >= 3;
          const skipped = !planned && n === 1 && t === 2;
          const status = planned
            ? 'PLANNED'
            : skipped
              ? 'SKIPPED'
              : 'COMPLETED';
          const date = calendar.allocate(id, dog.ownerId, dog.id, planned);
          await prisma.$transaction(async (tx) => {
            const scheduled = await tx.scheduledTraining.create({
              data: {
                id,
                dogId: dog.id,
                goalId,
                trainingId,
                createdById: trainerId,
                date,
                status,
              },
            });
            if (planned) return;
            await tx.workoutLog.create({
              data: {
                id: `${id}-log`,
                scheduledTrainingId: id,
                dogId: dog.id,
                goalId,
                trainingId,
                authorId: dog.ownerId,
                title: trainingTitle,
                discipline: dog.discipline,
                status: skipped ? 'SKIPPED' : 'COMPLETED',
                completedAt: new Date(
                  scheduled.date.getTime() + 12 * 3_600_000,
                ),
                successRate: skipped ? null : 50 + ((g + t + n) % 6) * 10,
                rating: skipped ? null : 4,
                focus: skipped ? null : 'PARTIALLY',
                repeatedMistakes: skipped ? null : 'NO',
                note: skipped
                  ? null
                  : 'Po krátké pauze lepší soustředění. Příště přidáme vzdálenost.',
                skipReason: skipped ? 'Odpočinek po náročném dni.' : null,
              },
            });
          });
        }
      }
    }
  }
}
