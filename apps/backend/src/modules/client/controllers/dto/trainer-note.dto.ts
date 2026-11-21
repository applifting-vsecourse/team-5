import {
  TrainerNote,
  TrainerNoteDog,
} from '@/modules/client/domain/trainer-note';
import {
  CALENDAR_DATE_PATTERN,
  toCalendarDate,
} from '@/modules/dog/domain/calendar-date';
import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class CreateTrainerNoteDto {
  @ApiPropertyOptional({
    description: 'Note date; defaults to today in Europe/Prague',
    example: '2026-11-19',
    format: 'date',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description:
      'Optional shared dog ID; omit or pass null for a general client note',
    nullable: true,
    type: String,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsNotEmpty()
  dogId?: string | null;

  @ApiProperty({
    description: 'Short title of the note',
    example: 'Citlivost na hluk',
    maxLength: TITLE_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({
    description: 'Private trainer observation or reminder for the next lesson',
    example: 'Zkrátit úseky a odměňovat za oční kontakt.',
    maxLength: TEXT_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_MAX_LENGTH)
  text!: string;

  @ApiPropertyOptional({
    description: 'Pin the note to the top of the list',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateTrainerNoteDto {
  @ApiPropertyOptional({
    description: 'Note date',
    example: '2026-11-19',
    format: 'date',
  })
  // IsOptional also skips null; null must 400, omitted date keeps the original.
  @ValidateIf((_, value) => value !== undefined)
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description:
      'Shared dog ID, or null to make the note a general client note',
    nullable: true,
    type: String,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @IsNotEmpty()
  dogId?: string | null;

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
    description: 'Private trainer observation or reminder for the next lesson',
    maxLength: TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEXT_MAX_LENGTH)
  text?: string;

  @ApiPropertyOptional({
    description: 'Pin or unpin the note',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPinned?: boolean;
}

export class TrainerNoteDogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  color!: number;

  static fromDomain(dog: TrainerNoteDog): TrainerNoteDogResponseDto {
    return {
      id: dog.id,
      name: dog.name,
      color: dog.color,
    };
  }
}

export class TrainerNoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clientId!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  dogId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: TrainerNoteDogResponseDto })
  dog!: TrainerNoteDogResponseDto | null;

  @ApiProperty({ example: '2026-11-19', format: 'date' })
  date!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  isPinned!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromDomain(note: TrainerNote): TrainerNoteResponseDto {
    return {
      id: note.id,
      clientId: note.clientId,
      dogId: note.dogId,
      dog: note.dog ? TrainerNoteDogResponseDto.fromDomain(note.dog) : null,
      date: toCalendarDate(note.date),
      title: note.title,
      text: note.text,
      isPinned: note.isPinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
