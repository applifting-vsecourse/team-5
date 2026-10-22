import { Config } from '@/shared/config/config.service';
import { Global, Module } from '@nestjs/common';
import { ConsoleMailerAdapterFactory } from './adapters/console-mailer/console-mailer.adapter.factory';
import { ResendAdapterFactory } from './adapters/resend/resend.adapter.factory';
import { SMTPAdapterFactory } from './adapters/smtp/smtp.adapter.factory';
import { EmailModule } from './email.module';

/**
 * Picks an email adapter based on env:
 *   RESEND_API_KEY set           → Resend
 *   SMTP_HOST set (≠ console)    → SMTP (e.g. Mailpit on localhost:1025)
 *   otherwise                    → ConsoleMailerAdapter (logs to stdout, dev fallback)
 *
 * Import this module whenever you need to inject `'EmailService'`.
 * The single shared `EmailService` instance is provided here so every
 * consumer (auth flows, debug endpoints, …) uses the same transport.
 */
@Global()
@Module({
  imports: [
    EmailModule.forRootAsync({
      useFactory: async (...args: unknown[]) => {
        const config = args[0] as Config;
        if (config.resendApiKey) {
          return ResendAdapterFactory.create({
            apiKey: config.resendApiKey,
            from: config.emailFrom,
          });
        }
        if (config.smtpHost && config.smtpHost !== 'console') {
          return SMTPAdapterFactory.create({
            host: config.smtpHost,
            port: config.smtpPort || 1025,
            secure: config.smtpSecure ?? false,
            from: config.emailFrom,
            user: config.smtpUsername,
            pass: config.smtpPassword,
          });
        }
        return ConsoleMailerAdapterFactory.create();
      },
      inject: [Config],
    }),
  ],
  exports: [EmailModule],
})
export class MailModule {}
