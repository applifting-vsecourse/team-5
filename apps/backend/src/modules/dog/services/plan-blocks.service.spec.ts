import { Goal } from '@/modules/dog/domain/goal';
import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { PlanBlockRepository } from '@/modules/dog/repositories/plan-block.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { PlanBlocksService } from './plan-blocks.service';

const aBlock = (overrides: Partial<PlanBlock> = {}): PlanBlock => ({
  id: 'b1',
  goalId: 'g1',
  position: 0,
  title: 'Sedni u nohy',
  instruction: 'Pes sedí u levé nohy.',
  criterion: 'Sedí 5 s, i když kolem letí míček.',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

const owner = { id: 'u1' } as Identity;
const stranger = { id: 'u2' } as Identity;

const setup = (): {
  service: PlanBlocksService;
  planBlockRepository: MockProxy<PlanBlockRepository>;
} => {
  const planBlockRepository = mock<PlanBlockRepository>();
  const goalsService = mock<GoalsService>();
  // The owner sees goal g1; anyone else gets the same 404 as for a missing goal.
  goalsService.getGoal.mockImplementation((user, goalId) =>
    user.id === 'u1' && goalId === 'g1'
      ? Promise.resolve({ id: 'g1' } as Goal)
      : Promise.reject(new NotFoundException()),
  );
  const service = new PlanBlocksService(planBlockRepository, goalsService);
  return { service, planBlockRepository };
};

describe('PlanBlocksService', () => {
  describe('getBlocks', () => {
    it("lists the blocks of the user's goal in order", async () => {
      const { service, planBlockRepository } = setup();
      const blocks = [aBlock(), aBlock({ id: 'b2', position: 1 })];
      planBlockRepository.getBlocksByGoalId.mockResolvedValue(blocks);

      await expect(service.getBlocks(owner, 'g1')).resolves.toEqual(blocks);
      expect(planBlockRepository.getBlocksByGoalId).toHaveBeenCalledWith('g1');
    });

    it("does not list blocks of another user's goal", async () => {
      const { service, planBlockRepository } = setup();

      await expect(service.getBlocks(stranger, 'g1')).rejects.toThrow(
        NotFoundException,
      );
      expect(planBlockRepository.getBlocksByGoalId).not.toHaveBeenCalled();
    });
  });

  describe('createBlock', () => {
    it('adds an exercise with trimmed instruction and criterion', async () => {
      const { service, planBlockRepository } = setup();
      const created = aBlock();
      planBlockRepository.createBlock.mockResolvedValue(created);

      await expect(
        service.createBlock(owner, 'g1', {
          title: '  Sedni u nohy  ',
          instruction: '  Pes sedí u levé nohy.  ',
          criterion: '  Sedí 5 s, i když kolem letí míček.  ',
        }),
      ).resolves.toEqual(created);

      expect(planBlockRepository.createBlock).toHaveBeenCalledWith({
        goalId: 'g1',
        title: 'Sedni u nohy',
        instruction: 'Pes sedí u levé nohy.',
        criterion: 'Sedí 5 s, i když kolem letí míček.',
        insertAt: undefined,
      });
    });

    it('stores a missing instruction and criterion as null', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.createBlock.mockResolvedValue(aBlock());

      await service.createBlock(owner, 'g1', {
        title: 'Pac',
        instruction: '   ',
      });

      expect(planBlockRepository.createBlock).toHaveBeenCalledWith(
        expect.objectContaining({ instruction: null, criterion: null }),
      );
    });

    it('inserts a step between existing blocks (#65)', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.createBlock.mockResolvedValue(
        aBlock({ position: 1 }),
      );

      await service.createBlock(owner, 'g1', {
        title: 'Mezikrok',
        insertAt: 1,
      });

      expect(planBlockRepository.createBlock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Mezikrok', insertAt: 1 }),
      );
    });

    it("does not add a block to another user's goal", async () => {
      const { service, planBlockRepository } = setup();

      await expect(
        service.createBlock(stranger, 'g1', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.createBlock).not.toHaveBeenCalled();
    });

    it('does not add a block to a goal that does not exist', async () => {
      const { service, planBlockRepository } = setup();

      await expect(
        service.createBlock(owner, 'nope', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.createBlock).not.toHaveBeenCalled();
    });
  });

  describe('updateBlock', () => {
    it('updates a block of the user’s plan and clears emptied texts', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlockById.mockResolvedValue(aBlock());
      planBlockRepository.updateBlock.mockResolvedValue(aBlock());

      await service.updateBlock(owner, 'b1', {
        title: ' Sedni ',
        instruction: '',
      });

      expect(planBlockRepository.updateBlock).toHaveBeenCalledWith('b1', {
        title: 'Sedni',
        instruction: null,
        criterion: undefined,
      });
    });

    it("does not update a block of another user's plan", async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlockById.mockResolvedValue(aBlock());

      await expect(
        service.updateBlock(stranger, 'b1', { title: 'Cizí' }),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.updateBlock).not.toHaveBeenCalled();
    });

    it('reports a missing block as not found', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlockById.mockResolvedValue(null);

      await expect(
        service.updateBlock(owner, 'nope', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBlock', () => {
    it('deletes a block of the user’s plan', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlockById.mockResolvedValue(aBlock());

      await service.deleteBlock(owner, 'b1');

      expect(planBlockRepository.deleteBlock).toHaveBeenCalledWith('b1', 'g1');
    });

    it("does not delete a block of another user's plan", async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlockById.mockResolvedValue(aBlock());

      await expect(service.deleteBlock(stranger, 'b1')).rejects.toThrow(
        NotFoundException,
      );
      expect(planBlockRepository.deleteBlock).not.toHaveBeenCalled();
    });
  });

  describe('reorderBlocks', () => {
    const plan = [
      aBlock({ id: 'b1', position: 0 }),
      aBlock({ id: 'b2', position: 1 }),
      aBlock({ id: 'b3', position: 2 }),
    ];

    it('saves a new order that lists every block once', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlocksByGoalId.mockResolvedValue(plan);
      planBlockRepository.reorderBlocks.mockResolvedValue(plan);

      await service.reorderBlocks(owner, 'g1', ['b2', 'b1', 'b3']);

      expect(planBlockRepository.reorderBlocks).toHaveBeenCalledWith('g1', [
        'b2',
        'b1',
        'b3',
      ]);
    });

    it.each([
      ['a block is missing', ['b2', 'b1']],
      ['a block is listed twice', ['b1', 'b1', 'b3']],
      ['a block is from another plan', ['b1', 'b2', 'x9']],
    ])('rejects the order when %s', async (_case, blockIds) => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.getBlocksByGoalId.mockResolvedValue(plan);

      await expect(
        service.reorderBlocks(owner, 'g1', blockIds),
      ).rejects.toThrow(BadRequestException);
      expect(planBlockRepository.reorderBlocks).not.toHaveBeenCalled();
    });

    it("does not reorder another user's plan", async () => {
      const { service, planBlockRepository } = setup();

      await expect(
        service.reorderBlocks(stranger, 'g1', ['b1', 'b2', 'b3']),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.reorderBlocks).not.toHaveBeenCalled();
    });
  });
});
