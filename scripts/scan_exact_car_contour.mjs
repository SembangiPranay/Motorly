import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")
  
  await page.setContent(`
    <html>
      <body style="margin:0; background:#000;">
        <canvas id="c" width="1376" height="768"></canvas>
      </body>
    </html>
  `)

  const points = await page.evaluate(async (b64) => {
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.src = "data:image/jpeg;base64," + b64
    await new Promise(r => img.onload = r)
    ctx.drawImage(img, 0, 0, 1376, 768)

    const imgData = ctx.getImageData(0, 0, 1376, 768).data
    const roofPoints = []

    for (let x = 80; x <= 1300; x += 10) {
      let topY = -1
      // Scan downwards from y = 100 to y = 600
      for (let y = 100; y < 650; y++) {
        const idx = (y * 1376 + x) * 4
        const r = imgData[idx]
        const g = imgData[idx + 1]
        const b = imgData[idx + 2]
        // Check if pixel is clearly above background noise (brightness > 28)
        if (r > 28 || g > 28 || b > 28) {
          topY = y
          break
        }
      }
      if (topY !== -1) {
        roofPoints.push({ x, y: topY })
      }
    }
    return roofPoints
  }, bCar)

  console.log("Scanned points count:", points.length)
  // Let's print out key intervals
  for (let i = 0; i < points.length; i += 5) {
    console.log(`x=${points[i].x}, y=${points[i].y}`)
  }

  // Now let's draw this exact scanned path and take a screenshot to verify!
  const svgPathD = "M " + points.map(p => `${p.x},${p.y}`).join(" L ")
  
  await page.setContent(`
    <html>
      <body style="margin:0; background:#000;">
        <div style="position:relative; width:1376px; height:768px;">
          <img src="data:image/jpeg;base64,${bCar}" style="position:absolute; inset:0; width:1376px; height:768px;" />
          <svg style="position:absolute; inset:0; width:1376px; height:768px;" viewBox="0 0 1376 768">
            <path d="${svgPathD}" fill="none" stroke="#38BDF8" stroke-width="3" style="filter: drop-shadow(0 0 8px #38BDF8);" />
          </svg>
        </div>
      </body>
    </html>
  `)

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/scanned_exact_roofline.png" })
  console.log("Saved scanned_exact_roofline.png")
  fs.writeFileSync("scripts/scanned_roofline_points.json", JSON.stringify(points, null, 2))

  await browser.close()
}

run().catch(console.error)
