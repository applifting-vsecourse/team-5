import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainingStatus } from '@/generated/prisma/client';
import { ScheduledTraining } from '@/modules/dog/domain/scheduled-training';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduledTrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTrainingsByGoalId(goalId: string): Promise<ScheduledTraining[]> {
    return this.prisma.scheduledTraining.findMany({
      where: { goalId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Returns null when the goal already has a planned training: the check and
  // the insert run in one transaction, so two quick clicks cannot plan twice.
  async createPlannedTraining(data: {
    goalId: string;
    dogId: string;
    createdById: string;
    date: Date;
  }): Promise<ScheduledTraining | null> {
    return this.prisma.$transaction(async (tx) => {
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
