import { execSync } from "child_process"
import fs from "fs"

const content = execSync("git show ea2a686:src/components/CarEntranceAnimation.tsx").toString()

// 1. Remove the weird silhouettes inside the glass:
// Specifically:
// <circle cx="458" cy="205" r="9" fill="#0C0D12" />
// <ellipse cx="525" cy="200" rx="9" ry="12" fill="#0C0D12" />
// <line x1="458" y1="205" x2="455" y2="216" stroke="#0C0D12" strokeWidth="4" />
// <line x1="525" y1="208" x2="525" y2="218" stroke="#0C0D12" strokeWidth="5" />
let modified = content
  .replace(/<circle cx="458" cy="205" r="9" fill="#0C0D12" \/>/g, "")
  .replace(/<ellipse cx="525" cy="200" rx="9" ry="12" fill="#0C0D12" \/>/g, "")
  .replace(/<line x1="458" y1="205" x2="455" y2="216" stroke="#0C0D12" strokeWidth="4" \/>/g, "")
  .replace(/<line x1="525" y1="208" x2="525" y2="218" stroke="#0C0D12" strokeWidth="5" \/>/g, "")

// 2. Add realistic wet asphalt road and rolling smoke backdrop into the background:
const roadAndSmokeBg = `
      {/* Real Wet Asphalt Road & Smoke Atmosphere */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-45 mix-blend-screen"
        style={{
          backgroundImage: "url('/images/entrance/dark_road_smoke.jpg')",
          backgroundPosition: "center bottom",
          filter: "contrast(1.15) brightness(0.85)",
        }}
      />
      {/* Procedural Rolling Smoke & Tire Mist */}
      <div
        className="absolute bottom-[20%] -left-[10%] w-[130%] h-60 pointer-events-none filter blur-3xl opacity-40"
        style={{
          background: "radial-gradient(ellipse at 40% 70%, rgba(249, 115, 22, 0.18), rgba(56, 189, 248, 0.08) 50%, transparent 75%)",
          animation: "driftSmokeA 9s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute bottom-[16%] -right-[10%] w-[130%] h-64 pointer-events-none filter blur-3xl opacity-35"
        style={{
          background: "radial-gradient(ellipse at 65% 75%, rgba(255, 255, 255, 0.2), rgba(14, 165, 233, 0.1) 45%, transparent 70%)",
          animation: "driftSmokeB 11s ease-in-out infinite alternate",
        }}
      />
`

modified = modified.replace(
  '{/* 1. Deep Space Carbon & Amber Studio Spotlight Atmosphere */}',
  roadAndSmokeBg + '\n      {/* 1. Deep Space Carbon & Amber Studio Spotlight Atmosphere */}'
)

// Add smoke keyframes in the style tag
modified = modified.replace(
  '@keyframes studioSweep',
  `@keyframes driftSmokeA {
          0% { transform: translateX(60px) translateY(0) scale(1); opacity: 0.35; }
          50% { transform: translateX(-40px) translateY(-10px) scale(1.15); opacity: 0.6; }
          100% { transform: translateX(-120px) translateY(5px) scale(1.28); opacity: 0.25; }
        }
        @keyframes driftSmokeB {
          0% { transform: translateX(90px) scale(0.92); opacity: 0.3; }
          50% { transform: translateX(-30px) scale(1.22); opacity: 0.55; }
          100% { transform: translateX(-110px) scale(1.32); opacity: 0.2; }
        }
        @keyframes studioSweep`
)

fs.writeFileSync("./src/components/CarEntranceAnimation.tsx", modified)
console.log("Successfully updated src/components/CarEntranceAnimation.tsx from ea2a686 with clean glass, wet road, and rolling smoke!")
