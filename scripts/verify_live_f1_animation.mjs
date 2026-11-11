import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Trigger entrance animation on localhost:3000
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.evaluate(() => {
    // Clear session storage / local storage flags if any
    sessionStorage.clear()
    window.location.reload()
  })

  // Capture early ignition phase
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_f1_entrance_ignition.png"), fullPage: false })
  console.log("Captured F1 Entrance Ignition")

  // Reload to capture revving & brand reveal phase
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_f1_entrance_revving.png"), fullPage: false })
  console.log("Captured F1 Entrance Revving")

  await browser.close()
}

run().catch(console.error)
