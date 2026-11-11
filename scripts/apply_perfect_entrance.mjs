import fs from "fs"

const filePath = "src/components/CarEntranceAnimation.tsx"
let content = fs.readFileSync(filePath, "utf-8")

// 1. Update the road and ground smoke section
const roadTarget = `{/* 3. Perspective Road Grid Ground with Horizon Vignette */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-35">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.28) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
            WebkitTransform: "perspective(420px) rotateX(68deg) translate3d(0, -10px, 0)",
            transform: "perspective(420px) rotateX(68deg) translate3d(0, -10px, 0)",
            WebkitTransformOrigin: "bottom center",
            transformOrigin: "bottom center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#060709]/80 to-[#060709]" />
      </div>`

const roadReplacement = `{/* 3. Dynamic 3D Perspective Road & Scrolling Grid Ground */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none">
        {/* Road Perspective Grid */}
        <div
          className="absolute w-[200%] -left-[50%] h-full opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.18) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            WebkitTransform: "perspective(420px) rotateX(68deg) translateY(-10px)",
            transform: "perspective(420px) rotateX(68deg) translateY(-10px)",
            WebkitTransformOrigin: "center bottom",
            transformOrigin: "center bottom",
          }}
        />
        {/* Road Center High-Speed Perspective Dash Guide */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[44%] bg-gradient-to-t from-orange-500/70 via-white/40 to-transparent shadow-[0_0_16px_rgba(249,115,22,0.7)]" 
        />
        {/* Atmospheric Road Horizon Blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#060709]/75 to-[#060709]" />
      </div>

      {/* Atmospheric Rolling Ground Smoke & Heat Haze (Synchronized Vector Studio Blur) */}
      <div
        className="absolute bottom-[14%] left-[-10%] w-[120%] h-52 pointer-events-none transition-opacity duration-1000"
        style={{
          filter: "blur(32px)",
          opacity: isIgnited ? 0.75 : 0.35,
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            background: "radial-gradient(ellipse at 38% 68%, rgba(249, 115, 22, 0.22), rgba(56, 189, 248, 0.08) 45%, transparent 70%), radial-gradient(ellipse at 70% 72%, rgba(203, 213, 225, 0.24), rgba(14, 165, 233, 0.12) 42%, transparent 68%)",
          }}
        />
      </div>`

if (!content.includes(roadTarget)) {
  console.error("roadTarget not found in content!")
} else {
  content = content.replace(roadTarget, roadReplacement)
  console.log("Successfully replaced road and smoke layers!")
}

// 2. Update the sculpted shark nose curvature in the bodywork path
const noseTarget = `M 100,335 
                C 106,325 118,300 135,276`

const noseReplacement = `M 104,337 
                C 98,328 97,314 104,300 
                C 111,286 122,278 135,276`

if (!content.includes(noseTarget)) {
  console.error("noseTarget not found in content!")
} else {
  content = content.replace(noseTarget, noseReplacement)
  console.log("Successfully sculpted shark nose leading edge!")
}

// Also update the closing L 100,335 to L 104,337
const closeTarget = `L 100,335 
                Z"`
const closeReplacement = `L 104,337 
                Z"`

if (!content.includes(closeTarget)) {
  console.error("closeTarget not found in content!")
} else {
  content = content.replace(closeTarget, closeReplacement)
  console.log("Successfully closed sculpted bodywork at L 104,337!")
}

// 3. Add front air dam & brake duct intake scoop just under the bodywork
const intakeMarker = `{/* Muscular Rear Quarter Haunch Reflection (Catches Studio Lighting) */}`
const intakeInsert = `{/* Front Aero Air Dam & Brake Duct Intake (Sculpted Depth) */}
            <path
              d="M 106,335 C 112,324 126,318 150,317 L 153,336 Z"
              fill="#080C14"
              stroke="#1E293B"
              strokeWidth="0.8"
            />

            {/* Muscular Rear Quarter Haunch Reflection (Catches Studio Lighting) */}`

if (!content.includes(intakeMarker)) {
  console.error("intakeMarker not found in content!")
} else {
  content = content.replace(intakeMarker, intakeInsert)
  console.log("Successfully added front aero air dam & intake scoop!")
}

fs.writeFileSync(filePath, content, "utf-8")
console.log("Finished updating CarEntranceAnimation.tsx!")
