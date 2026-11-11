import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })

  const b1 = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")
  await page.setContent(`<html><body style="margin:0;background:#000;"><img src="data:image/jpeg;base64,${b1}" style="width:100%;height:100%;object-fit:contain;"/></body></html>`)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/inspect_luxury_gt_car.png" })

  const b2 = fs.readFileSync("public/images/entrance/dark_road_smoke.jpg").toString("base64")
  await page.setContent(`<html><body style="margin:0;background:#000;"><img src="data:image/jpeg;base64,${b2}" style="width:100%;height:100%;object-fit:contain;"/></body></html>`)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/inspect_dark_road_smoke.png" })

  console.log("Saved inspect_luxury_gt_car and inspect_dark_road_smoke")
  await browser.close()
}

run().catch(console.error)
