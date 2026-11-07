import {
  CALENDAR_DATE_PATTERN,
  toCalendarDate,
} from '@/modules/dog/domain/calendar-date';
import { DogNote } from '@/modules/dog/domain/dog-note';
import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const TITLE_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 2000;

export class CreateDogNoteDto {
  @ApiPropertyOptional({
    description: 'Lesson or seminar day; defaults to today in Europe/Prague',
    example: '2026-11-03',
    format: 'date',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date?: string;

  @ApiProperty({
    description: 'Short title of the note',
    example: 'Seminář poslušnosti',
    maxLength: TITLE_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({
    description: 'What the trainer said or what to remember',
    example: 'Více odměňovat u levé nohy, kratší úseky.',
    maxLength: TEXT_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_MAX_LENGTH)
  text!: string;
}

export class UpdateDogNoteDto {
  @ApiPropertyOptional({
    description: 'Lesson or seminar day',
    example: '2026-11-03',
    format: 'date',
  })
  // IsOptional also skips null; null must 400, omitted date keeps the original.
  @ValidateIf((_, value) => value !== undefined)
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description: 'Short title of the note',
    maxLength: TITLE_MAX_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    description: 'What the trainer said or what to remember',
    maxLength: TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_MAX_LENGTH)
  text?: string;
}

export class DogNoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dogId!: string;

  @ApiProperty({ example: '2026-11-03', format: 'date' })
  date!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromDomain(note: DogNote): DogNoteResponseDto {
    return {
      id: note.id,
      dogId: note.dogId,
      date: toCalendarDate(note.date),
      title: note.title,
      text: note.text,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
