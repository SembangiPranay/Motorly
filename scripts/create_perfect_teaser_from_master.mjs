import { chromium } from "playwright"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createAlignedTeaser() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  const masterPath = path.resolve(__dirname, "../public/images/entrance/gt_full_reveal.jpg").replace(/\\/g, "/")
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; overflow: hidden; width: 1920px; height: 1080px; }
        .wrapper { position: relative; width: 1920px; height: 1080px; }
        
        /* Base Darkened Car (Same exact dimensions & position) */
        .dark-car {
          width: 1920px;
          height: 1080px;
          object-fit: cover;
          filter: brightness(0.03) contrast(180%);
        }

        /* Glowing Orange Rocker Blade & Tail & Headlights */
        .accents-car {
          position: absolute;
          inset: 0;
          width: 1920px;
          height: 1080px;
          object-fit: cover;
          /* Screen blend mode isolates the bright headlights, taillights & neon orange strip */
          mix-blend-mode: screen;
          filter: contrast(300%) brightness(0.85);
          mask-image: radial-gradient(ellipse at 50% 68%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 45%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 68%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 45%, transparent 70%);
        }

        /* Specular Laser Sweep along the exact roofline */
        .specular-roof {
          position: absolute;
          inset: 0;
          width: 1920px;
          height: 1080px;
          object-fit: cover;
          mix-blend-mode: screen;
          filter: brightness(1.8) drop-shadow(0 0 12px rgba(56,189,248,0.8));
          mask-image: linear-gradient(105deg, transparent 20%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 68%, transparent 78%),
                      radial-gradient(ellipse at 50% 38%, rgba(0,0,0,1) 0%, transparent 60%);
          -webkit-mask-image: linear-gradient(105deg, transparent 20%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 68%, transparent 78%),
                              radial-gradient(ellipse at 50% 38%, rgba(0,0,0,1) 0%, transparent 60%);
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <img class="dark-car" src="file:///${masterPath}" />
        <img class="accents-car" src="file:///${masterPath}" />
        <img class="specular-roof" src="file:///${masterPath}" />
      </div>
    </body>
    </html>
  `)

  await page.waitForTimeout(300)
  const outPath = path.resolve(__dirname, "../public/images/entrance/gt_silhouette_teaser.jpg")
  await page.screenshot({ path: outPath, quality: 95, type: "jpeg" })
  console.log("Saved perfectly aligned gt_silhouette_teaser.jpg!")

  await browser.close()
}

createAlignedTeaser().catch(console.error)
