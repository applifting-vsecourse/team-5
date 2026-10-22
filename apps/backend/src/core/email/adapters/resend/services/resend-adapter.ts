import { ResendConfig } from '@/core/email/adapters/resend/interfaces/resend-config.interface';
import { EmailDeliveryError } from '@/core/email/errors/email-delivery.error';
import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendAdapter implements EmailService {
  private readonly logger = new Logger(ResendAdapter.name);
  private readonly client: Resend;

  constructor(private readonly config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const { error } = await this.client.emails.send({
        from: this.config.from,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend delivery failed: ${error.message}`, error);
        throw new EmailDeliveryError(
          `Resend delivery failed: ${error.message}`,
        );
      }
    } catch (error) {
      if (error instanceof EmailDeliveryError) {
        throw error;
      }
      this.logger.error(
        `Resend delivery failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new EmailDeliveryError(
        `Resend delivery failed: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }
}
