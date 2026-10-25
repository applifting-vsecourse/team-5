import {
  ActivitiesQueryDto,
  ActivityPageResponseDto,
  ActivityResponseDto,
  CreateActivityDto,
} from '@/modules/dog/controllers/dto/activity.dto';
import { presentTrainingMessage } from '@/modules/dog/domain/training-message';
import { ActivitiesService } from '@/modules/dog/services/activities.service';
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

@ApiTags('activities')
@Controller('dogs/:dogId/activities')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({
    summary: "One page of a dog's activities / workout logs, newest first",
  })
  @ApiResponse({ status: 200, type: ActivityPageResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Query() query: ActivitiesQueryDto,
  ): Promise<ActivityPageResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.activitiesService.getActivitiesByDogId(
      user,
      dogId,
      page,
      pageSize,
    );
    const presented = items.map((a) => ({
      id: a.id,
      dogId: a.dogId,
      authorId: a.authorId,
      messages: a.messages.map(presentTrainingMessage),
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
    }));
    return { items: presented, total, page, pageSize };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new activity / workout log for a dog' })
  @ApiResponse({ status: 201, type: ActivityResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async create(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: CreateActivityDto,
  ): Promise<ActivityResponseDto> {
    const a = await this.activitiesService.createActivity(user, dogId, body);
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
}
