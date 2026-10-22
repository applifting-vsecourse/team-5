import { EmailDeliveryError } from '@/core/email/errors/email-delivery.error';
import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import { ResetPassword } from '@/core/email/templates/reset-password';
import { VerifyEmail } from '@/core/email/templates/verify-email';
import { PrismaService } from '@/core/prisma/prisma.service';
import { deleteDogPhotoFiles } from '@/modules/dog/services/dog-photo.service';
import { betterAuthCoreConfig } from '@/shared/auth/config/better-auth.config';
import { Config } from '@/shared/config/config.service';
import { Inject, Provider } from '@nestjs/common';
import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const createAuth = (
  prismaService: PrismaService,
  config: Config,
  emailProvider: EmailService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  betterAuth({
    // If change (setup) affects database, must be in core config, in order to be able to run migrations
    ...betterAuthCoreConfig,
    // Without this better-auth can only guess its own URL from the request,
    // which breaks callbacks and links built outside a request (e.g. the seed).
    baseURL: config.backendUrl,
    database: prismaAdapter(prismaService, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      ...betterAuthCoreConfig.emailAndPassword,
      enabled: true,
      sendResetPassword: async ({ user, token }) => {
        try {
          const passwordResetUrl = `${config.frontendUrl}/${config.frontendResetPasswordUrl}?token=${token}`;
          const html = await renderEmail(ResetPassword, {
            username: user.name,
            url: passwordResetUrl,
          });
          await emailProvider.sendEmail(user.email, 'Obnova hesla', html);
        } catch (error) {
          if (error instanceof EmailDeliveryError) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Zkuste to znovu',
              cause: error,
            });
          }
          throw error;
        }
      },
    },
    user: {
      ...betterAuthCoreConfig.user,
      additionalFields: {
        ...betterAuthCoreConfig.user?.additionalFields,
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          input: false,
        },
      },
    },
    databaseHooks: {
      ...betterAuthCoreConfig.databaseHooks,
      user: {
        ...betterAuthCoreConfig.databaseHooks?.user,
        delete: {
          before: async (user, ctx) => {
            if (betterAuthCoreConfig.databaseHooks?.user?.delete?.before) {
              await betterAuthCoreConfig.databaseHooks.user.delete.before(
                user,
                ctx,
              );
            }
            try {
              const dogs = await prismaService.dog.findMany({
                where: { ownerId: user.id, photoUrl: { not: null } },
                select: { photoUrl: true },
              });
              await deleteDogPhotoFiles(dogs.map((d) => d.photoUrl));
            } catch (err) {
              console.error(
                'Chyba při mazání fotek psů při smazání účtu:',
                err,
              );
            }
          },
        },
      },
    },
    trustedOrigins: [config.frontendUrl],
    emailVerification: {
      ...betterAuthCoreConfig.emailVerification,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const html = await renderEmail(VerifyEmail, { url });
          await emailProvider.sendEmail(user.email, 'Ověření e-mailu', html);
        } catch (error) {
          if (error instanceof EmailDeliveryError) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Zkuste to znovu',
              cause: error,
            });
          }
          throw error;
        }
      },
      sendOnSignUp: true,
    },
    plugins: [...(betterAuthCoreConfig.plugins ?? [])],
  });

export type BetterAuth = ReturnType<typeof createAuth>;

export const betterAuthProvider: Provider = {
  provide: 'BetterAuth',
  useFactory: (
    prismaService: PrismaService,
    config: Config,
    emailProvider: EmailService,
  ) => createAuth(prismaService, config, emailProvider),
  inject: [PrismaService, Config, 'EmailService'],
};

export const InjectBetterAuth = Inject('BetterAuth');
