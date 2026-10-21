import { GoalStatus } from '@/generated/prisma/client';
import { Dog } from '@/modules/dog/domain/dog';
import {
  CreateGoalData,
  Goal,
  UpdateGoalData,
} from '@/modules/dog/domain/goal';
import { GoalRepository } from '@/modules/dog/repositories/goal.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly dogAccess: DogAccessService,
  ) {}

  // A goal is visible exactly when its dog is. A goal of someone else's dog
  // is reported as missing, the same as one that does not exist.
  private async getAccessibleGoal(
    user: Identity,
    goalId: string,
  ): Promise<{ goal: Goal; dog: Dog }> {
    const goal = await this.goalRepository.getGoalById(goalId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }
    try {
      const dog = await this.dogAccess.getAccessibleDog(user, goal.dogId);
      return { goal, dog };
    } catch (error) {
      // Report the goal, not its dog: the dog's ID must not leak to a caller
      // who cannot see it.
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Goal with ID ${goalId} not found`);
      }
      throw error;
    }
  }

  // The discipline is picked from the dog's own disciplines (#62). An empty
  // value means "no discipline" and is stored as null. A goal may keep the
  // discipline it already has even after the dog dropped it, so editing
  // something else on that goal still works.
  private normalizeDiscipline(
    dog: Dog,
    discipline: string | undefined,
    currentDiscipline?: string | null,
  ): string | null | undefined {
    if (discipline === undefined) return undefined;
    const trimmed = discipline.trim();
    if (!trimmed) return null;
    if (
      trimmed !== currentDiscipline &&
      !(dog.disciplines ?? []).includes(trimmed)
    ) {
      throw new BadRequestException(
        `Discipline "${trimmed}" is not one of the dog's disciplines`,
      );
    }
    return trimmed;
  }

  async getGoalsByDogId(
    user: Identity,
    dogId: string,
    status?: GoalStatus,
  ): Promise<Goal[]> {
    await this.dogAccess.getAccessibleDog(user, dogId);
    return this.goalRepository.getGoalsByDogId(dogId, status);
  }

  async getGoal(user: Identity, goalId: string): Promise<Goal> {
    const { goal } = await this.getAccessibleGoal(user, goalId);
    return goal;
  }

  async createGoal(
    user: Identity,
    dogId: string,
    data: CreateGoalData,
  ): Promise<Goal> {
    const dog = await this.dogAccess.getAccessibleDog(user, dogId);
    return this.goalRepository.createGoal({
      dogId,
      createdById: user.id,
      title: data.title.trim(),
      discipline: this.normalizeDiscipline(dog, data.discipline) ?? null,
      principle: data.principle?.trim() || null,
      status: data.status,
      order: data.order,
    });
  }

  async updateGoal(
    user: Identity,
    goalId: string,
    data: UpdateGoalData,
  ): Promise<Goal> {
    const { goal, dog } = await this.getAccessibleGoal(user, goalId);

    return this.goalRepository.updateGoal(goalId, {
      title: data.title?.trim(),
      discipline: this.normalizeDiscipline(
        dog,
        data.discipline,
        goal.discipline,
      ),
      principle:
        data.principle !== undefined
          ? data.principle.trim() || null
          : undefined,
      status: data.status,
      order: data.order,
    });
  }

  async deleteGoal(user: Identity, goalId: string): Promise<Goal> {
    await this.getAccessibleGoal(user, goalId);
    return this.goalRepository.deleteGoal(goalId);
  }
}
