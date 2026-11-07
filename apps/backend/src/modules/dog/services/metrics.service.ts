import {
  calculateOwnerMetrics,
  calculateTrainingMetrics,
  TrainingMetrics,
} from '@/modules/dog/domain/training-metrics';
import { MetricsRepository } from '@/modules/dog/repositories/metrics.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  constructor(
    private readonly repository: MetricsRepository,
    private readonly dogAccess: DogAccessService,
  ) {}

  async getOwnerMetrics(
    user: Identity,
    now = new Date(),
  ): Promise<TrainingMetrics> {
    return calculateOwnerMetrics(
      await this.repository.getOwnerInputs(user.id),
      now,
    );
  }

  async getMetrics(
    user: Identity,
    dogId: string,
    now = new Date(),
  ): Promise<TrainingMetrics> {
    await this.dogAccess.getAccessibleDog(user, dogId);
    const inputs = await this.repository.getInputs(dogId);
    return calculateTrainingMetrics(
      inputs.workoutLogs,
      inputs.weeklyTarget,
      now,
    );
  }

  async setTarget(
    user: Identity,
    dogId: string,
    weeklyTarget: number,
  ): Promise<{ weeklyTarget: number }> {
    await this.dogAccess.getOwnedDog(user, dogId);
    return this.repository.setWeeklyTarget(dogId, weeklyTarget);
  }
}
