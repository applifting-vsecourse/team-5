import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainingStatus } from '@/generated/prisma/client';
import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
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
      existingTrainer = await prisma.user.findFirst({
        where: { role: 'trainer' },
      });
    }

    if (!existingTrainer) {
      console.log('No trainer user found, creating trener@trainloop.cz');
      existingTrainer = await createUser(prisma, auth, {
        email: 'trener@trainloop.cz',
        password: 'password1',
        name: 'Marek Trenér',
        username: 'trener',
        role: 'trainer',
      });
    } else {
      if (existingTrainer.email !== 'trener@trainloop.cz') {
        console.log(
          `Migrating legacy trainer email ${existingTrainer.email} -> trener@trainloop.cz`,
        );
        await prisma.user.update({
          where: { id: existingTrainer.id },
          data: {
            email: 'trener@trainloop.cz',
            name: 'Marek Trenér',
            username: 'trener',
            role: 'trainer',
          },
        });
        existingTrainer.email = 'trener@trainloop.cz';
      } else if (existingTrainer.role !== 'trainer') {
        await prisma.user.update({
          where: { id: existingTrainer.id },
          data: { role: 'trainer' },
        });
      }
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
    } else if (existingUser.email !== 'eva.novotna@email.cz') {
      console.log(
        `Migrating legacy user email ${existingUser.email} -> eva.novotna@email.cz`,
      );
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: 'eva.novotna@email.cz',
          name: 'Eva Novotná',
          username: 'evanow',
        },
      });
    }

    await seedDogData(prisma, existingTrainer.id);
    await seedClientData(prisma, auth, existingTrainer.id);
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

  await seedDogData(prisma, trainer.id);
  await seedClientData(prisma, auth, trainer.id);
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
      update: {
        title: block.title,
        instruction: block.instruction,
        criterion: block.criterion,
        position: block.position,
      },
      create: block,
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

  // Baryk's goal & blocks
  const barykGoal = await prisma.trainingGoal.upsert({
    where: { id: 'goal-baryk-1' },
    update: {
      dogId: baryk.id,
      title: 'Překonání áčka v agility',
      discipline: 'Agility',
      principle:
        'Plynulý náběh v plné rychlosti, bezpečný seběh s dotykem sestupné zóny 2on/2off.',
      status: 'ACTIVE',
      order: 1,
    },
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
      update: {
        title: block.title,
        instruction: block.instruction,
        criterion: block.criterion,
        position: block.position,
      },
      create: block,
    });
  }

  // Trainer Marek's own dog: Argo
  const argo = await prisma.dog.upsert({
    where: { id: 'dog-argo-1' },
    update: {
      name: 'Argo',
      breed: 'Belgický ovčák Malinois',
      color: 5,
      ownerId: trainerId,
      disciplines: ['Poslušnost', 'Obrany'],
    },
    create: {
      id: 'dog-argo-1',
      name: 'Argo',
      breed: 'Belgický ovčák Malinois',
      color: 5,
      ownerId: trainerId,
      disciplines: ['Poslušnost', 'Obrany'],
    },
  });

  const argoGoal = await prisma.trainingGoal.upsert({
    where: { id: 'goal-argo-1' },
    update: {
      dogId: argo.id,
      title: 'Vyštěkání v maketě',
      discipline: 'Obrany',
      principle:
        'Přímý náběh do zástěny, intenzivní rytmické vyštěkání bez dotyku figuranta.',
      status: 'ACTIVE',
      order: 1,
    },
    create: {
      id: 'goal-argo-1',
      dogId: argo.id,
      createdById: trainerId,
      title: 'Vyštěkání v maketě',
      discipline: 'Obrany',
      principle:
        'Přímý náběh do zástěny, intenzivní rytmické vyštěkání bez dotyku figuranta.',
      status: 'ACTIVE',
      order: 1,
    },
  });

  const argoBlocks = [
    {
      id: 'block-argo-1',
      goalId: argoGoal.id,
      position: 0,
      title: 'Náběh do zástěny na povel',
      instruction: 'Vyslání psa do makety ze vzdálenosti 15 metrů.',
      criterion: 'Přímočarý a rychlý náběh bez obíhání překážky.',
    },
    {
      id: 'block-argo-2',
      goalId: argoGoal.id,
      position: 1,
      title: 'Rytmické vyštěkání figuranta',
      instruction:
        'Pes vyštěkává figuranta v maketě z uctivé vzdálenosti 1 metru bez kontaktu.',
      criterion: 'Nepřetržité a jisté vyštěkání po dobu minimálně 10 sekund.',
    },
  ];

  for (const block of argoBlocks) {
    await prisma.planBlock.upsert({
      where: { id: block.id },
      update: {
        title: block.title,
        instruction: block.instruction,
        criterion: block.criterion,
        position: block.position,
      },
      create: block,
    });
  }

  // Week Calendar scheduled trainings
  const todayStr = todayInAppZone();
  const today = fromCalendarDate(todayStr);
  const dayOfWeek = today.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + diffToMonday);

  const getWeekDay = (offsetDays: number): Date => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + offsetDays);
    return d;
  };

  const tuesday = getWeekDay(1);
  const saturday = getWeekDay(5);
  const sunday = getWeekDay(6);

  const pastDate =
    today.getTime() > tuesday.getTime()
      ? tuesday
      : today.getTime() > monday.getTime()
        ? monday
        : new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const plannedSaturday =
    saturday.getTime() >= today.getTime()
      ? saturday
      : new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const plannedSunday =
    sunday.getTime() >= today.getTime()
      ? sunday
      : new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const scheduledTrainings = [
    // 1. Rex on Today (PLANNED)
    {
      id: 'train-rex-1',
      dogId: rex.id,
      goalId: 'goal-1',
      createdById: jan.id,
      date: today,
      status: TrainingStatus.PLANNED,
    },
    // 2. Rex earlier this week (COMPLETED)
    {
      id: 'train-rex-2',
      dogId: rex.id,
      goalId: 'goal-3',
      createdById: jan.id,
      date: pastDate,
      status: TrainingStatus.COMPLETED,
    },
    // 3. Rex on Weekend (PLANNED)
    {
      id: 'train-rex-3',
      dogId: rex.id,
      goalId: 'goal-2',
      createdById: jan.id,
      date: plannedSaturday,
      status: TrainingStatus.PLANNED,
    },
    // 4. Baryk on Weekend (PLANNED)
    {
      id: 'train-baryk-1',
      dogId: baryk.id,
      goalId: barykGoal.id,
      createdById: jan.id,
      date: plannedSunday,
      status: TrainingStatus.PLANNED,
    },
    // 5. Trainer's Argo on Today (PLANNED)
    {
      id: 'train-argo-1',
      dogId: argo.id,
      goalId: argoGoal.id,
      createdById: trainerId,
      date: today,
      status: TrainingStatus.PLANNED,
    },
  ];

  await prisma.scheduledTraining.deleteMany({
    where: {
      goalId: { in: ['goal-1', 'goal-2', 'goal-3', barykGoal.id, argoGoal.id] },
      id: { notIn: scheduledTrainings.map((s) => s.id) },
    },
  });

  for (const st of scheduledTrainings) {
    await prisma.scheduledTraining.upsert({
      where: { id: st.id },
      update: {
        date: st.date,
        status: st.status,
      },
      create: st,
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
