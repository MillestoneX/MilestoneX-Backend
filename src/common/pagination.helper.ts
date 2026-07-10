/**
 * Pagination helper utilities.
 * Provides reusable types and functions for paginated responses across the API.
 */

/** Standard paginated response envelope */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  /** Total number of pages */
  pages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/** Input parameters for building paginated queries */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Calculate the number of records to skip for a given page/limit combo.
 * @param page  1-based page number
 * @param limit number of items per page
 */
export function calcSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

/**
 * Wrap a data array and total count into a standard paginated result.
 *
 * @param data    The records for the current page
 * @param total   Total number of matching records across all pages
 * @param page    Current 1-based page number
 * @param limit   Number of items per page
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const pages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    data,
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}
