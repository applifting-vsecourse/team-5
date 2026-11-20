import { PrismaService } from '@/core/prisma/prisma.service';
import { GoalStatus, TrainingStatus } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';

export interface PendingTrainingReminder {
  id: string;
  dogId: string;
  dogName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  goalTitle: string;
  discipline: string | null;
  trainingTitle: string;
  stepCount: number;
  durationMinutes: number;
}

@Injectable()
export class TrainingReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingRemindersForDate(
    date: Date,
  ): Promise<PendingTrainingReminder[]> {
    const rows = await this.prisma.scheduledTraining.findMany({
      where: {
        date,
        status: TrainingStatus.PLANNED,
        OR: [
          { reminderSentForDate: null },
          { reminderSentForDate: { not: date } },
        ],
        dog: {
          isArchived: false,
          owner: {
            trainingRemindersEnabled: true,
          },
        },
        goal: {
          status: GoalStatus.ACTIVE,
        },
      },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        goal: {
          select: {
            id: true,
            title: true,
            discipline: true,
          },
        },
        training: {
          select: {
            id: true,
            title: true,
            steps: {
              select: {
                durationMinutes: true,
              },
            },
          },
        },
      },
      orderBy: [{ dog: { name: 'asc' } }, { createdAt: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      dogId: row.dog.id,
      dogName: row.dog.name,
      ownerId: row.dog.owner.id,
      ownerName: row.dog.owner.name,
      ownerEmail: row.dog.owner.email,
      goalTitle: row.goal.title,
      discipline: row.goal.discipline,
      trainingTitle: row.training.title,
      stepCount: row.training.steps.length,
      durationMinutes: row.training.steps.reduce(
        (sum, step) => sum + step.durationMinutes,
        0,
      ),
    }));
  }

  /**
   * Atomically claims pending scheduled trainings for the given date so
   * repeated or concurrent runs on the same day never send duplicate reminders.
   */
  async claimRemindersForDate(
    trainingIds: string[],
    date: Date,
  ): Promise<string[]> {
    if (trainingIds.length === 0) return [];
    const claimed = await this.prisma.scheduledTraining.updateManyAndReturn({
      where: {
        id: { in: trainingIds },
        status: TrainingStatus.PLANNED,
        date,
        OR: [
          { reminderSentForDate: null },
          { reminderSentForDate: { not: date } },
        ],
      },
      data: {
        reminderSentForDate: date,
      },
      select: {
        id: true,
      },
    });
    return claimed.map((row) => row.id);
  }

  /**
   * Releases claimed rows back to unsent when email delivery fails so a later
   * run can retry delivery.
   */
  async releaseRemindersForDate(
    trainingIds: string[],
    date: Date,
  ): Promise<void> {
    if (trainingIds.length === 0) return;
    await this.prisma.scheduledTraining.updateMany({
      where: {
        id: { in: trainingIds },
        reminderSentForDate: date,
      },
      data: {
        reminderSentForDate: null,
      },
    });
  }
}
