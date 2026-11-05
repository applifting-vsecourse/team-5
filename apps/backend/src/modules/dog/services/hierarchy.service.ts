import {
  Discipline,
  GoalTraining,
  PlanBlock,
  ScheduledTraining,
} from '@/generated/prisma/client';
import {
  CreateGoalTrainingData,
  DisciplineMembership,
  DogPlan,
  TrainingWithSteps,
  UpdateGoalTrainingData,
} from '@/modules/dog/domain/hierarchy';
import { CreatePlanBlockData } from '@/modules/dog/domain/plan-block';
import { HierarchyRepository } from '@/modules/dog/repositories/hierarchy.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { TrainingsService } from '@/modules/dog/services/trainings.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class HierarchyService {
  constructor(
    private readonly repository: HierarchyRepository,
    private readonly dogAccess: DogAccessService,
    private readonly goals: GoalsService,
    private readonly trainings: TrainingsService,
  ) {}

  listDisciplines(): Promise<Discipline[]> {
    return this.repository.listDisciplines();
  }

  async getPlan(user: Identity, dogId: string): Promise<DogPlan> {
    await this.dogAccess.getAccessibleDog(user, dogId);
    return this.repository.getPlan(dogId);
  }

  async setDiscipline(
    user: Identity,
    dogId: string,
    name: string,
    isArchived = false,
  ): Promise<DisciplineMembership> {
    await this.dogAccess.getOwnedDog(user, dogId);
    return this.repository.setDiscipline(dogId, name.trim(), isArchived);
  }

  async getTraining(user: Identity, id: string): Promise<TrainingWithSteps> {
    const training = await this.repository.getTraining(id);
    if (!training) throw new NotFoundException('Training not found');
    try {
      await this.goals.getGoal(user, training.goalId);
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException('Training not found');
      throw error;
    }
    return training;
  }

  async createTraining(
    user: Identity,
    goalId: string,
    data: CreateGoalTrainingData,
  ): Promise<GoalTraining> {
    await this.goals.getGoal(user, goalId);
    return this.repository.createTraining(
      goalId,
      data.title.trim(),
      data.insertAt,
    );
  }

  async updateTraining(
    user: Identity,
    id: string,
    data: UpdateGoalTrainingData,
  ): Promise<GoalTraining> {
    const training = await this.getTraining(user, id);
    return this.repository.updateTraining(id, training.goalId, {
      ...data,
      title: data.title?.trim(),
    });
  }

  async reorderTrainings(
    user: Identity,
    goalId: string,
    ids: string[],
  ): Promise<GoalTraining[]> {
    await this.goals.getGoal(user, goalId);
    return this.repository.reorderTrainings(goalId, ids);
  }

  async createStep(
    user: Identity,
    id: string,
    data: CreatePlanBlockData,
  ): Promise<PlanBlock> {
    const training = await this.getTraining(user, id);
    return this.repository.createStep(training.goalId, id, data);
  }

  async reorderSteps(
    user: Identity,
    id: string,
    ids: string[],
  ): Promise<PlanBlock[]> {
    const training = await this.getTraining(user, id);
    return this.repository.reorderSteps(training.goalId, id, ids);
  }

  async schedule(
    user: Identity,
    id: string,
    date: string,
  ): Promise<ScheduledTraining> {
    const training = await this.getTraining(user, id);
    return this.trainings.scheduleTraining(
      user,
      training.goalId,
      date,
      new Date(),
      id,
    );
  }
}
