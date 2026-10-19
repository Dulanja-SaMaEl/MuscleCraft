const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '..', 'media-source');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'media');

function runCommand(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function optimizeMedia() {
  console.log('=== IronForge Media Optimizer ===');
  console.log(`Source directory: ${SOURCE_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // Ensure directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    console.log(`Created source directory: ${SOURCE_DIR}`);
    console.log(`Please place source clips in 'media-source/' named e.g. 'hero.mp4', 'forge.mp4', 'bar.mp4'.`);
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.mp4', '.mov', '.mkv', '.avi', '.webm'].includes(ext);
  });

  if (files.length === 0) {
    console.log(`No video files found in ${SOURCE_DIR}.`);
    console.log(`Place your raw 4K/1080p clips here (e.g. hero.mov, forge.mp4, bar.mp4) and rerun 'npm run media:optimize'.`);
    return;
  }

  files.forEach((file) => {
    const name = path.basename(file, path.extname(file));
    const inputPath = path.join(SOURCE_DIR, file);

    console.log(`\n--------------------------------------------`);
    console.log(`Processing clip: ${file} -> "${name}"`);
    console.log(`--------------------------------------------`);

    const outMp4 = path.join(OUTPUT_DIR, `${name}.mp4`);
    const outWebm = path.join(OUTPUT_DIR, `${name}.webm`);
    const outMobile = path.join(OUTPUT_DIR, `${name}-mobile.mp4`);
    const outPoster = path.join(OUTPUT_DIR, `${name}-poster.jpg`);

    // 1. Desktop H.264 MP4 (1920 wide, CRF 28, no audio, +faststart, target <3MB)
    console.log(`\n[1/4] Encoding Desktop 1080p MP4 (CRF 28, faststart)...`);
    runCommand(
      `ffmpeg -y -i "${inputPath}" -vf "scale=1920:-2" -c:v libx264 -preset slow -crf 28 -an -movflags +faststart "${outMp4}"`
    );

    // 2. WebM VP9 (1920 wide, CRF 34, no audio)
    console.log(`\n[2/4] Encoding Desktop WebM (VP9)...`);
    runCommand(
      `ffmpeg -y -i "${inputPath}" -vf "scale=1920:-2" -c:v libvpx-vp9 -b:v 0 -crf 34 -an "${outWebm}"`
    );

    // 3. Mobile 720p MP4 (720 wide, CRF 30, no audio, +faststart)
    console.log(`\n[3/4] Encoding Mobile 720p MP4 (CRF 30)...`);
    runCommand(
      `ffmpeg -y -i "${inputPath}" -vf "scale=720:-2" -c:v libx264 -preset slow -crf 30 -an -movflags +faststart "${outMobile}"`
    );

    // 4. Poster JPG (frame at 1.0s)
    console.log(`\n[4/4] Extracting Poster JPG...`);
    runCommand(
      `ffmpeg -y -ss 00:00:01 -i "${inputPath}" -vframes 1 -q:v 3 "${outPoster}"`
    );

    // Report sizes
    const getStat = (p) => (fs.existsSync(p) ? `${(fs.statSync(p).size / 1024 / 1024).toFixed(2)} MB` : 'N/A');
    console.log(`\nResults for "${name}":`);
    console.log(`  - Desktop MP4:   ${getStat(outMp4)}`);
    console.log(`  - Desktop WebM:  ${getStat(outWebm)}`);
    console.log(`  - Mobile MP4:    ${getStat(outMobile)}`);
    console.log(`  - Poster JPG:    ${getStat(outPoster)}`);
  });

  console.log('\nAll media successfully optimized into public/media/!');
}

optimizeMedia();
