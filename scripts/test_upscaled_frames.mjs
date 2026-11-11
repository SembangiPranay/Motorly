import { chromium } from "playwright"
import fs from "fs"

async function test() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const f6 = fs.readFileSync("C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/storyboard_frame_6.png").toString("base64")
  const f8 = fs.readFileSync("C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/storyboard_frame_8.png").toString("base64")

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>body { margin:0; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; gap:20px; }</style></head>
    <body>
      <h2 style="color:#fff; font-family:sans-serif;">Frame 6: 1440x900 Display Test</h2>
      <img src="data:image/png;base64,${f6}" style="width:1000px; height:auto; display:block;" />
      <h2 style="color:#fff; font-family:sans-serif;">Frame 8: 1440x900 Display Test</h2>
      <img src="data:image/png;base64,${f8}" style="width:1000px; height:auto; display:block;" />
    </body>
    </html>
  `)

  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_upscaled_frames.png", fullPage: true })
  console.log("Saved test_upscaled_frames.png")
  await browser.close()
}

test().catch(console.error)
