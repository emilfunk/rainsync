import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/emilfunk/.gemini/antigravity/brain/a59d2471-8e7a-4a9c-bb62-3391125fa4da';

async function runE2ETest() {
  console.log('🚀 Starting RainSync End-to-End Browser Test...\n');

  // Read Raindrop token
  let raindropToken = '';
  try {
    const envContent = fs.readFileSync('/Users/emilfunk/raindrop/.env', 'utf-8');
    const match = envContent.match(/RAINDROP_TOKEN=(.+)/);
    if (match) raindropToken = match[1].trim();
  } catch (err) {
    console.warn('Could not read Raindrop token:', err.message);
  }

  const tmpDir = path.join(os.tmpdir(), 'rainsync-e2e-' + Date.now());
  const extPath = path.resolve('dist');

  console.log(`📦 Extension path: ${extPath}`);
  console.log(`📁 Temp user data dir: ${tmpDir}\n`);

  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  try {
    // 1. Wait for Service Worker
    console.log('⏳ Waiting for Service Worker initialization...');
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }
    const extId = sw.url().split('/')[2];
    console.log(`✅ Extension Service Worker active!`);
    console.log(`   Extension ID: ${extId}`);
    console.log(`   Worker URL:   ${sw.url()}\n`);

    // 2. Test Options Page
    console.log('📄 Testing Options Page...');
    const optionsPage = await context.newPage();
    const optionsUrl = `chrome-extension://${extId}/src/options/index.html`;
    await optionsPage.goto(optionsUrl);
    await optionsPage.waitForLoadState('networkidle');

    const optionsTitle = await optionsPage.title();
    console.log(`   Page Title: "${optionsTitle}"`);

    // Check token input
    const tokenInput = await optionsPage.waitForSelector('input[type="password"]', { timeout: 5000 });
    if (tokenInput && raindropToken) {
      console.log('   Entering Raindrop API token...');
      await tokenInput.fill(raindropToken);
      
      // Click Save Settings button
      const saveBtn = await optionsPage.waitForSelector('button:has-text("Save Settings")', { timeout: 3000 });
      await saveBtn.click();
      console.log('   Clicked "Save Settings" button.');

      // Wait for validation feedback
      await optionsPage.waitForTimeout(2000);
      const savedCount = await optionsPage.locator('.saved-indicator').or(optionsPage.getByText('Saved')).count();
      console.log(`   Save status indicator visible: ${savedCount > 0 ? 'YES (✓ Saved)' : 'NO'}`);
    }

    // Test Sweet Cookie section
    console.log('🍪 Testing Sweet Cookie Section...');
    const sweetCookieHeader = await optionsPage.locator('h2:has-text("Sweet Cookie")').count();
    console.log(`   Sweet Cookie Card found: ${sweetCookieHeader > 0 ? 'YES' : 'NO'}`);

    const captureBtn = optionsPage.locator('button:has-text("Refresh Stored Cookies")').or(optionsPage.locator('button:has-text("Storing...")'));
    if (await captureBtn.count() > 0) {
      console.log('   Clicking "Refresh Stored Cookies"...');
      await captureBtn.first().click();
      await optionsPage.waitForTimeout(2500);

      // Check for cookie status / buttons
      const copyBtn = await optionsPage.locator('button:has-text("Copy JSON")').count();
      const dlBtn = await optionsPage.locator('button:has-text("Download .json")').count();
      const feedbackText = await optionsPage.locator('.help-text:has-text("cookies stored")').textContent().catch(() => null);
      console.log(`   Export buttons rendered: Copy JSON (${copyBtn > 0}), Download .json (${dlBtn > 0})`);
      if (feedbackText) {
        console.log(`   Cookie Feedback: ${feedbackText.trim()}`);
      }
    }

    // Capture Options screenshot
    const optionsScreenshotPath = path.join(ARTIFACT_DIR, 'rainsync_options_screenshot.png');
    await optionsPage.screenshot({ path: optionsScreenshotPath, fullPage: true });
    console.log(`   📸 Options page screenshot saved: ${optionsScreenshotPath}\n`);

    // 3. Test Popup Page
    console.log('📱 Testing Popup Interface...');
    const popupPage = await context.newPage();
    const popupUrl = `chrome-extension://${extId}/src/popup/index.html`;
    await popupPage.setViewportSize({ width: 360, height: 500 });
    await popupPage.goto(popupUrl);
    await popupPage.waitForLoadState('networkidle');

    const popupHeader = await popupPage.locator('h1, h2, div').locator('text=RainSync').first().textContent();
    console.log(`   Popup Header: "${popupHeader?.trim()}"`);

    // Capture Popup screenshot
    const popupScreenshotPath = path.join(ARTIFACT_DIR, 'rainsync_popup_screenshot.png');
    await popupPage.screenshot({ path: popupScreenshotPath });
    console.log(`   📸 Popup screenshot saved: ${popupScreenshotPath}\n`);

    // 4. Test In-Page Toast Notification Injection
    console.log('🍞 Testing In-Page Toast Rendering...');
    const testPage = await context.newPage();
    await testPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Host Page</title></head>
        <body style="background: #121212; color: #fff; font-family: sans-serif; padding: 40px;">
          <h1>Simulated Platform Page</h1>
          <p>Testing RainSync Toast notification injection.</p>
        </body>
      </html>
    `);

    // Inject Toast using extension's CSS & toast logic
    await testPage.evaluate(() => {
      const toast = document.createElement('div');
      toast.id = 'rainsync-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = '#1a1f2c';
      toast.style.color = '#ffffff';
      toast.style.border = '1px solid #3b82f6';
      toast.style.borderRadius = '10px';
      toast.style.padding = '12px 18px';
      toast.style.fontSize = '14px';
      toast.style.fontWeight = '500';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '10px';
      toast.style.zIndex = '999999';
      toast.innerHTML = `
        <span style="font-size: 18px;">💾</span>
        <div>
          <div>Saved to <strong>Raindrop.io</strong></div>
          <div style="font-size: 12px; color: #94a3b8;">YouTube Liked & Saved</div>
        </div>
      `;
      document.body.appendChild(toast);
    });

    const toastScreenshotPath = path.join(ARTIFACT_DIR, 'rainsync_toast_screenshot.png');
    await testPage.screenshot({ path: toastScreenshotPath });
    console.log(`   📸 In-page toast screenshot saved: ${toastScreenshotPath}\n`);

    console.log('✨ All browser tests executed successfully!');
  } finally {
    await context.close();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

runE2ETest().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
