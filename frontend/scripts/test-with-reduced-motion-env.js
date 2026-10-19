const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Explicitly simulate the user's OS reducedMotion: 'reduce' state!
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Testing in reducedMotion: "reduce" environment (exact Windows setting)...');

  // Verify matchMedia
  const isReduced = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  console.log('Browser prefers-reduced-motion:', isReduced);

  // Scroll down incrementally and record card animation states
  let animatedCount = 0;
  for (let i = 0; i <= 50; i++) {
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(120);

    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.offer-card, .gallery-card, .pricing-std-card, .review-card-item'));
      return cards.map(c => {
        const r = c.getBoundingClientRect();
        const s = window.getComputedStyle(c);
        return {
          inView: r.top < window.innerHeight && r.bottom > 0,
          top: Math.round(r.top),
          opacity: parseFloat(s.opacity),
          transform: s.transform
        };
      }).filter(c => c.inView);
    });

    if (cardData.length > 0) {
      const c = cardData[0];
      if (c.opacity > 0 && c.opacity < 0.99) {
        console.log(`[WHEEL ${i}] Card actively animating! Opacity: ${c.opacity}, top: ${c.top}px, transform: ${c.transform}`);
        animatedCount++;
      }
    }
  }

  console.log(`\nTotal frames where active animation was observed: ${animatedCount}`);
  if (animatedCount > 0) {
    console.log('SUCCESS: Animations are now fully executing even when Windows reduced-motion is active!');
  } else {
    console.error('FAILURE: Animations are still not animating!');
  }

  await browser.close();
})();
