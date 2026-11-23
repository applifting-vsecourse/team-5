import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

type Users = {
  trainerId: string;
  janId: string;
  petraId: string;
  tomasId: string;
};

type ShowcaseRecord = {
  id: string;
  dogId: string;
  ownerId: string;
  goalId: string;
  trainingId: string;
  title: string;
  discipline: string;
  daysAgo: number;
  data: Omit<
    Prisma.WorkoutLogUncheckedCreateInput,
    | 'id'
    | 'dogId'
    | 'goalId'
    | 'trainingId'
    | 'authorId'
    | 'title'
    | 'discipline'
    | 'completedAt'
    | 'scheduledTrainingId'
  >;
  messages: {
    id: string;
    authorId: string;
    minutesAfter: number;
    text: string;
  }[];
  // Who sees the record as "new reply" until they open it.
  unreadFor: string[];
};

/**
 * Sprint 4 demo data: sub-steps, record context (sleep, place, repeated
 * mistakes), video links, threads with unread replies, a plan-change badge
 * and the trainer's private notes. Every fixture has a stable id and is only
 * created when missing, so deploys never re-raise badges a viewer already
 * read or overwrite what someone changed while demoing.
 */
export async function seedShowcase(
  prisma: PrismaService,
  users: Users,
  now = new Date(),
): Promise<void> {
  const { trainerId, janId, petraId, tomasId } = users;
  await seedSubSteps(prisma);

  const records: ShowcaseRecord[] = [
    {
      id: 'showcase-rex-recall',
      dogId: 'dog-rex-1',
      ownerId: janId,
      goalId: 'seed-dog-rex-1-goal-0',
      trainingId: 'seed-dog-rex-1-goal-0-training-1',
      title: 'Prodloužení vzdálenosti',
      discipline: 'Poslušnost',
      daysAgo: 1,
      data: {
        status: 'COMPLETED',
        successRate: 60,
        rating: 3,
        focus: 'PARTIALLY',
        repeatedMistakes: 'YES',
        mistakeDetails: ['Reaguje až na druhý povel', 'Odbíhá za pachem'],
        sleepQuality: 'POOR',
        environment: 'OUTDOORS',
        note: 'V parku hodně psů. Na 15 metrů přišel jen napoprvé, pak čuchal u keře.',
        videoUrl:
          'https://www.youtube.com/results?search_query=p%C5%99ivol%C3%A1n%C3%AD+psa',
      },
      messages: [
        {
          id: 'showcase-rex-recall-msg-1',
          authorId: janId,
          minutesAfter: 25,
          text: 'Přikládám video. Mám se vrátit na kratší vzdálenost, nebo zkusit jiné místo?',
        },
        {
          id: 'showcase-rex-recall-msg-2',
          authorId: trainerId,
          minutesAfter: 140,
          text: 'Na videu je vidět, že pach vyhrává nad odměnou. Upravil jsem plán: přidal jsem krok s pískáním a lepší odměnou. Vzdálenost zatím 10 m.',
        },
      ],
      unreadFor: [janId],
    },
    {
      id: 'showcase-baryk-slalom',
      dogId: 'dog-baryk-1',
      ownerId: janId,
      goalId: 'seed-dog-baryk-1-goal-0',
      trainingId: 'seed-dog-baryk-1-goal-0-training-0',
      title: 'Základy v klidu',
      discipline: 'Agility',
      daysAgo: 2,
      data: {
        status: 'COMPLETED',
        successRate: 50,
        rating: 3,
        focus: 'YES',
        repeatedMistakes: 'PARTIALLY',
        sleepQuality: 'GOOD',
        environment: 'TRAINING_GROUND',
        note: 'Slalom zvládá do třetí branky, pak vybíhá ven.',
        videoUrl:
          'https://www.youtube.com/results?search_query=slalom+agility+pes',
      },
      messages: [
        {
          id: 'showcase-baryk-slalom-msg-1',
          authorId: janId,
          minutesAfter: 20,
          text: 'Vynechává třetí branku. Nemáme si slalom rozdělit na menší kousky?',
        },
      ],
      unreadFor: [trainerId],
    },
    {
      id: 'showcase-alik-search',
      dogId: 'dog-alik-1',
      ownerId: petraId,
      goalId: 'seed-dog-alik-1-goal-0',
      trainingId: 'seed-dog-alik-1-goal-0-training-0',
      title: 'Základy v klidu',
      discipline: 'Nosework',
      daysAgo: 3,
      data: {
        status: 'COMPLETED',
        successRate: 90,
        rating: 5,
        focus: 'YES',
        repeatedMistakes: 'NO',
        sleepQuality: 'GOOD',
        environment: 'HOME',
        note: 'Doma v obýváku našel všech 5 krabic, označení vleže.',
      },
      messages: [
        {
          id: 'showcase-alik-search-msg-1',
          authorId: petraId,
          minutesAfter: 15,
          text: 'Dnes to šlo skvěle, můžeme přidat další místnost?',
        },
        {
          id: 'showcase-alik-search-msg-2',
          authorId: trainerId,
          minutesAfter: 60,
          text: 'Ano, příště zkuste chodbu. Krabice nechte na stejné výšce.',
        },
        {
          id: 'showcase-alik-search-msg-3',
          authorId: petraId,
          minutesAfter: 95,
          text: 'Díky, domluveno.',
        },
      ],
      unreadFor: [],
    },
    {
      id: 'showcase-lucky-run',
      dogId: 'dog-lucky-1',
      ownerId: tomasId,
      goalId: 'seed-dog-lucky-1-goal-0',
      trainingId: 'seed-dog-lucky-1-goal-0-training-0',
      title: 'Základy v klidu',
      discipline: 'Canicross',
      daysAgo: 1,
      data: {
        status: 'COMPLETED',
        successRate: 70,
        rating: 4,
        focus: 'PARTIALLY',
        repeatedMistakes: 'NO',
        sleepQuality: 'GOOD',
        environment: 'OUTDOORS',
        note: 'Na trati potkal cyklisty, dvakrát zatáhl do strany.',
      },
      messages: [
        {
          id: 'showcase-lucky-run-msg-1',
          authorId: tomasId,
          minutesAfter: 10,
          text: 'Jak ho naučit ignorovat kola?',
        },
      ],
      unreadFor: [trainerId],
    },
  ];
  for (const record of records) await seedRecord(prisma, record, now);

  await seedPlanChangeBadge(prisma, janId);
  await seedTrainerNotes(prisma, { trainerId, janId, petraId }, now);
}

