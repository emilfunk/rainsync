import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mapChromeCookie,
  normalizeSameSite,
  exportedCookieKey,
  captureAndStoreCookies,
  getStoredCookies,
  SWEET_COOKIE_STORAGE_KEY,
} from '../src/shared/utils/sweet-cookie';

vi.mock('../src/shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('Sweet Cookie Integration', () => {
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    mockStorage = {};
    (global as any).chrome = {
      storage: {
        local: {
          get: vi.fn((keys, cb) => {
            if (typeof keys === 'string') {
              const res = { [keys]: mockStorage[keys] };
              if (cb) cb(res);
              return Promise.resolve(res);
            }
            if (cb) cb(mockStorage);
            return Promise.resolve(mockStorage);
          }),
          set: vi.fn((items, cb) => {
            Object.assign(mockStorage, items);
            if (cb) cb();
            return Promise.resolve();
          }),
        },
      },
      cookies: {
        getAll: vi.fn().mockImplementation(({ url }) => {
          if (url.includes('x.com')) {
            return Promise.resolve([
              {
                name: 'auth_token',
                value: 'token_x_123',
                domain: '.x.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'no_restriction',
                hostOnly: false,
                session: false,
                expirationDate: 1799999999,
                storeId: '0',
              },
            ]);
          }
          if (url.includes('youtube.com')) {
            return Promise.resolve([
              {
                name: 'LOGIN_INFO',
                value: 'yt_login_abc',
                domain: '.youtube.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                hostOnly: false,
                session: true,
                storeId: '0',
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
    };
  });

  it('normalizes sameSite correctly', () => {
    expect(normalizeSameSite('strict')).toBe('Strict');
    expect(normalizeSameSite('lax')).toBe('Lax');
    expect(normalizeSameSite('no_restriction')).toBe('None');
    expect(normalizeSameSite(undefined as any)).toBeUndefined();
  });

  it('maps Chrome cookie to sweet-cookie ExportedCookie schema', () => {
    const raw: any = {
      name: 'li_at',
      value: 'linkedin_token_val',
      domain: '.linkedin.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'no_restriction',
      hostOnly: false,
      session: false,
      expirationDate: 1799999999.4,
    };

    const mapped = mapChromeCookie(raw);
    expect(mapped).toEqual({
      name: 'li_at',
      value: 'linkedin_token_val',
      domain: 'linkedin.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'None',
      hostOnly: false,
      expires: 1799999999,
    });
  });

  it('ignores partitioned cookies per sweet-cookie specification', () => {
    const raw: any = {
      name: 'partitioned_cookie',
      value: 'val',
      partitionKey: { topLevelSite: 'https://example.com' },
    };

    expect(mapChromeCookie(raw)).toBeNull();
  });

  it('creates stable cookie key for deduplication', () => {
    const cookie = {
      name: 'session',
      domain: 'example.com',
      hostOnly: true,
      path: '/api',
      value: 'val',
    };

    expect(exportedCookieKey(cookie, '0')).toBe('session|example.com|host|/api|0');
  });

  it('captures cookies across target origins and stores Sweet Cookie payload', async () => {
    const payload = await captureAndStoreCookies(['https://x.com', 'https://www.youtube.com']);

    expect(payload.version).toBe(1);
    expect(payload.source).toBe('sweet-cookie');
    expect(payload.browser).toBe('chrome');
    expect(payload.cookies.length).toBe(2);
    expect(payload.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'auth_token', domain: 'x.com', sameSite: 'None' }),
        expect.objectContaining({ name: 'LOGIN_INFO', domain: 'youtube.com', sameSite: 'Lax' }),
      ])
    );

    const stored = await getStoredCookies();
    expect(stored.payload).not.toBeNull();
    expect(stored.payload?.cookies.length).toBe(2);
    expect(stored.lastUpdated).toBeDefined();
  });
});
