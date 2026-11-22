import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { EditableGoal } from '@/modules/dog/domain/hierarchy';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
// NotFoundException covers missing training in assertTrainingContentEditable (#68).
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  assertTrainingContentEditable,
  HierarchyRepository,
  resolveSubStepParent,
} from './hierarchy.repository';

describe('training content editability (#68)', () => {
  it('allows editing after a dated completion so trainers can adjust the next plan', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.goalTraining.findUnique.mockResolvedValue({
      isArchived: false,
    } as never);
    await expect(
      assertTrainingContentEditable(tx, 'session-2'),
    ).resolves.toBeUndefined();
  });
  it('rejects edits when the training definition is archived', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.goalTraining.findUnique.mockResolvedValue({
      isArchived: true,
    } as never);
    await expect(
      assertTrainingContentEditable(tx, 'session-2'),
    ).rejects.toThrow(ConflictException);
  });
  it('rejects edits when the training is missing', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.goalTraining.findUnique.mockResolvedValue(null);
    await expect(
      assertTrainingContentEditable(tx, 'missing'),
    ).rejects.toThrow(NotFoundException);
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

describe('createStep with sub-steps (#67)', () => {
  it('creates a child under a root parent', async () => {
    const { repository, tx } = setup([]);
    tx.goalTraining.findFirst.mockResolvedValue({
      id: 'session-2',
      goalId: 'g1',
      isArchived: false,
    } as never);
    tx.goalTraining.findUnique.mockResolvedValue({
      isArchived: false,
    } as never);
    tx.planBlock.findFirst.mockResolvedValue({
      id: 'root',
      parentId: null,
    } as never);
    tx.planBlock.findMany.mockResolvedValue([]);
    tx.planBlock.create.mockResolvedValue({
      id: 'child',
      parentId: 'root',
      position: 0,
      title: 'Dílčí',
    } as never);

    await repository.createStep('g1', 'session-2', {
      title: 'Dílčí',
      parentId: 'root',
    });

    expect(tx.planBlock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentId: 'root', title: 'Dílčí' }),
      }),
    );
  });

  it('reorders only the requested sibling group', async () => {
    const { repository, tx } = setup([]);
    tx.goalTraining.findFirst.mockResolvedValue({
      id: 'session-2',
      goalId: 'g1',
      isArchived: false,
    } as never);
    tx.goalTraining.findUnique.mockResolvedValue({
      isArchived: false,
    } as never);
    tx.planBlock.findMany
      .mockResolvedValueOnce([
        { id: 'root', parentId: null, position: 0 },
        { id: 'c1', parentId: 'root', position: 0 },
        { id: 'c2', parentId: 'root', position: 1 },
      ] as never)
      .mockResolvedValueOnce([
        { id: 'root', parentId: null, position: 0 },
        { id: 'c2', parentId: 'root', position: 0 },
        { id: 'c1', parentId: 'root', position: 1 },
      ] as never);

    await repository.reorderSteps('g1', 'session-2', ['c2', 'c1']);

    expect(tx.planBlock.update).toHaveBeenCalledWith({
      where: { id: 'c2' },
      data: { position: 0 },
    });
    expect(tx.planBlock.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { position: 1 },
    });
  });
});

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
