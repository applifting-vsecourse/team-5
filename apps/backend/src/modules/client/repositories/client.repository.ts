import { PrismaService } from '@/core/prisma/prisma.service';
import { Client, Invitation } from '@/modules/client/domain/client';
import { BadRequestException, Injectable } from '@nestjs/common';

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

  async findUserByEmail(
    email: string,
  ): Promise<{ id: string; name: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
  }

  async findInvitationByCode(code: string): Promise<
    | (Invitation & {
        trainer: { id: string; name: string };
        isExistingUser: boolean;
      })
    | null
  > {
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

    let isExistingUser = false;
    if (inv.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: inv.email },
        select: { id: true },
      });
      isExistingUser = Boolean(existingUser);
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
      isExistingUser,
    };
  }

  async findUserDogs(
    userId: string,
    dogIds: string[],
  ): Promise<Array<{ id: string }>> {
    return this.prisma.dog.findMany({
      where: {
        id: { in: dogIds },
        ownerId: userId,
        isArchived: false,
      },
      select: { id: true },
    });
  }

  async countRecentInvitationsByTrainer(
    trainerId: string,
    since: Date,
  ): Promise<number> {
    return this.prisma.invitation.count({
      where: {
        trainerId,
        createdAt: { gte: since },
      },
    });
  }

  async countRecentInvitationsToEmail(
    trainerId: string,
    email: string,
    since: Date,
  ): Promise<number> {
    return this.prisma.invitation.count({
      where: {
        trainerId,
        email,
        createdAt: { gte: since },
      },
    });
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  async acceptInvitation(
    invitationId: string,
    trainerId: string,
    clientId: string,
    dogIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.invitation.updateMany({
        where: {
          id: invitationId,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          'Tato pozvánka již byla použita nebo vypršela',
        );
      }

      await tx.clientConnection.upsert({
        where: {
          trainerId_clientId: { trainerId, clientId },
        },
        create: {
          trainerId,
          clientId,
        },
        update: {},
      });

      for (const dogId of dogIds) {
        await tx.dogShare.upsert({
          where: {
            dogId_trainerId: { dogId, trainerId },
          },
          create: {
            dogId,
            trainerId,
          },
          update: {},
        });
      }
    });
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
