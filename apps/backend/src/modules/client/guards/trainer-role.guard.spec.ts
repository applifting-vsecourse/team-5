import { Identity } from '@/shared/auth/domain/identity';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TrainerRoleGuard } from './trainer-role.guard';

// The guard runs after AuthenticatedUserGuard, which puts the session on
// `request.session` (not `request.user`).
const contextWith = (request: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const sessionFor = (role: string): { session: { user: Identity } } => ({
  session: { user: new Identity('u1', 'u1@example.com', 'Jana', role) },
});

describe('TrainerRoleGuard', () => {
  const guard = new TrainerRoleGuard();

  it('lets a trainer through', () => {
    expect(guard.canActivate(contextWith(sessionFor('trainer')))).toBe(true);
  });

  it('lets an admin through', () => {
    expect(guard.canActivate(contextWith(sessionFor('admin')))).toBe(true);
  });

  it('rejects an owner (role user) with 403', () => {
    expect(() => guard.canActivate(contextWith(sessionFor('user')))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request without a session', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      ForbiddenException,
    );
  });

  it('does not trust request.user, only the session set by AuthenticatedUserGuard', () => {
    const request = {
      user: new Identity('u1', 'u1@example.com', 'Jana', 'trainer'),
    };

    expect(() => guard.canActivate(contextWith(request))).toThrow(
      ForbiddenException,
    );
  });
});
