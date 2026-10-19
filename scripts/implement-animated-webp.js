const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const sourceWebpPath = 'E:/The monolith/gym/Create_a_single_continuous_seamless_20261019130134-ezgif.com-video-to-webp-converter.webp';
const desktopOutDir = path.join(__dirname, '..', 'public', 'media', 'frames', 'desktop');
const mobileOutDir = path.join(__dirname, '..', 'public', 'media', 'frames', 'mobile');
const backupDir = path.join(__dirname, '..', 'public', 'media', 'frames', 'backup_1080p');
const manifestPath = path.join(__dirname, '..', 'public', 'media', 'frames', 'frames.json');

async function run() {
  console.log('--- Step 1: Backing up existing frames ---');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    // Copy existing desktop frames to backup if not already backed up
    if (fs.existsSync(desktopOutDir)) {
      const existing = fs.readdirSync(desktopOutDir).filter(f => f.endsWith('.webp'));
      if (existing.length > 0) {
        fs.mkdirSync(path.join(backupDir, 'desktop'), { recursive: true });
        existing.forEach(f => fs.copyFileSync(path.join(desktopOutDir, f), path.join(backupDir, 'desktop', f)));
        console.log(`Backed up ${existing.length} frames to backup_1080p/desktop`);
      }
    }
  }

  console.log('--- Step 2: Reading source WebP ---');
  const fileData = fs.readFileSync(sourceWebpPath);
  console.log(`Source WebP size: ${(fileData.length / (1024 * 1024)).toFixed(2)} MB`);

  // Start local streaming server
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': fileData.length,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(fileData);
  });

  const port = 4579;
  await new Promise(resolve => server.listen(port, resolve));

  console.log('--- Step 3: Launching Chromium ImageDecoder ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Prepare clean output directories
  fs.mkdirSync(desktopOutDir, { recursive: true });
  fs.mkdirSync(mobileOutDir, { recursive: true });

  // Clean old frames
  fs.readdirSync(desktopOutDir).forEach(f => fs.unlinkSync(path.join(desktopOutDir, f)));
  fs.readdirSync(mobileOutDir).forEach(f => fs.unlinkSync(path.join(mobileOutDir, f)));

  // Expose node callback to write frames directly
  let desktopCount = 0;
  let mobileCount = 0;

  await page.exposeFunction('saveFrame', (frameIdx, base64Data) => {
    const padded = String(frameIdx).padStart(4, '0');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Desktop frame
    const desktopFile = path.join(desktopOutDir, `frame_${padded}.webp`);
    fs.writeFileSync(desktopFile, buffer);
    desktopCount++;

    // Mobile frame (every 2nd frame)
    if (frameIdx % 2 !== 0) {
      const mobileIdx = Math.floor(frameIdx / 2) + 1;
      const mobilePadded = String(mobileIdx).padStart(4, '0');
      const mobileFile = path.join(mobileOutDir, `frame_${mobilePadded}.webp`);
      fs.writeFileSync(mobileFile, buffer);
      mobileCount++;
    }
  });

  console.log('--- Step 4: Decoding and extracting frames ---');
  const metadata = await page.evaluate(async (p) => {
    const res = await fetch(`http://localhost:${p}`);
    const buf = await res.arrayBuffer();
    const decoder = new ImageDecoder({ data: buf, type: 'image/webp' });
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const totalFrames = track.frameCount;

    const { image: sample } = await decoder.decode({ frameIndex: 0 });
    const width = sample.displayWidth;
    const height = sample.displayHeight;
    sample.close();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (let i = 0; i < totalFrames; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      ctx.drawImage(image, 0, 0);
      image.close();

      const dataUrl = canvas.toDataURL('image/webp', 0.90);
      const base64 = dataUrl.split(',')[1];
      await window.saveFrame(i + 1, base64);
    }

    return { totalFrames, width, height };
  }, port);

  await browser.close();
  server.close();

  console.log(`Extracted ${desktopCount} desktop frames and ${mobileCount} mobile frames (${metadata.width}x${metadata.height})`);

  // Calculate sizes
  const getDirSize = (dir) => {
    return fs.readdirSync(dir)
      .map(f => fs.statSync(path.join(dir, f)).size)
      .reduce((a, b) => a + b, 0);
  };

  const desktopSizeMb = Number((getDirSize(desktopOutDir) / (1024 * 1024)).toFixed(2));
  const mobileSizeMb = Number((getDirSize(mobileOutDir) / (1024 * 1024)).toFixed(2));

  console.log(`Desktop total size: ${desktopSizeMb} MB`);
  console.log(`Mobile total size: ${mobileSizeMb} MB`);

  // Write frames.json manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceFile: 'Create_a_single_continuous_seamless_20261019130134-ezgif.com-video-to-webp-converter.webp',
    desktop: {
      count: desktopCount,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      basePath: '/media/frames/desktop',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: desktopSizeMb
    },
    mobile: {
      count: mobileCount,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      basePath: '/media/frames/mobile',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: mobileSizeMb
    }
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest written to ${manifestPath}`);
  console.log('--- Completed successfully! ---');
}

run().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
