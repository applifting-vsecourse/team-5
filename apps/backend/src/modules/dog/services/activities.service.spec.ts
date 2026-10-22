import { WorkoutLog } from '@/generated/prisma/client';
import { ActivityRepository } from '@/modules/dog/repositories/activity.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ActivitiesService } from './activities.service';

const owner = { id: 'u1' } as Identity;
const trainer = { id: 'u9' } as Identity;
const stranger = { id: 'u2' } as Identity;

// Mirrors DogAccessService: the owner and a trainer with a share can see the
// dog, only the owner owns it, everyone else gets 404.
const setup = (): {
  service: ActivitiesService;
  activityRepository: ReturnType<typeof mock<ActivityRepository>>;
} => {
  const activityRepository = mock<ActivityRepository>();
  const dogAccess = mock<DogAccessService>();
  dogAccess.getAccessibleDog.mockImplementation((user) =>
    user.id === 'u1' || user.id === 'u9'
      ? Promise.resolve({ id: 'd1' } as never)
      : Promise.reject(new NotFoundException()),
  );
  dogAccess.getOwnedDog.mockImplementation((user) => {
    if (user.id === 'u1') return Promise.resolve({ id: 'd1' } as never);
    return Promise.reject(
      user.id === 'u9' ? new ForbiddenException() : new NotFoundException(),
    );
  });
  return {
    service: new ActivitiesService(activityRepository, dogAccess),
    activityRepository,
  };
};

describe('ActivitiesService (#85)', () => {
  describe('getActivitiesByDogId', () => {
    it('lets the owner and a trainer with a share read the records', async () => {
      const { service, activityRepository } = setup();
      activityRepository.getActivitiesByDogId.mockResolvedValue([]);

      await expect(service.getActivitiesByDogId(owner, 'd1')).resolves.toEqual(
        [],
      );
      await expect(
        service.getActivitiesByDogId(trainer, 'd1'),
      ).resolves.toEqual([]);
    });

    it("does not show another user's dog records", async () => {
      const { service, activityRepository } = setup();

      await expect(
        service.getActivitiesByDogId(stranger, 'd1'),
      ).rejects.toThrow(NotFoundException);
      expect(activityRepository.getActivitiesByDogId).not.toHaveBeenCalled();
    });
  });

  describe('createActivity', () => {
    it('lets the owner log a workout', async () => {
      const { service, activityRepository } = setup();
      activityRepository.createActivity.mockResolvedValue({} as WorkoutLog);

      await service.createActivity(owner, 'd1', { title: ' Chůze ' });

      expect(activityRepository.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          dogId: 'd1',
          authorId: 'u1',
          title: 'Chůze',
        }),
      );
    });

    it('does not let a trainer with a share log a workout for the owner (403)', async () => {
      const { service, activityRepository } = setup();

      await expect(
        service.createActivity(trainer, 'd1', { title: 'Podvrh' }),
      ).rejects.toThrow(ForbiddenException);
      expect(activityRepository.createActivity).not.toHaveBeenCalled();
    });

    it("does not let anyone log a workout on another user's dog (404)", async () => {
      const { service, activityRepository } = setup();

      await expect(
        service.createActivity(stranger, 'd1', { title: 'Podvrh' }),
      ).rejects.toThrow(NotFoundException);
      expect(activityRepository.createActivity).not.toHaveBeenCalled();
    });
  });
});
