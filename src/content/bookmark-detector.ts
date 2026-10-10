import { logger } from '../shared/utils/logger';
import { SELECTORS, WATCHED_ATTRIBUTES } from './dom-selectors';

export class BookmarkDetector {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTweet: Element | null = null;
  private readonly DEBOUNCE_DELAY = 500; // ms

  constructor(
    private onBookmarkDetected: (tweetElement: Element) => void,
    private onBookmarkRemoved?: (tweetElement: Element) => void
  ) {}

  /**
   * Start observing for bookmark actions
   */
  start(): void {
    if (this.observer) {
      logger.warn('BookmarkDetector already started');
      return;
    }

    logger.info('Starting bookmark detection');

    this.observer = new MutationObserver(this.handleMutations.bind(this));

    this.observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: [...WATCHED_ATTRIBUTES],
      attributeOldValue: true,
    });
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      logger.info('Stopped bookmark detection');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingTweet = null;
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as Element;
        // Only a real state switch counts. X also re-renders attributes on
        // already-bookmarked buttons, which must not look like a new bookmark.
        if (this.isTestIdSwitch(mutation, 'bookmark', 'removeBookmark')) {
          this.checkForBookmarkAction(target);
        } else if (this.isTestIdSwitch(mutation, 'removeBookmark', 'bookmark')) {
          this.handleRemoval(target);
        }
      }
    }
  }

  /**
   * A bookmark button that just switched to the bookmarked state
   */
  private checkForBookmarkAction(element: Element): void {
    logger.debug('Bookmark action detected');
    const tweetElement = this.findParentTweet(element);

    if (tweetElement) {
      this.debouncedCallback(tweetElement);
    } else {
      logger.warn('Could not find parent tweet element');
    }
  }

  /**
   * The button's data-testid changed from one bookmark state to the other
   */
  private isTestIdSwitch(mutation: MutationRecord, from: string, to: string): boolean {
    return (
      mutation.attributeName === 'data-testid' &&
      mutation.oldValue === from &&
      (mutation.target as Element).getAttribute('data-testid') === to
    );
  }

  /**
   * Handle a bookmark being removed on X
   */
  private handleRemoval(element: Element): void {
    const tweetElement = this.findParentTweet(element);
    if (!tweetElement) {
      return;
    }

    // Bookmarked and removed again before the debounce ran: nothing was saved
    if (this.debounceTimer && this.pendingTweet === tweetElement) {
      logger.info('Bookmark removed before it was saved, cancelling');
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingTweet = null;
      return;
    }

    logger.info('Bookmark removed on X');
    this.onBookmarkRemoved?.(tweetElement);
  }

  /**
   * Find the parent tweet article element
   */
  private findParentTweet(element: Element): Element | null {
    return element.closest(SELECTORS.TWEET_ARTICLE);
  }

  /**
   * Debounced callback to prevent rapid bookmark/unbookmark actions
   */
  private debouncedCallback(tweetElement: Element): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.pendingTweet = tweetElement;
    this.debounceTimer = setTimeout(() => {
      logger.info('Bookmark confirmed after debounce');
      this.debounceTimer = null;
      this.pendingTweet = null;
      this.onBookmarkDetected(tweetElement);
    }, this.DEBOUNCE_DELAY);
  }
}
