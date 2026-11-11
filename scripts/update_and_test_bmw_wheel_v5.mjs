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
          <!-- Master BMW Aero Spoke Unit (True Counter-Clockwise Turbine Sweep from wheels.jpg) -->
          <g id="bmwAeroSpokeUnit">
            <!-- 1. Dark Gunmetal / Anthracite Recessed Aero Inset Flap -->
            <path
              d="
                M -6,-33.5 
                C -1,-33.8 6,-32 11,-27 
                C 8,-21 4,-15 0,-8 
                L -3,-8 
                C 1,-15 4,-21 7,-26 
                C 3,-29 -2,-31.5 -7,-32.5 
                Z"
              fill="#252C37"
              stroke="#13171F"
              stroke-width="0.3"
            />

            <!-- 2. Solid White Diamond-Cut Aero Winglet Spoke with Cutout Window -->
            <path
              fill-rule="evenodd"
              d="
                M -4,-8 
                C -7,-14 -12,-22 -18,-31.5 
                C -15,-33.2 -10,-34 -5,-33.8 
                C -2,-26 1,-17 3,-8 
                Z

                M -6,-11 
                C -8,-16 -12,-22 -15,-28.5 
                C -12,-29.8 -9,-30 -6,-29.5 
                C -4,-23 -2,-17 -1,-10 
                Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              stroke-width="0.4"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.7))"
            />

            <!-- 3. Secondary Trailing White Hook Blade -->
            <path
              d="
                M -5,-33.8 
                C -1,-34 4,-32.5 8,-29 
                L 6.5,-26.5 
                C 3.5,-29.5 -0.5,-30.8 -4,-30.8 
                Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              stroke-width="0.4"
            />

            <!-- 4. Recessed Window Cavity Shadow -->
            <path
              d="
                M -6,-11 
                C -8,-16 -12,-22 -15,-28.5 
                C -12,-29.8 -9,-30 -6,-29.5 
                C -4,-23 -2,-17 -1,-10 
                Z"
              fill="#0A0D14"
              opacity="0.9"
            />
          </g>
        </defs>

        <!-- Base Outer Tire Rubber -->
        <circle cx="0" cy="0" r="47" fill="#15181F" stroke="#05070A" stroke-width="2.5" />
        <circle cx="0" cy="0" r="44.5" fill="none" stroke="#0F1218" stroke-width="4.5" stroke-dasharray="6, 3" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#64748B" stroke-width="0.8" opacity="0.4" />

        <!-- Deep Rim Interior Barrel & Rotor -->
        <circle cx="0" cy="0" r="35" fill="#181D26" stroke="#FFFFFF" stroke-width="1.6" />
        <circle cx="0" cy="0" r="33.5" fill="#3B4452" stroke="#64748B" stroke-width="0.8" />
        <!-- Rotor Cross-Drill Holes -->
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
          <use href="#bmwAeroSpokeUnit" transform="rotate(0)" />
          <use href="#bmwAeroSpokeUnit" transform="rotate(72)" />
          <use href="#bmwAeroSpokeUnit" transform="rotate(144)" />
          <use href="#bmwAeroSpokeUnit" transform="rotate(216)" />
          <use href="#bmwAeroSpokeUnit" transform="rotate(288)" />
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

        <!-- Center Emblem Roundel (Clean Titanium/Orange Pit Stop Signature) -->
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
console.log("Updated test_bmw_wheel_prototype.html with counter-clockwise turbine sweep!")
