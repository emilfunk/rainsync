import { Tweet } from './tweet';

export interface BulkSyncStatus {
  isRunning: boolean;
  total: number;
  synced: number;
  errors: number;
  status: string;
}

export interface StorageSchema {
  // Authentication
  raindropToken?: string;

  // Sync Configuration
  syncEnabled: boolean;
  collectionId?: number;

  // Sync State
  lastSyncTime?: number; // Unix timestamp
  syncQueue: QueuedBookmark[];

  // Bulk Sync
  bulkSyncInProgress?: boolean;
  bulkSyncStatus?: BulkSyncStatus;

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
