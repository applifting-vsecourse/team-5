import { TrainerRoleGuard } from '@/modules/client/guards/trainer-role.guard';
import { TrainerOverviewService } from '@/modules/dog/services/trainer-overview.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('trainer overview')
@ApiCookieAuth()
@Controller('overview')
@UseGuards(AuthenticatedUserGuard, TrainerRoleGuard)
export class TrainerOverviewController {
  constructor(private readonly service: TrainerOverviewService) {}
  @Get('trainer')
  get(@User() user: Identity): ReturnType<TrainerOverviewService['overview']> {
    return this.service.overview(user);
  }
}
