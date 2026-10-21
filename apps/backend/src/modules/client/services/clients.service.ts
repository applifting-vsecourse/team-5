import { Client, Invitation } from '@/modules/client/domain/client';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ClientsService {
  constructor(private readonly clientRepository: ClientRepository) {}

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
