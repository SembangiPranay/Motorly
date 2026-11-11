import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
  const b64 = fs.readFileSync("public/images/entrance/gt_full_reveal.jpg").toString("base64")
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body style="margin:0; background:#000;">
      <img id="car" src="data:image/jpeg;base64,${b64}" style="width:1376px; height:768px; display:block;" />
      <canvas id="c" width="1376" height="768" style="position:absolute; top:0; left:0;"></canvas>
    </body>
    </html>
  `)
  await page.waitForTimeout(500)

  const info = await page.evaluate(() => {
    const c = document.getElementById("c")
    const ctx = c.getContext("2d")
    const img = document.getElementById("car")
    ctx.drawImage(img, 0, 0)

    // Let's sample along horizontal lines y = 410 (around wheel center height)
    // and find the circular hub or brightest wheel spoke areas
    const samples = []
    for (let x = 200; x < 1200; x += 10) {
      const p = ctx.getImageData(x, 410, 1, 1).data
      samples.push({ x, rgb: [p[0], p[1], p[2]] })
    }
    return samples
  })

  // Filter high brightness points at y=410
  const brightPoints = info.filter(s => (s.rgb[0] + s.rgb[1] + s.rgb[2]) / 3 > 120)
  console.log("Bright points at y=410:", brightPoints.map(p => p.x))
  await browser.close()
}

run().catch(console.error)
