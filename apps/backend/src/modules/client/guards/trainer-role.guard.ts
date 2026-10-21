import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Identity } from '@/shared/auth/domain/identity';

@Injectable()
export class TrainerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: Identity }>();
    const user = request.user;
    if (!user || (user.role !== 'trainer' && user.role !== 'admin')) {
      throw new ForbiddenException('Pouze trenér má přístup ke správě klientů');
    }
    return true;
  }
}
