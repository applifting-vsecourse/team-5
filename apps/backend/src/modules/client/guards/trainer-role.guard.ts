import { Identity } from '@/shared/auth/domain/identity';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Runs after AuthenticatedUserGuard, which stores the BetterAuth session on
// `request.session` (the same place the @User() decorator reads it from).
@Injectable()
export class TrainerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ session?: { user?: Identity } }>();
    const user = request.session?.user;
    if (!user || (user.role !== 'trainer' && user.role !== 'admin')) {
      throw new ForbiddenException('Pouze trenér má přístup ke správě klientů');
    }
    return true;
  }
}
