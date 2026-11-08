import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  HistoryFilters,
  historyMonthRange,
} from '@/modules/dog/domain/history-period';
import { Injectable } from '@nestjs/common';

export function accessibleDogWhere(userId: string): Prisma.DogWhereInput {
  return {
    isArchived: false,
    OR: [{ ownerId: userId }, { shares: { some: { trainerId: userId } } }],
  };
}

@Injectable()
export class HistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  accessibleDogs(userId: string) {
    return this.prisma.dog.findMany({
      where: accessibleDogWhere(userId),
      select: { id: true, name: true, color: true, ownerId: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async page(userId: string, query: HistoryFilters, summaryMonth: string) {
    const page = query.page ?? 1,
      pageSize = query.pageSize ?? 5;
    const scope: Prisma.WorkoutLogWhereInput = {
      dog: accessibleDogWhere(userId),
      ...(query.dogId ? { dogId: query.dogId } : {}),
      ...(query.commentsOnly ? { messages: { some: {} } } : {}),
    };
    const where = {
      ...scope,
      ...(query.month ? { completedAt: historyMonthRange(query.month) } : {}),
    };
    const [items, total, monthRecords, first] = await this.prisma.$transaction([
      this.prisma.workoutLog.findMany({
        where,
        orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          dog: { select: { id: true, name: true, color: true } },
          training: {
            select: { steps: { select: { durationMinutes: true } } },
          },
          messages: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.workoutLog.count({ where }),
      this.prisma.workoutLog.findMany({
        where: {
          ...scope,
          status: 'COMPLETED',
          completedAt: historyMonthRange(summaryMonth),
        },
        select: {
          completedAt: true,
          successRate: true,
          training: {
            select: { steps: { select: { durationMinutes: true } } },
          },
        },
      }),
      this.prisma.workoutLog.findFirst({
        where: scope,
        orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
        select: { completedAt: true },
      }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      monthRecords,
      firstRecordedAt: first?.completedAt ?? null,
    };
  }
}
