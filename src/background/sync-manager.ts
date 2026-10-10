import { Tweet } from '../shared/types/tweet';
import { RaindropBookmark } from '../shared/types/raindrop';
import { QueuedBookmark } from '../shared/types/storage';
import { BookmarkSyncStatus } from '../shared/types/messages';
import { getStorage, setStorage, removeStorage } from '../shared/utils/storage';
import { logger } from '../shared/utils/logger';
import { formatErrorMessage } from '../shared/utils/error-formatter';
import { RATE_LIMIT_DELAY_MS } from '../shared/constants/api';
import { MAX_RETRY_ATTEMPTS } from '../shared/constants/retry';
import { RaindropApi } from './raindrop-api';
import { CollectionManager } from './collection-manager';
import { RetryHandler } from './retry-handler';

export type SyncResultListener = (
  item: QueuedBookmark,
  status: BookmarkSyncStatus,
  error?: string
) => void;

export class SyncManager {
  private queue: QueuedBookmark[] = [];
  private isProcessing = false;
  private retryHandler: RetryHandler;
  private resultListener?: SyncResultListener;

  constructor(
    private raindropApi: RaindropApi,
    private collectionManager: CollectionManager
  ) {
    this.retryHandler = new RetryHandler();
  }

  /**
   * Initialize the sync manager
   * Loads queue from storage and starts processing
   */
  async init(): Promise<void> {
    logger.info('Initializing SyncManager');

    // Load queue from storage
    const storedQueue = await getStorage('syncQueue');
    this.queue = storedQueue || [];

    logger.info('Queue loaded', { queueLength: this.queue.length });

    // Load token and set it
    const token = await getStorage('raindropToken');
    if (token) {
      this.raindropApi.setToken(token);
      logger.info('Raindrop token loaded');
    }

    // Process any pending items
    if (this.queue.length > 0) {
      logger.info('Processing pending queue items');
      this.processQueue();
    }
  }

  /**
   * Called when a bookmark is saved, found to be a duplicate, or given up on
   */
  onResult(listener: SyncResultListener): void {
    this.resultListener = listener;
  }

  /**
   * Add a tweet to the sync queue
   */
  async addToQueue(
    tweet: Tweet,
    customTag?: string,
    source: { tabId?: number; bulk?: boolean } = {}
  ): Promise<void> {
    logger.info('Adding tweet to queue', { id: tweet.id, author: tweet.author.handle, customTag });

    const queuedBookmark: QueuedBookmark = {
      tweet,
      addedAt: Date.now(),
      retryCount: 0,
      customTag,
      ...source,
    };

    this.queue.push(queuedBookmark);
    await this.saveQueue();

    logger.info('Tweet added to queue', { queueLength: this.queue.length });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Queue processing already in progress');
      return;
    }

    if (this.queue.length === 0) {
      logger.debug('Queue is empty, nothing to process');
      return;
    }

    this.isProcessing = true;
    logger.info('Starting queue processing', { queueLength: this.queue.length });

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        const status = await this.syncBookmark(item);

        // Success - remove from queue
        this.queue.shift();
        await this.saveQueue();

        // Update statistics
        const totalSynced = (await getStorage('totalSynced')) || 0;
        await setStorage('totalSynced', totalSynced + 1);
        await setStorage('lastSyncTime', Date.now());
        // set() skips undefined values, so the key has to be removed
        await removeStorage('lastError');

        this.resultListener?.(item, status);

        logger.info('Bookmark synced successfully', {
          url: item.tweet.url,
          totalSynced: totalSynced + 1,
        });
      } catch (error) {
        logger.error('Failed to sync bookmark', error as Error, { url: item.tweet.url });

        // Get user-friendly error message
        const userErrorMessage = formatErrorMessage(error);

        // Update retry count
        item.retryCount++;
        item.lastAttempt = Date.now();
        item.error = userErrorMessage;

        if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Max retries exceeded - remove from queue
          logger.error('Max retries exceeded, removing from queue', undefined, {
            url: item.tweet.url,
          });
          this.queue.shift();
          this.resultListener?.(item, 'failed', userErrorMessage);
        }

        await this.saveQueue();
        await setStorage('lastError', userErrorMessage);

        // If it's a rate limit error, pause processing
        if (this.retryHandler.isRateLimitError(error)) {
          logger.warn('Rate limit hit, pausing queue processing');
          break;
        }
      }

      // Rate limiting delay between requests
      if (this.queue.length > 0) {
        await this.sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    this.isProcessing = false;
    logger.info('Queue processing complete', { remainingItems: this.queue.length });
  }

  /**
   * Sync a single bookmark to Raindrop
   */
  private async syncBookmark(queuedBookmark: QueuedBookmark): Promise<'saved' | 'duplicate'> {
    const { tweet, customTag } = queuedBookmark;

    return this.retryHandler.executeWithRetry(async () => {
      // Ensure collection exists
      const collectionId = await this.collectionManager.ensureCollection();

      // Check for duplicates
      const isDuplicate = await this.raindropApi.checkDuplicate(tweet.url, collectionId);
      if (isDuplicate) {
        logger.info('Bookmark already exists in Raindrop, skipping', { url: tweet.url });
        return 'duplicate' as const;
      }

      // Convert tweet to Raindrop bookmark
      const raindropBookmark = this.convertTweetToRaindrop(tweet, collectionId, customTag);

      // Create bookmark
      await this.raindropApi.createBookmark(raindropBookmark);

      logger.info('Bookmark created in Raindrop', { url: tweet.url, customTag });
      return 'saved' as const;
    }, `sync bookmark ${tweet.url}`);
  }

  /**
   * Convert a Tweet to a RaindropBookmark
   */
  private convertTweetToRaindrop(tweet: Tweet, collectionId: number, customTag?: string): RaindropBookmark {
    // Title: First 100 chars or first line of tweet text
    let title = tweet.text.substring(0, 100).split('\n')[0] || `Post by ${tweet.author.handle}`;
    if (tweet.isDeleted) {
      title = `[DELETED] ${title}`;
    }

    // Tags: Simple, meaningful tags only
    const tags = ['twitter'];
    if (tweet.isDeleted) {
      tags.push('tweet-deleted');
    }
    if (tweet.isRetweet) {
      tags.push('retweet');
    }
    if (customTag) {
      tags.push(customTag);
    }

    // Excerpt/Notes: Full tweet text + quote tweet if applicable + metadata
    let excerpt = tweet.text || '(No text: photo or video only)';

    if (tweet.quotedTweet) {
      excerpt += `\n\nQuoted tweet from ${tweet.quotedTweet.author.handle}:\n${tweet.quotedTweet.text || '(No text)'}`;
    }

    excerpt += `\n\nAuthor: ${tweet.author.displayName} (${tweet.author.handle})`;
    excerpt += `\nBookmarked: ${new Date().toISOString()}`;

    if (tweet.isRetweet) {
      excerpt += '\nType: Retweet';
    }

    if (tweet.isDeleted) {
      excerpt += '\n\n⚠️ Note: This tweet was unavailable or deleted at the time of archiving.';
      excerpt += '\nThe content preserved here may be incomplete or represent a placeholder.';
    }

    return {
      link: tweet.url,
      title,
      excerpt,
      tags,
      collection: { $id: collectionId },
    };
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    await setStorage('syncQueue', this.queue);
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
