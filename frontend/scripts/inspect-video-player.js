const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // 1. Admin Video Preview Modal
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('admin');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('aside button:has-text("Session Videos Vault")').click();
  await page.waitForTimeout(1000);

  // Click Watch on first video card
  await page.locator('button:has-text("Watch")').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/auth-screenshots/admin-video-modal-open.png' });

  // 2. Client Athlete Video Tab
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('marcus@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('ClientPass2026!');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:3000/client', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Video Vault")').first().click();
  await page.waitForTimeout(1000);

  // Click on first video card in client portal
  await page.locator('div.group:has(img)').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/auth-screenshots/client-video-player-open.png' });

  await browser.close();
  console.log('Both video modal screenshots captured!');
})().catch(console.error);
