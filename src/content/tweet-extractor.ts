import { Tweet, QuotedTweet } from '../shared/types/tweet';
import { logger } from '../shared/utils/logger';
import { SELECTORS } from './dom-selectors';

export class TweetExtractor {
  /**
   * Extract tweet data from a tweet element
   */
  extractTweet(tweetElement: Element): Tweet | null {
    try {
      const id = this.extractTweetId(tweetElement);
      const url = this.extractTweetUrl(tweetElement, id);
      const text = this.extractTweetText(tweetElement);
      const author = this.extractAuthor(tweetElement);
      const timestamp = this.extractTimestamp(tweetElement);
      const quotedTweet = this.extractQuotedTweet(tweetElement);
      const isRetweet = this.isRetweet(tweetElement);
      const isDeleted = this.isDeleted(tweetElement);

      if (!id || !url || !text || !author) {
        logger.warn('Failed to extract required tweet data', { id, url, hasText: !!text, hasAuthor: !!author });
        return null;
      }

      return {
        id,
        url,
        text,
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
   * Extract tweet ID from the tweet link
   */
  private extractTweetId(element: Element): string | null {
    const timeElement = element.querySelector(SELECTORS.TIMESTAMP);
    const tweetLink = timeElement?.closest('a');
    const href = tweetLink?.getAttribute('href');

    if (href) {
      // Tweet URLs are in format: /username/status/1234567890
      const match = href.match(/\/status\/(\d+)/);
      return match?.[1] || null;
    }

    return null;
  }

  /**
   * Construct the full tweet URL
   */
  private extractTweetUrl(element: Element, tweetId: string | null): string | null {
    if (!tweetId) return null;

    const timeElement = element.querySelector(SELECTORS.TIMESTAMP);
    const tweetLink = timeElement?.closest('a');
    const href = tweetLink?.getAttribute('href');

    if (href) {
      // Convert to full URL
      const baseUrl = window.location.hostname === 'twitter.com' ? 'https://twitter.com' : 'https://x.com';
      return `${baseUrl}${href}`;
    }

    return null;
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

    // Get display name from the user name element
    const displayName = userNameElement.textContent?.trim();

    // Get handle from the author link
    const authorLink = element.querySelector(SELECTORS.AUTHOR_LINK);
    const href = authorLink?.getAttribute('href');

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

    if (!text || !author) {
      return null;
    }

    return {
      text,
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
