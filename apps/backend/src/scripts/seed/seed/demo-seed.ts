import { Prisma, PrismaClient, UserRole } from '@/generated/prisma/client';
import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { hashPassword } from 'better-auth/crypto';

export const DEMO_PASSWORD = 'TrainLoop123!';
const DAY = 86_400_000;
const names = [
  'Anna Nováková',
  'Petr Svoboda',
  'Lucie Černá',
  'Tomáš Dvořák',
  'Klára Veselá',
  'Martin Procházka',
  'Eva Kučerová',
  'David Horák',
  'Tereza Němcová',
  'Jakub Pokorný',
  'Barbora Malá',
  'Nový psovod',
];
const dogNames = [
  'Bety',
  'Max',
  'Luna',
  'Štěně',
  'Rony',
  'Asta',
  'Charlie',
  'Nela',
  'Bára',
  'Ben',
  'Daisy',
  'Monty',
  'Kira',
  'Sam',
  'Jessie',
  'Toby',
  'Sára',
  'Fido',
  'Mia',
  'Bruno',
  'Amy',
  'Bert',
  'Dobby',
  'Žofka',
  'Argo',
];
const disciplines = [
  'Poslušnost',
  'Agility',
  'Nosework',
  'Canicross',
  'Rally obedience',
  'Dogdancing',
];
const titles = [
  'Spolehlivé přivolání i mezi ostatními psy',
  'Klidné čekání na startu',
  'Plynulá práce bez navádění rukou',
  'Samostatné provedení v novém prostředí',
];

/** Explicit demo reset: only reserved demo IDs are updated; no table truncation. */
export async function seedDemoDatabase(
  prisma: PrismaClient,
  now = new Date(),
): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed is disabled in production.');
  }
  const today = fromCalendarDate(todayInAppZone(now));
  const day = (offset: number): Date =>
    new Date(today.getTime() + offset * DAY);
  const password = await hashPassword(DEMO_PASSWORD);

  await prisma.$transaction(
    async (tx) => {
      const addUser = async (
        key: string,
        name: string,
        role: UserRole,
      ): Promise<string> => {
        const id = `demo-user-${key}`;
        const email = `${key}@demo.trainloop.test`;
        // Refuse a collision instead of taking over a manually registered account.
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing && existing.id !== id)
          throw new Error(`Demo email already in use: ${email}`);
        const data = {
          name,
          email,
          role,
          emailVerified: true,
          username: `demo_${key.replaceAll('-', '_')}`,
          updatedAt: now,
        };
        await tx.user.upsert({
          where: { id },
          create: { id, ...data, createdAt: day(-100) },
          update: data,
        });
        const account = {
          userId: id,
          accountId: id,
          providerId: 'credential',
          issuer: 'local:credential',
          password,
          updatedAt: now,
        };
        await tx.account.upsert({
          where: { id: `demo-account-${key}` },
          create: {
            id: `demo-account-${key}`,
            ...account,
            createdAt: day(-100),
          },
          update: account,
        });
        return id;
      };

      const trainer = await addUser('trainer', 'Marek Trenér', 'trainer');
      const secondTrainer = await addUser(
        'trainer-2',
        'Jana Trenérka',
        'trainer',
      );
      await addUser('trainer-empty', 'Trenér bez klientů', 'trainer');
      const owners: string[] = [];
      for (const [i, name] of names.entries()) {
        const owner = await addUser(
          i === 0 ? 'owner' : i === 11 ? 'owner-empty' : `owner-${i + 1}`,
          name,
          'user',
        );
        owners.push(owner);
        if (i < 10) {
          await tx.clientConnection.upsert({
            where: {
              trainerId_clientId: { trainerId: trainer, clientId: owner },
            },
            create: { trainerId: trainer, clientId: owner },
            update: {},
          });
        }
      }
      await tx.clientConnection.upsert({
        where: {
          trainerId_clientId: { trainerId: secondTrainer, clientId: owners[0] },
        },
        create: { trainerId: secondTrainer, clientId: owners[0] },
        update: {},
      });

      for (const [i, name] of dogNames.entries()) {
        const dogId = `demo-dog-${i}`;
        const ownerId =
          i === 24
            ? owners[10]
            : owners[i < 4 ? 0 : Math.floor((i - 4) / 2) + 1];
        const isArchived = i === 9 || i === 19;
        const empty = i === 3;
        const categories = empty
          ? []
          : [
              disciplines[i % disciplines.length],
              disciplines[(i + 1) % disciplines.length],
            ];
        const data = {
          name,
          ownerId,
          breed:
            i % 5 === 0
              ? null
              : [
                  'Border kolie',
                  'Kříženec',
                  'Německý ovčák',
                  'Labradorský retrívr',
                ][i % 4],
          color: (i % 6) + 1,
          weeklyTarget: (i % 7) + 1,
          isArchived,
          disciplines: categories,
        };
        await tx.dog.upsert({
          where: { id: dogId },
          create: { id: dogId, ...data, createdAt: day(-100) },
          update: data,
        });
        if (i < 22 && i % 4 !== 3) {
          await tx.dogShare.upsert({
            where: { dogId_trainerId: { dogId, trainerId: trainer } },
            create: { dogId, trainerId: trainer },
            update: {},
          });
        }
        if (i === 0) {
          await tx.dogShare.upsert({
            where: { dogId_trainerId: { dogId, trainerId: secondTrainer } },
            create: { dogId, trainerId: secondTrainer },
            update: {},
          });
        }
        for (let n = 0; n < (empty ? 0 : 3); n++) {
          const note = {
            dogId,
            date: day(-n * 7),
            title: [
              'Seminář poslušnosti',
              'Zdraví a odpočinek',
              'Pozorování psovoda',
            ][n],
            text: [
              'Poznámky ze semináře: zkrátit jednotlivé série a odměňovat přesněji.\nPříště vyzkoušet klidnější prostředí.',
              'Dnes méně energie. Po konzultaci zařazujeme odpočinek.',
              'Soukromý deník psovoda – sledovat reakci na změnu odměny.',
            ][n],
            createdAt: day(-n * 7),
          };
          await tx.dogNote.upsert({
            where: { id: `${dogId}-note-${n}` },
            create: { id: `${dogId}-note-${n}`, ...note },
            update: note,
          });
        }
        if (empty) continue;
        await seedDogHistory(tx, {
          dogId,
          ownerId,
          trainer,
          i,
          isArchived,
          categories,
          day,
        });
      }
      for (const [code, expires, used] of [
        ['DMLIVE', 7, false],
        ['DMOLD1', -1, false],
        ['DMUSED', 7, true],
      ] as const) {
        const data = {
          trainerId: trainer,
          expiresAt: day(expires),
          usedAt: used ? day(-2) : null,
        };
        await tx.invitation.upsert({
          where: { code },
          create: { id: `demo-invite-${code}`, code, ...data },
          update: data,
        });
      }
    },
    { timeout: 180_000 },
  );
  console.log(
    'Demo seed ready: 15 accounts, 25 dogs. Login: owner@demo.trainloop.test / trainer@demo.trainloop.test; password: ' +
      DEMO_PASSWORD,
  );
}

