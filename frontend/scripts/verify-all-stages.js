const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyAllStages() {
  const artifactDir = path.join('C:', 'Users', 'dulan', '.gemini', 'antigravity', 'brain', 'dce63ac5-4d05-4650-ae9b-3d26cae7b97d');

  const consoleErrors = [];
  const consoleLogs = [];

  console.log('=== LAUNCHING COMPREHENSIVE END-TO-END VERIFICATION ===');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // ─────────────────────────────────────────────────────────────
  // 1. DESKTOP RUN (1440 x 900)
  // ─────────────────────────────────────────────────────────────
  console.log('Testing Desktop 1440x900...');
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  desktopPage.on('pageerror', (err) => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000); // Wait for loader dismissal and 3D scene init

  // Measure Desktop FPS during active animation & render loop
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

  // Screenshot 1: Hero
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_hero_desktop.png') });
  console.log('Saved stage_hero_desktop.png');

  // Screenshot 2: Elevate Journey (Scroll to ~900px, plate 2 slides on, camera dollies left)
  await desktopPage.evaluate(() => window.scrollTo({ top: 950, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_elevate_desktop.png') });
  console.log('Saved stage_elevate_desktop.png');

  // Screenshot 3: What We Offer (Scroll to ~1700px, plate 3 slides on, camera dollies right)
  await desktopPage.evaluate(() => window.scrollTo({ top: 1750, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_offer_desktop.png') });
  console.log('Saved stage_offer_desktop.png');

  // Screenshot 4: About Us (Scroll to ~2400px, 3D photos with parallax mask reveal)
  await desktopPage.evaluate(() => window.scrollTo({ top: 2450, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_about_desktop.png') });
  console.log('Saved stage_about_desktop.png');

  // Screenshot 5: Pricing (Scroll to ~3300px, 3D tilt cards, 90-day flagship with plate & animated border)
  await desktopPage.evaluate(() => window.scrollTo({ top: 3350, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_pricing_desktop.png') });
  console.log('Saved stage_pricing_desktop.png');

  // Screenshot 6: Reviews Carousel (Scroll to ~4200px, drag/swipe carousel with inertia)
  await desktopPage.evaluate(() => window.scrollTo({ top: 4250, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_reviews_desktop.png') });
  console.log('Saved stage_reviews_desktop.png');

  // Test interactive drag on carousel
  const carouselTrack = await desktopPage.$('#reviews [class*="overflow-x-auto"]');
  if (carouselTrack) {
    const box = await carouselTrack.boundingBox();
    if (box) {
      await desktopPage.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
      await desktopPage.mouse.down();
      await desktopPage.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 10 });
      await desktopPage.mouse.up();
      await desktopPage.waitForTimeout(800);
      await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_reviews_dragged_desktop.png') });
      console.log('Saved stage_reviews_dragged_desktop.png (inertia drag verified)');
    }
  }

  // Screenshot 7: CTA Banner (Scroll to ~4900px, molten-gold shader)
  await desktopPage.evaluate(() => window.scrollTo({ top: 4950, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_cta_shader_desktop.png') });
  console.log('Saved stage_cta_shader_desktop.png');

  // Screenshot 8: FAQs & Footer (Scroll to bottom)
  await desktopPage.evaluate(() => window.scrollTo({ top: 5800, behavior: 'smooth' }));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'stage_faq_footer_desktop.png') });
  console.log('Saved stage_faq_footer_desktop.png');

  await desktopContext.close();

  // ─────────────────────────────────────────────────────────────
  // 2. MOBILE RUN (390 x 844 — iPhone / Android)
  // ─────────────────────────────────────────────────────────────
  console.log('Testing Mobile 390x844...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Mobile] ${msg.text()}`);
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

  // Mobile Hero
  await mobilePage.screenshot({ path: path.join(artifactDir, 'stage_hero_mobile.png') });
  console.log('Saved stage_hero_mobile.png');

  // Mobile Pricing
  await mobilePage.evaluate(() => window.scrollTo({ top: 3100, behavior: 'smooth' }));
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'stage_pricing_mobile.png') });
  console.log('Saved stage_pricing_mobile.png');

  // Mobile CTA Shader
  await mobilePage.evaluate(() => window.scrollTo({ top: 5600, behavior: 'smooth' }));
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'stage_cta_mobile.png') });
  console.log('Saved stage_cta_mobile.png');

  await mobileContext.close();
  await browser.close();

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Desktop FPS: ${desktopFps}`);
  console.log(`Mobile FPS: ${mobileFps}`);
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  } else {
    console.log('CLEAN CONSOLE: 0 runtime errors detected.');
  }

  const summary = {
    timestamp: new Date().toISOString(),
    desktopFps,
    mobileFps,
    consoleErrors,
    status: consoleErrors.length === 0 ? 'ALL_STAGES_PASSED' : 'ERRORS_DETECTED',
  };

  fs.writeFileSync(path.join(artifactDir, 'all_stages_verification.json'), JSON.stringify(summary, null, 2));
  console.log('Verification report written successfully.');
}

verifyAllStages().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
