import { logger } from '../shared/utils/logger';
import { getStorage, setStorage } from '../shared/utils/storage';

logger.info('RainSync background service worker starting...');

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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.info('Received message', { type: message.type, sender: sender.tab?.url });
  // Message handling will be implemented in Phase 4
  sendResponse({ received: true });
  return true;
});

logger.info('RainSync background service worker initialized');
