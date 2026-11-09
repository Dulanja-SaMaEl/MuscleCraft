const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve('C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/admin-screenshots');
const BASE_URL = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  console.log('1. Verifying public navbar top bar is REMOVED...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const personaBar = await page.$('text=Live Persona:');
  console.log(`Live Persona Bar visible? ${personaBar !== null ? 'YES (ERROR)' : 'NO (CORRECT - REMOVED)'}`);

  const publicNavbarScreenshot = path.join(OUTPUT_DIR, 'public-navbar-clean.png');
  await page.screenshot({ path: publicNavbarScreenshot, clip: { x: 0, y: 0, width: 1440, height: 180 } });
  console.log(`✓ Saved: public-navbar-clean.png`);

  console.log('\n2. Verifying passwordless / pass-through login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  
  // Test: Login with admin email and completely random gibberish password "anything123"
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('randomgibberishpassword');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(2000);
  console.log(`Current URL after password pass-through login: ${page.url()}`);
  const loginPassed = page.url().includes('/admin');
  console.log(`Login passed successfully? ${loginPassed ? 'YES' : 'NO'}`);

  console.log('\n3. Verifying admin navigation bar sidebar layout...');
  const sidebar = await page.locator('aside').first();
  const sidebarScreenshot = path.join(OUTPUT_DIR, 'admin-sidebar-fixed.png');
  await sidebar.screenshot({ path: sidebarScreenshot });
  console.log(`✓ Saved: admin-sidebar-fixed.png`);

  await browser.close();
  console.log('\nVerification completed!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
