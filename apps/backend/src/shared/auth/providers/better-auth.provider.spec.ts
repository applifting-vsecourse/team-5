import { EmailDeliveryError } from '@/core/email/errors/email-delivery.error';
import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Config } from '@/shared/config/config.service';
import { APIError } from 'better-auth';
import { betterAuthProvider } from './better-auth.provider';

interface CapturedConfig {
  emailVerification?: {
    sendVerificationEmail?: (
      data: { user: { id: string; email: string; name: string }; url: string },
      request?: unknown,
    ) => Promise<void>;
  };
  emailAndPassword?: {
    sendResetPassword?: (
      data: {
        user: { id: string; email: string; name: string };
        token: string;
      },
      request?: unknown,
    ) => Promise<void>;
  };
}

jest.mock('better-auth', () => {
  class MockAPIError extends Error {
    status: string;
    statusCode: number;
    body: unknown;
    constructor(status: string, body?: { message?: string; cause?: unknown }) {
      super(body?.message);
      this.name = 'APIError';
      this.status = status;
      this.statusCode = 500;
      this.body = body;
    }
  }

  return {
    betterAuth: jest.fn().mockImplementation((config: unknown) => {
      (
        globalThis as { __capturedBetterAuthConfig?: unknown }
      ).__capturedBetterAuthConfig = config;
      return { options: config };
    }),
    APIError: MockAPIError,
  };
});

jest.mock('better-auth/plugins', () => ({
  openAPI: jest.fn().mockReturnValue({}),
  username: jest.fn().mockReturnValue({}),
}));

jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn().mockReturnValue({}),
}));

jest.mock('@/core/email/render', () => ({
  renderEmail: jest.fn().mockResolvedValue('<p>Email body</p>'),
}));

describe('betterAuthProvider', () => {
  let mockEmailProvider: jest.Mocked<EmailService>;
  let mockPrisma: unknown;
  let mockConfig: unknown;

  const getCapturedConfig = (): CapturedConfig | undefined =>
    (globalThis as { __capturedBetterAuthConfig?: CapturedConfig })
      .__capturedBetterAuthConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    (
      globalThis as { __capturedBetterAuthConfig?: CapturedConfig }
    ).__capturedBetterAuthConfig = undefined;
    mockEmailProvider = {
      sendEmail: jest.fn(),
    };
    mockPrisma = {};
    mockConfig = {
      backendUrl: 'http://localhost:4050',
      frontendUrl: 'http://localhost:3050',
      frontendResetPasswordUrl: 'reset-password',
    };
  });

  it('translates EmailDeliveryError to APIError("INTERNAL_SERVER_ERROR", { message: "Zkuste to znovu" }) during verification email', async () => {
    mockEmailProvider.sendEmail.mockRejectedValue(
      new EmailDeliveryError('SMTP connection refused', {
        cause: new Error('ECONNREFUSED'),
      }),
    );

    const factory = (
      betterAuthProvider as { useFactory: (...args: unknown[]) => unknown }
    ).useFactory;
    factory(
      mockPrisma as PrismaService,
      mockConfig as Config,
      mockEmailProvider,
    );

    const captured = getCapturedConfig();
    const sendVerificationEmail =
      captured?.emailVerification?.sendVerificationEmail;
    expect(sendVerificationEmail).toBeDefined();

    let thrownError: unknown;
    try {
      await sendVerificationEmail?.({
        user: { id: '1', email: 'user@example.com', name: 'User' },
        url: 'http://verify',
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(APIError);
    expect((thrownError as Error).message).toBe('Zkuste to znovu');
  });

  it('translates EmailDeliveryError to APIError("INTERNAL_SERVER_ERROR", { message: "Zkuste to znovu" }) during password reset', async () => {
    mockEmailProvider.sendEmail.mockRejectedValue(
      new EmailDeliveryError('Resend delivery failed'),
    );

    const factory = (
      betterAuthProvider as { useFactory: (...args: unknown[]) => unknown }
    ).useFactory;
    factory(
      mockPrisma as PrismaService,
      mockConfig as Config,
      mockEmailProvider,
    );

    const captured = getCapturedConfig();
    const sendResetPassword = captured?.emailAndPassword?.sendResetPassword;
    expect(sendResetPassword).toBeDefined();

    let thrownError: unknown;
    try {
      await sendResetPassword?.({
        user: { id: '1', email: 'user@example.com', name: 'User' },
        token: 'xyz',
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(APIError);
    expect((thrownError as Error).message).toBe('Zkuste to znovu');
  });
});
