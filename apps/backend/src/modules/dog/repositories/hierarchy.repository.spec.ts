import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { EditableGoal } from '@/modules/dog/domain/hierarchy';
import { ConflictException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  assertTrainingContentEditable,
  HierarchyRepository,
} from './hierarchy.repository';

describe('completed training content', () => {
  it.each(['create', 'reorder'] as const)(
    'rejects %s of steps before writing a completed definition',
    async (operation) => {
      const { repository, tx } = setup([]);
      tx.goalTraining.findFirst.mockResolvedValue({
        id: 'session-2',
        goalId: 'g1',
        isArchived: false,
      } as never);
      tx.scheduledTraining.count.mockResolvedValue(1);
      const result =
        operation === 'create'
          ? repository.createStep('g1', 'session-2', { title: 'New step' })
          : repository.reorderSteps('g1', 'session-2', []);
      await expect(result).rejects.toThrow(ConflictException);
      expect(tx.planBlock.create).not.toHaveBeenCalled();
      expect(tx.planBlock.update).not.toHaveBeenCalled();
    },
  );
  it('rejects edits when any dated instance has been completed', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.scheduledTraining.count.mockResolvedValue(1);
    await expect(
      assertTrainingContentEditable(tx, 'session-2'),
    ).rejects.toThrow(ConflictException);
    expect(tx.scheduledTraining.count).toHaveBeenCalledWith({
      where: { trainingId: 'session-2', status: 'COMPLETED' },
    });
  });
  it('allows editing a training without a completion', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.scheduledTraining.count.mockResolvedValue(0);
    await expect(
      assertTrainingContentEditable(tx, 'session-2'),
    ).resolves.toBeUndefined();
  });
});

function setup(stepIds: string[]): {
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
  tx.trainingGoal.findUnique.mockResolvedValue(goal);
  tx.planBlock.findMany.mockResolvedValue(
    stepIds.map((id) => ({ id })) as never,
  );
  return { repository: new HierarchyRepository(prisma), tx };
}
