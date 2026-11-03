import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/koushik/.gemini/antigravity/brain/660c4f1e-2891-4f43-92f1-61b0104eee23/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const views = [
  { name: '01_mobile_home', url: 'https://motorly-ten.vercel.app/?view=home' },
  { name: '02_mobile_listing', url: 'https://motorly-ten.vercel.app/?view=listing' },
  { name: '03_mobile_cardetail', url: 'https://motorly-ten.vercel.app/?view=detail&car=1' },
  { name: '04_mobile_checkout', url: 'https://motorly-ten.vercel.app/?view=checkout&car=1' },
  { name: '05_mobile_mybookings', url: 'https://motorly-ten.vercel.app/?view=my-bookings' },
  { name: '06_mobile_compare', url: 'https://motorly-ten.vercel.app/?view=compare' },
  { name: '07_mobile_auth', url: 'https://motorly-ten.vercel.app/?view=auth' },
  { name: '08_mobile_about', url: 'https://motorly-ten.vercel.app/?view=about' },
  { name: '09_mobile_contact', url: 'https://motorly-ten.vercel.app/?view=contact' },
  { name: '10_mobile_admin_login', url: 'https://motorly-ten.vercel.app/?view=admin' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  for (const v of views) {
    try {
      console.log(`Capturing ${v.name}...`);
      await page.goto(v.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));
      const filePath = path.join(outDir, `${v.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${filePath}`);
    } catch (err) {
      console.error(`Error on ${v.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
})();
