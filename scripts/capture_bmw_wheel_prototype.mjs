import { chromium } from "playwright"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })

  const filePath = "file:///" + path.resolve(__dirname, "test_bmw_wheel_prototype.html").replace(/\\/g, "/")
  console.log("Navigating to:", filePath)
  await page.goto(filePath, { waitUntil: "networkidle" })

  const outPath = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/bmw_wheel_comparison_proof.png"
  await page.screenshot({ path: outPath })
  console.log("Saved bmw_wheel_comparison_proof.png")

  await browser.close()
}

capture().catch(console.error)
