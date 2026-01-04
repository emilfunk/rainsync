import { Tweet } from './tweet';

export interface StorageSchema {
  // Authentication
  raindropToken?: string;

  // Sync Configuration
  syncEnabled: boolean;
  collectionId?: number;

  // Sync State
  lastSyncTime?: number; // Unix timestamp
  syncQueue: QueuedBookmark[];

  // Statistics
  totalSynced: number;
  lastError?: string;
}

export interface QueuedBookmark {
  tweet: Tweet;
  addedAt: number;
  retryCount: number;
  lastAttempt?: number;
  error?: string;
}
