import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to http://localhost:3000 ...")
  
  // Clear sessionStorage so entrance animation triggers cleanly
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" })

  // Wait 1.1s to capture ignition & beam throw
  await page.waitForTimeout(1100)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_real_entrance_ignition.png" })
  console.log("Saved local_real_entrance_ignition.png")

  // Wait 1.0s more to capture telemetry & brand typography
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_real_entrance_telemetry.png" })
  console.log("Saved local_real_entrance_telemetry.png")

  // Test mobile viewport
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.clear()
  })
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(1600)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_real_entrance_mobile.png" })
  console.log("Saved local_real_entrance_mobile.png")

  await browser.close()
  console.log("Done testing local real entrance animation!")
}

run().catch(console.error)
