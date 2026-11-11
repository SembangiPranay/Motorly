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
          <svg style="position:absolute; inset:0; width:1376px; height:768px;" viewBox="0 0 1376 768">
            <path id="tracePath" d="
              M 92,512 
              C 102,475 125,455 170,442 
              C 230,425 330,420 450,420 
              C 540,418 630,340 705,275 
              C 760,268 830,268 895,275 
              C 980,285 1070,335 1160,378 
              C 1215,402 1260,425 1295,435
            " fill="none" stroke="#00ffff" stroke-width="3.5" />
          </svg>
        </div>
      </body>
    </html>
  `)

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_car_trace_contour5.png" })
  console.log("Saved test_car_trace_contour5.png")
  await browser.close()
}

run().catch(console.error)
