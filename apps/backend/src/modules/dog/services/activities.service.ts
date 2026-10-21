import { WorkoutLog, WorkoutStatus } from '@/generated/prisma/client';
import { CreateActivityData } from '@/modules/dog/domain/activity';
import { Dog } from '@/modules/dog/domain/dog';
import { ActivityRepository } from '@/modules/dog/repositories/activity.repository';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly dogRepository: DogRepository,
  ) {}

  private async assertDogOwnership(
    user: Identity,
    dogId: string,
  ): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return dog;
  }

  async getActivitiesByDogId(
    user: Identity,
    dogId: string,
  ): Promise<WorkoutLog[]> {
    await this.assertDogOwnership(user, dogId);
    return this.activityRepository.getActivitiesByDogId(dogId);
  }

  async createActivity(
    user: Identity,
    dogId: string,
    data: CreateActivityData,
  ): Promise<WorkoutLog> {
    await this.assertDogOwnership(user, dogId);

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
