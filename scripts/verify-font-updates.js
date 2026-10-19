const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyFontUpdates() {
  const artifactDir = path.join('C:', 'Users', 'dulan', '.gemini', 'antigravity', 'brain', 'dce63ac5-4d05-4650-ae9b-3d26cae7b97d');

  const consoleErrors = [];

  console.log('Testing updated fonts & high-res image across viewports...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Desktop 1440x900
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);

  // Capture Updated Desktop Hero
  const heroPath = path.join(artifactDir, 'hero_desktop_updated.png');
  await desktopPage.screenshot({ path: heroPath });
  console.log(`Saved: ${heroPath}`);

  // Capture Elevate section
  await desktopPage.evaluate(() => window.scrollTo({ top: 950, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  const elevatePath = path.join(artifactDir, 'elevate_desktop_updated.png');
  await desktopPage.screenshot({ path: elevatePath });
  console.log(`Saved: ${elevatePath}`);

  // Capture What We Offer
  await desktopPage.evaluate(() => window.scrollTo({ top: 1750, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  const offerPath = path.join(artifactDir, 'offer_desktop_updated.png');
  await desktopPage.screenshot({ path: offerPath });
  console.log(`Saved: ${offerPath}`);

  // Capture Updated Pricing
  await desktopPage.evaluate(() => window.scrollTo({ top: 3350, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  const pricingPath = path.join(artifactDir, 'pricing_desktop_updated.png');
  await desktopPage.screenshot({ path: pricingPath });
  console.log(`Saved: ${pricingPath}`);

  // Measure FPS
  const fps = await desktopPage.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 1500) {
          requestAnimationFrame(count);
        } else {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        }
      }
      requestAnimationFrame(count);
    });
  });

  console.log(`Desktop Render FPS: ${fps}`);
  await desktopContext.close();

  // 2. Mobile 390x844
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  const mobileHeroPath = path.join(artifactDir, 'hero_mobile_updated.png');
  await mobilePage.screenshot({ path: mobileHeroPath });
  console.log(`Saved: ${mobileHeroPath}`);

  await mobileContext.close();
  await browser.close();

  console.log(`Total Console Errors: ${consoleErrors.length}`);
  console.log('Font updates verification finished successfully.');
}

verifyFontUpdates().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
