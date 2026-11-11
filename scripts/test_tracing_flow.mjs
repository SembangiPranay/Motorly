import { chromium } from "playwright"
import fs from "fs"

const smoothD = fs.readFileSync("scripts/smooth_roofline_path.txt", "utf8")

async function testTracing() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Let's create an interactive test page that runs the exact CSS strokeDashoffset transition
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; }
        svg { width: 1050px; aspect-ratio: 1376 / 768; }
        #laser {
          fill: none;
          stroke: #ffffff;
          stroke-width: 3.5;
          stroke-dasharray: 1250;
          stroke-dashoffset: 1250;
          filter: drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 20px #38bdf8);
          transition: stroke-dashoffset 1600ms cubic-bezier(0.25, 1, 0.5, 1);
        }
      </style>
    </head>
    <body>
      <svg viewBox="0 0 1376 768">
        <path id="laser" d="${smoothD}" />
      </svg>
      <script>
        setTimeout(() => {
          document.getElementById('laser').style.strokeDashoffset = '0';
        }, 100);
      </script>
    </body>
    </html>
  `

  await page.setContent(html)

  // Wait 700ms (mid-flow across the roof)
  await page.waitForTimeout(700)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_flow_midway.png" })

  // Wait another 1200ms (complete flow to the rear taillight)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_flow_completed.png" })

  console.log("Saved test_flow_midway.png and test_flow_completed.png")
  await browser.close()
}

testTracing().catch(console.error)
