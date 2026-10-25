import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InvitationRateLimitGuard implements CanActivate {
  private static readonly attempts = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60 * 1000;
  private static readonly MAX_REQUESTS = 15;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const timestamps = InvitationRateLimitGuard.attempts.get(ip) ?? [];
    const recent = timestamps.filter(
      (t) => now - t < InvitationRateLimitGuard.WINDOW_MS,
    );

    if (recent.length >= InvitationRateLimitGuard.MAX_REQUESTS) {
      throw new HttpException(
        'Příliš mnoho pokusů o ověření kódu. Zkuste to prosím za chvíli.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    InvitationRateLimitGuard.attempts.set(ip, recent);
    return true;
  }
}
