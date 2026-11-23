import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { mockDeep } from 'jest-mock-extended';
import {
  recordMessageReply,
  recordPlanReply,
  replyDogAccess,
  TrainingReplyRepository,
} from './training-reply.repository';

describe('unread training receipts', () => {
  it('notifies each shared trainer independently when an owner replies', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.workoutLog.findUniqueOrThrow.mockResolvedValue({
      dog: {
        ownerId: 'owner',
        shares: [{ trainerId: 'trainer1' }, { trainerId: 'trainer2' }],
      },
    } as never);
    await recordMessageReply(tx, 'record', 'owner');
    expect(tx.trainingReply.createMany).toHaveBeenCalledWith({
      data: [
        { recipientId: 'trainer1', workoutLogId: 'record', kind: 'MESSAGE' },
        { recipientId: 'trainer2', workoutLogId: 'record', kind: 'MESSAGE' },
      ],
    });
  });
  it('notifies only the owner for a trainer reply', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.workoutLog.findUniqueOrThrow.mockResolvedValue({
      dog: {
        ownerId: 'owner',
        shares: [{ trainerId: 'trainer1' }, { trainerId: 'trainer2' }],
      },
    } as never);
    await recordMessageReply(tx, 'record', 'trainer1');
    expect(tx.trainingReply.createMany).toHaveBeenCalledWith({
      data: [{ recipientId: 'owner', workoutLogId: 'record', kind: 'MESSAGE' }],
    });
  });
  it('scopes plan changes to planned dates of the concrete training', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.goalTraining.findFirst.mockResolvedValue({
      goal: { dog: { ownerId: 'owner' } },
    } as never);
    const past = new Date();
    past.setUTCDate(past.getUTCDate() - 10);
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 10);
    tx.scheduledTraining.findMany.mockResolvedValue([
      { id: 'past', date: past },
      { id: 'next', date: future },
    ] as never);
    await recordPlanReply(tx, 'training1', 'trainer');
    expect(tx.scheduledTraining.findMany).toHaveBeenCalledWith({
      where: { trainingId: 'training1', status: 'PLANNED' },
      select: { id: true, date: true },
      orderBy: { date: 'asc' },
    });
    expect(tx.trainingReply.create).toHaveBeenCalledWith({
      data: {
        recipientId: 'owner',
        scheduledTrainingId: 'next',
        kind: 'PLAN_CHANGED',
      },
    });
  });
  it('does not notify an owner about their own plan edit', async () => {
    const tx = mockDeep<Prisma.TransactionClient>();
    tx.goalTraining.findFirst.mockResolvedValue({
      goal: { dog: { ownerId: 'owner' } },
    } as never);
    await recordPlanReply(tx, 'training1', 'owner');
    expect(tx.trainingReply.create).not.toHaveBeenCalled();
  });
  it('acknowledges exact IDs for this recipient with current access checks', async () => {
    const prisma = mockDeep<PrismaService>();
    await new TrainingReplyRepository(prisma).acknowledge('owner', [
      'displayed',
    ]);
    const dog = replyDogAccess('owner');
    expect(prisma.trainingReply.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['displayed'] },
        recipientId: 'owner',
        OR: [{ workoutLog: { dog } }, { scheduledTraining: { dog } }],
      },
    });
  });
});
