import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { TrainingNotificationKind } from '@/generated/prisma/client';
import { TrainingNotificationRepository } from '@/modules/dog/repositories/training-notification.repository';
import { Config } from '@/shared/config/config.service';
import { mock } from 'jest-mock-extended';
import {
  NOTIFICATION_COOLDOWN_MS,
  TrainingNotificationService,
} from './training-notification.service';

jest.mock('@/core/email/render', () => ({
  renderEmail: jest.fn((_Component: unknown, props: unknown) =>
    Promise.resolve(JSON.stringify(props)),
  ),
}));

const makeContext = (overrides?: {
  ownerEnabled?: boolean;
  trainerEnabled?: boolean;
}) => ({
  id: 'log-1',
  title: 'Přivolání v parku',
  dogId: 'dog-1',
  dog: {
    id: 'dog-1',
    name: 'Rex',
    ownerId: 'owner-1',
    owner: {
      id: 'owner-1',
      name: 'Jan Novák',
      email: 'jan@example.test',
      emailNotificationsEnabled: overrides?.ownerEnabled ?? true,
    },
    shares: [
      {
        trainer: {
          id: 'trainer-1',
          name: 'Veronika Trenérka',
          email: 'veronika@example.test',
          emailNotificationsEnabled: overrides?.trainerEnabled ?? true,
        },
      },
    ],
  },
});

