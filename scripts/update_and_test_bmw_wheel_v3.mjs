import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imgPath = path.resolve(__dirname, "../cars/Information/wheels.jpg")
const imgBase64 = fs.readFileSync(imgPath).toString("base64")
const dataUri = `data:image/jpeg;base64,${imgBase64}`

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BMW Wheel Prototype Test</title>
  <style>
    body {
      background: #060709;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      gap: 20px;
      padding: 20px;
    }
    .container {
      display: flex;
      gap: 40px;
      align-items: center;
    }
    .wheel-card {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h3 { margin-bottom: 16px; font-size: 15px; color: #94a3b8; }
  </style>
</head>
<body>
  <h2 style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 20px; color: #f8fafc;">
    BMW Aero-Turbine Wheel Inspiration vs SVG Recreation
  </h2>
  <div class="container">
    <div class="wheel-card">
      <h3>Reference: BMW M-Aero (wheels.jpg)</h3>
      <img src="${dataUri}" width="320" height="320" style="border-radius: 50%; object-fit: cover;" />
    </div>

    <div class="wheel-card">
      <h3>Precision SVG Vector Recreation</h3>
      <svg width="320" height="320" viewBox="-50 -50 100 100">
        <defs>
          <!-- High-Contrast Diamond Cut Silver / Polished Billet Aluminum -->
          <linearGradient id="pureBmwSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <!-- Dark Anthracite Aero Flap Behind Spoke -->
          <linearGradient id="bmwDarkFlap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E4756" />
            <stop offset="60%" stopColor="#222834" />
            <stop offset="100%" stopColor="#12161E" />
          </linearGradient>

          <!-- Dark Rim Barrel Interior -->
          <radialGradient id="rimBarrel" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#28303F" />
            <stop offset="70%" stopColor="#141922" />
            <stop offset="100%" stopColor="#0A0C11" />
          </radialGradient>

          <!-- Michelin Sport Tire Rubber Profile -->
          <radialGradient id="tireRubber" cx="50%" cy="50%" r="50%">
            <stop offset="68%" stopColor="#181B22" />
            <stop offset="85%" stopColor="#242936" />
            <stop offset="94%" stopColor="#12141A" />
            <stop offset="100%" stopColor="#080A0E" />
          </radialGradient>

          <!-- Single BMW Aero Turbine Master Spoke (Sub-pixel Match to wheels.jpg) -->
          <g id="bmwMasterSpoke">
            <!-- 1. Dark Anthracite Aero Flap (Recessed between/behind spoke branches) -->
            <path
              d="
                M 12,-32 
                C 17,-31 24,-27 27,-21 
                C 24,-16 19,-11 14,-7 
                L 18,-6 
                C 24,-11 28,-17 30,-23 
                C 26,-29 20,-32 13,-33.5 
                Z"
              fill="url(#bmwDarkFlap)"
              stroke="#0B0E14"
              stroke-width="0.3"
            />

            <!-- 2. Primary Leading Swept White Blade (Curved Winglet) -->
            <path
              d="
                M -2,-8 
                C -0.5,-16 4,-24 11,-31.5 
                L 15,-31 
                C 8,-23 4,-16 2.5,-8 
                Z"
              fill="url(#pureBmwSilver)"
              stroke="#94A3B8"
              stroke-width="0.3"
            />

            <!-- 3. Trailing Return Swept White Blade (Twin-Branch Hook) -->
            <path
              d="
                M 13.5,-31.5 
                L 24,-29.5 
                C 22,-20 19,-14 14,-7.5 
                L 10,-8 
                C 15,-14 18,-20 20,-28 
                L 11,-30 
                Z"
              fill="url(#pureBmwSilver)"
              stroke="#94A3B8"
              stroke-width="0.3"
            />

            <!-- 4. Outer Rim Connecting Bridge -->
            <path
              d="
                M 11,-31.5 
                C 15,-33.5 19,-34 24,-33.5 
                L 24,-29.5 
                C 19,-30 15,-29.5 11,-28 
                Z"
              fill="url(#pureBmwSilver)"
              stroke="#94A3B8"
              stroke-width="0.3"
            />

            <!-- 5. Negative Window Cavity Shadow (Exposes Deep Rim Interior) -->
            <path
              d="
                M 3,-10 
                C 6,-16 10,-22 15,-27 
                C 17,-25 18,-22 18,-17 
                C 16,-13 13,-10 9,-8.5 
                Z"
              fill="#080B10"
              opacity="0.9"
            />
          </g>
        </defs>

        <!-- Base Outer Tire Rubber -->
        <circle cx="0" cy="0" r="47" fill="url(#tireRubber)" stroke="#05070A" stroke-width="2.5" />
        <circle cx="0" cy="0" r="44.5" fill="none" stroke="#10131A" stroke-width="4.5" stroke-dasharray="6, 3" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#94A3B8" stroke-width="0.8" opacity="0.4" />

        <!-- Deep Rim Interior Barrel -->
        <circle cx="0" cy="0" r="35" fill="url(#rimBarrel)" stroke="#E2E8F0" stroke-width="1.8" />

        <!-- Cross-Drilled Ventilated Rotor -->
        <circle cx="0" cy="0" r="33.5" fill="#3B4452" stroke="#64748B" stroke-width="0.8" />
        <g fill="#141824" opacity="0.9">
          <circle cx="0" cy="-21" r="1.1" /><circle cx="15" cy="-15" r="1.1" /><circle cx="21" cy="0" r="1.1" />
          <circle cx="15" cy="15" r="1.1" /><circle cx="0" cy="21" r="1.1" /><circle cx="-15" cy="15" r="1.1" />
          <circle cx="-21" cy="0" r="1.1" /><circle cx="-15" cy="-15" r="1.1" />
          <circle cx="0" cy="-26" r="0.9" /><circle cx="18" cy="-18" r="0.9" /><circle cx="26" cy="0" r="0.9" />
          <circle cx="18" cy="18" r="0.9" /><circle cx="0" cy="26" r="0.9" /><circle cx="-18" cy="18" r="0.9" />
          <circle cx="-26" cy="0" r="0.9" /><circle cx="-18" cy="-18" r="0.9" />
        </g>

        <!-- Brembo Caliper in Pit Stop Orange -->
        <g transform="translate(-27, -22)">
          <path
            d="M 2,4 C 7,-1 17,-2 25,2 L 27,14 C 19,17 12,22 5,30 Z"
            fill="#F97316"
            stroke="#FFFFFF"
            stroke-width="1.2"
            filter="drop-shadow(0 3px 5px rgba(0,0,0,0.8))"
          />
          <circle cx="14" cy="11" r="3.2" fill="#FFFFFF" />
          <polygon points="14,9 16.5,12.5 11.5,12.5" fill="#F97316" />
        </g>

        <!-- Outer Silver Rim Flange -->
        <circle cx="0" cy="0" r="34.8" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
        <circle cx="0" cy="0" r="33.8" fill="none" stroke="#475569" stroke-width="0.8" />

        <!-- 5-Spoke Aerodynamic Turbine Assembly (72° Intervals) -->
        <g id="bmwWheelAssembly">
          <use href="#bmwMasterSpoke" transform="rotate(0)" />
          <use href="#bmwMasterSpoke" transform="rotate(72)" />
          <use href="#bmwMasterSpoke" transform="rotate(144)" />
          <use href="#bmwMasterSpoke" transform="rotate(216)" />
          <use href="#bmwMasterSpoke" transform="rotate(288)" />
        </g>

        <!-- Central Hub Assembly & Titanium Lug Ring -->
        <circle cx="0" cy="0" r="10.5" fill="#0F141F" stroke="#CBD5E1" stroke-width="1.4" />
        
        <!-- 5 Lug Nut Recesses (Centered between the 5 spokes) -->
        <g fill="#1E293B" stroke="#000000" stroke-width="0.6">
          <circle cx="0" cy="-8.2" r="1.6" />
          <circle cx="7.8" cy="-2.5" r="1.6" />
          <circle cx="4.8" cy="6.6" r="1.6" />
          <circle cx="-4.8" cy="6.6" r="1.6" />
          <circle cx="-7.8" cy="-2.5" r="1.6" />
        </g>

        <!-- Center Emblem Roundel -->
        <circle cx="0" cy="0" r="6" fill="#0B0F17" stroke="#FFFFFF" stroke-width="1.2" />
        <circle cx="0" cy="0" r="4.8" fill="#0F172A" />
        <!-- Quadrant Jewel -->
        <path d="M 0,-4.8 A 4.8 4.8 0 0 1 4.8,0 L 0,0 Z" fill="#F97316" />
        <path d="M 0,0 L -4.8,0 A 4.8 4.8 0 0 1 0,-4.8 Z" fill="#FFFFFF" />
        <path d="M 0,4.8 A 4.8 4.8 0 0 1 -4.8,0 L 0,0 Z" fill="#F97316" />
        <path d="M 0,0 L 4.8,0 A 4.8 4.8 0 0 1 0,4.8 Z" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.8" fill="#0A0D14" stroke="#FFFFFF" stroke-width="0.6" />
      </svg>
    </div>
  </div>
</body>
</html>`

fs.writeFileSync("scripts/test_bmw_wheel_prototype.html", htmlContent, "utf-8")
console.log("Updated test_bmw_wheel_prototype.html with bright pureBmwSilver twin blades!")
