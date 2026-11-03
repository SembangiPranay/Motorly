import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/koushik/.gemini/antigravity/brain/660c4f1e-2891-4f43-92f1-61b0104eee23/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const baseUrl = 'https://motorly-ten.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const simpleViews = [
    { name: '01_mobile_home', url: `${baseUrl}/?view=home` },
    { name: '02_mobile_listing', url: `${baseUrl}/?view=listing` },
    { name: '03_mobile_cardetail', url: `${baseUrl}/?view=detail&car=1` },
    { name: '04_mobile_checkout', url: `${baseUrl}/?view=checkout&car=1` },
    { name: '05_mobile_mybookings', url: `${baseUrl}/?view=my-bookings` },
    { name: '06_mobile_compare', url: `${baseUrl}/?view=compare` },
    { name: '07_mobile_auth', url: `${baseUrl}/?view=auth` },
    { name: '08_mobile_about', url: `${baseUrl}/?view=about` },
    { name: '09_mobile_contact', url: `${baseUrl}/?view=contact` },
  ];

  for (const v of simpleViews) {
    try {
      console.log(`Capturing ${v.name}...`);
      await page.goto(v.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));
      const filePath = path.join(outDir, `${v.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${v.name}`);
    } catch (err) {
      console.error(`Error on ${v.name}:`, err.message);
    }
  }

  // --- Admin Flow ---
  try {
    console.log('Capturing 10_mobile_admin_login...');
    await page.goto(`${baseUrl}/?view=admin`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '10_mobile_admin_login.png') });

    console.log('Logging into Admin...');
    // Type password
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      await pwdInput.click();
      await pwdInput.type('0709');
      await page.keyboard.press('Enter');
    }

    await new Promise(r => setTimeout(r, 3000));

    console.log('Capturing 11_mobile_admin_dashboard...');
    await page.screenshot({ path: path.join(outDir, '11_mobile_admin_dashboard.png') });

    // Open first manifest / details
    console.log('Opening manifest...');
    const detailsButtons = await page.$$('button');
    let manifestOpened = false;
    for (const btn of detailsButtons) {
      const text = await (await btn.getProperty('textContent')).jsonValue();
      if (text && (text.includes('Details') || text.includes('Manifest') || text.includes('Inspect'))) {
        await btn.click();
        manifestOpened = true;
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing 12_mobile_admin_manifest...');
    await page.screenshot({ path: path.join(outDir, '12_mobile_admin_manifest.png') });

    // Check for "Create & Send Quotation"
    console.log('Clicking Create & Send Quotation...');
    const allButtons = await page.$$('button');
    let quotationClicked = false;
    for (const btn of allButtons) {
      const text = await (await btn.getProperty('textContent')).jsonValue();
      if (text && text.includes('Create & Send Quotation')) {
        await btn.click();
        quotationClicked = true;
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing 13_mobile_admin_extension_modal...');
    await page.screenshot({ path: path.join(outDir, '13_mobile_admin_extension_modal.png') });

  } catch (err) {
    console.error('Error during admin capture:', err.message);
  }

  await browser.close();
  console.log('Done capturing full suite!');
})();
