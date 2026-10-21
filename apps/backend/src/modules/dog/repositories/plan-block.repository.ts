import { PrismaService } from '@/core/prisma/prisma.service';
import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBlocksByGoalId(goalId: string): Promise<PlanBlock[]> {
    return this.prisma.planBlock.findMany({
      where: { goalId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // New blocks go to the end of the plan, in the order they were added.
  async createBlockAtEnd(data: {
    goalId: string;
    title: string;
    instruction: string | null;
    criterion: string | null;
  }): Promise<PlanBlock> {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.planBlock.aggregate({
        where: { goalId: data.goalId },
        _max: { position: true },
      });
      return tx.planBlock.create({
        data: {
          goal: { connect: { id: data.goalId } },
          position: (last._max.position ?? -1) + 1,
          title: data.title,
          instruction: data.instruction,
          criterion: data.criterion,
        },
      });
    });
  }
}
