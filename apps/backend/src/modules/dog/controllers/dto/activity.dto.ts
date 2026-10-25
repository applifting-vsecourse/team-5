import {
  FocusLevel,
  MistakeLevel,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Title of the activity / workout record',
    example: 'Poslušnost v parku',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    description: 'Discipline of the activity',
    example: 'Poslušnost',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  discipline?: string;

  @ApiPropertyOptional({
    enum: WorkoutStatus,
    default: WorkoutStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @ApiPropertyOptional({
    description: 'Success rate in % (0-100)',
    example: 95,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  successRate?: number;

  @ApiPropertyOptional({
    description: 'Rating (1-5 stars)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

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
    description: 'Reflection / notes from the workout',
    example: 'Soustředil se skvěle.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'External video URL (YouTube, Drive, etc.)',
    example: 'https://youtube.com/watch?v=123',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Reason if skipped',
  })
  @IsOptional()
  @IsString()
  skipReason?: string;

  @ApiPropertyOptional({
    description: 'Date and time when the workout took place',
    example: '2026-10-18T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

export class MessageAuthorDto {
  @ApiProperty({ type: String, nullable: true })
  id!: string | null;

  @ApiProperty()
  name!: string;
}

export class TrainingMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workoutLogId!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: MessageAuthorDto })
  author!: MessageAuthorDto;
}

// Which page of a dog's records to load (#79). Newest first.
export class ActivitiesQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class ActivityResponseDto {
  @ApiProperty({ type: [TrainingMessageResponseDto] })
  messages!: TrainingMessageResponseDto[];

  @ApiProperty()
  id!: string;

  @ApiProperty()
  dogId!: string;

  @ApiProperty({ type: String, nullable: true })
  authorId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  discipline!: string | null;

  @ApiProperty({ enum: WorkoutStatus })
  status!: WorkoutStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  successRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  rating!: number | null;

  @ApiPropertyOptional({ enum: FocusLevel, nullable: true })
  focus!: FocusLevel | null;

  @ApiPropertyOptional({ enum: MistakeLevel, nullable: true })
  repeatedMistakes!: MistakeLevel | null;

  @ApiPropertyOptional({ nullable: true })
  note!: string | null;

  @ApiPropertyOptional({ nullable: true })
  videoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  skipReason!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class ActivityPageResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  items!: ActivityResponseDto[];

  @ApiProperty({ description: 'How many records the dog has in total' })
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
