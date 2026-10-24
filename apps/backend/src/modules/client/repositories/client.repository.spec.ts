import { PrismaService } from '@/core/prisma/prisma.service';
import { ClientRepository } from '@/modules/client/repositories/client.repository';
import { mock } from 'jest-mock-extended';

describe('ClientRepository (Authorization & Multi-Tenancy)', () => {
  it('filters clients and shared dogs strictly by trainerId', async () => {
    const prisma = mock<PrismaService>();
    const clientConnectionDelegate = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'conn-1',
          trainerId: 'trainer-1',
          clientId: 'client-1',
          createdAt: new Date('2026-10-21T10:00:00Z'),
          client: {
            id: 'client-1',
            name: 'Jan Novák',
            email: 'jan.novak@example.com',
            dogs: [
              {
                id: 'dog-1',
                name: 'Rex',
                color: 1,
                breed: 'Border kolie',
                disciplines: ['Agility'],
              },
            ],
          },
        },
      ]),
    };

    // @ts-expect-error mock delegate
    prisma.clientConnection = clientConnectionDelegate;

    const repository = new ClientRepository(prisma);
    const clients = await repository.getClientsByTrainerId('trainer-1');

    expect(clients).toHaveLength(1);
    expect(clients[0].id).toBe('client-1');
    expect(clients[0].dogs[0].name).toBe('Rex');

    // Verify Prisma query strictly scopes by trainerId and dog shares by trainerId
    expect(clientConnectionDelegate.findMany).toHaveBeenCalledWith({
      where: { trainerId: 'trainer-1' },
      include: {
        client: {
          include: {
            dogs: {
              where: {
                isArchived: false,
                shares: {
                  some: { trainerId: 'trainer-1' },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters client detail strictly by trainerId and shared dogs', async () => {
    const prisma = mock<PrismaService>();
    const clientConnectionDelegate = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'conn-1',
        trainerId: 'trainer-1',
        clientId: 'client-1',
        createdAt: new Date('2026-10-21T10:00:00Z'),
        client: {
          id: 'client-1',
          name: 'Jan Novák',
          email: 'jan.novak@example.com',
          dogs: [
            {
              id: 'dog-1',
              name: 'Rex',
              color: 1,
              breed: 'Border kolie',
              disciplines: ['Agility'],
            },
          ],
        },
      }),
    };

    // @ts-expect-error mock delegate
    prisma.clientConnection = clientConnectionDelegate;

    const repository = new ClientRepository(prisma);
    const client = await repository.getClientById('client-1', 'trainer-1');

    expect(client).not.toBeNull();
    expect(client?.id).toBe('client-1');

    expect(clientConnectionDelegate.findUnique).toHaveBeenCalledWith({
      where: {
        trainerId_clientId: { trainerId: 'trainer-1', clientId: 'client-1' },
      },
      include: {
        client: {
          include: {
            dogs: {
              where: {
                isArchived: false,
                shares: {
                  some: { trainerId: 'trainer-1' },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  });

  it('cancels only unused invitation belonging to authenticated trainer', async () => {
    const prisma = mock<PrismaService>();
    const invitationDelegate = {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    // @ts-expect-error mock delegate
    prisma.invitation = invitationDelegate;

    const repository = new ClientRepository(prisma);
    const result = await repository.cancelInvitation('inv-1', 'trainer-1');

    expect(result).toBe(true);
    expect(invitationDelegate.deleteMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', trainerId: 'trainer-1', usedAt: null },
    });
  });

  it('creates an invitation with email and expiration', async () => {
    const prisma = mock<PrismaService>();
    const createdDate = new Date();
    const expiresDate = new Date(Date.now() + 100000);
    const invitationDelegate = {
      create: jest.fn().mockResolvedValue({
        id: 'inv-1',
        code: 'K7M2PQ',
        email: 'client@example.com',
        trainerId: 'trainer-1',
        expiresAt: expiresDate,
        usedAt: null,
        createdAt: createdDate,
      }),
    };

    // @ts-expect-error mock delegate
    prisma.invitation = invitationDelegate;

    const repository = new ClientRepository(prisma);
    const result = await repository.createInvitation({
      trainerId: 'trainer-1',
      email: 'client@example.com',
      code: 'K7M2PQ',
      expiresAt: expiresDate,
    });

    expect(result.id).toBe('inv-1');
    expect(result.email).toBe('client@example.com');
    expect(invitationDelegate.create).toHaveBeenCalledWith({
      data: {
        trainerId: 'trainer-1',
        email: 'client@example.com',
        code: 'K7M2PQ',
        expiresAt: expiresDate,
      },
    });
  });

  it('accepts invitation in transaction and creates dog shares', async () => {
    const prisma = mock<PrismaService>();
    const tx = {
      invitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      clientConnection: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      dogShare: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (cb: (txArg: typeof tx) => Promise<unknown>) => cb(tx),
    );

    const repository = new ClientRepository(prisma);
    await repository.acceptInvitation('inv-1', 'trainer-1', 'client-1', [
      'dog-1',
    ]);

    expect(tx.invitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'inv-1',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(tx.clientConnection.upsert).toHaveBeenCalledWith({
      where: {
        trainerId_clientId: { trainerId: 'trainer-1', clientId: 'client-1' },
      },
      create: {
        trainerId: 'trainer-1',
        clientId: 'client-1',
      },
      update: {},
    });
    expect(tx.dogShare.upsert).toHaveBeenCalledWith({
      where: {
        dogId_trainerId: { dogId: 'dog-1', trainerId: 'trainer-1' },
      },
      create: {
        dogId: 'dog-1',
        trainerId: 'trainer-1',
      },
      update: {},
    });
  });

  it('throws BadRequestException if invitation was already used or expired concurrently', async () => {
    const prisma = mock<PrismaService>();
    const tx = {
      invitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (cb: (txArg: typeof tx) => Promise<unknown>) => cb(tx),
    );

    const repository = new ClientRepository(prisma);
    await expect(
      repository.acceptInvitation('inv-1', 'trainer-1', 'client-1', ['dog-1']),
    ).rejects.toThrow('Tato pozvánka již byla použita nebo vypršela');
  });
});
