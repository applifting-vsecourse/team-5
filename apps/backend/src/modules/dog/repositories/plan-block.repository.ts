import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { Injectable } from '@nestjs/common';

const inPlanOrder = [
  { position: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.PlanBlockOrderByWithRelationInput[];

// Positions are kept as 0..n-1 in plan order. Every write that changes the
// order rewrites them in one transaction, so a plan never ends up with gaps
// or two blocks on the same position.
const writePositions = async (
  tx: Prisma.TransactionClient,
  blockIds: string[],
): Promise<void> => {
  await Promise.all(
    blockIds.map((id, position) =>
      tx.planBlock.update({ where: { id }, data: { position } }),
    ),
  );
};

@Injectable()
export class PlanBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBlocksByGoalId(goalId: string): Promise<PlanBlock[]> {
    return this.prisma.planBlock.findMany({
      where: { goalId },
      orderBy: inPlanOrder,
    });
  }

  async getBlockById(id: string): Promise<PlanBlock | null> {
    return this.prisma.planBlock.findUnique({ where: { id } });
  }

  // Without insertAt the block goes to the end of the plan; with it, the
  // block becomes a step between existing ones (#65).
  async createBlock(data: {
    goalId: string;
    title: string;
    instruction: string | null;
    criterion: string | null;
    insertAt?: number;
  }): Promise<PlanBlock> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.planBlock.findMany({
        where: { goalId: data.goalId },
        orderBy: inPlanOrder,
        select: { id: true },
      });
      const index = Math.min(data.insertAt ?? existing.length, existing.length);

      const created = await tx.planBlock.create({
        data: {
          goal: { connect: { id: data.goalId } },
          position: index,
          title: data.title,
          instruction: data.instruction,
          criterion: data.criterion,
        },
      });

      const ids = existing.map((block) => block.id);
      ids.splice(index, 0, created.id);
      await writePositions(tx, ids);

      return { ...created, position: index };
    });
  }

  async updateBlock(
    id: string,
    data: {
      title?: string;
      instruction?: string | null;
      criterion?: string | null;
    },
  ): Promise<PlanBlock> {
    return this.prisma.planBlock.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.instruction !== undefined && {
          instruction: data.instruction,
        }),
        ...(data.criterion !== undefined && { criterion: data.criterion }),
      },
    });
  }

  async deleteBlock(id: string, goalId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.planBlock.delete({ where: { id } });
      const remaining = await tx.planBlock.findMany({
        where: { goalId },
        orderBy: inPlanOrder,
        select: { id: true },
      });
      await writePositions(
        tx,
        remaining.map((block) => block.id),
      );
    });
  }

  async reorderBlocks(
    goalId: string,
    blockIds: string[],
  ): Promise<PlanBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      await writePositions(tx, blockIds);
      return tx.planBlock.findMany({
        where: { goalId },
        orderBy: inPlanOrder,
      });
    });
  }
}
