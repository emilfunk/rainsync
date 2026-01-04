import { logger } from '../shared/utils/logger';
import { getStorage, setStorage } from '../shared/utils/storage';
import { formatErrorMessage } from '../shared/utils/error-formatter';
import { MessageType, Message, BookmarkDetectedPayload } from '../shared/types/messages';
import { raindropApi } from './raindrop-api';
import { CollectionManager } from './collection-manager';
import { SyncManager } from './sync-manager';

logger.info('RainSync background service worker starting...');

// Initialize managers
const collectionManager = new CollectionManager(raindropApi);
const syncManager = new SyncManager(raindropApi, collectionManager);

// Initialize sync manager
(async () => {
  await syncManager.init();
  logger.info('SyncManager initialized');
})();

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  logger.info('Extension installed/updated');

  // Initialize default settings
  const syncEnabled = await getStorage('syncEnabled');
  if (syncEnabled === undefined) {
    await setStorage('syncEnabled', true);
    await setStorage('syncQueue', []);
    await setStorage('totalSynced', 0);
    logger.info('Initialized default settings');
  }
});

// Listen for messages from content scripts and UI
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  logger.info('Received message', { type: message.type, sender: sender.tab?.url });

  // Handle message asynchronously
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      logger.error('Error handling message', error);
      sendResponse({ error: error.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(message: Message, _sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case MessageType.VALIDATE_TOKEN:
      return handleValidateToken(message.payload);

    case MessageType.SYNC_STATUS_REQUEST:
      return handleSyncStatusRequest();

    case MessageType.BOOKMARK_DETECTED:
      return handleBookmarkDetected(message.payload);

    case MessageType.START_BULK_SYNC:
      return handleStartBulkSync();

    case MessageType.BULK_SYNC_PROGRESS:
      return handleBulkSyncProgress();

    default:
      logger.warn('Unknown message type', { type: message.type });
      return { error: 'Unknown message type' };
  }
}

async function handleValidateToken(payload: { token: string }) {
  try {
    const isValid = await raindropApi.authenticate(payload.token);

    if (isValid) {
      // Set the token in storage
      await setStorage('raindropToken', payload.token);
      logger.info('Token validated and saved');
      return { valid: true };
    } else {
      return { valid: false, error: 'Invalid token' };
    }
  } catch (error) {
    logger.error('Token validation failed', error as Error);
    return {
      valid: false,
      error: formatErrorMessage(error)
    };
  }
}

async function handleBookmarkDetected(payload: BookmarkDetectedPayload) {
  try {
    const { tweet } = payload;

    // Check if sync is enabled
    const syncEnabled = await getStorage('syncEnabled');
    if (!syncEnabled) {
      logger.info('Sync is disabled, ignoring bookmark');
      return { success: false, reason: 'Sync disabled' };
    }

    // Check if token is configured
    const token = await getStorage('raindropToken');
    if (!token) {
      const errorMsg = 'Raindrop token not configured. Please add your token in Settings.';
      logger.warn('Raindrop token not configured');
      await setStorage('lastError', errorMsg);
      return { success: false, error: errorMsg };
    }

    // Add to sync queue
    await syncManager.addToQueue(tweet);

    logger.info('Bookmark queued for sync', { id: tweet.id, author: tweet.author.handle });
    return { success: true };
  } catch (error) {
    logger.error('Error handling bookmark', error as Error);
    const errorMsg = formatErrorMessage(error);
    await setStorage('lastError', errorMsg);
    return { success: false, error: errorMsg };
  }
}

async function handleSyncStatusRequest() {
  const syncEnabled = await getStorage('syncEnabled');
  const lastSyncTime = await getStorage('lastSyncTime');
  const totalSynced = await getStorage('totalSynced');
  const lastError = await getStorage('lastError');
  const queueStatus = syncManager.getQueueStatus();

  return {
    syncEnabled,
    lastSyncTime,
    totalSynced,
    lastError,
    isProcessing: queueStatus.isProcessing,
    queueLength: queueStatus.length,
  };
}

async function handleStartBulkSync() {
  try {
    // Check if token is configured
    const token = await getStorage('raindropToken');
    if (!token) {
      return { error: 'Raindrop token not configured. Please add your token in Settings.' };
    }

    // Check if sync is enabled
    const syncEnabled = await getStorage('syncEnabled');
    if (!syncEnabled) {
      return { error: 'Sync is disabled. Please enable it in settings first.' };
    }

    logger.info('Starting bulk sync - opening bookmarks page');

    // Open Twitter bookmarks page
    const bookmarksUrl = 'https://twitter.com/i/bookmarks';
    const tab = await chrome.tabs.create({ url: bookmarksUrl });

    // Set bulk sync status
    await setStorage('bulkSyncInProgress', true);
    await setStorage('bulkSyncStatus', {
      isRunning: true,
      total: 0,
      synced: 0,
      errors: 0,
      status: 'Loading bookmarks page and starting automatic sync...',
    });

    // Wait for the tab to load, then send message to start scraping
    if (tab.id) {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          // Send message to start bulk sync
          chrome.tabs.sendMessage(tabId, {
            type: MessageType.START_BULK_SYNC,
          }).catch((error) => {
            logger.error('Failed to send bulk sync message to tab', error);
          });
        }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to start bulk sync', error as Error);
    return { error: formatErrorMessage(error) };
  }
}

async function handleBulkSyncProgress() {
  const bulkSyncStatus = await getStorage('bulkSyncStatus');
  const queueStatus = syncManager.getQueueStatus();

  if (!bulkSyncStatus) {
    return {
      isRunning: false,
      total: 0,
      synced: 0,
      errors: 0,
      status: '',
    };
  }

  // Update synced count from storage
  const totalSynced = await getStorage('totalSynced') || 0;

  return {
    ...bulkSyncStatus,
    synced: totalSynced,
    queueLength: queueStatus.length,
  };
}

logger.info('RainSync background service worker initialized');
