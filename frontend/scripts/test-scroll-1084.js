const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function testScrollAnimation() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  // Test at the user's exact screen width (1084 x 700)
  const page = await browser.newPage({ viewport: { width: 1084, height: 700 } });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot at scroll 0
  await page.screenshot({ path: path.join(OUT_DIR, 'hero_at_1084px.png') });
  console.log('Captured hero_at_1084px.png');

  // Check the headline HTML and dimensions
  const headlineInfo = await page.evaluate(() => {
    const h1 = document.querySelector('#scrolly-hero h1');
    return {
      text: h1 ? h1.innerText : null,
      html: h1 ? h1.innerHTML : null,
      width: h1 ? h1.offsetWidth : 0,
      height: h1 ? h1.offsetHeight : 0,
      computedStyle: h1 ? {
        fontSize: window.getComputedStyle(h1).fontSize,
        lineHeight: window.getComputedStyle(h1).lineHeight,
      } : null,
    };
  });
  console.log('Headline Info:', headlineInfo);

  // Scroll down 1500px and check if canvas changes
  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'hero_scrolled_1500px.png') });
  console.log('Captured hero_scrolled_1500px.png');

  await browser.close();
}

testScrollAnimation().catch(console.error);
