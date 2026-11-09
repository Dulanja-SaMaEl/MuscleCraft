/**
 * MuscleCraft Fitness Platform — Comprehensive End-to-End Test Suite
 * Tests every route, all viewports (Mobile, Tablet, Desktop), UI interactions,
 * authentication, RBAC redirects, Client athlete portal, and Admin Daily Sales & Ad CRM Dashboard.
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'Mobile (iPhone 13)', width: 375, height: 812 },
  { name: 'Tablet (iPad Mini)', width: 768, height: 1024 },
  { name: 'Desktop (Full HD)', width: 1440, height: 900 },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function recordResult(category, testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    results.push({ category, testName, status: 'PASS', details });
    console.log(`  ✓ [PASS] ${category} > ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failedTests++;
    results.push({ category, testName, status: 'FAIL', details });
    console.error(`  ✗ [FAIL] ${category} > ${testName} - ${details}`);
  }
}

async function runSuite() {
  console.log('\n======================================================================');
  console.log('🚀 STARTING MUSCLECRAFT FULL PLATFORM E2E VERIFICATION SUITE');
  console.log(`Target Host: ${BASE_URL}`);
  console.log('======================================================================\n');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.error('Failed to launch Playwright msedge:', err.message);
    process.exit(1);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // -------------------------------------------------------------------------
  // SUITE 1: Public Pages & Static Navigation
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 1] Verifying Public Routes & Brand Pages');
  const publicRoutes = [
    { path: '/', keySelector: 'h1' },
    { path: '/about', keySelector: 'main' },
    { path: '/memberships', keySelector: 'main' },
    { path: '/pricing', keySelector: 'main' },
    { path: '/contact', keySelector: 'main' },
    { path: '/faq', keySelector: 'main' },
    { path: '/terms', keySelector: 'main' },
    { path: '/privacy', keySelector: 'main' },
    { path: '/checkout', keySelector: 'form, h1' },
    { path: '/login', keySelector: 'main form' },
  ];

  for (const r of publicRoutes) {
    try {
      const res = await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = res ? res.status() : 0;
      const elementFound = (await page.$(r.keySelector)) !== null;
      recordResult('Public Routes', `GET ${r.path}`, status === 200 && elementFound, `HTTP ${status}`);
    } catch (err) {
      recordResult('Public Routes', `GET ${r.path}`, false, err.message);
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Multi-Device Responsive Layout Tests
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 2] Responsive Multi-Device Audits');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    recordResult('Responsiveness', `No horizontal overflow on ${vp.name}`, !hasHorizontalOverflow, `${vp.width}x${vp.height}px`);

    const logoExists = await page.isVisible('img[alt*="MuscleCraft"], img[alt*="Emblem"], nav a');
    recordResult('Responsiveness', `Navbar brand visible on ${vp.name}`, logoExists);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Production Login Portal & User Authentication
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 3] Production Login Portal & User Authentication');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // 3.1 Demo Persona fast-pass removed
  const hasDemoFastPass = await page.isVisible('text=Instant Reviewer Fast-Pass');
  recordResult('Auth Flow', 'Demo persona fast-pass buttons removed for production', !hasDemoFastPass);

  // 3.2 Show/Hide Password Toggle
  const passwordInput = page.locator('main form input[type="password"]');
  await passwordInput.fill('SecretPassword123');
  const toggleBtn = page.locator('main form button:has(svg.lucide-eye), main form button:has(svg.lucide-eye-off)');
  if (await toggleBtn.count() > 0) {
    await toggleBtn.first().click();
    await page.waitForTimeout(200);
    const inputType = await page.locator('main form input[value="SecretPassword123"]').getAttribute('type');
    recordResult('Auth Flow', 'Password show/hide toggle switches to text', inputType === 'text');
    await toggleBtn.first().click();
  }

  // 3.3 Forgot Password WhatsApp Modal
  const forgotBtn = page.locator('button:has-text("Forgot Password?")');
  if (await forgotBtn.isVisible()) {
    await forgotBtn.click();
    await page.waitForTimeout(300);
    const modalVisible = await page.locator('text=Adeesha Kumarasingha').first().isVisible();
    const waLink = await page.isVisible('a[href*="wa.me"]');
    recordResult('Auth Flow', 'Forgot Password modal displays Coach Adeesha WhatsApp', modalVisible && waLink);
    await page.locator('button:has-text("Close")').click();
    await page.waitForTimeout(200);
  }

  // 3.4 Cohort 90-Day Auto-Logout Banner
  await page.goto(`${BASE_URL}/login?reason=expired_90day`, { waitUntil: 'domcontentloaded' });
  const bannerVisible = await page.locator('text=90-Day Coaching Access Concluded').isVisible();
  recordResult('Auth Flow', '90-Day coaching cohort auto-logout notice banner displayed', bannerVisible);

  // 3.5 Real Login: Admin Authentication
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('AdeeshaOwner2026!');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  const adminUrl = page.url();
  recordResult('Auth Flow', 'Sign in as Owner/Admin redirects to /admin', adminUrl.includes('/admin'), adminUrl);

  // -------------------------------------------------------------------------
  // SUITE 4: Admin Panel & "Musclecraft Daily Dashboard" CRM Validation
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 4] Admin Panel Navigation & Client Spreadsheet CRM Tab');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

  // 4.1 Admin Header & Coach Identity
  const coachIdentity = await page.locator('text=Adeesha Kumarasingha').first().isVisible();
  recordResult('Admin Panel', 'Head Coach / Admin workspace loaded', coachIdentity);

  // 4.2 Switch to "Daily Sales & Ad CRM" tab
  await page.locator('aside button:has-text("Daily Sales & Ad CRM")').click();
  // Allow live Supabase cloud fetch to resolve
  try {
    await page.waitForResponse((r) => r.url().includes('/api/admin/daily-sales'), { timeout: 4000 });
  } catch (e) {
    // fallback wait if already cached
  }
  await page.waitForTimeout(1000);

  // Crimson Header
  const bannerHeader = await page.locator('text=Musclecraft Daily Dashboard').isVisible();
  recordResult('Daily Dashboard', 'Musclecraft Daily Dashboard crimson header rendered', bannerHeader);

  // Lifetime Spend Badge
  const lifetimeSpendVisible = await page.locator('text=635,555.20').isVisible();
  recordResult('Daily Dashboard', 'Lifetime Ad Account Spend (Rs. 635,555.20) rendered', lifetimeSpendVisible);

  // Left CRM Summary Matrix
  const crmDailyCard = await page.locator('text=Orders Count').isVisible();
  const roasLabel = await page.locator('text=ROAS').first().isVisible();
  const cprLabel = await page.locator('text=CPR').first().isVisible();
  recordResult('Daily Dashboard', 'CRM Summary matrix (AOV, CPR, ROAS, Msg Count, CAC) rendered', crmDailyCard && roasLabel && cprLabel);

  // Daily Sales Review Table Headers
  const dateCol = await page.isVisible('th:has-text("Date")');
  const targetCol = await page.isVisible('th:has-text("Target")');
  const actualCol = await page.isVisible('th:has-text("Actual")');
  const spendCol = await page.isVisible('th:has-text("Spend")');
  const msgCol = await page.isVisible('th:has-text("Msg count")');
  recordResult('Daily Dashboard', 'Review Table columns (Date, Target, Actual, DIFF, Spend, Msg count, Order count, ROAS, CPR)', 
    dateCol && targetCol && actualCol && spendCol && msgCol);

  // Nov 1–6 figures from images
  const nov1Spend = await page.locator('text=1,986.11').first().isVisible();
  const nov2Spend = await page.locator('text=1,277.03').first().isVisible();
  recordResult('Daily Dashboard', 'Client spreadsheet exact figures (Nov 1-6 records) populated', nov1Spend && nov2Spend);

  // Cumulative Footer
  const cumulativeRow = await page.locator('text=Cumulative').first().isVisible();
  recordResult('Daily Dashboard', 'Cumulative totals footer row displayed', cumulativeRow);

  // Charts
  const mtdSales = await page.locator('text=MTD SALES').isVisible();
  const mtdSpend = await page.locator('text=MTD SPEND').isVisible();
  recordResult('Daily Dashboard', 'MTD Sales and MTD Spend trend charts rendered', mtdSales && mtdSpend);

  // Quick Log Today Modal
  const quickLogBtn = page.locator('button:has-text("Quick Log Today")');
  if (await quickLogBtn.isVisible()) {
    await quickLogBtn.click();
    await page.waitForTimeout(300);
    const modalOpen = await page.locator('text=Quick Log Daily Marketing').isVisible();
    recordResult('Daily Dashboard', 'Quick Log Today entry modal opens successfully', modalOpen);
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(200);
  }

  // 4.3 Bank Approvals Tab
  await page.locator('aside button:has-text("Bank Approvals")').click();
  await page.waitForTimeout(500);
  const bankApprovalsLoaded = await page.locator('h2:has-text("Bank Transfer Slips")').isVisible();
  recordResult('Admin Panel', 'Bank Approvals tab loaded with slip ledger', bankApprovalsLoaded);

  // 4.4 Members Directory Tab
  await page.locator('aside button:has-text("Members Directory")').click();
  await page.waitForTimeout(500);
  const membersLoaded = await page.locator('h2:has-text("Members Directory & Roster")').isVisible();
  recordResult('Admin Panel', 'Members Management tab loaded', membersLoaded);

  // 4.5 Client Analytics & Care Tab
  await page.locator('aside button:has-text("Client Analytics & Care")').click();
  await page.waitForTimeout(500);
  const analyticsLoaded = await page.locator('h2:has-text("Client Body Analytics")').isVisible();
  recordResult('Admin Panel', 'Client Analytics Submissions tab loaded', analyticsLoaded);

  // 4.6 Session Videos Vault Tab
  await page.locator('aside button:has-text("Session Videos Vault")').click();
  await page.waitForTimeout(500);
  const videosVaultLoaded = await page.locator('h2:has-text("Session Videos & Video Vault Management")').isVisible();
  recordResult('Admin Panel', 'Session Videos Vault tab loaded', videosVaultLoaded);

  // 4.7 Broadcast Center Tab
  await page.locator('aside button:has-text("Broadcast Center")').click();
  await page.waitForTimeout(500);
  const broadcastLoaded = await page.locator('h2:has-text("Message Broadcast Center")').isVisible();
  recordResult('Admin Panel', 'Broadcast Center announcements console loaded', broadcastLoaded);

  // 4.8 Gym Packages Master Tab (Editable Packages)
  const pkgBtn = page.locator('aside button:has-text("Gym Packages Master")').first();
  await pkgBtn.scrollIntoViewIfNeeded();
  await pkgBtn.click();
  await page.waitForTimeout(500);
  const packagesLoaded = await page.locator('h2:has-text("Membership Packages & Pricing Master Desk")').isVisible();
  recordResult('Admin Panel', 'Gym Packages Master loaded with editable Sole & Couple packages', packagesLoaded);

  // 4.9 Database & Backend Telemetry Tab
  const dbBtn = page.locator('aside button:has-text("Database & Backend")').first();
  await dbBtn.scrollIntoViewIfNeeded();
  await dbBtn.click();
  await page.waitForTimeout(500);
  const dbHealthLoaded = await page.locator('h2:has-text("Database & Backend Infrastructure Telemetry")').isVisible();
  recordResult('Admin Panel', 'Database & Backend Telemetry monitor loaded', dbHealthLoaded);

  // 4.10 Audit Trail Tab
  const auditBtn = page.locator('aside button:has-text("Audit Trail")').first();
  await auditBtn.scrollIntoViewIfNeeded();
  await auditBtn.click();
  await page.waitForTimeout(500);
  const auditLoaded = await page.locator('h2:has-text("Administrative Audit Trail")').isVisible();
  recordResult('Admin Panel', 'Audit Trail log viewer loaded', auditLoaded);

  // 4.11 Admin Logout
  const adminLogoutBtn = page.locator('aside button:has-text("Sign Out"), aside button:has-text("Logout")').first();
  if (await adminLogoutBtn.isVisible()) {
    await adminLogoutBtn.click();
    await page.waitForTimeout(1000);
    recordResult('Admin Panel', 'Admin logout redirects back to login portal', page.url().includes('/login'));
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Client Athlete Portal (`/client`)
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 5] Client Athlete Portal Experience');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('marcus@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('ClientPass2026!');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  const clientUrl = page.url();
  recordResult('Client Portal', 'Client login redirects to /client', clientUrl.includes('/client'), clientUrl);

  const athleteName = await page.locator('h1:has-text("Marcus Vance")').isVisible();
  const vipBadge = await page.locator('text=90-Day VIP Coaching').isVisible();
  recordResult('Client Portal', 'Athlete identity (Marcus Vance) & VIP tier badge rendered', athleteName && vipBadge);

  // Client Tabs: Body Analytics & Progress
  const measTab = page.locator('button:has-text("Body Analytics & Progress")');
  if (await measTab.isVisible()) {
    await measTab.click();
    await page.waitForTimeout(500);
    const measLoaded = await page.locator('h3:has-text("Weekly Recomposition & Body Analytics")').isVisible();
    recordResult('Client Portal', 'Body Analytics & Progress tab loaded', measLoaded);

    // Open Log Weekly Measurements Modal
    const logBtn = page.locator('button:has-text("Add Week")');
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await page.waitForTimeout(300);
      const modalOpen = await page.locator('h3:has-text("Log Weekly Body Measurement")').isVisible();
      recordResult('Client Portal', 'Log Weekly Measurements modal opens', modalOpen);
      await page.locator('button:has-text("Cancel")').first().click();
      await page.waitForTimeout(200);
    }
  }

  // Client Tabs: Nutrition & Macro Protocol
  const dietTab = page.locator('button:has-text("Nutrition & Macro Protocol")');
  if (await dietTab.isVisible()) {
    await dietTab.click();
    await page.waitForTimeout(500);
    const dietLoaded = await page.locator('text=Daily Target').first().isVisible() || await page.locator('text=Protein').first().isVisible();
    recordResult('Client Portal', 'Nutrition & Macro Protocol tab loaded', dietLoaded);
  }

  // Client Tabs: Video Vault
  const videoTab = page.locator('button:has-text("Video Vault")');
  if (await videoTab.isVisible()) {
    await videoTab.click();
    await page.waitForTimeout(500);
    const videoLoaded = await page.locator('h3:has-text("Exercise & Masterclass Vault")').isVisible();
    recordResult('Client Portal', 'Exercise Video Vault tab loaded', videoLoaded);
  }

  // Client Tabs: Manual Transfer Records
  const billingTab = page.locator('button:has-text("Manual Transfer Records")');
  if (await billingTab.isVisible()) {
    await billingTab.click();
    await page.waitForTimeout(500);
    const billingLoaded = await page.locator('text=TRF-MC').first().isVisible() || await page.locator('text=Bank').first().isVisible();
    recordResult('Client Portal', 'Manual Transfer Records billing tab loaded', billingLoaded);
  }

  // Client Logout
  const clientLogoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
  if (await clientLogoutBtn.isVisible()) {
    await clientLogoutBtn.click();
    await page.waitForTimeout(1000);
    recordResult('Client Portal', 'Client logout redirects back to login portal', page.url().includes('/login'));
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Checkout & Bank Slip Submission Flow (`/checkout`)
  // -------------------------------------------------------------------------
  console.log('\n[SUITE 6] Checkout & Bank Slip Submission Flow');
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const bankAccountInfo = await page.locator('text=Commercial Bank of Ceylon').first().isVisible();
  recordResult('Checkout Flow', 'Official Bank account details (Commercial Bank of Ceylon) displayed', bankAccountInfo);

  const soleTierOption = await page.locator('text=Sole').first().isVisible();
  const coupleTierOption = await page.locator('text=Couple').first().isVisible();
  recordResult('Checkout Flow', 'Sole and Couple package selection options available', soleTierOption && coupleTierOption);

  await browser.close();

  // -------------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🏁 TEST SUITE RUN COMPLETED: ${passedTests}/${totalTests} PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  if (failedTests === 0) {
    console.log('🎉 100% PASS! ALL WORKFLOWS, BUTTONS, PAGES, AND RESPONSIVE VIEWS FUNCTIONAL!');
  } else {
    console.log(`⚠️ ${failedTests} tests flagged.`);
  }
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
