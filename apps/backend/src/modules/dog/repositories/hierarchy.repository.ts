import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Discipline,
  GoalTraining,
  PlanBlock,
  Prisma,
} from '@/generated/prisma/client';
import {
  DisciplineMembership,
  DogPlan,
  EditableGoal,
  TrainingDetail,
} from '@/modules/dog/domain/hierarchy';
import { displayOrder } from '@/modules/dog/domain/step-order';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { recordPlanReply } from './training-reply.repository';

export const planOrder = [{ position: 'asc' }, { id: 'asc' }] as const;

// A dated completion preserves this definition's steps for historical reads.
// Reusing the definition on another date remains allowed; editing needs a new training.
export async function assertTrainingContentEditable(
  tx: Prisma.TransactionClient,
  trainingId: string,
): Promise<void> {
  const completed = await tx.scheduledTraining.count({
    where: { trainingId, status: 'COMPLETED' },
  });
  if (completed > 0) {
    throw new ConflictException('Completed training content is read-only');
  }
}

// All structural writes serialize on the goal, including legacy endpoints.
export async function lockEditableGoal(
  tx: Prisma.TransactionClient,
  goalId: string,
): Promise<EditableGoal> {
  await tx.$queryRaw`SELECT "id" FROM "training_goal" WHERE "id" = ${goalId} FOR UPDATE`;
  const goal = await tx.trainingGoal.findUnique({
    where: { id: goalId },
    include: { dog: true, disciplineEntity: true },
  });
  if (!goal) throw new NotFoundException('Goal not found');
  if (
    goal.status === 'ARCHIVED' ||
    goal.status === 'COMPLETED' ||
    goal.dog.isArchived ||
    goal.disciplineEntity.isArchived
  ) {
    throw new ConflictException(
      'The goal or its parent is archived or completed',
    );
  }
  return goal;
}

export async function resolveTraining(
  tx: Prisma.TransactionClient,
  goalId: string,
  trainingId?: string,
): Promise<GoalTraining> {
  const goal = await lockEditableGoal(tx, goalId);
  if (trainingId) {
    const training = await tx.goalTraining.findFirst({
      where: { id: trainingId, goalId },
    });
    if (!training) throw new NotFoundException('Training not found');
    if (training.isArchived)
      throw new ConflictException('Training is archived');
    return training;
  }
  const trainings = await tx.goalTraining.findMany({ where: { goalId } });
  if (trainings.length > 1)
    throw new ConflictException('Select a concrete training');
  if (trainings[0]?.isArchived)
    throw new ConflictException('Training is archived');
  return (
    trainings[0] ??
    tx.goalTraining.create({ data: { goalId, title: goal.title } })
  );
}

// Depth-1 only: parent must be a root step of this training (#67).
export async function resolveSubStepParent(
  tx: Prisma.TransactionClient,
  trainingId: string,
  parentId: string | undefined,
): Promise<string | null> {
  if (!parentId) return null;
  const parent = await tx.planBlock.findFirst({
    where: { id: parentId, trainingId },
  });
  if (!parent) throw new NotFoundException('Parent step not found');
  if (parent.parentId != null) {
    throw new BadRequestException('A sub-step cannot be split further');
  }
  return parent.id;
}

function validateOrder(current: { id: string }[], ids: string[]): void {
  const allowed = new Set(current.map((item) => item.id));
  if (
    ids.length !== allowed.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !allowed.has(id))
  ) {
    throw new BadRequestException(
      'List every item of this parent exactly once',
    );
  }
}

