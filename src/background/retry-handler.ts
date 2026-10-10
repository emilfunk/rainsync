import { logger } from '../shared/utils/logger';
import { RETRY_DELAYS, MAX_RETRY_ATTEMPTS } from '../shared/constants/retry';
import { RaindropApiError, RateLimitError, AuthError } from '../shared/types/raindrop';

export class RetryHandler {
  /**
   * Execute an operation with exponential backoff retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry permanent failures
        if (this.isPermanentError(error)) {
          logger.error(`Permanent error in ${context}, not retrying`, error as Error);
          throw error;
        }

        // Exponential backoff
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          const delay = RETRY_DELAYS[attempt];
          logger.warn(
            `Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} for ${context}`,
            {
              delay,
              error: (error as Error).message,
            }
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    logger.error(`Max retries (${MAX_RETRY_ATTEMPTS}) exceeded for ${context}`, lastError!);
    throw lastError;
  }

  /**
   * Check if an error is permanent and should not be retried
   */
  private isPermanentError(error: unknown): boolean {
    // Authentication errors - don't retry
    if (error instanceof AuthError) {
      return true;
    }

    // Invalid data errors - don't retry
    if (error instanceof RaindropApiError && error.status === 400) {
      return true;
    }

    // All other errors are potentially transient
    return false;
  }

  /**
   * Check if an error is a rate limit error
   */
  isRateLimitError(error: unknown): boolean {
    return error instanceof RateLimitError;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
