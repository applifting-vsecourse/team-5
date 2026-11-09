import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma, ScheduledTraining } from '@/generated/prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ScheduledTrainingRepository } from './scheduled-training.repository';

function setup(): {
  repository: ScheduledTrainingRepository;
  tx: DeepMockProxy<Prisma.TransactionClient>;
} {
  const prisma = mockDeep<PrismaService>();
  const tx = mockDeep<Prisma.TransactionClient>();
  prisma.$transaction.mockImplementation(async (callback) => callback(tx));
  tx.scheduledTraining.updateMany.mockResolvedValue({ count: 1 });
  tx.scheduledTraining.findUniqueOrThrow.mockResolvedValue({
    id: 't1',
    goalId: 'g1',
    dogId: 'd1',
    trainingId: 'training-1',
    date: new Date('2026-11-06'),
    training: { title: 'Pozice' },
    goal: { id: 'g1', title: 'Goal', discipline: null },
  } as unknown as ScheduledTraining);
  tx.trainingGoal.findUniqueOrThrow.mockResolvedValue({
    title: 'Goal',
    discipline: null,
  } as never);
  return { repository: new ScheduledTrainingRepository(prisma), tx };
}

// The current step of a goal (#66) moves only through its own endpoints.
describe('closing a planned training', () => {
  it('creates the opening chat message together with the record', async () => {
    const { repository, tx } = setup();
    await repository.completeTraining('t1', 'u1', {
      note: '  First message  ',
    });
    expect(tx.workoutLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        note: 'First message',
        messages: { create: { authorId: 'u1', text: 'First message' } },
      }),
    });
  });

  it('does not create an empty opening message', async () => {
    const { repository, tx } = setup();
    await repository.completeTraining('t1', 'u1', { note: '   ' });
    expect(tx.workoutLog.create.mock.calls[0][0].data).not.toHaveProperty(
      'messages',
    );
  });

  it('does not move the current step when completing', async () => {
    const { repository, tx } = setup();
    await repository.completeTraining('t1', 'u1', {});
    expect(tx.trainingGoal.update).not.toHaveBeenCalled();
    expect(tx.planBlock.update).not.toHaveBeenCalled();
    expect(tx.planBlock.updateMany).not.toHaveBeenCalled();
  });

  it('does not move the current step when skipping', async () => {
    const { repository, tx } = setup();
    await repository.skipPlannedTraining('t1', 'u1');
    expect(tx.trainingGoal.update).not.toHaveBeenCalled();
    expect(tx.planBlock.update).not.toHaveBeenCalled();
    expect(tx.planBlock.updateMany).not.toHaveBeenCalled();
  });
});
