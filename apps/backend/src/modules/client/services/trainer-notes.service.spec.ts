import { TrainerNote } from '@/modules/client/domain/trainer-note';
import { TrainerNoteRepository } from '@/modules/client/repositories/trainer-note.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { TrainerNotesService } from './trainer-notes.service';

const aNote = (overrides: Partial<TrainerNote> = {}): TrainerNote => ({
  id: 'tn-1',
  trainerId: 't1',
  clientId: 'c1',
  dogId: 'd1',
  dog: { id: 'd1', name: 'Rex', color: 1 },
  date: new Date('2026-11-18T00:00:00.000Z'),
  title: 'Citlivost na hluk',
  text: 'Při hluku zkrátit úsek a odměnit oční kontakt.',
  isPinned: false,
  createdAt: new Date('2026-11-18T12:00:00Z'),
  updatedAt: new Date('2026-11-18T12:00:00Z'),
  ...overrides,
});

const trainer1 = { id: 't1', role: 'trainer' } as Identity;
const trainer2 = { id: 't2', role: 'trainer' } as Identity;
const handlerClient = { id: 'c1', role: 'user' } as Identity;

const setup = (): {
  service: TrainerNotesService;
  noteRepository: MockProxy<TrainerNoteRepository>;
} => {
  const noteRepository = mock<TrainerNoteRepository>();
  noteRepository.hasActiveClientConnection.mockImplementation(
    async (trainerId, clientId) =>
      (trainerId === 't1' || trainerId === 't2') && clientId === 'c1',
  );
  noteRepository.hasActiveDogShareForClient.mockImplementation(
    async (trainerId, clientId, dogId) =>
      (trainerId === 't1' || trainerId === 't2') &&
      clientId === 'c1' &&
      (dogId === 'd1' || dogId === 'd2'),
  );
  const service = new TrainerNotesService(noteRepository);
  return { service, noteRepository };
};

