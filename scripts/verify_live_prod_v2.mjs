import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  
  // Desktop 1440x900
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  console.log("Navigating to production https://motorly-ten.vercel.app ...")
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })

  // Capture Ignition & Matrix Beam Throw on live production
  await page.waitForTimeout(1400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_real_entrance_ignition.png" })
  console.log("Saved live_prod_real_entrance_ignition.png")

  // Capture Telemetry & Brand Stage on live production
  await page.waitForTimeout(1200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_real_entrance_telemetry.png" })
  console.log("Saved live_prod_real_entrance_telemetry.png")

  // Mobile 390x844
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.addInitScript(() => {
    sessionStorage.clear()
  })
  await mobilePage.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_real_entrance_mobile.png" })
  console.log("Saved live_prod_real_entrance_mobile.png")

  await browser.close()
  console.log("Live production verification complete!")
}

run().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
