const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Test both user viewport (807x760) and desktop (1366x768)
  for (const vp of [{ width: 807, height: 760, name: 'user_vp' }, { width: 1366, height: 768, name: 'desktop' }]) {
    console.log(`\n========================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Track Beat 3 collision
    let maxOverlapBeat3 = null;
    let minGapBeat3 = 9999;

    // We will scroll incrementally through the page (wheel events)
    let totalScrolled = 0;
    const maxScroll = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);

    console.log(`Max scrollable distance: ${maxScroll}px`);

    let reachedElevate = false;
    let reachedOffer = false;
    let reachedPricing = false;

    for (let step = 0; step < 80; step++) {
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(150);

      const status = await page.evaluate(() => {
        const scrollY = window.scrollY;
        const nav = document.querySelector('header');
        const navRect = nav ? nav.getBoundingClientRect() : null;

        const beat3 = document.querySelector('div[style*="visibility: visible"] h2, div[style*="opacity: 1"] h2');
        // Let's specifically find beat3 text
        const allH2 = Array.from(document.querySelectorAll('h2'));
        const b3 = allH2.find(h => h.textContent && h.textContent.includes('NO NOISE'));
        let b3Rect = null;
        let b3Visible = false;
        if (b3) {
          const style = window.getComputedStyle(b3.parentElement);
          b3Visible = style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.05;
          b3Rect = b3.getBoundingClientRect();
        }

        // Check cards in viewport
        const visibleCards = Array.from(document.querySelectorAll('.offer-card, .gallery-card, .pricing-std-card, .review-card-item')).map(card => {
          const r = card.getBoundingClientRect();
          const s = window.getComputedStyle(card);
          const inViewport = r.top < window.innerHeight && r.bottom > 0;
          return {
            className: card.className.split(' ')[0],
            inViewport,
            top: Math.round(r.top),
            opacity: parseFloat(s.opacity).toFixed(2),
            visibility: s.visibility,
            transform: s.transform
          };
        }).filter(c => c.inViewport);

        return {
          scrollY: Math.round(scrollY),
          navBottom: navRect ? Math.round(navRect.bottom) : 0,
          b3Visible,
          b3Top: b3Rect ? Math.round(b3Rect.top) : null,
          b3Text: b3 ? b3.textContent.slice(0, 20) : null,
          visibleCards
        };
      });

      if (status.b3Visible && status.b3Top !== null) {
        const gap = status.b3Top - status.navBottom;
        if (gap < minGapBeat3) {
          minGapBeat3 = gap;
        }
        if (gap < 20) {
          console.error(`[STEP ${step} scrollY=${status.scrollY}] COLLISION: Beat 3 top=${status.b3Top}px, Nav bottom=${status.navBottom}px, GAP=${gap}px`);
        }
      }

      // Check card animations when they enter
      if (status.visibleCards.length > 0) {
        const sample = status.visibleCards[0];
        console.log(`[STEP ${step} scrollY=${status.scrollY}] Visible Card: ${sample.className} at top=${sample.top}px, opacity=${sample.opacity}, vis=${sample.visibility}, transform=${sample.transform}`);
      }
    }

    console.log(`Minimum gap between Navbar and Beat 3: ${minGapBeat3}px`);
    if (minGapBeat3 < 20) {
      console.error(`FAIL: Navbar collided with Beat 3 on ${vp.name}!`);
    } else {
      console.log(`PASS: Navbar has clean clearance (min ${minGapBeat3}px) on ${vp.name}`);
    }

    await page.close();
  }

  await browser.close();
})();
