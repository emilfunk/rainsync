import { logger } from '../shared/utils/logger';
import { MessageType, BookmarkSyncResultPayload } from '../shared/types/messages';
import { SocialPost } from '../shared/types/tweet';
import { showPageToast } from './page-toast';

logger.info('RainSync Instagram connector loaded on', window.location.href);

class InstagramConnector {
  private observer: MutationObserver | null = null;
  private processedPostUrls = new Set<string>();

  init(): void {
    logger.info('RainSync Instagram connector initializing...');

    // Listen for sync results
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.BOOKMARK_SYNC_RESULT) {
        this.showSyncResult(message.payload as BookmarkSyncResultPayload);
      }
    });

    // Listen for clicks on Save buttons
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Also observe DOM mutations for SVG state changes
    this.startObserver();

    logger.info('RainSync Instagram connector ready');
  }

  private startObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              const svg = node.querySelector('svg[aria-label*="Remove" i], svg[aria-label*="Fjern" i]');
              if (svg) {
                const container = svg.closest('article, div[role="dialog"], section');
                if (container) {
                  this.handleSaveAction(container);
                }
              }
            }
          }
        }
      }
    });

    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element is or is inside a Save bookmark button
    const saveButton = target.closest('button:has(svg)') || target.closest('div[role="button"]:has(svg)');
    if (!saveButton) return;

    const svg = saveButton.querySelector('svg');
    if (!svg) return;

    const ariaLabel = (svg.getAttribute('aria-label') || saveButton.getAttribute('aria-label') || '').toLowerCase();
    const isSaveAction = ariaLabel.includes('save') ||
                         ariaLabel.includes('gem') ||
                         ariaLabel.includes('guardar') ||
                         ariaLabel.includes('salva') ||
                         ariaLabel.includes('enregistrer') ||
                         ariaLabel.includes('speichern') ||
                         svg.querySelector('polygon') !== null;

    if (isSaveAction) {
      const container = saveButton.closest('article') ||
                        saveButton.closest('div[role="dialog"]') ||
                        saveButton.closest('main') ||
                        document.body;

      setTimeout(() => this.handleSaveAction(container), 250);
    }
  }

  private handleSaveAction(container: Element): void {
    // 1. Extract Post URL
    let postUrl = '';
    const postLink = container.querySelector('a[href*="/p/"], a[href*="/reel/"]');
    if (postLink) {
      const href = postLink.getAttribute('href') || '';
      postUrl = new URL(href, window.location.origin).href;
    } else if (window.location.pathname.startsWith('/p/') || window.location.pathname.startsWith('/reel/')) {
      postUrl = window.location.href.split('?')[0];
    }

    if (!postUrl) {
      logger.warn('Could not determine Instagram post URL');
      return;
    }

    // Clean post URL (remove query params)
    postUrl = postUrl.split('?')[0];

    if (this.processedPostUrls.has(postUrl)) {
      return;
    }
    this.processedPostUrls.add(postUrl);

    // 2. Extract Author
    const authorLink = container.querySelector('header a[role="link"]') ||
                       container.querySelector('header a') ||
                       container.querySelector('a.notranslate') ||
                       container.querySelector('h2 a');

    const handle = authorLink?.textContent?.trim()?.replace(/^@/, '') || 'instagram_user';

    // 3. Extract Caption
    const captionElement = container.querySelector('h1[dir="auto"]') ||
                           container.querySelector('span[dir="auto"]') ||
                           container.querySelector('div[role="button"] + span');
    const caption = captionElement?.textContent?.trim() || '';

    // 4. Extract Image Thumbnail
    const imgElement = container.querySelector('img[src*="cdninstagram"], img[src*="fbcdn"], article img');
    const thumbnail = imgElement?.getAttribute('src') || undefined;

    const title = caption ? caption.slice(0, 100).split('\n')[0] : `Instagram post by @${handle}`;

    logger.info('Detected Instagram saved post', { postUrl, handle, title });

    const post: SocialPost = {
      id: `ig_${postUrl.split('/').filter(Boolean).pop() || Date.now()}`,
      platform: 'instagram',
      url: postUrl,
      title,
      text: caption,
      author: {
        handle,
        displayName: handle,
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
      logger.error('Failed to send Instagram bookmark to background', error as Error);
    }
  }

  private showSyncResult(result: BookmarkSyncResultPayload): void {
    if (result.status === 'saved') {
      showPageToast('Saved to Raindrop.io (Instagram Saved)');
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

let connector: InstagramConnector | null = null;

function init() {
  connector = new InstagramConnector();
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
