const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureAuthScreenshots() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const outDir = 'C:\\Users\\dulan\\.gemini\\antigravity\\brain\\dce63ac5-4d05-4650-ae9b-3d26cae7b97d\\auth-screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('📸 Capturing Registration and Auth UI Screenshots...');

  // 1. Register Tab
  await page.goto('http://localhost:3000/login?tab=register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-registration-tab-custom-password.png'), fullPage: false });
  console.log('✅ Captured 01-registration-tab-custom-password.png');

  // 2. Sign In Tab
  await page.locator('button:has-text("Sign In")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '02-sign-in-tab.png'), fullPage: false });
  console.log('✅ Captured 02-sign-in-tab.png');

  // 3. Checkout with Guest Password Creation
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '03-checkout-guest-account-creation.png'), fullPage: false });
  console.log('✅ Captured 03-checkout-guest-account-creation.png');

  await browser.close();
  console.log('✨ All Auth & Registration screenshots captured successfully!');
}

captureAuthScreenshots().catch(console.error);
