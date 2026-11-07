import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import {
  calculateOwnerMetrics,
  calculateTrainingMetrics,
  TrainingMetrics,
} from '@/modules/dog/domain/training-metrics';
import { MetricsRepository } from '@/modules/dog/repositories/metrics.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, Injectable } from '@nestjs/common';

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

  async getOwnerWeekMetrics(
    user: Identity,
    from: string,
    to: string,
    now = new Date(),
  ): Promise<{ weeklyTarget: number; weeklyTrainedDays: number }> {
    if (
      fromCalendarDate(to).getTime() - fromCalendarDate(from).getTime() !==
      6 * 86400000
    )
      throw new BadRequestException('Vyber celý týden.');
    const inputs = await this.repository.getOwnerInputs(user.id);
    return {
      weeklyTarget: inputs.reduce((sum, dog) => sum + dog.weeklyTarget, 0),
      weeklyTrainedDays: inputs.reduce(
        (sum, dog) =>
          sum +
          new Set(
            dog.workoutLogs
              .filter(
                (log) => log.status === 'COMPLETED' && log.completedAt <= now,
              )
              .map((log) => todayInAppZone(log.completedAt))
              .filter((day) => day >= from && day <= to),
          ).size,
        0,
      ),
    };
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
