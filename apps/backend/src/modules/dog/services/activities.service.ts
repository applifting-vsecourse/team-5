import { WorkoutLog, WorkoutStatus } from '@/generated/prisma/client';
import {
  ActivityPage,
  CreateActivityData,
} from '@/modules/dog/domain/activity';
import { ActivityRepository } from '@/modules/dog/repositories/activity.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly dogAccess: DogAccessService,
  ) {}

  // A page of the dog's records (#79), for the owner and a trainer with a share.
  async getActivitiesByDogId(
    user: Identity,
    dogId: string,
    page = 1,
    pageSize = 20,
  ): Promise<ActivityPage> {
    await this.dogAccess.getAccessibleDog(user, dogId);
    return this.activityRepository.getActivitiesByDogId(dogId, {
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async createActivity(
    user: Identity,
    dogId: string,
    data: CreateActivityData,
  ): Promise<WorkoutLog> {
    // A workout record is the owner's own log; a trainer only reads it and
    // answers in its thread (#80).
    await this.dogAccess.getOwnedDog(user, dogId);

    return this.activityRepository.createActivity({
      dogId,
      authorId: user.id,
      title: data.title.trim(),
      discipline: data.discipline?.trim() || null,
      status: data.status ?? WorkoutStatus.COMPLETED,
      completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
      successRate: data.successRate,
      rating: data.rating,
      focus: data.focus,
      repeatedMistakes: data.repeatedMistakes,
      note: data.note?.trim() || null,
      videoUrl: data.videoUrl?.trim() || null,
      skipReason: data.skipReason?.trim() || null,
    });
  }
}
