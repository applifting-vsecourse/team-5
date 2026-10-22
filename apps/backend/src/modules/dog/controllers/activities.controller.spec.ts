import { ActivityWithMessages } from '@/modules/dog/domain/activity';
import { ActivitiesService } from '@/modules/dog/services/activities.service';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { ActivitiesController } from './activities.controller';

// This suite tests response serialization. Authentication is exercised through
// the real BetterAuth handler in test/account-deletion.test.mjs.
jest.mock('@/shared/auth/guards/authenticated-user.guard', () => ({
  AuthenticatedUserGuard: class {},
}));

describe('activity messages after account deletion', () => {
  it('returns preserved messages with no deleted trainer identity', async () => {
    const service = mock<ActivitiesService>();
    const activity = mock<ActivityWithMessages>({
      id: 'log',
      dogId: 'dog',
      authorId: null,
      messages: [
        {
          id: 'message',
          workoutLogId: 'log',
          text: 'Trainer reply',
          authorId: null,
          author: null,
          createdAt: new Date(),
        },
      ],
    });
    service.getActivitiesByDogId.mockResolvedValue([activity]);
    const result = await new ActivitiesController(service).listByDog(
      { id: 'owner' } as Identity,
      'dog',
    );
    expect(result[0].messages[0].author).toEqual({
      id: null,
      name: 'smazaný uživatel',
    });
    expect(result[0].messages[0].text).toBe('Trainer reply');
    expect(result[0].messages[0]).not.toHaveProperty('authorId');
  });
});
