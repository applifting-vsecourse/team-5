import { TrainingStatus } from '@/generated/prisma/client';
import {
  CALENDAR_DATE_PATTERN,
  toCalendarDate,
} from '@/modules/dog/domain/calendar-date';
import { ScheduledTraining } from '@/modules/dog/domain/scheduled-training';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

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
