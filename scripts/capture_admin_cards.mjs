import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile Screenshot (iPhone / Android 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:8443', { waitUntil: 'networkidle' });

  // Open mobile menu
  const hamburger = await mobilePage.$('div.flex.md\\:hidden button');
  if (hamburger) {
    await hamburger.click();
    await mobilePage.waitForTimeout(400);
  }

  // Click Fleet Admin Portal in mobile menu
  const mobileAdminBtn = await mobilePage.$('button:has-text("Fleet Admin Portal")');
  if (mobileAdminBtn) {
    await mobileAdminBtn.click();
    await mobilePage.waitForTimeout(500);

    const passInput = await mobilePage.$('input[type="password"]');
    if (passInput) {
      await passInput.fill('0709');
      const submit = await mobilePage.$('button[type="submit"], button:has-text("Authorize")');
      if (submit) await submit.click();
      await mobilePage.waitForTimeout(1000);
    }
  }

  await mobilePage.waitForTimeout(1200);
  await mobilePage.screenshot({ path: 'screenshots/17_mobile_request_cards_new.png' });
  console.log('Mobile screenshot saved to screenshots/17_mobile_request_cards_new.png');

  // Also take scrolled screenshot focusing directly on the mobile cards
  await mobilePage.evaluate(() => window.scrollTo(0, 600));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: 'screenshots/19_mobile_scrolled_cards.png' });
  console.log('Scrolled mobile screenshot saved to screenshots/19_mobile_scrolled_cards.png');

  // 2. Desktop Screenshot (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:8443', { waitUntil: 'networkidle' });

  const desktopAdminBtn = await desktopPage.$('button:has-text("Fleet Admin")');
  if (desktopAdminBtn) {
    await desktopAdminBtn.click();
    await desktopPage.waitForTimeout(500);
    const passInput = await desktopPage.$('input[type="password"]');
    if (passInput) {
      await passInput.fill('0709');
      const submit = await desktopPage.$('button[type="submit"], button:has-text("Authorize")');
      if (submit) await submit.click();
      await desktopPage.waitForTimeout(1000);
    }
  }

  await desktopPage.waitForTimeout(1200);
  await desktopPage.screenshot({ path: 'screenshots/18_desktop_request_cards_grid.png' });
  console.log('Desktop screenshot saved to screenshots/18_desktop_request_cards_grid.png');

  await browser.close();
}

capture().catch(console.error);
