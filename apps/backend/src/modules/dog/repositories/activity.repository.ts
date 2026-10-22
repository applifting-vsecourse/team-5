import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FocusLevel,
  MistakeLevel,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { ActivityWithMessages } from '@/modules/dog/domain/activity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActivitiesByDogId(dogId: string): Promise<ActivityWithMessages[]> {
    return this.prisma.workoutLog.findMany({
      where: { dogId },
      orderBy: { completedAt: 'desc' },
      include: {
        messages: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
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
