import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:/Users/koushik/.gemini/antigravity/brain/660c4f1e-2891-4f43-92f1-61b0104eee23/screenshots';
const baseUrl = 'https://motorly-ten.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 1. Customer Completed Trip in MyBookings
  try {
    console.log('Capturing customer completed trip...');
    await page.goto(`${baseUrl}/?view=my-bookings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Click demo quick-fill for test@gmail.com
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt && txt.includes('test@gmail.com')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, '14_mobile_customer_mybookings_logged_in.png') });
    console.log('Saved 14_mobile_customer_mybookings_logged_in.png');
  } catch (err) {
    console.error('Customer trip capture error:', err.message);
  }

  // 2. Admin Return Inspection Modal
  try {
    console.log('Capturing admin return modal...');
    await page.goto(`${baseUrl}/?view=admin`, { waitUntil: 'networkidle2', timeout: 30000 });
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      await pwdInput.click();
      await pwdInput.type('0709');
      await page.keyboard.press('Enter');
    }
    await new Promise(r => setTimeout(r, 2500));

    // Find "Audit Return" or "Check-In & Audit Return" button in the Ride Completed banner
    const btns = await page.$$('button');
    for (const b of btns) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt && (txt.includes('Audit Return') || txt.includes('Return') && txt.includes('Check-In'))) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, '15_mobile_admin_return_modal.png') });
    console.log('Saved 15_mobile_admin_return_modal.png');
  } catch (err) {
    console.error('Admin return modal error:', err.message);
  }

  await browser.close();
  console.log('Done additional captures!');
})();
