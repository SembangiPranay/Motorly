import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  
  // 1. Desktop viewport (1440 x 900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_grounded_desktop.png"), fullPage: false })
  console.log("Captured desktop view with grounded logo")

  // 2. Focused capture of the sidebar brand block
  const sidebarBrand = await page.$("aside")
  if (sidebarBrand) {
    const box = await sidebarBrand.boundingBox()
    if (box) {
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "live_grounded_sidebar_zoom.png"),
        clip: { x: box.x, y: box.y, width: box.width, height: 260 }
      })
      console.log("Captured zoomed sidebar brand lockup")
    }
  }

  // 3. Mobile viewport (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await mobilePage.waitForTimeout(2000)
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "live_grounded_mobile.png"), fullPage: false })
  console.log("Captured mobile view")

  await browser.close()
}

run().catch(console.error)