@Injectable()
export class HierarchyRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDisciplines(): Promise<Discipline[]> {
    return this.prisma.discipline.findMany({ orderBy: { name: 'asc' } });
  }

  async getPlan(dogId: string): Promise<DogPlan> {
    const plan = await this.prisma.dogDiscipline.findMany({
      where: { dogId },
      include: {
        discipline: true,
        goals: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
          include: {
            createdBy: { select: { name: true } },
            sessions: {
              orderBy: [...planOrder],
              include: {
                steps: { orderBy: [...planOrder] },
                workoutLogs: {
                  where: { scheduledTrainingId: null, status: 'COMPLETED' },
                  select: { id: true, completedAt: true },
                },
                scheduledTrainings: {
                  select: { id: true, date: true, status: true },
                  orderBy: { date: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return plan.map((link) => ({
      ...link,
      goals: link.goals.map((goal) => ({
        ...goal,
        sessions: goal.sessions.map((session) => ({
          ...session,
          steps: displayOrder(session.steps),
        })),
      })),
    }));
  }

  async setDiscipline(
    dogId: string,
    name: string,
    isArchived: boolean,
  ): Promise<DisciplineMembership> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "dog" WHERE "id" = ${dogId} FOR UPDATE`;
      const dog = await tx.dog.findUniqueOrThrow({ where: { id: dogId } });
      const discipline = await tx.discipline.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      const link = await tx.dogDiscipline.upsert({
        where: { dogId_disciplineId: { dogId, disciplineId: discipline.id } },
        create: { dogId, disciplineId: discipline.id, isArchived },
        update: { isArchived },
      });
      await tx.dog.update({
        where: { id: dogId },
        data: {
          disciplines: isArchived
            ? dog.disciplines.filter((n) => n !== name)
            : [...new Set([...dog.disciplines, name])],
        },
      });
      return { ...link, discipline };
    });
  }

  async getTraining(id: string): Promise<TrainingDetail | null> {
    const row = await this.prisma.goalTraining.findUnique({
      where: { id },
      include: {
        steps: { orderBy: [...planOrder] },
      },
    });
    if (!row) return null;
    return { ...row, steps: displayOrder(row.steps) };
  }

  createTraining(
    goalId: string,
    title: string,
    insertAt?: number,
  ): Promise<GoalTraining> {
    return this.prisma.$transaction(async (tx) => {
      await lockEditableGoal(tx, goalId);
      const siblings = await tx.goalTraining.findMany({
        where: { goalId },
        orderBy: [...planOrder],
      });
      const position = Math.min(insertAt ?? siblings.length, siblings.length);
      const created = await tx.goalTraining.create({
        data: { goalId, title, position },
      });
      siblings.splice(position, 0, created);
      for (const [index, sibling] of siblings.entries()) {
        await tx.goalTraining.update({
          where: { id: sibling.id },
          data: { position: index },
        });
      }
      return created;
    });
  }

  updateTraining(
    id: string,
    goalId: string,
    data: { title?: string; isArchived?: boolean },
    actorId?: string,
  ): Promise<GoalTraining> {
    return this.prisma.$transaction(async (tx) => {
      await lockEditableGoal(tx, goalId);
      const training = await tx.goalTraining.findUniqueOrThrow({
        where: { id },
      });
      if (data.title !== undefined) await assertTrainingContentEditable(tx, id);
      if (
        training.isArchived &&
        data.isArchived !== false &&
        data.title !== undefined
      ) {
        throw new ConflictException('Restore the training before editing it');
      }
      await recordPlanReply(tx, id, actorId);
      return tx.goalTraining.update({ where: { id }, data });
    });
  }

  reorderTrainings(goalId: string, ids: string[]): Promise<GoalTraining[]> {
    return this.prisma.$transaction(async (tx) => {
      await lockEditableGoal(tx, goalId);
      const current = await tx.goalTraining.findMany({ where: { goalId } });
      validateOrder(current, ids);
      for (const [position, id] of ids.entries())
        await tx.goalTraining.update({ where: { id }, data: { position } });
      return tx.goalTraining.findMany({
        where: { goalId },
        orderBy: [...planOrder],
      });
    });
  }

  createStep(
    goalId: string,
    trainingId: string,
    data: {
      title: string;
      instruction?: string;
      criterion?: string;
      durationMinutes?: number;
      insertAt?: number;
      parentId?: string;
    },
    actorId?: string,
  ): Promise<PlanBlock> {
    return this.prisma.$transaction(async (tx) => {
      await resolveTraining(tx, goalId, trainingId);
      await assertTrainingContentEditable(tx, trainingId);
      const parentId = await resolveSubStepParent(
        tx,
        trainingId,
        data.parentId,
      );
      const siblings = await tx.planBlock.findMany({
        where: { trainingId, parentId },
        orderBy: [...planOrder],
      });
      const position = Math.min(
        data.insertAt ?? siblings.length,
        siblings.length,
      );
      const created = await tx.planBlock.create({
        data: {
          goalId,
          trainingId,
          parentId,
          position,
          title: data.title.trim(),
          instruction: data.instruction?.trim() || null,
          criterion: data.criterion?.trim() || null,
          durationMinutes: data.durationMinutes ?? 0,
        },
      });
      siblings.splice(position, 0, created);
      for (const [index, sibling] of siblings.entries())
        await tx.planBlock.update({
          where: { id: sibling.id },
          data: { position: index },
        });
      await recordPlanReply(tx, trainingId, actorId);
      return created;
    });
  }

  // Reorders one sibling group (roots or children of one parent).
  reorderSteps(
    goalId: string,
    trainingId: string,
    ids: string[],
    actorId?: string,
  ): Promise<PlanBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      await resolveTraining(tx, goalId, trainingId);
      await assertTrainingContentEditable(tx, trainingId);
      const current = await tx.planBlock.findMany({ where: { trainingId } });
      const byId = new Map(current.map((step) => [step.id, step]));
      const first = byId.get(ids[0] ?? '');
      if (!first) {
        throw new BadRequestException(
          'List every item of this parent exactly once',
        );
      }
      const siblings = current.filter(
        (step) => step.parentId === first.parentId,
      );
      validateOrder(siblings, ids);
      for (const [position, id] of ids.entries())
        await tx.planBlock.update({ where: { id }, data: { position } });
      await recordPlanReply(tx, trainingId, actorId);
      return displayOrder(
        await tx.planBlock.findMany({
          where: { trainingId },
          orderBy: [...planOrder],
        }),
      );
    });
  }
}
