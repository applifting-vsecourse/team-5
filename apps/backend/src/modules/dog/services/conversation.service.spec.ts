import { ConversationRepository } from '@/modules/dog/repositories/conversation.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ConversationService } from './conversation.service';

describe('training conversations', () => {
  it('checks the current dog share before returning a thread or inserting a reply', async () => {
    const repo = mock<ConversationRepository>();
    const access = mock<DogAccessService>();
    repo.record.mockResolvedValue({
      id: 'record',
      dogId: 'other-dog',
    } as never);
    access.getAccessibleDog.mockRejectedValue(new NotFoundException());
    const service = new ConversationService(repo, access);
    const user = new Identity(
      'outsider',
      'outsider@example.test',
      'Other',
      'owner',
    );
    await expect(service.detail(user, 'record')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.reply(user, 'record', 'Unauthorized')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.reply).not.toHaveBeenCalled();
  });
  it('uses the authenticated author and trims a permitted reply', async () => {
    const repo = mock<ConversationRepository>();
    const access = mock<DogAccessService>();
    repo.record.mockResolvedValue({
      id: 'record',
      dogId: 'shared-dog',
    } as never);
    repo.reply.mockResolvedValue({
      id: 'message',
      workoutLogId: 'record',
      authorId: 'trainer',
      text: 'Reply',
      createdAt: new Date(),
      author: { id: 'trainer', name: 'Trainer' },
    });
    const service = new ConversationService(repo, access);
    const user = new Identity(
      'trainer',
      'trainer@example.test',
      'Trainer',
      'trainer',
    );
    await service.reply(user, 'record', '  Reply  ');
    expect(access.getAccessibleDog).toHaveBeenCalledWith(user, 'shared-dog');
    expect(repo.reply).toHaveBeenCalledWith('record', 'trainer', 'Reply');
  });

  it('returns plan blocks when the record is tied to a training', async () => {
    const repo = mock<ConversationRepository>();
    const access = mock<DogAccessService>();
    repo.record.mockResolvedValue({
      id: 'record',
      dogId: 'shared-dog',
      dog: { id: 'shared-dog', name: 'Rex', color: 1 },
      title: 'Park',
      completedAt: new Date('2026-11-01'),
      successRate: 80,
      note: null,
      videoUrl: null,
      mistakeDetails: [],
      focus: null,
      repeatedMistakes: null,
      status: 'COMPLETED',
      training: {
        title: 'Přivolání',
        steps: [
          { id: 's1', title: 'Píšťalka', outcome: 'MASTERED', position: 0 },
          { id: 's2', title: 'Sedni', outcome: null, position: 1 },
        ],
      },
      messages: [],
    } as never);
    const service = new ConversationService(repo, access);
    const user = new Identity(
      'trainer',
      'trainer@example.test',
      'Trainer',
      'trainer',
    );
    await expect(service.detail(user, 'record')).resolves.toMatchObject({
      goal: {
        title: 'Přivolání',
        blocks: [
          { id: 's1', title: 'Píšťalka', outcome: 'MASTERED', position: 0 },
          { id: 's2', title: 'Sedni', outcome: null, position: 1 },
        ],
      },
    });
  });
});
