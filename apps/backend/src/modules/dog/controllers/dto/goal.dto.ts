import { GoalStatus } from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({
    description: 'Title of the training goal',
    example: 'Spolehlivá chůze u nohy',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({
    description: 'Discipline or category of the goal',
    example: 'Poslušnost',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  discipline?: string;

  @ApiPropertyOptional({
    description: 'Training principle or key instructions',
    example: 'Pes jde u levé nohy s hlavou u kolena.',
  })
  @IsOptional()
  @IsString()
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
  })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateGoalDto {
  @ApiPropertyOptional({
    description: 'Title of the training goal',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Discipline or category of the goal',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  discipline?: string;

  @ApiPropertyOptional({
    description: 'Training principle or key instructions',
  })
  @IsOptional()
  @IsString()
  principle?: string;

  @ApiPropertyOptional({
    enum: GoalStatus,
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({
    description: 'Display order',
  })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class GoalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dogId!: string;

  @ApiProperty()
  createdById!: string;

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
}
