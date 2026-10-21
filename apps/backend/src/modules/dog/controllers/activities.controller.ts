import {
  ActivityResponseDto,
  CreateActivityDto,
} from '@/modules/dog/controllers/dto/activity.dto';
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
  @ApiOperation({ summary: 'List all activities / workout logs of a dog' })
  @ApiResponse({ status: 200, type: [ActivityResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
  ): Promise<ActivityResponseDto[]> {
    const activities = await this.activitiesService.getActivitiesByDogId(
      user,
      dogId,
    );
    return activities.map((a) => ({
      id: a.id,
      dogId: a.dogId,
      authorId: a.authorId,
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
