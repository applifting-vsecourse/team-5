import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  toCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { Injectable } from '@nestjs/common';

export const replyDogAccess = (userId: string) => ({
  isArchived: false,
  OR: [{ ownerId: userId }, { shares: { some: { trainerId: userId } } }],
});
const dogSummary = { id: true, name: true, color: true } as const;

// Run in the plan mutation's transaction, scoped to the concrete training definition.
export async function recordPlanReply(
  tx: Prisma.TransactionClient,
  trainingId: string,
  actorId?: string,
) {
  if (!actorId) return;
  const training = await tx.goalTraining.findFirst({
    where: { id: trainingId, goal: { dog: replyDogAccess(actorId) } },
    include: { goal: { select: { dog: { select: { ownerId: true } } } } },
  });
  if (!training || training.goal.dog.ownerId === actorId) return;
  const sessions = await tx.scheduledTraining.findMany({
    where: { trainingId, status: 'PLANNED' },
    select: { id: true, date: true },
    orderBy: { date: 'asc' },
  });
  const today = todayInAppZone();
  const next =
    sessions.find((session) => toCalendarDate(session.date) >= today) ??
    sessions[0];
  if (!next) return;
  await tx.trainingReply.create({
    data: {
      recipientId: training.goal.dog.ownerId,
      scheduledTrainingId: next.id,
      kind: 'PLAN_CHANGED',
    },
  });
}

export async function recordMessageReply(
  tx: Prisma.TransactionClient,
  workoutLogId: string,
  authorId: string,
) {
  const record = await tx.workoutLog.findUniqueOrThrow({
    where: { id: workoutLogId },
    include: { dog: { include: { shares: true } } },
  });
  const recipients =
    authorId === record.dog.ownerId
      ? record.dog.shares.map((share) => share.trainerId)
      : [record.dog.ownerId];
  await tx.trainingReply.createMany({
    data: [...new Set(recipients)]
      .filter((id) => id !== authorId)
      .map((recipientId) => ({ recipientId, workoutLogId, kind: 'MESSAGE' })),
  });
}

@Injectable()
export class TrainingReplyRepository {
  constructor(private readonly prisma: PrismaService) {}
  unread(userId: string) {
    const dog = replyDogAccess(userId);
    return this.prisma.trainingReply.findMany({
      where: {
        recipientId: userId,
        OR: [{ workoutLog: { dog } }, { scheduledTraining: { dog } }],
      },
      include: {
        workoutLog: {
          select: { id: true, title: true, dog: { select: dogSummary } },
        },
        scheduledTraining: {
          select: {
            id: true,
            date: true,
            training: { select: { id: true, title: true } },
            dog: { select: dogSummary },
            workoutLog: { select: { id: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
  async acknowledge(userId: string, ids: string[]) {
    const dog = replyDogAccess(userId);
    await this.prisma.trainingReply.deleteMany({
      where: {
        id: { in: ids },
        recipientId: userId,
        OR: [{ workoutLog: { dog } }, { scheduledTraining: { dog } }],
      },
    });
    return { ok: true };
  }
}
