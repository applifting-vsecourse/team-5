import { PrismaService } from '@/core/prisma/prisma.service';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { Config } from '@/shared/config/config.service';
import { createUser } from './create-user';

export const seedDatabase = async (
  prisma: PrismaService,
  config: Config,
  betterAuth: BetterAuth,
): Promise<void> => {
  const auth = betterAuth;

  // `pnpm dev` runs the seed on every start, so never clobber a database that
  // already has data — that would delete the account you just made.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `Database already has ${existingUsers} user(s) — ensuring dog seed data.`,
    );
    const existingDuck = await prisma.user.findFirst({
      where: { email: 'caffeinatedduck@example.com' },
    });
    if (existingDuck) {
      await seedDogData(prisma, existingDuck.id);
      await seedClientData(prisma, auth, existingDuck.id);
    }
    return;
  }

  // Drop existing database data from all tables
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "session", "account", "verification", "user" RESTART IDENTITY CASCADE;',
    );
  } catch (error) {
    console.error('Error truncating tables:', error);
  }

  console.log('Creating superadmin user');

  // Create a superadmin user. This should be delete in prod app
  await createUser(prisma, auth, {
    email: config.superadminEmail,
    password: config.superadminPassword,
    name: 'Admin (Delete in Prod)',
    username: 'superadmin',
    role: 'admin',
  });

  console.log('Creating example users');

  const caffeinatedDuck = await createUser(prisma, auth, {
    email: 'caffeinatedduck@example.com',
    password: 'password1',
    name: 'Caffeinated Duck',
    username: 'CaffeinatedDuck',
  });

  await createUser(prisma, auth, {
    email: 'deepduckthoughts@example.com',
    password: 'password2',
    name: 'Deep Duck Thoughts',
    username: 'DeepDuckThoughts',
  });

  await seedDogData(prisma, caffeinatedDuck.id);
  await seedClientData(prisma, auth, caffeinatedDuck.id);
};

export const seedDogData = async (
  prisma: PrismaService,
  userId: string,
): Promise<void> => {
  console.log('Seeding dog Rex with goals and activities for user', userId);

  // 1. Upsert Dog Rex
  const rex = await prisma.dog.upsert({
    where: { id: 'dog-rex-1' },
    update: {
      name: 'Rex',
      breed: 'Border kolie',
      color: 1,
      disciplines: ['Poslušnost', 'Canicross'],
    },
    create: {
      id: 'dog-rex-1',
      name: 'Rex',
      breed: 'Border kolie',
      color: 1,
      ownerId: userId,
      disciplines: ['Poslušnost', 'Canicross'],
    },
  });

  // 2. Seed Goals if none exist
  const existingGoalsCount = await prisma.trainingGoal.count({
    where: { dogId: rex.id },
  });

  if (existingGoalsCount === 0) {
    console.log('Creating initial goals for Rex');
    await prisma.trainingGoal.createMany({
      data: [
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
      ],
    });
  }

  // 3. Seed Activities if none exist
  const existingActivitiesCount = await prisma.workoutLog.count({
    where: { dogId: rex.id },
  });

  if (existingActivitiesCount === 0) {
    console.log('Creating initial activities for Rex');
    const now = Date.now();
    await prisma.workoutLog.createMany({
      data: [
        {
          id: 'act-1',
          dogId: rex.id,
          authorId: userId,
          title: 'Chůze u nohy',
          discipline: 'Poslušnost',
          status: 'COMPLETED',
          completedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
          successRate: 70,
          rating: 4,
          focus: 'PARTIALLY',
          repeatedMistakes: 'NO',
          note: '„V zatáčkách předbíhal, na rovince super. Zítra kratší úseky.“',
        },
        {
          id: 'act-2',
          dogId: rex.id,
          authorId: userId,
          title: 'Start na povel',
          discipline: 'Canicross',
          status: 'COMPLETED',
          completedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          successRate: 85,
          rating: 5,
          focus: 'YES',
          repeatedMistakes: 'NO',
          note: 'Okamžitý tah vpřed, výborná reakce na povel a udržení směru.',
        },
        {
          id: 'act-3',
          dogId: rex.id,
          authorId: userId,
          title: 'Trénink odložení',
          discipline: 'Poslušnost',
          status: 'SKIPPED',
          completedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
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
          completedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
          successRate: 95,
          rating: 5,
          focus: 'YES',
          repeatedMistakes: 'NO',
          note: 'Soustředil se skvěle, jen u druhého cviku byl trochu rozptýlený kolemjdoucím psem.',
        },
      ],
    });
  }
};

export const seedClientData = async (
  prisma: PrismaService,
  auth: BetterAuth,
  trainerId: string,
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
    update: {
      ownerId: jan.id,
    },
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
    update: {
      ownerId: jan.id,
    },
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
    update: {
      ownerId: petra.id,
    },
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
    update: {
      ownerId: tomas.id,
    },
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

  // Unused invitation
  const inviteCode = 'K7M2PQ';
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.invitation.upsert({
    where: { code: inviteCode },
    update: { expiresAt },
    create: {
      code: inviteCode,
      trainerId,
      expiresAt,
    },
  });
};