/**
 * Rex's recall step is split into three sub-steps (#67). Baryk's slalom is
 * left whole on purpose: the trainer splits it live from Jan's question.
 */
async function seedSubSteps(prisma: PrismaService): Promise<void> {
  const splits = [
    {
      parentId: 'seed-dog-rex-1-goal-0-training-1-step-1',
      parts: [
        [
          'Přivolání na 5 m s píšťalkou',
          'Jeden hvizd, okamžitě odměna z ruky.',
          '5 z 5 pokusů.',
          3,
        ],
        [
          'Přivolání od pachové stopy',
          'Pomocník položí pamlsek na zem, volej ve chvíli, kdy pes čuchá.',
          '4 z 5 pokusů.',
          3,
        ],
        [
          'Přivolání na 10 m v parku',
          'Volej, jen když si jsi jistý úspěchem.',
          '4 z 5 pokusů.',
          4,
        ],
      ],
    },
  ] as const;
  for (const { parentId, parts } of splits) {
    const parent = await prisma.planBlock.findUnique({
      where: { id: parentId },
    });
    if (!parent) continue;
    // Someone already split or edited this step by hand: leave it alone.
    if (await prisma.planBlock.count({ where: { parentId } })) continue;
    await prisma.planBlock.createMany({
      data: parts.map(
        ([title, instruction, criterion, durationMinutes], position) => ({
          id: `showcase-${parentId}-sub-${position}`,
          goalId: parent.goalId,
          trainingId: parent.trainingId,
          parentId,
          position,
          title,
          instruction,
          criterion,
          durationMinutes,
        }),
      ),
      skipDuplicates: true,
    });
  }
}

