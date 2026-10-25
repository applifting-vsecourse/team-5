import { MailModule } from '@/core/email/mail.module';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Config } from '@/shared/config/config.service';
import { ConfigModule } from '@applifting-io/nestjs-decorated-config';
import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { InvitationRateLimitGuard } from './guards/invitation-rate-limit.guard';
import { ClientRepository } from './repositories/client.repository';
import { ClientsService } from './services/clients.service';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    MailModule,
    ConfigModule.forRootAsync(Config, { validate: true }),
  ],
  controllers: [ClientsController, InvitationsController],
  providers: [ClientsService, ClientRepository, InvitationRateLimitGuard],
  exports: [ClientsService, ClientRepository],
})
export class ClientModule {}
