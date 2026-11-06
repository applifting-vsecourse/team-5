import { GoalResponseDto } from '@/modules/dog/controllers/dto/goal.dto';
import {
  CreateGoalTrainingDto,
  ReorderHierarchyDto,
  SetDisciplineDto,
  UpdateGoalTrainingDto,
} from '@/modules/dog/controllers/dto/hierarchy.dto';
import { CreatePlanBlockDto } from '@/modules/dog/controllers/dto/plan-block.dto';
import {
  ScheduleTrainingDto,
  TrainingResponseDto,
} from '@/modules/dog/controllers/dto/training.dto';
import { CurrentStepAction } from '@/modules/dog/domain/current-step';
import { HierarchyService } from '@/modules/dog/services/hierarchy.service';
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
  Patch,
  Post,
  Put,
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

@ApiTags('training hierarchy')
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
export class HierarchyController {
  constructor(private readonly service: HierarchyService) {}

  @Get('disciplines')
  listDisciplines(): ReturnType<HierarchyService['listDisciplines']> {
    return this.service.listDisciplines();
  }

  @Get('dogs/:dogId/plan')
  getPlan(
    @User() user: Identity,
    @Param('dogId') dogId: string,
  ): ReturnType<HierarchyService['getPlan']> {
    return this.service.getPlan(user, dogId);
  }

  @Put('dogs/:dogId/disciplines')
  setDiscipline(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: SetDisciplineDto,
  ): ReturnType<HierarchyService['setDiscipline']> {
    return this.service.setDiscipline(user, dogId, body.name, body.isArchived);
  }

  @Post('goals/:goalId/sessions')
  create(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: CreateGoalTrainingDto,
  ): ReturnType<HierarchyService['createTraining']> {
    return this.service.createTraining(user, goalId, body);
  }

  @Put('goals/:goalId/sessions/order')
  order(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: ReorderHierarchyDto,
  ): ReturnType<HierarchyService['reorderTrainings']> {
    return this.service.reorderTrainings(user, goalId, body.ids);
  }

  @Post('goals/:goalId/current-step/advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the current step mastered and move on' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  async advanceStep(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<GoalResponseDto> {
    return this.moveStep(user, goalId, 'advance');
  }

  @Post('goals/:goalId/current-step/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the current step skipped and move on' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  async skipStep(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<GoalResponseDto> {
    return this.moveStep(user, goalId, 'skip');
  }

  @Post('goals/:goalId/current-step/back')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Go back one step and reopen it' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  async stepBack(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<GoalResponseDto> {
    return this.moveStep(user, goalId, 'back');
  }

  private async moveStep(
    user: Identity,
    goalId: string,
    action: CurrentStepAction,
  ): Promise<GoalResponseDto> {
    return GoalResponseDto.fromDomain(
      await this.service.moveCurrentStep(user, goalId, action),
    );
  }

  @Get('goal-trainings/:id')
  get(
    @User() user: Identity,
    @Param('id') id: string,
  ): ReturnType<HierarchyService['getTraining']> {
    return this.service.getTraining(user, id);
  }

  @Patch('goal-trainings/:id')
  update(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: UpdateGoalTrainingDto,
  ): ReturnType<HierarchyService['updateTraining']> {
    return this.service.updateTraining(user, id, body);
  }

  @Post('goal-trainings/:id/steps')
  createStep(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: CreatePlanBlockDto,
  ): ReturnType<HierarchyService['createStep']> {
    return this.service.createStep(user, id, body);
  }

  @Put('goal-trainings/:id/steps/order')
  orderSteps(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: ReorderHierarchyDto,
  ): ReturnType<HierarchyService['reorderSteps']> {
    return this.service.reorderSteps(user, id, body.ids);
  }

  @Post('goal-trainings/:id/schedule')
  async schedule(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: ScheduleTrainingDto,
  ): Promise<TrainingResponseDto> {
    return TrainingResponseDto.fromDomain(
      await this.service.schedule(user, id, body.date),
    );
  }
}
