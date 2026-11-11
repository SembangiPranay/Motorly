import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
  
  const b1 = fs.readFileSync("cars/Information/1.jpg").toString("base64")
  await page.setContent(`<html><body style="margin:0;background:#111;"><img src="data:image/jpeg;base64,${b1}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body></html>`)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/inspect_info_1.png" })

  const b2 = fs.readFileSync("cars/Information/2.jpg").toString("base64")
  await page.setContent(`<html><body style="margin:0;background:#111;"><img src="data:image/jpeg;base64,${b2}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body></html>`)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/inspect_info_2.png" })

  console.log("Saved inspect_info_1 and 2")
  await browser.close()
}

run().catch(console.error)
