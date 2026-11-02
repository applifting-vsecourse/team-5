import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActivitiesQueryDto } from './activity.dto';

// Query values arrive as strings, as in a real request.
const errorsFor = async (query: Record<string, string>): Promise<string[]> => {
  const errors = await validate(plainToInstance(ActivitiesQueryDto, query));
  return errors.map((error) => error.property);
};

describe('ActivitiesQueryDto (#79)', () => {
  it('accepts no parameters: the controller then uses page 1 of 20', async () => {
    await expect(errorsFor({})).resolves.toEqual([]);
  });

  it('turns query strings into numbers', async () => {
    const dto = plainToInstance(ActivitiesQueryDto, {
      page: '2',
      pageSize: '3',
    });
    expect(dto).toEqual({ page: 2, pageSize: 3 });
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it.each(['1', '50'])('accepts a page size of %s', async (pageSize) => {
    await expect(errorsFor({ pageSize })).resolves.toEqual([]);
  });

  // page 0 would mean a negative skip, which the database refuses.
  it.each(['0', '-1', '1.5', 'abc'])('rejects page %s', async (page) => {
    await expect(errorsFor({ page })).resolves.toEqual(['page']);
  });

  it.each(['0', '51', 'abc'])('rejects a page size of %s', async (pageSize) => {
    await expect(errorsFor({ pageSize })).resolves.toEqual(['pageSize']);
  });
});
