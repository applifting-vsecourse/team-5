import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Discipline,
  GoalTraining,
  PlanBlock,
  Prisma,
} from '@/generated/prisma/client';
import {
  CurrentStepAction,
  moveCurrentStep,
} from '@/modules/dog/domain/current-step';
import {
  DisciplineMembership,
  DogPlan,
  EditableGoal,
  TrainingDetail,
} from '@/modules/dog/domain/hierarchy';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  getPlan(dogId: string): Promise<DogPlan> {
    return this.prisma.dogDiscipline.findMany({
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
        goal: { select: { currentStepId: true } },
      },
    });
    if (!row) return null;
    const { goal, ...training } = row;
    return { ...training, currentStepId: goal.currentStepId };
  }

  // Walks the goal's current step (#66) over the plan of its non-archived
  // trainings. Serialized on the goal like every other structural write, so
  // two quick taps cannot both act on the same step.
  async moveCurrentStep(
    goalId: string,
    action: CurrentStepAction,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const goal = await lockEditableGoal(tx, goalId);
      const steps = await tx.planBlock.findMany({
        where: { goalId, training: { isArchived: false } },
        select: { id: true },
        orderBy: [{ training: { position: 'asc' } }, ...planOrder],
      });
      const move = moveCurrentStep(
        steps.map((step) => step.id),
        goal.currentStepId,
        action,
      );
      if (!move) throw new ConflictException('The goal has no steps');
      for (const [id, outcome] of move.outcomes)
        await tx.planBlock.update({ where: { id }, data: { outcome } });
      await tx.trainingGoal.update({
        where: { id: goalId },
        data: { currentStepId: move.currentStepId },
      });
    });
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
    },
  ): Promise<PlanBlock> {
    return this.prisma.$transaction(async (tx) => {
      await resolveTraining(tx, goalId, trainingId);
      await assertTrainingContentEditable(tx, trainingId);
      const siblings = await tx.planBlock.findMany({
        where: { trainingId },
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
      return created;
    });
  }

  reorderSteps(
    goalId: string,
    trainingId: string,
    ids: string[],
  ): Promise<PlanBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      await resolveTraining(tx, goalId, trainingId);
      await assertTrainingContentEditable(tx, trainingId);
      const current = await tx.planBlock.findMany({ where: { trainingId } });
      validateOrder(current, ids);
      for (const [position, id] of ids.entries())
        await tx.planBlock.update({ where: { id }, data: { position } });
      return tx.planBlock.findMany({
        where: { trainingId },
        orderBy: [...planOrder],
      });
    });
  }
}
