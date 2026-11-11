import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage()

  await page.setContent("<html><body><canvas id='c'></canvas></body></html>")

  const imgBase64 = fs.readFileSync("./public/images/entrance/luxury_gt_car.jpg").toString("base64")

  const result = await page.evaluate(async (b64) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const c = document.getElementById("c")
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext("2d")
        ctx.drawImage(img, 0, 0)

        const imgData = ctx.getImageData(0, 0, c.width, c.height)
        const d = imgData.data

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          const max = Math.max(r, g, b)

          if (max <= 5) {
            d[i + 3] = 0
          } else if (max <= 28) {
            d[i + 3] = Math.round(((max - 5) / 23) * 255)
          }
        }

        ctx.putImageData(imgData, 0, 0)
        resolve(c.toDataURL("image/png"))
      }
      img.src = "data:image/jpeg;base64," + b64
    })
  }, imgBase64)

  const buffer = Buffer.from(result.replace(/^data:image\/png;base64,/, ""), "base64")
  fs.writeFileSync("./public/images/entrance/luxury_gt_car.png", buffer)
  console.log("Saved transparent PNG ./public/images/entrance/luxury_gt_car.png (size: " + buffer.length + " bytes)")
  await browser.close()
}

run().catch(console.error)
