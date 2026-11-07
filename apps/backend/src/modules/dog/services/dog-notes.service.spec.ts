import { Dog } from '@/modules/dog/domain/dog';
import { DogNote } from '@/modules/dog/domain/dog-note';
import { DogNoteRepository } from '@/modules/dog/repositories/dog-note.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DogNotesService } from './dog-notes.service';

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'd1',
  name: 'Rex',
  breed: 'Border kolie',
  color: 1,
  ownerId: 'u1',
  isArchived: false,
  disciplines: ['Poslušnost'],
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

const aNote = (overrides: Partial<DogNote> = {}): DogNote => ({
  id: 'n1',
  dogId: 'd1',
  date: new Date('2026-10-20T00:00:00.000Z'),
  title: 'Seminář poslušnosti',
  text: 'Více odměňovat u levé nohy.',
  createdAt: new Date('2026-10-20T12:00:00Z'),
  updatedAt: new Date('2026-10-20T12:00:00Z'),
  ...overrides,
});

const owner = { id: 'u1' } as Identity;
const trainer = { id: 'u9' } as Identity;
const stranger = { id: 'u2' } as Identity;

const setup = (): {
  service: DogNotesService;
  noteRepository: MockProxy<DogNoteRepository>;
  dogAccess: MockProxy<DogAccessService>;
} => {
  const noteRepository = mock<DogNoteRepository>();
  const dogAccess = mock<DogAccessService>();
  dogAccess.getOwnedDog.mockImplementation((user, dogId) => {
    if (dogId !== 'd1') {
      return Promise.reject(new NotFoundException());
    }
    if (user.id === 'u1') {
      return Promise.resolve(aDog());
    }
    if (user.id === 'u9') {
      return Promise.reject(
        new ForbiddenException('Only the owner of the dog can do this'),
      );
    }
    return Promise.reject(new NotFoundException());
  });
  const service = new DogNotesService(noteRepository, dogAccess);
  return { service, noteRepository, dogAccess };
};

describe('DogNotesService', () => {
  describe('getNotesByDogId', () => {
    it('lists notes for the owner, newest first from the repository', async () => {
      const { service, noteRepository, dogAccess } = setup();
      const notes = [aNote(), aNote({ id: 'n2', title: 'Lekce' })];
      noteRepository.getNotesByDogId.mockResolvedValue(notes);

      await expect(service.getNotesByDogId(owner, 'd1')).resolves.toEqual(
        notes,
      );
      expect(dogAccess.getOwnedDog).toHaveBeenCalledWith(owner, 'd1');
      expect(noteRepository.getNotesByDogId).toHaveBeenCalledWith('d1');
    });

    it('forbids a shared trainer from reading notes', async () => {
      const { service, noteRepository } = setup();

      await expect(service.getNotesByDogId(trainer, 'd1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(noteRepository.getNotesByDogId).not.toHaveBeenCalled();
    });

    it('reports a stranger as if the dog were missing', async () => {
      const { service, noteRepository } = setup();

      await expect(service.getNotesByDogId(stranger, 'd1')).rejects.toThrow(
        NotFoundException,
      );
      expect(noteRepository.getNotesByDogId).not.toHaveBeenCalled();
    });
  });

  describe('createNote', () => {
    it('creates a note for the owner with the given calendar date', async () => {
      const { service, noteRepository } = setup();
      const created = aNote();
      noteRepository.createNote.mockResolvedValue(created);

      await expect(
        service.createNote(owner, 'd1', {
          date: '2026-10-20',
          title: '  Seminář poslušnosti  ',
          text: '  Více odměňovat u levé nohy.  ',
        }),
      ).resolves.toEqual(created);
      expect(noteRepository.createNote).toHaveBeenCalledWith({
        dogId: 'd1',
        date: new Date('2026-10-20T00:00:00.000Z'),
        title: 'Seminář poslušnosti',
        text: 'Více odměňovat u levé nohy.',
      });
    });

    it('forbids a shared trainer from creating a note', async () => {
      const { service, noteRepository } = setup();

      await expect(
        service.createNote(trainer, 'd1', {
          title: 'Lekce',
          text: 'Poznámka',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(noteRepository.createNote).not.toHaveBeenCalled();
    });
  });

  describe('getNote', () => {
    it('returns a note of the owner’s dog', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(service.getNote(owner, 'n1')).resolves.toEqual(aNote());
    });

    it('reports a missing note as not found', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(null);

      await expect(service.getNote(owner, 'nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not reveal the dog id to a stranger', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(service.getNote(stranger, 'n1')).rejects.toThrow(
        'Note with ID n1 not found',
      );
    });

    it('forbids a shared trainer from reading a note', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(service.getNote(trainer, 'n1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateNote', () => {
    it('updates a note for the owner', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());
      const updated = aNote({ title: 'Upraveno' });
      noteRepository.updateNote.mockResolvedValue(updated);

      await expect(
        service.updateNote(owner, 'n1', { title: '  Upraveno  ' }),
      ).resolves.toEqual(updated);
      expect(noteRepository.updateNote).toHaveBeenCalledWith('n1', {
        date: undefined,
        title: 'Upraveno',
        text: undefined,
      });
    });
  });

  describe('deleteNote', () => {
    it('deletes a note for the owner', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());
      noteRepository.deleteNote.mockResolvedValue(aNote());

      await expect(service.deleteNote(owner, 'n1')).resolves.toEqual(aNote());
      expect(noteRepository.deleteNote).toHaveBeenCalledWith('n1');
    });

    it('forbids a shared trainer from deleting a note', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(service.deleteNote(trainer, 'n1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(noteRepository.deleteNote).not.toHaveBeenCalled();
    });
  });
});
