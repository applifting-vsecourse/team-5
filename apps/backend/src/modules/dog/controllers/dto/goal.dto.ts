import { GoalStatus } from '@/generated/prisma/client';
import { Goal } from '@/modules/dog/domain/goal';
import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Limits mirror the training_goal columns; principle is TEXT, so its cap only
// keeps a single request reasonable.
const TITLE_MAX_LENGTH = 100;
const DISCIPLINE_MAX_LENGTH = 60;
const PRINCIPLE_MAX_LENGTH = 2000;
const ORDER_MAX = 10_000;

export class ListGoalsQueryDto {
  @ApiPropertyOptional({ enum: GoalStatus })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}

export class CreateGoalDto {
  @ApiProperty({
    description: 'Title of the training goal',
    example: 'Spolehlivá chůze u nohy',
    maxLength: TITLE_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiPropertyOptional({
    description: "One of the dog's disciplines",
    example: 'Poslušnost',
    maxLength: DISCIPLINE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(DISCIPLINE_MAX_LENGTH)
  discipline?: string;

  @ApiPropertyOptional({
    description: 'What to achieve and what to watch out for',
    example: 'Pes jde u levé nohy s hlavou u kolena.',
    maxLength: PRINCIPLE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(PRINCIPLE_MAX_LENGTH)
  principle?: string;

  @ApiPropertyOptional({
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 0,
    minimum: 0,
    maximum: ORDER_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDER_MAX)
  order?: number;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({
    description: 'Title of the training goal',
    maxLength: TITLE_MAX_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    description: "One of the dog's disciplines; empty string clears it",
    maxLength: DISCIPLINE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(DISCIPLINE_MAX_LENGTH)
  discipline?: string;

  @ApiPropertyOptional({
    description: 'What to achieve and what to watch out for',
    maxLength: PRINCIPLE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(PRINCIPLE_MAX_LENGTH)
  principle?: string;

  @ApiPropertyOptional({
    enum: GoalStatus,
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({
    description: 'Display order',
    minimum: 0,
    maximum: ORDER_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(ORDER_MAX)
  order?: number;
}

export class GoalAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class GoalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dogId!: string;

  @ApiProperty({ type: GoalAuthorDto })
  createdBy!: GoalAuthorDto;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  discipline!: string | null;

  @ApiPropertyOptional({ nullable: true })
  principle!: string | null;

  @ApiProperty({ enum: GoalStatus })
  status!: GoalStatus;

  @ApiProperty()
  order!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromDomain(goal: Goal): GoalResponseDto {
    return {
      id: goal.id,
      dogId: goal.dogId,
      createdBy: { id: goal.createdBy.id, name: goal.createdBy.name },
      title: goal.title,
      discipline: goal.discipline,
      principle: goal.principle,
      status: goal.status,
      order: goal.order,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
