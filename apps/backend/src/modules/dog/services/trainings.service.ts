import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { ScheduledTraining } from '@/modules/dog/domain/scheduled-training';
import { ScheduledTrainingRepository } from '@/modules/dog/repositories/scheduled-training.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TrainingsService {
  constructor(
    private readonly scheduledTrainingRepository: ScheduledTrainingRepository,
    private readonly goalsService: GoalsService,
  ) {}

  // Trainings are visible exactly when their goal is; getGoal throws 404 otherwise.
  async getGoalTrainings(
    user: Identity,
    goalId: string,
  ): Promise<ScheduledTraining[]> {
    await this.goalsService.getGoal(user, goalId);
    return this.scheduledTrainingRepository.getTrainingsByGoalId(goalId);
  }

  // Puts the goal's training on one day (#71). A day in the past is refused,
  // and a goal that already has a planned training is refused with 409;
  // changing its day will be a move (#74), not a second plan.
  async scheduleTraining(
    user: Identity,
    goalId: string,
    date: string,
    now: Date = new Date(),
  ): Promise<ScheduledTraining> {
    const goal = await this.goalsService.getGoal(user, goalId);

    // Both sides are YYYY-MM-DD, so string order is date order.
    if (date < todayInAppZone(now)) {
      throw new BadRequestException('A training cannot be planned in the past');
    }

    const training =
      await this.scheduledTrainingRepository.createPlannedTraining({
        goalId,
        dogId: goal.dogId,
        createdById: user.id,
        date: fromCalendarDate(date),
      });
    if (!training) {
      throw new ConflictException('This training is already planned for a day');
    }
    return training;
  }
}
