import { TrainingStatus } from '@/generated/prisma/client';
import {
  CALENDAR_DATE_PATTERN,
  toCalendarDate,
} from '@/modules/dog/domain/calendar-date';
import {
  ScheduledTraining,
  ScheduledTrainingDetail,
  WeekTraining,
} from '@/modules/dog/domain/scheduled-training';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class WeekQueryDto {
  @ApiProperty({ example: '2026-10-19', format: 'date' })
  @Matches(CALENDAR_DATE_PATTERN, { message: 'from must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  from!: string;

  @ApiProperty({ example: '2026-10-25', format: 'date' })
  @Matches(CALENDAR_DATE_PATTERN, { message: 'to must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  to!: string;
}

export class WeekTrainingDogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ minimum: 1, maximum: 6 })
  color!: number;
}

export class WeekTrainingGoalDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;
}

export class WeekTrainingExerciseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;
}

export class WeekTrainingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: '2026-10-22', format: 'date' })
  date!: string;

  @ApiProperty({ enum: TrainingStatus })
  status!: TrainingStatus;

  @ApiProperty({ type: WeekTrainingDogDto })
  dog!: WeekTrainingDogDto;

  @ApiProperty({ type: WeekTrainingGoalDto })
  goal!: WeekTrainingGoalDto;

  @ApiProperty({ type: [WeekTrainingExerciseDto] })
  exercises!: WeekTrainingExerciseDto[];

  static fromDomain(training: WeekTraining): WeekTrainingResponseDto {
    return {
      id: training.id,
      date: toCalendarDate(training.date),
      status: training.status,
      dog: training.dog,
      goal: { id: training.goal.id, title: training.goal.title },
      exercises: training.goal.blocks,
    };
  }
}

export class ScheduleTrainingDto {
  @ApiProperty({
    description: 'Day of the training as a calendar date',
    example: '2026-10-22',
    format: 'date',
  })
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date!: string;
}

export class TrainingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  goalId!: string;

  @ApiProperty()
  dogId!: string;

  @ApiProperty({ example: '2026-10-22', format: 'date' })
  date!: string;

  @ApiProperty({ enum: TrainingStatus })
  status!: TrainingStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromDomain(training: ScheduledTraining): TrainingResponseDto {
    return {
      id: training.id,
      goalId: training.goalId,
      dogId: training.dogId,
      date: toCalendarDate(training.date),
      status: training.status,
      createdAt: training.createdAt,
    };
  }
}

export class TrainingDetailExerciseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  instruction!: string | null;

  @ApiPropertyOptional({ nullable: true })
  criterion!: string | null;
}

export class TrainingDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: '2026-10-22', format: 'date' })
  date!: string;

  @ApiProperty({ enum: TrainingStatus })
  status!: TrainingStatus;

  @ApiProperty({ type: WeekTrainingDogDto })
  dog!: WeekTrainingDogDto;

  @ApiProperty({ type: WeekTrainingGoalDto })
  goal!: WeekTrainingGoalDto;

  @ApiProperty({ type: [TrainingDetailExerciseDto] })
  exercises!: TrainingDetailExerciseDto[];

  static fromDomain(
    training: ScheduledTrainingDetail,
  ): TrainingDetailResponseDto {
    return {
      id: training.id,
      date: toCalendarDate(training.date),
      status: training.status,
      dog: {
        id: training.dog.id,
        name: training.dog.name,
        color: training.dog.color,
      },
      goal: {
        id: training.goal.id,
        title: training.goal.title,
      },
      exercises: training.goal.blocks.map((block) => ({
        id: block.id,
        position: block.position,
        title: block.title,
        instruction: block.instruction,
        criterion: block.criterion,
      })),
    };
  }
}
