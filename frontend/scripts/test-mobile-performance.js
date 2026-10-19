const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function runMobileAudit() {
  console.log('--- Launching Mobile Performance Audit (iPhone 14 Emulation) ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const startTime = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  const loadTimeMs = Date.now() - startTime;
  console.log(`Mobile page DOM ready in: ${loadTimeMs}ms`);

  // Wait 1.5s for initial animation
  await page.waitForTimeout(1500);

  // Capture Hero Mobile View
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_01_hero.png') });
  console.log('Captured: mobile_01_hero.png');

  // Smooth scroll through Hero beats
  console.log('Scrubbing through scrollytelling beats on mobile...');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_02_hero_beat2.png') });

  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_03_hero_beat3.png') });

  // Scroll to Elevate Journey
  await page.evaluate(() => {
    const el = document.getElementById('slide-elevate');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_04_elevate.png') });
  console.log('Captured: mobile_04_elevate.png');

  // Scroll to Offerings
  await page.evaluate(() => {
    const el = document.getElementById('slide-offer');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_05_offerings.png') });
  console.log('Captured: mobile_05_offerings.png');

  // Scroll to Pricing
  await page.evaluate(() => {
    const el = document.getElementById('slide-pricing');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_06_pricing.png') });
  console.log('Captured: mobile_06_pricing.png');

  // Scroll to Reviews
  await page.evaluate(() => {
    const el = document.getElementById('slide-reviews');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_07_reviews.png') });
  console.log('Captured: mobile_07_reviews.png');

  // Scroll to FAQ
  await page.evaluate(() => {
    const el = document.getElementById('slide-faq');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_08_faq.png') });
  console.log('Captured: mobile_08_faq.png');

  // Scroll to Contact
  await page.evaluate(() => {
    const el = document.getElementById('slide-contact');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_09_contact.png') });
  console.log('Captured: mobile_09_contact.png');

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  }

  await browser.close();
  console.log('--- Mobile Performance Audit Complete! ---');
}

runMobileAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