async function seedRecord(
  prisma: PrismaService,
  record: ShowcaseRecord,
  now: Date,
): Promise<void> {
  if (await prisma.workoutLog.findUnique({ where: { id: record.id } })) return;
  const training = await prisma.goalTraining.findUnique({
    where: { id: record.trainingId },
  });
  if (!training) return;
  const date = await freePastDay(
    prisma,
    record.ownerId,
    record.dogId,
    record.daysAgo,
    now,
  );
  const completedAt = new Date(date.getTime() + 17 * 60 * MINUTE_MS);
  await prisma.$transaction(async (tx) => {
    const termId = `${record.id}-term`;
    await tx.scheduledTraining.create({
      data: {
        id: termId,
        dogId: record.dogId,
        goalId: record.goalId,
        trainingId: record.trainingId,
        date,
        status: 'COMPLETED',
      },
    });
    await tx.workoutLog.create({
      data: {
        ...record.data,
        id: record.id,
        dogId: record.dogId,
        goalId: record.goalId,
        trainingId: record.trainingId,
        authorId: record.ownerId,
        title: record.title,
        discipline: record.discipline,
        completedAt,
        scheduledTrainingId: termId,
      },
    });
    for (const message of record.messages) {
      await tx.trainingMessage.create({
        data: {
          id: message.id,
          workoutLogId: record.id,
          authorId: message.authorId,
          text: message.text,
          createdAt: new Date(
            completedAt.getTime() + message.minutesAfter * MINUTE_MS,
          ),
        },
      });
    }
    if (record.unreadFor.length)
      await tx.trainingReply.createMany({
        data: record.unreadFor.map((recipientId) => ({
          id: `${record.id}-unread-${recipientId}`,
          recipientId,
          workoutLogId: record.id,
          kind: 'MESSAGE',
        })),
      });
  });
}

/** The latest past day on which the owner trains at most once and not with this dog. */
async function freePastDay(
  prisma: PrismaService,
  ownerId: string,
  dogId: string,
  daysAgo: number,
  now: Date,
): Promise<Date> {
  const today = fromCalendarDate(todayInAppZone(now));
  for (let offset = daysAgo; offset < daysAgo + 30; offset++) {
    const date = new Date(today.getTime() - offset * DAY_MS);
    const terms = await prisma.scheduledTraining.findMany({
      where: { date, dog: { ownerId } },
      select: { dogId: true },
    });
    if (terms.length < 2 && !terms.some((term) => term.dogId === dogId))
      return date;
  }
  return new Date(today.getTime() - daysAgo * DAY_MS);
}

/** The trainer changed Rex's next recall training (#84 "Trenér změnil plán"). */
async function seedPlanChangeBadge(
  prisma: PrismaService,
  janId: string,
): Promise<void> {
  const id = 'showcase-rex-plan-changed';
  if (await prisma.trainingReply.findUnique({ where: { id } })) return;
  const next = await prisma.scheduledTraining.findFirst({
    where: {
      trainingId: 'seed-dog-rex-1-goal-0-training-1',
      status: 'PLANNED',
    },
    orderBy: { date: 'asc' },
  });
  if (!next) return;
  await prisma.trainingReply.create({
    data: {
      id,
      recipientId: janId,
      scheduledTrainingId: next.id,
      kind: 'PLAN_CHANGED',
    },
  });
}

/** Private notes only the trainer sees (#236). */
async function seedTrainerNotes(
  prisma: PrismaService,
  {
    trainerId,
    janId,
    petraId,
  }: { trainerId: string; janId: string; petraId: string },
  now: Date,
): Promise<void> {
  const today = fromCalendarDate(todayInAppZone(now));
  const day = (offset: number): Date =>
    new Date(today.getTime() - offset * DAY_MS);
  const notes = [
    {
      id: 'showcase-note-jan',
      clientId: janId,
      dogId: null,
      date: day(12),
      title: 'Domluva s Janem',
      text: 'Trénuje hlavně ráno před prací, víkendy na cvičáku. Chce se do jara připravit na zkoušku ZZO s Rexem.',
      isPinned: true,
    },
    {
      id: 'showcase-note-baryk',
      clientId: janId,
      dogId: 'dog-baryk-1',
      date: day(5),
      title: 'Pozor na levé přední koleno',
      text: 'Po říjnovém zranění jen krátké série na áčku, max. 5 opakování. Při kulhání trénink ukončit.',
      isPinned: true,
    },
    {
      id: 'showcase-note-alik',
      clientId: petraId,
      dogId: 'dog-alik-1',
      date: day(8),
      title: 'Motivace',
      text: 'Alík nejlíp pracuje za sýr, granule ho nebaví. Venku zatím jen na vodítku.',
      isPinned: false,
    },
  ];
  for (const { id, ...note } of notes) {
    await prisma.trainerNote.upsert({
      where: { id },
      update: {},
      create: { id, trainerId, ...note },
    });
  }
}
