import { MetricsRepository } from '@/modules/dog/repositories/metrics.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { MetricsService } from './metrics.service';

describe('metrics access', () => {
  const user = { id: 'u1' } as Identity;

  it('sums distinct dog-days in the requested Prague week and ignores future records', async () => {
    const repository = mock<MetricsRepository>();
    const access = mock<DogAccessService>();
    const log = (date: string) => ({
      completedAt: new Date(date),
      successRate: 80,
      status: 'COMPLETED' as const,
    });
    repository.getOwnerInputs.mockResolvedValue([
      {
        weeklyTarget: 3,
        workoutLogs: [
          log('2026-11-01T23:30:00Z'),
          log('2026-11-02T12:00:00Z'),
          log('2026-11-03T12:00:00Z'),
          log('2026-11-06T12:00:00Z'),
        ],
      },
      {
        weeklyTarget: 2,
        workoutLogs: [log('2026-11-02T10:00:00Z'), log('2026-11-01T10:00:00Z')],
      },
    ]);
    const service = new MetricsService(repository, access);
    await expect(
      service.getOwnerWeekMetrics(
        user,
        '2026-11-02',
        '2026-11-08',
        new Date('2026-11-05T12:00:00Z'),
      ),
    ).resolves.toEqual({ weeklyTarget: 5, weeklyTrainedDays: 3 });
    expect(repository.getOwnerInputs).toHaveBeenCalledWith(user.id);
    await expect(
      service.getOwnerWeekMetrics(user, '2026-11-02', '2026-11-10'),
    ).rejects.toThrow('Vyber celý týden.');
  });

  it('reads only aggregate inputs after checking dog access', async () => {
    const repository = mock<MetricsRepository>();
    const access = mock<DogAccessService>();
    repository.getInputs.mockResolvedValue({
      weeklyTarget: 3,
      workoutLogs: [],
    });
    const service = new MetricsService(repository, access);
    expect(await service.getMetrics(user, 'd1')).toMatchObject({
      weeklyTarget: 3,
      streak: 0,
    });
    expect(access.getAccessibleDog).toHaveBeenCalledWith(user, 'd1');
  });

  it('does not read metrics of a foreign dog', async () => {
    const repository = mock<MetricsRepository>();
    const access = mock<DogAccessService>();
    access.getAccessibleDog.mockRejectedValue(new NotFoundException());
    const service = new MetricsService(repository, access);
    await expect(service.getMetrics(user, 'd1')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.getInputs).not.toHaveBeenCalled();
  });

  it('does not let a shared trainer change the owner’s weekly target', async () => {
    const repository = mock<MetricsRepository>();
    const access = mock<DogAccessService>();
    access.getOwnedDog.mockRejectedValue(new ForbiddenException());
    const service = new MetricsService(repository, access);
    await expect(service.setTarget(user, 'd1', 5)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.setWeeklyTarget).not.toHaveBeenCalled();
  });
});
