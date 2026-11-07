import { HistoryQueryDto } from '@/modules/dog/controllers/dto/history.dto';
import { HistoryService } from '@/modules/dog/services/history.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('history')
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
export class HistoryController {
  constructor(private readonly service: HistoryService) {}

  @Get('history')
  history(
    @User() user: Identity,
    @Query() query: HistoryQueryDto,
  ): ReturnType<HistoryService['history']> {
    return this.service.history(user, query);
  }

  @Get('overview/dogs')
  dogs(@User() user: Identity): ReturnType<HistoryService['dogs']> {
    return this.service.dogs(user);
  }
}
