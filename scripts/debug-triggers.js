const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger || (window.__ScrollTrigger);
    // If not on window, let's find all triggers via document or query
    const allST = (typeof ScrollTrigger !== 'undefined') ? ScrollTrigger.getAll() : [];
    
    // Also check Lenis
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const bodyHeight = document.body.scrollHeight;

    // Check elements
    const cards = Array.from(document.querySelectorAll('.offer-card, .gallery-card, .pricing-std-card')).map(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.className,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
        opacity: style.opacity,
        visibility: style.visibility,
        transform: style.transform
      };
    });

    return {
      totalScrollTriggers: allST.length,
      triggers: allST.map(st => ({
        id: st.vars?.id || st.trigger?.tagName + (st.trigger?.id ? '#' + st.trigger.id : '') + (st.trigger?.className ? '.' + st.trigger.className.slice(0, 20) : ''),
        start: st.start,
        end: st.end,
        progress: st.progress,
        isActive: st.isActive,
      })),
      scrollY,
      bodyHeight,
      cards: cards.slice(0, 5)
    };
  });

  console.log('Page Trigger Info:', JSON.stringify(info, null, 2));

  // Now let's scroll through the page using Lenis or window.scrollTo and monitor ScrollTrigger updates
  console.log('\n--- Scrolling to 3000px ---');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(500);

  const afterScroll = await page.evaluate(() => {
    return {
      scrollY: window.scrollY,
      cards: Array.from(document.querySelectorAll('.offer-card')).map(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return { opacity: style.opacity, visibility: style.visibility, top: rect.top };
      })
    };
  });
  console.log('After scroll to 3000:', afterScroll);

  // Now let's scroll to 5000px
  console.log('\n--- Scrolling to 5000px ---');
  await page.evaluate(() => window.scrollTo(0, 5000));
  await page.waitForTimeout(500);

  const afterScroll5000 = await page.evaluate(() => {
    return {
      scrollY: window.scrollY,
      cards: Array.from(document.querySelectorAll('.offer-card')).map(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return { opacity: style.opacity, visibility: style.visibility, top: rect.top };
      })
    };
  });
  console.log('After scroll to 5000:', afterScroll5000);

  await browser.close();
})();
