import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

const messageInclude = {
  author: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  updates(userId: string) {
    return this.prisma.trainingMessage.findMany({
      where: {
        authorId: { not: userId },
        OR: [
          {
            workoutLog: { dog: { ownerId: userId, isArchived: false } },
            author: { role: { in: ['trainer', 'admin'] } },
          },
          {
            workoutLog: {
              dog: {
                isArchived: false,
                shares: { some: { trainerId: userId } },
              },
            },
            author: { role: { notIn: ['trainer', 'admin'] } },
          },
        ],
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

  record(id: string) {
    return this.prisma.workoutLog.findUnique({
      where: { id },
      include: {
        dog: { select: { id: true, name: true, color: true } },
        messages: {
          include: messageInclude,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  reply(workoutLogId: string, authorId: string, text: string) {
    return this.prisma.trainingMessage.create({
      data: { workoutLogId, authorId, text },
      include: messageInclude,
    });
  }
}
