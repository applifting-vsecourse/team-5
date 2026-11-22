import {
  CreatePlanBlockData,
  PlanBlock,
  UpdatePlanBlockData,
} from '@/modules/dog/domain/plan-block';
import { PlanBlockRepository } from '@/modules/dog/repositories/plan-block.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

// An empty optional text means "none" and is stored as null.
const optionalText = (value: string | undefined): string | null | undefined =>
  value === undefined ? undefined : value.trim() || null;

@Injectable()
export class PlanBlocksService {
  constructor(
    private readonly planBlockRepository: PlanBlockRepository,
    private readonly goalsService: GoalsService,
  ) {}

  // A block is visible exactly when its goal is; a block of someone else's
  // goal is reported as missing, the same as one that does not exist.
  private async getAccessibleBlock(
    user: Identity,
    blockId: string,
  ): Promise<PlanBlock> {
    const block = await this.planBlockRepository.getBlockById(blockId);
    if (!block) {
      throw new NotFoundException(`Plan block with ID ${blockId} not found`);
    }
    try {
      await this.goalsService.getGoal(user, block.goalId);
    } catch (error) {
      // Report the block the caller asked for, not the goal or dog behind it.
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Plan block with ID ${blockId} not found`);
      }
      throw error;
    }
    return block;
  }

  // Blocks are visible exactly when their goal is; getGoal throws 404 otherwise.
  async getBlocks(user: Identity, goalId: string): Promise<PlanBlock[]> {
    await this.goalsService.getGoal(user, goalId);
    return this.planBlockRepository.getBlocksByGoalId(goalId);
  }

  async createBlock(
    user: Identity,
    goalId: string,
    data: CreatePlanBlockData,
  ): Promise<PlanBlock> {
    await this.goalsService.getGoal(user, goalId);
    return this.planBlockRepository.createBlock(
      {
        goalId,
        title: data.title.trim(),
        instruction: optionalText(data.instruction) ?? null,
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes,
        }),
        criterion: optionalText(data.criterion) ?? null,
        insertAt: data.insertAt,
        parentId: data.parentId,
      },
      user.id,
    );
  }

  async updateBlock(
    user: Identity,
    blockId: string,
    data: UpdatePlanBlockData,
  ): Promise<PlanBlock> {
    await this.getAccessibleBlock(user, blockId);
    return this.planBlockRepository.updateBlock(
      blockId,
      {
        title: data.title?.trim(),
        instruction: optionalText(data.instruction),
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes,
        }),
        criterion: optionalText(data.criterion),
      },
      user.id,
    );
  }

  async deleteBlock(user: Identity, blockId: string): Promise<void> {
    const block = await this.getAccessibleBlock(user, blockId);
    await this.planBlockRepository.deleteBlock(blockId, block.goalId, user.id);
  }

  // Sibling-group order is validated in the repository (#67), same as
  // HierarchyService.reorderSteps — the client may send only one parent group.
  async reorderBlocks(
    user: Identity,
    goalId: string,
    blockIds: string[],
  ): Promise<PlanBlock[]> {
    await this.goalsService.getGoal(user, goalId);
    return this.planBlockRepository.reorderBlocks(goalId, blockIds, user.id);
  }
}
