import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatRelativeTime, formatDateTime } from '../src/shared/utils/date-formatter';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to a fixed time for consistent testing
    vi.setSystemTime(new Date('2026-01-04T12:00:00.000Z'));
  });

  it('should return "Never" for undefined timestamp', () => {
    expect(formatRelativeTime(undefined)).toBe('Never');
  });

  it('should return "Just now" for timestamps less than a minute ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('Just now');
    expect(formatRelativeTime(now - 30000)).toBe('Just now'); // 30 seconds ago
    expect(formatRelativeTime(now - 59999)).toBe('Just now'); // 59.999 seconds ago
  });

  it('should return minutes for timestamps less than an hour ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60000)).toBe('1 minute ago'); // 1 minute
    expect(formatRelativeTime(now - 120000)).toBe('2 minutes ago'); // 2 minutes
    expect(formatRelativeTime(now - 1800000)).toBe('30 minutes ago'); // 30 minutes
    expect(formatRelativeTime(now - 3599999)).toBe('59 minutes ago'); // 59.999 minutes
  });

  it('should return hours for timestamps less than a day ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 3600000)).toBe('1 hour ago'); // 1 hour
    expect(formatRelativeTime(now - 7200000)).toBe('2 hours ago'); // 2 hours
    expect(formatRelativeTime(now - 43200000)).toBe('12 hours ago'); // 12 hours
    expect(formatRelativeTime(now - 86399999)).toBe('23 hours ago'); // 23.999 hours
  });

  it('should return days for timestamps less than a week ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 86400000)).toBe('1 day ago'); // 1 day
    expect(formatRelativeTime(now - 172800000)).toBe('2 days ago'); // 2 days
    expect(formatRelativeTime(now - 604799999)).toBe('6 days ago'); // 6.999 days
  });

  it('should return formatted date for timestamps over a week ago', () => {
    const now = Date.now();
    const weekAgo = now - 604800000; // 7 days
    const result = formatRelativeTime(weekAgo);
    // Should be a locale date string, not relative time
    expect(result).not.toContain('ago');
    expect(result).toMatch(/\d/); // Contains numbers
  });
});

describe('formatDateTime', () => {
  it('should return "Never" for undefined timestamp', () => {
    expect(formatDateTime(undefined)).toBe('Never');
  });

  it('should return formatted date and time for valid timestamp', () => {
    const timestamp = new Date('2026-01-04T12:00:00.000Z').getTime();
    const result = formatDateTime(timestamp);
    // Should contain date and time components
    expect(result).toMatch(/\d/); // Contains numbers
    // The exact format depends on locale, so we just check it's not "Never"
    expect(result).not.toBe('Never');
  });
});
