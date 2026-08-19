import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

/**
 * Route guard that enforces API-key scopes on endpoints annotated with
 * `@Scopes(...)`.
 *
 * Scope enforcement applies only to API-key-authenticated requests
 * (`authMethod === 'apiKey'`). JWT-authenticated requests are governed by the
 * existing role guards (`RolesGuard`, `AdminGuard`) and therefore always pass
 * this guard.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { authMethod?: string; scope?: string };
    }>();
    const user = request.user;

    // JWT users are fully authorized by their role, not an API-key scope.
    if (!user || user.authMethod !== 'apiKey') {
      return true;
    }

    if (!user.scope || !requiredScopes.includes(user.scope)) {
      throw new ForbiddenException(
        `API key scope '${user.scope ?? 'none'}' is not permitted for this endpoint`,
      );
    }

    return true;
  }
}
