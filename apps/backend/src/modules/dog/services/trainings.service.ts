import { TrainingStatus, WorkoutLog } from '@/generated/prisma/client';
import {
  fromCalendarDate,
  lastDayOfWeek,
  toCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import {
  CompleteTrainingData,
  ScheduledTraining,
  ScheduledTrainingDetail,
  WeekTraining,
} from '@/modules/dog/domain/scheduled-training';
import { ScheduledTrainingRepository } from '@/modules/dog/repositories/scheduled-training.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { GoalsService } from '@/modules/dog/services/goals.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Six weeks: enough for a month view later, small enough for one request.
const MAX_RANGE_IN_DAYS = 42;

@Injectable()
export class TrainingsService {
  constructor(
    private readonly scheduledTrainingRepository: ScheduledTrainingRepository,
    private readonly goalsService: GoalsService,
    private readonly dogAccessService: DogAccessService,
  ) {}

  // Details of a single scheduled training for walkthrough (#76).
  // Throws 404 when missing or when the user has no access to the dog.
  async getTraining(
    user: Identity,
    trainingId: string,
  ): Promise<ScheduledTrainingDetail> {
    const training =
      await this.scheduledTrainingRepository.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException(`Training with ID ${trainingId} not found`);
    }

    try {
      await this.dogAccessService.getAccessibleDog(user, training.dogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Training with ID ${trainingId} not found`);
      }
      throw error;
    }

    return training;
  }

  // Completes the scheduled training and writes a workout log (#77).
  // Only the dog's owner can complete their dog's training.
  async completeTraining(
    user: Identity,
    trainingId: string,
    data: CompleteTrainingData,
  ): Promise<WorkoutLog> {
    const training =
      await this.scheduledTrainingRepository.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException(`Training with ID ${trainingId} not found`);
    }

    await this.dogAccessService.getOwnedDog(user, training.dogId);

    if (training.status === TrainingStatus.COMPLETED) {
      throw new ConflictException('This training is already completed');
    }
    // A skipped training already has its record (#75); take the skip back first.
    if (training.status === TrainingStatus.SKIPPED) {
      throw new ConflictException('This training is skipped');
    }

    const log = await this.scheduledTrainingRepository.completeTraining(
      trainingId,
      user.id,
      data,
    );
    // Completed or skipped meanwhile, e.g. a second submit of the same form.
    if (!log) {
      throw new ConflictException('Only a planned training can be completed');
    }
    return log;
  }

  // Moves a planned training to another day (#74), in any week. Like the
  // walkthrough's record (#77) it is the owner's own plan, so a trainer with a
  // share gets 403. A completed or skipped training stays where it happened.
  async moveTraining(
    user: Identity,
    trainingId: string,
    date: string,
    now: Date = new Date(),
  ): Promise<ScheduledTraining> {
    const training = await this.getOwnedTraining(user, trainingId);

    if (date < todayInAppZone(now)) {
      throw new BadRequestException('A training cannot be moved to the past');
    }

    const moved =
      training.status === TrainingStatus.PLANNED
        ? await this.scheduledTrainingRepository.movePlannedTraining(
            trainingId,
            training.goalId,
            fromCalendarDate(date),
          )
        : null;
    if (!moved) {
      throw new ConflictException('Only a planned training can be moved');
    }
    if (moved === 'day-taken') {
      throw new ConflictException(
        'This goal already has a planned training on this day',
      );
    }
    return moved;
  }

  // Skips a planned training (#75). The training stays in the week marked as
  // skipped and the dog's Activities get a "skipped" record. The plan itself
  // does not move on: the goal's exercises stay as they are.
  async skipTraining(
    user: Identity,
    trainingId: string,
  ): Promise<ScheduledTraining> {
    const training = await this.getOwnedTraining(user, trainingId);
    const skipped =
      training.status === TrainingStatus.PLANNED
        ? await this.scheduledTrainingRepository.skipPlannedTraining(
            trainingId,
            user.id,
          )
        : null;
    if (!skipped) {
      throw new ConflictException('Only a planned training can be skipped');
    }
    return skipped;
  }

  // Takes a skip back (#75) until the training's week is over: from the
  // Monday after it, the skip stays.
  async undoSkip(
    user: Identity,
    trainingId: string,
    now: Date = new Date(),
  ): Promise<ScheduledTraining> {
    const training = await this.getOwnedTraining(user, trainingId);
    if (training.status !== TrainingStatus.SKIPPED) {
      throw new ConflictException('This training is not skipped');
    }
    if (todayInAppZone(now) > lastDayOfWeek(toCalendarDate(training.date))) {
      throw new ConflictException(
        "The skip can only be undone until the training's week is over",
      );
    }

    const result =
      await this.scheduledTrainingRepository.restoreSkippedTraining(
        trainingId,
        training.goalId,
        training.date,
      );
    if (result === 'day-taken') {
      throw new ConflictException(
        'This goal already has a planned training on this day',
      );
    }
    if (result === 'not-skipped') {
      throw new ConflictException('This training is not skipped');
    }
    return result;
  }

  // The training, when the user owns its dog: a trainer with a share gets 403,
  // anyone else the same 404 as for a training that does not exist.
  private async getOwnedTraining(
    user: Identity,
    trainingId: string,
  ): Promise<ScheduledTrainingDetail> {
    const training =
      await this.scheduledTrainingRepository.getTrainingById(trainingId);
    if (!training) {
      throw new NotFoundException(`Training with ID ${trainingId} not found`);
    }
    try {
      await this.dogAccessService.getOwnedDog(user, training.dogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Training with ID ${trainingId} not found`);
      }
      throw error;
    }
    return training;
  }

  // Planned trainings of one dog (#74), for everyone who sees the dog.
  async getPlannedDogTrainings(
    user: Identity,
    dogId: string,
  ): Promise<WeekTraining[]> {
    await this.dogAccessService.getAccessibleDog(user, dogId);
    return this.scheduledTrainingRepository.getPlannedTrainingsByDogId(dogId);
  }

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
