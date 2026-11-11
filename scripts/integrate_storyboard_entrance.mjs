import fs from "fs"

const filePath = "src/components/CarEntranceAnimation.tsx"

const componentCode = `import React, { useState, useEffect, useRef } from "react"

interface CarEntranceAnimationProps {
  onComplete: () => void
  onSkip?: () => void
}

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  // 6 Cinematic Stages faithfully choreographed from the 9-stage storyboard
  const [phase, setPhase] = useState<
    "init" | "ignition" | "tracing" | "reveal" | "hero" | "launch" | "exit"
  >("init")

  // Ref for zero-rerender telemetry counter (120 FPS hardware acceleration)
  const rangeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Init & Complete Darkness (0ms - 800ms)
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 800)

    // Stage 2: Front Edge Ignition & Matrix Eye Pulse (800ms - 1700ms)
    const t2 = setTimeout(() => {
      setPhase("tracing")
    }, 1700)

    // Stage 3: Specular Silhouette Tracing & Laser Light Sweep (1700ms - 3100ms)
    // The "SHINING" laser ribbon flows across the roofline, hood, and shoulder
    const t3 = setTimeout(() => {
      setPhase("reveal")
    }, 3100)

    // Stage 4: Liquid Platinum Material & Complete Vehicle Reveal (3100ms - 4400ms)
    // Metallic bodywork, BMW aero-turbine wheels, and wet road reflections come alive
    const t4 = setTimeout(() => {
      setPhase("hero")
    }, 4400)

    // Stage 5: Clean Brand Hero & Telemetry (4400ms - 5800ms)
    // Overhead PS badge shines, clean PIT STOP branding reveals without clutter
    const t5 = setTimeout(() => {
      setPhase("launch")
    }, 5800)

    // Stage 6: High-Performance GT Smooth Acceleration & Dissolve (5800ms - 6500ms)
    const t6 = setTimeout(() => {
      setPhase("exit")
    }, 6500)

    // Stage 7: Transition into showroom
    const t7 = setTimeout(() => {
      onComplete()
    }, 6800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
      clearTimeout(t7)
    }
  }, [onComplete])

  // Native rAF Telemetry Counter (Zero React re-render overhead)
  useEffect(() => {
    if (phase === "hero" || phase === "launch") {
      let startTimestamp: number | null = null
      const duration = 800
      const startRange = 540
      const targetRange = 640
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startRange + (targetRange - startRange) * ease)

        if (rangeRef.current) {
          rangeRef.current.textContent = \`\${current} KM RANGE\`
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        }
      }

      rafId = requestAnimationFrame(step)
      return () => cancelAnimationFrame(rafId)
    }
  }, [phase])

  const handleSkip = () => {
    if (onSkip) onSkip()
    else onComplete()
  }

  const isIgnited = phase !== "init"
  const isTracing = phase === "tracing"
  const isRevealed = phase === "reveal" || phase === "hero" || phase === "launch" || phase === "exit"
  const isHero = phase === "hero" || phase === "launch" || phase === "exit"
  const isLaunching = phase === "launch" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire Cinematic Grand Tourer Entrance"
      className={\`fixed inset-0 z-[10000] bg-[#040507] text-white flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-hidden select-none transition-all duration-700 ease-out \${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }\`}
      style={{
        WebkitTransform: "translate3d(0, 0, 0)",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity",
      }}
    >
      {/* 1. Overhead Ambient Studio Softbox Spotlight */}
      <div
        className={\`absolute top-[18%] left-1/2 -translate-x-1/2 w-[850px] h-[400px] rounded-full blur-3xl pointer-events-none transition-all duration-1000 \${
          isHero
            ? "bg-orange-500/20 scale-110 opacity-100"
            : isRevealed
            ? "bg-orange-600/15 scale-100 opacity-75"
            : "bg-orange-950/10 scale-90 opacity-30"
        }\`}
      />

      {/* 2. Top Navigation Bar: Brand Watermark & Skip Intro Button */}
      <div className="relative w-full max-w-6xl flex items-center justify-between z-30 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#F97316]" />
          <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold tracking-widest text-stone-300">
            PIT STOP CAR HIRE <span className="hidden sm:inline text-orange-500/80">•</span>{" "}
            <span className="hidden sm:inline text-stone-400">MALTA FLEET DISPATCH</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-200 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 3. 3D Perspective Road Runway & Ground Fog */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[200%] -left-[50%] h-full opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.16) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            WebkitTransform: "perspective(440px) rotateX(68deg) translateY(-10px)",
            transform: "perspective(440px) rotateX(68deg) translateY(-10px)",
            WebkitTransformOrigin: "center bottom",
            transformOrigin: "center bottom",
          }}
        />
        {/* Road Center High-Speed Perspective Dash Guide */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[44%] bg-gradient-to-t from-orange-500/70 via-white/40 to-transparent shadow-[0_0_16px_rgba(249,115,22,0.7)]" />
        {/* Horizon Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#040507]/80 to-[#040507]" />
      </div>

      {/* Rolling Ground Smoke & Heat Haze */}
      <div
        className={\`absolute bottom-[14%] left-[-10%] w-[120%] h-48 pointer-events-none transition-opacity duration-1000 \${
          isRevealed ? "opacity-75" : "opacity-30"
        }\`}
        style={{
          filter: "blur(34px)",
          background:
            "radial-gradient(ellipse at 42% 65%, rgba(249, 115, 22, 0.22), rgba(56, 189, 248, 0.08) 45%, transparent 70%), radial-gradient(ellipse at 68% 70%, rgba(203, 213, 225, 0.22), rgba(14, 165, 233, 0.1) 42%, transparent 68%)",
        }}
      />

      {/* 4. Center Hero Stage: Shining Liquid Platinum GT with BMW Aero Wheels */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center z-10">
        <div
          className={\`relative w-full max-w-4xl transition-all ease-out \${
            isLaunching
              ? "-translate-x-28 scale-105 duration-700"
              : "translate-x-0 scale-100 duration-800"
          }\`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 1000 400"
            className="w-full h-auto overflow-visible"
            style={{
              WebkitTransform: "translate3d(0, 0, 0)",
              transform: "translate3d(0, 0, 0)",
            }}
          >
            <defs>
              {/* Metallic Liquid GT Silver Paint Gradient */}
              <linearGradient id="gtSilverPaint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#F1F5F9" />
                <stop offset="45%" stopColor="#CBD5E1" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="90%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Tornado Specular Horizon Line */}
              <linearGradient id="gtTornadoStreak" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="15%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="45%" stopColor="#FED7AA" stopOpacity="1" />
                <stop offset="80%" stopColor="#F97316" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
              </linearGradient>

              {/* Ceramic Tinted Privacy Glass */}
              <linearGradient id="gtGlassTint" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#020617" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>
              <linearGradient id="glassReflectionGlare" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* Volumetric Laser Headlight Beam */}
              <linearGradient id="volumetricBeam" x1="100%" y1="15%" x2="0%" y2="85%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                <stop offset="12%" stopColor="#E0F2FE" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#0284C7" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
              </linearGradient>

              {/* Carbon Fiber Ground Blades */}
              <linearGradient id="gtCarbonFiber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#27272A" />
                <stop offset="50%" stopColor="#18181B" />
                <stop offset="100%" stopColor="#09090B" />
              </linearGradient>

              {/* Master BMW-Inspired Aerodynamic Turbine Spoke Unit */}
              <g id="bmwAeroSpokeUnit">
                {/* 1. Dark Anthracite Recessed Aero Inset Flap */}
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
                  strokeWidth="0.3"
                />

                {/* 2. Solid White Diamond-Cut Aero Winglet Spoke with Cutout Window */}
                <path
                  fillRule="evenodd"
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
                  strokeWidth="0.4"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.7))"
                />

                {/* 3. Secondary Trailing White Hook Blade */}
                <path
                  d="
                    M -5,-33.8 
                    C -1,-34 4,-32.5 8,-29 
                    L 6.5,-26.5 
                    C 3.5,-29.5 -0.5,-30.8 -4,-30.8 
                    Z"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="0.4"
                />

                {/* 4. Recessed Window Cavity Shadow */}
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

              {/* Complete BMW Wheel Assembly Template */}
              <g id="completeBmwWheel">
                {/* Outer Michelin Tire Rubber */}
                <circle cx="0" cy="0" r="47" fill="#15181F" stroke="#05070A" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="44.5" fill="none" stroke="#0F1218" strokeWidth="4.5" strokeDasharray="6, 3" />
                <circle cx="0" cy="0" r="40" fill="none" stroke="#64748B" strokeWidth="0.8" opacity="0.4" />

                {/* Deep Rim Interior Barrel & Rotor */}
                <circle cx="0" cy="0" r="35" fill="#181D26" stroke="#FFFFFF" strokeWidth="1.6" />
                <circle cx="0" cy="0" r="33.5" fill="#3B4452" stroke="#64748B" strokeWidth="0.8" />
                {/* Rotor Cross-Drill Cooling Holes */}
                <g fill="#141824" opacity="0.9">
                  <circle cx="0" cy="-21" r="1.1" /><circle cx="15" cy="-15" r="1.1" /><circle cx="21" cy="0" r="1.1" />
                  <circle cx="15" cy="15" r="1.1" /><circle cx="0" cy="21" r="1.1" /><circle cx="-15" cy="15" r="1.1" />
                  <circle cx="-21" cy="0" r="1.1" /><circle cx="-15" cy="-15" r="1.1" />
                  <circle cx="0" cy="-26" r="0.9" /><circle cx="18" cy="-18" r="0.9" /><circle cx="26" cy="0" r="0.9" />
                  <circle cx="18" cy="18" r="0.9" /><circle cx="0" cy="26" r="0.9" /><circle cx="-18" cy="18" r="0.9" />
                  <circle cx="-26" cy="0" r="0.9" /><circle cx="-18" cy="-18" r="0.9" />
                </g>

                {/* Brembo Caliper in Pit Stop Orange */}
                <g transform="translate(-27, -22)">
                  <path
                    d="M 2,4 C 7,-1 17,-2 25,2 L 27,14 C 19,17 12,22 5,30 Z"
                    fill="#F97316"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    filter="drop-shadow(0 3px 5px rgba(0,0,0,0.8))"
                  />
                  <circle cx="14" cy="11" r="3.2" fill="#FFFFFF" />
                  <polygon points="14,9 16.5,12.5 11.5,12.5" fill="#F97316" />
                </g>

                {/* Outer Silver Rim Flange */}
                <circle cx="0" cy="0" r="34.8" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
                <circle cx="0" cy="0" r="33.8" fill="none" stroke="#475569" strokeWidth="0.8" />

                {/* 5-Spoke Aerodynamic Turbine Assembly (72° Intervals) */}
                <g className={isLaunching ? "bmw-wheel-spin" : ""}>
                  <use href="#bmwAeroSpokeUnit" transform="rotate(0)" />
                  <use href="#bmwAeroSpokeUnit" transform="rotate(72)" />
                  <use href="#bmwAeroSpokeUnit" transform="rotate(144)" />
                  <use href="#bmwAeroSpokeUnit" transform="rotate(216)" />
                  <use href="#bmwAeroSpokeUnit" transform="rotate(288)" />
                </g>

                {/* Central Hub Assembly & Titanium Lug Ring */}
                <circle cx="0" cy="0" r="10.5" fill="#0F141F" stroke="#CBD5E1" strokeWidth="1.4" />
                <g fill="#1E293B" stroke="#000000" strokeWidth="0.6">
                  <circle cx="0" cy="-8.2" r="1.6" />
                  <circle cx="7.8" cy="-2.5" r="1.6" />
                  <circle cx="4.8" cy="6.6" r="1.6" />
                  <circle cx="-4.8" cy="6.6" r="1.6" />
                  <circle cx="-7.8" cy="-2.5" r="1.6" />
                </g>

                {/* Center Emblem Roundel (Clean Pit Stop Signature Core) */}
                <circle cx="0" cy="0" r="6" fill="#0B0F17" stroke="#FFFFFF" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="4.8" fill="#0F172A" />
                <path d="M 0,-4.8 A 4.8 4.8 0 0 1 4.8,0 L 0,0 Z" fill="#F97316" />
                <path d="M 0,0 L -4.8,0 A 4.8 4.8 0 0 1 0,-4.8 Z" fill="#FFFFFF" />
                <path d="M 0,4.8 A 4.8 4.8 0 0 1 -4.8,0 L 0,0 Z" fill="#F97316" />
                <path d="M 0,0 L 4.8,0 A 4.8 4.8 0 0 1 0,4.8 Z" fill="#FFFFFF" />
                <circle cx="0" cy="0" r="1.8" fill="#0A0D14" stroke="#FFFFFF" strokeWidth="0.6" />
              </g>

              {/* Dynamic CSS Keyframes */}
              <style>{\`
                @keyframes bmwTurbineSpin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .bmw-wheel-spin {
                  animation: bmwTurbineSpin 0.5s linear infinite;
                  transform-box: fill-box;
                  transform-origin: center;
                }
                @keyframes laserSweepStory {
                  0% { stroke-dashoffset: 1400; opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 0.85; }
                }
                .specular-laser-sweep {
                  stroke-dasharray: 700 700;
                  animation: laserSweepStory 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              \`}</style>
            </defs>

            {/* A. Ground Shadows & Tire Contact */}
            <ellipse cx="490" cy="355" rx="440" ry="18" fill="rgba(0,0,0,0.95)" />
            <ellipse cx="230" cy="352" rx="46" ry="6.5" fill="#000000" />
            <ellipse cx="730" cy="352" rx="48" ry="7" fill="#000000" />

            {/* B. Volumetric Headlight Laser Projection (Ignition & Beyond) */}
            {isIgnited && (
              <g className="transition-opacity duration-700">
                <ellipse cx="60" cy="358" rx="140" ry="18" fill="rgba(56,189,248,0.25)" />
                <polygon points="132,265 -180,300 -220,400 115,345" fill="url(#volumetricBeam)" />
                <polygon points="135,264 -140,285 -160,360 122,315" fill="url(#volumetricBeam)" opacity="0.88" />
                <line x1="132" y1="265" x2="-200" y2="345" stroke="#E0F2FE" strokeWidth="2.8" strokeLinecap="round" />
              </g>
            )}

            {/* C. Wheel Arch Inner Shadow Liners */}
            <path d="M 175,340 C 175,270 200,246 230,246 C 260,246 285,270 285,340 Z" fill="#040608" />
            <path d="M 675,340 C 675,270 702,246 730,246 C 758,246 785,270 785,340 Z" fill="#040608" />

            {/* D. Main Sculpted Bodywork (Fade in smoothly with Material Realism) */}
            <path
              d="
                M 104,337 
                C 98,328 97,314 104,300 
                C 111,286 122,278 135,276 
                C 145,264 165,256 195,250 
                C 215,246 230,245 250,246 
                C 285,248 315,252 345,250 
                C 370,222 410,192 465,180 
                C 525,168 600,170 655,188 
                C 715,208 765,236 805,246 
                C 828,248 840,246 852,242 
                C 858,248 860,258 856,268 
                C 850,286 844,306 836,322 
                C 828,334 818,338 800,339 
                C 792,339 788,339 785,339 
                C 782,294 760,252 730,252 
                C 700,252 680,294 676,339 
                L 284,339 
                C 282,294 260,254 230,254 
                C 200,254 182,294 178,339 
                L 104,337 
                Z"
              fill={isRevealed ? "url(#gtSilverPaint)" : "#07090E"}
              stroke={isRevealed ? "#94A3B8" : "#1E293B"}
              strokeWidth="1.5"
              className="transition-all duration-1000 ease-out"
            />

            {/* Front Lower Air Dam & Intake Scoop */}
            <path
              d="M 106,335 C 112,324 126,318 150,317 L 153,336 Z"
              fill="#080C14"
              stroke="#1E293B"
              strokeWidth="0.8"
            />

            {/* E. Specular Horizon Streak */}
            <path
              d="M 138,264 C 205,252 305,244 420,238 C 540,234 670,228 765,226 C 810,226 838,236 852,242"
              fill="none"
              stroke="url(#gtTornadoStreak)"
              strokeWidth="3.2"
              strokeLinecap="round"
              className={\`transition-opacity duration-700 \${isRevealed ? "opacity-100" : "opacity-0"}\`}
            />

            {/* F. Specular Silhouette Laser Tracing Ribbon (The "SHINING" Effect from Storyboard) */}
            {(isTracing || isRevealed) && (
              <path
                className="specular-laser-sweep"
                d="
                  M 104,337 
                  C 98,328 97,314 104,300 
                  C 111,286 122,278 135,276 
                  C 145,264 165,256 195,250 
                  C 215,246 230,245 250,246 
                  C 285,248 315,252 345,250 
                  C 370,222 410,192 465,180 
                  C 525,168 600,170 655,188 
                  C 715,208 765,236 805,246 
                  C 828,248 840,246 852,242"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                filter="drop-shadow(0 0 8px #FFFFFF) drop-shadow(0 0 16px #38BDF8)"
              />
            )}

            {/* G. Ceramic Tinted Frameless Glass */}
            <path
              d="
                M 360,250 
                C 382,222 418,198 470,186 
                C 525,174 592,176 648,190 
                C 700,204 746,232 784,246 
                C 725,247 645,246 560,245 
                C 490,244 425,245 360,250 
                Z"
              fill="url(#gtGlassTint)"
              className={\`transition-opacity duration-700 \${isRevealed ? "opacity-100" : "opacity-30"}\`}
            />
            {isRevealed && (
              <>
                <polygon points="380,245 445,188 470,188 395,248" fill="url(#glassReflectionGlare)" />
                <line x1="550" y1="176" x2="550" y2="245" stroke="#000000" strokeWidth="4" />
                <line x1="550" y1="176" x2="550" y2="245" stroke="#334155" strokeWidth="1.5" />
              </>
            )}

            {/* H. Carbon Ground Effect Blades */}
            <polygon points="282,339 678,339 674,344 286,344" fill="url(#gtCarbonFiber)" />
            <line x1="284" y1="343.5" x2="676" y2="343.5" stroke="#F97316" strokeWidth="2" />
            <polygon points="98,339 178,339 175,343 102,343" fill="url(#gtCarbonFiber)" />
            <line x1="100" y1="342.5" x2="176" y2="342.5" stroke="#F97316" strokeWidth="1.8" />
            <polygon points="786,339 844,335 848,342 790,343" fill="url(#gtCarbonFiber)" />

            {/* I. Matrix LED Headlight Cluster */}
            <g transform="translate(132, 256)">
              <polygon points="0,16 16,8 54,0 48,16 10,22" fill="#0B111C" stroke="#38BDF8" strokeWidth="1" />
              <polygon points="4,15 14,9 46,2 42,14 12,19" fill="#0284C7" opacity="0.6" />
              <rect x="8" y="12" width="6" height="5" rx="1.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)" />
              <rect x="17" y="9" width="6" height="5" rx="1.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)" />
              <rect x="26" y="6" width="6" height="5" rx="1.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)" />
              <rect x="35" y="3" width="6" height="5" rx="1.5" fill="#FFFFFF" filter="drop-shadow(0 0 6px #38BDF8)" />
              <line x1="2" y1="18" x2="48" y2="15" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* J. Ruby OLED Taillight Lightblade */}
            <g transform="translate(805, 240)">
              <path d="M 0,6 C 18,6 36,4 47,2 C 48,5 45,10 40,14 C 28,14 12,12 0,10 Z" fill="#4C0519" stroke="#E11D48" strokeWidth="0.8" />
              <path d="M 4,7 C 20,7 35,5 44,3" fill="none" stroke="#FF1E44" strokeWidth="2.5" filter="drop-shadow(0 0 10px #FF1E44)" />
              <circle cx="45" cy="3.5" r="14" fill="rgba(255,30,68,0.3)" filter="blur(8px)" />
            </g>

            {/* K. Perfectly Aligned BMW Aero-Turbine Wheels (Front & Rear) */}
            <g transform="translate(230, 305)">
              <use href="#completeBmwWheel" />
            </g>
            <g transform="translate(730, 305)">
              <use href="#completeBmwWheel" />
            </g>

            {/* L. Overhead PS Hexagon Monogram Crest */}
            <g
              transform="translate(500, 60)"
              className={\`transition-all duration-700 \${
                isHero ? "scale-105 opacity-100" : "scale-90 opacity-40"
              }\`}
            >
              <polygon
                points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
                fill="none"
                stroke="#F97316"
                strokeWidth="5"
                strokeOpacity="0.25"
              />
              <polygon
                points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
                fill="rgba(10, 13, 20, 0.95)"
                stroke="#F97316"
                strokeWidth="2"
              />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="16"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                PS
              </text>
            </g>
          </svg>
        </div>

        {/* 5. Clean, Professional End Screen Reveal (Zero Word Clutter!) */}
        <div
          className={\`mt-4 flex flex-col items-center justify-center transition-all duration-700 \${
            isHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }\`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Minimalist Status Badge */}
          <div className="inline-flex items-center gap-2.5 bg-stone-900/90 border border-white/15 px-5 py-1.5 rounded-full backdrop-blur-md shadow-2xs font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="text-[11px] font-bold text-stone-200 tracking-wider">
              FLEET DISPATCH READY
            </span>
            <span className="text-stone-500">•</span>
            <strong ref={rangeRef} className="text-orange-500 font-bold text-[11px] tracking-wide">
              640 KM RANGE
            </strong>
          </div>

          {/* Hero Brand Title */}
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.38em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading text-center">
            PIT STOP
          </h1>

          {/* Clean Subtitle */}
          <p className="mt-1 text-[11px] sm:text-xs font-mono uppercase tracking-[0.45em] text-stone-400 font-semibold text-center">
            PRESTIGE & EXECUTIVE FLEET • MALTA
          </p>
        </div>
      </div>
    </div>
  )
}
`

fs.writeFileSync(filePath, componentCode, "utf-8")
console.log("Successfully wrote enhanced CarEntranceAnimation.tsx!")
