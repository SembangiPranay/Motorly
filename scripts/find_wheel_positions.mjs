import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })

  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")

  await page.setContent(`
    <html>
      <body style="margin:0; background:#000; overflow:hidden;">
        <div style="position:relative; width:1376px; height:768px;">
          <img id="car" src="data:image/jpeg;base64,${bCar}" style="position:absolute; inset:0; width:1376px; height:768px; object-fit:contain;" />
          <div id="frontWheelMarker" style="position:absolute; width:12px; height:12px; background:#00ff00; border:2px solid #fff; border-radius:50%; transform:translate(-50%, -50%);"></div>
          <div id="rearWheelMarker" style="position:absolute; width:12px; height:12px; background:#00ff00; border:2px solid #fff; border-radius:50%; transform:translate(-50%, -50%);"></div>
        </div>
      </body>
    </html>
  `)

  await page.evaluate(() => {
    const fw = document.getElementById("frontWheelMarker")
    fw.style.left = "308px"
    fw.style.top = "472px"

    const rw = document.getElementById("rearWheelMarker")
    rw.style.left = "1074px"
    rw.style.top = "472px"
  })

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_wheel_markers_1.png" })
  console.log("Saved test_wheel_markers_1.png")
  await browser.close()
}

run().catch(console.error)
