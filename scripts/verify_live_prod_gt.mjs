import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("=== Verifying Live Production Site https://motorly-ten.vercel.app ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to https://motorly-ten.vercel.app/?intro=1 ...")
  await page.goto("https://motorly-ten.vercel.app/?intro=1", { waitUntil: "domcontentloaded" })
  
  // Wait for the Matrix LED ignition and volumetric beam throw + telemetry
  await page.waitForTimeout(1800)

  const proofPath = path.join(ARTIFACT_DIR, "live_prod_gt_entrance_verified.png")
  await page.screenshot({ path: proofPath, fullPage: false })
  console.log("Captured Live Production Verified Proof:", proofPath)

  await browser.close()
  console.log("=== Live Production Verification Complete! ===")
}

run().catch((err) => {
  console.error("Live verification failed:", err)
  process.exit(1)
})
