import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/auth.interface';

/**
 * Extracts the authenticated user payload from the request.
 * Returns the full JwtPayload or a specific field.
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 * @Get('id')
 * getId(@CurrentUser('sub') id: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);