import {
  FocusLevel,
  MistakeLevel,
  StepOutcome,
  TrainingStatus,
} from '@/generated/prisma/client';
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
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsDivisibleBy,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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
  @ApiPropertyOptional({ nullable: true })
  discipline?: string | null;

  @ApiPropertyOptional()
  position?: number;

  @ApiPropertyOptional()
  total?: number;
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;
}

export class WeekTrainingExerciseDto {
  @ApiPropertyOptional()
  durationMinutes?: number;
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;
}

export class WeekTrainingResponseDto {
  @ApiPropertyOptional({ nullable: true })
  activityId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  successRate?: number | null;
  @ApiProperty({ type: WeekTrainingGoalDto })
  training!: WeekTrainingGoalDto;
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
      activityId: training.workoutLog?.id ?? null,
      successRate: training.workoutLog?.successRate ?? null,
      training: {
        id: training.training.id,
        title: training.training.title,
        position: training.training.position,
        total: training.training.total,
      },
      id: training.id,
      date: toCalendarDate(training.date),
      status: training.status,
      dog: training.dog,
      goal: {
        id: training.goal.id,
        title: training.goal.title,
        discipline: training.goal.discipline,
      },
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

export class MoveTrainingDto {
  @ApiProperty({
    description: 'The new day of the training as a calendar date',
    example: '2026-10-29',
    format: 'date',
  })
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date!: string;
}

export class TrainingResponseDto {
  @ApiProperty()
  trainingId!: string;
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
      trainingId: training.trainingId,
      id: training.id,
      goalId: training.goalId,
      dogId: training.dogId,
      date: toCalendarDate(training.date),
      status: training.status,
      createdAt: training.createdAt,
    };
  }
}

export class TrainingDetailDogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ minimum: 1, maximum: 6 })
  color!: number;

  @ApiProperty({ example: false })
  hasTrainer!: boolean;
}

export class TrainingDetailExerciseDto {
  @ApiProperty({ minimum: 0, maximum: 480 })
  durationMinutes!: number;

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

  @ApiProperty({ enum: StepOutcome, nullable: true })
  outcome!: StepOutcome | null;
}

export class TrainingDetailResponseDto {
  @ApiPropertyOptional()
  canTrain?: boolean;
  @ApiProperty({ type: WeekTrainingGoalDto })
  training!: WeekTrainingGoalDto;
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: '2026-10-22', format: 'date' })
  date!: string;

  @ApiProperty({ enum: TrainingStatus })
  status!: TrainingStatus;

  @ApiProperty({ type: TrainingDetailDogDto })
  dog!: TrainingDetailDogDto;

  @ApiProperty({ type: WeekTrainingGoalDto })
  goal!: WeekTrainingGoalDto;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Effective current step of the goal (null only when the plan has no steps)',
  })
  currentStepId!: string | null;

  @ApiProperty({ type: [TrainingDetailExerciseDto] })
  exercises!: TrainingDetailExerciseDto[];

  static fromDomain(
    training: ScheduledTrainingDetail,
    viewerId?: string,
  ): TrainingDetailResponseDto {
    return {
      ...(viewerId && training.dog.ownerId
        ? { canTrain: viewerId === training.dog.ownerId }
        : {}),
      training: { id: training.training.id, title: training.training.title },
      id: training.id,
      date: toCalendarDate(training.date),
      status: training.status,
      dog: {
        id: training.dog.id,
        name: training.dog.name,
        color: training.dog.color,
        hasTrainer: Boolean(
          training.dog.shares && training.dog.shares.length > 0,
        ),
      },
      goal: {
        id: training.goal.id,
        title: training.goal.title,
      },
      currentStepId: training.goal.currentStepId,
      exercises: training.goal.blocks.map((block) => ({
        durationMinutes: block.durationMinutes,
        id: block.id,
        position: block.position,
        title: block.title,
        instruction: block.instruction,
        criterion: block.criterion,
        outcome: block.outcome,
      })),
    };
  }
}

export class CompleteTrainingDto {
  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(60, { each: true })
  mistakeDetails?: string[];
  @ApiPropertyOptional({
    description: 'Success rate in % (0-100, step 10)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsDivisibleBy(10, { message: 'successRate must be a multiple of 10' })
  successRate?: number;

  @ApiPropertyOptional({
    enum: FocusLevel,
    example: FocusLevel.YES,
  })
  @IsOptional()
  @IsEnum(FocusLevel)
  focus?: FocusLevel;

  @ApiPropertyOptional({
    enum: MistakeLevel,
    example: MistakeLevel.NO,
  })
  @IsOptional()
  @IsEnum(MistakeLevel)
  repeatedMistakes?: MistakeLevel;

  @ApiPropertyOptional({
    description: 'Workout note',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    description: 'External video URL (YouTube, Drive, etc.)',
    example: 'https://youtube.com/watch?v=123',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  videoUrl?: string;
}
