import { Tweet } from './tweet';

export enum MessageType {
  BOOKMARK_DETECTED = 'BOOKMARK_DETECTED',
  SYNC_STATUS_REQUEST = 'SYNC_STATUS_REQUEST',
  SYNC_STATUS_RESPONSE = 'SYNC_STATUS_RESPONSE',
  TRIGGER_MANUAL_SYNC = 'TRIGGER_MANUAL_SYNC',
  SYNC_PROGRESS = 'SYNC_PROGRESS',
  VALIDATE_TOKEN = 'VALIDATE_TOKEN',
  START_BULK_SYNC = 'START_BULK_SYNC',
  BULK_SYNC_PROGRESS = 'BULK_SYNC_PROGRESS',
}

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
}

export interface BookmarkDetectedPayload {
  tweet: Tweet;
}

export interface SyncStatusPayload {
  syncEnabled: boolean;
  lastSyncTime?: number;
  totalSynced: number;
  lastError?: string;
  isProcessing: boolean;
}

export interface SyncProgressPayload {
  current: number;
  total: number;
  status: 'syncing' | 'completed' | 'error';
}
