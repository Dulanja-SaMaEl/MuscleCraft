const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  
  const logoSrc = 'C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/.user_uploaded/media_1792425960618_9564c627.png';
  const logoBuf = fs.readFileSync(logoSrc);
  
  // Ensure directories exist
  const publicImages = path.join(__dirname, '../public/images');
  const publicReviews = path.join(__dirname, '../public/reviews');
  fs.mkdirSync(publicImages, { recursive: true });
  fs.mkdirSync(publicReviews, { recursive: true });
  
  // Save full logo
  fs.writeFileSync(path.join(publicImages, 'musclecraft-logo.png'), logoBuf);
  console.log('Saved full logo to public/images/musclecraft-logo.png');

  // Use browser canvas to find emblem bounding box and crop emblem
  const b64 = logoBuf.toString('base64');
  await page.setContent('<canvas id="c" width="1024" height="1024"></canvas>');
  
  const cropData = await page.evaluate(async (b64) => {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + b64; });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 1024, 1024).data;
    
    // Find emblem top, bottom, left, right (the gear + bicep is in the top section before MUSCLECRAFT text)
    // MUSCLECRAFT text is around y ~ 600
    let minX = 1024, maxX = 0, minY = 1024, maxY = 0;
    for (let y = 0; y < 600; y++) {
      for (let x = 0; x < 1024; x++) {
        const idx = (y * 1024 + x) * 4;
        if (data[idx + 3] > 20) { // non-transparent
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Also find full text bounds
    let textMinY = 1024, textMaxY = 0;
    for (let y = 600; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const idx = (y * 1024 + x) * 4;
        if (data[idx + 3] > 20) {
          if (y < textMinY) textMinY = y;
          if (y > textMaxY) textMaxY = y;
        }
      }
    }
    
    // Draw cropped emblem on another canvas
    const w = maxX - minX;
    const h = maxY - minY;
    const emblemCanvas = document.createElement('canvas');
    emblemCanvas.width = w;
    emblemCanvas.height = h;
    const ectx = emblemCanvas.getContext('2d');
    ectx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
    
    return {
      emblemBounds: { minX, maxX, minY, maxY, w, h },
      textBounds: { textMinY, textMaxY },
      emblemBase64: emblemCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
    };
  }, b64);
  
  console.log('Emblem bounds:', cropData.emblemBounds);
  console.log('Text bounds:', cropData.textBounds);
  
  fs.writeFileSync(
    path.join(publicImages, 'musclecraft-emblem.png'),
    Buffer.from(cropData.emblemBase64, 'base64')
  );
  console.log('Saved emblem to public/images/musclecraft-emblem.png');

  // Copy reviews from E:\The monolith\gym\Reviews
  const reviewsDir = 'E:/The monolith/gym/Reviews';
  const reviewFiles = fs.readdirSync(reviewsDir);
  console.log('Found review files:', reviewFiles);
  for (const file of reviewFiles) {
    const src = path.join(reviewsDir, file);
    const dest = path.join(publicReviews, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to public/reviews/`);
  }

  await browser.close();
  console.log('Done!');
})();
