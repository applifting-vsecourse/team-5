import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients.controller';
import { ClientRepository } from './repositories/client.repository';
import { ClientsService } from './services/clients.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientRepository],
  exports: [ClientsService, ClientRepository],
})
export class ClientModule {}
