import { PrismaService } from '@/core/prisma/prisma.service';
import { Client, Invitation } from '@/modules/client/domain/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomainClient(conn: {
    client: {
      id: string;
      name: string;
      email: string;
      dogs: Array<{
        id: string;
        name: string;
        color: number;
        breed: string | null;
        disciplines: string[];
        photoUrl?: string | null;
      }>;
    };
    createdAt: Date;
  }): Client {
    return {
      id: conn.client.id,
      name: conn.client.name,
      email: conn.client.email,
      dogs: conn.client.dogs.map((d) => ({
        id: d.id,
        name: d.name,
        color: d.color,
        breed: d.breed,
        disciplines: d.disciplines,
        photoUrl: d.photoUrl ?? null,
      })),
      createdAt: conn.createdAt,
    };
  }

  async getClientsByTrainerId(trainerId: string): Promise<Client[]> {
    const connections = await this.prisma.clientConnection.findMany({
      where: { trainerId },
      include: {
        client: {
          include: {
            dogs: {
              where: {
                isArchived: false,
                shares: {
                  some: { trainerId },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((conn) => this.mapToDomainClient(conn));
  }

  async getClientById(
    clientId: string,
    trainerId: string,
  ): Promise<Client | null> {
    const connection = await this.prisma.clientConnection.findUnique({
      where: {
        trainerId_clientId: { trainerId, clientId },
      },
      include: {
        client: {
          include: {
            dogs: {
              where: {
                isArchived: false,
                shares: {
                  some: { trainerId },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!connection) {
      return null;
    }

    return this.mapToDomainClient(connection);
  }

  async getInvitationsByTrainerId(trainerId: string): Promise<Invitation[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        trainerId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      code: inv.code,
      email: inv.email,
      trainerId: inv.trainerId,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      createdAt: inv.createdAt,
    }));
  }

  async createInvitation(params: {
    trainerId: string;
    email?: string | null;
    code: string;
    expiresAt: Date;
  }): Promise<Invitation> {
    const inv = await this.prisma.invitation.create({
      data: {
        trainerId: params.trainerId,
        email: params.email ?? null,
        code: params.code,
        expiresAt: params.expiresAt,
      },
    });

    return {
      id: inv.id,
      code: inv.code,
      email: inv.email,
      trainerId: inv.trainerId,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      createdAt: inv.createdAt,
    };
  }

  async findInvitationByCode(
    code: string,
  ): Promise<(Invitation & { trainer: { id: string; name: string } }) | null> {
    const inv = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        trainer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!inv) {
      return null;
    }

    return {
      id: inv.id,
      code: inv.code,
      email: inv.email,
      trainerId: inv.trainerId,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      createdAt: inv.createdAt,
      trainer: inv.trainer,
    };
  }

  async acceptInvitation(
    invitationId: string,
    trainerId: string,
    clientId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.clientConnection.upsert({
        where: {
          trainerId_clientId: { trainerId, clientId },
        },
        create: {
          trainerId,
          clientId,
        },
        update: {},
      }),
      this.prisma.invitation.update({
        where: { id: invitationId },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async cancelInvitation(
    invitationId: string,
    trainerId: string,
  ): Promise<boolean> {
    const result = await this.prisma.invitation.deleteMany({
      where: { id: invitationId, trainerId, usedAt: null },
    });
    return result.count > 0;
  }
}
