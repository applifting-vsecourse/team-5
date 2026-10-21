import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { DogsController } from './controllers/dogs.controller';
import { GoalsController } from './controllers/goals.controller';
import { ActivityRepository } from './repositories/activity.repository';
import { DogRepository } from './repositories/dog.repository';
import { GoalRepository } from './repositories/goal.repository';
import { ActivitiesService } from './services/activities.service';
import { DogAccessService } from './services/dog-access.service';
import { DogsService } from './services/dogs.service';
import { GoalsService } from './services/goals.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DogsController, GoalsController, ActivitiesController],
  providers: [
    DogsService,
    DogRepository,
    DogAccessService,
    GoalsService,
    GoalRepository,
    ActivitiesService,
    ActivityRepository,
  ],
  exports: [
    DogsService,
    DogRepository,
    GoalsService,
    GoalRepository,
    ActivitiesService,
    ActivityRepository,
  ],
})
export class DogModule {}
