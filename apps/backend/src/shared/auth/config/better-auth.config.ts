import { APIError, createAuthMiddleware } from 'better-auth/api';
import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth/types';
import {
  RegistrationValidationError,
  validateRegistration,
} from './registration-validation';

export const betterAuthCoreConfig: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
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
  plugins: [openAPI(), username()],
};
