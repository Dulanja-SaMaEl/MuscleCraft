const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const sourceWebpPath = 'E:/The monolith/gym/Create_a_single_continuous,_seamless_20261019130134.webp';
const desktopOutDir = path.join(__dirname, '..', 'public', 'media', 'frames', 'desktop');
const mobileOutDir = path.join(__dirname, '..', 'public', 'media', 'frames', 'mobile');
const manifestPath = path.join(__dirname, '..', 'public', 'media', 'frames', 'frames.json');
const mediaDir = path.join(__dirname, '..', 'public', 'media');

async function run() {
  console.log('=== High-Quality WebP Frame Extraction & Optimization ===');
  console.log(`Source WebP: ${sourceWebpPath}`);

  if (!fs.existsSync(sourceWebpPath)) {
    console.error(`Error: Source file not found: ${sourceWebpPath}`);
    process.exit(1);
  }

  const fileData = fs.readFileSync(sourceWebpPath);
  const fileSizeMb = (fileData.length / (1024 * 1024)).toFixed(2);
  console.log(`Source WebP size: ${fileSizeMb} MB`);

  // Also save a copy of the high-quality master WebP directly in public/media/
  const masterCopyPath = path.join(mediaDir, 'musclecraft-hero-sequence.webp');
  fs.copyFileSync(sourceWebpPath, masterCopyPath);
  console.log(`Saved master animation to: ${masterCopyPath}`);

  // Create clean directories
  fs.mkdirSync(desktopOutDir, { recursive: true });
  fs.mkdirSync(mobileOutDir, { recursive: true });

  // Clean existing frames
  const oldDesktop = fs.readdirSync(desktopOutDir).filter(f => f.endsWith('.webp'));
  oldDesktop.forEach(f => fs.unlinkSync(path.join(desktopOutDir, f)));
  const oldMobile = fs.readdirSync(mobileOutDir).filter(f => f.endsWith('.webp'));
  oldMobile.forEach(f => fs.unlinkSync(path.join(mobileOutDir, f)));
  console.log(`Cleared previous frames (${oldDesktop.length} desktop, ${oldMobile.length} mobile).`);

  // Local server for Chromium to fetch the WebP file with zero CORS issues
  const server = http.createServer((req, res) => {
    if (req.url === '/source.webp') {
      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': fileData.length,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(fileData);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!DOCTYPE html><html><body><h1>MuscleCraft Frame Pipeline</h1></body></html>');
    }
  });

  const port = 4598;
  await new Promise(resolve => server.listen(port, resolve));

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}`);

  let desktopCount = 0;
  let mobileCount = 0;

  // Expose node function to save frame buffers to disk
  await page.exposeFunction('saveDesktopFrame', (index, base64Data) => {
    const padded = String(index).padStart(4, '0');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(desktopOutDir, `frame_${padded}.webp`), buffer);
    desktopCount++;
  });

  await page.exposeFunction('saveMobileFrame', (index, base64Data) => {
    const padded = String(index).padStart(4, '0');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(mobileOutDir, `frame_${padded}.webp`), buffer);
    mobileCount++;
  });

  await page.exposeFunction('reportProgress', (current, total) => {
    process.stdout.write(`  Processing frames: ${current}/${total} (${Math.round((current / total) * 100)}%)\r`);
  });

  console.log('\nDecoding WebP and generating dual-tier frame sets (1080p Desktop + 540p Mobile)...');
  const metadata = await page.evaluate(async (p) => {
    const res = await fetch(`http://localhost:${p}/source.webp`);
    const buf = await res.arrayBuffer();
    const decoder = new ImageDecoder({ data: buf, type: 'image/webp' });
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const totalFrames = track.frameCount;

    const { image: sample } = await decoder.decode({ frameIndex: 0 });
    const originalWidth = sample.displayWidth;
    const originalHeight = sample.displayHeight;
    sample.close();

    // Setup Desktop Canvas (1920x1080 full HD)
    const desktopCanvas = document.createElement('canvas');
    desktopCanvas.width = 1920;
    desktopCanvas.height = 1080;
    const desktopCtx = desktopCanvas.getContext('2d', { willReadFrequently: true });
    desktopCtx.imageSmoothingEnabled = true;
    desktopCtx.imageSmoothingQuality = 'high';

    // Setup Mobile Canvas (960x540 optimized retina)
    const mobileCanvas = document.createElement('canvas');
    mobileCanvas.width = 960;
    mobileCanvas.height = 540;
    const mobileCtx = mobileCanvas.getContext('2d', { willReadFrequently: true });
    mobileCtx.imageSmoothingEnabled = true;
    mobileCtx.imageSmoothingQuality = 'medium';

    let mobileIndex = 1;

    for (let i = 0; i < totalFrames; i++) {
      const { image } = await decoder.decode({ frameIndex: i });

      // 1. Desktop Frame (Full 1080p, quality 0.82)
      desktopCtx.drawImage(image, 0, 0, 1920, 1080);
      const desktopDataUrl = desktopCanvas.toDataURL('image/webp', 0.82);
      const desktopBase64 = desktopDataUrl.split(',')[1];
      await window.saveDesktopFrame(i + 1, desktopBase64);

      // 2. Mobile Frame (every 2nd frame, 960x540, quality 0.74)
      if (i % 2 === 0) {
        mobileCtx.drawImage(image, 0, 0, 960, 540);
        const mobileDataUrl = mobileCanvas.toDataURL('image/webp', 0.74);
        const mobileBase64 = mobileDataUrl.split(',')[1];
        await window.saveMobileFrame(mobileIndex, mobileBase64);
        mobileIndex++;
      }

      image.close();

      if ((i + 1) % 10 === 0 || i + 1 === totalFrames) {
        await window.reportProgress(i + 1, totalFrames);
      }
    }

    return {
      totalFrames,
      originalWidth,
      originalHeight,
      desktopWidth: 1920,
      desktopHeight: 1080,
      mobileWidth: 960,
      mobileHeight: 540
    };
  }, port);

  await browser.close();
  server.close();

  console.log(`\n\nExtraction completed successfully:`);
  console.log(`- Desktop: ${desktopCount} frames @ ${metadata.desktopWidth}x${metadata.desktopHeight}`);
  console.log(`- Mobile:  ${mobileCount} frames @ ${metadata.mobileWidth}x${metadata.mobileHeight}`);

  // Calculate directory sizes
  const getDirSizeMb = (dir) => {
    const bytes = fs.readdirSync(dir)
      .map(f => fs.statSync(path.join(dir, f)).size)
      .reduce((a, b) => a + b, 0);
    return Number((bytes / (1024 * 1024)).toFixed(2));
  };

  const desktopSizeMb = getDirSizeMb(desktopOutDir);
  const mobileSizeMb = getDirSizeMb(mobileOutDir);

  console.log(`- Desktop Total Size: ${desktopSizeMb} MB (~${(desktopSizeMb / desktopCount * 1024).toFixed(1)} KB/frame)`);
  console.log(`- Mobile Total Size:  ${mobileSizeMb} MB (~${(mobileSizeMb / mobileCount * 1024).toFixed(1)} KB/frame)`);

  // Write updated manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceFile: 'Create_a_single_continuous,_seamless_20261019130134.webp',
    desktop: {
      count: desktopCount,
      width: metadata.desktopWidth,
      height: metadata.desktopHeight,
      aspectRatio: metadata.desktopWidth / metadata.desktopHeight,
      basePath: '/media/frames/desktop',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: desktopSizeMb
    },
    mobile: {
      count: mobileCount,
      width: metadata.mobileWidth,
      height: metadata.mobileHeight,
      aspectRatio: metadata.mobileWidth / metadata.mobileHeight,
      basePath: '/media/frames/mobile',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: mobileSizeMb
    }
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${manifestPath}`);
  console.log('=== Done! ===');
}

run().catch((err) => {
  console.error('Fatal error during extraction:', err);
  process.exit(1);
});
