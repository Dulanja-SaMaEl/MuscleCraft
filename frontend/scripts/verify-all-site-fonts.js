const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function verifyAllSiteFonts() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const pagesToTest = [
    { url: 'http://localhost:3000/', name: 'homepage' },
    { url: 'http://localhost:3000/about', name: 'about' },
    { url: 'http://localhost:3000/pricing', name: 'pricing' },
    { url: 'http://localhost:3000/memberships', name: 'memberships' },
    { url: 'http://localhost:3000/checkout', name: 'checkout' },
    { url: 'http://localhost:3000/login', name: 'login' },
  ];

  const results = {
    pagesChecked: [],
    fontAudit: {},
    consoleErrors: []
  };

  // 1. Desktop Verification (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await desktopContext.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ page: page.url(), text: msg.text() });
    }
  });

  for (const item of pagesToTest) {
    console.log(`Checking Desktop: ${item.name} (${item.url})...`);
    await page.goto(item.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);

    // Audit computed fonts of primary heading
    const headingInfo = await page.evaluate(() => {
      const h1 = document.querySelector('h1') || document.querySelector('h2');
      if (!h1) return null;
      const s = window.getComputedStyle(h1);
      return {
        tag: h1.tagName,
        text: h1.innerText.replace(/\n/g, ' ').substring(0, 45),
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        color: s.color
      };
    });

    results.fontAudit[item.name] = headingInfo;

    // Screenshot page
    const screenshotPath = path.join(ARTIFACT_DIR, `site_font_${item.name}_desktop.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  // 2. Specific checks on Homepage Elements
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const homeSpecificAudit = await page.evaluate(() => {
    // 1. Hero Heading
    const heroH1 = document.querySelector('h1');
    const heroH1Style = heroH1 ? window.getComputedStyle(heroH1) : null;

    // 2. Elevate Journey Title
    const elevateH2 = document.querySelector('#elevate h2');
    const elevateStyle = elevateH2 ? window.getComputedStyle(elevateH2) : null;

    // 3. Pricing Figures
    const priceElements = Array.from(document.querySelectorAll('#pricing .text-\\[28px\\], #pricing .text-\\[32px\\]'));
    const priceDetails = priceElements.map(el => ({
      text: el.innerText,
      fontSize: window.getComputedStyle(el).fontSize,
      fontWeight: window.getComputedStyle(el).fontWeight
    }));

    // 4. Buttons
    const heroButton = document.querySelector('#hero a, a[href="/checkout"]');
    const heroBtnStyle = heroButton ? window.getComputedStyle(heroButton) : null;

    return {
      heroHeading: heroH1Style ? {
        fontFamily: heroH1Style.fontFamily,
        fontWeight: heroH1Style.fontWeight,
        fontSize: heroH1Style.fontSize,
        lineHeight: heroH1Style.lineHeight,
        letterSpacing: heroH1Style.letterSpacing
      } : null,
      sectionTitle: elevateStyle ? {
        fontFamily: elevateStyle.fontFamily,
        fontWeight: elevateStyle.fontWeight,
        fontSize: elevateStyle.fontSize,
        color: elevateStyle.color
      } : null,
      pricingFigures: priceDetails,
      buttonStyle: heroBtnStyle ? {
        fontFamily: heroBtnStyle.fontFamily,
        fontWeight: heroBtnStyle.fontWeight,
        fontSize: heroBtnStyle.fontSize,
        backgroundColor: heroBtnStyle.backgroundColor,
        color: heroBtnStyle.color
      } : null
    };
  });

  results.homepageDetailedAudit = homeSpecificAudit;

  // 3. Mobile Check (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  console.log('Checking Mobile Homepage...');
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  const mobileHeroShot = path.join(ARTIFACT_DIR, 'site_font_hero_mobile.png');
  await mobilePage.screenshot({ path: mobileHeroShot });

  // Scroll to pricing
  await mobilePage.evaluate(() => {
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView();
  });
  await mobilePage.waitForTimeout(1000);
  const mobilePricingShot = path.join(ARTIFACT_DIR, 'site_font_pricing_mobile.png');
  await mobilePage.screenshot({ path: mobilePricingShot });

  await browser.close();

  const reportPath = path.join(ARTIFACT_DIR, 'site_font_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit complete! Full report written to ${reportPath}`);
  console.log('\nAudit Summary:');
  console.log(JSON.stringify(results, null, 2));
}

verifyAllSiteFonts().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
