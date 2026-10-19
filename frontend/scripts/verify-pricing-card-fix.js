const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d';

async function verifyPricingCardFix() {
  console.log('Launching browser to verify flagship pricing card fix...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 950 },
    { name: 'tablet_1024', width: 1024, height: 900 },
    { name: 'mobile_390', width: 390, height: 844 }
  ];

  const results = {};

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000/#pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Save section screenshot
    const screenshotPath = path.join(ARTIFACT_DIR, `pricing_fixed_${vp.name}.png`);
    await pricingSection.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Inspect Flagship Card metrics
    const cardData = await page.evaluate(() => {
      // Find the card containing 90-Day VIP Coaching
      const h3s = Array.from(document.querySelectorAll('#pricing h3'));
      const flagshipH3 = h3s.find(el => el.textContent.includes('90-Day VIP Coaching'));
      if (!flagshipH3) return { found: false };

      const card = flagshipH3.closest('.card-ironforge-featured') || flagshipH3.closest('.perspective-1400 > div:last-child');
      const badge = card ? card.querySelector('span.rounded-full') : null;
      const ring = card ? card.querySelector('.animate-\\[spin_30s_linear_infinite\\]') : null;

      const cardRect = card ? card.getBoundingClientRect() : null;
      const titleRect = flagshipH3.getBoundingClientRect();
      const badgeRect = badge ? badge.getBoundingClientRect() : null;
      const ringParent = ring ? ring.parentElement.getBoundingClientRect() : null;

      const cardComputed = card ? window.getComputedStyle(card) : null;

      // Mathematical collision check between badge and title
      const badgeTitleGap = badgeRect ? titleRect.top - (badgeRect.top + badgeRect.height) : null;
      const isOverlapping = badgeRect ? !(
        badgeRect.right < titleRect.left ||
        badgeRect.left > titleRect.right ||
        badgeRect.bottom < titleRect.top ||
        badgeRect.top > titleRect.bottom
      ) : false;

      return {
        found: true,
        titleText: flagshipH3.textContent.trim(),
        titleHeight: titleRect.height,
        titleLinesApprox: Math.round(titleRect.height / 28),
        badgeText: badge ? badge.textContent.trim() : null,
        badgeAboveTitleGapPx: badgeTitleGap,
        isOverlapping,
        cardOverflow: cardComputed ? cardComputed.overflow : null,
        cardBorderRadius: cardComputed ? cardComputed.borderRadius : null,
        ringInsideCard: ring !== null
      };
    });

    results[vp.name] = cardData;
    console.log(`Viewport ${vp.name} evaluation:`, JSON.stringify(cardData, null, 2));

    await context.close();
  }

  await browser.close();

  const summaryPath = path.join(ARTIFACT_DIR, 'pricing_card_fix_verification.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\nVerification summary written to ${summaryPath}`);
}

verifyPricingCardFix().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
