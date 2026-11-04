import { Trim } from '@/shared/validation/trim';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReadTrainingRepliesDto {
  @ApiProperty({
    type: [String],
    description: 'Exact unread IDs returned with the displayed record or plan',
  })
  @IsArray()
  @ArrayMaxSize(10000)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  replyIds!: string[];
}

export class SendTrainingMessageDto {
  @ApiProperty({ maxLength: 2000 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}

export class PlanReplySourceDto {
  @ApiPropertyOptional({
    description: 'Workout record this plan edit replies to (#68)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  replyToActivityId?: string;
}
