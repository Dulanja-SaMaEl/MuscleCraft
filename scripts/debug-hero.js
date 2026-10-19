const { chromium } = require('playwright');

async function debugHero() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }));

  const failedRequests = [];
  page.on('requestfailed', (req) => failedRequests.push({ url: req.url(), failure: req.failure() }));
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push({ url: res.url(), status: res.status() });
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const hasScrolly = await page.$('#scrolly-hero');
  const hasFallbackHero = await page.$('#slide-hero');

  console.log('has scrolly-hero:', !!hasScrolly);
  console.log('has slide-hero:', !!hasFallbackHero);
  console.log('failed requests:', failedRequests);
  console.log('console logs:', consoleLogs.filter((c) => c.type === 'warn' || c.type === 'error' || c.text.includes('IronForge')));

  await browser.close();
}

debugHero().catch(console.error);
