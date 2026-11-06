import { Goal } from '@/modules/dog/domain/goal';
import { HierarchyRepository } from '@/modules/dog/repositories/hierarchy.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { TrainingsService } from '@/modules/dog/services/trainings.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { HierarchyService } from './hierarchy.service';

function setup(): {
  service: HierarchyService;
  repository: MockProxy<HierarchyRepository>;
  access: MockProxy<DogAccessService>;
  goals: MockProxy<GoalsService>;
  trainings: MockProxy<TrainingsService>;
} {
  const repository = mock<HierarchyRepository>();
  const access = mock<DogAccessService>();
  const goals = mock<GoalsService>();
  const trainings = mock<TrainingsService>();
  const service = new HierarchyService(repository, access, goals, trainings);
  return { repository, access, goals, trainings, service };
}
const user = { id: 'u1' } as Identity;
const training = {
  id: 't1',
  goalId: 'g1',
  title: 'Pozice',
  position: 0,
  isArchived: false,
  steps: [],
  currentStepId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('hierarchy access and scheduling', () => {
  it('does not read a foreign dog’s plan', async () => {
    const { service, access, repository } = setup();
    access.getAccessibleDog.mockRejectedValue(new NotFoundException());
    await expect(service.getPlan(user, 'foreign')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.getPlan).not.toHaveBeenCalled();
  });

  it('hides the goal and dog IDs when a training is inaccessible', async () => {
    const { service, repository, goals } = setup();
    repository.getTraining.mockResolvedValue(training);
    goals.getGoal.mockRejectedValue(new NotFoundException('Goal g1 of dog d1'));
    await expect(service.getTraining(user, 't1')).rejects.toThrow(
      'Training not found',
    );
  });

  it('checks goal access before adding a training, including after a revoked share', async () => {
    const { service, repository, goals } = setup();
    goals.getGoal.mockRejectedValue(new NotFoundException());
    await expect(
      service.createTraining(user, 'g1', { title: 'Pozice' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.createTraining).not.toHaveBeenCalled();
  });

  it('only lets the owner change a dog’s discipline membership', async () => {
    const { service, repository, access } = setup();
    access.getOwnedDog.mockRejectedValue(new ForbiddenException());
    await expect(
      service.setDiscipline(user, 'd1', 'Poslušnost'),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.setDiscipline).not.toHaveBeenCalled();
  });

  it('does not move the current step of a goal the user cannot see', async () => {
    const { service, repository, goals } = setup();
    goals.getGoal.mockRejectedValue(new NotFoundException());
    await expect(
      service.moveCurrentStep(user, 'g1', 'advance'),
    ).rejects.toThrow(NotFoundException);
    expect(repository.moveCurrentStep).not.toHaveBeenCalled();
  });

  it('moves the current step and returns the refreshed goal', async () => {
    const { service, repository, goals } = setup();
    const goal = { id: 'g1', currentStepId: 'b2' } as Goal;
    goals.getGoal.mockResolvedValue(goal);
    await expect(service.moveCurrentStep(user, 'g1', 'skip')).resolves.toBe(
      goal,
    );
    expect(repository.moveCurrentStep).toHaveBeenCalledWith('g1', 'skip');
  });

  it('schedules the selected concrete training within its actual goal', async () => {
    const { service, repository, trainings } = setup();
    repository.getTraining.mockResolvedValue(training);
    await service.schedule(user, 't1', '2026-11-07');
    expect(trainings.scheduleTraining).toHaveBeenCalledWith(
      user,
      'g1',
      '2026-11-07',
      expect.any(Date),
      't1',
    );
  });
});
