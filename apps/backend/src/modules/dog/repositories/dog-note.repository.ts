import { PrismaService } from '@/core/prisma/prisma.service';
import { DogNote } from '@/modules/dog/domain/dog-note';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DogNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getNotesByDogId(dogId: string): Promise<DogNote[]> {
    return this.prisma.dogNote.findMany({
      where: { dogId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getNoteById(id: string): Promise<DogNote | null> {
    return this.prisma.dogNote.findUnique({ where: { id } });
  }

  async createNote(data: {
    dogId: string;
    date: Date;
    title: string;
    text: string;
  }): Promise<DogNote> {
    return this.prisma.dogNote.create({
      data: {
        dog: { connect: { id: data.dogId } },
        date: data.date,
        title: data.title,
        text: data.text,
      },
    });
  }

  async updateNote(
    id: string,
    data: {
      date?: Date;
      title?: string;
      text?: string;
    },
  ): Promise<DogNote> {
    return this.prisma.dogNote.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: data.date }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.text !== undefined && { text: data.text }),
      },
    });
  }

  async deleteNote(id: string): Promise<DogNote> {
    return this.prisma.dogNote.delete({ where: { id } });
  }
}
