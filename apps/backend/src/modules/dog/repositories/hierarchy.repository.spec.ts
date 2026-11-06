import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { EditableGoal } from '@/modules/dog/domain/hierarchy';
import { ConflictException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { HierarchyRepository } from './hierarchy.repository';

function setup(
  stepIds: string[],
  currentStepId: string | null,
): {
  repository: HierarchyRepository;
  tx: DeepMockProxy<Prisma.TransactionClient>;
} {
  const prisma = mockDeep<PrismaService>();
  const tx = mockDeep<Prisma.TransactionClient>();
  prisma.$transaction.mockImplementation(async (callback) => callback(tx));
  const goal = mockDeep<EditableGoal>();
  goal.status = 'ACTIVE';
  goal.dog.isArchived = false;
  goal.disciplineEntity.isArchived = false;
  goal.currentStepId = currentStepId;
  tx.trainingGoal.findUnique.mockResolvedValue(goal);
  tx.planBlock.findMany.mockResolvedValue(
    stepIds.map((id) => ({ id })) as never,
  );
  return { repository: new HierarchyRepository(prisma), tx };
}

describe('moveCurrentStep', () => {
  it('walks only the active trainings in plan order', async () => {
    const { repository, tx } = setup(['a'], null);
    await repository.moveCurrentStep('g1', 'advance');
    expect(tx.planBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { goalId: 'g1', training: { isArchived: false } },
        orderBy: [
          { training: { position: 'asc' } },
          { position: 'asc' },
          { id: 'asc' },
        ],
      }),
    );
  });

  it('marks the first step mastered and moves the pointer when it is unset', async () => {
    const { repository, tx } = setup(['a', 'b'], null);
    await repository.moveCurrentStep('g1', 'advance');
    expect(tx.planBlock.update).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: { outcome: 'MASTERED' },
    });
    expect(tx.trainingGoal.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { currentStepId: 'b' },
    });
  });

  it('clears the outcome of the previous step when going back', async () => {
    const { repository, tx } = setup(['a', 'b'], 'b');
    await repository.moveCurrentStep('g1', 'back');
    expect(tx.planBlock.update).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: { outcome: null },
    });
    expect(tx.trainingGoal.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { currentStepId: 'a' },
    });
  });

  it('rejects a goal without steps', async () => {
    const { repository, tx } = setup([], null);
    await expect(repository.moveCurrentStep('g1', 'skip')).rejects.toThrow(
      ConflictException,
    );
    expect(tx.trainingGoal.update).not.toHaveBeenCalled();
  });
});
