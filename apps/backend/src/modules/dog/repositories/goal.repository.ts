import { PrismaService } from '@/core/prisma/prisma.service';
import { GoalStatus } from '@/generated/prisma/client';
import { Goal } from '@/modules/dog/domain/goal';
import { Injectable } from '@nestjs/common';

const withAuthor = {
  createdBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getGoalsByDogId(dogId: string, status?: GoalStatus): Promise<Goal[]> {
    return this.prisma.trainingGoal.findMany({
      where: {
        dogId,
        ...(status ? { status } : {}),
      },
      include: withAuthor,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getGoalById(id: string): Promise<Goal | null> {
    return this.prisma.trainingGoal.findUnique({
      where: { id },
      include: withAuthor,
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
  }): Promise<Goal> {
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
      include: withAuthor,
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
  ): Promise<Goal> {
    return this.prisma.trainingGoal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.principle !== undefined && { principle: data.principle }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: withAuthor,
    });
  }

  async deleteGoal(id: string): Promise<Goal> {
    return this.prisma.trainingGoal.delete({
      where: { id },
      include: withAuthor,
    });
  }
}
