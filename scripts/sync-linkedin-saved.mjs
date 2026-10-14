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
      tags: bookmark.tags || ['linkedin', 'saved'],
    }),
  });
  return await resp.json();
}

async function main() {
  console.log('🚀 Starting LinkedIn Saved Posts Sync to Raindrop.io...\n');

  console.log('📁 Connecting to Raindrop.io...');
  const collectionId = await getOrCreateCollection('LinkedIn Saved');
  console.log(`✓ Target Collection: "LinkedIn Saved" (ID: ${collectionId})\n`);

  console.log('🍪 Checking LinkedIn cookies via sweet-cookie...');
  const { cookies } = await getCookies({ url: 'https://www.linkedin.com', browsers: ['chrome'] });
  const hasLiAt = cookies.some((c) => c.name === 'li_at');

  console.log('🌐 Launching browser...');
  // If not logged in, launch headed so user can log in or solve security check
  const browser = await chromium.launch({ headless: hasLiAt });
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
  console.log('Navigating to LinkedIn Saved Posts...');
  await page.goto('https://www.linkedin.com/my-items/saved-posts/', { waitUntil: 'domcontentloaded' });

  // If redirected to login, wait for user to sign in
  if (page.url().includes('/login') || page.url().includes('/uas/login')) {
    console.log('\n⚠️  LinkedIn login required.');
    console.log('👉 Please log in to your LinkedIn account in the opened browser window.');
    console.log('Waiting for login completion...');
    await page.waitForURL((url) => !url.toString().includes('/login') && !url.toString().includes('/uas/login'), {
      timeout: 180000,
    });
    console.log('✅ Logged in successfully!');
    await page.goto('https://www.linkedin.com/my-items/saved-posts/', { waitUntil: 'domcontentloaded' });
  }

  await page.waitForTimeout(3000);
  console.log(`Connected to: ${page.url()}\n`);

  const seenUrls = new Set();
  const bookmarks = [];
  let scrollAttempts = 0;
  const maxScrollAttempts = 6;

  console.log('📜 Scrolling and collecting saved LinkedIn posts...');
  while (scrollAttempts < maxScrollAttempts) {
    const rawPosts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/feed/update/urn:li:activity:"], a[href*="/posts/"]'));
      return links.map((a) => {
        const card = a.closest('.reusable-search__result-container, .feed-shared-update-v2, li') || a;
        const author = card.querySelector('.entity-result__title-text, .update-components-actor__name')?.innerText?.trim() || 'LinkedIn Post';
        const snippet = card.querySelector('.entity-result__summary, .feed-shared-update-v2__description')?.innerText?.trim() || '';
        return {
          url: a.href.split('?')[0],
          author,
          snippet,
        };
      });
    });

    let newFound = 0;
    for (const p of rawPosts) {
      if (p.url && !seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        bookmarks.push({
          url: p.url,
          title: p.author ? `${p.author}: ${p.snippet.slice(0, 50)}...` : 'LinkedIn Saved Post',
          excerpt: p.snippet,
          tags: ['linkedin', 'saved'],
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

  console.log(`\n🎉 Extracted ${bookmarks.length} saved posts from LinkedIn!`);

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
        console.log(`✓ [${synced}/${bookmarks.length}] Saved: ${b.title.slice(0, 50)}...`);
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

  console.log(`\n✨ LinkedIn Sync Complete! Synced: ${synced}, Errors: ${errors}`);
}

main().catch(console.error);
