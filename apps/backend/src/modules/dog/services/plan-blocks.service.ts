import {
  CreatePlanBlockData,
  PlanBlock,
} from '@/modules/dog/domain/plan-block';
import { PlanBlockRepository } from '@/modules/dog/repositories/plan-block.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanBlocksService {
  constructor(
    private readonly planBlockRepository: PlanBlockRepository,
    private readonly goalsService: GoalsService,
  ) {}

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
    return this.planBlockRepository.createBlockAtEnd({
      goalId,
      title: data.title.trim(),
      instruction: data.instruction?.trim() || null,
      criterion: data.criterion?.trim() || null,
    });
  }
}
