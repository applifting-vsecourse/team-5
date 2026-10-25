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
    service.getActivitiesByDogId.mockResolvedValue({
      items: [activity],
      total: 1,
    });
    const result = await new ActivitiesController(service).listByDog(
      { id: 'owner' } as Identity,
      'dog',
      {},
    );
    const [first] = result.items;
    expect(first.messages[0].author).toEqual({
      id: null,
      name: 'smazaný uživatel',
    });
    expect(first.messages[0].text).toBe('Trainer reply');
    expect(first.messages[0]).not.toHaveProperty('authorId');
  });
});

describe('activities by page (#79)', () => {
  it('asks the service for the requested page and says how many records there are', async () => {
    const service = mock<ActivitiesService>();
    service.getActivitiesByDogId.mockResolvedValue({ items: [], total: 7 });

    const result = await new ActivitiesController(service).listByDog(
      { id: 'owner' } as Identity,
      'dog',
      { page: 3, pageSize: 3 },
    );

    expect(service.getActivitiesByDogId).toHaveBeenCalledWith(
      { id: 'owner' },
      'dog',
      3,
      3,
    );
    expect(result).toEqual({ items: [], total: 7, page: 3, pageSize: 3 });
  });

  it('defaults to the first page of 20', async () => {
    const service = mock<ActivitiesService>();
    service.getActivitiesByDogId.mockResolvedValue({ items: [], total: 0 });

    const result = await new ActivitiesController(service).listByDog(
      { id: 'owner' } as Identity,
      'dog',
      {},
    );

    expect(result).toMatchObject({ page: 1, pageSize: 20 });
  });
});
