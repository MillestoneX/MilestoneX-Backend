/**
 * The normalized identity attached to `request.user` after authentication.
 *
 * Both JWT and API-key authentication write this shape so downstream guards
 * (`RolesGuard`, `AdminGuard`) and controllers can read `role`,
 * `walletAddress`, and `sub` uniformly regardless of which credential type
 * authenticated the request.
 */
export type AuthMethod = 'jwt' | 'apiKey';

export interface AuthenticatedUser {
  /** Canonical user UUID (the JWT subject). */
  sub: string;
  /** Alias of `sub` — the canonical field used by newer code paths. */
  userId: string;
  walletAddress: string;
  role: string;
  /** Which credential authenticated this request. */
  authMethod: AuthMethod;
  /** Set only when `authMethod === 'apiKey'`. */
  apiKeyId?: string;
  /** Set only when `authMethod === 'apiKey'`. The key's scope (e.g. `read`). */
  scope?: string;
}
