const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const videoDir = path.join(process.cwd(), 'playwright_video');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    recordVideo: { dir: videoDir, size: { width: 1366, height: 768 } }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll down smoothly through the entire page like a human
  for (let i = 0; i <= 60; i++) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(2000);
  await context.close();
  await browser.close();

  const files = fs.readdirSync(videoDir);
  console.log('Video recorded:', files);
})();
