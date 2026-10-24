import { Dog } from '@/modules/dog/domain/dog';
import { Goal } from '@/modules/dog/domain/goal';
import {
  ScheduledTraining,
  ScheduledTrainingDetail,
} from '@/modules/dog/domain/scheduled-training';
import { ScheduledTrainingRepository } from '@/modules/dog/repositories/scheduled-training.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { TrainingsService } from './trainings.service';

const aTraining = (
  overrides: Partial<ScheduledTraining> = {},
): ScheduledTraining => ({
  id: 't1',
  goalId: 'g1',
  dogId: 'd1',
  createdById: 'u1',
  date: new Date('2026-10-22T00:00:00.000Z'),
  status: 'PLANNED',
  createdAt: new Date('2026-10-21T12:00:00Z'),
  updatedAt: new Date('2026-10-21T12:00:00Z'),
  ...overrides,
});

const aTrainingDetail = (
  overrides: Partial<ScheduledTrainingDetail> = {},
): ScheduledTrainingDetail => ({
  ...aTraining(),
  dog: { id: 'd1', name: 'Rex', color: 1 },
  goal: {
    id: 'g1',
    title: 'Chůze u nohy',
    blocks: [
      {
        id: 'b1',
        position: 1,
        title: 'Sedni u nohy',
        instruction: 'Sedni rovně u levé nohy.',
        criterion: '3x za sebou.',
      },
    ],
  },
  ...overrides,
});

const owner = { id: 'u1' } as Identity;
const stranger = { id: 'u2' } as Identity;
// Wednesday 21 Oct 2026, 10:00 in Prague.
const now = new Date('2026-10-21T08:00:00Z');

const setup = (): {
  service: TrainingsService;
  repository: MockProxy<ScheduledTrainingRepository>;
  dogAccessService: MockProxy<DogAccessService>;
} => {
  const repository = mock<ScheduledTrainingRepository>();
  const goalsService = mock<GoalsService>();
  const dogAccessService = mock<DogAccessService>();
  // The owner sees goal g1 of dog d1; anyone else gets 404.
  goalsService.getGoal.mockImplementation((user, goalId) =>
    user.id === 'u1' && goalId === 'g1'
      ? Promise.resolve({ id: 'g1', dogId: 'd1' } as Goal)
      : Promise.reject(new NotFoundException()),
  );
  dogAccessService.getAccessibleDog.mockImplementation((user, dogId) =>
    user.id === 'u1' && dogId === 'd1'
      ? Promise.resolve({
          id: 'd1',
          name: 'Rex',
          ownerId: 'u1',
        } as unknown as Dog)
      : Promise.reject(new NotFoundException()),
  );
  dogAccessService.getOwnedDog.mockImplementation((user, dogId) =>
    user.id === 'u1' && dogId === 'd1'
      ? Promise.resolve({
          id: 'd1',
          name: 'Rex',
          ownerId: 'u1',
        } as unknown as Dog)
      : Promise.reject(new NotFoundException()),
  );
  const service = new TrainingsService(
    repository,
    goalsService,
    dogAccessService,
  );
  return { service, repository, dogAccessService };
};

