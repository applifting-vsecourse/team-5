import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { DogsController } from './controllers/dogs.controller';
import { GoalsController } from './controllers/goals.controller';
import { PlanBlocksController } from './controllers/plan-blocks.controller';
import { TrainingRepliesController } from './controllers/training-replies.controller';
import { TrainingsController } from './controllers/trainings.controller';
import { ActivityRepository } from './repositories/activity.repository';
import { DogRepository } from './repositories/dog.repository';
import { GoalRepository } from './repositories/goal.repository';
import { PlanBlockRepository } from './repositories/plan-block.repository';
import { ScheduledTrainingRepository } from './repositories/scheduled-training.repository';
import { TrainingReplyRepository } from './repositories/training-reply.repository';
import { ActivitiesService } from './services/activities.service';
import { DogAccessService } from './services/dog-access.service';
import { DogPhotoService } from './services/dog-photo.service';
import { DogsService } from './services/dogs.service';
import { GoalsService } from './services/goals.service';
import { PlanBlocksService } from './services/plan-blocks.service';
import { TrainingsService } from './services/trainings.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    DogsController,
    GoalsController,
    PlanBlocksController,
    TrainingsController,
    ActivitiesController,
    TrainingRepliesController,
  ],
  providers: [
    DogsService,
    DogPhotoService,
    DogRepository,
    DogAccessService,
    GoalsService,
    GoalRepository,
    PlanBlocksService,
    PlanBlockRepository,
    TrainingsService,
    ScheduledTrainingRepository,
    ActivitiesService,
    ActivityRepository,
    TrainingReplyRepository,
  ],
  exports: [
    DogsService,
    DogPhotoService,
    DogRepository,
    GoalsService,
    GoalRepository,
    ActivitiesService,
    ActivityRepository,
  ],
})
export class DogModule {}
