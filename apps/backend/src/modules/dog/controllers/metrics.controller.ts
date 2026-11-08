import { WeeklyTargetDto } from '@/modules/dog/controllers/dto/hierarchy.dto';
import { WeekQueryDto } from '@/modules/dog/controllers/dto/training.dto';
import { MetricsService } from '@/modules/dog/services/metrics.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('training metrics')
@ApiCookieAuth()
@Controller('dogs/:dogId')
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get('metrics')
  get(
    @User() user: Identity,
    @Param('dogId') dogId: string,
  ): ReturnType<MetricsService['getMetrics']> {
    return this.service.getMetrics(user, dogId);
  }

  @Put('weekly-target')
  setTarget(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: WeeklyTargetDto,
  ): ReturnType<MetricsService['setTarget']> {
    return this.service.setTarget(user, dogId, body.weeklyTarget);
  }
}

@ApiTags('training metrics')
@ApiCookieAuth()
@Controller('overview')
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class OwnerMetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get('owner-metrics')
  get(@User() user: Identity): ReturnType<MetricsService['getOwnerMetrics']> {
    return this.service.getOwnerMetrics(user);
  }

  @Get('week-metrics')
  week(
    @User() user: Identity,
    @Query() query: WeekQueryDto,
  ): ReturnType<MetricsService['getOwnerWeekMetrics']> {
    return this.service.getOwnerWeekMetrics(user, query.from, query.to);
  }
}
