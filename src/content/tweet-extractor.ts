import { Tweet, QuotedTweet } from '../shared/types/tweet';
import { logger } from '../shared/utils/logger';
import { SELECTORS } from './dom-selectors';

export class TweetExtractor {
  /**
   * Extract tweet data from a tweet element
   */
  extractTweet(tweetElement: Element): Tweet | null {
    try {
      const author = this.extractAuthor(tweetElement);
      const tweetPath = this.findTweetPath(tweetElement, author?.handle);
      const id = tweetPath?.id ?? null;
      const url = tweetPath ? this.toFullUrl(tweetPath.path) : null;
      const text = this.extractTweetText(tweetElement);
      const timestamp = this.extractTimestamp(tweetElement);
      const quotedTweet = this.extractQuotedTweet(tweetElement);
      const isRetweet = this.isRetweet(tweetElement);
      const isDeleted = this.isDeleted(tweetElement);

      // Text is optional: photo and video tweets have none
      if (!id || !url || !author) {
        logger.warn('Failed to extract required tweet data', { id, url, hasText: !!text, hasAuthor: !!author });
        return null;
      }

      return {
        id,
        url,
        text: text ?? '',
        author,
        timestamp,
        quotedTweet: quotedTweet || undefined,
        isRetweet,
        isDeleted,
      };
    } catch (error) {
      logger.error('Error extracting tweet', error as Error);
      return null;
    }
  }

  /**
   * Find the tweet's own "/user/status/id" path.
   * X doesn't always wrap the timestamp in a link, so fall back to other
   * status links of the same author, any status link outside a quoted
   * tweet, and finally the page address when this is the tweet's own page.
   */
  private findTweetPath(element: Element, handle?: string): { path: string; id: string } | null {
    const STATUS_PATH = /^\/([^/?#]+)\/status\/(\d+)/;
    const parse = (href: string | null | undefined) => {
      const match = href?.match(STATUS_PATH);
      return match ? { path: `/${match[1]}/status/${match[2]}`, id: match[2], user: match[1] } : null;
    };

    const fromTime = parse(element.querySelector(SELECTORS.TIMESTAMP)?.closest('a')?.getAttribute('href'));
    if (fromTime) return fromTime;

    const links = Array.from(element.querySelectorAll('a[href*="/status/"]'))
      .filter((link) => !link.closest(SELECTORS.QUOTED_TWEET))
      .map((link) => parse(link.getAttribute('href')))
      .filter((link): link is NonNullable<typeof link> => link !== null);

    const user = handle?.replace(/^@/, '').toLowerCase();
    const byAuthor = links.find((link) => link.user.toLowerCase() === user);
    if (byAuthor) return byAuthor;
    if (links[0]) return links[0];

    // Only the tweet open on its own page; replies below it have their own links
    const fromPage = parse(window.location.pathname);
    if (fromPage && fromPage.user.toLowerCase() === user) return fromPage;

    return null;
  }

  /**
   * Turn a tweet path into a full URL on the current site
   */
  private toFullUrl(path: string): string {
    const baseUrl = window.location.hostname === 'twitter.com' ? 'https://twitter.com' : 'https://x.com';
    return `${baseUrl}${path}`;
  }

  /**
   * Extract tweet text content
   */
  private extractTweetText(element: Element): string | null {
    // Get the main tweet text (not quoted tweet text)
    const tweetTextElement = element.querySelector(SELECTORS.TWEET_TEXT);

    if (!tweetTextElement) {
      return null;
    }

    // Get text content, preserving line breaks
    return tweetTextElement.textContent?.trim() || null;
  }

  /**
   * Extract author information
   */
  private extractAuthor(element: Element): Tweet['author'] | null {
    const userNameElement = element.querySelector(SELECTORS.USER_NAME);

    if (!userNameElement) {
      return null;
    }

    // The first profile link holds the display name. The whole User-Name block
    // also contains the handle and the time ("Name@handle·2h"), so only fall
    // back to the text before the handle.
    const authorLink = element.querySelector(SELECTORS.AUTHOR_LINK);
    const href = authorLink?.getAttribute('href');
    const displayName =
      authorLink?.textContent?.trim() || userNameElement.textContent?.split('@')[0].trim();

    if (!href || !displayName) {
      return null;
    }

    // Extract handle from URL (format: /username)
    const handle = href.split('/')[1];

    if (!handle) {
      return null;
    }

    return {
      displayName,
      handle: `@${handle}`,
    };
  }

  /**
   * Extract timestamp
   */
  private extractTimestamp(element: Element): Date {
    const timeElement = element.querySelector(SELECTORS.TIMESTAMP);
    const datetime = timeElement?.getAttribute('datetime');

    if (datetime) {
      return new Date(datetime);
    }

    // Fallback to current time
    return new Date();
  }

  /**
   * Extract quoted tweet if present
   */
  private extractQuotedTweet(element: Element): QuotedTweet | null {
    const quotedElement = element.querySelector(SELECTORS.QUOTED_TWEET);

    if (!quotedElement) {
      return null;
    }

    // Extract text from quoted tweet
    const text = quotedElement.querySelector(SELECTORS.TWEET_TEXT)?.textContent?.trim();

    // Extract author from quoted tweet
    const author = this.extractAuthor(quotedElement);

    if (!author) {
      return null;
    }

    return {
      text: text ?? '',
      author,
    };
  }

  /**
   * Check if this is a retweet
   */
  private isRetweet(element: Element): boolean {
    // Look for "Retweeted" text or retweet indicator
    // This is a basic check - may need refinement based on Twitter's current structure
    const text = element.textContent || '';
    return text.includes('Retweeted') || text.includes('retweeted');
  }

  /**
   * Check if this tweet is deleted or unavailable
   */
  private isDeleted(element: Element): boolean {
    const text = element.textContent || '';

    // Twitter shows various messages for unavailable tweets
    const deletedPatterns = [
      'This Tweet is unavailable',
      'This Post is unavailable',
      'This Tweet was deleted',
      'This Post was deleted',
      'Tweet unavailable',
      'Post unavailable',
    ];

    return deletedPatterns.some(pattern => text.includes(pattern));
  }
}
