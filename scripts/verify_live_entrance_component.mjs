import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function verify() {
  console.log("=== Testing Local CarEntranceAnimation Component on Localhost:3000 ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  // 1. Desktop Test (1440 x 900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  
  // Tracing phase (around 2400ms)
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_local_stage_tracing.png") })
  console.log("Captured Tracing phase")

  // Full Outline phase (around 3800ms)
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3800)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_local_stage_outline.png") })
  console.log("Captured Outline phase")

  // Complete Reveal phase (around 6400ms)
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(6400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_local_stage_reveal.png") })
  console.log("Captured Complete Reveal phase")

  // Brand Hero Telemetry phase (around 8800ms)
  await page.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(8800)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_local_stage_hero.png") })
  console.log("Captured Brand Hero phase")

  // Mobile Viewport Test (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.goto("http://localhost:3000/?intro=1", { waitUntil: "domcontentloaded" })
  await mobilePage.waitForTimeout(8800)
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "live_local_mobile_hero.png") })
  console.log("Captured Mobile Hero phase")

  await browser.close()
  console.log("=== Local Verification Complete! ===")
}

verify().catch((err) => {
  console.error("Local verification error:", err)
  process.exit(1)
})
