import { GoalStatus, TrainingGoal } from '@/generated/prisma/client';
import { Dog } from '@/modules/dog/domain/dog';
import { CreateGoalData, UpdateGoalData } from '@/modules/dog/domain/goal';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { GoalRepository } from '@/modules/dog/repositories/goal.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly dogRepository: DogRepository,
  ) {}

  private async assertDogOwnership(
    user: Identity,
    dogId: string,
  ): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return dog;
  }

  async getGoalsByDogId(
    user: Identity,
    dogId: string,
    status?: GoalStatus,
  ): Promise<TrainingGoal[]> {
    await this.assertDogOwnership(user, dogId);
    return this.goalRepository.getGoalsByDogId(dogId, status);
  }

  async createGoal(
    user: Identity,
    dogId: string,
    data: CreateGoalData,
  ): Promise<TrainingGoal> {
    await this.assertDogOwnership(user, dogId);
    return this.goalRepository.createGoal({
      dogId,
      createdById: user.id,
      title: data.title.trim(),
      discipline: data.discipline?.trim() || null,
      principle: data.principle?.trim() || null,
      status: data.status,
      order: data.order,
    });
  }

  async updateGoal(
    user: Identity,
    goalId: string,
    data: UpdateGoalData,
  ): Promise<TrainingGoal> {
    const goal = await this.goalRepository.getGoalById(goalId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }
    await this.assertDogOwnership(user, goal.dogId);

    return this.goalRepository.updateGoal(goalId, {
      title: data.title?.trim(),
      discipline:
        data.discipline !== undefined
          ? data.discipline.trim() || null
          : undefined,
      principle:
        data.principle !== undefined
          ? data.principle.trim() || null
          : undefined,
      status: data.status,
      order: data.order,
    });
  }

  async deleteGoal(user: Identity, goalId: string): Promise<TrainingGoal> {
    const goal = await this.goalRepository.getGoalById(goalId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }
    await this.assertDogOwnership(user, goal.dogId);
    return this.goalRepository.deleteGoal(goalId);
  }
}
