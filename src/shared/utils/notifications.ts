/**
 * Show a notification using Chrome notifications API
 * Works reliably across Chrome, Brave, Edge, etc.
 */
export async function showNotification(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="%231da1f2"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="64" font-family="Arial">R</text></svg>',
      title: title,
      message: message,
      priority: 1,
    });
  } catch (error) {
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

/**
 * Show extension reload notification
 */
export async function showExtensionReloadNotification(): Promise<void> {
  await showNotification(
    'RainSync Updated',
    'Please reload this page to continue syncing bookmarks.'
  );
}
