import { ActivityResponseDto } from '@/modules/dog/controllers/dto/activity.dto';
import {
  CompleteTrainingDto,
  MoveTrainingDto,
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
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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

  @Patch('trainings/:trainingId')
  @ApiOperation({ summary: 'Move a planned training to another day' })
  @ApiResponse({ status: 200, type: TrainingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid date or a past day' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 403,
    description: 'Only the dog owner can move the training',
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({
    status: 409,
    description: 'The training is completed or skipped',
  })
  async move(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
    @Body() body: MoveTrainingDto,
  ): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.moveTraining(
      user,
      trainingId,
      body.date,
    );
    return TrainingResponseDto.fromDomain(training);
  }

  @Post('trainings/:trainingId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Skip a planned training (the plan's exercises stay as they are)",
  })
  @ApiResponse({ status: 200, type: TrainingResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 403,
    description: 'Only the dog owner can skip the training',
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({
    status: 409,
    description: 'The training is completed or already skipped',
  })
  async skip(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
  ): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.skipTraining(user, trainingId);
    return TrainingResponseDto.fromDomain(training);
  }

  @Delete('trainings/:trainingId/skip')
  @ApiOperation({
    summary: "Undo a skip until the training's week is over",
  })
  @ApiResponse({ status: 200, type: TrainingResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 403,
    description: 'Only the dog owner can undo the skip',
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({
    status: 409,
    description:
      'Not skipped, the week is over, or the goal is planned again meanwhile',
  })
  async undoSkip(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
  ): Promise<TrainingResponseDto> {
    const training = await this.trainingsService.undoSkip(user, trainingId);
    return TrainingResponseDto.fromDomain(training);
  }

  @Get('dogs/:dogId/trainings')
  @ApiOperation({ summary: "The dog's planned trainings" })
  @ApiResponse({ status: 200, type: [WeekTrainingResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listPlannedByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
  ): Promise<WeekTrainingResponseDto[]> {
    const trainings = await this.trainingsService.getPlannedDogTrainings(
      user,
      dogId,
    );
    return trainings.map((training) =>
      WeekTrainingResponseDto.fromDomain(training),
    );
  }

  @Post('trainings/:trainingId/complete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete a scheduled training and log a workout record',
  })
  @ApiResponse({ status: 201, type: ActivityResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 403,
    description: 'Only the dog owner can complete the training',
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 409, description: 'Training is already completed' })
  async completeTraining(
    @User() user: Identity,
    @Param('trainingId') trainingId: string,
    @Body() body: CompleteTrainingDto = {},
  ): Promise<ActivityResponseDto> {
    const a = await this.trainingsService.completeTraining(
      user,
      trainingId,
      body,
    );
    return {
      id: a.id,
      dogId: a.dogId,
      authorId: a.authorId,
      messages: [],
      title: a.title,
      discipline: a.discipline,
      status: a.status,
      completedAt: a.completedAt,
      successRate: a.successRate,
      rating: a.rating,
      focus: a.focus,
      repeatedMistakes: a.repeatedMistakes,
      note: a.note,
      videoUrl: a.videoUrl,
      skipReason: a.skipReason,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
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
  @ApiOperation({ summary: 'Add a dated training session to a goal' })
  @ApiResponse({ status: 201, type: TrainingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid date or a past day' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({
    status: 409,
    description: 'This goal already has a planned session on this day',
  })
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
