import {
  CreateTrainerNoteData,
  TrainerNote,
  UpdateTrainerNoteData,
} from '@/modules/client/domain/trainer-note';
import { TrainerNoteRepository } from '@/modules/client/repositories/trainer-note.repository';
import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TrainerNotesService {
  constructor(private readonly noteRepository: TrainerNoteRepository) {}

  private assertTrainerRole(user: Identity): void {
    if (user.role !== 'trainer' && user.role !== 'admin') {
      throw new NotFoundException('Resource not found');
    }
  }

  private async assertActiveAccess(
    trainerId: string,
    clientId: string,
    dogId?: string | null,
  ): Promise<void> {
    const hasConnection = await this.noteRepository.hasActiveClientConnection(
      trainerId,
      clientId,
    );
    if (!hasConnection) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }
    if (dogId) {
      const hasShare = await this.noteRepository.hasActiveDogShareForClient(
        trainerId,
        clientId,
        dogId,
      );
      if (!hasShare) {
        throw new NotFoundException(`Dog with ID ${dogId} not found`);
      }
    }
  }

  private async getAccessibleOwnedNote(
    user: Identity,
    noteId: string,
  ): Promise<TrainerNote> {
    this.assertTrainerRole(user);
    const note = await this.noteRepository.getNoteById(noteId);
    if (!note || note.trainerId !== user.id) {
      throw new NotFoundException(`Trainer note with ID ${noteId} not found`);
    }
    const hasConnection = await this.noteRepository.hasActiveClientConnection(
      user.id,
      note.clientId,
    );
    if (!hasConnection) {
      throw new NotFoundException(`Trainer note with ID ${noteId} not found`);
    }
    if (note.dogId) {
      const hasShare = await this.noteRepository.hasActiveDogShareForClient(
        user.id,
        note.clientId,
        note.dogId,
      );
      if (!hasShare) {
        throw new NotFoundException(`Trainer note with ID ${noteId} not found`);
      }
    }
    return note;
  }

  async getNotesByClient(
    user: Identity,
    clientId: string,
    dogId?: string,
  ): Promise<TrainerNote[]> {
    this.assertTrainerRole(user);
    await this.assertActiveAccess(user.id, clientId, dogId);
    return this.noteRepository.getNotesByClient(user.id, clientId, dogId);
  }

  async getNote(user: Identity, noteId: string): Promise<TrainerNote> {
    return this.getAccessibleOwnedNote(user, noteId);
  }

  async createNote(
    user: Identity,
    clientId: string,
    data: CreateTrainerNoteData,
  ): Promise<TrainerNote> {
    this.assertTrainerRole(user);
    const dogId = data.dogId ?? null;
    await this.assertActiveAccess(user.id, clientId, dogId);
    const calendarDate = data.date ?? todayInAppZone();
    return this.noteRepository.createNote({
      trainerId: user.id,
      clientId,
      dogId,
      date: fromCalendarDate(calendarDate),
      title: data.title.trim(),
      text: data.text.trim(),
      isPinned: data.isPinned ?? false,
    });
  }

  async updateNote(
    user: Identity,
    noteId: string,
    data: UpdateTrainerNoteData,
  ): Promise<TrainerNote> {
    const existing = await this.getAccessibleOwnedNote(user, noteId);
    if (data.dogId !== undefined && data.dogId !== null) {
      const hasShare = await this.noteRepository.hasActiveDogShareForClient(
        user.id,
        existing.clientId,
        data.dogId,
      );
      if (!hasShare) {
        throw new NotFoundException(`Dog with ID ${data.dogId} not found`);
      }
    }
    return this.noteRepository.updateNote(noteId, {
      date: data.date !== undefined ? fromCalendarDate(data.date) : undefined,
      dogId: data.dogId,
      title: data.title?.trim(),
      text: data.text?.trim(),
      isPinned: data.isPinned,
    });
  }

  async deleteNote(user: Identity, noteId: string): Promise<TrainerNote> {
    await this.getAccessibleOwnedNote(user, noteId);
    return this.noteRepository.deleteNote(noteId);
  }
}
