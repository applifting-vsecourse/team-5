import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import { InviteClient } from '@/core/email/templates/invite-client';
import { Client, Invitation } from '@/modules/client/domain/client';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Config } from '@/shared/config/config.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

function generateInvitationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
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
    // Generate code with collision check
    let code = generateInvitationCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await this.clientRepository.findInvitationByCode(code);
      if (!existing) break;
      code = generateInvitationCode();
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const invitation = await this.clientRepository.createInvitation({
      trainerId: trainer.id,
      email,
      code,
      expiresAt,
    });

    if (email) {
      const trainerDisplayName = trainer.name || 'Váš trenér';
      const existingUser = await this.clientRepository.findUserByEmail(email);
      const isExistingUser = Boolean(existingUser);
      const inviteUrl = `${this.config.frontendUrl}/invite?code=${code}`;
      const emailHtml = await renderEmail(InviteClient, {
        trainerName: trainerDisplayName,
        code,
        url: inviteUrl,
        isExistingUser,
      });

      await this.emailService.sendEmail(
        email,
        `Pozvánka do TrainLoopu od trenéra ${trainerDisplayName}`,
        emailHtml,
      );
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
    if (!inv) {
      throw new NotFoundException('Pozvánka nebyla nalezena');
    }

    if (inv.usedAt) {
      throw new BadRequestException('Tato pozvánka již byla použita');
    }

    if (inv.expiresAt <= new Date()) {
      throw new BadRequestException('Platnost této pozvánky vypršela');
    }

    return {
      valid: true,
      code: inv.code,
      trainerName: inv.trainer.name,
      email: inv.email,
      isExistingUser: inv.isExistingUser,
    };
  }

  async acceptInvitation(code: string, user: Identity): Promise<void> {
    const inv = await this.clientRepository.findInvitationByCode(code);
    if (!inv) {
      throw new NotFoundException('Pozvánka nebyla nalezena');
    }

    if (inv.usedAt) {
      throw new BadRequestException('Tato pozvánka již byla použita');
    }

    if (inv.expiresAt <= new Date()) {
      throw new BadRequestException('Platnost této pozvánky vypršela');
    }

    if (inv.trainerId === user.id) {
      throw new BadRequestException('Nemůžete přijmout vlastní pozvánku');
    }

    await this.clientRepository.acceptInvitation(
      inv.id,
      inv.trainerId,
      user.id,
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
