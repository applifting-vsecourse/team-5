import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { EditableGoal } from '@/modules/dog/domain/hierarchy';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  assertTrainingContentEditable,
  HierarchyRepository,
  resolveSubStepParent,
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
  tx.goalTraining.findMany.mockResolvedValue([
    {
      position: 0,
      steps: stepIds.map((id, position) => ({
        id,
        parentId: null,
        position,
      })),
    },
  ] as never);
  return { repository: new HierarchyRepository(prisma), tx };
}

describe('resolveSubStepParent (#67)', () => {
  it('returns null when no parent is requested', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    await expect(resolveSubStepParent(tx, 't1', undefined)).resolves.toBeNull();
    expect(tx.planBlock.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a missing parent', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.planBlock.findFirst.mockResolvedValue(null);
    await expect(resolveSubStepParent(tx, 't1', 'gone')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects nesting under a sub-step', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.planBlock.findFirst.mockResolvedValue({
      id: 'child',
      parentId: 'root',
    } as never);
    await expect(resolveSubStepParent(tx, 't1', 'child')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts a root parent in the same training', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.planBlock.findFirst.mockResolvedValue({
      id: 'root',
      parentId: null,
    } as never);
    await expect(resolveSubStepParent(tx, 't1', 'root')).resolves.toBe('root');
    expect(tx.planBlock.findFirst).toHaveBeenCalledWith({
      where: { id: 'root', trainingId: 't1' },
    });
  });
});
