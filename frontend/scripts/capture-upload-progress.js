const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login as admin
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('admin');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  // Navigate to Videos Vault
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('aside button:has-text("Session Videos Vault")').click();
  await page.waitForTimeout(1000);

  // Open modal
  await page.locator('button:has-text("Submit New Session Video")').click();
  await page.waitForTimeout(600);

  // Set file
  const testFile = path.join(__dirname, 'test-temp-clip.mp4');
  fs.writeFileSync(testFile, Buffer.alloc(1024 * 1024 * 5)); // 5MB
  await page.setInputFiles('#videoFileInput', testFile);
  await page.waitForTimeout(500);

  // Scroll to progress section
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('form .overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/video-screenshots/03-video-upload-percentage-progress.png' });
  console.log('Upload progress screenshot updated successfully!');
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  await browser.close();
})().catch(console.error);
