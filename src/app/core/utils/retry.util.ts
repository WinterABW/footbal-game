/**
 * Retry utility with exponential backoff for API calls.
 *
 * Strategy:
 * - Max 3 attempts (1 initial + 2 retries)
 * - Exponential backoff: 500ms → 1000ms between retries
 * - Random jitter (0-30% of base delay) to prevent thundering herd
 * - Non-retryable errors (400, 401, 403, 404, 422) throw immediately
 * - Retryable errors: 5xx server errors, 429 rate limits, network failures
 *
 * Usage:
 *   const result = await withRetry(() => this.http.get(url).toPromise(), {
 *     maxAttempts: 3,
 *     baseDelayMs: 500,
 *   });
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first one). Default: 3 */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff. Default: 500 */
  baseDelayMs?: number;
  /** HTTP status codes that should NOT be retried (client errors). Default: [400, 401, 403, 404, 422] */
  nonRetryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  nonRetryableStatuses: [400, 401, 403, 404, 422],
};

/**
 * Determines if an error is retryable based on HTTP status.
 * Only server errors (5xx) and network errors should be retried.
 */
function isRetryableError(error: unknown, nonRetryable: number[]): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // Don't retry client errors
    if (nonRetryable.includes(status)) return false;
    // Retry server errors (5xx) and rate limits (429)
    if (status >= 500 || status === 429) return true;
    return false;
  }
  // Network errors, timeouts → retry
  return true;
}

/**
 * Sleeps for the given milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async operation with retry logic and exponential backoff.
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns The result of the operation
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry if it's a non-retryable error
      if (!isRetryableError(error, opts.nonRetryableStatuses)) {
        throw error;
      }

      // Don't sleep after the last attempt
      if (attempt < opts.maxAttempts) {
        // Exponential backoff: baseDelay * 2^(attempt-1) + jitter
        const delay = opts.baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * opts.baseDelayMs * 0.3;
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError;
}
