import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompleteTrainingDto } from './training.dto';

const errorsFor = async (plain: Record<string, unknown>): Promise<string[]> => {
  const errors = await validate(plainToInstance(CompleteTrainingDto, plain));
  return errors.map((error) => error.property);
};

describe('CompleteTrainingDto', () => {
  it('accepts an empty record: every field is optional', async () => {
    await expect(errorsFor({})).resolves.toEqual([]);
  });

  it.each([0, 70, 100])('accepts a success rate of %i %%', async (rate) => {
    await expect(errorsFor({ successRate: rate })).resolves.toEqual([]);
  });

  // The slider moves by 10 %, so the API takes the same steps (#77).
  it.each([73, 105, -10])('rejects a success rate of %i %%', async (rate) => {
    await expect(errorsFor({ successRate: rate })).resolves.toEqual([
      'successRate',
    ]);
  });

  it('accepts an optional https video URL up to 500 characters', async () => {
    await expect(
      errorsFor({ videoUrl: 'https://youtube.com/watch?v=123' }),
    ).resolves.toEqual([]);
  });

  it('rejects a non-https video URL', async () => {
    await expect(
      errorsFor({ videoUrl: 'http://youtube.com/watch?v=123' }),
    ).resolves.toEqual(['videoUrl']);
  });

  it('rejects a video URL longer than 500 characters', async () => {
    await expect(
      errorsFor({ videoUrl: `https://example.com/${'a'.repeat(500)}` }),
    ).resolves.toEqual(['videoUrl']);
  });
});
