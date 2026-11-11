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
          <linearGradient id="brightSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F8FAFC" />
            <stop offset="90%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <!-- Dark Anthracite Aero Flap Behind Spoke -->
          <linearGradient id="bmwDarkFlap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E4756" />
            <stop offset="60%" stopColor="#222834" />
            <stop offset="100%" stopColor="#12161E" />
          </linearGradient>

          <!-- Single BMW Aero Turbine Master Spoke (Sub-pixel Match to wheels.jpg) -->
          <g id="bmwMasterSpoke">
            <!-- 1. Dark Anthracite Aero Flap (Behind the silver spoke) -->
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

            <!-- 2. Dark cavity insert in the window -->
            <path
              d="
                M 2,-11 
                C 5,-17 10,-23 16,-28 
                L 20,-26 
                C 15,-20 10,-14 6,-8 
                Z"
              fill="#181D26"
            />

            <!-- 3. The Pure Diamond Cut Sweeping Wishbone Spoke (Solid White with Cutout) -->
            <!-- Outer contour sweeping smoothly to outer rim + inner hole cutout via evenodd -->
            <path
              fill-rule="evenodd"
              d="
                M -3,-9 
                C -1.5,-16 3.5,-24 9.5,-31 
                C 13.5,-33.8 18.5,-34.5 24,-33.8 
                C 25,-33 25.5,-31.5 24.5,-30 
                C 21.5,-31 17.5,-30.5 14,-29 
                C 19,-25.5 23,-21 24,-15 
                C 24.5,-12 23,-9.5 20.5,-8 
                L 16.5,-9 
                C 18,-11 19,-13 19,-16 
                C 18,-20 15,-24 11,-27 
                C 8,-23 5,-18 3,-13 
                C 1.5,-10 0,-9 -3,-9 
                Z

                M 2.5,-12 
                C 4.5,-16 8,-21 12,-25 
                C 15,-24 17,-21 17.5,-17 
                C 17,-14 15.5,-11.5 13.5,-9.5 
                C 10.5,-9.5 8,-10 6,-11 
                Z"
              fill="url(#brightSilver)"
              stroke="#94A3B8"
              stroke-width="0.3"
              filter="drop-shadow(0 1px 3px rgba(0,0,0,0.8))"
            />

            <!-- Brilliant White Specular Reflection Streaks on the Spoke Edges -->
            <path
              d="M -2,-10 C -0.5,-16 4,-24 10,-31"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="0.75"
              stroke-linecap="round"
            />
            <path
              d="M 14,-32 C 18,-33 21,-33 24,-32.5"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="0.75"
              stroke-linecap="round"
            />
          </g>
        </defs>

        <!-- Base Outer Tire Rubber -->
        <circle cx="0" cy="0" r="47" fill="#14171E" stroke="#05070A" stroke-width="2.5" />
        <circle cx="0" cy="0" r="44.5" fill="none" stroke="#0E1015" stroke-width="4.5" stroke-dasharray="6, 3" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#94A3B8" stroke-width="0.8" opacity="0.4" />

        <!-- Deep Rim Interior Barrel -->
        <circle cx="0" cy="0" r="35" fill="#181D26" stroke="#E2E8F0" stroke-width="1.8" />

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
console.log("Updated test_bmw_wheel_prototype.html with evenodd solid silver face!")
