import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import {
  CreateDogNoteData,
  DogNote,
  UpdateDogNoteData,
} from '@/modules/dog/domain/dog-note';
import { DogNoteRepository } from '@/modules/dog/repositories/dog-note.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DogNotesService {
  constructor(
    private readonly noteRepository: DogNoteRepository,
    private readonly dogAccess: DogAccessService,
  ) {}

  // Notes are owner-only (#70). A note the caller may not see is reported as
  // missing; a shared trainer already knows the dog and gets 403 from
  // getOwnedDog instead.
  private async getOwnedNote(user: Identity, noteId: string): Promise<DogNote> {
    const note = await this.noteRepository.getNoteById(noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }
    try {
      await this.dogAccess.getOwnedDog(user, note.dogId);
      return note;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Note with ID ${noteId} not found`);
      }
      throw error;
    }
  }

  async getNotesByDogId(user: Identity, dogId: string): Promise<DogNote[]> {
    await this.dogAccess.getOwnedDog(user, dogId);
    return this.noteRepository.getNotesByDogId(dogId);
  }

  async getNote(user: Identity, noteId: string): Promise<DogNote> {
    return this.getOwnedNote(user, noteId);
  }

  async createNote(
    user: Identity,
    dogId: string,
    data: CreateDogNoteData,
  ): Promise<DogNote> {
    await this.dogAccess.getOwnedDog(user, dogId);
    const calendarDate = data.date ?? todayInAppZone();
    return this.noteRepository.createNote({
      dogId,
      date: fromCalendarDate(calendarDate),
      title: data.title.trim(),
      text: data.text.trim(),
    });
  }

  async updateNote(
    user: Identity,
    noteId: string,
    data: UpdateDogNoteData,
  ): Promise<DogNote> {
    await this.getOwnedNote(user, noteId);
    return this.noteRepository.updateNote(noteId, {
      date: data.date !== undefined ? fromCalendarDate(data.date) : undefined,
      title: data.title?.trim(),
      text: data.text?.trim(),
    });
  }

  async deleteNote(user: Identity, noteId: string): Promise<DogNote> {
    await this.getOwnedNote(user, noteId);
    return this.noteRepository.deleteNote(noteId);
  }
}
