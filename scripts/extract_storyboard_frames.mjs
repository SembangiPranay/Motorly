import { chromium } from "playwright"
import fs from "fs"

async function extractFrames() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1024, height: 576 } })
  
  const imgPath = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/.user_uploaded/media_1794426056555_1f6a82d1.jpg"
  const b64 = fs.readFileSync(imgPath).toString("base64")
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #000; overflow: hidden; }</style></head>
    <body>
      <img id="grid" src="data:image/jpeg;base64,${b64}" style="width: 1024px; height: 576px; display: block;" />
    </body>
    </html>
  `)
  
  const cols = 3
  const rows = 3
  const fw = 1024 / 3
  const fh = 576 / 3
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c + 1
      const x = Math.round(c * fw)
      const y = Math.round(r * fh)
      const w = Math.round(fw)
      const h = Math.round(fh)
      
      const clip = { x, y, width: w, height: h }
      const outPath = `C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/storyboard_frame_${idx}.png`
      await page.screenshot({ path: outPath, clip })
      console.log(`Saved frame ${idx} from x=${x}, y=${y}`)
    }
  }
  
  await browser.close()
}

extractFrames().catch(console.error)
