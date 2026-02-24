import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Rejects structurally malformed Bearer tokens before they reach the guard.
 * Signature and expiry validation remain with JwtStrategy via passport-jwt.
 */
@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return next(); // no token — guard decides (@Public or 401)

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header must use Bearer scheme.',
      );
    }

    const parts = authHeader.slice(7).split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException(
        'Malformed JWT: must have three segments.',
      );
    }

    next();
  }
}
