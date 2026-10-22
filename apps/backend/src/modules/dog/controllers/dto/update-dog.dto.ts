import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDogDto {
  @ApiPropertyOptional({
    description: 'Name of the dog',
    example: 'Rex',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({
    description: 'Breed of the dog',
    example: 'Border kolie',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiPropertyOptional({
    description: 'Color index of the dog (1-6)',
    example: 1,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  color?: number;

  @ApiPropertyOptional({
    description: 'Disciplines/sports of the dog',
    example: ['Poslušnost', 'Canicross'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.length > 0 && !seen.has(trimmed)) {
          seen.add(trimmed);
          result.push(trimmed);
        }
      }
    }
    return result;
  })
  @IsString({ each: true })
  @MaxLength(40, {
    each: true,
    message: 'Disciplína může mít maximálně 40 znaků',
  })
  disciplines?: string[];
}
