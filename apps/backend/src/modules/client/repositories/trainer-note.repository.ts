import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainerNote } from '@/modules/client/domain/trainer-note';
import { Injectable } from '@nestjs/common';

const noteInclude = {
  dog: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} as const;

@Injectable()
export class TrainerNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveClientConnection(
    trainerId: string,
    clientId: string,
  ): Promise<boolean> {
    const connection = await this.prisma.clientConnection.findUnique({
      where: { trainerId_clientId: { trainerId, clientId } },
      select: { id: true },
    });
    return connection !== null;
  }

  async hasActiveDogShareForClient(
    trainerId: string,
    clientId: string,
    dogId: string,
  ): Promise<boolean> {
    const share = await this.prisma.dogShare.findFirst({
      where: {
        trainerId,
        dogId,
        dog: {
          ownerId: clientId,
          isArchived: false,
        },
      },
      select: { id: true },
    });
    return share !== null;
  }

  async getNotesByClient(
    trainerId: string,
    clientId: string,
    dogId?: string,
  ): Promise<TrainerNote[]> {
    return this.prisma.trainerNote.findMany({
      where: {
        trainerId,
        clientId,
        ...(dogId !== undefined
          ? { dogId }
          : {
              OR: [
                { dogId: null },
                {
                  dog: {
                    isArchived: false,
                    shares: { some: { trainerId } },
                  },
                },
              ],
            }),
      },
      include: noteInclude,
      orderBy: [{ isPinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getNoteById(id: string): Promise<TrainerNote | null> {
    return this.prisma.trainerNote.findUnique({
      where: { id },
      include: noteInclude,
    });
  }

  async createNote(data: {
    trainerId: string;
    clientId: string;
    dogId: string | null;
    date: Date;
    title: string;
    text: string;
    isPinned: boolean;
  }): Promise<TrainerNote> {
    return this.prisma.trainerNote.create({
      data: {
        trainerId: data.trainerId,
        clientId: data.clientId,
        dogId: data.dogId,
        date: data.date,
        title: data.title,
        text: data.text,
        isPinned: data.isPinned,
      },
      include: noteInclude,
    });
  }

  async updateNote(
    id: string,
    data: {
      date?: Date;
      dogId?: string | null;
      title?: string;
      text?: string;
      isPinned?: boolean;
    },
  ): Promise<TrainerNote> {
    return this.prisma.trainerNote.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: data.date }),
        ...(data.dogId !== undefined && { dogId: data.dogId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      },
      include: noteInclude,
    });
  }

  async deleteNote(id: string): Promise<TrainerNote> {
    return this.prisma.trainerNote.delete({
      where: { id },
      include: noteInclude,
    });
  }
}
