import { Goal } from '@/modules/dog/domain/goal';
import { ScheduledTraining } from '@/modules/dog/domain/scheduled-training';
import { ScheduledTrainingRepository } from '@/modules/dog/repositories/scheduled-training.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
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

const owner = { id: 'u1' } as Identity;
const stranger = { id: 'u2' } as Identity;
// Wednesday 21 Oct 2026, 10:00 in Prague.
const now = new Date('2026-10-21T08:00:00Z');

const setup = (): {
  service: TrainingsService;
  repository: MockProxy<ScheduledTrainingRepository>;
} => {
  const repository = mock<ScheduledTrainingRepository>();
  const goalsService = mock<GoalsService>();
  // The owner sees goal g1 of dog d1; anyone else gets 404.
  goalsService.getGoal.mockImplementation((user, goalId) =>
    user.id === 'u1' && goalId === 'g1'
      ? Promise.resolve({ id: 'g1', dogId: 'd1' } as Goal)
      : Promise.reject(new NotFoundException()),
  );
  const service = new TrainingsService(repository, goalsService);
  return { service, repository };
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
});
