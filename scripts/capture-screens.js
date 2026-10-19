const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Typical user desktop resolution
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot at scroll positions corresponding to each beat and section
  const scrollPositions = [
    { name: '00_hero_beat1', y: 0 },
    { name: '01_hero_beat2', y: 700 },
    { name: '02_hero_beat3', y: 1200 },
    { name: '03_hero_beat4', y: 1700 },
    { name: '04_marquee', y: 2200 },
    { name: '05_elevate_entering', y: 2600 },
    { name: '06_elevate_center', y: 3000 },
    { name: '07_offer_entering', y: 3500 },
    { name: '08_offer_center', y: 3900 },
    { name: '09_about_center', y: 4800 },
    { name: '10_pricing_center', y: 5700 },
  ];

  for (const pos of scrollPositions) {
    await page.evaluate((targetY) => window.scrollTo(0, targetY), pos.y);
    await page.waitForTimeout(400); // Wait for frame
    const p = path.join(process.cwd(), `screen_${pos.name}.png`);
    await page.screenshot({ path: p });
    console.log(`Saved screenshot ${pos.name} at y=${pos.y}`);
  }

  await browser.close();
})();
