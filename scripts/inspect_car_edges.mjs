import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
  const bCar = fs.readFileSync("public/images/entrance/master_executive_gt.jpg").toString("base64")
  await page.setContent('<canvas id="c" width="1376" height="768"></canvas>')
  const edgeData = await page.evaluate(async (b64) => {
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.src = "data:image/jpeg;base64," + b64
    await new Promise(r => img.onload = r)
    ctx.drawImage(img, 0, 0, 1376, 768)
    const p = ctx.getImageData(0, 0, 1376, 768).data
    const getRGB = (x, y) => {
      const i = (y * 1376 + x) * 4
      return [p[i], p[i+1], p[i+2]]
    }
    return {
      topLeft: getRGB(0, 0),
      topMid: getRGB(688, 0),
      topRight: getRGB(1375, 0),
      midLeft: getRGB(0, 384),
      midRight: getRGB(1375, 384),
      botLeft: getRGB(0, 767),
      botMid: getRGB(688, 767),
      botRight: getRGB(1375, 767),
    }
  }, bCar)
  console.log("Edge pixels of master_executive_gt.jpg:", edgeData)
  await browser.close()
}

run().catch(console.error)
