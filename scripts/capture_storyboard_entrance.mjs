import { chromium } from "playwright"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const filePath = "file:///" + path.resolve(__dirname, "test_storyboard_entrance.html").replace(/\\/g, "/")
  console.log("Navigating to:", filePath)
  await page.goto(filePath, { waitUntil: "networkidle" })

  await page.waitForTimeout(600)
  const outDesktop = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_storyboard_entrance_proof.png"
  await page.screenshot({ path: outDesktop })
  console.log("Saved test_storyboard_entrance_proof.png")

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.goto(filePath, { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(600)
  const outMobile = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_storyboard_entrance_mobile_proof.png"
  await mobilePage.screenshot({ path: outMobile })
  console.log("Saved test_storyboard_entrance_mobile_proof.png")

  await browser.close()
}

capture().catch(console.error)
