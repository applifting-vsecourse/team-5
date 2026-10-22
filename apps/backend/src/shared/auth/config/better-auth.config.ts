import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
} from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth/types';
import {
  RegistrationValidationError,
  validateRegistration,
} from './registration-validation';

const resetPasswordTokenVerifierPlugin = {
  id: 'reset-password-token-verifier',
  endpoints: {
    verifyResetPasswordToken: createAuthEndpoint(
      '/verify-reset-password-token',
      { method: 'GET' },
      async (ctx) => {
        const token = ctx.query?.token;
        if (!token || typeof token !== 'string') {
          return ctx.json({ valid: false });
        }
        const verification =
          await ctx.context.internalAdapter.findVerificationValue(
            `reset-password:${token}`,
          );
        if (!verification || verification.expiresAt < new Date()) {
          return ctx.json({ valid: false });
        }
        return ctx.json({ valid: true });
      },
    ),
  },
};

export const betterAuthCoreConfig: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // BetterAuth otherwise permits a fresh session to delete without a
      // password. This product always requires password confirmation (#88).
      if (ctx.path === '/delete-user/callback') {
        throw new APIError('BAD_REQUEST', {
          code: 'PASSWORD_REQUIRED',
          message: 'Smazání účtu potvrďte heslem v nastavení účtu.',
        });
      }
      if (ctx.path === '/delete-user') {
        if (
          typeof ctx.body?.password !== 'string' ||
          !ctx.body.password.length
        ) {
          throw new APIError('BAD_REQUEST', {
            code: 'PASSWORD_REQUIRED',
            message: 'Pro smazání účtu zadejte heslo.',
          });
        }
        // Password verification and session/credential removal stay in BetterAuth.
        return;
      }
      if (ctx.path === '/reset-password') {
        const token = ctx.body?.token;
        if (typeof token === 'string') {
          const verification =
            await ctx.context.internalAdapter.findVerificationValue(
              `reset-password:${token}`,
            );
          if (verification && verification.expiresAt >= new Date()) {
            (ctx.context as Record<string, unknown>).resetPasswordUserId =
              verification.value;
          }
        }
        return;
      }
      if (ctx.path !== '/sign-up/email') return;
      try {
        const name = validateRegistration(ctx.body ?? {});
        return { context: { body: { ...ctx.body, name } } };
      } catch (error) {
        if (error instanceof RegistrationValidationError) {
          throw new APIError('BAD_REQUEST', {
            code: error.code,
            message: error.message,
          });
        }
        throw error;
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/reset-password') {
        const userId = (ctx.context as Record<string, unknown>)
          .resetPasswordUserId;
        if (typeof userId === 'string') {
          const user = await ctx.context.internalAdapter.findUserById(userId);
          if (user) {
            const session = await ctx.context.internalAdapter.createSession(
              userId,
              false,
            );
            await setSessionCookie(ctx, { session, user }, false);
            return ctx.json({ status: true, session, user });
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path !== '/sign-up/email') return;
          // Only registration can select a trainer account. The role field
          // remains server-owned, including on BetterAuth's update-user API.
          return {
            data: {
              ...user,
              role: ctx.body?.isTrainer === true ? 'trainer' : 'user',
            },
          };
        },
      },
    },
  },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  plugins: [openAPI(), username(), resetPasswordTokenVerifierPlugin],
};
