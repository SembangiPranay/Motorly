import { chromium } from "playwright"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const filePath = "file:///" + path.resolve(__dirname, "test_photorealistic_entrance.html").replace(/\\/g, "/")
  console.log("Navigating to:", filePath)
  await page.goto(filePath, { waitUntil: "networkidle" })

  await page.waitForTimeout(600)
  const outDesktop = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/photorealistic_entrance_desktop.png"
  await page.screenshot({ path: outDesktop })
  console.log("Saved photorealistic_entrance_desktop.png")

  // Capture Teaser Silhouette view
  await page.evaluate(() => {
    document.getElementById("teaserLayer").style.opacity = "1"
    document.getElementById("revealLayer").style.opacity = "0"
  })
  await page.waitForTimeout(400)
  const outTeaser = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/photorealistic_entrance_teaser.png"
  await page.screenshot({ path: outTeaser })
  console.log("Saved photorealistic_entrance_teaser.png")

  // Mobile viewport
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.goto(filePath, { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(600)
  const outMobile = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/photorealistic_entrance_mobile.png"
  await mobilePage.screenshot({ path: outMobile })
  console.log("Saved photorealistic_entrance_mobile.png")

  await browser.close()
}

capture().catch(console.error)
