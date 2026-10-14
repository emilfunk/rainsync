#!/usr/bin/env node
import { getCookies } from '@steipete/sweet-cookie';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const platforms = [
    { name: 'X / Twitter', url: 'https://x.com/' },
    { name: 'YouTube', url: 'https://www.youtube.com/' },
    { name: 'Instagram', url: 'https://www.instagram.com/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/' },
  ];

  console.log('🍪 Extracting cookies with @steipete/sweet-cookie...\n');

  const results = {};

  for (const { name, url } of platforms) {
    try {
      const { cookies, warnings } = await getCookies({
        url,
        browsers: ['chrome', 'brave', 'firefox'],
      });

      results[url] = cookies;
      console.log(`✓ ${name}: found ${cookies.length} cookies`);
      if (warnings && warnings.length > 0) {
        for (const w of warnings) {
          console.warn(`  ↳ warning: ${w}`);
        }
      }
    } catch (err) {
      console.error(`✗ ${name}: ${err?.message || String(err)}`);
    }
  }

  const outPath = path.resolve(process.cwd(), 'cookies-export.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n💾 Exported cookies to: ${outPath}`);
}

main().catch(console.error);
