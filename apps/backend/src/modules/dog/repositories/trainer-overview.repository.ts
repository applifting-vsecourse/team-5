import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainerOverviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Every connected client with only the dogs they share with this trainer.
  inputs(trainerId: string) {
    return this.prisma.clientConnection.findMany({
      where: { trainerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dogs: {
              where: { isArchived: false, shares: { some: { trainerId } } },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                name: true,
                color: true,
                breed: true,
                createdAt: true,
                goals: {
                  where: { status: 'ACTIVE' },
                  select: {
                    id: true,
                    title: true,
                    deadline: true,
                    blocks: {
                      where: { training: { isArchived: false } },
                      select: { outcome: true },
                    },
                  },
                  orderBy: [{ order: 'asc' }, { id: 'asc' }],
                },
                workoutLogs: {
                  orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
                  select: {
                    id: true,
                    title: true,
                    completedAt: true,
                    status: true,
                    successRate: true,
                    note: true,
                    messages: {
                      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                      take: 1,
                      select: { authorId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
