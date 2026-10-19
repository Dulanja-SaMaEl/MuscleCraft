const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function verifyReal3DHero() {
  console.log('Launching browser for Real 3D Hero verification...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11'
    ]
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await desktopContext.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error(`[BROWSER ERROR] ${text}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
      console.warn(`[BROWSER WARN] ${text}`);
    } else {
      console.log(`[BROWSER LOG] ${text}`);
    }
  });

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(2500); // Allow R3F canvas and assets to compile/mount

  // Check if Canvas is in DOM
  const canvasExists = await page.evaluate(() => {
    const canvas = document.querySelector('section canvas');
    if (!canvas) return { exists: false };
    const rect = canvas.getBoundingClientRect();
    return {
      exists: true,
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    };
  });
  console.log('Canvas detection result:', canvasExists);

  // Sample FPS after initial render settles
  await page.waitForTimeout(1200);
  const fpsData = await page.evaluate(async () => {
    return new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(count);
        } else {
          const elapsed = performance.now() - start;
          const fps = Math.round((frames / elapsed) * 1000);
          resolve({
            fps,
            frames,
            elapsedMs: Math.round(elapsed),
            internalFps: window.__HERO_3D_FPS__ || fps
          });
        }
      }
      requestAnimationFrame(count);
    });
  });
  console.log('FPS Measurement:', fpsData);

  // Take Desktop Hero Screenshot (1440px)
  const desktopHeroPath = path.join(ARTIFACT_DIR, 'hero_3d_real_desktop_1440.png');
  // Capture the hero section
  const heroSection = await page.$('section');
  if (heroSection) {
    await heroSection.screenshot({ path: desktopHeroPath });
  } else {
    await page.screenshot({ path: desktopHeroPath });
  }
  console.log(`Desktop Hero Screenshot saved to: ${desktopHeroPath}`);

  // 2. Mobile Context (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[MOBILE] ${msg.text()}`);
    }
  });

  console.log('Navigating mobile context to http://localhost:3000/ ...');
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 35000 });
  await mobilePage.waitForTimeout(2500);

  const mobileHeroPath = path.join(ARTIFACT_DIR, 'hero_3d_real_mobile_390.png');
  const mobileHeroSection = await mobilePage.$('section');
  if (mobileHeroSection) {
    await mobileHeroSection.screenshot({ path: mobileHeroPath });
  } else {
    await mobilePage.screenshot({ path: mobileHeroPath });
  }
  console.log(`Mobile Hero Screenshot saved to: ${mobileHeroPath}`);

  await browser.close();

  const summary = {
    canvasExists,
    fpsData,
    consoleErrors,
    consoleWarnings: consoleWarnings.filter(w => !w.includes('Download the React DevTools')),
    screenshots: {
      desktop: desktopHeroPath,
      mobile: mobileHeroPath
    }
  };

  const reportPath = path.join(ARTIFACT_DIR, 'hero_3d_verification_summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`\nVerification complete! Summary written to: ${reportPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

verifyReal3DHero().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
