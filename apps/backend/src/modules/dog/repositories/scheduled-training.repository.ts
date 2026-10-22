import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainingStatus } from '@/generated/prisma/client';
import {
  ScheduledTraining,
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
}
