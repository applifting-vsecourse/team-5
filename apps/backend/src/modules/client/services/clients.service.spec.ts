import { Client, Invitation } from '@/modules/client/domain/client';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ClientsService } from './clients.service';

const aClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  name: 'Jan Novák',
  email: 'jan.novak@seznam.cz',
  dogs: [
    {
      id: 'd1',
      name: 'Rex',
      color: 1,
      breed: 'Border kolie',
    },
  ],
  createdAt: new Date('2026-10-21T10:00:00Z'),
  ...overrides,
});

describe('ClientsService', () => {
  it('returns clients from repository for the authenticated trainer', async () => {
    const clients = [aClient()];
    const repository = mock<ClientRepository>();
    repository.getClientsByTrainerId.mockResolvedValue(clients);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(service.getClients(trainer)).resolves.toEqual(clients);
    expect(repository.getClientsByTrainerId).toHaveBeenCalledWith('t1');
  });

  it('returns single client detail if client belongs to trainer', async () => {
    const client = aClient();
    const repository = mock<ClientRepository>();
    repository.getClientById.mockResolvedValue(client);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(service.getClientById('c1', trainer)).resolves.toEqual(client);
    expect(repository.getClientById).toHaveBeenCalledWith('c1', 't1');
  });

  it('throws NotFoundException if client does not exist or does not belong to trainer', async () => {
    const repository = mock<ClientRepository>();
    repository.getClientById.mockResolvedValue(null);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(
      service.getClientById('c-nonexistent', trainer),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns unused invitations for trainer', async () => {
    const invitations: Invitation[] = [
      {
        id: 'inv-1',
        code: 'K7M2PQ',
        trainerId: 't1',
        expiresAt: new Date('2026-10-28T10:00:00Z'),
        createdAt: new Date('2026-10-21T10:00:00Z'),
      },
    ];
    const repository = mock<ClientRepository>();
    repository.getInvitationsByTrainerId.mockResolvedValue(invitations);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(service.getInvitations(trainer)).resolves.toEqual(invitations);
    expect(repository.getInvitationsByTrainerId).toHaveBeenCalledWith('t1');
  });

  it('cancels invitation when found', async () => {
    const repository = mock<ClientRepository>();
    repository.cancelInvitation.mockResolvedValue(true);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(
      service.cancelInvitation('inv-1', trainer),
    ).resolves.toBeUndefined();
    expect(repository.cancelInvitation).toHaveBeenCalledWith('inv-1', 't1');
  });

  it('throws NotFoundException when cancelling non-existent invitation', async () => {
    const repository = mock<ClientRepository>();
    repository.cancelInvitation.mockResolvedValue(false);

    const service = new ClientsService(repository);
    const trainer = { id: 't1' } as Identity;

    await expect(
      service.cancelInvitation('inv-invalid', trainer),
    ).rejects.toThrow(NotFoundException);
  });
});
