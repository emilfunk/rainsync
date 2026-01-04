export interface Tweet {
  id: string;
  url: string;
  text: string;
  author: {
    handle: string;
    displayName: string;
  };
  timestamp: Date;
  quotedTweet?: QuotedTweet;
  isRetweet: boolean;
  isDeleted?: boolean;
}

export interface QuotedTweet {
  text: string;
  author: {
    handle: string;
    displayName: string;
  };
}
