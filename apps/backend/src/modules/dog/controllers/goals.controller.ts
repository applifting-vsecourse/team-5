import {
  CreateGoalDto,
  GoalResponseDto,
  ListGoalsQueryDto,
  UpdateGoalDto,
} from '@/modules/dog/controllers/dto/goal.dto';
import { GoalsService } from '@/modules/dog/services/goals.service';
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

@ApiTags('goals')
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
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('dogs/:dogId/goals')
  @ApiOperation({ summary: 'List all goals of a dog' })
  @ApiResponse({ status: 200, type: [GoalResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid status filter' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Query() query: ListGoalsQueryDto,
  ): Promise<GoalResponseDto[]> {
    const goals = await this.goalsService.getGoalsByDogId(
      user,
      dogId,
      query.status,
    );
    return goals.map((goal) => GoalResponseDto.fromDomain(goal));
  }

  @Post('dogs/:dogId/goals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new training goal for a dog' })
  @ApiResponse({ status: 201, type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid goal data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async create(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalsService.createGoal(user, dogId, body);
    return GoalResponseDto.fromDomain(goal);
  }

  @Get('goals/:goalId')
  @ApiOperation({ summary: 'Get a training goal' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async get(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalsService.getGoal(user, goalId);
    return GoalResponseDto.fromDomain(goal);
  }

  @Patch('goals/:goalId')
  @ApiOperation({ summary: 'Update a training goal' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid goal data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalsService.updateGoal(user, goalId, body);
    return GoalResponseDto.fromDomain(goal);
  }

  @Delete('goals/:goalId')
  @ApiOperation({ summary: 'Delete a training goal' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async delete(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalsService.deleteGoal(user, goalId);
    return GoalResponseDto.fromDomain(goal);
  }
}
