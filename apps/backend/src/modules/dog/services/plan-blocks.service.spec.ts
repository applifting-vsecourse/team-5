import { Goal } from '@/modules/dog/domain/goal';
import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { PlanBlockRepository } from '@/modules/dog/repositories/plan-block.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
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
      planBlockRepository.createBlockAtEnd.mockResolvedValue(created);

      await expect(
        service.createBlock(owner, 'g1', {
          title: '  Sedni u nohy  ',
          instruction: '  Pes sedí u levé nohy.  ',
          criterion: '  Sedí 5 s, i když kolem letí míček.  ',
        }),
      ).resolves.toEqual(created);

      expect(planBlockRepository.createBlockAtEnd).toHaveBeenCalledWith({
        goalId: 'g1',
        title: 'Sedni u nohy',
        instruction: 'Pes sedí u levé nohy.',
        criterion: 'Sedí 5 s, i když kolem letí míček.',
      });
    });

    it('stores a missing instruction and criterion as null', async () => {
      const { service, planBlockRepository } = setup();
      planBlockRepository.createBlockAtEnd.mockResolvedValue(aBlock());

      await service.createBlock(owner, 'g1', {
        title: 'Pac',
        instruction: '   ',
      });

      expect(planBlockRepository.createBlockAtEnd).toHaveBeenCalledWith({
        goalId: 'g1',
        title: 'Pac',
        instruction: null,
        criterion: null,
      });
    });

    it("does not add a block to another user's goal", async () => {
      const { service, planBlockRepository } = setup();

      await expect(
        service.createBlock(stranger, 'g1', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.createBlockAtEnd).not.toHaveBeenCalled();
    });

    it('does not add a block to a goal that does not exist', async () => {
      const { service, planBlockRepository } = setup();

      await expect(
        service.createBlock(owner, 'nope', { title: 'Pac' }),
      ).rejects.toThrow(NotFoundException);
      expect(planBlockRepository.createBlockAtEnd).not.toHaveBeenCalled();
    });
  });
});
