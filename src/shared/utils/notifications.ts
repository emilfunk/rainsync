import { MessageType } from '../types/messages';

/**
 * Show a notification using Chrome notifications API
 * Content scripts have no access to chrome.notifications, so there the
 * request is forwarded to the background service worker.
 */
export async function showNotification(title: string, message: string): Promise<void> {
  try {
    if (!chrome.notifications) {
      await chrome.runtime.sendMessage({
        type: MessageType.SHOW_NOTIFICATION,
        payload: { title, message },
      });
      return;
    }

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: title,
      message: message,
      priority: 1,
    });
  } catch {
    // Fallback: log to console if notifications fail
    console.log(`[RainSync] ${title}: ${message}`);
  }
}

/**
 * Show a notification for successful bookmark sync
 */
export async function showBookmarkSyncedNotification(count: number = 1): Promise<void> {
  await showNotification(
    'RainSync',
    `${count} bookmark${count === 1 ? '' : 's'} synced to Raindrop.io`
  );
}

/**
 * Show a notification for bulk sync completion
 */
export async function showBulkSyncCompleteNotification(
  total: number,
  synced: number,
  errors: number
): Promise<void> {
  await showNotification(
    'Bulk Sync Complete',
    `Found ${total} bookmarks. Synced: ${synced}, Errors: ${errors}`
  );
}
