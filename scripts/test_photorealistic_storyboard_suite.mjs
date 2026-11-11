import { chromium } from "playwright"
import fs from "fs"

const smoothD = fs.readFileSync("scripts/smooth_roofline_path.txt", "utf8")
const bCar = fs.readFileSync("public/images/entrance/master_executive_gt.jpg").toString("base64")

async function captureStage(phaseName, phaseIndex, phaseProps) {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; overflow: hidden; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 24px; user-select: none; }
        
        .softbox-glow {
          position: absolute;
          top: 36%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 950px;
          max-width: 120vw;
          height: 480px;
          border-radius: 9999px;
          background: rgba(249, 115, 22, ${phaseProps.softboxAlpha || 0});
          filter: blur(80px);
          pointer-events: none;
          transition: all 0.8s ease-out;
        }

        .top-bar {
          position: relative;
          width: 100%;
          max-width: 1200px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 40;
        }
        .top-title {
          font-family: monospace;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .top-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f97316;
          box-shadow: 0 0 10px #f97316;
        }
        .skip-btn {
          padding: 6px 18px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f1f5f9;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.08em;
          backdrop-filter: blur(8px);
        }

        .stage-container {
          position: relative;
          width: 100%;
          max-width: 1100px;
          margin: auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }

        .car-viewport {
          position: relative;
          width: 100%;
          aspect-ratio: 1376 / 768;
          max-width: 1050px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .master-car-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          opacity: ${phaseProps.carOpacity};
          filter: ${phaseProps.carFilter};
        }

        .overlay-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 25;
        }

        .ps-badge {
          position: absolute;
          top: 6%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          opacity: ${phaseProps.badgeOpacity || 0};
        }

        .end-screen {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: ${phaseProps.endScreenOpacity || 0};
        }

        .telemetry-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(14, 18, 26, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 8px 24px;
          border-radius: 9999px;
          backdrop-filter: blur(12px);
          font-family: monospace;
          font-size: 11px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(249, 115, 22, 0.12);
        }

        .brand-title {
          margin-top: 12px;
          font-size: 46px;
          font-weight: 900;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          background: linear-gradient(to right, #ffffff 20%, #fed7aa 60%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          filter: drop-shadow(0 2px 14px rgba(249, 115, 22, 0.35));
        }

        .brand-sub {
          margin-top: 4px;
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.44em;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
          text-align: center;
        }

        .prog-bar {
          width: 240px;
          height: 4px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 9999px;
          margin-top: 14px;
          overflow: hidden;
        }
        .prog-fill {
          height: 100%;
          width: ${phaseProps.progWidth};
          background: linear-gradient(to right, #ea580c, #fbbf24, #ffffff);
        }
      </style>
    </head>
    <body>
      <div class="softbox-glow"></div>

      <!-- Top Watermark -->
      <div class="top-bar">
        <div class="top-title">
          <span class="top-dot"></span>
          PIT STOP CAR HIRE <span style="color:#f97316;">•</span> <span style="color:#94a3b8;">PRESTIGE & EXECUTIVE FLEET</span>
        </div>
        <div class="skip-btn">Skip Intro &rarr;</div>
      </div>

      <!-- Center Vehicle Stage -->
      <div class="stage-container">
        <div class="car-viewport">
          <img class="master-car-img" src="data:image/jpeg;base64,${bCar}" />

          <svg class="overlay-svg" viewBox="0 0 1376 768">
            <defs>
              <!-- Volumetric Headlight Laser Beam Gradient -->
              <linearGradient id="volumetricBeamGrad" x1="100%" y1="35%" x2="0%" y2="65%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
                <stop offset="12%" stop-color="#BAE6FD" stop-opacity="0.80" />
                <stop offset="40%" stop-color="#38BDF8" stop-opacity="0.40" />
                <stop offset="75%" stop-color="#0284C7" stop-opacity="0.10" />
                <stop offset="100%" stop-color="#0369A1" stop-opacity="0" />
              </linearGradient>

              <!-- Wet Tarmac Forward Light Bounce -->
              <radialGradient id="tarmacCausticBounce" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75" />
                <stop offset="25%" stop-color="#38BDF8" stop-opacity="0.5" />
                <stop offset="60%" stop-color="#0284C7" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>
            </defs>

            <!-- Volumetric Forward Projector Beam -->
            <g opacity="${phaseProps.beamOpacity || 0}" style="transition: opacity 0.8s ease-out; mix-blend-mode: screen;">
              <polygon points="145,490 -160,420 -180,630 115,550" fill="url(#volumetricBeamGrad)" style="filter: blur(8px);" />
              <polygon points="145,490 -100,450 -120,590 125,535" fill="url(#volumetricBeamGrad)" opacity="0.6" style="filter: blur(4px);" />
              <line x1="145" y1="490" x2="-140" y2="525" stroke="#E0F2FE" stroke-width="2.5" stroke-opacity="0.85" />
              <!-- Wet Road Headlight Reflection Pool -->
              <ellipse cx="60" cy="565" rx="140" ry="18" fill="url(#tarmacCausticBounce)" opacity="0.85" />
            </g>

            <!-- Front Headlight Ignition Point (DRL pulse) -->
            <circle cx="150" cy="488" r="7" fill="#FFFFFF" opacity="${phaseProps.drlOpacity || 0}" style="filter: drop-shadow(0 0 12px #FFFFFF) drop-shadow(0 0 24px #38BDF8);" />
            <!-- Anamorphic Blue Lens Flare Streak -->
            <line x1="60" y1="488" x2="240" y2="488" stroke="#38BDF8" stroke-width="2.5" opacity="${phaseProps.flareOpacity || 0}" style="filter: drop-shadow(0 0 8px #38BDF8);" />

            <!-- Specular Roofline Laser Ribbon -->
            <path d="${smoothD}" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-dasharray="1250" stroke-dashoffset="${phaseProps.roofOffset !== undefined ? phaseProps.roofOffset : 1250}" opacity="${phaseProps.roofOpacity || 0}" style="filter: drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 18px #38BDF8);" />

            <!-- Ruby OLED Taillight Flare -->
            <line x1="1245" y1="436" x2="1285" y2="436" stroke="#FF1E44" stroke-width="4.5" stroke-linecap="round" opacity="${phaseProps.tailOpacity || 0}" style="filter: drop-shadow(0 0 10px #FF1E44) drop-shadow(0 0 24px #BE123C);" />
            <circle cx="1275" cy="436" r="6" fill="#FF1E44" opacity="${phaseProps.tailOpacity || 0}" style="filter: drop-shadow(0 0 12px #FF1E44);" />

            <!-- Front BMW Wheel Aero Rim Outline -->
            <circle cx="308" cy="472" r="78.5" fill="none" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="6 4" opacity="${phaseProps.wheelOutlineOpacity || 0}" style="filter: drop-shadow(0 0 6px #38BDF8);" />
            <!-- Rear BMW Wheel Aero Rim Outline -->
            <circle cx="1074" cy="472" r="78.5" fill="none" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="6 4" opacity="${phaseProps.rearWheelOutlineOpacity || 0}" style="filter: drop-shadow(0 0 6px #38BDF8);" />

            <!-- Amber Rocker Panel Ground Blade -->
            <line x1="395" y1="514" x2="985" y2="514" stroke="#F97316" stroke-width="3" opacity="${phaseProps.rockerOpacity || 0}" style="filter: drop-shadow(0 0 10px #F97316);" />
            <!-- Floor Underglow Bounce -->
            <ellipse cx="690" cy="528" rx="280" ry="12" fill="rgba(249, 115, 22, 0.45)" opacity="${phaseProps.rockerOpacity || 0}" style="filter: blur(14px);" />
          </svg>

          <!-- Floating Monogram Crest -->
          <div class="ps-badge">
            <svg width="46" height="52" viewBox="-24 -28 48 56">
              <polygon points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" fill="none" stroke="#F97316" stroke-width="5" stroke-opacity="0.3" />
              <polygon points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" fill="rgba(10, 13, 20, 0.95)" stroke="#F97316" stroke-width="2" />
              <text x="0" y="5" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="900" font-family="sans-serif" letter-spacing="1">PS</text>
            </svg>
          </div>
        </div>

        <!-- End Screen Brand Reveal -->
        <div class="end-screen">
          <div class="telemetry-pill">
            <span style="width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 8px #34d399;"></span>
            <span style="color:#38bdf8; font-weight:bold;">AIR LEVEL 0 (GT LOW)</span>
            <span style="color:#475569;">•</span>
            <span style="color:#f97316; font-weight:bold;">GT CRUISE</span>
            <span style="color:#475569;">•</span>
            <strong style="color:#ffffff; font-weight:bold;">640 KM RANGE</strong>
            <span style="color:#475569;">•</span>
            <span style="color:#34d399; font-weight:bold; letter-spacing:0.08em;">FLEET READY</span>
          </div>

          <h1 class="brand-title">PIT STOP</h1>
          <p class="brand-sub">PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA</p>

          <div class="prog-bar">
            <div class="prog-fill"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  await page.setContent(html)
  const outPath = `C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/stage_${phaseIndex}_${phaseName}.png`
  await page.screenshot({ path: outPath })
  console.log(`Saved stage_${phaseIndex}_${phaseName}.png`)
  await browser.close()
}

async function runAll() {
  // Stage 04: FULL OUTLINE REVEAL (fixed roofOffset: 0)
  await captureStage("outline_reveal", "04", {
    carOpacity: 0.12,
    carFilter: "brightness(0.10) contrast(180%)",
    drlOpacity: 1,
    roofOpacity: 0.9,
    roofOffset: 0,
    tailOpacity: 1,
    wheelOutlineOpacity: 0.7,
    rearWheelOutlineOpacity: 0.7,
    rockerOpacity: 0.95,
    softboxAlpha: 0.12,
    progWidth: "52%",
  })

  // Stage 07: BRAND ELEMENTS APPEAR
  await captureStage("brand_elements", "07", {
    carOpacity: 1,
    carFilter: "brightness(1) contrast(100%)",
    drlOpacity: 0,
    tailOpacity: 1,
    rockerOpacity: 0.8,
    beamOpacity: 0.95,
    badgeOpacity: 1,
    softboxAlpha: 0.22,
    progWidth: "90%",
  })

  // Stage 08: BRAND + DETAILS REVEAL
  await captureStage("hero_reveal", "08", {
    carOpacity: 1,
    carFilter: "brightness(1) contrast(100%)",
    drlOpacity: 0,
    tailOpacity: 1,
    rockerOpacity: 0.8,
    beamOpacity: 0.95,
    badgeOpacity: 1,
    endScreenOpacity: 1,
    softboxAlpha: 0.24,
    progWidth: "96%",
  })
}

runAll().catch(console.error)
