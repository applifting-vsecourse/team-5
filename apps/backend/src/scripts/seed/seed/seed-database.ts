import { PrismaService } from '@/core/prisma/prisma.service';
import { User } from '@/generated/prisma/client';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { Config } from '@/shared/config/config.service';
import { createQuack } from './create-quack';
import { createUser } from './create-user';

const MINUTE_IN_MS = 60 * 1000;

export const seedDatabase = async (
  prisma: PrismaService,
  config: Config,
  betterAuth: BetterAuth,
): Promise<void> => {
  const auth = betterAuth;

  // `pnpm dev` runs the seed on every start, so never clobber a database that
  // already has data — that would delete the account and posts you just made.
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
    }
    return;
  }

  // Drop existing database data from all tables
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "quack", "session", "account", "verification", "user" RESTART IDENTITY CASCADE;',
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

  const deepDuckThoughts = await createUser(prisma, auth, {
    email: 'deepduckthoughts@example.com',
    password: 'password2',
    name: 'Deep Duck Thoughts',
    username: 'DeepDuckThoughts',
  });

  const breadCritic = await createUser(prisma, auth, {
    email: 'breadcritic@example.com',
    password: 'password3',
    name: 'The Bread Critic',
    username: 'BreadCritic',
  });

  const migrationSeason = await createUser(prisma, auth, {
    email: 'migrationseason@example.com',
    password: 'password4',
    name: 'Migration Season',
    username: 'MigrationSeason',
  });

  const pondAdmin = await createUser(prisma, auth, {
    email: 'pondadmin@example.com',
    password: 'password5',
    name: 'Pond Admin',
    username: 'PondAdmin',
  });

  console.log('Creating example quacks');

  // Listed oldest first. The feed sorts newest first, so the last entry here is
  // the one at the top of the screen.
  const exampleQuacks: { author: User; minutesAgo: number; text: string }[] = [
    {
      author: pondAdmin,
      minutesAgo: 2870,
      text: `Reminder: the north end of the pond is closed for reed maintenance until Thursday.
Yes, again. No, we don't know why the contractor is a heron.`,
    },
    {
      author: migrationSeason,
      minutesAgo: 2610,
      text: `Left at dawn. 400 km down, 2,600 to go.
The V formation works beautifully right up until whoever is at the front decides to take a shortcut.`,
    },
    {
      author: breadCritic,
      minutesAgo: 2255,
      text: `Sourdough. Thrown by a child. Landed two metres short of anyone.
Crust: excellent. Delivery: amateur. 6/10.`,
    },
    {
      author: caffeinatedDuck,
      minutesAgo: 1980,
      text: `just spilled coffee on my keyboard
now every time i type "duck" it autocorrects to "quack"
send help or more caffeine`,
    },
    {
      author: deepDuckThoughts,
      minutesAgo: 1495,
      text: `If a pond reflects the sky, is the sky just a very large and very shy pond?`,
    },
    {
      author: migrationSeason,
      minutesAgo: 1240,
      text: `Update on the shortcut: it added 90 km and one entire mountain.
We are not currently speaking to the front of the V.`,
    },
    {
      author: pondAdmin,
      minutesAgo: 890,
      text: `Whoever keeps rearranging the stones on the west bank — we see you.
We have footage. It is extremely blurry footage. But we have it.`,
    },
    {
      author: caffeinatedDuck,
      minutesAgo: 640,
      text: `third espresso and i can hear colours now
one of them is quacking`,
    },
    {
      author: breadCritic,
      minutesAgo: 415,
      text: `Multigrain. Seeds still attached. Genuinely nutritious.
The pond is not ready for this level of quality and, frankly, neither am I. 9/10.`,
    },
    {
      author: deepDuckThoughts,
      minutesAgo: 260,
      text: `Everyone says "water off a duck's back" like it's a compliment.
Some of us would quite like to feel things.`,
    },
    {
      author: caffeinatedDuck,
      minutesAgo: 95,
      text: `me: throws one crumb into the pond
ducks: assemble like the Avengers
i fear i may have started something`,
    },
    {
      author: pondAdmin,
      minutesAgo: 20,
      text: `The bread situation has been resolved. The swan has been spoken to.
Please stop tagging me.`,
    },
  ];

  const now = Date.now();

  for (const { author, minutesAgo, text } of exampleQuacks) {
    await createQuack(prisma, {
      text,
      userId: author.id,
      createdAt: new Date(now - minutesAgo * MINUTE_IN_MS),
    });
  }

  await seedDogData(prisma, caffeinatedDuck.id);
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
