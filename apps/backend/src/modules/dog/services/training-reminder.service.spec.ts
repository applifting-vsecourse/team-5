import { EmailService } from '@/core/email/interfaces/email-service.interface';
import {
  PendingTrainingReminder,
  TrainingReminderRepository,
} from '@/modules/dog/repositories/training-reminder.repository';
import { Config } from '@/shared/config/config.service';
import {
  formatCzechDateLabel,
  getDateAndTimeInZone,
  TrainingReminderService,
} from './training-reminder.service';

jest.mock('@/core/email/render', () => ({
  renderEmail: jest.fn(async (_component: unknown, props: unknown) =>
    JSON.stringify(props),
  ),
}));

const makeReminder = (
  overrides: Partial<PendingTrainingReminder> = {},
): PendingTrainingReminder => ({
  id: 'st-1',
  dogId: 'dog-1',
  dogName: 'Rex',
  ownerId: 'owner-1',
  ownerName: 'Jana Nováková',
  ownerEmail: 'jana@example.com',
  goalTitle: 'Přivolání',
  discipline: 'Poslušnost',
  trainingTitle: 'Trénink 1',
  stepCount: 3,
  durationMinutes: 15,
  ...overrides,
});

describe('TrainingReminderService', () => {
  const findPendingRemindersForDate = jest.fn();
  const claimRemindersForDate = jest.fn();
  const releaseRemindersForDate = jest.fn();
  const sendEmail = jest.fn();

  const repository = {
    findPendingRemindersForDate,
    claimRemindersForDate,
    releaseRemindersForDate,
  } as unknown as TrainingReminderRepository;

  const emailService: EmailService = {
    sendEmail,
  };

  const makeConfig = (overrides: Partial<Config> = {}): Config =>
    ({
      frontendUrl: 'https://trainloop.app',
      nodeEnv: 'test',
      trainingReminderEnabled: true,
      trainingReminderTime: '08:00',
      trainingReminderTimezone: 'Europe/Prague',
      ...overrides,
    }) as Config;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats calendar date and 24-hour time in the configured timezone', () => {
    // 2026-11-20T07:05:00Z is 08:05 in Europe/Prague (CET, UTC+1)
    const result = getDateAndTimeInZone(
      new Date('2026-11-20T07:05:00.000Z'),
      'Europe/Prague',
    );
    expect(result).toEqual({
      calendarDate: '2026-11-20',
      timeHHMM: '08:05',
    });
    expect(formatCzechDateLabel('2026-11-20')).toBe('20. 11. 2026');
  });

  it('groups multiple trainings for the same owner into a single email and sends separately per owner', async () => {
    const service = new TrainingReminderService(
      repository,
      emailService,
      makeConfig(),
    );

    findPendingRemindersForDate.mockResolvedValue([
      makeReminder({ id: 'st-1', dogName: 'Rex', trainingTitle: 'Trénink A' }),
      makeReminder({ id: 'st-2', dogName: 'Bela', trainingTitle: 'Trénink B' }),
      makeReminder({
        id: 'st-3',
        ownerId: 'owner-2',
        ownerName: 'Petr',
        ownerEmail: 'petr@example.com',
        dogName: 'Max',
        trainingTitle: 'Trénink C',
      }),
    ]);
    claimRemindersForDate
      .mockResolvedValueOnce(['st-1', 'st-2'])
      .mockResolvedValueOnce(['st-3']);
    sendEmail.mockResolvedValue(undefined);

    const summary = await service.sendDailyReminders(
      new Date('2026-11-20T07:00:00.000Z'),
    );

    expect(summary).toEqual({ sentCount: 2, skippedCount: 0, failedCount: 0 });
    expect(findPendingRemindersForDate).toHaveBeenCalledWith(
      new Date('2026-11-20T00:00:00.000Z'),
    );
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      'jana@example.com',
      'Připomínka: 2 naplánované tréninky na dnešek (20. 11. 2026)',
      expect.stringContaining('Trénink A'),
    );
    expect(sendEmail.mock.calls[0][2]).toContain('Trénink B');
    expect(sendEmail).toHaveBeenNthCalledWith(
      2,
      'petr@example.com',
      'Připomínka: 1 naplánovaný trénink na dnešek (20. 11. 2026)',
      expect.stringContaining('Trénink C'),
    );
  });

  it('does not send duplicate emails when reminders were already claimed on the same day', async () => {
    const service = new TrainingReminderService(
      repository,
      emailService,
      makeConfig(),
    );

    findPendingRemindersForDate.mockResolvedValue([makeReminder()]);
    claimRemindersForDate.mockResolvedValue([]);

    const summary = await service.sendDailyReminders(
      new Date('2026-11-20T07:00:00.000Z'),
    );

    expect(summary).toEqual({ sentCount: 0, skippedCount: 1, failedCount: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('releases claimed reminders if email delivery fails and continues with other owners', async () => {
    const service = new TrainingReminderService(
      repository,
      emailService,
      makeConfig(),
    );

    findPendingRemindersForDate.mockResolvedValue([
      makeReminder({ id: 'st-1', ownerId: 'owner-1', ownerEmail: 'a@test.cz' }),
      makeReminder({ id: 'st-2', ownerId: 'owner-2', ownerEmail: 'b@test.cz' }),
    ]);
    claimRemindersForDate
      .mockResolvedValueOnce(['st-1'])
      .mockResolvedValueOnce(['st-2']);
    sendEmail
      .mockRejectedValueOnce(new Error('SMTP down'))
      .mockResolvedValueOnce(undefined);

    const summary = await service.sendDailyReminders(
      new Date('2026-11-20T07:00:00.000Z'),
    );

    expect(summary).toEqual({ sentCount: 1, skippedCount: 0, failedCount: 1 });
    expect(releaseRemindersForDate).toHaveBeenCalledWith(
      ['st-1'],
      new Date('2026-11-20T00:00:00.000Z'),
    );
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('handleTick only runs at or after configured time, once per day, and runs again the next day', async () => {
    const service = new TrainingReminderService(
      repository,
      emailService,
      makeConfig({ trainingReminderTime: '08:00' }),
    );
    findPendingRemindersForDate.mockResolvedValue([]);

    // 07:59 Prague time -> too early
    expect(
      await service.handleTick(new Date('2026-11-20T06:59:00.000Z')),
    ).toBeNull();
    expect(findPendingRemindersForDate).not.toHaveBeenCalled();

    // 08:00 Prague time -> runs
    expect(
      await service.handleTick(new Date('2026-11-20T07:00:00.000Z')),
    ).toEqual({ sentCount: 0, skippedCount: 0, failedCount: 0 });
    expect(findPendingRemindersForDate).toHaveBeenCalledTimes(1);

    // 08:05 Prague time same day -> already completed today
    expect(
      await service.handleTick(new Date('2026-11-20T07:05:00.000Z')),
    ).toBeNull();
    expect(findPendingRemindersForDate).toHaveBeenCalledTimes(1);

    // Next day 08:00 Prague time -> runs again
    expect(
      await service.handleTick(new Date('2026-11-21T07:00:00.000Z')),
    ).toEqual({ sentCount: 0, skippedCount: 0, failedCount: 0 });
    expect(findPendingRemindersForDate).toHaveBeenCalledTimes(2);
  });
});
