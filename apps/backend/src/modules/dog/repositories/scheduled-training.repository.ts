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
import { Injectable, NotFoundException } from '@nestjs/common';

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

  async completeTraining(
    trainingId: string,
    authorId: string,
    data: {
      successRate?: number | null;
      focus?: FocusLevel | null;
      repeatedMistakes?: MistakeLevel | null;
      note?: string | null;
    },
  ): Promise<WorkoutLog> {
    return this.prisma.$transaction(async (tx) => {
      const training = await tx.scheduledTraining.findUnique({
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
      if (!training) {
        throw new NotFoundException(`Training with ID ${trainingId} not found`);
      }

      await tx.scheduledTraining.update({
        where: { id: trainingId },
        data: { status: TrainingStatus.COMPLETED },
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
