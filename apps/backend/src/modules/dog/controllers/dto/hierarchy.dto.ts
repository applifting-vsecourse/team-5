import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateGoalTrainingDto {
  @ApiProperty({ maxLength: 100 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000 })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(10000)
  insertAt?: number;
}

export class UpdateGoalTrainingDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @ValidateIf((_, value) => value !== undefined)
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isArchived?: boolean;
}

export class ReorderHierarchyDto {
  @ApiProperty({ type: [String], maxItems: 1000 })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids!: string[];
}

export class SetDisciplineDto {
  @ApiProperty({ maxLength: 60 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ default: false })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isArchived?: boolean;
}

export class WeeklyTargetDto {
  @ApiProperty({ minimum: 1, maximum: 7 })
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyTarget!: number;
}
