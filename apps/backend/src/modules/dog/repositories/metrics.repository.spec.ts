import { PrismaService } from '@/core/prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { MetricsRepository } from './metrics.repository';

describe('weekly plan metrics', () => {
  it('counts dated sessions, including skipped sessions in the plan, without using workout days or configured targets', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.scheduledTraining.groupBy = jest.fn().mockResolvedValue([
      { status: 'PLANNED', _count: 2 },
      { status: 'COMPLETED', _count: 3 },
      { status: 'SKIPPED', _count: 1 },
    ]) as never;
    const repository = new MetricsRepository(prisma);
    await expect(
      repository.getWeeklyPlan({ dogId: 'dog-1' }, '2026-11-02', '2026-11-08'),
    ).resolves.toEqual({
      weeklyPlannedSessions: 6,
      weeklyCompletedSessions: 3,
      weeklySkippedSessions: 1,
    });
    expect(prisma.scheduledTraining.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: {
        dogId: 'dog-1',
        date: {
          gte: new Date('2026-11-02T00:00:00Z'),
          lte: new Date('2026-11-08T00:00:00Z'),
        },
      },
      _count: true,
    });
  });
  it('scopes owner totals to active owned dogs and returns a real zero for an empty plan', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.scheduledTraining.groupBy = jest.fn().mockResolvedValue([]);
    const repository = new MetricsRepository(prisma);
    await expect(
      repository.getWeeklyPlan(
        { ownerId: 'owner-1' },
        '2026-11-02',
        '2026-11-08',
      ),
    ).resolves.toEqual({
      weeklyPlannedSessions: 0,
      weeklyCompletedSessions: 0,
      weeklySkippedSessions: 0,
    });
    expect(prisma.scheduledTraining.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dog: { ownerId: 'owner-1', isArchived: false },
        }),
      }),
    );
  });
});
