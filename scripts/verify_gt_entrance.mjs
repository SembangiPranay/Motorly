import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("=== Testing Local GT Entrance Animation ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  // 1. Desktop Test (1440 x 900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to http://localhost:3000/?intro=1 (Ignition & Beam Throw Phase)...")
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1600)

  const ignitionProof = path.join(ARTIFACT_DIR, "local_gt_entrance_ignition.png")
  await page.screenshot({ path: ignitionProof, fullPage: false })
  console.log("Captured Local GT Entrance Ignition Proof:", ignitionProof)

  // 2. Poise & Telemetry Phase (2300ms)
  console.log("Navigating to capture Poise & Telemetry HUD Phase...")
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2300)

  const telemetryProof = path.join(ARTIFACT_DIR, "local_gt_entrance_telemetry.png")
  await page.screenshot({ path: telemetryProof, fullPage: false })
  console.log("Captured Local GT Entrance Telemetry Proof:", telemetryProof)

  // 3. Mobile Viewport Test (390 x 844 iPhone 14 / modern mobile)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await mobilePage.waitForTimeout(2200)

  const mobileProof = path.join(ARTIFACT_DIR, "local_gt_entrance_mobile.png")
  await mobilePage.screenshot({ path: mobileProof, fullPage: false })
  console.log("Captured Local GT Entrance Mobile Proof:", mobileProof)

  await browser.close()
  console.log("=== Verification Complete! ===")
}

run().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
