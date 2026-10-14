import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { YouTubeConnector } from '../src/content/youtube';
import { InstagramConnector } from '../src/content/instagram';
import { LinkedInConnector } from '../src/content/linkedin';

vi.mock('../src/shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../src/content/page-toast', () => ({
  showPageToast: vi.fn(),
}));

describe('Content Script Connectors - DOM Extraction', () => {
  let sendMessageMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMessageMock = vi.fn().mockResolvedValue({ success: true });
    (global as any).chrome = {
      runtime: {
        sendMessage: sendMessageMock,
        onMessage: {
          addListener: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('YouTubeConnector', () => {
    it('captures like action and extracts video metadata from YouTube watch page', async () => {
      // Mock window.location for watch page
      delete (window as any).location;
      window.location = new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ') as any;

      document.body.innerHTML = `
        <div id="primary">
          <h1 class="ytd-watch-metadata">
            <yt-formatted-string>Never Gonna Give You Up</yt-formatted-string>
          </h1>
          <div id="upload-info">
            <ytd-channel-name>
              <a href="/@RickAstleyVEVO">Rick Astley</a>
            </ytd-channel-name>
          </div>
          <div id="description-inline-expander">The official video for Never Gonna Give You Up</div>
          <like-button-view-model>
            <button aria-pressed="false" aria-label="like this video">Like</button>
          </like-button-view-model>
        </div>
      `;

      const connector = new YouTubeConnector();
      connector.init();

      // Simulate liking the video (aria-pressed switches to true)
      const likeButton = document.querySelector('like-button-view-model button')!;
      likeButton.setAttribute('aria-pressed', 'true');

      // Call internal handler to simulate mutation trigger directly
      (connector as any).handleVideoLiked();

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKMARK_DETECTED',
          payload: {
            tweet: expect.objectContaining({
              id: 'yt_dQw4w9WgXcQ',
              platform: 'youtube',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              title: 'Never Gonna Give You Up',
              author: {
                displayName: 'Rick Astley',
                handle: '/@RickAstleyVEVO',
              },
              thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            }),
          },
        })
      );

      connector.cleanup();
    });

    it('extracts video metadata on YouTube Shorts', async () => {
      delete (window as any).location;
      window.location = new URL('https://www.youtube.com/shorts/shortId123') as any;

      document.body.innerHTML = `
        <div class="ytd-reel-player-header-renderer">
          <h2 class="ytd-reel-player-header-renderer">Quick Coding Tip</h2>
          <div id="channel-name">
            <a href="/@quickcode">Quick Code</a>
          </div>
        </div>
      `;

      const connector = new YouTubeConnector();
      (connector as any).handleVideoLiked();

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKMARK_DETECTED',
          payload: {
            tweet: expect.objectContaining({
              id: 'yt_shortId123',
              platform: 'youtube',
              url: 'https://www.youtube.com/watch?v=shortId123',
              title: 'Quick Coding Tip',
              author: {
                displayName: 'Quick Code',
                handle: '/@quickcode',
              },
            }),
          },
        })
      );
    });
  });

  describe('InstagramConnector', () => {
    it('captures saved post and extracts Instagram post metadata', async () => {
      delete (window as any).location;
      window.location = new URL('https://www.instagram.com/') as any;

      document.body.innerHTML = `
        <article>
          <header>
            <a role="link" href="/photographer_dan/">photographer_dan</a>
          </header>
          <div>
            <a href="/p/C9xyzABC123/">
              <img src="https://cdninstagram.com/photo.jpg" alt="Photo of foggy forest" />
            </a>
          </div>
          <div>
            <h1 dir="auto">Morning mist in the Black Forest #photography</h1>
          </div>
          <button type="button">
            <svg aria-label="Save"></svg>
          </button>
        </article>
      `;

      const connector = new InstagramConnector();
      const article = document.querySelector('article')!;
      (connector as any).handleSaveAction(article);

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKMARK_DETECTED',
          payload: {
            tweet: expect.objectContaining({
              id: 'ig_C9xyzABC123',
              platform: 'instagram',
              url: 'https://www.instagram.com/p/C9xyzABC123/',
              title: 'Morning mist in the Black Forest #photography',
              author: {
                displayName: 'photographer_dan',
                handle: 'photographer_dan',
              },
              thumbnail: 'https://cdninstagram.com/photo.jpg',
            }),
          },
        })
      );
    });
  });

  describe('LinkedInConnector', () => {
    it('captures saved post and extracts LinkedIn update metadata', async () => {
      delete (window as any).location;
      window.location = new URL('https://www.linkedin.com/feed/') as any;

      document.body.innerHTML = `
        <div class="feed-shared-update-v2" data-urn="urn:li:activity:7123456789012345678">
          <div class="update-components-actor__name">
            <span aria-hidden="true">Sarah Connor</span>
          </div>
          <div class="update-components-actor__description">AI Security Researcher</div>
          <div class="feed-shared-update-v2__description">
            <span class="break-words">We just published our new whitepaper on automated cyber defense...</span>
          </div>
          <img class="update-components-image__image" src="https://media.licdn.com/dms/image/paper.jpg" />
        </div>
      `;

      const connector = new LinkedInConnector();
      const postContainer = document.querySelector('.feed-shared-update-v2')!;
      (connector as any).handleSavePost(postContainer);

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BOOKMARK_DETECTED',
          payload: {
            tweet: expect.objectContaining({
              id: 'li_urn:li:activity:7123456789012345678',
              platform: 'linkedin',
              url: 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/',
              title: 'We just published our new whitepaper on automated cyber defense...',
              author: {
                displayName: 'Sarah Connor',
                handle: 'sarah_connor',
              },
              thumbnail: 'https://media.licdn.com/dms/image/paper.jpg',
            }),
          },
        })
      );
    });
  });
});
