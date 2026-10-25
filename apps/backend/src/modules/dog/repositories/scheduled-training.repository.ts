import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FocusLevel,
  MistakeLevel,
  TrainingStatus,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import {
  ScheduledTraining,
  ScheduledTrainingDetail,
  WeekTraining,
} from '@/modules/dog/domain/scheduled-training';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduledTrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // The week is the owner's own view (#72): trainings of their active dogs.
  // A trainer sees clients' dogs elsewhere (Klienti), not in this week.
  async getOwnerTrainingsBetween(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<WeekTraining[]> {
    return this.prisma.scheduledTraining.findMany({
      where: {
        date: { gte: from, lte: to },
        dog: { ownerId, isArchived: false },
      },
      include: {
        dog: { select: { id: true, name: true, color: true } },
        goal: {
          select: {
            id: true,
            title: true,
            blocks: {
              select: { id: true, title: true },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTrainingsByGoalId(goalId: string): Promise<ScheduledTraining[]> {
    return this.prisma.scheduledTraining.findMany({
      where: { goalId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTrainingById(id: string): Promise<ScheduledTrainingDetail | null> {
    return this.prisma.scheduledTraining.findUnique({
      where: { id },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            color: true,
            shares: {
              select: { id: true, trainerId: true },
            },
          },
        },
        goal: {
          select: {
            id: true,
            title: true,
            blocks: {
              select: {
                id: true,
                position: true,
                title: true,
                instruction: true,
                criterion: true,
              },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    });
  }

  // Returns null when the goal already has a planned training.
  // A transaction alone does not stop two quick clicks: under READ COMMITTED
  // both would see "nothing planned" and insert. Locking the goal row first
  // makes concurrent requests for the same goal wait for each other, so the
  // second one sees the first one's training.
  async createPlannedTraining(data: {
    goalId: string;
    dogId: string;
    createdById: string;
    date: Date;
  }): Promise<ScheduledTraining | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "training_goal" WHERE "id" = ${data.goalId} FOR UPDATE`;

      const planned = await tx.scheduledTraining.findFirst({
        where: { goalId: data.goalId, status: TrainingStatus.PLANNED },
        select: { id: true },
      });
      if (planned) return null;

      return tx.scheduledTraining.create({
        data: {
          goal: { connect: { id: data.goalId } },
          dog: { connect: { id: data.dogId } },
          createdBy: { connect: { id: data.createdById } },
          date: data.date,
        },
      });
    });
  }

  // Returns null when the training is no longer planned. The status check is
  // part of the update itself, so a training completed in the meantime
  // (e.g. on another device) is never moved.
  async movePlannedTraining(
    id: string,
    date: Date,
  ): Promise<ScheduledTraining | null> {
    const { count } = await this.prisma.scheduledTraining.updateMany({
      where: { id, status: TrainingStatus.PLANNED },
      data: { date },
    });
    if (count === 0) return null;
    return this.prisma.scheduledTraining.findUnique({ where: { id } });
  }

  // A dog's trainings still to be done, for its Activities (#74): the owner
  // and a trainer with a share see the day each one is planned for.
  async getPlannedTrainingsByDogId(dogId: string): Promise<WeekTraining[]> {
    return this.prisma.scheduledTraining.findMany({
      where: { dogId, status: TrainingStatus.PLANNED },
      include: {
        dog: { select: { id: true, name: true, color: true } },
        goal: {
          select: {
            id: true,
            title: true,
            blocks: {
              select: { id: true, title: true },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async completeTraining(
    trainingId: string,
    authorId: string,
    data: {
      successRate?: number | null;
      focus?: FocusLevel | null;
      repeatedMistakes?: MistakeLevel | null;
      note?: string | null;
    },
  ): Promise<WorkoutLog | null> {
    return this.prisma.$transaction(async (tx) => {
      // The status check is part of the UPDATE, so of two quick submits
      // (double click, a retry on a weak signal) only one completes the
      // training and writes a record. Null: it is no longer planned.
      const { count } = await tx.scheduledTraining.updateMany({
        where: { id: trainingId, status: TrainingStatus.PLANNED },
        data: { status: TrainingStatus.COMPLETED },
      });
      if (count === 0) return null;

      const training = await tx.scheduledTraining.findUniqueOrThrow({
        where: { id: trainingId },
        include: {
          goal: {
            select: {
              id: true,
              title: true,
              discipline: true,
            },
          },
        },
      });

      return tx.workoutLog.create({
        data: {
          dog: { connect: { id: training.dogId } },
          goal: { connect: { id: training.goalId } },
          author: { connect: { id: authorId } },
          title: training.goal.title,
          discipline: training.goal.discipline ?? null,
          status: WorkoutStatus.COMPLETED,
          completedAt: new Date(),
          successRate: data.successRate ?? null,
          focus: data.focus ?? null,
          repeatedMistakes: data.repeatedMistakes ?? null,
          note: data.note?.trim() || null,
        },
      });
    });
  }
}
