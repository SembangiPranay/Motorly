import { chromium } from "playwright"

async function verifyLiveProd() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  // Desktop Test
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })

  console.log("Navigating to https://motorly-ten.vercel.app...")
  await page.goto("https://motorly-ten.vercel.app")

  // Wait 1.0s for Front Ignition
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_02_ignition.png" })

  // Wait 1.4s for Tracing Stage
  await page.waitForTimeout(1400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_03_tracing.png" })

  // Wait 1.6s for Outline Stage
  await page.waitForTimeout(1600)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_04_outline.png" })

  // Wait 2.2s for Vehicle Reveal
  await page.waitForTimeout(2200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_06_reveal.png" })

  // Wait 2.4s for Hero Reveal
  await page.waitForTimeout(2400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_08_hero.png" })

  // Mobile Viewport Test
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })
  await mobilePage.goto("https://motorly-ten.vercel.app")
  await mobilePage.waitForTimeout(8500)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_verified_mobile_hero.png" })

  console.log("Live Production Verification Complete!")
  await browser.close()
}

verifyLiveProd().catch(console.error)
