const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const SOURCE_DIR = process.env.FRAMES_SOURCE || 'E:\\The monolith\\gym';
const OUTPUT_BASE_DIR = path.join(__dirname, '..', 'public', 'media', 'frames');
const DESKTOP_DIR = path.join(OUTPUT_BASE_DIR, 'desktop');
const MOBILE_DIR = path.join(OUTPUT_BASE_DIR, 'mobile');
const MANIFEST_PATH = path.join(OUTPUT_BASE_DIR, 'frames.json');

// Ensure output directories exist
fs.mkdirSync(DESKTOP_DIR, { recursive: true });
fs.mkdirSync(MOBILE_DIR, { recursive: true });

function formatIndex(num, pad = 4) {
  return String(num).padStart(pad, '0');
}

function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Concurrency pool helper
async function pool(tasks, concurrency = 6) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

function getDirectorySize(dir) {
  const files = fs.readdirSync(dir);
  let totalBytes = 0;
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      totalBytes += stats.size;
    }
  }
  return totalBytes;
}

async function run() {
  console.log('=== IronForge Frame Pipeline Optimizer ===');
  console.log(`Source directory: ${SOURCE_DIR}`);
  console.log(`Desktop output:   ${DESKTOP_DIR}`);
  console.log(`Mobile output:    ${MOBILE_DIR}\n`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`ERROR: Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Find all frame jpg files
  const allFiles = fs.readdirSync(SOURCE_DIR)
    .filter((f) => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'))
    .sort();

  console.log(`Found ${allFiles.length} source frames.`);
  if (allFiles.length === 0) {
    console.error('No matching frame files found (expected ezgif-frame-*.jpg)');
    process.exit(1);
  }

  // 1. Process Desktop Set: all 240 frames, 1600px wide, quality 75
  console.log('\n[1/2] Processing Desktop Frames (1600px, WebP, quality 75)...');
  const desktopTasks = allFiles.map((file, idx) => {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputFilename = `frame_${formatIndex(idx + 1)}.webp`;
    const outputPath = path.join(DESKTOP_DIR, outputFilename);
    return async () => {
      const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=1600:-2" -c:v libwebp -quality 75 "${outputPath}"`;
      await execPromise(cmd);
      if ((idx + 1) % 40 === 0 || idx + 1 === allFiles.length) {
        process.stdout.write(`  Desktop: ${idx + 1}/${allFiles.length} processed\r`);
      }
    };
  });
  await pool(desktopTasks, 8);
  console.log(`\n  Desktop frames complete: ${allFiles.length} frames.`);

  // 2. Process Mobile Set: every 2nd frame (120 frames), 900px wide, quality 70
  console.log('\n[2/2] Processing Mobile Frames (every 2nd frame, 900px, WebP, quality 70)...');
  const mobileSourceFiles = allFiles.filter((_, idx) => idx % 2 === 0);
  const mobileTasks = mobileSourceFiles.map((file, idx) => {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputFilename = `frame_${formatIndex(idx + 1)}.webp`;
    const outputPath = path.join(MOBILE_DIR, outputFilename);
    return async () => {
      const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=900:-2" -c:v libwebp -quality 70 "${outputPath}"`;
      await execPromise(cmd);
      if ((idx + 1) % 20 === 0 || idx + 1 === mobileSourceFiles.length) {
        process.stdout.write(`  Mobile: ${idx + 1}/${mobileSourceFiles.length} processed\r`);
      }
    };
  });
  await pool(mobileTasks, 8);
  console.log(`\n  Mobile frames complete: ${mobileSourceFiles.length} frames.`);

  // Measure sizes
  const desktopSizeBytes = getDirectorySize(DESKTOP_DIR);
  const mobileSizeBytes = getDirectorySize(MOBILE_DIR);
  const desktopMb = (desktopSizeBytes / (1024 * 1024)).toFixed(2);
  const mobileMb = (mobileSizeBytes / (1024 * 1024)).toFixed(2);

  console.log('\n==========================================');
  console.log('FRAME PIPELINE SUMMARY:');
  console.log(`Desktop Set: ${allFiles.length} frames | Total size: ${desktopMb} MB (target: < 15 MB)`);
  console.log(`Mobile Set:  ${mobileSourceFiles.length} frames | Total size: ${mobileMb} MB (target: < 5 MB)`);
  console.log('==========================================');

  // Write frames.json manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    desktop: {
      count: allFiles.length,
      width: 1600,
      height: 900,
      aspectRatio: 16 / 9,
      basePath: '/media/frames/desktop',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: parseFloat(desktopMb)
    },
    mobile: {
      count: mobileSourceFiles.length,
      width: 900,
      height: 506,
      aspectRatio: 900 / 506,
      basePath: '/media/frames/mobile',
      filePattern: 'frame_{index}.webp',
      padLength: 4,
      totalSizeMb: parseFloat(mobileMb)
    }
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote manifest: ${MANIFEST_PATH}`);
}

run().catch((err) => {
  console.error('Frame processing failed:', err);
  process.exit(1);
});
