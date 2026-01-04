/**
 * DOM selectors for Twitter/X.com
 * These may need updates if Twitter changes their UI structure
 */

export const SELECTORS = {
  // Bookmark button states
  BOOKMARK_BUTTON: '[data-testid="bookmark"]',
  UNBOOKMARK_BUTTON: '[data-testid="removeBookmark"]',

  // Tweet container
  TWEET_ARTICLE: 'article[data-testid="tweet"]',

  // Tweet content
  TWEET_TEXT: '[data-testid="tweetText"]',

  // Author information
  USER_NAME: '[data-testid="User-Name"]',
  // The author link contains the handle
  AUTHOR_LINK: '[data-testid="User-Name"] a[href^="/"][role="link"]',

  // Timestamp and tweet link
  TIMESTAMP: 'time',

  // Quote tweet
  QUOTED_TWEET: '[data-testid="quotedTweet"]',

  // Media attachments
  TWEET_PHOTO: '[data-testid="tweetPhoto"]',
  TWEET_VIDEO: '[data-testid="videoPlayer"]',

  // Reply context
  REPLY_TO: '[data-testid="tweet"] [data-testid="User-Name"]',
} as const;

/**
 * Attributes to watch for changes
 */
export const WATCHED_ATTRIBUTES = ['data-testid', 'aria-label'] as const;

/**
 * CSS class patterns (if needed)
 */
export const CLASS_PATTERNS = {
  // Add any class-based selectors here if needed
} as const;
