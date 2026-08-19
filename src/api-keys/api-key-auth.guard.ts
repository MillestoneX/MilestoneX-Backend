import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';
import { AuthenticatedUser } from './auth-user.interface';

/**
 * Composite authentication guard: accepts either a Bearer JWT or a valid
 * `X-API-Key` header and normalizes both to the shared {@link AuthenticatedUser}
 * shape on `request.user`.
 *
 * - `X-API-Key` present → API-key authentication (`ApiKeyGuard`).
 * - otherwise → JWT authentication (`JwtAuthGuard`), then the verified payload
 *   is normalized to add `userId` and `authMethod`.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser | Record<string, unknown> }
    >();

    const apiKey = request.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      return this.apiKeyGuard.canActivate(context);
    }

    const authenticated = this.jwtAuthGuard.canActivate(context);
    if (!authenticated) {
      return false;
    }

    const payload = request.user as Record<string, unknown>;
    const sub = payload['sub'];

    if (typeof sub !== 'string' || sub.length === 0) {
      throw new UnauthorizedException('Invalid token payload');
    }

    request.user = {
      ...payload,
      sub,
      userId: sub,
      authMethod: 'jwt',
    } as AuthenticatedUser;

    return true;
  }
}
