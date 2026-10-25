import {
  ScheduleTrainingDto,
  TrainingDetailResponseDto,
  TrainingResponseDto,
  WeekQueryDto,
  WeekTrainingResponseDto,
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
  Query,
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

  @Get('trainings')
  @ApiOperation({
    summary: "The signed-in owner's trainings between two days (the week)",
  })
  @ApiResponse({ status: 200, type: [WeekTrainingResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid or too long range' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async listWeek(
    @User() user: Identity,
    @Query() query: WeekQueryDto,
  ): Promise<WeekTrainingResponseDto[]> {
    const trainings = await this.trainingsService.getWeekTrainings(
      user,
      query.from,
      query.to,
    );
    return trainings.map((training) =>
      WeekTrainingResponseDto.fromDomain(training),
    );
  }

  @Get('trainings/:trainingId')
  @ApiOperation({
    summary: 'Get details of a scheduled training for walkthrough',
  })
  @ApiResponse({ status: 200, type: TrainingDetailResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  async getTraining(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
  ): Promise<TrainingDetailResponseDto> {
    const training = await this.trainingsService.getTraining(user, trainingId);
    return TrainingDetailResponseDto.fromDomain(training);
  }

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
