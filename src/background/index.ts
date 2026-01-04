import { logger } from '../shared/utils/logger';
import { getStorage, setStorage } from '../shared/utils/storage';
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
      error: (error as Error).message || 'Failed to validate token'
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
      logger.warn('Raindrop token not configured');
      await setStorage('lastError', 'Raindrop token not configured');
      return { success: false, error: 'Token not configured' };
    }

    // Add to sync queue
    await syncManager.addToQueue(tweet);

    logger.info('Bookmark queued for sync', { id: tweet.id, author: tweet.author.handle });
    return { success: true };
  } catch (error) {
    logger.error('Error handling bookmark', error as Error);
    return { success: false, error: (error as Error).message };
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

logger.info('RainSync background service worker initialized');
