const { chromium } = require('playwright');

async function checkLiveAnimations() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1084, height: 750 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check initial state of Hero
  const heroInfo = await page.evaluate(() => {
    const h1 = document.querySelector('#scrolly-hero h1');
    const b1 = h1 ? h1.closest('.pointer-events-auto') : null;
    return {
      h1Text: h1 ? h1.innerText : null,
      beat1Opacity: b1 ? window.getComputedStyle(b1).opacity : null,
      beat1Transform: b1 ? window.getComputedStyle(b1).transform : null,
    };
  });
  console.log('Hero initial info:', heroInfo);

  // Check Elevate section
  const elevateBeforeScroll = await page.evaluate(() => {
    const el = document.getElementById('slide-elevate');
    const items = el ? el.querySelectorAll('.checklist-item') : [];
    return {
      sectionFound: !!el,
      firstItemOpacity: items[0] ? window.getComputedStyle(items[0]).opacity : null,
      firstItemTransform: items[0] ? window.getComputedStyle(items[0]).transform : null,
    };
  });
  console.log('Elevate BEFORE scroll:', elevateBeforeScroll);

  // Scroll to Elevate
  await page.evaluate(() => {
    const el = document.getElementById('slide-elevate');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  const elevateAfterScroll = await page.evaluate(() => {
    const el = document.getElementById('slide-elevate');
    const items = el ? el.querySelectorAll('.checklist-item') : [];
    return {
      firstItemOpacity: items[0] ? window.getComputedStyle(items[0]).opacity : null,
      firstItemTransform: items[0] ? window.getComputedStyle(items[0]).transform : null,
    };
  });
  console.log('Elevate AFTER scroll:', elevateAfterScroll);

  // Check FAQ
  await page.evaluate(() => {
    const el = document.getElementById('slide-faq');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  const faqInfo = await page.evaluate(() => {
    const el = document.getElementById('slide-faq');
    const items = el ? el.querySelectorAll('.faq-accordion-item') : [];
    return {
      faqFound: !!el,
      count: items.length,
      firstItemOpacity: items[0] ? window.getComputedStyle(items[0]).opacity : null,
      firstItemTransform: items[0] ? window.getComputedStyle(items[0]).transform : null,
    };
  });
  console.log('FAQ info after scroll:', faqInfo);

  console.log('Console errors:', consoleErrors);

  await browser.close();
}

checkLiveAnimations().catch(console.error);
