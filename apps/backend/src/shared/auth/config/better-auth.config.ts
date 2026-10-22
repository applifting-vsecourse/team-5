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
  user: {
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
