import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import {
  formatTrainingCount,
  TrainingReminder,
} from '@/core/email/templates/training-reminder';
import {
  APP_TIME_ZONE,
  fromCalendarDate,
} from '@/modules/dog/domain/calendar-date';
import {
  PendingTrainingReminder,
  TrainingReminderRepository,
} from '@/modules/dog/repositories/training-reminder.repository';
import { Config } from '@/shared/config/config.service';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

const TICK_INTERVAL_MS = 60_000;

export interface ReminderRunSummary {
  sentCount: number;
  skippedCount: number;
  failedCount: number;
}

export const getDateAndTimeInZone = (
  now: Date,
  timeZone: string,
): { calendarDate: string; timeHHMM: string } => {
  const calendarDate = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const hour = timeParts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = timeParts.find((p) => p.type === 'minute')?.value ?? '00';
  return { calendarDate, timeHHMM: `${hour}:${minute}` };
};

export const formatCzechDateLabel = (calendarDate: string): string => {
  const [year, month, day] = calendarDate.split('-').map(Number);
  return `${day}. ${month}. ${year}`;
};

@Injectable()
export class TrainingReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrainingReminderService.name);
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCompletedDate: string | null = null;

  constructor(
    private readonly repository: TrainingReminderRepository,
    @Inject('EmailService') private readonly emailService: EmailService,
    private readonly config: Config,
  ) {}

  onModuleInit(): void {
    if (!this.config.trainingReminderEnabled) {
      this.logger.log('Daily training reminder scheduler is disabled.');
      return;
    }
    if (this.config.nodeEnv === 'test' || process.env.NODE_ENV === 'test') {
      return;
    }
    this.logger.log(
      `Daily training reminder scheduler started (time=${this.config.trainingReminderTime}, tz=${this.resolveTimeZone()}).`,
    );
    this.intervalHandle = setInterval(() => {
      void this.handleTick();
    }, TICK_INTERVAL_MS);
    this.intervalHandle.unref();
    void this.handleTick();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async handleTick(now: Date = new Date()): Promise<ReminderRunSummary | null> {
    if (this.isRunning) return null;

    const timeZone = this.resolveTimeZone();
    const { calendarDate, timeHHMM } = getDateAndTimeInZone(now, timeZone);

    if (this.lastCompletedDate === calendarDate) {
      return null;
    }
    if (timeHHMM < this.config.trainingReminderTime) {
      return null;
    }

    this.isRunning = true;
    try {
      const summary = await this.sendDailyReminders(now);
      if (summary.failedCount === 0) {
        this.lastCompletedDate = calendarDate;
      }
      return summary;
    } catch (error) {
      this.logger.error(
        'Unexpected error while running daily training reminders',
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    } finally {
      this.isRunning = false;
    }
  }

  async sendDailyReminders(
    now: Date = new Date(),
  ): Promise<ReminderRunSummary> {
    const timeZone = this.resolveTimeZone();
    const { calendarDate } = getDateAndTimeInZone(now, timeZone);
    const todayDate = fromCalendarDate(calendarDate);
    const dateLabel = formatCzechDateLabel(calendarDate);

    const pending =
      await this.repository.findPendingRemindersForDate(todayDate);
    if (pending.length === 0) {
      return { sentCount: 0, skippedCount: 0, failedCount: 0 };
    }

    const byOwner = new Map<string, PendingTrainingReminder[]>();
    for (const item of pending) {
      const list = byOwner.get(item.ownerId);
      if (list) {
        list.push(item);
      } else {
        byOwner.set(item.ownerId, [item]);
      }
    }

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const items of byOwner.values()) {
      const candidateIds = items.map((item) => item.id);
      const claimedIds = await this.repository.claimRemindersForDate(
        candidateIds,
        todayDate,
      );
      if (claimedIds.length === 0) {
        skippedCount += 1;
        continue;
      }

      const claimedSet = new Set(claimedIds);
      const claimedItems = items.filter((item) => claimedSet.has(item.id));
      const recipient = claimedItems[0];

      try {
        const html = await renderEmail(TrainingReminder, {
          recipientName: recipient.ownerName,
          dateLabel,
          trainings: claimedItems.map((item) => ({
            dogName: item.dogName,
            goalTitle: item.goalTitle,
            trainingTitle: item.trainingTitle,
            discipline: item.discipline,
            stepCount: item.stepCount,
            durationMinutes: item.durationMinutes,
          })),
          todayUrl: `${this.config.frontendUrl}/`,
          accountSettingsUrl: `${this.config.frontendUrl}/account`,
        });

        const subject = `Připomínka: ${formatTrainingCount(claimedItems.length)} na dnešek (${dateLabel})`;
        await this.emailService.sendEmail(recipient.ownerEmail, subject, html);
        sentCount += 1;
      } catch (error) {
        failedCount += 1;
        this.logger.error(
          `Failed to send daily training reminder to owner ${recipient.ownerId}`,
          error instanceof Error ? error.stack : String(error),
        );
        await this.repository.releaseRemindersForDate(claimedIds, todayDate);
      }
    }

    return { sentCount, skippedCount, failedCount };
  }

  private resolveTimeZone(): string {
    const tz = this.config.trainingReminderTimezone?.trim();
    if (!tz) return APP_TIME_ZONE;
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: tz });
      return tz;
    } catch {
      this.logger.warn(
        `Invalid TRAINING_REMINDER_TIMEZONE "${tz}", falling back to "${APP_TIME_ZONE}".`,
      );
      return APP_TIME_ZONE;
    }
  }
}
