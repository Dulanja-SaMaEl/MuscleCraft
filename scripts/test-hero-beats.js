const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const viewports = [
    { width: 807, height: 760, name: 'user_screenshot_vp' },
    { width: 1024, height: 768, name: 'laptop' },
    { width: 1440, height: 900, name: 'macbook_desktop' },
    { width: 390, height: 844, name: 'mobile_iphone' }
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`CHECKING HERO BEATS ON: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get max hero scroll distance
    const totalDist = vp.width <= 768 ? 2400 : 3500;

    // Scroll through the hero in 100px steps
    let minGapBeat2 = 9999;
    let minGapBeat3 = 9999;
    let minGapBeat4 = 9999;

    let b3PeakInfo = null;

    for (let scrollY = 0; scrollY <= totalDist; scrollY += 80) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(40);

      const data = await page.evaluate(() => {
        const nav = document.querySelector('header');
        const navRect = nav ? nav.getBoundingClientRect() : null;
        const navBottom = navRect ? navRect.bottom : 0;

        // Find Beat 2, 3, 4
        const allHeadings = Array.from(document.querySelectorAll('h2'));
        const b2H2 = allHeadings.find(h => h.textContent.includes('Built For') || h.textContent.includes('Disciplines'));
        const b3H2 = allHeadings.find(h => h.textContent.includes('No Noise') || h.textContent.includes('Gimmicks'));
        const b4H2 = allHeadings.find(h => h.textContent.includes('Claim Your Ground'));

        const checkBeat = (h2) => {
          if (!h2) return null;
          const parent = h2.closest('div[ref], div[style]');
          const style = window.getComputedStyle(parent || h2);
          const opacity = parseFloat(style.opacity);
          const visible = style.visibility !== 'hidden' && opacity > 0.05;
          const rect = h2.getBoundingClientRect();
          return { visible, opacity, top: rect.top, bottom: rect.bottom, height: rect.height };
        };

        return {
          scrollY: window.scrollY,
          navBottom,
          b2: checkBeat(b2H2),
          b3: checkBeat(b3H2),
          b4: checkBeat(b4H2),
        };
      });

      if (data.b2 && data.b2.visible) {
        const gap = data.b2.top - data.navBottom;
        if (gap < minGapBeat2) minGapBeat2 = gap;
      }
      if (data.b3 && data.b3.visible) {
        const gap = data.b3.top - data.navBottom;
        if (gap < minGapBeat3) {
          minGapBeat3 = gap;
          b3PeakInfo = { scrollY, navBottom: data.navBottom, b3Top: data.b3.top, gap };
        }
      }
      if (data.b4 && data.b4.visible) {
        const gap = data.b4.top - data.navBottom;
        if (gap < minGapBeat4) minGapBeat4 = gap;
      }
    }

    console.log(`Beat 2 Min Gap to Navbar: ${Math.round(minGapBeat2)}px`);
    console.log(`Beat 3 Min Gap to Navbar: ${Math.round(minGapBeat3)}px (Peak info:`, b3PeakInfo, `)`);
    console.log(`Beat 4 Min Gap to Navbar: ${Math.round(minGapBeat4)}px`);

    if (minGapBeat3 < 20) {
      console.error(`🚨 COLLISION ON ${vp.name}: Beat 3 is overlapping or within 20px of navbar!`);
    } else {
      console.log(`✅ CLEAN: Beat 3 has ${Math.round(minGapBeat3)}px clearance on ${vp.name}`);
    }

    // Capture Beat 3 screenshot for user viewport
    if (vp.name === 'user_screenshot_vp' && b3PeakInfo) {
      await page.evaluate((y) => window.scrollTo(0, y), b3PeakInfo.scrollY);
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/user_beat3_verified.png' });
      console.log('Saved user_beat3_verified.png');
    }

    await page.close();
  }

  await browser.close();
  console.log('All hero beat tests finished.');
})();
