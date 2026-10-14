import { PlatformType } from '../types/tweet';

export const RAINDROP_API_BASE = 'https://api.raindrop.io/rest/v1';
export const RAINDROP_COLLECTION_NAME = 'Twitter Bookmarks';

export const PLATFORM_COLLECTION_NAMES: Record<PlatformType, string> = {
  twitter: 'Twitter Bookmarks',
  youtube: 'YouTube Liked & Saved',
  instagram: 'Instagram Saved',
  linkedin: 'LinkedIn Saved',
};

export const RATE_LIMIT_PER_MINUTE = 120;
export const RATE_LIMIT_DELAY_MS = 500; // Delay between requests during bulk sync
