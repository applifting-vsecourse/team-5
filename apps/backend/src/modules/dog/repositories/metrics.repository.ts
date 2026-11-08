import { PrismaService } from '@/core/prisma/prisma.service';
import { fromCalendarDate } from '@/modules/dog/domain/calendar-date';
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

  async getWeeklyPlan(
    scope: { dogId: string } | { ownerId: string },
    from: string,
    to: string,
  ) {
    const groups = await this.prisma.scheduledTraining.groupBy({
      by: ['status'],
      where: {
        date: { gte: fromCalendarDate(from), lte: fromCalendarDate(to) },
        ...('dogId' in scope
          ? { dogId: scope.dogId }
          : { dog: { ownerId: scope.ownerId, isArchived: false } }),
      },
      _count: true,
    });
    return {
      weeklyPlannedSessions: groups.reduce(
        (sum, group) => sum + group._count,
        0,
      ),
      weeklyCompletedSessions:
        groups.find((group) => group.status === 'COMPLETED')?._count ?? 0,
      weeklySkippedSessions:
        groups.find((group) => group.status === 'SKIPPED')?._count ?? 0,
    };
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
