const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function recordMotionSite() {
  console.log('--- Starting Motion Site Verification & Recording ---');
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
    ],
  });

  const consoleLogs = [];

  // ==========================================
  // 1. DESKTOP RECORDING (1440 x 900)
  // ==========================================
  console.log('Recording Desktop 1440px...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: ARTIFACT_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const desktopPage = await desktopContext.newPage();
  desktopPage.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[DESKTOP CONSOLE ${msg.type()}]: ${text}`);
    console.log(`[DESKTOP CONSOLE]: ${text}`);
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2800); // Wait for preloader curtain and hero entrance to complete

  // Capture Desktop Hero Screenshot with Fallback Shader
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'motion_site_hero_1440_fallback.png'),
  });
  console.log('Saved motion_site_hero_1440_fallback.png');

  // Smooth top-to-bottom scroll
  const desktopTotalHeight = await desktopPage.evaluate(() => document.body.scrollHeight);
  console.log(`Desktop page scroll height: ${desktopTotalHeight}px`);

  // Step scroll down
  const steps = 30;
  for (let i = 1; i <= steps; i++) {
    const targetY = (desktopTotalHeight / steps) * i;
    await desktopPage.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), targetY);
    await desktopPage.waitForTimeout(250);
  }
  await desktopPage.waitForTimeout(1000);

  // Capture Desktop Pricing Card Screenshot to verify title wrapping & badge
  const pricingCard = desktopPage.locator('.pricing-flagship-card');
  if (await pricingCard.count() > 0) {
    await pricingCard.first().scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'motion_site_pricing_1440.png'),
    });
    console.log('Saved motion_site_pricing_1440.png');
  }

  // Close context to finalize video
  await desktopContext.close();
  const desktopVideoPage = desktopPage.video();
  let desktopVideoPath = '';
  if (desktopVideoPage) {
    desktopVideoPath = await desktopVideoPage.path();
    const finalDesktopPath = path.join(ARTIFACT_DIR, 'motion_site_scroll_1440.webm');
    fs.copyFileSync(desktopVideoPath, finalDesktopPath);
    console.log(`Final Desktop Video: ${finalDesktopPath}`);
  }

  // ==========================================
  // 2. MOBILE RECORDING (390 x 844)
  // ==========================================
  console.log('Recording Mobile 390px (iPhone 14 / modern standard)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: ARTIFACT_DIR,
      size: { width: 390, height: 844 },
    },
  });

  const mobilePage = await mobileContext.newPage();
  mobilePage.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[MOBILE CONSOLE ${msg.type()}]: ${text}`);
    console.log(`[MOBILE CONSOLE]: ${text}`);
  });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2800); // Wait for preloader curtain and hero entrance to complete

  // Capture Mobile Hero Screenshot with Fallback Shader
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'motion_site_hero_390_fallback.png'),
  });
  console.log('Saved motion_site_hero_390_fallback.png');

  // Smooth top-to-bottom scroll for Mobile
  const mobileTotalHeight = await mobilePage.evaluate(() => document.body.scrollHeight);
  console.log(`Mobile page scroll height: ${mobileTotalHeight}px`);

  const mobileSteps = 35;
  for (let i = 1; i <= mobileSteps; i++) {
    const targetY = (mobileTotalHeight / mobileSteps) * i;
    await mobilePage.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), targetY);
    await mobilePage.waitForTimeout(250);
  }
  await mobilePage.waitForTimeout(1000);

  // Capture Mobile Flagship Pricing Card
  const mobilePricingCard = mobilePage.locator('.pricing-flagship-card');
  if (await mobilePricingCard.count() > 0) {
    await mobilePricingCard.first().scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, 'motion_site_pricing_390.png'),
    });
    console.log('Saved motion_site_pricing_390.png');
  }

  await mobileContext.close();
  const mobileVideoPage = mobilePage.video();
  let mobileVideoPath = '';
  if (mobileVideoPage) {
    mobileVideoPath = await mobileVideoPage.path();
    const finalMobilePath = path.join(ARTIFACT_DIR, 'motion_site_scroll_390.webm');
    fs.copyFileSync(mobileVideoPath, finalMobilePath);
    console.log(`Final Mobile Video: ${finalMobilePath}`);
  }

  await browser.close();

  // Save console output log
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'motion_site_console_logs.json'),
    JSON.stringify(consoleLogs, null, 2)
  );

  console.log('--- Motion Site Recordings & Screenshots Completed ---');
}

recordMotionSite().catch((err) => {
  console.error('Recording Error:', err);
  process.exit(1);
});
