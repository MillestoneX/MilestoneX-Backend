/**
 * Response envelope helper.
 * Provides a consistent top-level response shape { success, data, message, meta }.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Wrap a payload into a standard success response envelope.
 *
 * @param data    The response payload
 * @param message Optional human-readable message
 * @param meta    Optional metadata (e.g. pagination info)
 */
export function ok<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>,
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message !== undefined ? { message } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };
}

/**
 * Wrap a created resource into a success response.
 * Semantically identical to ok() but communicates intent at the call site.
 */
export function created<T>(data: T, message = 'Resource created'): ApiResponse<T> {
  return ok(data, message);
}
