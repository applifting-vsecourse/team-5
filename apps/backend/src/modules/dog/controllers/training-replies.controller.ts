import { TrainingReplyRepository } from '@/modules/dog/repositories/training-reply.repository';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

class ReadRepliesDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) ids!: string[];
}
@Controller('training-replies')
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class TrainingRepliesController {
  constructor(private readonly replies: TrainingReplyRepository) {}
  @Get() unread(@User() user: Identity) {
    return this.replies.unread(user.id);
  }
  @Post('read') read(@User() user: Identity, @Body() body: ReadRepliesDto) {
    return this.replies.acknowledge(user.id, body.ids);
  }
}
