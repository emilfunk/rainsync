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
    const response = await chrome.runtime.sendMessage({
      type: MessageType.BOOKMARK_DETECTED,
      payload: { tweet },
    });

    if (response?.error) {
      logger.error('Background script returned error', undefined, response.error);
    } else {
      logger.info('Tweet sent to background successfully');
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
