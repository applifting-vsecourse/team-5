import { PrismaService } from '@/core/prisma/prisma.service';
import { GoalStatus, TrainingStatus } from '@/generated/prisma/client';
import { TrainingReminderRepository } from './training-reminder.repository';

describe('TrainingReminderRepository', () => {
  const findMany = jest.fn();
  const updateManyAndReturn = jest.fn();
  const updateMany = jest.fn();

  const prisma = {
    scheduledTraining: {
      findMany,
      updateManyAndReturn,
      updateMany,
    },
  } as unknown as PrismaService;

  const repository = new TrainingReminderRepository(prisma);
  const today = new Date('2026-11-20T00:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries only PLANNED trainings for today on active dogs, active goals, and opted-in owners', async () => {
    findMany.mockResolvedValue([
      {
        id: 'st-1',
        dog: {
          id: 'dog-1',
          name: 'Rex',
          owner: {
            id: 'owner-1',
            name: 'Jana',
            email: 'jana@example.com',
          },
        },
        goal: {
          id: 'goal-1',
          title: 'Přivolání',
          discipline: 'Poslušnost',
        },
        training: {
          id: 'gt-1',
          title: 'Trénink 1',
          steps: [{ durationMinutes: 5 }, { durationMinutes: 10 }],
        },
      },
    ]);

    const result = await repository.findPendingRemindersForDate(today);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          date: today,
          status: TrainingStatus.PLANNED,
          OR: [
            { reminderSentForDate: null },
            { reminderSentForDate: { not: today } },
          ],
          dog: {
            isArchived: false,
            owner: {
              trainingRemindersEnabled: true,
            },
          },
          goal: {
            status: GoalStatus.ACTIVE,
          },
        },
      }),
    );

    expect(result).toEqual([
      {
        id: 'st-1',
        dogId: 'dog-1',
        dogName: 'Rex',
        ownerId: 'owner-1',
        ownerName: 'Jana',
        ownerEmail: 'jana@example.com',
        goalTitle: 'Přivolání',
        discipline: 'Poslušnost',
        trainingTitle: 'Trénink 1',
        stepCount: 2,
        durationMinutes: 15,
      },
    ]);
  });

  it('atomically claims only unsent PLANNED trainings for today', async () => {
    updateManyAndReturn.mockResolvedValue([{ id: 'st-1' }]);

    const claimed = await repository.claimRemindersForDate(
      ['st-1', 'st-2'],
      today,
    );

    expect(claimed).toEqual(['st-1']);
    expect(updateManyAndReturn).toHaveBeenCalledWith({
      where: {
        id: { in: ['st-1', 'st-2'] },
        status: TrainingStatus.PLANNED,
        date: today,
        OR: [
          { reminderSentForDate: null },
          { reminderSentForDate: { not: today } },
        ],
      },
      data: {
        reminderSentForDate: today,
      },
      select: {
        id: true,
      },
    });
  });

  it('skips DB call when claiming or releasing an empty list', async () => {
    expect(await repository.claimRemindersForDate([], today)).toEqual([]);
    await repository.releaseRemindersForDate([], today);
    expect(updateManyAndReturn).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('releases claimed reminders back to null on delivery failure', async () => {
    updateMany.mockResolvedValue({ count: 2 });

    await repository.releaseRemindersForDate(['st-1', 'st-2'], today);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['st-1', 'st-2'] },
        reminderSentForDate: today,
      },
      data: {
        reminderSentForDate: null,
      },
    });
  });
});
