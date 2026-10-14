import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncManager } from '../src/background/sync-manager';
import { RaindropApi } from '../src/background/raindrop-api';
import { CollectionManager } from '../src/background/collection-manager';
import { SocialPost } from '../src/shared/types/tweet';

vi.mock('../src/shared/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn(),
}));

vi.mock('../src/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SyncManager - Multi-Platform Connectors', () => {
  let syncManager: SyncManager;
  let mockRaindropApi: RaindropApi;
  let mockCollectionManager: CollectionManager;

  beforeEach(() => {
    mockRaindropApi = {
      authenticate: vi.fn(),
      setToken: vi.fn(),
      getCollections: vi.fn(),
      createCollection: vi.fn(),
      checkDuplicate: vi.fn().mockResolvedValue(false),
      createBookmark: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockCollectionManager = {
      ensureCollection: vi.fn().mockImplementation((platform) => {
        if (platform === 'youtube') return Promise.resolve(101);
        if (platform === 'instagram') return Promise.resolve(102);
        if (platform === 'linkedin') return Promise.resolve(103);
        return Promise.resolve(100);
      }),
      clearCache: vi.fn(),
    } as any;

    syncManager = new SyncManager(mockRaindropApi, mockCollectionManager);
  });

  it('syncs a YouTube video to the YouTube Liked & Saved collection', async () => {
    const youtubePost: SocialPost = {
      id: 'yt_abc123',
      platform: 'youtube',
      url: 'https://www.youtube.com/watch?v=abc123',
      title: 'Awesome Tech Talk',
      text: 'Talk on agentic engineering and systems architecture',
      author: {
        displayName: 'Tech Channel',
        handle: '/@techchannel',
      },
      thumbnail: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      timestamp: new Date(),
    };

    await (syncManager as any).syncBookmark({
      tweet: youtubePost,
      addedAt: Date.now(),
      retryCount: 0,
    });

    expect(mockCollectionManager.ensureCollection).toHaveBeenCalledWith('youtube');
    expect(mockRaindropApi.createBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://www.youtube.com/watch?v=abc123',
        title: 'Awesome Tech Talk',
        tags: expect.arrayContaining(['youtube', 'video']),
        collection: { $id: 101 },
        cover: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      })
    );
  });

  it('syncs an Instagram post to the Instagram Saved collection', async () => {
    const instagramPost: SocialPost = {
      id: 'ig_p12345',
      platform: 'instagram',
      url: 'https://www.instagram.com/p/p12345/',
      title: 'Design Inspiration',
      text: 'Exploring typography and grid layouts in 2026',
      author: {
        displayName: 'design_studio',
        handle: 'design_studio',
      },
      thumbnail: 'https://cdninstagram.com/p12345.jpg',
      timestamp: new Date(),
    };

    await (syncManager as any).syncBookmark({
      tweet: instagramPost,
      addedAt: Date.now(),
      retryCount: 0,
    });

    expect(mockCollectionManager.ensureCollection).toHaveBeenCalledWith('instagram');
    expect(mockRaindropApi.createBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://www.instagram.com/p/p12345/',
        title: 'Design Inspiration',
        tags: expect.arrayContaining(['instagram']),
        collection: { $id: 102 },
        cover: 'https://cdninstagram.com/p12345.jpg',
      })
    );
  });

  it('syncs a LinkedIn post to the LinkedIn Saved collection', async () => {
    const linkedinPost: SocialPost = {
      id: 'li_789456',
      platform: 'linkedin',
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:789456/',
      title: 'Lessons learned building scalable systems',
      text: 'Here are the 5 core principles we adopted this year...',
      author: {
        displayName: 'Alice Engineer',
        handle: 'alice_engineer',
      },
      timestamp: new Date(),
    };

    await (syncManager as any).syncBookmark({
      tweet: linkedinPost,
      addedAt: Date.now(),
      retryCount: 0,
    });

    expect(mockCollectionManager.ensureCollection).toHaveBeenCalledWith('linkedin');
    expect(mockRaindropApi.createBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://www.linkedin.com/feed/update/urn:li:activity:789456/',
        title: 'Lessons learned building scalable systems',
        tags: expect.arrayContaining(['linkedin']),
        collection: { $id: 103 },
      })
    );
  });
});
