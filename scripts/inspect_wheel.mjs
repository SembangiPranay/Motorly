import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 500, height: 500 } })
  const b64 = fs.readFileSync("cars/Information/wheels.jpg").toString("base64")
  await page.setContent(`
    <html>
      <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh;">
        <img src="data:image/jpeg;base64,${b64}" style="width:447px; height:447px; object-fit:contain;" />
      </body>
    </html>
  `)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/bmw_wheel_inspect.png" })
  console.log("Saved bmw_wheel_inspect.png")
  await browser.close()
}

run().catch(console.error)
