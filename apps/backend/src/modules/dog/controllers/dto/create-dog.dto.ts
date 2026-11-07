import { sanitizeDisciplines } from '@/modules/dog/services/dogs.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateDogDto {
  @ApiPropertyOptional({
    format: 'date',
    description: 'Date of birth; empty clears it',
  })
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  birthDate?: string;

  @ApiPropertyOptional({ nullable: true, minimum: 0.1, maximum: 200 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(200)
  weightKg?: number | null;

  @ApiProperty({
    description: 'Name of the dog',
    example: 'Rex',
    maxLength: 40,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;

  @ApiPropertyOptional({
    description: 'Breed of the dog',
    example: 'Border kolie',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiProperty({
    description: 'Color index of the dog (1-6) mapped to --dog-1 to --dog-6',
    example: 1,
    minimum: 1,
    maximum: 6,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  color!: number;

  @ApiPropertyOptional({
    description: 'Disciplines/sports of the dog',
    example: ['Poslušnost', 'Canicross'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => sanitizeDisciplines(value))
  @IsString({ each: true })
  @MaxLength(40, {
    each: true,
    message: 'Disciplína může mít maximálně 40 znaků',
  })
  disciplines?: string[];
}
