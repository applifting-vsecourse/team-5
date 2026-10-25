import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Client, Invitation } from '@/modules/client/domain/client';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Config } from '@/shared/config/config.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ClientsService } from './clients.service';

jest.mock('@/core/email/render', () => ({
  renderEmail: jest.fn().mockResolvedValue('<html>Invite</html>'),
}));

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
  let repository: ReturnType<typeof mock<ClientRepository>>;
  let emailService: ReturnType<typeof mock<EmailService>>;
  let config: Config;
  let service: ClientsService;

  beforeEach(() => {
    repository = mock<ClientRepository>();
    repository.countRecentInvitationsByTrainer.mockResolvedValue(0);
    repository.countRecentInvitationsToEmail.mockResolvedValue(0);
    repository.findUserDogs.mockResolvedValue([{ id: 'dog-1' }]);
    emailService = mock<EmailService>();
    config = {
      frontendUrl: 'https://trainloop.cz',
    } as Config;
    service = new ClientsService(repository, emailService, config);
  });

  it('returns clients from repository for the authenticated trainer', async () => {
    const clients = [aClient()];
    repository.getClientsByTrainerId.mockResolvedValue(clients);

    const trainer = { id: 't1' } as Identity;

    await expect(service.getClients(trainer)).resolves.toEqual(clients);
    expect(repository.getClientsByTrainerId).toHaveBeenCalledWith('t1');
  });

  it('returns single client detail if client belongs to trainer', async () => {
    const client = aClient();
    repository.getClientById.mockResolvedValue(client);

    const trainer = { id: 't1' } as Identity;

    await expect(service.getClientById('c1', trainer)).resolves.toEqual(client);
    expect(repository.getClientById).toHaveBeenCalledWith('c1', 't1');
  });

  it('throws NotFoundException if client does not exist or does not belong to trainer', async () => {
    repository.getClientById.mockResolvedValue(null);

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
        email: 'klient@example.com',
        trainerId: 't1',
        expiresAt: new Date('2026-10-28T10:00:00Z'),
        createdAt: new Date('2026-10-21T10:00:00Z'),
      },
    ];
    repository.getInvitationsByTrainerId.mockResolvedValue(invitations);

    const trainer = { id: 't1' } as Identity;

    await expect(service.getInvitations(trainer)).resolves.toEqual(invitations);
    expect(repository.getInvitationsByTrainerId).toHaveBeenCalledWith('t1');
  });

  it('cancels invitation when found', async () => {
    repository.cancelInvitation.mockResolvedValue(true);

    const trainer = { id: 't1' } as Identity;

    await expect(
      service.cancelInvitation('inv-1', trainer),
    ).resolves.toBeUndefined();
    expect(repository.cancelInvitation).toHaveBeenCalledWith('inv-1', 't1');
  });

  it('throws NotFoundException when cancelling non-existent invitation', async () => {
    repository.cancelInvitation.mockResolvedValue(false);

    const trainer = { id: 't1' } as Identity;

    await expect(
      service.cancelInvitation('inv-invalid', trainer),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates an invitation and sends an email to the client', async () => {
    const trainer: Identity = {
      id: 'trainer-1',
      name: 'Veronika Trenérka',
      email: 'veronika@trainloop.cz',
      role: 'trainer',
    };

    repository.findInvitationByCode.mockResolvedValue(null);
    repository.createInvitation.mockImplementation(async (params) => ({
      id: 'inv-new',
      code: params.code,
      email: params.email,
      trainerId: params.trainerId,
      expiresAt: params.expiresAt,
      createdAt: new Date(),
    }));

    const result = await service.createInvitation(
      trainer,
      'klient@example.com',
    );

    expect(result.id).toBe('inv-new');
    expect(result.email).toBe('klient@example.com');
    expect(result.code).toHaveLength(6);
    expect(repository.createInvitation).toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'klient@example.com',
      expect.stringContaining('Veronika Trenérka'),
      '<html>Invite</html>',
    );
  });

  it('creates an invitation without sending email when email is omitted', async () => {
    const trainer: Identity = {
      id: 'trainer-1',
      name: 'Veronika Trenérka',
      email: 'veronika@trainloop.cz',
      role: 'trainer',
    };

    repository.findInvitationByCode.mockResolvedValue(null);
    repository.createInvitation.mockImplementation(async (params) => ({
      id: 'inv-code-only',
      code: params.code,
      email: params.email,
      trainerId: params.trainerId,
      expiresAt: params.expiresAt,
      createdAt: new Date(),
    }));

    const result = await service.createInvitation(trainer);

    expect(result.id).toBe('inv-code-only');
    expect(result.email).toBeUndefined();
    expect(result.code).toHaveLength(6);
    expect(repository.createInvitation).toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('verifies a valid invitation code', async () => {
    repository.findInvitationByCode.mockResolvedValue({
      id: 'inv-1',
      code: 'K7M2PQ',
      email: 'klient@example.com',
      trainerId: 'trainer-1',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      trainer: {
        id: 'trainer-1',
        name: 'Veronika',
      },
      isExistingUser: false,
    });

    const result = await service.verifyInvitation('K7M2PQ');
    expect(result.valid).toBe(true);
    expect(result.trainerName).toBe('Veronika');
    expect(result.email).toBe('klient@example.com');
    expect(result.isExistingUser).toBe(false);
  });

  it('rejects expired invitation on verification', async () => {
    repository.findInvitationByCode.mockResolvedValue({
      id: 'inv-1',
      code: 'EXPRD1',
      email: 'klient@example.com',
      trainerId: 'trainer-1',
      expiresAt: new Date(Date.now() - 100000),
      createdAt: new Date(),
      trainer: {
        id: 'trainer-1',
        name: 'Veronika',
      },
      isExistingUser: false,
    });

    await expect(service.verifyInvitation('EXPRD1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('accepts an invitation with dogs and connects client to trainer', async () => {
    const clientUser: Identity = {
      id: 'client-99',
      name: 'Pavel Klient',
      email: 'pavel@example.com',
      role: 'user',
    };

    repository.findInvitationByCode.mockResolvedValue({
      id: 'inv-1',
      code: 'K7M2PQ',
      email: 'pavel@example.com',
      trainerId: 'trainer-1',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      trainer: {
        id: 'trainer-1',
        name: 'Veronika',
      },
      isExistingUser: true,
    });

    await service.acceptInvitation('K7M2PQ', ['dog-1'], clientUser);
    expect(repository.acceptInvitation).toHaveBeenCalledWith(
      'inv-1',
      'trainer-1',
      'client-99',
      ['dog-1'],
    );
  });

  it('prevents trainer from accepting invitations', async () => {
    const trainerUser: Identity = {
      id: 'trainer-2',
      name: 'Iný Trenér',
      email: 'iny@trainloop.cz',
      role: 'trainer',
    };

    await expect(
      service.acceptInvitation('K7M2PQ', ['dog-1'], trainerUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents accepting without selecting at least one dog', async () => {
    const clientUser: Identity = {
      id: 'client-99',
      name: 'Pavel Klient',
      email: 'pavel@example.com',
      role: 'user',
    };

    await expect(
      service.acceptInvitation('K7M2PQ', [], clientUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents accepting an invitation addressed to a different email', async () => {
    const clientUser: Identity = {
      id: 'client-99',
      name: 'Pavel Klient',
      email: 'pavel.different@example.com',
      role: 'user',
    };

    repository.findInvitationByCode.mockResolvedValue({
      id: 'inv-1',
      code: 'K7M2PQ',
      email: 'pavel.original@example.com',
      trainerId: 'trainer-1',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      trainer: {
        id: 'trainer-1',
        name: 'Veronika',
      },
      isExistingUser: true,
    });

    await expect(
      service.acceptInvitation('K7M2PQ', ['dog-1'], clientUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('deletes invitation and throws BadGatewayException if email delivery fails', async () => {
    const trainer: Identity = {
      id: 'trainer-1',
      name: 'Veronika',
      email: 'veronika@trainloop.cz',
      role: 'trainer',
    };

    repository.createInvitation.mockResolvedValue({
      id: 'inv-failed',
      code: 'FAIL01',
      email: 'error@example.com',
      trainerId: 'trainer-1',
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    emailService.sendEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      service.createInvitation(trainer, 'error@example.com'),
    ).rejects.toThrow();

    expect(repository.deleteInvitation).toHaveBeenCalledWith('inv-failed');
  });
});
