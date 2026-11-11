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
      <img src="${dataUri}" width="300" height="300" style="border-radius: 50%; object-fit: cover;" />
    </div>

    <div class="wheel-card">
      <h3>Precision SVG Vector Recreation</h3>
      <svg width="300" height="300" viewBox="-50 -50 100 100">
        <defs>
          <!-- High-Polish Machined Diamond-Cut Gradient -->
          <linearGradient id="diamondCutSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="75%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <!-- Shadow Edge on Spoke -->
          <linearGradient id="spokeShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <!-- Matte Anthracite Aero Inset Pocket -->
          <linearGradient id="anthraciteAeroFlap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A4252" />
            <stop offset="50%" stopColor="#252B37" />
            <stop offset="100%" stopColor="#141821" />
          </linearGradient>

          <!-- Carbon-Ceramic Rotor -->
          <radialGradient id="ceramicRotor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#556070" />
            <stop offset="70%" stopColor="#3B4452" />
            <stop offset="92%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E2430" />
          </radialGradient>

          <!-- Michelin Sport Tire Rubber Profile -->
          <radialGradient id="tireRubber" cx="50%" cy="50%" r="50%">
            <stop offset="68%" stopColor="#161820" />
            <stop offset="85%" stopColor="#242936" />
            <stop offset="94%" stopColor="#12141A" />
            <stop offset="100%" stopColor="#080A0E" />
          </radialGradient>

          <!-- Master BMW 5-Branch Aero Turbine Spoke -->
          <!-- Exactly matches the twin-branch curved loop with dark aero inset from wheels.jpg -->
          <g id="bmwAeroBranch">
            <!-- 1. Dark Anthracite Recessed Aero Inlay (Underneath/behind the silver loop) -->
            <path
              d="
                M 3,-10 
                C 5,-15 10,-22 16,-28 
                L 23,-25 
                C 19,-18 14,-11 11,-5 
                Z"
              fill="url(#anthraciteAeroFlap)"
              stroke="#0A0E17"
              stroke-width="0.5"
            />
            
            <!-- Dark Secondary Aero Flap with venting slot -->
            <path
              d="
                M 12,-29 
                C 17,-32 23,-33 27,-31 
                C 24,-26 21,-20 18,-14 
                C 16,-18 14,-24 12,-29 
                Z"
              fill="#1C212B"
              stroke="#0B0E14"
              stroke-width="0.4"
            />

            <!-- 2. Primary Sweeping Diamond-Cut Silver Hook Spoke (Bold, Bright, Sculpted) -->
            <!-- Outer contour sweeping clockwise towards outer rim -->
            <path
              d="
                M -2,-9 
                C -0.5,-16 4,-24 10,-31 
                C 13,-33.5 17,-34.5 22,-34 
                C 24,-33.5 25,-32 24,-30.5 
                C 20,-31.5 16,-31 12,-29 
                C 7,-23 3,-16 0.8,-9 
                Z"
              fill="url(#diamondCutSilver)"
              stroke="#64748B"
              stroke-width="0.4"
            />

            <!-- 3. Secondary Loop Spoke Branch (Returns inward, creating the open window) -->
            <path
              d="
                M 24,-30.5 
                C 27,-29 29,-25 29,-20 
                C 28,-16 26,-12 23,-9 
                L 21,-10 
                C 23,-13 25,-17 26,-20 
                C 26,-24 24,-27 21,-29 
                Z"
              fill="url(#diamondCutSilver)"
              stroke="#64748B"
              stroke-width="0.4"
            />

            <!-- 4. Inner Negative Cutout Window (Exposes the rotor and shadow) -->
            <path
              d="
                M 3,-12 
                C 6,-18 10,-24 15,-29 
                C 18,-27 22,-24 23,-18 
                C 22,-14 20,-11 17,-8 
                C 14,-10 11,-12 8,-12 
                Z"
              fill="#06080D"
              opacity="0.85"
            />
          </g>
        </defs>

        <!-- Base Outer Michelin Tire -->
        <circle cx="0" cy="0" r="47" fill="url(#tireRubber)" stroke="#05070A" stroke-width="2.5" />
        <!-- Tire Tread Grooves -->
        <circle cx="0" cy="0" r="44.5" fill="none" stroke="#10131A" stroke-width="4.5" stroke-dasharray="6, 3" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#94A3B8" stroke-width="0.8" opacity="0.5" />
        <!-- Embossed Sidewall Lettering Arc -->
        <circle cx="0" cy="0" r="42" fill="none" stroke="#1A202C" stroke-width="1.2" stroke-dasharray="14, 28" />

        <!-- Ventilated Carbon Ceramic Brake Rotor -->
        <circle cx="0" cy="0" r="33.5" fill="url(#ceramicRotor)" stroke="#64748B" stroke-width="0.8" />
        <!-- Rotor Cross-Drill Cooling Holes -->
        <g fill="#141824" opacity="0.9">
          <circle cx="0" cy="-21" r="1.1" /><circle cx="15" cy="-15" r="1.1" /><circle cx="21" cy="0" r="1.1" />
          <circle cx="15" cy="15" r="1.1" /><circle cx="0" cy="21" r="1.1" /><circle cx="-15" cy="15" r="1.1" />
          <circle cx="-21" cy="0" r="1.1" /><circle cx="-15" cy="-15" r="1.1" />
          <circle cx="0" cy="-26" r="0.9" /><circle cx="18" cy="-18" r="0.9" /><circle cx="26" cy="0" r="0.9" />
          <circle cx="18" cy="18" r="0.9" /><circle cx="0" cy="26" r="0.9" /><circle cx="-18" cy="18" r="0.9" />
          <circle cx="-26" cy="0" r="0.9" /><circle cx="-18" cy="-18" r="0.9" />
        </g>

        <!-- High-Performance Brembo Orange Brake Caliper -->
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

        <!-- Outer Silver Rim Barrel & Flange -->
        <circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" stroke-width="2.2" />
        <circle cx="0" cy="0" r="33.8" fill="#0A0E17" stroke="#475569" stroke-width="0.8" />

        <!-- 5 Master Aerodynamic Curved Turbine Spokes (72° Symmetrical Array) -->
        <g id="bmwWheelAssembly">
          <use href="#bmwAeroBranch" transform="rotate(0)" />
          <use href="#bmwAeroBranch" transform="rotate(72)" />
          <use href="#bmwAeroBranch" transform="rotate(144)" />
          <use href="#bmwAeroBranch" transform="rotate(216)" />
          <use href="#bmwAeroBranch" transform="rotate(288)" />
        </g>

        <!-- Central Hub Assembly & Lug Nut Circle -->
        <circle cx="0" cy="0" r="11" fill="#0D111A" stroke="#94A3B8" stroke-width="1.2" />
        
        <!-- 5 Lug Nut Recesses (Concentric with spokes) -->
        <g fill="#1E293B" stroke="#000000" stroke-width="0.6">
          <circle cx="0" cy="-8.5" r="1.6" />
          <circle cx="8.1" cy="-2.6" r="1.6" />
          <circle cx="5.0" cy="6.9" r="1.6" />
          <circle cx="-5.0" cy="6.9" r="1.6" />
          <circle cx="-8.1" cy="-2.6" r="1.6" />
        </g>

        <!-- Signature Precision Titanium Center Cap -->
        <circle cx="0" cy="0" r="6" fill="#0B0F17" stroke="#CBD5E1" stroke-width="1.2" />
        <circle cx="0" cy="0" r="4.8" fill="#181A20" />
        <!-- Concentric Titanium Machined Rings & Jewel Core -->
        <circle cx="0" cy="0" r="3.2" fill="none" stroke="#94A3B8" stroke-width="0.6" />
        <circle cx="0" cy="0" r="1.8" fill="#F97316" stroke="#FFFFFF" stroke-width="0.5" />
      </svg>
    </div>
  </div>
</body>
</html>`

fs.writeFileSync("scripts/test_bmw_wheel_prototype.html", htmlContent, "utf-8")
console.log("Updated test_bmw_wheel_prototype.html with base64 image and refined spokes!")
