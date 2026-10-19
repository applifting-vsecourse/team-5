import { GoalStatus } from '@/generated/prisma/client';
import {
  CreateGoalDto,
  GoalResponseDto,
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
  ApiQuery,
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
  @ApiQuery({ name: 'status', enum: GoalStatus, required: false })
  @ApiResponse({ status: 200, type: [GoalResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Query('status') status?: GoalStatus,
  ): Promise<GoalResponseDto[]> {
    const goals = await this.goalsService.getGoalsByDogId(user, dogId, status);
    return goals.map((g) => ({
      id: g.id,
      dogId: g.dogId,
      createdById: g.createdById,
      title: g.title,
      discipline: g.discipline,
      principle: g.principle,
      status: g.status,
      order: g.order,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  @Post('dogs/:dogId/goals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new training goal for a dog' })
  @ApiResponse({ status: 201, type: GoalResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async create(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    const g = await this.goalsService.createGoal(user, dogId, body);
    return {
      id: g.id,
      dogId: g.dogId,
      createdById: g.createdById,
      title: g.title,
      discipline: g.discipline,
      principle: g.principle,
      status: g.status,
      order: g.order,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  @Patch('goals/:goalId')
  @ApiOperation({ summary: 'Update a training goal' })
  @ApiResponse({ status: 200, type: GoalResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    const g = await this.goalsService.updateGoal(user, goalId, body);
    return {
      id: g.id,
      dogId: g.dogId,
      createdById: g.createdById,
      title: g.title,
      discipline: g.discipline,
      principle: g.principle,
      status: g.status,
      order: g.order,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
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
    const g = await this.goalsService.deleteGoal(user, goalId);
    return {
      id: g.id,
      dogId: g.dogId,
      createdById: g.createdById,
      title: g.title,
      discipline: g.discipline,
      principle: g.principle,
      status: g.status,
      order: g.order,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }
}
