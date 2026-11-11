import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"
const PROD_URL = "https://motorly-ten.vercel.app/?intro=1"

async function verifyProd() {
  console.log("=== Verifying Live Production Deployment on https://motorly-ten.vercel.app ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  // 1. Desktop Test (1440 x 900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to production for Tracing phase...")
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_storyboard_tracing.png") })
  console.log("Captured Production Tracing phase")

  console.log("Navigating to production for Outline phase...")
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3900)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_storyboard_outline.png") })
  console.log("Captured Production Outline phase")

  console.log("Navigating to production for Complete Reveal phase...")
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(6500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_storyboard_reveal.png") })
  console.log("Captured Production Reveal phase")

  console.log("Navigating to production for Brand Hero phase...")
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(8900)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_storyboard_hero.png") })
  console.log("Captured Production Brand Hero phase")

  // 2. Mobile Viewport (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  console.log("Navigating to production for Mobile Hero phase...")
  await mobilePage.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await mobilePage.waitForTimeout(8900)
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_storyboard_mobile.png") })
  console.log("Captured Production Mobile Hero phase")

  await browser.close()
  console.log("=== All Live Production Proofs Successfully Captured! ===")
}

verifyProd().catch((err) => {
  console.error("Live verification failed:", err)
  process.exit(1)
})
