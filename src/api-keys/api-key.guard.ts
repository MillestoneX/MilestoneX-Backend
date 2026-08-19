import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './auth-user.interface';

/**
 * Authenticates requests using API keys (`X-API-Key: sk_...`) for programmatic
 * access and normalizes the resolved identity onto `request.user`.
 *
 * The resolved user shares the same shape as JWT authentication
 * (`sub`/`userId`/`walletAddress`/`role`) plus `authMethod: 'apiKey'` and the
 * key's `apiKeyId`/`scope`, so downstream guards and controllers behave
 * identically for both credential types.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser }
    >();

    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: { select: { id: true, walletAddress: true, role: true } },
      },
    });

    if (!record || !record.isActive) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request.user = {
      sub: record.user.id,
      userId: record.user.id,
      walletAddress: record.user.walletAddress,
      role: record.user.role,
      authMethod: 'apiKey',
      apiKeyId: record.id,
      scope: record.scope,
    };

    return true;
  }
}
