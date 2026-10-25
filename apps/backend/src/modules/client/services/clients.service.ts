import { randomInt } from 'node:crypto';
import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import { InviteClient } from '@/core/email/templates/invite-client';
import { Prisma } from '@/generated/prisma/client';
import { Client, Invitation } from '@/modules/client/domain/client';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Config } from '@/shared/config/config.service';
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

function generateInvitationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(randomInt(0, chars.length));
  }
  return result;
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientRepository: ClientRepository,
    @Inject('EmailService') private readonly emailService: EmailService,
    private readonly config: Config,
  ) {}

  async getClients(trainer: Identity): Promise<Client[]> {
    return this.clientRepository.getClientsByTrainerId(trainer.id);
  }

  async getClientById(clientId: string, trainer: Identity): Promise<Client> {
    const client = await this.clientRepository.getClientById(
      clientId,
      trainer.id,
    );
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }
    return client;
  }

  async getInvitations(trainer: Identity): Promise<Invitation[]> {
    return this.clientRepository.getInvitationsByTrainerId(trainer.id);
  }

  async createInvitation(
    trainer: Identity,
    email?: string,
  ): Promise<Invitation> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trainerDailyCount =
      await this.clientRepository.countRecentInvitationsByTrainer(
        trainer.id,
        oneDayAgo,
      );
    if (trainerDailyCount >= 20) {
      throw new BadRequestException(
        'Byl překročen denní limit pozvánek (max. 20 za 24 hodin)',
      );
    }

    if (email) {
      const emailDailyCount =
        await this.clientRepository.countRecentInvitationsToEmail(
          trainer.id,
          email,
          oneDayAgo,
        );
      if (emailDailyCount >= 3) {
        throw new BadRequestException(
          'Na tento e-mail již bylo v posledních 24 hodinách odesláno maximum pozvánek',
        );
      }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let invitation: Invitation;

    while (true) {
      const code = generateInvitationCode();
      const existing = await this.clientRepository.findInvitationByCode(code);
      if (existing) continue;

      try {
        invitation = await this.clientRepository.createInvitation({
          trainerId: trainer.id,
          email,
          code,
          expiresAt,
        });
        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }

    if (email) {
      try {
        const trainerDisplayName = trainer.name || 'Váš trenér';
        const existingUser = await this.clientRepository.findUserByEmail(email);
        const isExistingUser = Boolean(existingUser);
        const inviteUrl = `${this.config.frontendUrl}/invite?code=${invitation.code}`;
        const emailHtml = await renderEmail(InviteClient, {
          trainerName: trainerDisplayName,
          code: invitation.code,
          url: inviteUrl,
          isExistingUser,
        });

        await this.emailService.sendEmail(
          email,
          `Pozvánka do TrainLoopu od trenéra ${trainerDisplayName}`,
          emailHtml,
        );
      } catch {
        await this.clientRepository.deleteInvitation(invitation.id);
        throw new BadGatewayException(
          'Odeslání e-mailu se nezdařilo. Zkontrolujte e-mail a zkuste to znovu.',
        );
      }
    }

    return invitation;
  }

  async verifyInvitation(code: string): Promise<{
    valid: boolean;
    code: string;
    trainerName: string;
    email?: string | null;
    isExistingUser: boolean;
  }> {
    const inv = await this.clientRepository.findInvitationByCode(code);
    if (!inv || inv.usedAt || inv.expiresAt <= new Date()) {
      throw new NotFoundException('Pozvánka nebyla nalezena nebo již vypršela');
    }

    return {
      valid: true,
      code: inv.code,
      trainerName: inv.trainer.name,
      email: inv.email,
      isExistingUser: inv.isExistingUser,
    };
  }

  async acceptInvitation(
    code: string,
    dogIds: string[],
    user: Identity,
  ): Promise<void> {
    if (user.role === 'trainer') {
      throw new BadRequestException(
        'Pozvánku může přijmout pouze psovod (klient)',
      );
    }

    if (!dogIds || dogIds.length === 0) {
      throw new BadRequestException(
        'Vyberte alespoň jednoho psa ke sdílení s trenérem',
      );
    }

    const inv = await this.clientRepository.findInvitationByCode(code);
    if (!inv || inv.usedAt || inv.expiresAt <= new Date()) {
      throw new NotFoundException('Pozvánka nebyla nalezena nebo již vypršela');
    }

    if (inv.trainerId === user.id) {
      throw new BadRequestException('Nemůžete přijmout vlastní pozvánku');
    }

    if (inv.email && inv.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException(
        'Tato pozvánka je určena pro jinou e-mailovou adresu',
      );
    }

    const ownedDogs = await this.clientRepository.findUserDogs(user.id, dogIds);
    if (ownedDogs.length !== dogIds.length) {
      throw new BadRequestException(
        'Jeden nebo více vybraných psů nepatří tomuto uživateli',
      );
    }

    await this.clientRepository.acceptInvitation(
      inv.id,
      inv.trainerId,
      user.id,
      dogIds,
    );
  }

  async cancelInvitation(
    invitationId: string,
    trainer: Identity,
  ): Promise<void> {
    const success = await this.clientRepository.cancelInvitation(
      invitationId,
      trainer.id,
    );
    if (!success) {
      throw new NotFoundException('Invitation not found');
    }
  }
}
