import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDogDto } from './create-dog.dto';
import { UpdateDogDto } from './update-dog.dto';

describe('Dog profile fields', () => {
  for (const Dto of [CreateDogDto, UpdateDogDto]) {
    it(`${Dto.name} accepts a birth date and decimal weight`, async () => {
      expect(
        await validate(
          Object.assign(new Dto(), {
            name: 'Rex',
            color: 1,
            birthDate: '2020-02-29',
            weightKg: 21.45,
          }),
        ),
      ).toHaveLength(0);
    });

    it.each([
      { birthDate: '2026-02-30' },
      { birthDate: '2020-1-1' },
      { weightKg: 0 },
      { weightKg: 201 },
      { weightKg: 21.555 },
    ])(`${Dto.name} rejects invalid profile values: %j`, async (fields) => {
      expect(
        (
          await validate(
            Object.assign(new Dto(), {
              name: 'Rex',
              color: 1,
              ...fields,
            }),
          )
        ).length,
      ).toBeGreaterThan(0);
    });
  }
  it('allows clearing optional profile fields', async () => {
    expect(
      await validate(
        Object.assign(new UpdateDogDto(), { birthDate: '', weightKg: null }),
      ),
    ).toHaveLength(0);
  });
});

describe('Dog DTOs (Disciplines validation and sanitization)', () => {
  describe('CreateDogDto', () => {
    it('sanitizes disciplines by trimming, deduplicating, and removing empty strings', async () => {
      const plain = {
        name: 'Rex',
        color: 1,
        disciplines: ['  Agility  ', 'Agility', '', '   ', 'Canicross'],
      };

      const instance = plainToInstance(CreateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toEqual(['Agility', 'Canicross']);
    });

    it('deduplicates disciplines case-insensitively', async () => {
      const plain = {
        name: 'Rex',
        color: 1,
        disciplines: ['Canicross', 'canicross', ' CANICROSS '],
      };

      const instance = plainToInstance(CreateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toEqual(['Canicross']);
    });

    it('rejects a discipline exceeding 40 characters', async () => {
      const plain = {
        name: 'Rex',
        color: 1,
        disciplines: ['A'.repeat(41)],
      };

      const instance = plainToInstance(CreateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('disciplines');
      expect(errors[0].constraints?.maxLength).toBe(
        'Disciplína může mít maximálně 40 znaků',
      );
    });

    it('accepts a discipline with exactly 40 characters', async () => {
      const plain = {
        name: 'Rex',
        color: 1,
        disciplines: ['A'.repeat(40)],
      };

      const instance = plainToInstance(CreateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toEqual(['A'.repeat(40)]);
    });

    it('allows undefined disciplines', async () => {
      const plain = {
        name: 'Rex',
        color: 1,
      };

      const instance = plainToInstance(CreateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toBeUndefined();
    });
  });

  describe('UpdateDogDto', () => {
    it('sanitizes disciplines by trimming, deduplicating, and removing empty strings', async () => {
      const plain = {
        disciplines: ['  Obedience  ', 'Obedience', '   ', 'Nosework'],
      };

      const instance = plainToInstance(UpdateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toEqual(['Obedience', 'Nosework']);
    });

    it('deduplicates disciplines case-insensitively', async () => {
      const plain = {
        disciplines: ['Obedience', 'obedience', '  OBEDIENCE  '],
      };

      const instance = plainToInstance(UpdateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.disciplines).toEqual(['Obedience']);
    });

    it('rejects a discipline exceeding 40 characters', async () => {
      const plain = {
        disciplines: ['B'.repeat(41)],
      };

      const instance = plainToInstance(UpdateDogDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('disciplines');
      expect(errors[0].constraints?.maxLength).toBe(
        'Disciplína může mít maximálně 40 znaků',
      );
    });
  });
});
