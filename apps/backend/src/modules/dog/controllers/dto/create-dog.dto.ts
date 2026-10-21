import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDogDto {
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
  @IsString({ each: true })
  disciplines?: string[];
}
