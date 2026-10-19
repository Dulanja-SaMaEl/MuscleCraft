const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function recordAnimations() {
  console.log('Launching browser to record scroll and entrance animations...');
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

  const runs = [
    { name: 'desktop_1440', width: 1440, height: 900, isMobile: false },
    { name: 'mobile_390', width: 390, height: 844, isMobile: true }
  ];

  const results = {};

  for (const run of runs) {
    console.log(`\n========================================`);
    console.log(`Starting run: ${run.name} (${run.width}x${run.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: run.width, height: run.height },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: ARTIFACT_DIR,
        size: { width: run.width, height: run.height }
      }
    });

    const page = await context.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        consoleErrors.push(text);
        console.error(`[CONSOLE ERROR (${run.name})]: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.message);
      console.error(`[PAGE ERROR (${run.name})]: ${err.message}`);
    });

    // Setup CLS listener before navigation
    await page.addInitScript(() => {
      window.__cumulativeLayoutShift = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__cumulativeLayoutShift += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for preloader curtain to play and finish
    console.log('Waiting for preloader curtain to finish...');
    await page.waitForTimeout(1400);

    // Give hero entrance time to reveal
    console.log('Hero entrance playing...');
    await page.waitForTimeout(1500);

    // Check animated elements in Hero
    const heroMetrics = await page.evaluate(() => {
      const lines = Array.from(document.querySelectorAll('.hero-line'));
      const badge = document.querySelector('.hero-badge');
      const stats = Array.from(document.querySelectorAll('.hero-stat-card'));
      return {
        linesVisible: lines.every(l => window.getComputedStyle(l).opacity !== '0'),
        badgeVisible: badge ? window.getComputedStyle(badge).opacity !== '0' : false,
        statsRendered: stats.length === 3
      };
    });
    console.log(`Hero animation verified:`, heroMetrics);

    // Sections to scroll through sequentially
    const sections = [
      '#elevate',
      '#offer',
      '#about',
      '#pricing',
      '#reviews',
      'section.border-y', // Banner section
      '#faqs',
      '#contact',
      'footer'
    ];

    console.log('Scrolling through page sections...');
    for (const sel of sections) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        console.log(`Scrolled to ${sel}`);
        // Pause to let ScrollTrigger entrance play and capture in video
        await page.waitForTimeout(1000);
      }
    }

    // Scroll back to top to demonstrate navbar return and scroll-up
    console.log('Scrolling back to top to demonstrate navbar return...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // Retrieve CLS
    const clsScore = await page.evaluate(() => window.__cumulativeLayoutShift || 0);
    console.log(`Cumulative Layout Shift (CLS): ${clsScore.toFixed(4)}`);

    // Close page and context to finalize video recording
    const video = page.video();
    await page.close();
    await context.close();

    const videoPath = await video.path();
    const finalVideoName = `scroll_animation_${run.name}.webm`;
    const finalVideoPath = path.join(ARTIFACT_DIR, finalVideoName);

    if (fs.existsSync(videoPath)) {
      if (fs.existsSync(finalVideoPath)) {
        fs.unlinkSync(finalVideoPath);
      }
      fs.renameSync(videoPath, finalVideoPath);
      console.log(`Video saved to: ${finalVideoPath}`);
    }

    results[run.name] = {
      videoFile: finalVideoName,
      videoPath: finalVideoPath,
      clsScore: parseFloat(clsScore.toFixed(4)),
      consoleErrorsCount: consoleErrors.length,
      consoleErrors: consoleErrors,
      consoleWarningsCount: consoleWarnings.length,
      heroMetrics
    };
  }

  await browser.close();

  const summaryPath = path.join(ARTIFACT_DIR, 'scroll_reveal_verification_report.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\nVerification summary written to ${summaryPath}`);
}

recordAnimations().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
