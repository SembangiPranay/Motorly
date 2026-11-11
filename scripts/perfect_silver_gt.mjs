import { execSync } from "child_process"
import fs from "fs"

// Load the 0a100c8 version of CarEntranceAnimation.tsx
const content = execSync("git show 0a100c8:src/components/CarEntranceAnimation.tsx").toString()

// 1. Remove the weird shapes inside the glass:
// Remove the driver headrest, passenger headrest, steering wheel arc, orange centering line, and OLED binnacle glow!
const cleanGlassContent = content
  .replace(/<ellipse cx="510" cy="210" rx="10" ry="14" fill="#18202F" stroke="#475569" strokeWidth="1.2" \/>/g, "")
  .replace(/<ellipse cx="510" cy="209" rx="3.5" ry="4.5" fill="#F97316" opacity="0.9" \/>/g, "")
  .replace(/<ellipse cx="585" cy="212" rx="9" ry="13" fill="#0F172A" stroke="#334155" strokeWidth="1.2" \/>/g, "")
  .replace(/<path d="M 430,234 C 434,220 446,220 450,234" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" \/>/g, "")
  .replace(/<line x1="440" y1="219" x2="440" y2="222" stroke="#F97316" strokeWidth="2.5" \/>/g, "")
  .replace(/<ellipse cx="440" cy="234" rx="14" ry="4" fill="#38BDF8" opacity="0.6" \/>/g, "")

// 2. Refine the wheels: replace the orange bullseye circle with a sleek titanium center cap
const refinedWheels = cleanGlassContent
  .replace(/<circle cx="0" cy="0" r="7.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.5" \/>/g, '<circle cx="0" cy="0" r="7.5" fill="#181A20" stroke="#CBD5E1" strokeWidth="1.2" />')

// 3. Add the synchronized 3D perspective floor grid and subtle road atmosphere
const floorGrid = `
      {/* 1. Deep Space Carbon & Amber Studio Spotlight Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/25 via-[#0A0C11] to-[#040507] pointer-events-none" />

      {/* 2. High-Tech Synchronized Perspective Runway Grid (100% Vector Studio Harmony) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            WebkitTransform: "perspective(380px) rotateX(65deg) translate3d(0, -20px, 0)",
            transform: "perspective(380px) rotateX(65deg) translate3d(0, -20px, 0)",
            WebkitTransformStyle: "preserve-3d",
            transformStyle: "preserve-3d",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransformOrigin: "bottom center",
            transformOrigin: "bottom center",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 20%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 20%, transparent 85%)",
          }}
        />
        {/* Road Horizon Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#07080B]/85 to-[#07080B]" />
      </div>
`

let finalCode = refinedWheels.replace(
  '<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#131620] via-[#08090C] to-[#040507] pointer-events-none" />',
  floorGrid
)

fs.writeFileSync("./src/components/CarEntranceAnimation.tsx", finalCode)
console.log("Successfully updated CarEntranceAnimation.tsx with the perfected silver GT design!")