describe('TrainerNotesService', () => {
  describe('getNotesByClient', () => {
    it('lists notes for the authenticated trainer with active connection', async () => {
      const { service, noteRepository } = setup();
      const pinned = aNote({ id: 'tn-pin', isPinned: true });
      const regular = aNote({ id: 'tn-2', dogId: null, dog: null });
      noteRepository.getNotesByClient.mockResolvedValue([pinned, regular]);

      await expect(service.getNotesByClient(trainer1, 'c1')).resolves.toEqual([
        pinned,
        regular,
      ]);
      expect(noteRepository.getNotesByClient).toHaveBeenCalledWith(
        't1',
        'c1',
        undefined,
      );
    });

    it('filters notes by shared dogId', async () => {
      const { service, noteRepository } = setup();
      const notes = [aNote()];
      noteRepository.getNotesByClient.mockResolvedValue(notes);

      await expect(
        service.getNotesByClient(trainer1, 'c1', 'd1'),
      ).resolves.toEqual(notes);
      expect(noteRepository.getNotesByClient).toHaveBeenCalledWith(
        't1',
        'c1',
        'd1',
      );
    });

    it('returns 404 when client (handler) tries to list trainer notes', async () => {
      const { service, noteRepository } = setup();

      await expect(
        service.getNotesByClient(handlerClient, 'c1'),
      ).rejects.toThrow(NotFoundException);
      expect(noteRepository.getNotesByClient).not.toHaveBeenCalled();
    });

    it('returns 404 when there is no active ClientConnection', async () => {
      const { service, noteRepository } = setup();
      noteRepository.hasActiveClientConnection.mockResolvedValue(false);

      await expect(service.getNotesByClient(trainer1, 'c1')).rejects.toThrow(
        NotFoundException,
      );
      expect(noteRepository.getNotesByClient).not.toHaveBeenCalled();
    });

    it('returns 404 when filtering by a dog without an active DogShare', async () => {
      const { service, noteRepository } = setup();

      await expect(
        service.getNotesByClient(trainer1, 'c1', 'dog-unshared'),
      ).rejects.toThrow(NotFoundException);
      expect(noteRepository.getNotesByClient).not.toHaveBeenCalled();
    });
  });

  describe('createNote', () => {
    it('creates a general client note with trimmed text', async () => {
      const { service, noteRepository } = setup();
      const created = aNote({ dogId: null, dog: null });
      noteRepository.createNote.mockResolvedValue(created);

      await expect(
        service.createNote(trainer1, 'c1', {
          date: '2026-11-18',
          dogId: null,
          title: '  Obecná poznámka  ',
          text: '  Klient preferuje večerní lekce.  ',
        }),
      ).resolves.toEqual(created);

      expect(noteRepository.createNote).toHaveBeenCalledWith({
        trainerId: 't1',
        clientId: 'c1',
        dogId: null,
        date: new Date('2026-11-18T00:00:00.000Z'),
        title: 'Obecná poznámka',
        text: 'Klient preferuje večerní lekce.',
        isPinned: false,
      });
    });

    it('creates a pinned note assigned to a shared dog', async () => {
      const { service, noteRepository } = setup();
      const created = aNote({ isPinned: true });
      noteRepository.createNote.mockResolvedValue(created);

      await expect(
        service.createNote(trainer1, 'c1', {
          date: '2026-11-18',
          dogId: 'd1',
          title: 'Citlivost na hluk',
          text: 'Pozor na tramvaje.',
          isPinned: true,
        }),
      ).resolves.toEqual(created);

      expect(noteRepository.createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          dogId: 'd1',
          isPinned: true,
        }),
      );
    });

    it('returns 404 when creating a note for an unshared dog', async () => {
      const { service, noteRepository } = setup();

      await expect(
        service.createNote(trainer1, 'c1', {
          dogId: 'dog-other',
          title: 'Test',
          text: 'Text',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(noteRepository.createNote).not.toHaveBeenCalled();
    });

    it('returns 404 when a handler tries to create a trainer note', async () => {
      const { service, noteRepository } = setup();

      await expect(
        service.createNote(handlerClient, 'c1', {
          title: 'Test',
          text: 'Text',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(noteRepository.createNote).not.toHaveBeenCalled();
    });
  });

  describe('getNote / updateNote / deleteNote (strict privacy & pinning)', () => {
    it('allows author trainer to pin and update their own note', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());
      const updated = aNote({
        isPinned: true,
        dogId: 'd2',
        dog: { id: 'd2', name: 'Baryk', color: 2 },
      });
      noteRepository.updateNote.mockResolvedValue(updated);

      await expect(
        service.updateNote(trainer1, 'tn-1', {
          isPinned: true,
          dogId: 'd2',
          title: '  Nový název  ',
        }),
      ).resolves.toEqual(updated);

      expect(noteRepository.updateNote).toHaveBeenCalledWith('tn-1', {
        date: undefined,
        dogId: 'd2',
        title: 'Nový název',
        text: undefined,
        isPinned: true,
      });
    });

    it('returns 404 when another trainer of the same client tries to read, update, or delete the note', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote({ trainerId: 't1' }));

      await expect(service.getNote(trainer2, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.updateNote(trainer2, 'tn-1', { isPinned: true }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.deleteNote(trainer2, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(noteRepository.updateNote).not.toHaveBeenCalled();
      expect(noteRepository.deleteNote).not.toHaveBeenCalled();
    });

    it('returns 404 when the client (handler) tries to read, update, or delete the note', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(service.getNote(handlerClient, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.updateNote(handlerClient, 'tn-1', { title: 'Hack' }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.deleteNote(handlerClient, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns 404 after collaboration ends (no ClientConnection)', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());
      noteRepository.hasActiveClientConnection.mockResolvedValue(false);

      await expect(service.getNote(trainer1, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.updateNote(trainer1, 'tn-1', { isPinned: true }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.deleteNote(trainer1, 'tn-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns 404 when reassigning a note to an unshared dog', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());

      await expect(
        service.updateNote(trainer1, 'tn-1', { dogId: 'unshared-dog' }),
      ).rejects.toThrow(NotFoundException);
      expect(noteRepository.updateNote).not.toHaveBeenCalled();
    });

    it('deletes the note for the author trainer', async () => {
      const { service, noteRepository } = setup();
      noteRepository.getNoteById.mockResolvedValue(aNote());
      noteRepository.deleteNote.mockResolvedValue(aNote());

      await expect(service.deleteNote(trainer1, 'tn-1')).resolves.toEqual(
        aNote(),
      );
      expect(noteRepository.deleteNote).toHaveBeenCalledWith('tn-1');
    });
  });
});
