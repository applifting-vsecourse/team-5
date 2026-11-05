import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDogNoteDto, UpdateDogNoteDto } from './dog-note.dto';

const errorsFor = async <T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((error) => error.property);
};

describe('dog note DTOs', () => {
  describe('CreateDogNoteDto', () => {
    it('accepts a note with title, text and a calendar date', async () => {
      await expect(
        errorsFor(CreateDogNoteDto, {
          date: '2026-11-03',
          title: 'Seminář',
          text: 'Poznámka z lekce.',
        }),
      ).resolves.toEqual([]);
    });

    it('accepts a note without a date', async () => {
      await expect(
        errorsFor(CreateDogNoteDto, {
          title: 'Seminář',
          text: 'Poznámka z lekce.',
        }),
      ).resolves.toEqual([]);
    });

    it('requires a title and text', async () => {
      await expect(errorsFor(CreateDogNoteDto, {})).resolves.toEqual(
        expect.arrayContaining(['title', 'text']),
      );
    });

    it('rejects a title or text made only of spaces', async () => {
      await expect(
        errorsFor(CreateDogNoteDto, { title: '   ', text: 'ok' }),
      ).resolves.toEqual(['title']);
      await expect(
        errorsFor(CreateDogNoteDto, { title: 'ok', text: '   ' }),
      ).resolves.toEqual(['text']);
    });

    it('rejects a bad date', async () => {
      await expect(
        errorsFor(CreateDogNoteDto, {
          date: '03.11.2026',
          title: 'Seminář',
          text: 'Text',
        }),
      ).resolves.toEqual(['date']);
    });

    it('caps title and text length', async () => {
      await expect(
        errorsFor(CreateDogNoteDto, {
          title: 'a'.repeat(101),
          text: 'ok',
        }),
      ).resolves.toEqual(['title']);
      await expect(
        errorsFor(CreateDogNoteDto, {
          title: 'ok',
          text: 'a'.repeat(2001),
        }),
      ).resolves.toEqual(['text']);
    });
  });

  describe('UpdateDogNoteDto', () => {
    it('accepts a partial update', async () => {
      await expect(
        errorsFor(UpdateDogNoteDto, { title: 'Nový název' }),
      ).resolves.toEqual([]);
    });

    it('rejects an empty title', async () => {
      await expect(
        errorsFor(UpdateDogNoteDto, { title: '   ' }),
      ).resolves.toEqual(['title']);
    });

    it('rejects an explicit null date', async () => {
      await expect(
        errorsFor(UpdateDogNoteDto, { date: null }),
      ).resolves.toEqual(['date']);
    });

    it('accepts omitting the date', async () => {
      await expect(
        errorsFor(UpdateDogNoteDto, { text: 'Jen text' }),
      ).resolves.toEqual([]);
    });
  });
});
