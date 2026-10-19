const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  const fileData = fs.readFileSync('C:/Users/dulan/.gemini/antigravity/brain/dce63ac5-4d05-4650-ae9b-3d26cae7b97d/.user_uploaded/media_1792425960618_9564c627.png');
  const base64 = fileData.toString('base64');
  
  await page.setContent('<canvas id="c" width="1024" height="1024"></canvas>');
  const colors = await page.evaluate(async (b64) => {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    await new Promise((res) => {
      img.onload = res;
      img.src = 'data:image/png;base64,' + b64;
    });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 1024, 1024).data;
    
    // sample corner
    const corner = [data[0], data[1], data[2], data[3]];
    
    // find dominant red
    let reds = {};
    let whites = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a > 100 && r > 120 && g < 50 && b < 50) {
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        reds[hex] = (reds[hex] || 0) + 1;
      }
      if (a > 100 && r > 200 && g > 200 && b > 200 && (r !== 255 || g !== 255 || b !== 255)) {
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        whites[hex] = (whites[hex] || 0) + 1;
      }
    }
    const sortedReds = Object.entries(reds).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const sortedWhites = Object.entries(whites).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return { corner, sortedReds, sortedWhites };
  }, base64);
  
  console.log(JSON.stringify(colors, null, 2));
  await browser.close();
})();
