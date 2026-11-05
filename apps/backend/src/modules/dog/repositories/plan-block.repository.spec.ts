import { PrismaService } from '@/core/prisma/prisma.service';
import { GoalTraining, Prisma } from '@/generated/prisma/client';
import { EditableGoal } from '@/modules/dog/domain/hierarchy';
import { ConflictException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PlanBlockRepository } from './plan-block.repository';

function setup(trainings: GoalTraining[]): {
  repository: PlanBlockRepository;
  tx: DeepMockProxy<Prisma.TransactionClient>;
} {
  const prisma = mockDeep<PrismaService>();
  const tx = mockDeep<Prisma.TransactionClient>();
  prisma.$transaction.mockImplementation(async (callback) => callback(tx));
  tx.goalTraining.findMany.mockResolvedValue(trainings);
  tx.planBlock.findMany.mockResolvedValue([]);
  return { repository: new PlanBlockRepository(prisma), tx };
}

const training = (id: string, isArchived = false): GoalTraining => ({
  id,
  goalId: 'goal',
  title: id,
  position: 0,
  isArchived,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('legacy plan reads', () => {
  it('rejects ambiguous goals instead of mixing their steps', async () => {
    const { repository, tx } = setup([training('one'), training('two')]);
    await expect(repository.getBlocksByGoalId('goal')).rejects.toThrow(
      ConflictException,
    );
    expect(tx.planBlock.findMany).not.toHaveBeenCalled();
  });

  it('reads an archived training without applying write restrictions', async () => {
    const { repository, tx } = setup([training('archived', true)]);
    await expect(repository.getBlocksByGoalId('goal')).resolves.toEqual([]);
    expect(tx.planBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { trainingId: 'archived' },
      }),
    );
  });

  it('returns an empty plan without creating a training', async () => {
    const { repository, tx } = setup([]);
    await expect(repository.getBlocksByGoalId('goal')).resolves.toEqual([]);
    expect(tx.goalTraining.create).not.toHaveBeenCalled();
    expect(tx.planBlock.findMany).not.toHaveBeenCalled();
  });

  it('returns only the resolved training after reordering', async () => {
    const { repository, tx } = setup([training('one')]);
    const goal = mockDeep<EditableGoal>();
    goal.status = 'ACTIVE';
    goal.dog.isArchived = false;
    goal.disciplineEntity.isArchived = false;
    tx.trainingGoal.findUnique.mockResolvedValue(goal);
    await repository.reorderBlocks('goal', []);
    expect(tx.planBlock.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { trainingId: 'one' } }),
    );
  });
});
