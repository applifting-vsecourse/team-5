import { SMTPConfig } from '@/core/email/adapters/smtp/interfaces/smtp-config.interface';
import { EmailDeliveryError } from '@/core/email/errors/email-delivery.error';
import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SMTPAdapter implements EmailService {
  private readonly logger = new Logger(SMTPAdapter.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: SMTPConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.pass
          ? {
              user: config.user,
              pass: config.pass,
            }
          : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `SMTP delivery failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new EmailDeliveryError(
        `SMTP delivery failed: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }
}
