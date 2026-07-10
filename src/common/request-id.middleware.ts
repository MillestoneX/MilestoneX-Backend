import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware that attaches a unique request ID to every incoming HTTP request.
 *
 * - Reads `x-request-id` from the incoming headers if present (allows upstream
 *   proxies / API gateways to propagate a trace ID).
 * - Falls back to a freshly generated UUID v4.
 * - Sets the resolved ID on both `req.id` (for downstream handlers) and the
 *   `x-request-id` response header (for client-side correlation).
 *
 * Usage: register in AppModule or a specific module's middleware consumer.
 *
 * @example
 * // app.module.ts
 * export class AppModule implements NestMiddleware {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(RequestIdMiddleware).forRoutes('*');
 *   }
 * }
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const incomingId = req.headers['x-request-id'];
    const requestId =
      typeof incomingId === 'string' && incomingId.trim()
        ? incomingId.trim()
        : randomUUID();

    // Attach to request object so controllers/services can access it
    req.id = requestId;

    // Echo the ID in the response so clients can correlate logs
    res.setHeader('x-request-id', requestId);

    this.logger.debug(`[${requestId}] ${req.method} ${req.url}`);

    next();
  }
}
