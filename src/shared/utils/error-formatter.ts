import { RaindropApiError, RateLimitError, AuthError, NetworkError } from '../types/raindrop';

/**
 * Convert technical errors to user-friendly messages
 */
export function formatErrorMessage(error: unknown): string {
  // Handle known error types
  if (error instanceof AuthError) {
    return 'Invalid Raindrop.io token. Please check your settings and update your token.';
  }

  if (error instanceof RateLimitError) {
    return 'Rate limit reached. Syncing will resume automatically in a moment.';
  }

  if (error instanceof NetworkError) {
    return 'Network connection error. Please check your internet connection.';
  }

  if (error instanceof RaindropApiError) {
    // Handle specific HTTP status codes
    switch (error.status) {
      case 400:
        return 'Invalid bookmark data. Please try again or contact support.';
      case 403:
        return 'Permission denied. Please check your Raindrop.io token permissions.';
      case 404:
        return 'Resource not found. The collection may have been deleted.';
      case 500:
      case 502:
      case 503:
        return 'Raindrop.io service is temporarily unavailable. Will retry automatically.';
      default:
        return `Raindrop.io error: ${error.message}`;
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network connection error. Please check your internet connection.';
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return 'Request timed out. Will retry automatically.';
    }

    // Generic error with message
    return `Error: ${error.message}`;
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is recoverable (should retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return false; // Authentication errors are permanent
  }

  if (error instanceof RaindropApiError && error.status === 400) {
    return false; // Bad request errors are permanent
  }

  // All other errors are potentially recoverable
  return true;
}

/**
 * Get retry delay based on error type (in milliseconds)
 */
export function getRetryDelay(error: unknown, attemptNumber: number): number {
  // Calculate exponential backoff: 1000ms * 2^attemptNumber
  // For attempts 0-4: 1000, 2000, 4000, 8000, 16000
  // For higher attempts, continue exponential growth
  const baseDelay = 1000 * Math.pow(2, attemptNumber);

  if (error instanceof RateLimitError) {
    // For rate limits, use longer delays (double the base delay)
    // Cap at 60 seconds to avoid excessively long waits
    return Math.min(60000, baseDelay * 2);
  }

  // Cap regular errors at 16 seconds
  return Math.min(16000, baseDelay);
}
