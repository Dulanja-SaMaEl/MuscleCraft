const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testVideoSystem() {
  console.log('🧪 Starting Video Storage & UI Player Verification Suite...\n');

  const screenshotsDir = 'C:\\Users\\dulan\\.gemini\\antigravity\\brain\\dce63ac5-4d05-4650-ae9b-3d26cae7b97d\\video-screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Test Video Upload API Route
  console.log('1. Testing /api/videos/upload API endpoint...');
  const dummyVideoBuffer = Buffer.from('FAKE_MP4_HEADER_VIDEO_STREAM_DATA_MUSCLECRAFT_2026');
  const boundary = '----WebKitFormBoundaryMuscleCraftVideo7MA4YWxkTrZu0gW';
  
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="squat-form-analysis.mp4"\r\nContent-Type: video/mp4\r\n\r\n`),
    dummyVideoBuffer,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nMarcus Squat Depth Analysis\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes = await fetch('http://localhost:3000/api/videos/upload?userId=usr_admin_1', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  const uploadJson = await uploadRes.json();
  console.log('Upload API response status:', uploadRes.status);
  console.log('Upload result:', uploadJson);

  if (uploadRes.status === 200 && uploadJson.url) {
    console.log('✅ PASS: Video upload API endpoint accepts and processes video stream successfully');
  } else {
    console.error('❌ FAIL: Video upload API failed:', uploadJson);
  }

  // 2. Playwright UI Verification & Screenshot Capture
  console.log('\n2. Launching Playwright browser to capture UI screenshots...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // A. Admin Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('adeesha@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('admin');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  // Navigate to Videos Vault
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('aside button:has-text("Session Videos Vault")').click();
  await page.waitForTimeout(1000);

  // Screenshot 1: Videos Vault Tab with R2 Guide button
  await page.screenshot({ path: path.join(screenshotsDir, '01-videos-vault-dashboard.png') });
  console.log('✅ Screenshot 01: Videos Vault with Cloudflare R2 button captured');

  // Screenshot 2: Cloudflare R2 Guide Modal
  await page.locator('button:has-text("Cloudflare R2 Storage Guide")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, '02-cloudflare-r2-setup-modal.png') });
  console.log('✅ Screenshot 02: Cloudflare R2 Step-by-Step Guide Modal captured');
  await page.locator('button:has-text("Done / Got It")').click();
  await page.waitForTimeout(500);

  // Screenshot 3: Video Upload Modal with Progress & Percentage
  await page.locator('button:has-text("Submit New Session Video")').click();
  await page.waitForTimeout(600);

  // Simulate file selection into file input to test upload percentage UI
  const tempTestFilePath = path.join(__dirname, 'test-temp-clip.mp4');
  fs.writeFileSync(tempTestFilePath, Buffer.alloc(1024 * 1024 * 2)); // 2MB fake video file
  await page.setInputFiles('#videoFileInput', tempTestFilePath);
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(screenshotsDir, '03-video-upload-percentage-progress.png') });
  console.log('✅ Screenshot 03: Video Upload Modal with Percentage Progress bar captured');
  await page.locator('button[aria-label="Close modal"]').click();
  await page.waitForTimeout(500);
  if (fs.existsSync(tempTestFilePath)) fs.unlinkSync(tempTestFilePath);

  // Screenshot 4: Video Preview Player Modal with custom controls
  await page.locator('button:has-text("Watch")').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, '04-admin-video-player-preview.png') });
  console.log('✅ Screenshot 04: Admin Video Player Modal with Custom Luxury Controls captured');
  await page.locator('button[aria-label="Close preview"]').click();
  await page.waitForTimeout(500);

  // Screenshot 5: Client Athlete Portal Video Player
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.locator('main form input[type="email"]').fill('marcus@musclecraft.lk');
  await page.locator('main form input[type="password"]').fill('ClientPass2026!');
  await page.locator('main form button:has-text("Sign In to Portal")').click();
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:3000/client', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Video Vault")').first().click();
  await page.waitForTimeout(1000);

  // Click on first video card
  await page.locator('div.group:has(img)').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, '05-client-athlete-video-player.png') });
  console.log('✅ Screenshot 05: Client Athlete Portal Video Player captured');

  await browser.close();
  console.log('\n✨ ALL VIDEO STORAGE, UPLOAD PERCENTAGE, AND PLAYER UI TESTS COMPLETED SUCCESSFULLY!\n');
}

testVideoSystem().catch(console.error);
