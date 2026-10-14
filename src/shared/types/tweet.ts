export type PlatformType = 'twitter' | 'youtube' | 'instagram' | 'linkedin';

export interface SocialAuthor {
  handle: string;
  displayName: string;
}

export interface QuotedTweet {
  text: string;
  author: SocialAuthor;
}

export interface SocialPost {
  id: string;
  platform?: PlatformType;
  url: string;
  title?: string;
  text: string;
  author: SocialAuthor;
  timestamp: Date;
  tags?: string[];
  thumbnail?: string;
  metadata?: Record<string, string>;
  quotedTweet?: QuotedTweet;
  isRetweet?: boolean;
  isDeleted?: boolean;
}

export type Tweet = SocialPost;