describe('TrainingsService', () => {
  describe('scheduleTraining', () => {
    it('plans the training for the chosen day', async () => {
      const { service, repository } = setup();
      repository.createPlannedTraining.mockResolvedValue(aTraining());

      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-22', now),
      ).resolves.toEqual(aTraining());

      expect(repository.createPlannedTraining).toHaveBeenCalledWith({
        goalId: 'g1',
        dogId: 'd1',
        createdById: 'u1',
        date: new Date('2026-10-22T00:00:00.000Z'),
      });
    });

    it('allows today', async () => {
      const { service, repository } = setup();
      repository.createPlannedTraining.mockResolvedValue(
        aTraining({ date: new Date('2026-10-21T00:00:00.000Z') }),
      );

      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-21', now),
      ).resolves.toBeDefined();
    });

    it('refuses a day in the past', async () => {
      const { service, repository } = setup();

      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-20', now),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createPlannedTraining).not.toHaveBeenCalled();
    });

    it('takes "today" from the Czech time zone, not UTC', async () => {
      const { service, repository } = setup();
      repository.createPlannedTraining.mockResolvedValue(aTraining());
      // 23:30 UTC on 21 Oct is already 22 Oct in Prague.
      const lateEvening = new Date('2026-10-21T23:30:00Z');

      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-21', lateEvening),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-22', lateEvening),
      ).resolves.toBeDefined();
    });

    it('refuses a second plan for a training that is already planned', async () => {
      const { service, repository } = setup();
      repository.createPlannedTraining.mockResolvedValue(null);

      await expect(
        service.scheduleTraining(owner, 'g1', '2026-10-23', now),
      ).rejects.toThrow(ConflictException);
    });

    it("does not plan a training of another user's goal", async () => {
      const { service, repository } = setup();

      await expect(
        service.scheduleTraining(stranger, 'g1', '2026-10-22', now),
      ).rejects.toThrow(NotFoundException);
      expect(repository.createPlannedTraining).not.toHaveBeenCalled();
    });
  });

  describe('getGoalTrainings', () => {
    it("lists the trainings of the user's goal", async () => {
      const { service, repository } = setup();
      repository.getTrainingsByGoalId.mockResolvedValue([aTraining()]);

      await expect(service.getGoalTrainings(owner, 'g1')).resolves.toEqual([
        aTraining(),
      ]);
    });

    it("does not list trainings of another user's goal", async () => {
      const { service, repository } = setup();

      await expect(service.getGoalTrainings(stranger, 'g1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.getTrainingsByGoalId).not.toHaveBeenCalled();
    });
  });

  describe('getTraining', () => {
    it('returns the training detail when the user has access to the dog', async () => {
      const { service, repository } = setup();
      const detail = aTrainingDetail();
      repository.getTrainingById.mockResolvedValue(detail);

      await expect(service.getTraining(owner, 't1')).resolves.toEqual(detail);
      expect(repository.getTrainingById).toHaveBeenCalledWith('t1');
    });

    it('throws NotFoundException when the training does not exist', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(null);

      await expect(service.getTraining(owner, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user has no access to the dog', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());

      await expect(service.getTraining(stranger, 't1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeTraining', () => {
    const fakeLog = {
      id: 'log1',
      dogId: 'd1',
      goalId: 'g1',
      authorId: 'u1',
      title: 'Chůze u nohy',
      discipline: 'Poslušnost',
      status: 'COMPLETED' as const,
      completedAt: new Date(),
      successRate: 70,
      rating: null,
      focus: 'YES' as const,
      repeatedMistakes: 'NO' as const,
      note: 'Super výkon.',
      videoUrl: null,
      skipReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('completes the training and returns the created workout log', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());
      repository.completeTraining.mockResolvedValue(fakeLog);

      const dto = {
        successRate: 70,
        focus: 'YES' as const,
        repeatedMistakes: 'NO' as const,
        note: 'Super výkon.',
      };

      await expect(service.completeTraining(owner, 't1', dto)).resolves.toEqual(
        fakeLog,
      );

      expect(repository.completeTraining).toHaveBeenCalledWith(
        't1',
        owner.id,
        dto,
      );
    });

    it('throws NotFoundException if training does not exist', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(null);

      await expect(
        service.completeTraining(owner, 'missing', {}),
      ).rejects.toThrow(NotFoundException);

      expect(repository.completeTraining).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if user has no access to the dog', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());

      await expect(
        service.completeTraining(stranger, 't1', {}),
      ).rejects.toThrow(NotFoundException);

      expect(repository.completeTraining).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if user is not the dog owner', async () => {
      const { service, repository, dogAccessService } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());
      dogAccessService.getOwnedDog.mockRejectedValue(new ForbiddenException());

      await expect(service.completeTraining(owner, 't1', {})).rejects.toThrow(
        ForbiddenException,
      );

      expect(repository.completeTraining).not.toHaveBeenCalled();
    });

    it('throws ConflictException if training is already completed', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(
        aTrainingDetail({ status: 'COMPLETED' }),
      );

      await expect(service.completeTraining(owner, 't1', {})).rejects.toThrow(
        ConflictException,
      );

      expect(repository.completeTraining).not.toHaveBeenCalled();
    });
  });

  describe('getWeekTrainings', () => {
    it("asks only for the signed-in owner's trainings in the range", async () => {
      const { service, repository } = setup();
      repository.getOwnerTrainingsBetween.mockResolvedValue([]);

      await service.getWeekTrainings(owner, '2026-10-19', '2026-10-25');

      expect(repository.getOwnerTrainingsBetween).toHaveBeenCalledWith(
        'u1',
        new Date('2026-10-19T00:00:00.000Z'),
        new Date('2026-10-25T00:00:00.000Z'),
      );
    });

    it('accepts a single day', async () => {
      const { service, repository } = setup();
      repository.getOwnerTrainingsBetween.mockResolvedValue([]);

      await expect(
        service.getWeekTrainings(owner, '2026-10-22', '2026-10-22'),
      ).resolves.toEqual([]);
    });

    it.each([
      ['ends before it starts', '2026-10-25', '2026-10-19'],
      ['is longer than six weeks', '2026-10-01', '2026-11-30'],
    ])('rejects a range that %s', async (_case, from, to) => {
      const { service, repository } = setup();

      await expect(service.getWeekTrainings(owner, from, to)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.getOwnerTrainingsBetween).not.toHaveBeenCalled();
    });
  });

  describe('moveTraining (#74)', () => {
    it('moves a planned training to a day in another week', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());
      const moved = aTraining({ date: new Date('2026-10-29T00:00:00.000Z') });
      repository.movePlannedTraining.mockResolvedValue(moved);

      await expect(
        service.moveTraining(owner, 't1', '2026-10-29', now),
      ).resolves.toEqual(moved);
      expect(repository.movePlannedTraining).toHaveBeenCalledWith(
        't1',
        new Date('2026-10-29T00:00:00.000Z'),
      );
    });

    it('moves a missed training to today', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(
        aTrainingDetail({ date: new Date('2026-10-19T00:00:00.000Z') }),
      );
      repository.movePlannedTraining.mockResolvedValue(aTraining());

      await service.moveTraining(owner, 't1', '2026-10-21', now);

      expect(repository.movePlannedTraining).toHaveBeenCalled();
    });

    it('refuses a day in the past', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());

      await expect(
        service.moveTraining(owner, 't1', '2026-10-20', now),
      ).rejects.toThrow(BadRequestException);
      expect(repository.movePlannedTraining).not.toHaveBeenCalled();
    });

    it.each(['COMPLETED', 'SKIPPED'] as const)(
      'does not move a %s training',
      async (status) => {
        const { service, repository } = setup();
        repository.getTrainingById.mockResolvedValue(
          aTrainingDetail({ status }),
        );

        await expect(
          service.moveTraining(owner, 't1', '2026-10-29', now),
        ).rejects.toThrow(ConflictException);
        expect(repository.movePlannedTraining).not.toHaveBeenCalled();
      },
    );

    it('refuses a training completed while the move was on its way', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());
      repository.movePlannedTraining.mockResolvedValue(null);

      await expect(
        service.moveTraining(owner, 't1', '2026-10-29', now),
      ).rejects.toThrow(ConflictException);
    });

    it('lets only the owner move it (a trainer with a share gets 403)', async () => {
      const { service, repository, dogAccessService } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());
      dogAccessService.getOwnedDog.mockRejectedValue(new ForbiddenException());

      await expect(
        service.moveTraining({ id: 'u9' } as Identity, 't1', '2026-10-29', now),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.movePlannedTraining).not.toHaveBeenCalled();
    });

    it("reports another user's training as not found", async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(aTrainingDetail());

      await expect(
        service.moveTraining(stranger, 't1', '2026-10-29', now),
      ).rejects.toThrow('Training with ID t1 not found');
      expect(repository.movePlannedTraining).not.toHaveBeenCalled();
    });

    it('reports a missing training as not found', async () => {
      const { service, repository } = setup();
      repository.getTrainingById.mockResolvedValue(null);

      await expect(
        service.moveTraining(owner, 'nope', '2026-10-29', now),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPlannedDogTrainings (#74)', () => {
    it("lists the dog's planned trainings to someone who sees the dog", async () => {
      const { service, repository } = setup();
      repository.getPlannedTrainingsByDogId.mockResolvedValue([]);

      await expect(
        service.getPlannedDogTrainings(owner, 'd1'),
      ).resolves.toEqual([]);
      expect(repository.getPlannedTrainingsByDogId).toHaveBeenCalledWith('d1');
    });

    it('does not list trainings of a dog the user cannot see', async () => {
      const { service, repository } = setup();

      await expect(
        service.getPlannedDogTrainings(stranger, 'd1'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.getPlannedTrainingsByDogId).not.toHaveBeenCalled();
    });
  });
});
