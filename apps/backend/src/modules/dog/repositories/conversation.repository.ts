import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  recordMessageReply,
  replyDogAccess,
} from './training-reply.repository';

const messageInclude = {
  author: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  updates(userId: string) {
    return this.prisma.trainingMessage.findMany({
      where: {
        workoutLog: {
          dog: {
            isArchived: false,
            OR: [
              { ownerId: userId },
              { shares: { some: { trainerId: userId } } },
            ],
          },
        },
      },
      include: {
        ...messageInclude,
        workoutLog: {
          select: {
            id: true,
            title: true,
            dog: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 30,
    });
  }

  record(id: string, userId?: string) {
    return this.prisma.workoutLog.findUnique({
      where: { id },
      include: {
        unreadReplies: {
          where: { recipientId: userId ?? '' },
          select: { id: true },
        },
        scheduledTraining: {
          select: {
            unreadReplies: {
              where: { recipientId: userId ?? '' },
              select: { id: true },
            },
          },
        },
        author: { select: { id: true, name: true } },
        dog: { select: { id: true, name: true, color: true } },
        training: {
          select: {
            title: true,
            steps: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                position: true,
              },
            },
          },
        },
        messages: {
          include: messageInclude,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  reply(workoutLogId: string, authorId: string, text: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.workoutLog.findFirstOrThrow({
        where: { id: workoutLogId, dog: replyDogAccess(authorId) },
      });
      const message = await tx.trainingMessage.create({
        data: { workoutLogId, authorId, text },
        include: messageInclude,
      });
      await recordMessageReply(tx, workoutLogId, authorId);
      return message;
    });
  }
}
