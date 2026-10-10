import { describe, it, expect, vi } from 'vitest';
import { TweetExtractor } from '../src/content/tweet-extractor';

vi.mock('../src/shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Shaped like X's markup: the User-Name block holds name, handle and time links
const tweetHtml = (body: string) => `
  <article data-testid="tweet">
    <div data-testid="User-Name">
      <a href="/jane" role="link"><span>Jane Doe</span></a>
      <a href="/jane" role="link"><span>@jane</span></a>
      <span>·</span>
      <a href="/jane/status/111" role="link"><time datetime="2026-10-10T08:00:00.000Z">2h</time></a>
    </div>
    ${body}
  </article>`;

const extract = (html: string) => {
  document.body.innerHTML = html;
  return new TweetExtractor().extractTweet(document.querySelector('article')!);
};

describe('TweetExtractor', () => {
  it('reads the display name without the handle and time', () => {
    const tweet = extract(tweetHtml('<div data-testid="tweetText">Hello</div>'));

    expect(tweet?.author).toEqual({ displayName: 'Jane Doe', handle: '@jane' });
    expect(tweet?.url).toBe('https://x.com/jane/status/111');
    expect(tweet?.text).toBe('Hello');
  });

  it('accepts photo or video tweets without text', () => {
    const tweet = extract(tweetHtml('<div data-testid="tweetPhoto"><img></div>'));

    expect(tweet).not.toBeNull();
    expect(tweet?.text).toBe('');
  });

  it('returns null without a tweet link', () => {
    const tweet = extract('<article data-testid="tweet"><div data-testid="tweetText">Hi</div></article>');

    expect(tweet).toBeNull();
  });
});
