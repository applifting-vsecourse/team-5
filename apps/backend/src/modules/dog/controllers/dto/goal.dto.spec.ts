import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGoalDto, ListGoalsQueryDto } from './goal.dto';

const errorsFor = async <T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((error) => error.property);
};

describe('goal DTOs', () => {
  describe('ListGoalsQueryDto', () => {
    it('accepts a known status', async () => {
      await expect(
        errorsFor(ListGoalsQueryDto, { status: 'ACTIVE' }),
      ).resolves.toEqual([]);
    });

    it('rejects an unknown status instead of passing it to the database', async () => {
      await expect(
        errorsFor(ListGoalsQueryDto, { status: 'foo' }),
      ).resolves.toEqual(['status']);
    });
  });

  describe('CreateGoalDto', () => {
    it('accepts a goal with only a title', async () => {
      await expect(errorsFor(CreateGoalDto, { title: 'Pac' })).resolves.toEqual(
        [],
      );
    });

    it('requires a title', async () => {
      await expect(errorsFor(CreateGoalDto, { title: '' })).resolves.toEqual([
        'title',
      ]);
    });

    it('caps the principle length', async () => {
      await expect(
        errorsFor(CreateGoalDto, { title: 'Pac', principle: 'a'.repeat(2001) }),
      ).resolves.toEqual(['principle']);
    });

    it('keeps the order within the database integer range', async () => {
      await expect(
        errorsFor(CreateGoalDto, { title: 'Pac', order: 2 ** 31 }),
      ).resolves.toEqual(['order']);
      await expect(
        errorsFor(CreateGoalDto, { title: 'Pac', order: -1 }),
      ).resolves.toEqual(['order']);
    });
  });
});
