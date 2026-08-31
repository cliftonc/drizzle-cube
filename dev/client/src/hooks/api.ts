/**
 * Shared fetch helpers for the example app's own REST endpoints.
 *
 * The dev app's resources are tenant-scoped, so switching organisations makes
 * "not yours" an ordinary outcome rather than a fault — these helpers keep the
 * status around so callers can tell the two apart, and stop the query client
 * retrying an answer that will not change.
 */

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

/**
 * Retrying a 4xx cannot change the answer, and the default backoff turns an
 * immediate "not found" into a ~7 second wait.
 */
export function retryUnlessRequestFault(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 3
}

/** GET a `{ data }` envelope, raising an {@link ApiError} on a failed status. */
export async function getJson<T>(url: string, whatFailed: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new ApiError(`${whatFailed}: ${response.status}`, response.status)
  }
  return (await response.json()).data
}