describe('TrainingNotificationService', () => {
  const createService = () => {
    const repository = mock<TrainingNotificationRepository>();
    const emailService = mock<EmailService>();
    const config = {
      frontendUrl: 'https://trainloop.test',
      nodeEnv: 'test',
    } as Config;
    const service = new TrainingNotificationService(
      repository,
      emailService,
      config,
    );
    return { service, repository, emailService };
  };

  it('emails the handler immediately when a trainer replies and links directly to the record', async () => {
    const { service, repository, emailService } = createService();
    const now = new Date('2026-11-19T12:00:00Z');
    repository.findThreadContext.mockResolvedValue(makeContext());
    repository.findState.mockResolvedValue(null);

    await service.notifyMessage('log-1', 'trainer-1', 'Skvělá práce!', now);

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, html] = emailService.sendEmail.mock.calls[0];
    expect(to).toBe('jan@example.test');
    expect(subject).toBe('Nová odpověď od trenéra – Rex: Přivolání v parku');
    expect(html).toContain(
      'https://trainloop.test/dogs/dog-1/activities/log-1',
    );
    expect(html).toContain('Skvělá práce!');
    expect(repository.recordImmediateSend).toHaveBeenCalledWith(
      'log-1',
      'owner-1',
      now,
    );
  });

  it('emails shared trainers when the handler logs a new training record', async () => {
    const { service, repository, emailService } = createService();
    const now = new Date('2026-11-19T12:00:00Z');
    repository.findThreadContext.mockResolvedValue(makeContext());
    repository.findState.mockResolvedValue(null);

    await service.notifyNewRecord('log-1', 'owner-1', 'Dnes byl klidný.', now);

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, html] = emailService.sendEmail.mock.calls[0];
    expect(to).toBe('veronika@example.test');
    expect(subject).toBe('Nový záznam tréninku – Rex: Přivolání v parku');
    expect(html).toContain('Dnes byl klidný.');
    expect(html).toContain(
      'https://trainloop.test/dogs/dog-1/activities/log-1',
    );
  });

  it('respects opt-out when the recipient has emailNotificationsEnabled = false', async () => {
    const { service, repository, emailService } = createService();
    repository.findThreadContext.mockResolvedValue(
      makeContext({ ownerEnabled: false }),
    );

    await service.notifyMessage('log-1', 'trainer-1', 'Odpověď');

    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(repository.recordImmediateSend).not.toHaveBeenCalled();
    expect(repository.enqueuePendingEvent).not.toHaveBeenCalled();
  });

  it('queues subsequent messages within 1 hour instead of sending another email immediately', async () => {
    const { service, repository, emailService } = createService();
    const lastSentAt = new Date('2026-11-19T12:00:00Z');
    const twentyMinutesLater = new Date('2026-11-19T12:20:00Z');
    repository.findThreadContext.mockResolvedValue(makeContext());
    repository.findState.mockResolvedValue({
      id: 'notif-1',
      workoutLogId: 'log-1',
      recipientId: 'trainer-1',
      lastSentAt,
      nextDigestAt: null,
      createdAt: lastSentAt,
      updatedAt: lastSentAt,
    });

    await service.notifyMessage(
      'log-1',
      'owner-1',
      'Ještě jedna poznámka',
      twentyMinutesLater,
    );

    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(repository.enqueuePendingEvent).toHaveBeenCalledWith({
      workoutLogId: 'log-1',
      recipientId: 'trainer-1',
      nextDigestAt: new Date(lastSentAt.getTime() + NOTIFICATION_COOLDOWN_MS),
      kind: TrainingNotificationKind.CLIENT_MESSAGE,
      actorId: 'owner-1',
      text: 'Ještě jedna poznámka',
    });
  });

  it('flushes due digests into a single summary email after the hour passes', async () => {
    const { service, repository, emailService } = createService();
    const flushTime = new Date('2026-11-19T13:01:00Z');
    repository.findDueDigests.mockResolvedValue([
      {
        id: 'notif-1',
        workoutLogId: 'log-1',
        recipientId: 'trainer-1',
        lastSentAt: new Date('2026-11-19T12:00:00Z'),
        nextDigestAt: new Date('2026-11-19T13:00:00Z'),
        createdAt: new Date('2026-11-19T12:00:00Z'),
        updatedAt: new Date('2026-11-19T12:20:00Z'),
        recipient: {
          id: 'trainer-1',
          name: 'Veronika Trenérka',
          email: 'veronika@example.test',
          emailNotificationsEnabled: true,
        },
        workoutLog: {
          id: 'log-1',
          title: 'Přivolání v parku',
          dogId: 'dog-1',
          dog: { id: 'dog-1', name: 'Rex' },
        },
        pendingEvents: [
          {
            id: 'evt-1',
            notificationId: 'notif-1',
            kind: TrainingNotificationKind.CLIENT_MESSAGE,
            actorId: 'owner-1',
            actor: { id: 'owner-1', name: 'Jan Novák' },
            text: 'První doplnění',
            createdAt: new Date('2026-11-19T12:10:00Z'),
          },
          {
            id: 'evt-2',
            notificationId: 'notif-1',
            kind: TrainingNotificationKind.CLIENT_MESSAGE,
            actorId: 'owner-1',
            actor: { id: 'owner-1', name: 'Jan Novák' },
            text: 'Druhé doplnění',
            createdAt: new Date('2026-11-19T12:25:00Z'),
          },
        ],
      },
    ]);

    const sent = await service.flushDueDigests(flushTime);

    expect(sent).toBe(1);
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, html] = emailService.sendEmail.mock.calls[0];
    expect(to).toBe('veronika@example.test');
    expect(subject).toBe(
      'Shrnutí zpráv k tréninku (2) – Rex: Přivolání v parku',
    );
    expect(html).toContain('První doplnění');
    expect(html).toContain('Druhé doplnění');
    expect(repository.markDigestSent).toHaveBeenCalledWith(
      'notif-1',
      ['evt-1', 'evt-2'],
      flushTime,
      new Date(flushTime.getTime() + NOTIFICATION_COOLDOWN_MS),
    );
  });

  it('drops pending digest events without emailing if recipient disabled notifications meanwhile', async () => {
    const { service, repository, emailService } = createService();
    const flushTime = new Date('2026-11-19T13:01:00Z');
    repository.findDueDigests.mockResolvedValue([
      {
        id: 'notif-1',
        workoutLogId: 'log-1',
        recipientId: 'trainer-1',
        lastSentAt: new Date('2026-11-19T12:00:00Z'),
        nextDigestAt: new Date('2026-11-19T13:00:00Z'),
        createdAt: new Date('2026-11-19T12:00:00Z'),
        updatedAt: new Date('2026-11-19T12:20:00Z'),
        recipient: {
          id: 'trainer-1',
          name: 'Veronika Trenérka',
          email: 'veronika@example.test',
          emailNotificationsEnabled: false,
        },
        workoutLog: {
          id: 'log-1',
          title: 'Přivolání v parku',
          dogId: 'dog-1',
          dog: { id: 'dog-1', name: 'Rex' },
        },
        pendingEvents: [
          {
            id: 'evt-1',
            notificationId: 'notif-1',
            kind: TrainingNotificationKind.CLIENT_MESSAGE,
            actorId: 'owner-1',
            actor: { id: 'owner-1', name: 'Jan Novák' },
            text: 'První doplnění',
            createdAt: new Date('2026-11-19T12:10:00Z'),
          },
        ],
      },
    ]);

    const sent = await service.flushDueDigests(flushTime);

    expect(sent).toBe(0);
    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(repository.clearEvents).toHaveBeenCalledWith('notif-1', ['evt-1']);
  });

  it('enqueues a digest when the immediate email send fails', async () => {
    const { service, repository, emailService } = createService();
    const now = new Date('2026-11-19T12:00:00Z');
    repository.findThreadContext.mockResolvedValue(makeContext());
    repository.findState.mockResolvedValue(null);
    emailService.sendEmail.mockRejectedValue(new Error('SMTP down'));

    await service.notifyMessage('log-1', 'trainer-1', 'Skvělá práce!', now);

    expect(repository.recordImmediateSend).not.toHaveBeenCalled();
    expect(repository.enqueuePendingEvent).toHaveBeenCalledWith({
      workoutLogId: 'log-1',
      recipientId: 'owner-1',
      nextDigestAt: new Date(now.getTime() + NOTIFICATION_COOLDOWN_MS),
      kind: TrainingNotificationKind.TRAINER_REPLY,
      actorId: 'trainer-1',
      text: 'Skvělá práce!',
    });
  });
});
