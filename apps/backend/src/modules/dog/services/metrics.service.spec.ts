import { MetricsRepository } from '@/modules/dog/repositories/metrics.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { MetricsService } from './metrics.service';

describe('metrics access', () => {
  const user = { id: 'u1' } as Identity;

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