type DogScenario = {
  dogId: string;
  ownerId: string;
  trainer: string;
  i: number;
  isArchived: boolean;
  categories: string[];
  day: (offset: number) => Date;
};

async function seedDogHistory(
  tx: Prisma.TransactionClient,
  { dogId, ownerId, trainer, i, isArchived, categories, day }: DogScenario,
): Promise<void> {
  for (let g = 0; g < 4; g++) {
    const goalId = `${dogId}-goal-${g}`;
    const status =
      g < 2 ? 'ACTIVE' : g === 2 ? 'COMPLETED' : i % 2 ? 'PAUSED' : 'ARCHIVED';
    const discipline = categories[g % 2];
    const goal = {
      dogId,
      createdById: i % 2 ? trainer : ownerId,
      title: titles[g],
      discipline,
      status,
      order: g,
      principle: 'Krátké série, jasný signál a odměna ve správný okamžik.',
      criterion:
        'Úspěšné provedení alespoň v 8 z 10 pokusů ve dvou prostředích.',
    } as const;
    await tx.trainingGoal.upsert({
      where: { id: goalId },
      create: { id: goalId, ...goal, createdAt: day(-90) },
      update: goal,
    });
    // One goal without a plan for the editor's empty state.
    if (i === 0 && g === 1) continue;
    for (let t = 0; t < 2; t++) {
      const trainingId = `${goalId}-training-${t}`;
      const training = {
        goalId,
        title: t ? 'Práce v rušném prostředí' : 'Základy na klidném místě',
        position: t,
        isArchived: g === 3 && t === 1,
      };
      await tx.goalTraining.upsert({
        where: { id: trainingId },
        create: { id: trainingId, ...training },
        update: training,
      });
      for (let s = 0; s < 3; s++) {
        const step = {
          goalId,
          trainingId,
          position: t * 3 + s,
          title: [
            'Navázání kontaktu',
            'Opakování s rušivými vlivy',
            'Samostatné provedení a odměna',
          ][s],
          instruction:
            'Připravte odměnu. Proveďte 5 opakování, pak krátká pauza.\nPři ztrátě soustředění snižte obtížnost.',
          criterion: 'Čtyři úspěšné pokusy z pěti bez dalšího povelu.',
          outcome: s === 0 ? 'MASTERED' : null,
        } as const;
        await tx.planBlock.upsert({
          where: { id: `${trainingId}-step-${s}` },
          create: { id: `${trainingId}-step-${s}`, ...step },
          update: step,
        });
      }
    }
    await tx.trainingGoal.update({
      where: { id: goalId },
      data: { currentStepId: `${goalId}-training-0-step-1` },
    });
    // Eight weeks of history plus the following two weeks. Stable IDs move with today.
    for (let offset = -56; offset <= 14; offset++) {
      if (
        g > 1 ||
        (offset < 0 && (offset + i + g) % 3 !== 0) ||
        (offset >= 0 && (isArchived || offset % 2 !== g))
      )
        continue;
      const id = `${goalId}-scheduled-${offset}`;
      const trainingId = `${goalId}-training-${Math.abs(offset) % 2}`;
      const skipped = offset < 0 && Math.abs(offset) % 5 === 0;
      const state = offset >= 0 ? 'PLANNED' : skipped ? 'SKIPPED' : 'COMPLETED';
      // Keep a real completion made while testing a demo plan, including its date.
      const existingLog = await tx.workoutLog.findUnique({
        where: { scheduledTrainingId: id },
        select: { id: true },
      });
      if (existingLog && existingLog.id !== `${id}-log`) continue;
      const schedule = {
        dogId,
        goalId,
        trainingId,
        createdById: ownerId,
        date: day(offset),
        status: state,
      } as const;
      await tx.scheduledTraining.upsert({
        where: { id },
        create: { id, ...schedule },
        update: schedule,
      });
      if (offset >= 0) continue;
      const logId = `${id}-log`;
      const log = {
        id: logId,
        dogId,
        goalId,
        trainingId,
        authorId: ownerId,
        scheduledTrainingId: id,
        title: titles[g],
        discipline,
        status: skipped ? 'SKIPPED' : 'COMPLETED',
        completedAt: new Date(day(offset).getTime() + 12 * 3_600_000),
        createdAt: day(offset),
        successRate: skipped ? null : (Math.abs(offset + i) % 11) * 10,
        rating: skipped ? null : (Math.abs(offset + i) % 5) + 1,
        focus: skipped
          ? null
          : (['YES', 'PARTIALLY', 'NO'] as const)[Math.abs(offset) % 3],
        repeatedMistakes: skipped
          ? null
          : (['NO', 'PARTIALLY', 'YES'] as const)[i % 3],
        note: skipped
          ? null
          : 'První série byla obtížná, po pauze se soustředění zlepšilo.\nPříště začít jednodušším krokem.',
        skipReason: skipped ? 'Odpočinek po náročném víkendu.' : null,
        videoUrl:
          !skipped && offset % 4 === 0
            ? 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
            : null,
      } as const;
      await tx.workoutLog.upsert({
        where: { id: logId },
        create: log,
        update: log,
      });
      if (!skipped && offset >= -12 && i % 4 !== 3 && i < 22) {
        for (let m = 0; m < (offset % 2 ? 1 : 3); m++) {
          const message = {
            id: `${logId}-message-${m}`,
            workoutLogId: logId,
            authorId: m === 1 ? trainer : ownerId,
            text: [
              'Můžeme příště přidat větší vzdálenost?',
              'Ano, nejdřív ale upevněte klidný start. Přidejte jen dva kroky.',
              'Děkuji, vyzkoušíme to v další sérii.',
            ][m],
            createdAt: new Date(day(offset).getTime() + (13 + m) * 3_600_000),
          };
          await tx.trainingMessage.upsert({
            where: { id: message.id },
            create: message,
            update: message,
          });
        }
      }
    }
  }
  // A free activity without a goal, with deliberately absent optional metrics.
  const free = {
    dogId,
    authorId: ownerId,
    title: 'Volný trénink v parku',
    completedAt: day(-2),
    note: 'Krátké opakování mimo plán.',
  };
  await tx.workoutLog.upsert({
    where: { id: `${dogId}-free-log` },
    create: { id: `${dogId}-free-log`, ...free },
    update: free,
  });
}
