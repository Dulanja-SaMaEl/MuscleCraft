const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const reviewFiles = [
  { file: 'Screenshot_20261019_162843_Facebook.jpg.jpeg', id: 'yehansi', name: 'Yehansi Kushmitha' },
  { file: 'Screenshot_20261019_162858_Facebook.jpg.jpeg', id: 'thimira', name: 'Thimira Lalinda Gamage' },
  { file: 'Screenshot_20261019_162907_Facebook.jpg.jpeg', id: 'sandy', name: 'Sandy Wickramasinghe' },
  { file: 'Screenshot_20261019_162917_Facebook.jpg.jpeg', id: 'thabeetha', name: 'Thabeetha Nayomi Karunasinghe' },
  { file: 'Screenshot_20261019_162923_Facebook.jpg.jpeg', id: 'kaveen', name: 'Kaveen Tharanga' },
  { file: 'Screenshot_20261019_162929_Facebook.jpg.jpeg', id: 'neluka', name: 'Neluka Rodrigo' },
  { file: 'Screenshot_20261019_163117_Facebook.jpg.jpeg', id: 'sach', name: 'Sach Thara' },
  { file: 'Screenshot_20261019_163123_Facebook.jpg.jpeg', id: 'sevwandi', name: 'Sevwandi Dinusha' },
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  
  const avatarsDir = path.join(__dirname, '../public/reviews/avatars');
  fs.mkdirSync(avatarsDir, { recursive: true });

  for (const item of reviewFiles) {
    const filePath = path.join(__dirname, '../public/reviews', item.file);
    const buf = fs.readFileSync(filePath);
    const b64 = buf.toString('base64');

    const avatarB64 = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/jpeg;base64,' + b64; });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // In Facebook mobile screenshot:
      // The avatar is at the top left around x: 30..150, y: 15..160
      // Scale depends on naturalWidth (often 1080px or ~720px)
      // Let's find avatar bounding based on natural dimensions
      const W = img.naturalWidth;
      // Typical mobile screenshot: avatar diameter is ~11% to 14% of width
      // Let's crop x from 0.03*W to 0.16*W, y from 0.02*W to 0.15*W (or similar)
      // For square avatar:
      const avatarSize = Math.round(W * 0.115);
      const startX = Math.round(W * 0.035);
      // Let's inspect where the circle is:
      // Usually starts around y ~ 15 to 30px from top if cropped, or let's measure
      const startY = Math.round(W * 0.03);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = 128;
      outCanvas.height = 128;
      const outCtx = outCanvas.getContext('2d');
      outCtx.drawImage(canvas, startX, startY, avatarSize, avatarSize, 0, 0, 128, 128);

      return outCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    }, b64);

    fs.writeFileSync(path.join(avatarsDir, `${item.id}.png`), Buffer.from(avatarB64, 'base64'));
    console.log(`Generated avatar for ${item.id}`);
  }

  await browser.close();
  console.log('All avatars generated!');
})();
