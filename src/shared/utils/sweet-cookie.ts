import { logger } from './logger';
import { getStorage, setStorage } from './storage';

export type SweetCookieSameSite = 'Strict' | 'Lax' | 'None';

export interface ExportedCookie {
  name: string;
  value: string;
  domain?: string;
  hostOnly?: boolean;
  path?: string;
  expires?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: SweetCookieSameSite;
}

export interface SweetCookiePayload {
  version: 1;
  generatedAt: string;
  source: 'sweet-cookie';
  browser: 'chrome';
  targetUrl: string;
  origins: string[];
  cookies: ExportedCookie[];
}

export const SWEET_COOKIE_STORAGE_KEY = 'sweet-cookie.payload';
export const SWEET_COOKIE_UPDATED_KEY = 'sweet-cookie.lastUpdated';

export const DEFAULT_PLATFORM_ORIGINS = [
  'https://x.com',
  'https://twitter.com',
  'https://www.youtube.com',
  'https://www.instagram.com',
  'https://www.linkedin.com',
];

/**
 * Normalizes sameSite value to match Sweet Cookie schema
 */
export function normalizeSameSite(
  value: chrome.cookies.Cookie['sameSite']
): SweetCookieSameSite | undefined {
  if (value === 'strict') return 'Strict';
  if (value === 'lax') return 'Lax';
  if (value === 'no_restriction') return 'None';
  return undefined;
}

/**
 * Maps a Chrome API cookie to Sweet Cookie ExportedCookie schema
 * Excludes Chromium partitioned cookies per sweet-cookie spec
 */
export function mapChromeCookie(cookie: chrome.cookies.Cookie): ExportedCookie | null {
  const partitionKey = (cookie as { partitionKey?: unknown }).partitionKey;
  if (partitionKey !== undefined && partitionKey !== null) {
    return null;
  }

  const result: ExportedCookie = {
    name: cookie.name,
    value: cookie.value,
    hostOnly: cookie.hostOnly,
  };

  const domain = cookie.domain?.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
  if (domain) {
    result.domain = domain;
  }

  if (cookie.path) {
    result.path = cookie.path;
  }

  if (
    !cookie.session &&
    typeof cookie.expirationDate === 'number' &&
    Number.isFinite(cookie.expirationDate)
  ) {
    result.expires = Math.round(cookie.expirationDate);
  }

  if (cookie.secure) {
    result.secure = true;
  }
  if (cookie.httpOnly) {
    result.httpOnly = true;
  }

  const sameSite = normalizeSameSite(cookie.sameSite);
  if (sameSite) {
    result.sameSite = sameSite;
  }

  return result;
}

export function exportedCookieKey(cookie: ExportedCookie, storeId = ''): string {
  const scope = cookie.hostOnly === true ? 'host' : 'domain';
  return `${cookie.name}|${cookie.domain ?? ''}|${scope}|${cookie.path ?? ''}|${storeId}`;
}

/**
 * Captures cookies from Chrome for target origins and stores them in Sweet Cookie format
 */
export async function captureAndStoreCookies(origins: string[] = DEFAULT_PLATFORM_ORIGINS): Promise<SweetCookiePayload> {
  if (typeof chrome === 'undefined' || !chrome.cookies) {
    throw new Error('Chrome cookies API is not available');
  }

  const cookieMap = new Map<string, ExportedCookie>();

  for (const origin of origins) {
    try {
      const chromeCookies = await chrome.cookies.getAll({ url: origin });
      for (const raw of chromeCookies) {
        const mapped = mapChromeCookie(raw);
        if (mapped) {
          const key = exportedCookieKey(mapped, raw.storeId);
          cookieMap.set(key, mapped);
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch cookies for origin ${origin}:`, { err });
    }
  }

  const cookies = Array.from(cookieMap.values());
  const payload: SweetCookiePayload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'sweet-cookie',
    browser: 'chrome',
    targetUrl: origins[0] || 'https://x.com',
    origins,
    cookies,
  };

  // Save to storage
  await setStorage(SWEET_COOKIE_STORAGE_KEY as any, payload);
  await setStorage(SWEET_COOKIE_UPDATED_KEY as any, Date.now());

  logger.info(`Stored ${cookies.length} cookies in sweet-cookie format across ${origins.length} origins`);
  return payload;
}

/**
 * Get currently stored Sweet Cookie payload from storage
 */
export async function getStoredCookies(): Promise<{ payload: SweetCookiePayload | null; lastUpdated?: number }> {
  const payload = (await getStorage(SWEET_COOKIE_STORAGE_KEY as any)) as SweetCookiePayload | null;
  const lastUpdated = (await getStorage(SWEET_COOKIE_UPDATED_KEY as any)) as number | undefined;
  return { payload, lastUpdated };
}
