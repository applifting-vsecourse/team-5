import { PrismaService } from '@/core/prisma/prisma.service';
import {
  PlanBlock,
  Prisma,
  ScheduledTraining,
  TrainingReplyKind,
  WorkoutLog,
} from '@/generated/prisma/client';
import { presentTrainingMessage } from '@/modules/dog/domain/training-message';
import { Injectable, NotFoundException } from '@nestjs/common';
import { accessibleDogWhere } from './dog.repository';

// Use the same live access rules as DogRepository, including after a
// collaboration ends. A stale notification never grants access to a record.
const replyDogAccess = accessibleDogWhere;

const dogSummary = { id: true, name: true, color: true } as const;
type DogSummary = { id: string; name: string; color: number };
type ReplyPlan = {
  id: string;
  title: string;
  principle: string | null;
  blocks: PlanBlock[];
};
type UnreadTrainingReply = {
  id: string;
  kind: TrainingReplyKind;
  createdAt: Date;
  workoutLog: {
    id: string;
    title: string;
    completedAt: Date;
    dog: DogSummary;
  } | null;
  scheduledTraining: {
    id: string;
    date: Date;
    goal: { title: string };
    dog: DogSummary;
  } | null;
};
type TrainingRecordDetail = WorkoutLog & {
  goal: ReplyPlan | null;
  isOwner: boolean;
  messages: ReturnType<typeof presentTrainingMessage>[];
  unreadReplyIds: string[];
  planChanged: boolean;
};
type TrainingPlanDetail = ScheduledTraining & {
  dog: DogSummary;
  goal: ReplyPlan;
  unreadReplyIds: string[];
};

export type PlanReplyContext = { actorId: string; replyToActivityId?: string };

// Called inside the SAME transaction as the plan edit. A bad source record
// aborts the edit, and a failed notification cannot leave an unannounced edit.
export async function recordPlanReply(
  tx: Prisma.TransactionClient,
  goalId: string,
  context?: PlanReplyContext,
): Promise<void> {
  if (!context) return;
  const goal = await tx.trainingGoal.findFirst({
    where: { id: goalId, dog: replyDogAccess(context.actorId) },
    select: { dog: { select: { ownerId: true } } },
  });
  if (!goal) throw new NotFoundException('Goal not found');
  if (context.replyToActivityId) {
    const source = await tx.workoutLog.findFirst({
      where: { id: context.replyToActivityId, goalId },
      select: { id: true },
    });
    if (!source) throw new NotFoundException('Training record not found');
  }
  if (goal.dog.ownerId === context.actorId) return;
  const trainings = await tx.scheduledTraining.findMany({
    where: { goalId, status: 'PLANNED' },
    select: { id: true },
  });
  const targets = trainings.length ? trainings : [{ id: null }];
  for (const target of targets) {
    if (!target.id && !context.replyToActivityId) continue;
    await tx.trainingReply.create({
      data: {
        recipientId: goal.dog.ownerId,
        workoutLogId: context.replyToActivityId,
        scheduledTrainingId: target.id,
        kind: 'PLAN_CHANGED',
      },
    });
  }
}

@Injectable()
export class TrainingReplyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUnread(userId: string): Promise<UnreadTrainingReply[]> {
    const dog = replyDogAccess(userId);
    const replies = await this.prisma.trainingReply.findMany({
      where: {
        recipientId: userId,
        OR: [{ workoutLog: { dog } }, { scheduledTraining: { dog } }],
      },
      select: {
        id: true,
        kind: true,
        createdAt: true,
        workoutLog: {
          select: {
            id: true,
            title: true,
            completedAt: true,
            dog: { select: dogSummary },
          },
        },
        scheduledTraining: {
          select: {
            id: true,
            date: true,
            goal: { select: { title: true } },
            workoutLog: { select: { id: true, title: true, completedAt: true, dog: { select: dogSummary } } },
            dog: { select: dogSummary },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return replies.map((reply) => ({ ...reply, workoutLog: reply.workoutLog ?? reply.scheduledTraining?.workoutLog ?? null }));
  }

  async getRecord(
    userId: string,
    dogId: string,
    activityId: string,
  ): Promise<TrainingRecordDetail> {
    // The messages and the IDs we acknowledge must describe the same snapshot.
    return this.prisma.$transaction(
      async (tx) => {
        const activity = await tx.workoutLog.findFirst({
          where: { id: activityId, dogId, dog: replyDogAccess(userId) },
          include: {
            dog: { select: { ownerId: true } },
            goal: {
              select: {
                id: true,
                title: true,
                principle: true,
                blocks: { orderBy: { position: 'asc' } },
              },
            },
            messages: {
              include: { author: { select: { id: true, name: true } } },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            },
          },
        });
        if (!activity) throw new NotFoundException('Training record not found');
        const unreadReplies = await tx.trainingReply.findMany({
          where: {
            recipientId: userId,
            OR: [
              { workoutLogId: activity.id },
              ...(activity.scheduledTrainingId ? [{ scheduledTrainingId: activity.scheduledTrainingId }] : []),
            ],
          },
          select: { id: true, kind: true },
        });
        const { dog, messages, ...record } = activity;
        return {
          ...record,
          isOwner: dog.ownerId === userId,
          messages: messages.map(presentTrainingMessage),
          unreadReplyIds: unreadReplies.map((reply) => reply.id),
          planChanged: unreadReplies.some(
            (reply) => reply.kind === 'PLAN_CHANGED',
          ),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async getTrainingPlan(
    userId: string,
    trainingId: string,
  ): Promise<TrainingPlanDetail> {
    return this.prisma.$transaction(
      async (tx) => {
        const training = await tx.scheduledTraining.findFirst({
          where: { id: trainingId, dog: replyDogAccess(userId) },
          include: {
            dog: { select: dogSummary },
            goal: {
              select: {
                id: true,
                title: true,
                principle: true,
                blocks: { orderBy: { position: 'asc' } },
              },
            },
            unreadReplies: {
              where: { recipientId: userId },
              select: { id: true },
            },
          },
        });
        if (!training) throw new NotFoundException('Training not found');
        const { unreadReplies, ...plan } = training;
        return {
          ...plan,
          unreadReplyIds: unreadReplies.map((reply) => reply.id),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    const dog = replyDogAccess(userId);
    await this.prisma.trainingReply.deleteMany({
      where: {
        id: { in: ids },
        recipientId: userId,
        OR: [{ workoutLog: { dog } }, { scheduledTraining: { dog } }],
      },
    });
  }

  async sendMessage(
    userId: string,
    dogId: string,
    activityId: string,
    text: string,
  ): Promise<ReturnType<typeof presentTrainingMessage>> {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.workoutLog.findFirst({
        where: { id: activityId, dogId, dog: replyDogAccess(userId) },
        include: {
          dog: {
            include: { shares: true },
          },
        },
      });
      if (!activity) throw new NotFoundException('Training record not found');
      const message = await tx.trainingMessage.create({
        data: { workoutLogId: activityId, authorId: userId, text },
        include: { author: { select: { id: true, name: true } } },
      });
      const recipients =
        userId === activity.dog.ownerId
          ? activity.dog.shares.map((share) => share.trainerId)
          : [activity.dog.ownerId];
      await tx.trainingReply.createMany({
        data: [...new Set(recipients)]
          .filter((id) => id !== userId)
          .map((recipientId) => ({
            recipientId,
            workoutLogId: activityId,
            scheduledTrainingId: activity.scheduledTrainingId,
            kind: 'MESSAGE' as const,
          })),
      });
      return presentTrainingMessage(message);
    });
  }
}
