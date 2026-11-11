import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })

  const bCar = fs.readFileSync("public/images/entrance/luxury_gt_car.jpg").toString("base64")

  const pathD = `
    M 70,560 
    C 85,530 110,505 145,490 
    C 185,470 215,435 250,430 
    C 310,422 380,420 450,415 
    C 520,355 585,305 650,276 
    C 715,268 775,268 830,268 
    C 890,268 945,280 1000,305 
    C 1070,338 1140,375 1210,385 
    C 1250,392 1275,415 1295,435
  `

  await page.setContent(`
    <html>
      <body style="margin:0; background:#000; overflow:hidden;">
        <div style="position:relative; width:1376px; height:768px;">
          <img id="car" src="data:image/jpeg;base64,${bCar}" style="position:absolute; inset:0; width:1376px; height:768px; object-fit:contain;" />
          <svg style="position:absolute; inset:0; width:1376px; height:768px;" viewBox="0 0 1376 768">
            <path d="${pathD}" fill="none" stroke="#38BDF8" stroke-width="3.5" style="filter: drop-shadow(0 0 8px #38BDF8) drop-shadow(0 0 16px #0284C7);" />
            <circle cx="145" cy="490" r="7" fill="#fff" style="filter: drop-shadow(0 0 10px #38BDF8);" />
            <circle cx="1295" cy="435" r="7" fill="#FF1E44" style="filter: drop-shadow(0 0 12px #FF1E44);" />
          </svg>
        </div>
      </body>
    </html>
  `)

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_perfect_roofline_trace.png" })
  console.log("Saved test_perfect_roofline_trace.png")
  await browser.close()
}

run().catch(console.error)
