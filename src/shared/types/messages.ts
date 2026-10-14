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
  SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',
  BOOKMARK_SYNC_RESULT = 'BOOKMARK_SYNC_RESULT',
  CAPTURE_COOKIES_REQUEST = 'CAPTURE_COOKIES_REQUEST',
  GET_COOKIES_REQUEST = 'GET_COOKIES_REQUEST',
}

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface ShowNotificationPayload {
  title: string;
  message: string;
}

export interface BookmarkDetectedPayload {
  tweet: Tweet;
  customTag?: string;
  // Part of a bulk sync, which reports once at the end instead of per bookmark
  bulk?: boolean;
}

export type BookmarkSyncStatus = 'saved' | 'duplicate' | 'failed';

export interface BookmarkSyncResultPayload {
  status: BookmarkSyncStatus;
  error?: string;
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
