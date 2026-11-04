import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { Injectable } from '@nestjs/common';
import { PlanReplyContext, recordPlanReply } from './training-reply.repository';

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
  async createBlock(
    data: {
      goalId: string;
      title: string;
      instruction: string | null;
      criterion: string | null;
      insertAt?: number;
    },
    reply?: PlanReplyContext,
  ): Promise<PlanBlock> {
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
      await recordPlanReply(tx, data.goalId, reply);

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
    reply?: PlanReplyContext,
  ): Promise<PlanBlock> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.planBlock.findUniqueOrThrow({ where: { id } });
      const updated = await tx.planBlock.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.instruction !== undefined && {
            instruction: data.instruction,
          }),
          ...(data.criterion !== undefined && { criterion: data.criterion }),
        },
      });
      if (
        before.title !== updated.title ||
        before.instruction !== updated.instruction ||
        before.criterion !== updated.criterion
      ) {
        await recordPlanReply(tx, updated.goalId, reply);
      }
      return updated;
    });
  }

  async deleteBlock(
    id: string,
    goalId: string,
    reply?: PlanReplyContext,
  ): Promise<void> {
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
      await recordPlanReply(tx, goalId, reply);
    });
  }

  async reorderBlocks(
    goalId: string,
    blockIds: string[],
    reply?: PlanReplyContext,
  ): Promise<PlanBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.planBlock.findMany({
        where: { goalId },
        orderBy: inPlanOrder,
        select: { id: true },
      });
      await writePositions(tx, blockIds);
      if (before.some((block, index) => block.id !== blockIds[index])) {
        await recordPlanReply(tx, goalId, reply);
      }
      return tx.planBlock.findMany({
        where: { goalId },
        orderBy: inPlanOrder,
      });
    });
  }
}
