import { PlanBlock } from '@/modules/dog/domain/plan-block';
import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Title mirrors the plan_block column; instruction and criterion are TEXT,
// so their caps only keep a single request reasonable.
const TITLE_MAX_LENGTH = 100;
const INSTRUCTION_MAX_LENGTH = 2000;
const CRITERION_MAX_LENGTH = 1000;

export class CreatePlanBlockDto {
  @ApiProperty({
    description: 'Name of the exercise',
    example: 'Sedni u nohy',
    maxLength: TITLE_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiPropertyOptional({
    description: 'How to practise it',
    example: 'Pes sedí u levé nohy, odměna z levé ruky.',
    maxLength: INSTRUCTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(INSTRUCTION_MAX_LENGTH)
  instruction?: string;

  @ApiPropertyOptional({
    description: 'When the exercise counts as mastered',
    example: 'Sedí 5 s, i když kolem letí míček.',
    maxLength: CRITERION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CRITERION_MAX_LENGTH)
  criterion?: string;
}

export class PlanBlockResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  goalId!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  instruction!: string | null;

  @ApiPropertyOptional({ nullable: true })
  criterion!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromDomain(block: PlanBlock): PlanBlockResponseDto {
    return {
      id: block.id,
      goalId: block.goalId,
      position: block.position,
      title: block.title,
      instruction: block.instruction,
      criterion: block.criterion,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }
}
