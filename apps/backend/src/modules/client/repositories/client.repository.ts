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
      trainerId: inv.trainerId,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      createdAt: inv.createdAt,
    }));
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
