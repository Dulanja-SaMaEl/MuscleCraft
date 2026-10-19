const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureAllSections() {
  const artifactDir = path.join('C:', 'Users', 'dulan', '.gemini', 'antigravity', 'brain', 'dce63ac5-4d05-4650-ae9b-3d26cae7b97d');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. DESKTOP SECTIONS (1440x900)
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);

  // Hero section
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_01_hero_desktop.png') });

  // Elevate Journey
  await desktopPage.evaluate(() => window.scrollTo({ top: 850, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_02_elevate_desktop.png') });

  // What We Offer
  await desktopPage.evaluate(() => window.scrollTo({ top: 1550, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_03_offer_desktop.png') });

  // About Section
  await desktopPage.evaluate(() => window.scrollTo({ top: 2200, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_04_about_desktop.png') });

  // Pricing Section
  await desktopPage.evaluate(() => window.scrollTo({ top: 2950, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_05_pricing_desktop.png') });

  // Reviews Section
  await desktopPage.evaluate(() => window.scrollTo({ top: 3800, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_06_reviews_desktop.png') });

  // Banner Section & FAQ
  await desktopPage.evaluate(() => window.scrollTo({ top: 4500, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_07_cta_faq_desktop.png') });

  // Contact & Map & Footer
  await desktopPage.evaluate(() => window.scrollTo({ top: 5400, behavior: 'instant' }));
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'section_08_footer_desktop.png') });

  await desktopContext.close();

  // 2. MOBILE SECTIONS (390x844)
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  // Mobile Hero
  await mobilePage.screenshot({ path: path.join(artifactDir, 'section_01_hero_mobile.png') });

  // Mobile Elevate & Offer
  await mobilePage.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'section_02_elevate_mobile.png') });

  // Mobile Pricing
  await mobilePage.evaluate(() => window.scrollTo({ top: 3200, behavior: 'instant' }));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'section_05_pricing_mobile.png') });

  await mobileContext.close();
  await browser.close();

  console.log('All section screenshots captured successfully.');
}

captureAllSections().catch(console.error);
