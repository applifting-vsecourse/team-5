import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainingNotificationKind } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailNotificationsEnabled: true,
} as const;

@Injectable()
export class TrainingNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findThreadContext(workoutLogId: string) {
    return this.prisma.workoutLog.findUnique({
      where: { id: workoutLogId },
      select: {
        id: true,
        title: true,
        dogId: true,
        dog: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            owner: { select: userSelect },
            shares: {
              select: {
                trainer: { select: userSelect },
              },
            },
          },
        },
      },
    });
  }

  findState(workoutLogId: string, recipientId: string) {
    return this.prisma.trainingEmailNotification.findUnique({
      where: {
        workoutLogId_recipientId: { workoutLogId, recipientId },
      },
    });
  }

  recordImmediateSend(workoutLogId: string, recipientId: string, sentAt: Date) {
    return this.prisma.trainingEmailNotification.upsert({
      where: {
        workoutLogId_recipientId: { workoutLogId, recipientId },
      },
      create: {
        workoutLogId,
        recipientId,
        lastSentAt: sentAt,
        nextDigestAt: null,
      },
      update: {
        lastSentAt: sentAt,
        nextDigestAt: null,
      },
    });
  }

  enqueuePendingEvent(params: {
    workoutLogId: string;
    recipientId: string;
    nextDigestAt: Date;
    kind: TrainingNotificationKind;
    actorId: string | null;
    text?: string | null;
  }) {
    return this.prisma.trainingEmailNotification.upsert({
      where: {
        workoutLogId_recipientId: {
          workoutLogId: params.workoutLogId,
          recipientId: params.recipientId,
        },
      },
      create: {
        workoutLogId: params.workoutLogId,
        recipientId: params.recipientId,
        nextDigestAt: params.nextDigestAt,
        pendingEvents: {
          create: {
            kind: params.kind,
            actorId: params.actorId,
            text: params.text ?? null,
          },
        },
      },
      update: {
        nextDigestAt: params.nextDigestAt,
        pendingEvents: {
          create: {
            kind: params.kind,
            actorId: params.actorId,
            text: params.text ?? null,
          },
        },
      },
    });
  }

  findDueDigests(now: Date) {
    return this.prisma.trainingEmailNotification.findMany({
      where: {
        nextDigestAt: { lte: now },
        pendingEvents: { some: {} },
      },
      include: {
        recipient: { select: userSelect },
        workoutLog: {
          select: {
            id: true,
            title: true,
            dogId: true,
            dog: { select: { id: true, name: true } },
          },
        },
        pendingEvents: {
          include: {
            actor: { select: { id: true, name: true } },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  async clearEvents(notificationId: string, eventIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.trainingEmailNotificationEvent.deleteMany({
        where: { id: { in: eventIds } },
      });
      const remaining = await tx.trainingEmailNotificationEvent.count({
        where: { notificationId },
      });
      if (remaining === 0) {
        await tx.trainingEmailNotification.update({
          where: { id: notificationId },
          data: { nextDigestAt: null },
        });
      }
    });
  }

  async markDigestSent(
    notificationId: string,
    eventIds: string[],
    sentAt: Date,
    nextDigestIfRemaining: Date,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.trainingEmailNotificationEvent.deleteMany({
        where: { id: { in: eventIds } },
      });
      const remaining = await tx.trainingEmailNotificationEvent.count({
        where: { notificationId },
      });
      await tx.trainingEmailNotification.update({
        where: { id: notificationId },
        data: {
          lastSentAt: sentAt,
          nextDigestAt: remaining > 0 ? nextDigestIfRemaining : null,
        },
      });
    });
  }
}
