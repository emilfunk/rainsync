import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BookmarkDetector } from '../src/content/bookmark-detector';

vi.mock('../src/shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// MutationObserver callbacks run as microtasks
const flushMutations = () => Promise.resolve();

describe('BookmarkDetector', () => {
  let detector: BookmarkDetector;
  let onDetected: ReturnType<typeof vi.fn>;
  let onRemoved: ReturnType<typeof vi.fn>;
  let button: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<article data-testid="tweet"><button data-testid="bookmark"></button></article>';
    button = document.querySelector('button')!;
    onDetected = vi.fn();
    onRemoved = vi.fn();
    detector = new BookmarkDetector(onDetected, onRemoved);
    detector.start();
  });

  afterEach(() => {
    detector.stop();
    vi.useRealTimers();
  });

  it('reports a bookmark after the debounce', async () => {
    button.setAttribute('data-testid', 'removeBookmark');
    await flushMutations();
    vi.advanceTimersByTime(500);

    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('reports a removal of an existing bookmark', async () => {
    button.setAttribute('data-testid', 'removeBookmark');
    await flushMutations();
    vi.advanceTimersByTime(500);

    button.setAttribute('data-testid', 'bookmark');
    await flushMutations();

    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it('cancels a bookmark removed again before the debounce', async () => {
    button.setAttribute('data-testid', 'removeBookmark');
    await flushMutations();
    button.setAttribute('data-testid', 'bookmark');
    await flushMutations();
    vi.advanceTimersByTime(500);

    expect(onDetected).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
  });
});
