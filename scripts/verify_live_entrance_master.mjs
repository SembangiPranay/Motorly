import { chromium } from "playwright"

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  // Desktop Test
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  // Clear sessionStorage so entrance animation triggers cleanly
  await page.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })

  console.log("Navigating to http://localhost:3000...")
  await page.goto("http://localhost:3000")

  // Wait 1.0s for Front Ignition
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_02_ignition.png" })
  console.log("Captured live_app_02_ignition.png")

  // Wait 1.4s for Tracing Stage (total ~2.4s)
  await page.waitForTimeout(1400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_03_tracing.png" })
  console.log("Captured live_app_03_tracing.png")

  // Wait 1.6s for Outline Stage (total ~4.0s)
  await page.waitForTimeout(1600)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_04_outline.png" })
  console.log("Captured live_app_04_outline.png")

  // Wait 2.2s for Vehicle Reveal (total ~6.2s)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_06_reveal.png" })
  console.log("Captured live_app_06_reveal.png")

  // Wait 2.4s for Hero Reveal (total ~8.6s, solid hero before launch/dissolve)
  await page.waitForTimeout(2400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_08_hero.png" })
  console.log("Captured live_app_08_hero.png")

  // Mobile Test
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })
  await mobilePage.goto("http://localhost:3000")
  await mobilePage.waitForTimeout(8500)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_app_mobile_hero.png" })
  console.log("Captured live_app_mobile_hero.png")

  await browser.close()
}

verify().catch(console.error)
