import { chromium } from "playwright"
import fs from "fs"
import path from "path"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Test with seamless masked JPG vs transparent PNG
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background: #030406; color: #fff; font-family: sans-serif; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
      .viewport { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #040507; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      
      .road-backdrop {
        position: absolute;
        inset: 0;
        background-image: url('../public/images/entrance/dark_road_smoke.jpg');
        background-size: cover;
        background-position: center bottom;
        opacity: 0.6;
        mix-blend-mode: screen;
        filter: contrast(1.15) brightness(0.85);
      }
      
      .vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, transparent 20%, rgba(4,5,7,0.75) 60%, #040507 92%);
        pointer-events: none;
      }

      .smoke-drift-1 {
        position: absolute;
        bottom: 20%;
        left: -10%;
        width: 120%;
        height: 180px;
        background: radial-gradient(ellipse at 40% 60%, rgba(249,115,22,0.12), rgba(56,189,248,0.06) 45%, transparent 70%);
        filter: blur(35px);
        opacity: 0.45;
        pointer-events: none;
      }
      .smoke-drift-2 {
        position: absolute;
        bottom: 15%;
        right: -10%;
        width: 120%;
        height: 200px;
        background: radial-gradient(ellipse at 60% 70%, rgba(255,255,255,0.18), rgba(14,165,233,0.1) 40%, transparent 70%);
        filter: blur(40px);
        opacity: 0.5;
        pointer-events: none;
      }

      .car-container {
        position: relative;
        width: 100%;
        max-width: 980px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .car-frame {
        position: relative;
        width: 100%;
        /* Seamless edge feathering */
        -webkit-mask-image: radial-gradient(ellipse 94% 88% at 50% 50%, black 72%, transparent 98%);
        mask-image: radial-gradient(ellipse 94% 88% at 50% 50%, black 72%, transparent 98%);
      }

      .car-img {
        width: 100%;
        height: auto;
        display: block;
        mix-blend-mode: screen; /* Blends pure black into the road lighting seamlessly */
      }

      /* Volumetric Headlight Laser Projection */
      .volumetric-cone {
        position: absolute;
        top: 48%;
        left: -22%;
        width: 520px;
        height: 220px;
        background: radial-gradient(ellipse at 92% 42%, rgba(255, 255, 255, 0.98) 0%, rgba(186, 230, 253, 0.75) 15%, rgba(56, 189, 248, 0.3) 45%, rgba(2, 132, 199, 0.08) 70%, transparent 85%);
        clip-path: polygon(100% 42%, 0% 0%, 0% 100%, 100% 56%);
        filter: blur(9px);
        pointer-events: none;
        mix-blend-mode: screen;
      }

      .headlight-drl-flare {
        position: absolute;
        top: 48%;
        left: 6.8%;
        width: 14px;
        height: 14px;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 25px 8px #38bdf8, 0 0 50px 18px #0284c7;
        pointer-events: none;
      }

      .taillight-glow {
        position: absolute;
        top: 42%;
        right: 4.8%;
        width: 10px;
        height: 10px;
        background: #ff1e44;
        border-radius: 50%;
        box-shadow: 0 0 20px 6px #ff1e44, 0 0 45px 15px #be123c;
        pointer-events: none;
      }

      .hud-bar {
        margin-top: 14px;
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(11, 14, 20, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 24px;
        border-radius: 9999px;
        backdrop-filter: blur(12px);
        font-family: monospace;
        font-size: 11px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.6);
      }
      .hud-lbl { color: #64748b; }
      .hud-val { color: #f8fafc; font-weight: bold; }
      .hud-orange { color: #f97316; font-weight: bold; }
      .hud-green { color: #10b981; font-weight: bold; }

      .brand-wrap { text-align: center; margin-top: 18px; }
      .brand-title {
        font-size: 42px;
        font-weight: 900;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        background: linear-gradient(to right, #ffffff 20%, #f1f5f9 65%, #f97316 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .brand-sub {
        font-size: 11px;
        font-family: monospace;
        letter-spacing: 0.45em;
        color: #94a3b8;
        text-transform: uppercase;
        margin-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="viewport">
      <div class="road-backdrop"></div>
      <div class="smoke-drift-1"></div>
      <div class="smoke-drift-2"></div>
      <div class="vignette"></div>

      <div class="car-container">
        <div class="car-frame">
          <img class="car-img" src="../public/images/entrance/luxury_gt_car.jpg">
          <div class="volumetric-cone"></div>
          <div class="headlight-drl-flare"></div>
          <div class="taillight-glow"></div>
        </div>

        <div class="hud-bar">
          <div><span class="hud-lbl">CHASSIS:</span> <span class="hud-val">AIR LEVEL 0 (GT LOW)</span></div>
          <div style="width:1px; height:12px; background:#334155;"></div>
          <div><span class="hud-lbl">MODE:</span> <span class="hud-orange">GT CRUISE</span></div>
          <div style="width:1px; height:12px; background:#334155;"></div>
          <div><span class="hud-lbl">EST. RANGE:</span> <span class="hud-green">640 KM</span></div>
          <div style="width:1px; height:12px; background:#334155;"></div>
          <div class="hud-green">● MALTA FLEET DISPATCH READY</div>
        </div>

        <div class="brand-wrap">
          <div class="brand-title">PIT STOP</div>
          <div class="brand-sub">PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `

  await page.setContent(html)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/test_seamless_feather_proof.png" })
  console.log("Saved test_seamless_feather_proof.png")
  await browser.close()
}

run().catch(console.error)
