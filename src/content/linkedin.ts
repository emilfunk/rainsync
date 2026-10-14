import { logger } from '../shared/utils/logger';
import { MessageType, BookmarkSyncResultPayload } from '../shared/types/messages';
import { SocialPost } from '../shared/types/tweet';
import { showPageToast } from './page-toast';

logger.info('RainSync LinkedIn connector loaded on', window.location.href);

class LinkedInConnector {
  private processedPostUrls = new Set<string>();
  private activePostContainer: Element | null = null;

  init(): void {
    logger.info('RainSync LinkedIn connector initializing...');

    // Listen for sync results
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.BOOKMARK_SYNC_RESULT) {
        this.showSyncResult(message.payload as BookmarkSyncResultPayload);
      }
    });

    // Track which post opened its control menu
    document.addEventListener('click', this.handleClick.bind(this), true);

    logger.info('RainSync LinkedIn connector ready');
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // 1. Check if user clicked the "..." menu trigger of a post
    const controlMenuTrigger = target.closest('button.feed-shared-control-menu__trigger') ||
                               target.closest('button[aria-label*="control menu" i]') ||
                               target.closest('button[aria-label*="menu" i]');

    if (controlMenuTrigger) {
      this.activePostContainer = controlMenuTrigger.closest('div.feed-shared-update-v2') ||
                                 controlMenuTrigger.closest('div[data-urn]') ||
                                 controlMenuTrigger.closest('div[data-id]');
      return;
    }

    // 2. Check if user clicked "Save" or "Gem" in the dropdown or on the post
    const saveItem = target.closest('div[role="button"]') ||
                     target.closest('li[role="menuitem"]') ||
                     target.closest('button');

    if (!saveItem) return;

    const itemText = saveItem.textContent?.toLowerCase() || '';
    const ariaLabel = saveItem.getAttribute('aria-label')?.toLowerCase() || '';
    const hasBookmarkIcon = saveItem.querySelector('svg[data-test-icon*="bookmark" i]') !== null ||
                            saveItem.querySelector('li-icon[type="bookmark"]') !== null;

    const isSaveAction = (itemText.includes('save') || itemText.includes('gem')) &&
                         !itemText.includes('saved') &&
                         !itemText.includes('unsave') &&
                         !itemText.includes('fjern') &&
                         (hasBookmarkIcon || itemText.includes('post') || itemText.includes('opslag') || ariaLabel.includes('save') || ariaLabel.includes('gem'));

    if (isSaveAction) {
      const container = this.activePostContainer ||
                        saveItem.closest('div.feed-shared-update-v2') ||
                        saveItem.closest('div[data-urn]') ||
                        document.querySelector('div.feed-shared-update-v2');

      if (container) {
        setTimeout(() => this.handleSavePost(container), 250);
      }
    }
  }

  private handleSavePost(container: Element): void {
    // 1. Extract URN or URL
    let postUrl = '';
    const urn = container.getAttribute('data-urn') || container.getAttribute('data-id');

    if (urn) {
      postUrl = `https://www.linkedin.com/feed/update/${urn}/`;
    } else {
      const linkElement = container.querySelector('a.feed-shared-control-menu__item--copy-link') ||
                          container.querySelector('a.app-aware-link[href*="/feed/update/"]') ||
                          container.querySelector('a.app-aware-link[href*="/posts/"]');
      if (linkElement) {
        const href = linkElement.getAttribute('href') || '';
        postUrl = new URL(href, window.location.origin).href;
      } else if (window.location.pathname.includes('/feed/update/') || window.location.pathname.includes('/posts/')) {
        postUrl = window.location.href.split('?')[0];
      }
    }

    if (!postUrl) {
      logger.warn('Could not extract LinkedIn post URL');
      return;
    }

    // Clean post URL
    postUrl = postUrl.split('?')[0];

    if (this.processedPostUrls.has(postUrl)) {
      return;
    }
    this.processedPostUrls.add(postUrl);

    // 2. Extract Author
    const authorElement = container.querySelector('.update-components-actor__name span[aria-hidden="true"]') ||
                          container.querySelector('.update-components-actor__name') ||
                          container.querySelector('.feed-shared-actor__name');

    const authorName = authorElement?.textContent?.trim() || 'LinkedIn Member';

    const headlineElement = container.querySelector('.update-components-actor__description') ||
                            container.querySelector('.feed-shared-actor__description');
    const headline = headlineElement?.textContent?.trim() || '';

    // 3. Extract Post Text
    const textElement = container.querySelector('.feed-shared-update-v2__description') ||
                        container.querySelector('.update-components-text') ||
                        container.querySelector('.feed-shared-text');
    const text = textElement?.textContent?.trim() || '';

    // 4. Extract Image Thumbnail
    const imgElement = container.querySelector('.update-components-image__image') ||
                       container.querySelector('.feed-shared-image__image') ||
                       container.querySelector('article img');
    const thumbnail = imgElement?.getAttribute('src') || undefined;

    const title = text ? text.slice(0, 100).split('\n')[0] : `LinkedIn post by ${authorName}`;

    logger.info('Detected LinkedIn saved post', { postUrl, authorName, title });

    const post: SocialPost = {
      id: `li_${urn || postUrl.split('/').filter(Boolean).pop() || Date.now()}`,
      platform: 'linkedin',
      url: postUrl,
      title,
      text: headline ? `${text}\n\nTitle/Headline: ${headline}` : text,
      author: {
        displayName: authorName,
        handle: authorName.toLowerCase().replace(/\s+/g, '_'),
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
      logger.error('Failed to send LinkedIn bookmark to background', error as Error);
    }
  }

  private showSyncResult(result: BookmarkSyncResultPayload): void {
    if (result.status === 'saved') {
      showPageToast('Saved to Raindrop.io (LinkedIn Saved)');
    } else if (result.status === 'duplicate') {
      showPageToast('Already in Raindrop.io');
    } else {
      showPageToast(`Not saved to Raindrop.io: ${result.error ?? 'unknown error'}`, 'error');
    }
  }

  cleanup(): void {
    document.removeEventListener('click', this.handleClick.bind(this), true);
    this.activePostContainer = null;
  }
}

let connector: LinkedInConnector | null = null;

function init() {
  connector = new LinkedInConnector();
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
