const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  // Test 1: User's exact viewport (807 x 760)
  console.log('--- TEST 1: User viewport 807 x 760 ---');
  const page = await browser.newPage({ viewport: { width: 807, height: 760 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check initial Beat 1
  const navBox = await page.locator('header').first().boundingBox();
  console.log('Nav box at top:', navBox);

  // Scroll into Beat 3
  // Scroll down to 60% of hero pin (~2100px)
  await page.evaluate(() => window.scrollTo(0, 2100));
  await page.waitForTimeout(600);

  // Check Beat 3 headline position and nav position
  const beat3 = await page.locator('text=NO NOISE. NO GIMMICKS.');
  const beat3Box = await beat3.boundingBox();
  const navBoxScrolled = await page.locator('header').first().boundingBox();
  console.log('Nav box during Beat 3:', navBoxScrolled);
  console.log('Beat 3 headline box:', beat3Box);

  if (navBoxScrolled && beat3Box) {
    const navBottom = navBoxScrolled.y + navBoxScrolled.height;
    const beatTop = beat3Box.y;
    const gap = beatTop - navBottom;
    console.log(`Nav bottom: ${navBottom}px, Beat 3 top: ${beatTop}px, Gap: ${gap}px`);
    if (gap < 20) {
      console.error('FAIL: Overlap or collision detected! Gap is less than 20px!');
    } else {
      console.log('PASS: Clear separation between navbar and Beat 3 headline!');
    }
  }

  await page.screenshot({ path: 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/test_user_beat3.png' });

  // Test 2: Standard Desktop Viewport (1440 x 900)
  console.log('\n--- TEST 2: Standard Desktop 1440 x 900 ---');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  // Scroll smoothly down the page and check each section's appearance
  const sections = [
    { id: 'slide-elevate', name: 'Elevate Journey' },
    { id: 'slide-offer', name: 'What We Offer' },
    { id: 'slide-about', name: 'About Section' },
    { id: 'slide-pricing', name: 'Pricing Section' },
    { id: 'slide-reviews', name: 'Reviews Section' },
    { id: 'slide-faq', name: 'FAQ Section' },
    { id: 'slide-contact', name: 'Contact Map' },
  ];

  for (const sec of sections) {
    const el = await desktopPage.$(`#${sec.id}`);
    if (el) {
      const box = await el.boundingBox();
      console.log(`\nScrolling towards ${sec.name} (offsetTop ~${Math.round(box.y)})...`);
      
      // Scroll to just before it enters viewport
      await desktopPage.evaluate((targetY) => {
        window.scrollTo({ top: targetY - window.innerHeight + 100, behavior: 'smooth' });
      }, box.y);
      await desktopPage.waitForTimeout(500);

      // Now scroll so it enters 85% of viewport
      await desktopPage.evaluate((targetY) => {
        window.scrollTo({ top: targetY - window.innerHeight * 0.7, behavior: 'smooth' });
      }, box.y);
      await desktopPage.waitForTimeout(400);

      // Check cards opacity/transform
      const cards = await desktopPage.$$(`#${sec.id} .offer-card, #${sec.id} .gallery-card, #${sec.id} .pricing-std-card, #${sec.id} .pricing-flagship-card, #${sec.id} .review-card-item, #${sec.id} .faq-item, #${sec.id} .checklist-item`);
      console.log(`Found ${cards.length} cards/items in ${sec.name}`);
      
      if (cards.length > 0) {
        const firstCardStyle = await cards[0].evaluate((node) => {
          const comp = window.getComputedStyle(node);
          return { opacity: comp.opacity, transform: comp.transform, visibility: comp.visibility };
        });
        console.log(`Card state right after entering:`, firstCardStyle);
      }

      // Wait for animation to finish
      await desktopPage.waitForTimeout(1400);
      if (cards.length > 0) {
        const finishedStyle = await cards[0].evaluate((node) => {
          const comp = window.getComputedStyle(node);
          return { opacity: comp.opacity, transform: comp.transform, visibility: comp.visibility };
        });
        console.log(`Card state after animation completes:`, finishedStyle);
      }
    }
  }

  await browser.close();
  console.log('\nVerification script completed.');
})();
