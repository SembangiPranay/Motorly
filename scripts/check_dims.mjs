import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")
  await page.setContent(`<html><body style="margin:0;background:#000;"><img id="car" src="data:image/jpeg;base64,${bCar}" style="width:1376px;height:768px;" /></body></html>`)
  const dims = await page.evaluate(() => {
    const el = document.getElementById("car")
    return {
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    }
  })
  console.log("Image dimensions in browser:", dims)
  await browser.close()
}

run().catch(console.error)
