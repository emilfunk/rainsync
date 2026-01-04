/**
 * Format a timestamp as relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  // Format as date
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format a timestamp as a readable date and time
 */
export function formatDateTime(timestamp: number | undefined): string {
  if (!timestamp) {
    return 'Never';
  }

  return new Date(timestamp).toLocaleString();
}
