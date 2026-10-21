import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePlanBlockDto, UpdatePlanBlockDto } from './plan-block.dto';

const errorsFor = async <T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((error) => error.property);
};

describe('plan block DTOs', () => {
  describe('UpdatePlanBlockDto', () => {
    it('rejects renaming an exercise to spaces only (#65)', async () => {
      await expect(
        errorsFor(UpdatePlanBlockDto, { title: '   ' }),
      ).resolves.toEqual(['title']);
    });

    it('still lets the title be left out', async () => {
      await expect(
        errorsFor(UpdatePlanBlockDto, { criterion: '' }),
      ).resolves.toEqual([]);
    });
  });

  describe('CreatePlanBlockDto', () => {
    it('accepts an exercise with only a title', async () => {
      await expect(
        errorsFor(CreatePlanBlockDto, { title: 'Sedni' }),
      ).resolves.toEqual([]);
    });

    it('rejects a title made only of spaces', async () => {
      await expect(
        errorsFor(CreatePlanBlockDto, { title: '   ' }),
      ).resolves.toEqual(['title']);
    });

    it('caps the title at the column length', async () => {
      await expect(
        errorsFor(CreatePlanBlockDto, { title: 'a'.repeat(101) }),
      ).resolves.toEqual(['title']);
    });
  });
});
