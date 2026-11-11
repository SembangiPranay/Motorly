import { chromium } from "playwright"

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to production: https://motorly-ten.vercel.app ...")
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })

  // 1. Capture Ignition & Headlight Cone + Rolling Smoke
  await page.waitForTimeout(1150)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_perfect_silver_gt_ignition.png" })
  console.log("Saved live_prod_perfect_silver_gt_ignition.png")

  // 2. Capture Telemetry Bar & Brand Typography
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_perfect_silver_gt_telemetry.png" })
  console.log("Saved live_prod_perfect_silver_gt_telemetry.png")

  // 3. Mobile Viewport
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.clear()
  })
  await mobilePage.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(1600)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_perfect_silver_gt_mobile.png" })
  console.log("Saved live_prod_perfect_silver_gt_mobile.png")

  await browser.close()
  console.log("Verification finished successfully!")
}

verify().catch(console.error)
