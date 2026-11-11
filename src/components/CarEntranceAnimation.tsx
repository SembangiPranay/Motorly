import React, { useState, useEffect, useRef } from "react"

interface CarEntranceAnimationProps {
  onComplete: () => void
  onSkip?: () => void
}

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  const [phase, setPhase] = useState<
    "arrival" | "ignition" | "poise" | "launch" | "exit"
  >("arrival")

  // Refs for zero-rerender telemetry HUD (guarantees rock-solid 120 FPS hardware acceleration)
  const rangeRef = useRef<HTMLSpanElement>(null)
  const modeRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Arrival Glide (0ms - 850ms)
    // The Luxury Grand Tourer glides gracefully into center stage with natural weighted deceleration
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 850)

    // Stage 2: Matrix LED Ignition & Suspension Settle (850ms - 1550ms)
    // 5-segment Matrix LED welcome choreography, laser projector ignition, volumetric beam throw & tarmac caustics
    const t2 = setTimeout(() => {
      setPhase("poise")
    }, 1550)

    // Stage 3: Telemetry Calibration & Brand Typography Reveal (1550ms - 2450ms)
    // Cockpit diagnostics lock: Range, GT Cruise Mode, Executive Fleet Typography reveals
    const t3 = setTimeout(() => {
      setPhase("launch")
    }, 2450)

    // Stage 4: High-Performance Smooth GT Launch (2450ms - 2850ms)
    // Instant torque deployment, chassis pitches forward, volumetric beam sweeps across
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 2850)

    // Stage 5: Final completion callback (2850ms - 3100ms)
    const t5 = setTimeout(() => {
      onComplete()
    }, 3100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  // Native requestAnimationFrame Telemetry Range Counter (Zero React re-renders, 120fps)
  useEffect(() => {
    if (phase === "ignition" || phase === "poise" || phase === "launch") {
      let startTimestamp: number | null = null
      const duration = 900
      const startRange = 520
      const targetRange = 640
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startRange + (targetRange - startRange) * ease)

        if (rangeRef.current) {
          rangeRef.current.textContent = `${current} KM`
        }
        if (modeRef.current && progress >= 0.8) {
          modeRef.current.textContent = phase === "launch" ? "SPORT+ ACTIVE" : "GT CRUISE"
        }
        if (statusRef.current && progress >= 0.7) {
          statusRef.current.textContent = "MALTA FLEET DISPATCH READY"
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

  const isGliding = phase === "arrival"
  const isIgnited =
    phase === "ignition" ||
    phase === "poise" ||
    phase === "launch" ||
    phase === "exit"
  const isPoised = phase === "poise" || phase === "launch" || phase === "exit"
  const isLaunching = phase === "launch" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire Executive Luxury Grand Tourer Entrance"
      className={`fixed inset-0 z-[10000] bg-[#060709] text-white flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-hidden select-none transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        WebkitTransform: "translate3d(0, 0, 0)",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity",
      }}
    >
      {/* 1. Executive Amber & Deep Obsidian Atmospheric Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/25 via-[#0D1017] to-[#040507] pointer-events-none" />

      {/* 2. Top Navigation Bar: Brand Watermark & Skip Button */}
      <div className="relative w-full max-w-6xl flex items-center justify-between z-30 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#F97316]" />
          <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold tracking-widest text-stone-300">
            PIT STOP CAR HIRE <span className="hidden sm:inline text-orange-500/80">•</span>{" "}
            <span className="hidden sm:inline text-stone-400">PRESTIGE & EXECUTIVE FLEET</span>
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

      {/* 3. Dynamic 3D Perspective Road & Scrolling Grid Ground */}
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
      </div>

      {/* 4. Main Stage: Photorealistic Luxury Grand Tourer Vector Model */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center z-10">
        {/* Overhead Ambient Studio Softbox Glow */}
        <div
          className={`absolute w-[720px] h-64 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isIgnited
              ? "bg-orange-600/25 scale-125 opacity-100"
              : "bg-orange-500/10 scale-90 opacity-40"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        {/* Dynamic Motion Container (Arrival Glide -> Weighted Suspension Settle -> Launch) */}
        <div
          className={`relative w-full max-w-4xl transition-all ease-out ${
            isGliding
              ? "translate-x-16 translate-y-0 duration-850"
              : isLaunching
              ? "-translate-x-24 -translate-y-0.5 scale-105 duration-700"
              : "translate-x-0 translate-y-0 duration-800"
          }`}
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
              willChange: "transform",
            }}
          >
            <defs>
              {/* 1. Metallic Liquid GT Silver Paint Gradient (Porsche GT Silver Metallic) */}
              <linearGradient id="gtSilverPaint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#F1F5F9" />
                <stop offset="45%" stopColor="#CBD5E1" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="90%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* 2. Tornado Shoulder Razor Specular Horizon Line */}
              <linearGradient id="gtTornadoStreak" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="15%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="45%" stopColor="#FED7AA" stopOpacity="1" />
                <stop offset="80%" stopColor="#F97316" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
              </linearGradient>

              {/* 3. Gloss Black Shadowline Window Surround Trim */}
              <linearGradient id="gtDLOShadowline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="30%" stopColor="#0F172A" />
                <stop offset="70%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              {/* 4. Ceramic Tinted Frameless Glasshouse */}
              <linearGradient id="gtGlassTint" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#020617" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>

              {/* 5. Windshield Specular Glare */}
              <linearGradient id="glassReflectionGlare" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* 6. Carbon Fiber Ground Blades & Splitter */}
              <linearGradient id="gtCarbonFiber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#27272A" />
                <stop offset="50%" stopColor="#18181B" />
                <stop offset="100%" stopColor="#09090B" />
              </linearGradient>

              {/* 7. Volumetric Headlight Main Beam Gradient */}
              <linearGradient id="volumetricBeam" x1="100%" y1="15%" x2="0%" y2="85%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                <stop offset="12%" stopColor="#E0F2FE" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#0284C7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
              </linearGradient>

              {/* 8. Wet Asphalt Ground Caustic Bounce */}
              <radialGradient id="roadCausticSheen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#0284C7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#060709" stopOpacity="0" />
              </radialGradient>

              {/* 9. Ground Contact Shadow (Underbody Ambient Occlusion) */}
              <radialGradient id="gtGroundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="1" />
                <stop offset="50%" stopColor="#000000" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#000000" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* 10. Low-Profile Sport Tire Radial */}
              <radialGradient id="gtSportTire" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#1E232E" />
                <stop offset="82%" stopColor="#2D3442" />
                <stop offset="94%" stopColor="#141822" />
                <stop offset="100%" stopColor="#080A0E" />
              </radialGradient>

              {/* 11. Diamond-Cut Chrome Spoke Gradient (Mirror Machined Polish) */}
              <linearGradient id="diamondCutSpoke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#CBD5E1" />
                <stop offset="65%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              {/* 12. Carbon Ceramic Brake Rotor */}
              <radialGradient id="gtCarbonCeramicRotor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="45%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="92%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#334155" />
              </radialGradient>

              {/* 13. Rear Monolithic 3D LED Lightbar Glow */}
              <radialGradient id="rearLightbarBloom" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#FF1E44" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#BE123C" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#881337" stopOpacity="0" />
              </radialGradient>

              {/* Dynamic CSS Keyframes */}
              <style>{`
                @keyframes gtTurbineSpin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .gt-wheel-spin {
                  animation: gtTurbineSpin 0.5s linear infinite;
                  transform-box: fill-box;
                  transform-origin: center;
                }
                @keyframes beamFocalPulse {
                  0% { opacity: 0.92; transform: scaleY(0.98); }
                  100% { opacity: 1; transform: scaleY(1.02); }
                }
                .matrix-beam-active {
                  animation: beamFocalPulse 1.8s ease-in-out infinite alternate;
                  transform-origin: 135px 265px;
                }
                @keyframes matrixSeqSweep {
                  0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px #38BDF8); }
                  50% { opacity: 0.85; filter: drop-shadow(0 0 4px #38BDF8); }
                }
                .matrix-jewel-pulse {
                  animation: matrixSeqSweep 1.2s ease-in-out infinite;
                }
              `}</style>
            </defs>

            {/* A. GROUND EFFECT SHADOWS & TIRE CONTACT PATCHES */}
            <ellipse cx="490" cy="355" rx="440" ry="18" fill="url(#gtGroundShadow)" />
            <ellipse cx="230" cy="352" rx="46" ry="6.5" fill="#000000" opacity="0.98" />
            <ellipse cx="730" cy="352" rx="48" ry="7" fill="#000000" opacity="0.98" />

            {/* B. VOLUMETRIC MATRIX LED BEAMS & WET ASPHALT CAUSTIC BOUNCE */}
            {isIgnited && (
              <g className="transition-opacity duration-700">
                {/* Wet Asphalt Caustic Sheen on Road */}
                <ellipse cx="60" cy="358" rx="140" ry="18" fill="url(#roadCausticSheen)" opacity="0.92" />
                <ellipse cx="130" cy="354" rx="70" ry="10" fill="url(#roadCausticSheen)" opacity="0.98" />

                {/* Volumetric Headlight Cones */}
                <g className="matrix-beam-active">
                  {/* Primary Broad Volumetric Cone */}
                  <polygon
                    points="132,265 -180,300 -220,400 115,345"
                    fill="url(#volumetricBeam)"
                  />
                  {/* High-Intensity Central Laser Core */}
                  <polygon
                    points="135,264 -140,285 -160,360 122,315"
                    fill="url(#volumetricBeam)"
                    opacity="0.88"
                  />
                  {/* Tarmac Surface Laser Boundary */}
                  <line
                    x1="132"
                    y1="265"
                    x2="-200"
                    y2="345"
                    stroke="#E0F2FE"
                    strokeWidth="2.8"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                  />
                  {/* Mie Scattering Atmospheric Particles in Beam Path */}
                  <circle cx="80" cy="285" r="1.5" fill="#FFFFFF" opacity="0.85" />
                  <circle cx="25" cy="310" r="2" fill="#E0F2FE" opacity="0.75" />
                  <circle cx="-35" cy="325" r="1.8" fill="#BAE6FD" opacity="0.65" />
                  <circle cx="105" cy="305" r="1.2" fill="#FFFFFF" opacity="0.9" />
                  <circle cx="-85" cy="340" r="2.2" fill="#E0F2FE" opacity="0.6" />
                </g>
              </g>
            )}

            {/* C. INNER WHEEL ARCH SHADOW LINERS */}
            <path d="M 175,340 C 175,275 200,246 230,246 C 260,246 285,275 285,340 Z" fill="#040608" />
            <path d="M 675,340 C 675,272 702,244 730,244 C 758,244 785,272 785,340 Z" fill="#040608" />

            {/* D. MAIN MONOCOQUE LUXURY GRAND TOURER BODYWORK */}
            {/* Sculpted Fastback Silhouette with True Porsche/Aston Martin GT Proportions */}
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
              fill="url(#gtSilverPaint)"
              stroke="#94A3B8"
              strokeWidth="1.5"
            />

            {/* Front Aero Air Dam & Brake Duct Intake (Sculpted Depth) */}
            <path
              d="M 106,335 C 112,324 126,318 150,317 L 153,336 Z"
              fill="#080C14"
              stroke="#1E293B"
              strokeWidth="0.8"
            />

            {/* Muscular Rear Quarter Haunch Reflection (Catches Studio Lighting) */}
            <path
              d="
                M 580,240 
                C 635,234 685,224 730,224 
                C 775,224 815,234 852,242 
                C 848,258 842,284 834,308 
                C 815,314 798,322 782,334 
                C 775,290 758,256 730,256 
                C 702,256 685,290 680,334 
                C 645,335 612,334 580,332 
                Z"
              fill="url(#gtSilverPaint)"
              opacity="0.9"
            />

            {/* E. TORNADO SHOULDER LINE / HORIZON SPECULAR STREAK */}
            <path
              d="M 138,264 C 205,252 305,244 420,238 C 540,234 670,228 765,226 C 810,226 838,236 852,242"
              fill="none"
              stroke="url(#gtTornadoStreak)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Lower Sculpted Aero Undercut Crease */}
            <path
              d="M 185,324 C 230,320 330,310 440,306 C 550,302 640,310 685,322"
              fill="none"
              stroke="#475569"
              strokeWidth="1.6"
            />

            {/* F. DAYLIGHT OPENING (DLO) / LUXURY GREENHOUSE & CERAMIC GLASS */}
            {/* Gloss Black Shadowline Outer Window Trim */}
            <path
              d="
                M 350,248 
                C 375,218 412,192 466,178 
                C 525,164 596,166 652,182 
                C 708,198 758,228 796,244 
                L 788,248 
                C 750,232 702,204 650,190 
                C 596,174 528,172 470,186 
                C 420,196 385,222 360,250 
                Z"
              fill="url(#gtDLOShadowline)"
            />

            {/* Deep Tinted Ceramic Frameless Glass */}
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
            />

            {/* Cabin Interior Accents (Visible through glass) */}
            {/* Driver GT Sport Bucket Seat Headrest with Embossed Crest */}
            
            
            {/* Passenger Headrest */}
            
            {/* GT Sport Steering Wheel Rim (Upper Arc with Orange Centering Stripe) */}
            
            
            {/* OLED Digital Binnacle Glow */}
            

            {/* B-Pillar Divider */}
            <line x1="550" y1="176" x2="550" y2="245" stroke="#000000" strokeWidth="4" />
            <line x1="550" y1="176" x2="550" y2="245" stroke="#334155" strokeWidth="1.5" />

            {/* Diagonal Windshield Specular Reflection Glare */}
            <polygon points="380,245 445,188 470,188 395,248" fill="url(#glassReflectionGlare)" />

            {/* G. AERODYNAMIC CARBON FIBER SIDE MIRROR */}
            <g transform="translate(355, 238)">
              <path d="M 0,8 L 12,6 L 16,10 L 4,11 Z" fill="#0A0D14" />
              <ellipse cx="14" cy="5" rx="14" ry="7" fill="url(#gtCarbonFiber)" stroke="#475569" strokeWidth="1" />
              {/* Slim Amber LED Turn Signal Repeater Strip */}
              <line x1="6" y1="5" x2="22" y2="5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* H. DOOR CUTLINES & FLUSH POP-OUT HANDLES */}
            <path d="M 360,250 C 350,270 340,300 335,339" fill="none" stroke="#64748B" strokeWidth="1.4" opacity="0.8" />
            <path d="M 550,245 C 555,272 560,302 565,339" fill="none" stroke="#64748B" strokeWidth="1.4" opacity="0.8" />
            {/* Flush Handles with Ambient LED Slit */}
            <g transform="translate(420, 255)">
              <rect x="0" y="0" width="28" height="5" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
              <line x1="4" y1="2.5" x2="24" y2="2.5" stroke="#F97316" strokeWidth="1.4" opacity="0.95" />
            </g>
            <g transform="translate(595, 255)">
              <rect x="0" y="0" width="28" height="5" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
              <line x1="4" y1="2.5" x2="24" y2="2.5" stroke="#F97316" strokeWidth="1.4" opacity="0.95" />
            </g>

            {/* I. LOWER ROCKER PANEL & CARBON GROUND EFFECT BLADES */}
            {/* Carbon Side Skirt Ground Blade with Pit Stop Orange Racing Stripe */}
            <polygon points="282,339 678,339 674,344 286,344" fill="url(#gtCarbonFiber)" />
            <line x1="284" y1="343.5" x2="676" y2="343.5" stroke="#F97316" strokeWidth="2" />

            {/* Front Carbon Fiber Aero Splitter */}
            <polygon points="98,339 178,339 175,343 102,343" fill="url(#gtCarbonFiber)" />
            <line x1="100" y1="342.5" x2="176" y2="342.5" stroke="#F97316" strokeWidth="1.8" />

            {/* Rear Carbon Fiber Aero Diffuser Strakes */}
            <polygon points="786,339 844,335 848,342 790,343" fill="url(#gtCarbonFiber)" />
            <line x1="805" y1="339" x2="807" y2="343" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="825" y1="338" x2="827" y2="343" stroke="#CBD5E1" strokeWidth="2" />

            {/* J. MATRIX LED HEADLIGHT CLUSTER (Audi/Porsche Taycan Style 5-Segment) */}
            <g transform="translate(132, 256)">
              {/* Headlight Polycarbonate Clear Housing Lens */}
              <polygon
                points="0,16 16,8 54,0 48,16 10,22"
                fill="#0B111C"
                stroke="#38BDF8"
                strokeWidth="1.6"
                strokeOpacity="0.9"
              />

              {/* Ice-White DRL (Daytime Running Light) Signature Light-Guide Eyebrow */}
              <path
                d="M 0,16 L 16,8 L 54,0"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="drop-shadow(0 0 8px #60A5FA)"
              />
              <path
                d="M 0,16 L 16,8 L 54,0"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* 5 Sequential Matrix LED Micro-Jewel Projector Modules */}
              <g className={isIgnited ? "matrix-jewel-pulse" : "opacity-40"}>
                <rect x="5" y="13" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="0.8" filter="drop-shadow(0 0 6px #38BDF8)" />
                <rect x="13" y="10" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="0.8" filter="drop-shadow(0 0 6px #38BDF8)" />
                <rect x="21" y="7" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="0.8" filter="drop-shadow(0 0 6px #38BDF8)" />
                <rect x="29" y="4" width="5" height="5" rx="1.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="0.8" filter="drop-shadow(0 0 6px #38BDF8)" />
                {/* Jewel 5 (Primary Laser Projector with Optical Crystal Lens) */}
                <circle cx="41" cy="7" r="6" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="1.8" filter="drop-shadow(0 0 14px #38BDF8)" />
                <circle cx="41" cy="7" r="3" fill="#FFFFFF" />
              </g>

              {/* Anamorphic Laser Flare Streak Across Front Lens */}
              {isIgnited && (
                <>
                  <ellipse cx="30" cy="8" rx="52" ry="1.4" fill="#38BDF8" opacity="0.95" />
                  <ellipse cx="30" cy="8" rx="26" ry="0.9" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* K. REAR MONOLITHIC 3D LED LIGHTBAR (Porsche Taycan / 911 Style Full-Width) */}
            <g transform="translate(842, 242)">
              {/* Ambient Red Bloom */}
              {isIgnited && <ellipse cx="8" cy="8" rx="22" ry="15" fill="url(#rearLightbarBloom)" opacity="0.95" />}
              {/* 3D Ruby LED Light Guide Strip */}
              <path
                d="M 0,2 C 6,4 12,8 14,14 L 10,18 C 8,14 4,8 0,6 Z"
                fill="#FF1E44"
                filter="drop-shadow(0 0 12px #FF1E44)"
              />
              {/* Bright White Neon Inner Core */}
              <path
                d="M 1,3 C 6,5 11,9 13,14"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* L. FRONT 21-INCH DIAMOND-CUT TURBINE ALLOY WHEEL */}
            <g transform="translate(230, 305)">
              {/* Low-Profile High-Performance Michelin Sport Tire Rubber */}
              <circle cx="0" cy="0" r="46" fill="url(#gtSportTire)" stroke="#0A0C10" strokeWidth="2.5" />
              {/* Outer Tire Tread Grooves */}
              <circle cx="0" cy="0" r="43" fill="none" stroke="#121620" strokeWidth="4.5" strokeDasharray="7, 3" />
              {/* Sidewall Spec Line */}
              <circle cx="0" cy="0" r="39.5" fill="none" stroke="#CBD5E1" strokeWidth="1" />

              {/* Ventilated Cross-Drilled Carbon-Ceramic Brake Rotor */}
              <circle cx="0" cy="0" r="32" fill="url(#gtCarbonCeramicRotor)" stroke="#FFFFFF" strokeWidth="1.2" />
              {/* Rotor Holes */}
              <g fill="#1E232E">
                <circle cx="0" cy="-20" r="1.3" /><circle cx="14" cy="-14" r="1.3" /><circle cx="20" cy="0" r="1.3" />
                <circle cx="14" cy="14" r="1.3" /><circle cx="0" cy="20" r="1.3" /><circle cx="-14" cy="14" r="1.3" />
                <circle cx="-20" cy="0" r="1.3" /><circle cx="-14" cy="-14" r="1.3" />
                <circle cx="0" cy="-25" r="1.2" /><circle cx="18" cy="-18" r="1.2" /><circle cx="25" cy="0" r="1.2" />
                <circle cx="18" cy="18" r="1.2" /><circle cx="0" cy="25" r="1.2" /><circle cx="-18" cy="18" r="1.2" />
                <circle cx="-25" cy="0" r="1.2" /><circle cx="-18" cy="-18" r="1.2" />
              </g>

              {/* Oversized Front Caliper in Pit Stop Performance Orange */}
              <g transform="translate(-28, -24)">
                <path
                  d="M 2,4 C 7,-1 18,-2 26,2 L 28,15 C 20,18 13,24 6,32 Z"
                  fill="#F97316"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))"
                />
                <circle cx="14" cy="12" r="3.2" fill="#FFFFFF" />
                <polygon points="14,10 16,13 12,13" fill="#F97316" />
              </g>

              {/* Rotating 10-Spoke Diamond-Cut Turbine Alloy Assembly */}
              <g
                className={isGliding || isLaunching ? "gt-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                {/* Wheel Outer Rim Ring in Pure Polished Silver */}
                <circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="33" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />

                {/* 10 Sculpted High-Contrast Diamond-Cut Aeroblades */}
                <polygon points="-2,-8 4,-8 10,-31 -1,-31" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="4,-6 8,-2 28,-17 24,-23" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="7,-1 7,5 31,-3 29,-9" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="5,4 2,8 24,25 28,19" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="1,7 -3,6 10,31 16,29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-4,6 -8,2 -18,27 -13,31" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-7,1 -7,-5 -31,3 -29,9" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-5,-4 -2,-8 -24,-24 -28,-19" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-1,-7 3,-6 -10,-31 -16,-29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="3,-7 7,-4 21,-26 16,-29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />

                {/* Titanium Lug Nut Ring & Anodized Orange Centerlock Hub */}
                <circle cx="0" cy="0" r="11" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="7.5" fill="#181A20" stroke="#CBD5E1" strokeWidth="1.2" />
                <polygon points="0,-4 3.5,-2 3.5,2 0,4 -3.5,2 -3.5,-2" fill="#0A0B0E" stroke="#FED7AA" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
              </g>
            </g>

            {/* M. REAR 21-INCH DIAMOND-CUT TURBINE ALLOY WHEEL */}
            <g transform="translate(730, 305)">
              {/* Low-Profile High-Performance Rear Michelin Sport Tire Rubber */}
              <circle cx="0" cy="0" r="47" fill="url(#gtSportTire)" stroke="#0A0C10" strokeWidth="2.5" />
              {/* Outer Tire Tread Grooves */}
              <circle cx="0" cy="0" r="44" fill="none" stroke="#121620" strokeWidth="4.5" strokeDasharray="7, 3" />
              {/* Sidewall Spec Line */}
              <circle cx="0" cy="0" r="40" fill="none" stroke="#CBD5E1" strokeWidth="1" />

              {/* Ventilated Carbon-Ceramic Brake Rotor */}
              <circle cx="0" cy="0" r="32.5" fill="url(#gtCarbonCeramicRotor)" stroke="#FFFFFF" strokeWidth="1.2" />
              <g fill="#1E232E">
                <circle cx="0" cy="-20" r="1.3" /><circle cx="14" cy="-14" r="1.3" /><circle cx="20" cy="0" r="1.3" />
                <circle cx="14" cy="14" r="1.3" /><circle cx="0" cy="20" r="1.3" /><circle cx="-14" cy="14" r="1.3" />
                <circle cx="-20" cy="0" r="1.3" /><circle cx="-14" cy="-14" r="1.3" />
                <circle cx="0" cy="-25" r="1.2" /><circle cx="18" cy="-18" r="1.2" /><circle cx="25" cy="0" r="1.2" />
                <circle cx="18" cy="18" r="1.2" /><circle cx="0" cy="25" r="1.2" /><circle cx="-18" cy="18" r="1.2" />
                <circle cx="-25" cy="0" r="1.2" /><circle cx="-18" cy="-18" r="1.2" />
              </g>

              {/* Rear Caliper in Pit Stop Performance Orange */}
              <g transform="translate(-27, -22)">
                <path
                  d="M 2,4 C 6,-1 16,-2 23,2 L 25,13 C 18,16 12,21 5,28 Z"
                  fill="#F97316"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))"
                />
                <circle cx="12" cy="10" r="2.8" fill="#FFFFFF" />
                <polygon points="12,8 14,11 10,11" fill="#F97316" />
              </g>

              {/* Rotating 10-Spoke Diamond-Cut Turbine Alloy Assembly */}
              <g
                className={isGliding || isLaunching ? "gt-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="33" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />

                <polygon points="-2,-8 4,-8 10,-31 -1,-31" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="4,-6 8,-2 28,-17 24,-23" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="7,-1 7,5 31,-3 29,-9" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="5,4 2,8 24,25 28,19" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="1,7 -3,6 10,31 16,29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-4,6 -8,2 -18,27 -13,31" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-7,1 -7,-5 -31,3 -29,9" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-5,-4 -2,-8 -24,-24 -28,-19" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="-1,-7 3,-6 -10,-31 -16,-29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />
                <polygon points="3,-7 7,-4 21,-26 16,-29" fill="url(#diamondCutSpoke)" stroke="#334155" strokeWidth="0.8" />

                <circle cx="0" cy="0" r="11" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="7.5" fill="#181A20" stroke="#CBD5E1" strokeWidth="1.2" />
                <polygon points="0,-4 3.5,-2 3.5,2 0,4 -3.5,2 -3.5,-2" fill="#0A0B0E" stroke="#FED7AA" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
              </g>
            </g>

            {/* N. SIGNATURE PIT STOP HEXAGON MONOGRAM CREST (Top Center) */}
            <g
              transform="translate(500, 60)"
              className={`transition-all duration-700 ${
                isIgnited ? "scale-105 opacity-100" : "scale-90 opacity-45"
              }`}
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
                fontFamily="'Plus Jakarta Sans', sans-serif"
                letterSpacing="1"
              >
                PS
              </text>
            </g>
          </svg>
        </div>

        {/* 5. Luxury Executive Cockpit Telemetry HUD Strip */}
        <div
          className={`mt-4 flex flex-col items-center justify-center transition-all duration-600 ${
            isIgnited ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 bg-stone-900/90 border border-white/15 px-4 sm:px-6 py-2.5 rounded-full backdrop-blur-md shadow-2xs font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">
                CHASSIS:
              </span>
              <strong className="text-[#38BDF8] font-bold text-[11px]">
                AIR LEVEL 0 (GT LOW)
              </strong>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-stone-700" />

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-400 uppercase text-[10px] font-bold">MODE:</span>
              <strong ref={modeRef} className="text-orange-500 font-bold">
                GT CRUISE
              </strong>
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-stone-700" />

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-400 uppercase text-[10px] font-bold">EST. RANGE:</span>
              <strong ref={rangeRef} className="text-white font-bold">
                640 KM
              </strong>
            </div>

            <div className="h-3.5 w-px bg-stone-700" />

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
              <span
                ref={statusRef}
                className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wider"
              >
                MALTA FLEET DISPATCH READY
              </span>
            </div>
          </div>
        </div>

        {/* 6. Brand Typography Reveal */}
        <div
          className={`mt-4 text-center space-y-1 transition-all duration-700 ${
            isPoised ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.36em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading">
            PIT STOP
          </h1>
          <p className="text-[10.5px] sm:text-xs font-mono uppercase tracking-[0.42em] text-stone-400 font-semibold">
            PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA
          </p>
        </div>

        {/* 7. Bottom Linear Acceleration Progress Line */}
        <div className="w-64 h-1 bg-stone-800/80 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-800 ease-out"
            style={{
              width:
                phase === "arrival"
                  ? "20%"
                  : phase === "ignition"
                  ? "55%"
                  : phase === "poise"
                  ? "85%"
                  : "100%",
            }}
          />
        </div>
      </div>
    </div>
  )
}
