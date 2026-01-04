import { logger } from '../shared/utils/logger';
import { BookmarkDetector } from './bookmark-detector';
import { TweetExtractor } from './tweet-extractor';
import { MessageType } from '../shared/types/messages';
import { Tweet } from '../shared/types/tweet';

logger.info('RainSync content script loaded on', window.location.href);

class TwitterContentScript {
  private detector: BookmarkDetector;
  private extractor: TweetExtractor;

  constructor() {
    this.extractor = new TweetExtractor();
    this.detector = new BookmarkDetector(this.handleBookmark.bind(this));
  }

  /**
   * Initialize the content script
   */
  init(): void {
    logger.info('RainSync content script initializing');

    // Start bookmark detection
    this.detector.start();

    logger.info('RainSync content script initialized - watching for bookmarks');
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
      return;
    }

    logger.info('Tweet extracted successfully', {
      id: tweet.id,
      author: tweet.author.handle,
      url: tweet.url,
    });

    // Send to background script
    try {
      await this.sendToBackground(tweet);
    } catch (error) {
      logger.error('Failed to send tweet to background', error as Error);
    }
  }

  /**
   * Send tweet data to background script
   */
  private async sendToBackground(tweet: Tweet): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.BOOKMARK_DETECTED,
        payload: { tweet },
      });

      if (response?.error) {
        logger.error('Background script returned error', undefined, response.error);
      } else {
        logger.info('Tweet sent to background successfully');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Handle extension context invalidated (extension was reloaded)
      if (errorMessage.includes('Extension context invalidated')) {
        logger.warn('Extension was reloaded. Please refresh this page to continue syncing.');
        this.showReloadNotification();
        return;
      }

      // Handle other errors
      throw error;
    }
  }

  /**
   * Show a notification to reload the page
   */
  private showReloadNotification(): void {
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1da1f2;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      cursor: pointer;
    `;
    notification.innerHTML = `
      <strong>RainSync Updated</strong>
      <p style="margin: 8px 0 0 0;">Please reload this page to continue syncing bookmarks.</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.9;">Click to dismiss</p>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-dismiss after 10 seconds
    const dismissTimeout = setTimeout(() => {
      notification.remove();
    }, 10000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      clearTimeout(dismissTimeout);
      notification.remove();
    });
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
