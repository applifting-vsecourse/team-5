import { PrismaService } from '@/core/prisma/prisma.service';
import { MetricLog } from '@/modules/dog/domain/training-metrics';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOwnerInputs(ownerId: string) {
    return this.prisma.dog.findMany({
      where: { ownerId, isArchived: false },
      select: {
        weeklyTarget: true,
        workoutLogs: {
          where: { status: 'COMPLETED' },
          select: { completedAt: true, successRate: true, status: true },
        },
      },
    });
  }

  async getInputs(
    dogId: string,
  ): Promise<{ weeklyTarget: number; workoutLogs: MetricLog[] }> {
    return this.prisma.dog.findUniqueOrThrow({
      where: { id: dogId },
      select: {
        weeklyTarget: true,
        workoutLogs: {
          where: { status: 'COMPLETED' },
          select: { completedAt: true, successRate: true, status: true },
        },
      },
    });
  }

  setWeeklyTarget(
    dogId: string,
    weeklyTarget: number,
  ): Promise<{ weeklyTarget: number }> {
    return this.prisma.dog.update({
      where: { id: dogId },
      data: { weeklyTarget },
      select: { weeklyTarget: true },
    });
  }
}
