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
          <linearGradient id="bmwSilverFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#F8FAFC" />
            <stop offset="45%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#CBD5E1" />
            <stop offset="90%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <!-- Shadow Bevel for Spoke Edge Depth -->
          <linearGradient id="bmwBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <!-- Matte Gunmetal / Dark Anthracite Aero Inset Flap -->
          <linearGradient id="bmwAeroFlap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="40%" stopColor="#2D3748" />
            <stop offset="85%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#0D1117" />
          </linearGradient>

          <!-- Dark Rim Barrel Interior -->
          <radialGradient id="rimBarrel" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#242B38" />
            <stop offset="60%" stopColor="#151A22" />
            <stop offset="100%" stopColor="#0B0D13" />
          </radialGradient>

          <!-- Brake Rotor Texture -->
          <radialGradient id="brakeRotor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#556070" />
            <stop offset="75%" stopColor="#3B4452" />
            <stop offset="95%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E2430" />
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
            <!-- 1. Dark Anthracite Aero Flap (Recessed behind trailing blade) -->
            <path
              d="
                M 12,-33.5 
                C 18,-33 26,-30 30,-23 
                C 27,-17 22,-12 16,-8 
                L 14,-10 
                C 19,-14 23,-18 25,-22 
                C 22,-27 17,-30 11,-31.5 
                Z"
              fill="url(#bmwAeroFlap)"
              stroke="#0D1117"
              stroke-width="0.4"
            />

            <!-- Dark Secondary Aero Inset inside the window -->
            <path
              d="
                M 2,-11 
                C 5,-16 9,-22 15,-27 
                L 18,-25 
                C 13,-20 9,-15 5,-9 
                Z"
              fill="#181D26"
            />

            <!-- 2. Sculpted Solid Silver Swept Spoke (Twin-Branch Aero Wishbone) -->
            <!-- Outer contour sweeping smoothly to outer rim -->
            <path
              d="
                M -3.5,-9.5 
                C -2,-17 3,-25 9,-31 
                C 13,-33.8 18,-34.8 23,-34.2 
                C 25,-33.8 26,-32.5 25,-31 
                C 22,-32 18,-31.5 14,-29.5 
                C 19,-26 23,-21 24,-15 
                C 24.5,-12 23,-9.5 20.5,-8 
                L 18,-9 
                C 20,-11 21,-13 21,-16 
                C 20,-20 17,-24 13,-27 
                C 10,-24 7,-19 4.5,-14 
                C 3,-10.5 1,-9.5 -0.5,-9.5 
                Z"
              fill="url(#bmwSilverFace)"
              stroke="#64748B"
              stroke-width="0.35"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
            />

            <!-- Polished Specular Highlight Streak on leading blade -->
            <path
              d="M -2.5,-11 C -0.5,-18 4,-25 10,-31"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="0.8"
              stroke-linecap="round"
            />

            <!-- Polished Specular Highlight on outer rim bridge -->
            <path
              d="M 12,-32.5 C 16,-33.8 20,-33.8 23,-33"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="0.8"
              stroke-linecap="round"
            />
          </g>
        </defs>

        <!-- Base Outer Tire Rubber -->
        <circle cx="0" cy="0" r="47" fill="url(#tireRubber)" stroke="#05070A" stroke-width="2.5" />
        <circle cx="0" cy="0" r="44.5" fill="none" stroke="#10131A" stroke-width="4.5" stroke-dasharray="6, 3" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#94A3B8" stroke-width="0.8" opacity="0.4" />
        <circle cx="0" cy="0" r="42" fill="none" stroke="#1A202C" stroke-width="1.2" stroke-dasharray="14, 28" />

        <!-- Rim Barrel & Brake Chamber -->
        <circle cx="0" cy="0" r="35" fill="url(#rimBarrel)" stroke="#CBD5E1" stroke-width="1.5" />

        <!-- Cross-Drilled Ventilated Rotor -->
        <circle cx="0" cy="0" r="33.5" fill="url(#brakeRotor)" stroke="#64748B" stroke-width="0.8" />
        <g fill="#141824" opacity="0.9">
          <circle cx="0" cy="-21" r="1.1" /><circle cx="15" cy="-15" r="1.1" /><circle cx="21" cy="0" r="1.1" />
          <circle cx="15" cy="15" r="1.1" /><circle cx="0" cy="21" r="1.1" /><circle cx="-15" cy="15" r="1.1" />
          <circle cx="-21" cy="0" r="1.1" /><circle cx="-15" cy="-15" r="1.1" />
          <circle cx="0" cy="-26" r="0.9" /><circle cx="18" cy="-18" r="0.9" /><circle cx="26" cy="0" r="0.9" />
          <circle cx="18" cy="18" r="0.9" /><circle cx="0" cy="26" r="0.9" /><circle cx="-18" cy="18" r="0.9" />
          <circle cx="-26" cy="0" r="0.9" /><circle cx="-18" cy="-18" r="0.9" />
        </g>

        <!-- Brembo-Style High Performance Caliper -->
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

        <!-- Polished Silver Outer Rim Flange -->
        <circle cx="0" cy="0" r="34.8" fill="none" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="0" cy="0" r="33.8" fill="none" stroke="#0F172A" stroke-width="0.8" />

        <!-- 5-Spoke Aerodynamic Turbine Assembly (72° Intervals) -->
        <g id="bmwWheelAssembly">
          <use href="#bmwMasterSpoke" transform="rotate(0)" />
          <use href="#bmwMasterSpoke" transform="rotate(72)" />
          <use href="#bmwMasterSpoke" transform="rotate(144)" />
          <use href="#bmwMasterSpoke" transform="rotate(216)" />
          <use href="#bmwMasterSpoke" transform="rotate(288)" />
        </g>

        <!-- Center Hub Assembly & Titanium Lug Ring -->
        <circle cx="0" cy="0" r="10.5" fill="#0F141F" stroke="#94A3B8" stroke-width="1.2" />
        
        <!-- 5 Lug Nut Recesses (Centered between the 5 spokes) -->
        <g fill="#1E293B" stroke="#000000" stroke-width="0.6">
          <circle cx="0" cy="-8.2" r="1.6" />
          <circle cx="7.8" cy="-2.5" r="1.6" />
          <circle cx="4.8" cy="6.6" r="1.6" />
          <circle cx="-4.8" cy="6.6" r="1.6" />
          <circle cx="-7.8" cy="-2.5" r="1.6" />
        </g>

        <!-- Titanium Center Cap with Precision Emblem Core -->
        <circle cx="0" cy="0" r="5.8" fill="#0B0F17" stroke="#CBD5E1" stroke-width="1.2" />
        <circle cx="0" cy="0" r="4.6" fill="#181A20" />
        <circle cx="0" cy="0" r="3" fill="none" stroke="#94A3B8" stroke-width="0.6" />
        <circle cx="0" cy="0" r="1.8" fill="#F97316" stroke="#FFFFFF" stroke-width="0.5" />
      </svg>
    </div>
  </div>
</body>
</html>`

fs.writeFileSync("scripts/test_bmw_wheel_prototype.html", htmlContent, "utf-8")
console.log("Updated test_bmw_wheel_prototype.html with solid silver face and aero flap!")
