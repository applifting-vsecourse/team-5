import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FocusLevel,
  MistakeLevel,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { ActivityPage } from '@/modules/dog/domain/activity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One page of a dog's records, newest first (#79): the history only grows,
  // so it is not loaded at once. The id breaks ties, so pages do not overlap.
  async getActivitiesByDogId(
    dogId: string,
    page: { skip: number; take: number },
  ): Promise<ActivityPage> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.workoutLog.findMany({
        where: { dogId },
        orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
        skip: page.skip,
        take: page.take,
        include: {
          messages: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          },
        },
      }),
      this.prisma.workoutLog.count({ where: { dogId } }),
    ]);
    return { items, total };
  }

  async createActivity(data: {
    dogId: string;
    authorId: string;
    title: string;
    discipline?: string | null;
    status?: WorkoutStatus;
    completedAt?: Date;
    successRate?: number | null;
    rating?: number | null;
    focus?: FocusLevel | null;
    repeatedMistakes?: MistakeLevel | null;
    note?: string | null;
    videoUrl?: string | null;
    skipReason?: string | null;
  }): Promise<WorkoutLog> {
    return this.prisma.workoutLog.create({
      data: {
        dog: { connect: { id: data.dogId } },
        author: { connect: { id: data.authorId } },
        title: data.title,
        discipline: data.discipline ?? null,
        status: data.status ?? WorkoutStatus.COMPLETED,
        completedAt: data.completedAt ?? new Date(),
        successRate: data.successRate ?? null,
        rating: data.rating ?? null,
        focus: data.focus ?? null,
        repeatedMistakes: data.repeatedMistakes ?? null,
        note: data.note ?? null,
        videoUrl: data.videoUrl ?? null,
        skipReason: data.skipReason ?? null,
      },
    });
  }
}
