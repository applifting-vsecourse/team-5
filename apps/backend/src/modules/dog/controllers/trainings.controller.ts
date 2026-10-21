import {
  ScheduleTrainingDto,
  TrainingResponseDto,
} from '@/modules/dog/controllers/dto/training.dto';
import { TrainingsService } from '@/modules/dog/services/trainings.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('trainings')
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
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get('goals/:goalId/trainings')
  @ApiOperation({ summary: 'List the scheduled trainings of a goal' })
  @ApiResponse({ status: 200, type: [TrainingResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async listByGoal(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<TrainingResponseDto[]> {
    const trainings = await this.trainingsService.getGoalTrainings(
      user,
      goalId,
    );
    return trainings.map((training) =>
      TrainingResponseDto.fromDomain(training),
    );
  }

  @Post('goals/:goalId/trainings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Plan the goal's training for one day" })
  @ApiResponse({ status: 201, type: TrainingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid date or a past day' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 409, description: 'The training is already planned' })
  async schedule(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: ScheduleTrainingDto,
  ): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.scheduleTraining(
      user,
      goalId,
      body.date,
    );
    return TrainingResponseDto.fromDomain(training);
  }
}
