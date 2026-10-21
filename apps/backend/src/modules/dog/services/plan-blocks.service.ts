import {
  CreatePlanBlockData,
  PlanBlock,
  UpdatePlanBlockData,
} from '@/modules/dog/domain/plan-block';
import { PlanBlockRepository } from '@/modules/dog/repositories/plan-block.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
    await this.goalsService.getGoal(user, block.goalId);
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
    return this.planBlockRepository.createBlock({
      goalId,
      title: data.title.trim(),
      instruction: optionalText(data.instruction) ?? null,
      criterion: optionalText(data.criterion) ?? null,
      insertAt: data.insertAt,
    });
  }

  async updateBlock(
    user: Identity,
    blockId: string,
    data: UpdatePlanBlockData,
  ): Promise<PlanBlock> {
    await this.getAccessibleBlock(user, blockId);
    return this.planBlockRepository.updateBlock(blockId, {
      title: data.title?.trim(),
      instruction: optionalText(data.instruction),
      criterion: optionalText(data.criterion),
    });
  }

  async deleteBlock(user: Identity, blockId: string): Promise<void> {
    const block = await this.getAccessibleBlock(user, blockId);
    await this.planBlockRepository.deleteBlock(blockId, block.goalId);
  }

  // The new order must list every block of the plan exactly once, so a stale
  // screen cannot drop or duplicate a block.
  async reorderBlocks(
    user: Identity,
    goalId: string,
    blockIds: string[],
  ): Promise<PlanBlock[]> {
    await this.goalsService.getGoal(user, goalId);
    const current = await this.planBlockRepository.getBlocksByGoalId(goalId);
    const currentIds = new Set(current.map((block) => block.id));
    const isSamePlan =
      blockIds.length === currentIds.size &&
      new Set(blockIds).size === blockIds.length &&
      blockIds.every((id) => currentIds.has(id));
    if (!isSamePlan) {
      throw new BadRequestException(
        'The new order must contain every block of the plan exactly once',
      );
    }
    return this.planBlockRepository.reorderBlocks(goalId, blockIds);
  }
}
