const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve('C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/admin-screenshots');
const BASE_URL = 'http://localhost:3000';

const TABS = [
  { id: '01-overview', label: 'Dashboard Overview', desc: 'Overview metrics & renewals' },
  { id: '02-daily-sales-crm', label: 'Daily Sales & Ad CRM', desc: 'Meta ads & CPR review' },
  { id: '03-bank-approvals', label: 'Bank Approvals', desc: 'Transfer slips ledger' },
  { id: '04-members-directory', label: 'Members Directory', desc: 'Member roster & renewals' },
  { id: '05-client-care', label: 'Client Analytics & Care', desc: 'Body measurements & feedback' },
  { id: '06-videos-vault', label: 'Session Videos Vault', desc: 'Exercise video master' },
  { id: '07-broadcast-center', label: 'Broadcast Center', desc: 'Push & WhatsApp announcements' },
  { id: '08-packages-master', label: 'Gym Packages Master', desc: 'Pricing tiers & admission fees' },
  { id: '09-database-health', label: 'Database & Backend', desc: 'Supabase telemetry & env audit' },
  { id: '10-audit-trail', label: 'Audit Trail', desc: 'Security actions ledger' },
];

async function captureAdminScreenshots() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser for admin screenshot capture...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2, // 2x retina crispness for beautiful screenshots
  });
  const page = await context.newPage();

  // 1. Authenticate as Admin
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('AdeeshaOwner2026!');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(2000);

  console.log(`Current URL after login: ${page.url()}`);
  if (!page.url().includes('/admin')) {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  }

  // 2. Take Topbar Detail Screenshot (validating no text wrap in status pill)
  const topbar = await page.locator('header').first();
  if (topbar) {
    const topbarPath = path.join(OUTPUT_DIR, 'admin-topbar-detail.png');
    await topbar.screenshot({ path: topbarPath });
    console.log(`✓ Saved: admin-topbar-detail.png`);
  }

  // 3. Navigate & Capture Each Tab
  for (const tab of TABS) {
    console.log(`\nNavigating to tab: ${tab.label}...`);
    const btn = page.locator(`aside button:has-text("${tab.label}")`).first();
    await btn.click();

    // Allow data fetches to complete
    await page.waitForTimeout(1200);

    const filename = `admin-${tab.id}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.screenshot({
      path: filepath,
      fullPage: false, // captures the exact viewport view as the user experiences
    });

    console.log(`✓ Saved: ${filename} (${tab.desc})`);
  }

  await browser.close();
  console.log('\nAll 10 admin tab screenshots successfully captured and saved in:');
  console.log(OUTPUT_DIR);
}

captureAdminScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
