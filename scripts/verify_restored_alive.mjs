import { chromium } from "playwright"
import fs from "fs"
import path from "path"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const html = fs.readFileSync("./scripts/alive_entrance_prototype.html", "utf8")
  // Let's create an updated test file with the enhanced car from ea2a686 with clean glass, upgraded wheels, road & smoke
  await page.goto("file:///" + path.resolve("./scripts/alive_entrance_prototype.html").replace(/\\/g, "/"))
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_restored_alive_proof.png" })
  console.log("Saved test_restored_alive_proof.png")
  await browser.close()
}

run().catch(console.error)
