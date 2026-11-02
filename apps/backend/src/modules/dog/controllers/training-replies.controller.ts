import {
  ReadTrainingRepliesDto,
  SendTrainingMessageDto,
} from '@/modules/dog/controllers/dto/training-reply.dto';
import { TrainingReplyRepository } from '@/modules/dog/repositories/training-reply.repository';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('training replies')
@Controller()
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class TrainingRepliesController {
  constructor(private readonly replies: TrainingReplyRepository) {}

  @Get('training-replies')
  @ApiOperation({
    summary: 'Unread replies in all accessible training records and plans',
  })
  list(
    @User() user: Identity,
  ): ReturnType<TrainingReplyRepository['getUnread']> {
    return this.replies.getUnread(user.id);
  }

  @Post('training-replies/read')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Acknowledge only the replies displayed to this user',
  })
  read(
    @User() user: Identity,
    @Body() body: ReadTrainingRepliesDto,
  ): Promise<void> {
    return this.replies.markRead(user.id, body.replyIds);
  }

  @Get('dogs/:dogId/activities/:activityId')
  @ApiOperation({
    summary: 'Open a training record with a snapshot of its replies',
  })
  record(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Param('activityId') activityId: string,
  ): ReturnType<TrainingReplyRepository['getRecord']> {
    return this.replies.getRecord(user.id, dogId, activityId);
  }

  @Post('dogs/:dogId/activities/:activityId/messages')
  @ApiOperation({
    summary: 'Reply to a training record as its owner or shared trainer',
  })
  message(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Param('activityId') activityId: string,
    @Body() body: SendTrainingMessageDto,
  ): ReturnType<TrainingReplyRepository['sendMessage']> {
    return this.replies.sendMessage(user.id, dogId, activityId, body.text);
  }

  @Get('trainings/:trainingId/reply')
  @ApiOperation({
    summary: 'Open the current plan and its unread reply snapshot',
  })
  plan(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
  ): ReturnType<TrainingReplyRepository['getTrainingPlan']> {
    return this.replies.getTrainingPlan(user.id, trainingId);
  }
}
