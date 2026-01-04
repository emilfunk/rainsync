import { describe, it, expect } from 'vitest';
import { formatErrorMessage, isRecoverableError, getRetryDelay } from '../src/shared/utils/error-formatter';
import { AuthError, RateLimitError, NetworkError, RaindropApiError } from '../src/shared/types/raindrop';

describe('formatErrorMessage', () => {
  it('should format AuthError with user-friendly message', () => {
    const error = new AuthError('Invalid credentials');
    const message = formatErrorMessage(error);
    expect(message).toBe('Invalid Raindrop.io token. Please check your settings and update your token.');
  });

  it('should format RateLimitError with user-friendly message', () => {
    const error = new RateLimitError('Too many requests');
    const message = formatErrorMessage(error);
    expect(message).toBe('Rate limit reached. Syncing will resume automatically in a moment.');
  });

  it('should format NetworkError with user-friendly message', () => {
    const error = new NetworkError('Failed to fetch');
    const message = formatErrorMessage(error);
    expect(message).toBe('Network connection error. Please check your internet connection.');
  });

  it('should format 400 status as invalid data error', () => {
    const error = new RaindropApiError('Bad request', 400);
    const message = formatErrorMessage(error);
    expect(message).toBe('Invalid bookmark data. Please try again or contact support.');
  });

  it('should format 500 status as service unavailable', () => {
    const error = new RaindropApiError('Internal server error', 500);
    const message = formatErrorMessage(error);
    expect(message).toBe('Raindrop.io service is temporarily unavailable. Will retry automatically.');
  });

  it('should handle generic Error with message', () => {
    const error = new Error('Something went wrong');
    const message = formatErrorMessage(error);
    expect(message).toBe('Error: Something went wrong');
  });

  it('should handle network errors from fetch', () => {
    const error = new Error('Failed to fetch');
    const message = formatErrorMessage(error);
    expect(message).toBe('Network connection error. Please check your internet connection.');
  });
});

describe('isRecoverableError', () => {
  it('should return false for AuthError', () => {
    const error = new AuthError('Invalid token');
    expect(isRecoverableError(error)).toBe(false);
  });

  it('should return false for 400 status errors', () => {
    const error = new RaindropApiError('Bad request', 400);
    expect(isRecoverableError(error)).toBe(false);
  });

  it('should return true for NetworkError', () => {
    const error = new NetworkError('Connection failed');
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should return true for RateLimitError', () => {
    const error = new RateLimitError('Too many requests');
    expect(isRecoverableError(error)).toBe(true);
  });

  it('should return true for 500 errors', () => {
    const error = new RaindropApiError('Server error', 500);
    expect(isRecoverableError(error)).toBe(true);
  });
});

describe('getRetryDelay', () => {
  it('should return exponential backoff delays', () => {
    const error = new Error('Generic error');
    expect(getRetryDelay(error, 0)).toBe(1000);
    expect(getRetryDelay(error, 1)).toBe(2000);
    expect(getRetryDelay(error, 2)).toBe(4000);
    expect(getRetryDelay(error, 3)).toBe(8000);
    expect(getRetryDelay(error, 4)).toBe(16000);
  });

  it('should return longer delays for rate limit errors', () => {
    const error = new RateLimitError('Rate limited');
    expect(getRetryDelay(error, 0)).toBe(2000); // 1000 * 2
    expect(getRetryDelay(error, 1)).toBe(4000); // 2000 * 2
    expect(getRetryDelay(error, 2)).toBe(8000); // 4000 * 2
  });

  it('should cap rate limit delay at 60 seconds', () => {
    const error = new RateLimitError('Rate limited');
    expect(getRetryDelay(error, 10)).toBe(60000);
  });
});
