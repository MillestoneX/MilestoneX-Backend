import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route or controller as publicly accessible — no JWT required.
 *
 * @example
 * @Public()
 * @Post('login')
 * login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);