import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showNotification } from '../src/shared/utils/notifications';
import { showPageToast } from '../src/content/page-toast';
import { MessageType } from '../src/shared/types/messages';

describe('showNotification', () => {
  beforeEach(() => {
    vi.mocked(chrome.runtime.sendMessage).mockReset();
  });

  afterEach(() => {
    delete (chrome as { notifications?: unknown }).notifications;
    delete (chrome.runtime as { getURL?: unknown }).getURL;
  });

  it('forwards to the background when chrome.notifications is unavailable', async () => {
    await showNotification('Title', 'Body');

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.SHOW_NOTIFICATION,
      payload: { title: 'Title', message: 'Body' },
    });
  });

  it('creates the notification with the extension icon when available', async () => {
    const create = vi.fn();
    (chrome as { notifications?: unknown }).notifications = { create };
    (chrome.runtime as { getURL?: unknown }).getURL = (p: string) => `chrome-extension://id/${p}`;

    await showNotification('Title', 'Body');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        iconUrl: 'chrome-extension://id/icons/icon128.png',
        title: 'Title',
        message: 'Body',
      })
    );
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('does not throw when forwarding fails', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(new Error('Extension context invalidated'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(showNotification('Title', 'Body')).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith('[RainSync] Title: Body');

    log.mockRestore();
  });
});

describe('showPageToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a single toast and removes it after a while', () => {
    showPageToast('First');
    showPageToast('Second');

    const toasts = document.querySelectorAll('#rainsync-page-toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].textContent).toBe('Second');

    vi.advanceTimersByTime(8000);
    expect(document.getElementById('rainsync-page-toast')).toBeNull();
  });
});
