import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { DogsController } from './controllers/dogs.controller';
import { DogRepository } from './repositories/dog.repository';
import { DogsService } from './services/dogs.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DogsController],
  providers: [DogsService, DogRepository],
  exports: [DogsService, DogRepository],
})
export class DogModule {}
