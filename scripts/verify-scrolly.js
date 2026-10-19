const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\dulan\\.gemini\\antigravity\\brain\\dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function verify() {
  console.log('=== IronForge Scrollytelling Playwright Verification ===');

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

  const consoleErrors = [];
  const consoleLogs = [];

  // 1. DESKTOP VERIFICATION (1440x900)
  console.log('\n[1/3] Testing Desktop (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[Desktop ${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(`[Desktop Error] ${text}`);
    }
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(1000);

  // Check pin distance on desktop
  const pinDistDesktop = await desktopPage.evaluate(() => {
    return window.innerHeight * 5;
  });

  const desktopCheckpoints = [
    { pct: 0, scrollY: 0, name: 'scrolly_desktop_0.png' },
    { pct: 25, scrollY: pinDistDesktop * 0.25, name: 'scrolly_desktop_25.png' },
    { pct: 50, scrollY: pinDistDesktop * 0.50, name: 'scrolly_desktop_50.png' },
    { pct: 75, scrollY: pinDistDesktop * 0.75, name: 'scrolly_desktop_75.png' },
    { pct: 100, scrollY: pinDistDesktop * 1.00, name: 'scrolly_desktop_100.png' },
  ];

  for (const cp of desktopCheckpoints) {
    await desktopPage.evaluate((y) => window.scrollTo(0, y), cp.scrollY);
    await desktopPage.waitForTimeout(600);

    // Pixel non-blank check
    const canvasInfo = await desktopPage.evaluate(() => {
      const canvas = document.querySelector('#scrolly-hero canvas');
      if (!canvas) return { found: false };
      const ctx = canvas.getContext('2d');
      if (!ctx) return { found: true, hasCtx: false };
      const imgData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      let nonZero = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0 || imgData.data[i + 1] > 0 || imgData.data[i + 2] > 0) {
          nonZero++;
        }
      }
      return { found: true, hasCtx: true, width: canvas.width, height: canvas.height, nonZeroPixels: nonZero };
    });

    console.log(`  Desktop ${cp.pct}% scroll: Canvas ${canvasInfo.width}x${canvasInfo.height}, non-zero pixels sampled: ${canvasInfo.nonZeroPixels}`);
    if (canvasInfo.nonZeroPixels === 0) {
      console.error(`  WARNING: Canvas appears blank at ${cp.pct}%!`);
    }

    const shotPath = path.join(ARTIFACT_DIR, cp.name);
    await desktopPage.screenshot({ path: shotPath });
    console.log(`  Saved screenshot: ${cp.name}`);
  }
  await desktopContext.close();

  // 2. MOBILE VERIFICATION (390x844)
  console.log('\n[2/3] Testing Mobile (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[Mobile ${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(`[Mobile Error] ${text}`);
    }
  });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);

  const pinDistMobile = await mobilePage.evaluate(() => {
    return window.innerHeight * 4;
  });

  const mobileCheckpoints = [
    { pct: 0, scrollY: 0, name: 'scrolly_mobile_0.png' },
    { pct: 25, scrollY: pinDistMobile * 0.25, name: 'scrolly_mobile_25.png' },
    { pct: 50, scrollY: pinDistMobile * 0.50, name: 'scrolly_mobile_50.png' },
    { pct: 75, scrollY: pinDistMobile * 0.75, name: 'scrolly_mobile_75.png' },
    { pct: 100, scrollY: pinDistMobile * 1.00, name: 'scrolly_mobile_100.png' },
  ];

  for (const cp of mobileCheckpoints) {
    await mobilePage.evaluate((y) => window.scrollTo(0, y), cp.scrollY);
    await mobilePage.waitForTimeout(600);

    const canvasInfo = await mobilePage.evaluate(() => {
      const canvas = document.querySelector('#scrolly-hero canvas');
      if (!canvas) return { found: false };
      const ctx = canvas.getContext('2d');
      if (!ctx) return { found: true, hasCtx: false };
      const imgData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      let nonZero = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 0 || imgData.data[i + 1] > 0 || imgData.data[i + 2] > 0) {
          nonZero++;
        }
      }
      return { found: true, hasCtx: true, width: canvas.width, height: canvas.height, nonZeroPixels: nonZero };
    });

    console.log(`  Mobile ${cp.pct}% scroll: Canvas ${canvasInfo.width}x${canvasInfo.height}, non-zero pixels sampled: ${canvasInfo.nonZeroPixels}`);
    if (canvasInfo.nonZeroPixels === 0) {
      console.error(`  WARNING: Canvas appears blank at ${cp.pct}%!`);
    }

    const shotPath = path.join(ARTIFACT_DIR, cp.name);
    await mobilePage.screenshot({ path: shotPath });
    console.log(`  Saved screenshot: ${cp.name}`);
  }
  await mobileContext.close();

  // 3. ROUTE INTEGRITY & API VERIFICATION
  console.log('\n[3/3] Testing Routes & API Endpoints...');
  const testContext = await browser.newContext();
  const testPage = await testContext.newPage();

  const routes = ['/client', '/instructor', '/admin', '/checkout', '/memberships', '/pricing'];
  for (const route of routes) {
    const res = await testPage.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
    console.log(`  Route ${route}: Status ${res.status()}`);
    if (res.status() !== 200) {
      console.error(`  ERROR: Route ${route} returned status ${res.status()}`);
    }
  }

  // API checks
  const apiStats = await testPage.request.get('http://localhost:3000/api/admin/stats');
  console.log(`  API /api/admin/stats: Status ${apiStats.status()}`);

  const apiVideos = await testPage.request.get('http://localhost:3000/api/videos');
  console.log(`  API /api/videos: Status ${apiVideos.status()}`);

  await browser.close();

  console.log('\n==========================================');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.log(' ', e));
  }
  console.log('Verification Complete!');
  console.log('==========================================');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
