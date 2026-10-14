import { getCookies } from '@steipete/sweet-cookie';
import { chromium } from 'playwright';
import fs from 'fs';

// 1. Read Raindrop Token
let raindropToken = '';
try {
  const envContent = fs.readFileSync('/Users/emilfunk/raindrop/.env', 'utf-8');
  const match = envContent.match(/RAINDROP_TOKEN=(.+)/);
  if (match) raindropToken = match[1].trim();
} catch (err) {
  console.error('Failed to read Raindrop token:', err.message);
  process.exit(1);
}

// 2. Raindrop API Helpers
async function getOrCreateCollection(name) {
  const resp = await fetch('https://api.raindrop.io/rest/v1/collections', {
    headers: { Authorization: `Bearer ${raindropToken}` },
  });
  const data = await resp.json();
  const existing = data.items?.find((c) => c.title.toLowerCase() === name.toLowerCase());
  if (existing) {
    return existing._id;
  }

  // Create new collection
  const createResp = await fetch('https://api.raindrop.io/rest/v1/collection', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${raindropToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: name, view: 'list' }),
  });
  const created = await createResp.json();
  return created.item._id;
}

async function addBookmarkToRaindrop(collectionId, bookmark) {
  const resp = await fetch('https://api.raindrop.io/rest/v1/raindrop', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${raindropToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      link: bookmark.url,
      title: bookmark.title,
      excerpt: bookmark.excerpt,
      collection: { $id: collectionId },
      tags: bookmark.tags || ['twitter', 'bookmark'],
    }),
  });
  return await resp.json();
}

async function main() {
  console.log('🚀 Starting X/Twitter Bookmarks Sync to Raindrop.io...\n');

  console.log('📁 Connecting to Raindrop.io...');
  const collectionId = await getOrCreateCollection('Twitter Bookmarks');
  console.log(`✓ Target Collection: "Twitter Bookmarks" (ID: ${collectionId})\n`);

  // Extract cookies
  console.log('🍪 Reading X session cookies from Chrome...');
  const { cookies } = await getCookies({ url: 'https://x.com', browsers: ['chrome'] });
  if (!cookies || cookies.length === 0) {
    console.error('No X cookies found. Please make sure you are logged into X in Chrome.');
    process.exit(1);
  }

  const pwCookies = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain.startsWith('.') ? c.domain : '.' + c.domain,
    path: c.path || '/',
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite || 'Lax',
  }));

  console.log('🌐 Launching browser to scrape bookmarks...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(pwCookies);

  const page = await context.newPage();
  await page.goto('https://x.com/i/bookmarks', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);

  // Click on 'Bookmarks' tab if on history page
  const tab = page.locator('div[role="tablist"] a:has-text("Bookmarks")');
  if ((await tab.count()) > 0) {
    await tab.click();
    await page.waitForTimeout(3000);
  }

  console.log(`Connected to page: ${page.url()}\n`);

  const seenUrls = new Set();
  const bookmarks = [];

  let scrollAttempts = 0;
  const maxScrollAttempts = 6;

  console.log('📜 Scrolling and collecting bookmarks...');
  while (scrollAttempts < maxScrollAttempts) {
    const rawTweets = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
      return articles.map((art) => {
        const timeAnchor = art.querySelector('time')?.closest('a');
        const url = timeAnchor?.href || '';
        const authorEl = art.querySelector('div[data-testid="User-Name"]');
        const author = authorEl?.innerText?.split('\n')?.[0]?.trim() || 'Twitter User';
        const handle = authorEl?.innerText?.split('\n')?.[1]?.trim() || '';
        const textEl = art.querySelector('div[data-testid="tweetText"]');
        const text = textEl?.innerText?.trim() || '';
        return { url, author, handle, text };
      });
    });

    let newFound = 0;
    for (const t of rawTweets) {
      if (t.url && !seenUrls.has(t.url)) {
        seenUrls.add(t.url);
        bookmarks.push({
          url: t.url,
          title: `${t.author} (${t.handle}): "${t.text.slice(0, 60)}..."`,
          excerpt: t.text,
          tags: ['twitter', 'bookmark', t.handle.replace('@', '')].filter(Boolean),
        });
        newFound++;
      }
    }

    if (newFound > 0) {
      console.log(`   Found ${newFound} new bookmarks (Total: ${bookmarks.length})`);
      scrollAttempts = 0;
    } else {
      scrollAttempts++;
    }

    // Scroll
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(2000);
  }

  await browser.close();

  console.log(`\n🎉 Extracted ${bookmarks.length} total bookmarks from X!`);

  if (bookmarks.length === 0) {
    console.log('No bookmarks found to sync.');
    return;
  }

  console.log(`\n⚡ Uploading ${bookmarks.length} bookmarks to Raindrop.io...`);
  let synced = 0;
  let errors = 0;

  for (const b of bookmarks) {
    try {
      const res = await addBookmarkToRaindrop(collectionId, b);
      if (res.result) {
        synced++;
        console.log(`✓ [${synced}/${bookmarks.length}] Saved: ${b.title.slice(0, 50)}...`);
      } else {
        errors++;
        console.warn(`✗ Failed: ${b.url} - ${res.errorMessage || 'unknown'}`);
      }
      // Rate limit delay
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      errors++;
      console.error(`✗ Error saving ${b.url}:`, err.message);
    }
  }

  console.log(`\n✨ X Sync Complete! Synced: ${synced}, Errors: ${errors}`);
}

main().catch(console.error);
