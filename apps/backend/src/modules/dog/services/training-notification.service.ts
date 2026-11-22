import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import {
  getTrainingNotificationSubject,
  TrainingNotification,
  TrainingNotificationItem,
} from '@/core/email/templates/training-notification';
import { TrainingNotificationKind } from '@/generated/prisma/client';
import { TrainingNotificationRepository } from '@/modules/dog/repositories/training-notification.repository';
import { presentAuthor } from '@/shared/auth/domain/present-author';
import { Config } from '@/shared/config/config.service';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

export const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000;
const DIGEST_POLL_INTERVAL_MS = 60 * 1000;

@Injectable()
export class TrainingNotificationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TrainingNotificationService.name);
  private digestTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor(
    private readonly repository: TrainingNotificationRepository,
    @Inject('EmailService') private readonly emailService: EmailService,
    private readonly config: Config,
  ) {}

  onModuleInit(): void {
    if (this.config.nodeEnv === 'test' || process.env.NODE_ENV === 'test') {
      return;
    }
    this.digestTimer = setInterval(() => {
      void this.flushDueDigests();
    }, DIGEST_POLL_INTERVAL_MS);
    this.digestTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.digestTimer) {
      clearInterval(this.digestTimer);
      this.digestTimer = null;
    }
  }

  async notifyNewRecord(
    workoutLogId: string,
    actorId: string,
    note?: string | null,
    now: Date = new Date(),
  ): Promise<void> {
    await this.dispatch(
      workoutLogId,
      actorId,
      TrainingNotificationKind.NEW_RECORD,
      note?.trim() || null,
      now,
    );
  }

  async notifyMessage(
    workoutLogId: string,
    actorId: string,
    text: string,
    now: Date = new Date(),
  ): Promise<void> {
    const context = await this.repository.findThreadContext(workoutLogId);
    if (!context) return;
    const kind =
      actorId === context.dog.ownerId
        ? TrainingNotificationKind.CLIENT_MESSAGE
        : TrainingNotificationKind.TRAINER_REPLY;
    await this.dispatchWithContext(context, actorId, kind, text.trim(), now);
  }

  async flushDueDigests(now: Date = new Date()): Promise<number> {
    if (this.isFlushing) return 0;
    this.isFlushing = true;
    let sentCount = 0;
    try {
      const due = await this.repository.findDueDigests(now);
      for (const row of due) {
        const eventIds = row.pendingEvents.map((event) => event.id);
        if (!eventIds.length) continue;

        if (!row.recipient.emailNotificationsEnabled) {
          await this.repository.clearEvents(row.id, eventIds);
          continue;
        }

        const items: TrainingNotificationItem[] = row.pendingEvents.map(
          (event) => ({
            kind: event.kind,
            actorName: presentAuthor(event.actor).name,
            text: event.text,
          }),
        );

        try {
          await this.sendNotificationEmail({
            recipientEmail: row.recipient.email,
            recipientName: row.recipient.name,
            dogId: row.workoutLog.dogId,
            dogName: row.workoutLog.dog.name,
            workoutLogId: row.workoutLog.id,
            trainingTitle: row.workoutLog.title,
            items,
          });
          await this.repository.markDigestSent(
            row.id,
            eventIds,
            now,
            new Date(now.getTime() + NOTIFICATION_COOLDOWN_MS),
          );
          sentCount += 1;
        } catch (error) {
          this.logger.error(
            `Failed to send digest email for workoutLog ${row.workoutLogId} to user ${row.recipientId}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to flush due training notification digests',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isFlushing = false;
    }
    return sentCount;
  }

  private async dispatch(
    workoutLogId: string,
    actorId: string,
    kind: TrainingNotificationKind,
    text: string | null,
    now: Date,
  ): Promise<void> {
    try {
      const context = await this.repository.findThreadContext(workoutLogId);
      if (!context) return;
      await this.dispatchWithContext(context, actorId, kind, text, now);
    } catch (error) {
      this.logger.error(
        `Failed to dispatch training notification for workoutLog ${workoutLogId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async dispatchWithContext(
    context: NonNullable<
      Awaited<ReturnType<TrainingNotificationRepository['findThreadContext']>>
    >,
    actorId: string,
    kind: TrainingNotificationKind,
    text: string | null,
    now: Date,
  ): Promise<void> {
    const isOwnerActing = actorId === context.dog.ownerId;
    const actor = isOwnerActing
      ? context.dog.owner
      : (context.dog.shares.find((share) => share.trainer.id === actorId)
          ?.trainer ?? null);
    if (!actor) return;

    const recipients = (
      isOwnerActing
        ? context.dog.shares.map((share) => share.trainer)
        : [context.dog.owner]
    ).filter(
      (recipient) =>
        recipient.id !== actorId && recipient.emailNotificationsEnabled,
    );

    for (const recipient of recipients) {
      try {
        const state = await this.repository.findState(context.id, recipient.id);
        const withinCooldown = Boolean(
          state?.lastSentAt &&
          now.getTime() - state.lastSentAt.getTime() < NOTIFICATION_COOLDOWN_MS,
        );

        if (withinCooldown || state?.nextDigestAt) {
          const nextDigestAt =
            state?.nextDigestAt ??
            new Date(
              (state?.lastSentAt ?? now).getTime() + NOTIFICATION_COOLDOWN_MS,
            );
          await this.repository.enqueuePendingEvent({
            workoutLogId: context.id,
            recipientId: recipient.id,
            nextDigestAt,
            kind,
            actorId: actor.id,
            text,
          });
          continue;
        }

        try {
          await this.sendNotificationEmail({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            dogId: context.dog.id,
            dogName: context.dog.name,
            workoutLogId: context.id,
            trainingTitle: context.title,
            items: [{ kind, actorName: actor.name, text }],
          });
          await this.repository.recordImmediateSend(
            context.id,
            recipient.id,
            now,
          );
        } catch (sendError) {
          // Transient SMTP failures must not drop the event: queue a digest retry.
          const nextDigestAt = new Date(
            now.getTime() + NOTIFICATION_COOLDOWN_MS,
          );
          this.logger.error(
            `Immediate notify failed for user ${recipient.id} about workoutLog ${context.id}; enqueueing digest`,
            sendError instanceof Error ? sendError.stack : String(sendError),
          );
          await this.repository.enqueuePendingEvent({
            workoutLogId: context.id,
            recipientId: recipient.id,
            nextDigestAt,
            kind,
            actorId: actor.id,
            text,
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to notify user ${recipient.id} about workoutLog ${context.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async sendNotificationEmail(params: {
    recipientEmail: string;
    recipientName: string;
    dogId: string;
    dogName: string;
    workoutLogId: string;
    trainingTitle: string;
    items: TrainingNotificationItem[];
  }): Promise<void> {
    const recordUrl = `${this.config.frontendUrl}/dogs/${params.dogId}/activities/${params.workoutLogId}`;
    const accountUrl = `${this.config.frontendUrl}/account`;
    const html = await renderEmail(TrainingNotification, {
      recipientName: params.recipientName,
      dogName: params.dogName,
      trainingTitle: params.trainingTitle,
      recordUrl,
      accountUrl,
      items: params.items,
    });
    const subject = getTrainingNotificationSubject(
      params.dogName,
      params.trainingTitle,
      params.items,
    );
    await this.emailService.sendEmail(params.recipientEmail, subject, html);
  }
}
