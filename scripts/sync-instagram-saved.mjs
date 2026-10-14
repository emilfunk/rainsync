import { getCookies } from '@steipete/sweet-cookie';
import { chromium } from 'playwright';
import fs from 'fs';

let raindropToken = '';
try {
  const envContent = fs.readFileSync('/Users/emilfunk/raindrop/.env', 'utf-8');
  const match = envContent.match(/RAINDROP_TOKEN=(.+)/);
  if (match) raindropToken = match[1].trim();
} catch (err) {
  console.error('Failed to read Raindrop token:', err.message);
  process.exit(1);
}

async function getOrCreateCollection(name) {
  const resp = await fetch('https://api.raindrop.io/rest/v1/collections', {
    headers: { Authorization: `Bearer ${raindropToken}` },
  });
  const data = await resp.json();
  const existing = data.items?.find((c) => c.title.toLowerCase() === name.toLowerCase());
  if (existing) return existing._id;

  const createResp = await fetch('https://api.raindrop.io/rest/v1/collection', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${raindropToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: name, view: 'grid' }),
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
      cover: bookmark.cover,
      collection: { $id: collectionId },
      tags: bookmark.tags || ['instagram', 'saved'],
    }),
  });
  return await resp.json();
}

async function main() {
  console.log('🚀 Starting Instagram Saved Posts Sync to Raindrop.io...\n');

  console.log('📁 Connecting to Raindrop.io...');
  const collectionId = await getOrCreateCollection('Instagram Saved');
  console.log(`✓ Target Collection: "Instagram Saved" (ID: ${collectionId})\n`);

  console.log('🍪 Checking Instagram cookies via sweet-cookie...');
  const { cookies } = await getCookies({ url: 'https://www.instagram.com', browsers: ['chrome'] });
  const hasSession = cookies.some((c) => c.name === 'sessionid');

  console.log('🌐 Launching browser...');
  const browser = await chromium.launch({ headless: hasSession });
  const context = await browser.newContext();

  if (cookies && cookies.length > 0) {
    const pwCookies = cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain.startsWith('.') ? c.domain : '.' + c.domain,
      path: c.path || '/',
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite || 'Lax',
    }));
    await context.addCookies(pwCookies);
  }

  const page = await context.newPage();
  console.log('Navigating to Instagram Saved Posts...');
  await page.goto('https://www.instagram.com/your_activity/saved/all-posts/', { waitUntil: 'domcontentloaded' });

  // If redirected to login, wait for user to sign in
  if (page.url().includes('/accounts/login') || page.url().includes('/login/')) {
    console.log('\n⚠️  Instagram login required.');
    console.log('👉 Please log in to your Instagram account in the opened browser window.');
    console.log('Waiting for login completion...');
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 180000 });
    console.log('✅ Logged in successfully!');
    await page.goto('https://www.instagram.com/your_activity/saved/all-posts/', { waitUntil: 'domcontentloaded' });
  }

  await page.waitForTimeout(3000);
  console.log(`Connected to: ${page.url()}\n`);

  const seenUrls = new Set();
  const bookmarks = [];
  let scrollAttempts = 0;
  const maxScrollAttempts = 6;

  console.log('📜 Scrolling and collecting saved Instagram posts...');
  while (scrollAttempts < maxScrollAttempts) {
    const rawPosts = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      return anchors.map((a) => {
        const img = a.querySelector('img');
        const alt = img?.alt || 'Instagram Post';
        const src = img?.src || '';
        return {
          url: a.href.split('?')[0],
          title: alt.slice(0, 80),
          cover: src,
        };
      });
    });

    let newFound = 0;
    for (const p of rawPosts) {
      if (p.url && !seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        bookmarks.push({
          url: p.url,
          title: p.title || 'Instagram Saved Post',
          cover: p.cover,
          tags: ['instagram', 'saved'],
        });
        newFound++;
      }
    }

    if (newFound > 0) {
      console.log(`   Found ${newFound} new posts (Total: ${bookmarks.length})`);
      scrollAttempts = 0;
    } else {
      scrollAttempts++;
    }

    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(2000);
  }

  await browser.close();

  console.log(`\n🎉 Extracted ${bookmarks.length} saved posts from Instagram!`);

  if (bookmarks.length === 0) {
    console.log('No saved posts found to sync.');
    return;
  }

  console.log(`\n⚡ Uploading ${bookmarks.length} posts to Raindrop.io...`);
  let synced = 0;
  let errors = 0;

  for (const b of bookmarks) {
    try {
      const res = await addBookmarkToRaindrop(collectionId, b);
      if (res.result) {
        synced++;
        console.log(`✓ [${synced}/${bookmarks.length}] Saved: ${b.url}`);
      } else {
        errors++;
        console.warn(`✗ Failed: ${b.url}`);
      }
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      errors++;
      console.error(`✗ Error saving ${b.url}:`, err.message);
    }
  }

  console.log(`\n✨ Instagram Sync Complete! Synced: ${synced}, Errors: ${errors}`);
}

main().catch(console.error);
