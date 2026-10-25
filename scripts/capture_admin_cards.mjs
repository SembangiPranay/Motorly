import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile Screenshot (iPhone / Android 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(APP_URL, { waitUntil: 'domcontentloaded' });

  // Set admin token directly in localStorage for instant access
  await mobilePage.evaluate(() => {
    localStorage.setItem("motorly_admin_token", "admin_session_active_0709");
    localStorage.setItem("motorly_current_view", "admin");
  });
  await mobilePage.reload({ waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(2000);

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
  await desktopPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });

  const desktopAdminBtn = await desktopPage.$('button:has-text("Fleet Admin")');
  await desktopPage.evaluate(() => {
    localStorage.setItem("motorly_admin_token", "admin_session_active_0709");
    localStorage.setItem("motorly_current_view", "admin");
  });
  await desktopPage.reload({ waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(2000);

  await desktopPage.waitForTimeout(1200);
  await desktopPage.screenshot({ path: 'screenshots/18_desktop_request_cards_grid.png' });
  console.log('Desktop screenshot saved to screenshots/18_desktop_request_cards_grid.png');

  await browser.close();
}

capture().catch(console.error);
