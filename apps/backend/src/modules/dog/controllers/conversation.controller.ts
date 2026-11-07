import { ConversationService } from '@/modules/dog/services/conversation.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { Trim } from '@/shared/validation/trim';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyDto {
  @ApiProperty({ maxLength: 2000 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}

@ApiTags('training conversations')
@ApiCookieAuth()
@Controller()
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Get('updates')
  updates(@User() user: Identity) {
    return this.service.updates(user);
  }

  @Get('activities/:id')
  detail(@User() user: Identity, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Post('activities/:id/messages')
  reply(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: ReplyDto,
  ) {
    return this.service.reply(user, id, body.text);
  }
}
