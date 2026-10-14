import { logger } from '../shared/utils/logger';
import { MessageType, BookmarkSyncResultPayload } from '../shared/types/messages';
import { SocialPost } from '../shared/types/tweet';
import { showPageToast } from './page-toast';

logger.info('RainSync YouTube connector loaded on', window.location.href);

class YouTubeConnector {
  private observer: MutationObserver | null = null;
  private processedVideoIds = new Set<string>();
  private lastLikedVideoId: string | null = null;

  init(): void {
    logger.info('RainSync YouTube connector initializing...');

    // Listen for sync results
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.BOOKMARK_SYNC_RESULT) {
        this.showSyncResult(message.payload as BookmarkSyncResultPayload);
      }
    });

    // Start observing like and save actions
    this.startObserver();

    // Listen to click events on like and save buttons
    document.addEventListener('click', this.handleClick.bind(this), true);

    logger.info('RainSync YouTube connector ready');
  }

  private startObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed'],
    });
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-pressed') {
        const target = mutation.target as HTMLElement;
        const isPressed = target.getAttribute('aria-pressed') === 'true';

        // Check if this button is a like button
        const isLikeButton = target.closest('like-button-view-model') ||
                             target.closest('ytd-like-button-renderer') ||
                             target.closest('#like-button') ||
                             target.getAttribute('aria-label')?.toLowerCase().includes('like');

        if (isLikeButton && isPressed) {
          this.handleVideoLiked();
        }
      }
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Check for Save to playlist button
    const saveButton = target.closest('button[aria-label*="Save" i]') ||
                       target.closest('button[aria-label*="Gem" i]') ||
                       target.closest('ytd-menu-service-item-renderer');

    if (saveButton) {
      const buttonText = saveButton.textContent?.toLowerCase() || '';
      const ariaLabel = saveButton.getAttribute('aria-label')?.toLowerCase() || '';

      if (buttonText.includes('save') || buttonText.includes('gem') ||
          ariaLabel.includes('save') || ariaLabel.includes('gem') ||
          ariaLabel.includes('watch later') || ariaLabel.includes('se senere')) {
        setTimeout(() => this.handleVideoLiked(), 300);
      }
    }
  }

  private getVideoId(): string | null {
    const url = new URL(window.location.href);

    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }

    if (url.pathname.startsWith('/shorts/')) {
      const parts = url.pathname.split('/');
      return parts[2] || null;
    }

    return null;
  }

  private handleVideoLiked(): void {
    const videoId = this.getVideoId();
    if (!videoId) return;

    // Prevent immediate duplicate fires for the same video in one session
    if (this.lastLikedVideoId === videoId && this.processedVideoIds.has(videoId)) {
      return;
    }

    this.lastLikedVideoId = videoId;
    this.processedVideoIds.add(videoId);

    // Extract video data
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                         document.querySelector('ytd-watch-metadata #title h1') ||
                         document.querySelector('#title h1') ||
                         document.querySelector('h2.ytd-reel-player-header-renderer');

    const title = titleElement?.textContent?.trim() ||
                  document.title.replace(/ - YouTube$/, '').trim() ||
                  'YouTube Video';

    const channelElement = document.querySelector('#upload-info ytd-channel-name a') ||
                           document.querySelector('ytd-channel-name a') ||
                           document.querySelector('#channel-name a') ||
                           document.querySelector('ytd-reel-player-header-renderer #channel-name a');

    const channelName = channelElement?.textContent?.trim() || 'YouTube Channel';
    const channelHandle = channelElement?.getAttribute('href') || '';

    const descElement = document.querySelector('#description-inline-expander') ||
                        document.querySelector('#description');
    const description = descElement?.textContent?.trim()?.slice(0, 400) || '';

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    logger.info('Detected YouTube video like/save', { videoId, title, channelName });

    const post: SocialPost = {
      id: `yt_${videoId}`,
      platform: 'youtube',
      url: videoUrl,
      title,
      text: description || title,
      author: {
        displayName: channelName,
        handle: channelHandle,
      },
      thumbnail,
      timestamp: new Date(),
    };

    this.sendToBackground(post);
  }

  private async sendToBackground(post: SocialPost): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet: post,
        },
      });

      if (response?.error) {
        showPageToast(`Not saved: ${response.error}`, 'error');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Extension context invalidated')) {
        showPageToast('RainSync was updated. Reload this page to continue syncing.');
        return;
      }
      logger.error('Failed to send YouTube bookmark to background', error as Error);
    }
  }

  private showSyncResult(result: BookmarkSyncResultPayload): void {
    if (result.status === 'saved') {
      showPageToast('Saved to Raindrop.io (YouTube Liked & Saved)');
    } else if (result.status === 'duplicate') {
      showPageToast('Already in Raindrop.io');
    } else {
      showPageToast(`Not saved to Raindrop.io: ${result.error ?? 'unknown error'}`, 'error');
    }
  }

  cleanup(): void {
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener('click', this.handleClick.bind(this), true);
  }
}

let connector: YouTubeConnector | null = null;

function init() {
  connector = new YouTubeConnector();
  connector.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('beforeunload', () => {
  connector?.cleanup();
});
