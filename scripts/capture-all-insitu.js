const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const sections = [
    { id: 'slide-elevate', name: '01_elevate' },
    { id: 'slide-offer', name: '02_offer' },
    { id: 'slide-about', name: '03_about' },
    { id: 'slide-pricing', name: '04_pricing' },
    { id: 'slide-reviews', name: '05_reviews' },
    { id: 'slide-faq', name: '06_faq' },
    { id: 'slide-contact', name: '07_contact' },
  ];

  for (const sec of sections) {
    const el = await page.$(`#${sec.id}`);
    if (!el) {
      console.error(`Section #${sec.id} not found!`);
      continue;
    }

    // Scroll element into view smoothly so ScrollTrigger fires naturally
    await el.scrollIntoViewIfNeeded();
    // Scroll a little further to center the section content
    await page.evaluate(() => window.scrollBy(0, 80));
    // Wait for the luxury 1.2s reveal animation to glide and settle
    await page.waitForTimeout(1400);

    const outPath = `C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/live_${sec.name}.png`;
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot for ${sec.id} -> ${outPath}`);
  }

  // Also test FAQ expand animation
  console.log('Testing FAQ accordion expand...');
  const firstFaqBtn = await page.locator('#slide-faq button').first();
  if (firstFaqBtn) {
    await firstFaqBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/live_06_faq_expanded.png' });
    console.log('Saved live_06_faq_expanded.png');
  }

  await browser.close();
  console.log('Capture finished.');
})();
