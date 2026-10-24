import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import {
  ScheduledTraining,
  WeekTraining,
} from '@/modules/dog/domain/scheduled-training';
import { ScheduledTrainingRepository } from '@/modules/dog/repositories/scheduled-training.repository';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Six weeks: enough for a month view later, small enough for one request.
const MAX_RANGE_IN_DAYS = 42;

@Injectable()
export class TrainingsService {
  constructor(
    private readonly scheduledTrainingRepository: ScheduledTrainingRepository,
    private readonly goalsService: GoalsService,
  ) {}

  // The owner's trainings between two days, both included (#72). The range is
  // capped so one request cannot pull a whole year.
  async getWeekTrainings(
    user: Identity,
    from: string,
    to: string,
  ): Promise<WeekTraining[]> {
    const fromDate = fromCalendarDate(from);
    const toDate = fromCalendarDate(to);
    const days = (toDate.getTime() - fromDate.getTime()) / DAY_IN_MS + 1;
    if (days < 1 || days > MAX_RANGE_IN_DAYS) {
      throw new BadRequestException(
        `The range must cover 1 to ${MAX_RANGE_IN_DAYS} days`,
      );
    }
    return this.scheduledTrainingRepository.getOwnerTrainingsBetween(
      user.id,
      fromDate,
      toDate,
    );
  }

  // Trainings are visible exactly when their goal is; getGoal throws 404 otherwise.
  async getGoalTrainings(
    user: Identity,
    goalId: string,
  ): Promise<ScheduledTraining[]> {
    await this.goalsService.getGoal(user, goalId);
    return this.scheduledTrainingRepository.getTrainingsByGoalId(goalId);
  }

  // Adds an independent dated session to a reusable goal. Other sessions
  // remain untouched; only the same goal/day cannot be planned twice.
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
      throw new ConflictException(
        'This goal already has a planned training on this day',
      );
    }
    return training;
  }
}
