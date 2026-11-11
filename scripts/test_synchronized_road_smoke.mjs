import { chromium } from "playwright"
import fs from "fs"

async function test() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to http://localhost:3000 ...")
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" })
  await page.waitForTimeout(1100)

  const screenshotPath = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_current_view.png"
  await page.screenshot({ path: screenshotPath })
  console.log("Saved test_current_view.png")

  await browser.close()
}

test().catch(console.error)
