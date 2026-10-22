import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDogDto } from './create-dog.dto';
import { UpdateDogDto } from './update-dog.dto';

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
