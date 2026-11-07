import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FocusLevel,
  MistakeLevel,
  TrainingStatus,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { effectiveCurrentStepId } from '@/modules/dog/domain/current-step';
import {
  ScheduledTraining,
  ScheduledTrainingDetail,
  WeekTraining,
} from '@/modules/dog/domain/scheduled-training';
import { Injectable } from '@nestjs/common';
import { planOrder, resolveTraining } from './hierarchy.repository';

@Injectable()
export class ScheduledTrainingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // The week is the owner's own view (#72): trainings of their active dogs.
  // A trainer sees clients' dogs elsewhere (Klienti), not in this week.
  async getOwnerTrainingsBetween(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<WeekTraining[]> {
    const rows = await this.prisma.scheduledTraining.findMany({
      where: {
        date: { gte: from, lte: to },
        dog: { ownerId, isArchived: false },
      },
      include: {
        workoutLog: { select: { successRate: true } },
        dog: { select: { id: true, name: true, color: true } },
        goal: {
          select: {
            id: true,
            title: true,
            discipline: true,
            sessions: {
              where: { isArchived: false },
              select: { id: true },
              orderBy: [...planOrder],
            },
          },
        },
        training: {
          select: {
            id: true,
            title: true,
            steps: {
              select: { id: true, title: true, durationMinutes: true },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({
      ...row,
      training: {
        ...row.training,
        position: Math.max(
          0,
          row.goal.sessions.findIndex(
            (session) => session.id === row.training.id,
          ),
        ),
        total: row.goal.sessions.length,
      },
      goal: { ...row.goal, blocks: row.training.steps },
    }));
  }

  async getTrainingsByGoalId(goalId: string): Promise<ScheduledTraining[]> {
    return this.prisma.scheduledTraining.findMany({
      where: { goalId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTrainingById(id: string): Promise<ScheduledTrainingDetail | null> {
    const row = await this.prisma.scheduledTraining.findUnique({
      where: { id },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            color: true,
            ownerId: true,
            shares: {
              select: { id: true, trainerId: true },
            },
          },
        },
        goal: { select: { id: true, title: true, currentStepId: true } },
        training: {
          select: {
            id: true,
            title: true,
            steps: {
              select: {
                id: true,
                position: true,
                title: true,
                instruction: true,
                criterion: true,
                durationMinutes: true,
                outcome: true,
              },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    });
    if (!row) return null;
    // Walkthrough compares the pointer to this training's steps; expose the
    // effective first step of the whole goal when the stored pointer is null.
    const goalSteps = await this.prisma.planBlock.findMany({
      where: { goalId: row.goal.id, training: { isArchived: false } },
      select: { id: true },
      orderBy: [{ training: { position: 'asc' } }, ...planOrder],
    });
    return {
      ...row,
      goal: {
        ...row.goal,
        currentStepId: effectiveCurrentStepId(
          goalSteps.map((step) => step.id),
          row.goal.currentStepId,
        ),
        blocks: row.training.steps,
      },
    };
  }

  // A goal can be practised on many days. Only a duplicate planned session
  // for the same day is refused (including concurrent double submissions).
  // A transaction alone does not stop two quick clicks: under READ COMMITTED
  // both would see "nothing planned" and insert. Locking the goal row first
  // makes concurrent requests for the same goal wait for each other, so the
  // second one sees the first one's training.
  async createPlannedTraining(data: {
    trainingId?: string;
    goalId: string;
    dogId: string;
    createdById: string;
    date: Date;
  }): Promise<ScheduledTraining | null> {
    return this.prisma.$transaction(async (tx) => {
      const training = await resolveTraining(tx, data.goalId, data.trainingId);

      const planned = await tx.scheduledTraining.findFirst({
        where: {
          trainingId: training.id,
          date: data.date,
          status: TrainingStatus.PLANNED,
        },
        select: { id: true },
      });
      if (planned) return null;

      return tx.scheduledTraining.create({
        data: {
          training: { connect: { id: training.id } },
          goal: { connect: { id: data.goalId } },
          dog: { connect: { id: data.dogId } },
          createdBy: { connect: { id: data.createdById } },
          date: data.date,
        },
      });
    });
  }

  // Returns null when the training is no longer planned. The status check is
  // part of the update itself, so a training completed in the meantime
  // (e.g. on another device) is never moved. A goal is practised on many
  // days but at most once a day: 'day-taken' when it already has a planned
  // training on the new day. The goal row is locked like when planning (#71),
  // so a move and a new plan for the same day cannot both get through.
  async movePlannedTraining(
    id: string,
    goalId: string,
    date: Date,
  ): Promise<ScheduledTraining | 'day-taken' | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "training_goal" WHERE "id" = ${goalId} FOR UPDATE`;

      const current = await tx.scheduledTraining.findUniqueOrThrow({
        where: { id },
      });

      const sameDay = await tx.scheduledTraining.findFirst({
        where: {
          trainingId: current.trainingId,
          date,
          status: TrainingStatus.PLANNED,
          id: { not: id },
        },
        select: { id: true },
      });
      if (sameDay) return 'day-taken';

      const { count } = await tx.scheduledTraining.updateMany({
        where: { id, status: TrainingStatus.PLANNED },
        data: { date },
      });
      if (count === 0) return null;
      return tx.scheduledTraining.findUnique({ where: { id } });
    });
  }

  // Marks a planned training as skipped and writes a "skipped" record for the
  // dog's Activities (#75), both or neither. Returns null when the training
  // is no longer planned (completed or skipped meanwhile).
  async skipPlannedTraining(
    id: string,
    authorId: string,
  ): Promise<ScheduledTraining | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.scheduledTraining.updateMany({
        where: { id, status: TrainingStatus.PLANNED },
        data: { status: TrainingStatus.SKIPPED },
      });
      if (count === 0) return null;

      const training = await tx.scheduledTraining.findUniqueOrThrow({
        where: { id },
        include: { training: { select: { title: true } } },
      });
      const goal = await tx.trainingGoal.findUniqueOrThrow({
        where: { id: training.goalId },
        select: { title: true, discipline: true },
      });
      await tx.workoutLog.create({
        data: {
          dog: { connect: { id: training.dogId } },
          goal: { connect: { id: training.goalId } },
          author: { connect: { id: authorId } },
          scheduledTraining: { connect: { id } },
          training: { connect: { id: training.trainingId } },
          title: training.training.title,
          discipline: goal.discipline,
          status: WorkoutStatus.SKIPPED,
          // The record belongs to the day the training was planned for.
          completedAt: training.date,
        },
      });
      return training;
    });
  }

  // Takes a skip back (#75): the training is planned again and its "skipped"
  // record disappears. Like planning (#71), it locks the goal row, so a goal
  // never ends up with two planned trainings on the same day ('day-taken').
  async restoreSkippedTraining(
    id: string,
    goalId: string,
    date: Date,
  ): Promise<ScheduledTraining | 'not-skipped' | 'day-taken'> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "training_goal" WHERE "id" = ${goalId} FOR UPDATE`;

      const current = await tx.scheduledTraining.findUniqueOrThrow({
        where: { id },
      });

      const sameDay = await tx.scheduledTraining.findFirst({
        where: {
          trainingId: current.trainingId,
          date,
          status: TrainingStatus.PLANNED,
        },
        select: { id: true },
      });
      if (sameDay) return 'day-taken';

      const { count } = await tx.scheduledTraining.updateMany({
        where: { id, status: TrainingStatus.SKIPPED },
        data: { status: TrainingStatus.PLANNED },
      });
      if (count === 0) return 'not-skipped';

      await tx.workoutLog.deleteMany({ where: { scheduledTrainingId: id } });
      return tx.scheduledTraining.findUniqueOrThrow({ where: { id } });
    });
  }

  // A dog's trainings still to be done, for its Activities (#74): the owner
  // and a trainer with a share see the day each one is planned for.
  async getPlannedTrainingsByDogId(dogId: string): Promise<WeekTraining[]> {
    const rows = await this.prisma.scheduledTraining.findMany({
      where: { dogId, status: TrainingStatus.PLANNED },
      include: {
        dog: { select: { id: true, name: true, color: true } },
        goal: { select: { id: true, title: true } },
        training: {
          select: {
            id: true,
            title: true,
            steps: {
              select: { id: true, title: true },
              orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({
      ...row,
      goal: { ...row.goal, blocks: row.training.steps },
    }));
  }

  async completeTraining(
    trainingId: string,
    authorId: string,
    data: {
      successRate?: number | null;
      focus?: FocusLevel | null;
      repeatedMistakes?: MistakeLevel | null;
      mistakeDetails?: string[];
      note?: string | null;
      videoUrl?: string | null;
    },
  ): Promise<WorkoutLog | null> {
    return this.prisma.$transaction(async (tx) => {
      // Serialize completion with definition edits before freezing its content.
      await tx.$queryRaw`SELECT g."id" FROM "training_goal" g
        JOIN "scheduled_training" s ON s."goalId" = g."id"
        WHERE s."id" = ${trainingId} FOR UPDATE OF g`;
      // The status check is part of the UPDATE, so of two quick submits
      // (double click, a retry on a weak signal) only one completes the
      // training and writes a record. Null: it is no longer planned.
      const { count } = await tx.scheduledTraining.updateMany({
        where: { id: trainingId, status: TrainingStatus.PLANNED },
        data: { status: TrainingStatus.COMPLETED },
      });
      if (count === 0) return null;

      const training = await tx.scheduledTraining.findUniqueOrThrow({
        where: { id: trainingId },
        include: {
          training: { select: { title: true } },
          goal: {
            select: {
              id: true,
              title: true,
              discipline: true,
            },
          },
        },
      });

      return tx.workoutLog.create({
        data: {
          dog: { connect: { id: training.dogId } },
          goal: { connect: { id: training.goalId } },
          author: { connect: { id: authorId } },
          scheduledTraining: { connect: { id: trainingId } },
          training: { connect: { id: training.trainingId } },
          title: training.training.title,
          discipline: training.goal.discipline ?? null,
          status: WorkoutStatus.COMPLETED,
          completedAt: new Date(),
          successRate: data.successRate ?? null,
          focus: data.focus ?? null,
          repeatedMistakes: data.repeatedMistakes ?? null,
          ...(data.mistakeDetails !== undefined && {
            mistakeDetails: [
              ...new Set(data.mistakeDetails.map((detail) => detail.trim())),
            ],
          }),
          note: data.note?.trim() || null,
          videoUrl: data.videoUrl?.trim() || null,
        },
      });
    });
  }
}
