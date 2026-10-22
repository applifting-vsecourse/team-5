import { presentTrainingMessage } from './training-message';

describe('training message author after deletion', () => {
  it('preserves the message and presents a removed trainer as smazaný uživatel', () => {
    const result = presentTrainingMessage({
      id: 'message',
      workoutLogId: 'log',
      authorId: null,
      author: null,
      text: 'Pokračujte v tréninku.',
      createdAt: new Date(),
    });
    expect(result.author).toEqual({ id: null, name: 'smazaný uživatel' });
    expect(result.text).toBe('Pokračujte v tréninku.');
    expect(result).not.toHaveProperty('authorId');
  });
});
