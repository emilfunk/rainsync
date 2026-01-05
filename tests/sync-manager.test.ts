import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncManager } from '../src/background/sync-manager';
import { RaindropApi } from '../src/background/raindrop-api';
import { CollectionManager } from '../src/background/collection-manager';
import { Tweet } from '../src/shared/types/tweet';

// Mock the storage module
vi.mock('../src/shared/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
}));

// Mock the logger module
vi.mock('../src/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the notifications module
vi.mock('../src/shared/utils/notifications', () => ({
  showBookmarkSyncedNotification: vi.fn(),
}));

describe('SyncManager - Custom Tag Integration', () => {
  let syncManager: SyncManager;
  let mockRaindropApi: RaindropApi;
  let mockCollectionManager: CollectionManager;

  const createMockTweet = (): Tweet => ({
    id: '1234567890',
    url: 'https://x.com/testuser/status/1234567890',
    text: 'This is a test tweet',
    author: {
      handle: '@testuser',
      displayName: 'Test User',
    },
    timestamp: Date.now(),
    isRetweet: false,
    isDeleted: false,
  });

  beforeEach(() => {
    // Create mock instances
    mockRaindropApi = {
      authenticate: vi.fn(),
      setToken: vi.fn(),
      getCollections: vi.fn(),
      createCollection: vi.fn(),
      checkDuplicate: vi.fn(),
      createBookmark: vi.fn(),
    } as any;

    mockCollectionManager = {
      ensureCollection: vi.fn().mockResolvedValue(12345),
    } as any;

    syncManager = new SyncManager(mockRaindropApi, mockCollectionManager);
  });

  describe('addToQueue with custom tag', () => {
    it('should add tweet to queue without custom tag', async () => {
      const tweet = createMockTweet();

      await syncManager.addToQueue(tweet);

      const queueStatus = syncManager.getQueueStatus();
      expect(queueStatus.length).toBe(1);
    });

    it('should add tweet to queue with custom tag', async () => {
      const tweet = createMockTweet();
      const customTag = 'research';

      await syncManager.addToQueue(tweet, customTag);

      const queueStatus = syncManager.getQueueStatus();
      expect(queueStatus.length).toBe(1);
    });

    it('should handle undefined custom tag', async () => {
      const tweet = createMockTweet();

      await syncManager.addToQueue(tweet, undefined);

      const queueStatus = syncManager.getQueueStatus();
      expect(queueStatus.length).toBe(1);
    });

    it('should handle empty string custom tag', async () => {
      const tweet = createMockTweet();

      await syncManager.addToQueue(tweet, '');

      const queueStatus = syncManager.getQueueStatus();
      expect(queueStatus.length).toBe(1);
    });
  });

  describe('convertTweetToRaindrop with custom tag', () => {
    it('should include custom tag in tags array', async () => {
      const tweet = createMockTweet();
      const customTag = 'research';
      const collectionId = 12345;

      // Access the private method through a workaround
      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags).toContain('research');
      expect(raindropBookmark.tags.length).toBe(2);
    });

    it('should only include default tags when no custom tag provided', async () => {
      const tweet = createMockTweet();
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags.length).toBe(1);
    });

    it('should include custom tag with deleted tweet tag', async () => {
      const tweet = createMockTweet();
      tweet.isDeleted = true;
      const customTag = 'important';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags).toContain('tweet-deleted');
      expect(raindropBookmark.tags).toContain('important');
      expect(raindropBookmark.tags.length).toBe(3);
    });

    it('should include custom tag with retweet tag', async () => {
      const tweet = createMockTweet();
      tweet.isRetweet = true;
      const customTag = 'inspiration';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags).toContain('retweet');
      expect(raindropBookmark.tags).toContain('inspiration');
      expect(raindropBookmark.tags.length).toBe(3);
    });

    it('should include all tags: twitter + deleted + retweet + custom', async () => {
      const tweet = createMockTweet();
      tweet.isDeleted = true;
      tweet.isRetweet = true;
      const customTag = 'archive';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags).toContain('tweet-deleted');
      expect(raindropBookmark.tags).toContain('retweet');
      expect(raindropBookmark.tags).toContain('archive');
      expect(raindropBookmark.tags.length).toBe(4);
    });

    it('should not add empty custom tag', async () => {
      const tweet = createMockTweet();
      const customTag = '';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('twitter');
      expect(raindropBookmark.tags.length).toBe(1);
    });

    it('should preserve bookmark structure with custom tag', async () => {
      const tweet = createMockTweet();
      const customTag = 'test-tag';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark).toHaveProperty('link', tweet.url);
      expect(raindropBookmark).toHaveProperty('title');
      expect(raindropBookmark).toHaveProperty('excerpt');
      expect(raindropBookmark).toHaveProperty('tags');
      expect(raindropBookmark).toHaveProperty('collection');
      expect(raindropBookmark.collection.$id).toBe(collectionId);
    });

    it('should handle custom tags with special characters', async () => {
      const tweet = createMockTweet();
      const customTag = 'work-project_2024';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      expect(raindropBookmark.tags).toContain('work-project_2024');
    });
  });

  describe('Tag order', () => {
    it('should maintain consistent tag order', async () => {
      const tweet = createMockTweet();
      tweet.isDeleted = true;
      tweet.isRetweet = true;
      const customTag = 'my-tag';
      const collectionId = 12345;

      const convertMethod = (syncManager as any).convertTweetToRaindrop.bind(syncManager);
      const raindropBookmark = convertMethod(tweet, collectionId, customTag);

      // Expected order: twitter, tweet-deleted, retweet, custom
      expect(raindropBookmark.tags[0]).toBe('twitter');
      expect(raindropBookmark.tags[1]).toBe('tweet-deleted');
      expect(raindropBookmark.tags[2]).toBe('retweet');
      expect(raindropBookmark.tags[3]).toBe('my-tag');
    });
  });
});
