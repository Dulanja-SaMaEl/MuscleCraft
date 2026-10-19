const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyStage1() {
  const artifactDir = path.join('C:', 'Users', 'dulan', '.gemini', 'antigravity', 'brain', 'dce63ac5-4d05-4650-ae9b-3d26cae7b97d');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const consoleLogs = [];
  const consoleErrors = [];

  console.log('--- Launching Edge Browser for Stage 1 Verification ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // 1. DESKTOP RUN (1440 x 900)
  console.log('Testing Desktop 1440x900...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  desktopPage.on('pageerror', (err) => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for ForgeLoader to complete and fade out
  await desktopPage.waitForTimeout(2000);

  // Measure FPS in page
  const desktopFps = await desktopPage.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 2000) {
          requestAnimationFrame(count);
        } else {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        }
      }
      requestAnimationFrame(count);
    });
  });

  console.log(`Desktop Render FPS: ${desktopFps}`);

  // Take Desktop Hero screenshot
  const desktopHeroPath = path.join(artifactDir, 'stage1_desktop_hero.png');
  await desktopPage.screenshot({ path: desktopHeroPath });
  console.log(`Saved desktop hero screenshot to: ${desktopHeroPath}`);

  // Scroll smoothly down the page to verify persistent background and layering
  await desktopPage.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);

  const desktopMidPath = path.join(artifactDir, 'stage1_desktop_mid.png');
  await desktopPage.screenshot({ path: desktopMidPath });

  // Scroll to bottom
  await desktopPage.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);

  const desktopBottomPath = path.join(artifactDir, 'stage1_desktop_bottom.png');
  await desktopPage.screenshot({ path: desktopBottomPath });

  // Full page screenshot
  await desktopPage.evaluate(() => window.scrollTo({ top: 0 }));
  await desktopPage.waitForTimeout(500);
  const desktopFullPath = path.join(artifactDir, 'stage1_desktop_full.png');
  await desktopPage.screenshot({ path: desktopFullPath, fullPage: true });

  await desktopContext.close();

  // 2. MOBILE RUN (390 x 844, iPhone 14 / modern smartphone viewport)
  console.log('Testing Mobile 390x844...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Mobile Error] ${msg.text()}`);
    }
  });

  mobilePage.on('pageerror', (err) => {
    consoleErrors.push(`[Mobile Page Error] ${err.message}`);
  });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  const mobileFps = await mobilePage.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 2000) {
          requestAnimationFrame(count);
        } else {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        }
      }
      requestAnimationFrame(count);
    });
  });

  console.log(`Mobile Render FPS: ${mobileFps}`);

  const mobileHeroPath = path.join(artifactDir, 'stage1_mobile_hero.png');
  await mobilePage.screenshot({ path: mobileHeroPath });
  console.log(`Saved mobile hero screenshot to: ${mobileHeroPath}`);

  const mobileFullPath = path.join(artifactDir, 'stage1_mobile_full.png');
  await mobilePage.screenshot({ path: mobileFullPath, fullPage: true });

  await mobileContext.close();
  await browser.close();

  console.log('--- Verification Summary ---');
  console.log(`Desktop FPS: ${desktopFps}`);
  console.log(`Mobile FPS: ${mobileFps}`);
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  } else {
    console.log('Clean console! Zero runtime errors.');
  }

  const result = {
    desktopFps,
    mobileFps,
    consoleErrors,
    screenshots: {
      desktopHero: desktopHeroPath,
      desktopMid: desktopMidPath,
      desktopBottom: desktopBottomPath,
      desktopFull: desktopFullPath,
      mobileHero: mobileHeroPath,
      mobileFull: mobileFullPath,
    },
  };

  fs.writeFileSync(path.join(artifactDir, 'stage1_verification.json'), JSON.stringify(result, null, 2));
  console.log('Stage 1 verification finished successfully.');
}

verifyStage1().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
