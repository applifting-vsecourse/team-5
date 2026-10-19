import { PrismaService } from '@/core/prisma/prisma.service';
import { GoalStatus, TrainingGoal } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getGoalsByDogId(
    dogId: string,
    status?: GoalStatus,
  ): Promise<TrainingGoal[]> {
    return this.prisma.trainingGoal.findMany({
      where: {
        dogId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getGoalById(id: string): Promise<TrainingGoal | null> {
    return this.prisma.trainingGoal.findUnique({
      where: { id },
    });
  }

  async createGoal(data: {
    dogId: string;
    createdById: string;
    title: string;
    discipline?: string | null;
    principle?: string | null;
    status?: GoalStatus;
    order?: number;
  }): Promise<TrainingGoal> {
    return this.prisma.trainingGoal.create({
      data: {
        dog: { connect: { id: data.dogId } },
        createdBy: { connect: { id: data.createdById } },
        title: data.title,
        discipline: data.discipline ?? null,
        principle: data.principle ?? null,
        status: data.status ?? GoalStatus.ACTIVE,
        order: data.order ?? 0,
      },
    });
  }

  async updateGoal(
    id: string,
    data: {
      title?: string;
      discipline?: string | null;
      principle?: string | null;
      status?: GoalStatus;
      order?: number;
    },
  ): Promise<TrainingGoal> {
    return this.prisma.trainingGoal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.principle !== undefined && { principle: data.principle }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
  }

  async deleteGoal(id: string): Promise<TrainingGoal> {
    return this.prisma.trainingGoal.delete({
      where: { id },
    });
  }
}
