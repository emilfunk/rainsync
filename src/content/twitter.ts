import { logger } from '../shared/utils/logger';
import { BookmarkDetector } from './bookmark-detector';
import { TweetExtractor } from './tweet-extractor';
import { TagInputModal } from './tag-input-modal';
import { MessageType, BookmarkSyncResultPayload } from '../shared/types/messages';
import { Tweet } from '../shared/types/tweet';
import { SELECTORS } from './dom-selectors';
import { showBulkSyncCompleteNotification } from '../shared/utils/notifications';
import { showPageToast } from './page-toast';

logger.info('RainSync content script loaded on', window.location.href);

class TwitterContentScript {
  private detector: BookmarkDetector;
  private extractor: TweetExtractor;
  private processedTweets = new Set<string>();

  constructor() {
    this.extractor = new TweetExtractor();
    this.detector = new BookmarkDetector(
      this.handleBookmark.bind(this),
      this.handleBookmarkRemoved.bind(this)
    );
  }

  /**
   * Initialize the content script
   */
  init(): void {
    logger.info('RainSync content script initializing');

    // Start bookmark detection
    this.detector.start();

    // Listen for bulk sync messages
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === MessageType.BOOKMARK_SYNC_RESULT) {
        this.showSyncResult(message.payload as BookmarkSyncResultPayload);
        return;
      }

      if (message.type === MessageType.START_BULK_SYNC) {
        logger.info('Bulk sync triggered');
        this.startBulkSync().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          logger.error('Bulk sync failed', error);
          sendResponse({ error: error.message });
        });
        return true; // Keep channel open for async response
      }
    });

    logger.info('RainSync content script initialized - watching for bookmarks');
  }

  /**
   * Start bulk sync on bookmarks page
   */
  private async startBulkSync(): Promise<void> {
    if (window.location.pathname !== '/i/bookmarks' && !window.location.pathname.startsWith('/i/history')) {
      logger.warn('Bulk sync can only run on bookmarks page');
      return;
    }

    logger.info('Starting bulk sync scraper');

    let scrollAttempts = 0;
    const MAX_SCROLL_ATTEMPTS = 10;
    let totalFound = 0;
    let totalSynced = 0;
    let totalErrors = 0;

    while (scrollAttempts < MAX_SCROLL_ATTEMPTS) {
      // Extract visible tweets
      const result = await this.extractVisibleTweets();
      totalFound += result.found;
      totalSynced += result.synced;
      totalErrors += result.errors;

      // If no new tweets found, increment attempts
      if (result.found === 0) {
        scrollAttempts++;
      } else {
        scrollAttempts = 0;
      }

      // Scroll down
      window.scrollTo(0, document.body.scrollHeight);

      // Wait for content to load
      await this.sleep(2000);

      // Check if reached bottom
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 100 && scrollAttempts >= 3) {
        break;
      }
    }

    showBulkSyncCompleteNotification(totalFound, totalSynced, totalErrors);

    logger.info('Bulk sync complete', {
      found: totalFound,
      synced: totalSynced,
      errors: totalErrors,
    });
  }

  /**
   * Extract all visible tweets
   */
  private async extractVisibleTweets(): Promise<{ found: number; synced: number; errors: number }> {
    const tweetElements = document.querySelectorAll(SELECTORS.TWEET_ARTICLE);
    let found = 0;
    let synced = 0;
    let errors = 0;

    for (const element of tweetElements) {
      const tweet = this.extractor.extractTweet(element);

      if (!tweet || this.processedTweets.has(tweet.id)) {
        continue;
      }

      this.processedTweets.add(tweet.id);
      found++;

      try {
        await this.sendToBackground(tweet, null, true);
        synced++;
      } catch (error) {
        logger.error('Failed to sync tweet', error as Error, { id: tweet.id });
        errors++;
      }
    }

    return { found, synced, errors };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle a bookmark action
   */
  private async handleBookmark(tweetElement: Element): Promise<void> {
    logger.info('Processing bookmarked tweet');

    // Extract tweet data
    const tweet = this.extractor.extractTweet(tweetElement);

    if (!tweet) {
      logger.warn('Failed to extract tweet data');
      showPageToast("RainSync couldn't read this tweet, so it wasn't saved.", 'error');
      return;
    }

    logger.info('Tweet extracted successfully', {
      id: tweet.id,
      author: tweet.author.handle,
      url: tweet.url,
    });

    // Show modal to get custom tag from user
    const modal = new TagInputModal();
    const customTag = await modal.show();

    logger.info('User provided tag', { customTag });

    // Send to background script
    try {
      await this.sendToBackground(tweet, customTag);
    } catch (error) {
      logger.error('Failed to send tweet to background', error as Error);
    }
  }

  /**
   * Send tweet data to background script
   */
  private async sendToBackground(tweet: Tweet, customTag?: string | null, bulk = false): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet,
          customTag: customTag || undefined,
          bulk,
        },
      });

      if (response?.error) {
        logger.error('Background script returned error', undefined, response.error);
        if (!bulk) {
          showPageToast(`Bookmark not saved: ${response.error}`, 'error');
        }
      } else {
        logger.info('Tweet sent to background successfully');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Handle extension context invalidated (extension was reloaded)
      if (errorMessage.includes('Extension context invalidated')) {
        logger.warn('Extension was reloaded. Please refresh this page to continue syncing.');
        // The extension can no longer be reached, so show the hint in the page itself
        showPageToast('RainSync was updated. Reload this page to continue syncing bookmarks.');
        return;
      }

      // Handle other errors
      throw error;
    }
  }


  /**
   * RainSync keeps removed bookmarks in Raindrop, so say so instead of staying silent
   */
  private handleBookmarkRemoved(): void {
    showPageToast("Removed from X bookmarks only. RainSync doesn't delete it from Raindrop.io.");
  }

  /**
   * Show the outcome of a bookmark sync
   */
  private showSyncResult(result: BookmarkSyncResultPayload): void {
    if (result.status === 'saved') {
      showPageToast('Saved to Raindrop.io');
    } else if (result.status === 'duplicate') {
      showPageToast('Already in Raindrop.io');
    } else {
      showPageToast(`Not saved to Raindrop.io: ${result.error ?? 'unknown error'}`, 'error');
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.detector.stop();
    logger.info('Content script cleaned up');
  }
}

// Initialize
let contentScript: TwitterContentScript | null = null;

function init() {
  contentScript = new TwitterContentScript();
  contentScript.init();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  contentScript?.cleanup();
});
