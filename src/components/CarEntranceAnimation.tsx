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
    "arrival" | "ignition" | "revving" | "launch" | "exit"
  >("arrival")

  // Refs for zero-rerender tachometer and telemetry HUD (guarantees 120fps on Safari WebKit & Chrome)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Arrival & Pit Lane Glide (0ms - 850ms)
    // The F1 machine glides into center frame, open racing slicks rotate, aerodynamics settle
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 850)

    // Stage 2: Telemetry Calibration & FIA Rain Strobe Ignition (850ms - 1550ms)
    // Carbon-ceramic brakes heat up, laser wind-tunnel tracers ignite, DRS arms
    const t2 = setTimeout(() => {
      setPhase("revving")
    }, 1550)

    // Stage 3: Throttle Spooling & Pit Stop Atelier Typography Reveal (1550ms - 2450ms)
    // V6 Turbo-Hybrid spools to 12,400 RPM; brand typography expands
    const t3 = setTimeout(() => {
      setPhase("launch")
    }, 2450)

    // Stage 4: High-Speed Pit Exit Launch & Dissolve (2450ms - 2950ms)
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 2850)

    // Stage 5: Final completion callback
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

  // Native requestAnimationFrame Tachometer Counter (Zero React re-renders, 60-120fps)
  useEffect(() => {
    if (phase === "ignition" || phase === "revving" || phase === "launch") {
      let startTimestamp: number | null = null
      const duration = 850
      const startRpm = 4200
      const targetRpm = 12400
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        // High-rev Formula 1 power curve
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startRpm + (targetRpm - startRpm) * ease)

        if (rpmRef.current) {
          rpmRef.current.textContent = current.toLocaleString()
        }
        if (statusRef.current && current >= 10500) {
          statusRef.current.textContent = "V6 TURBO HYBRID ENGAGED"
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
    phase === "revving" ||
    phase === "launch" ||
    phase === "exit"
  const isRevving = phase === "revving" || phase === "launch" || phase === "exit"
  const isLaunching = phase === "launch" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire Formula 1 Grand Entrance"
      className={`fixed inset-0 z-[10000] bg-[#07080B] text-white flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        WebkitTransform: "translate3d(0, 0, 0)",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        WebkitPerspective: 1000,
        perspective: 1000,
        willChange: "transform, opacity",
      }}
    >
      {/* 1. Deep Space Carbon & Amber Studio Spotlight Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/25 via-[#0A0C11] to-[#040507] pointer-events-none" />

      {/* 2. High-Tech Perspective Pit Lane Grid (WebKit 3D hardware-composited) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.2) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            WebkitTransform: "perspective(380px) rotateX(65deg) translate3d(0, -20px, 0)",
            transform: "perspective(380px) rotateX(65deg) translate3d(0, -20px, 0)",
            WebkitTransformStyle: "preserve-3d",
            transformStyle: "preserve-3d",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransformOrigin: "bottom center",
            transformOrigin: "bottom center",
          }}
        />
        {/* Road Horizon Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#07080B]/85 to-[#07080B]" />
      </div>

      {/* 3. Top Skip Button & Brand Watermark */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
            PIT STOP CAR HIRE • MALTA PIT LANE DISPATCH
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 4. Main Stage: The Ultra-Realistic Formula 1 Machine */}
      <div className="relative w-full max-w-5xl px-4 flex flex-col items-center justify-center z-10">
        {/* Overhead Ambient Studio Spotlight */}
        <div
          className={`absolute w-[680px] h-72 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isIgnited
              ? "bg-orange-600/25 scale-125 opacity-100"
              : "bg-orange-500/10 scale-90 opacity-40"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        {/* The Full Car Motion Container (Smooth Glide, Suspension Settle & High-Speed Launch) */}
        <div
          className={`relative w-full max-w-4xl transition-all ease-out ${
            isGliding
              ? "translate-x-12 translate-y-1 duration-1000"
              : isLaunching
              ? "-translate-x-20 -translate-y-1 scale-105 duration-700"
              : "translate-x-0 translate-y-0 duration-800"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 1000 420"
            className="w-full h-auto overflow-visible"
            style={{
              WebkitTransform: "translate3d(0, 0, 0)",
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
            }}
          >
            <defs>
              {/* 1. Carbon Monocoque Paint */}
              <linearGradient id="f1CarbonPaint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2E333D" />
                <stop offset="25%" stopColor="#1E222A" />
                <stop offset="55%" stopColor="#12151B" />
                <stop offset="85%" stopColor="#0B0D11" />
                <stop offset="100%" stopColor="#040507" />
              </linearGradient>

              {/* 2. Metallic Orange Racing Livery */}
              <linearGradient id="f1OrangeLivery" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="40%" stopColor="#F97316" />
                <stop offset="70%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>

              {/* 3. Specular Ridge Highlight */}
              <linearGradient id="f1SpecularHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#FED7AA" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.6" />
              </linearGradient>

              {/* 4. Carbon Fiber Wing Composite */}
              <linearGradient id="carbonWing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1C1F26" />
                <stop offset="50%" stopColor="#111317" />
                <stop offset="100%" stopColor="#08090C" />
              </linearGradient>

              {/* 5. Racing Slick Tire Radial */}
              <radialGradient id="slickTireGrad" cx="50%" cy="50%" r="50%">
                <stop offset="65%" stopColor="#16181D" />
                <stop offset="85%" stopColor="#242831" />
                <stop offset="96%" stopColor="#0C0D11" />
                <stop offset="100%" stopColor="#040506" />
              </radialGradient>

              {/* 6. Magnesium Centerlock Rim */}
              <radialGradient id="f1RimGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="25%" stopColor="#27272A" />
                <stop offset="75%" stopColor="#09090B" />
                <stop offset="100%" stopColor="#18181B" />
              </radialGradient>

              {/* 7. Carbon Ceramic Brake Rotor Heat Glow */}
              <radialGradient id="brakeHeatGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#EA580C" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
              </radialGradient>

              {/* 8. FIA Rear Rain LED Light */}
              <radialGradient id="fiaRainLightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="20%" stopColor="#FF2222" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#DC2626" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0" />
              </radialGradient>

              {/* 9. Ground Shadow */}
              <radialGradient id="f1GroundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#000000" stopOpacity="0.65" />
                <stop offset="85%" stopColor="#000000" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* 10. Underbody Amber Ground Glow */}
              <radialGradient id="f1Underglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
                <stop offset="45%" stopColor="#F97316" stopOpacity="0.18" />
                <stop offset="80%" stopColor="#F97316" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </radialGradient>

              {/* 11. Monogram Gold Gradient */}
              <linearGradient id="monogramGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7ED" />
                <stop offset="40%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>

              <style>{`
                @keyframes windFlow {
                  0% { stroke-dashoffset: 240; opacity: 0; }
                  20% { opacity: 0.85; }
                  80% { opacity: 0.85; }
                  100% { stroke-dashoffset: -240; opacity: 0; }
                }
                .wind-tracer {
                  stroke-dasharray: 80, 160;
                  animation: windFlow 1.6s linear infinite;
                }
                @keyframes rainLightBlink {
                  0% { opacity: 0.35; transform: scale(0.9); }
                  100% { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 10px #EF4444); }
                }
                .pulse-rain-light {
                  animation: rainLightBlink 0.35s infinite alternate;
                  transform-origin: 912px 275px;
                }
                @keyframes wheelRotate {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .safari-f1-wheel-spin {
                  animation: wheelRotate 0.5s linear infinite;
                }
              `}</style>
            </defs>

            {/* 1. GROUND EFFECT SHADOW & NEON PIT LANE REFLECTION */}
            <ellipse cx="500" cy="358" rx="460" ry="24" fill="url(#f1GroundShadow)" />
            {isIgnited && (
              <ellipse
                cx="490"
                cy="355"
                rx="380"
                ry="14"
                fill="url(#f1Underglow)"
                className="transition-opacity duration-700"
              />
            )}
            {/* Direct contact patches for open tires */}
            <ellipse cx="195" cy="352" rx="42" ry="7" fill="#000000" opacity="0.95" />
            <ellipse cx="795" cy="350" rx="48" ry="8" fill="#000000" opacity="0.95" />

            {/* 2. AERODYNAMIC WIND TUNNEL LASER FLOW TRACERS */}
            {isIgnited && (
              <g className="transition-opacity duration-500">
                <path
                  d="M 30,285 C 90,285 130,290 190,270 C 260,245 320,225 410,215 C 470,210 520,185 580,180 C 650,175 730,175 840,195 L 980,195"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="wind-tracer"
                  opacity="0.8"
                />
                <path
                  d="M 40,305 C 110,305 160,310 240,305 C 340,300 450,295 560,295 C 670,295 720,310 820,305 L 970,305"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="wind-tracer"
                  opacity="0.6"
                />
                <path
                  d="M 60,320 C 140,320 220,325 350,322 C 480,320 620,320 740,325 L 960,328"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="wind-tracer"
                  opacity="0.7"
                />
              </g>
            )}

            {/* 3. INNER SUSPENSION CARBON WISHBONES (Behind front wheel) */}
            <line x1="200" y1="285" x2="310" y2="265" stroke="#181A20" strokeWidth="5" strokeLinecap="round" />
            <line x1="200" y1="285" x2="310" y2="265" stroke="#383E4D" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="195" y1="315" x2="320" y2="305" stroke="#181A20" strokeWidth="6" strokeLinecap="round" />
            <line x1="210" y1="298" x2="315" y2="290" stroke="#F97316" strokeWidth="2" />

            {/* 4. REAR SUSPENSION PUSHROD & DRIVESHAFT */}
            <line x1="795" y1="280" x2="710" y2="255" stroke="#181A20" strokeWidth="6" strokeLinecap="round" />
            <line x1="795" y1="315" x2="715" y2="305" stroke="#181A20" strokeWidth="7" strokeLinecap="round" />

            {/* 5. MAIN FORMULA 1 MONOCOQUE CHASSIS & SCULPTED BODYWORK */}
            {/* Main Chassis Body Profile: 1:1 match with authentic paper F1 logo geometry! */}
            <path
              d="
                M 75,302 
                C 95,298 120,292 165,285 
                C 210,278 260,268 310,256 
                C 350,246 385,236 415,234 
                L 455,234 
                C 465,220 480,185 505,178 
                C 530,172 555,172 575,182 
                C 590,190 595,205 600,225 
                C 640,228 690,230 735,235 
                C 780,240 820,242 850,240 
                L 870,245 
                L 870,290 
                C 860,305 845,318 820,325 
                L 730,325 
                C 660,328 580,325 500,322 
                C 420,318 350,315 280,312 
                L 155,310 
                Z"
              fill="url(#f1CarbonPaint)"
              stroke="#1E222A"
              strokeWidth="1.5"
            />

            {/* Aerodynamic Shark Fin (Extends from Airbox to Rear Wing pylon) */}
            <path d="M 540,175 L 835,185 L 835,242 L 590,210 Z" fill="url(#carbonWing)" opacity="0.95" />
            <path d="M 540,175 L 835,185" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />

            {/* Engine Induction Airbox Intake Scoop (Hollow opening above driver helmet) */}
            <ellipse cx="525" cy="188" rx="14" ry="11" fill="#050608" stroke="#F97316" strokeWidth="2" />
            <ellipse cx="525" cy="188" rx="10" ry="7" fill="#000000" />

            {/* Driver Cockpit with Titanium Halo Safety Ring */}
            <ellipse cx="468" cy="226" rx="16" ry="15" fill="#18181B" stroke="#3F3F46" strokeWidth="1.5" />
            {/* Iridescent Gold Helmet Visor */}
            <path d="M 458,222 C 465,220 472,220 478,225 L 476,231 C 470,228 464,228 458,229 Z" fill="#F59E0B" />
            {/* Titanium Halo Arc */}
            <path d="M 432,236 C 445,212 485,212 510,230" fill="none" stroke="#E4E4E7" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 432,236 C 445,212 485,212 510,230" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="472" y1="216" x2="470" y2="236" stroke="#E4E4E7" strokeWidth="3" />

            {/* Sidepod Radiator Air Intake Duct (Aggressive Ground Effect Undercut) */}
            <path
              d="M 380,250 C 430,252 500,258 580,265 C 640,270 700,285 745,302 L 740,318 C 660,318 560,312 480,305 C 410,298 360,285 345,268 Z"
              fill="url(#carbonWing)"
              stroke="rgba(249,115,22,0.5)"
              strokeWidth="1.2"
            />

            {/* Dynamic Orange Performance Livery Swoosh across Nose & Sidepod */}
            <path
              d="M 120,298 C 180,290 250,280 340,265 C 410,255 490,256 570,264 C 630,270 710,290 770,305 L 755,312 C 690,298 620,282 560,276 C 480,268 400,266 330,278 C 240,292 170,304 115,306 Z"
              fill="url(#f1OrangeLivery)"
            />
            {/* Specular Highlight Streak */}
            <path
              d="M 140,293 C 210,284 280,274 360,262 C 440,252 520,254 600,262"
              fill="none"
              stroke="url(#f1SpecularHighlight)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Pit Stop Brand Monogram on F1 Engine Cover */}
            <g transform="translate(615, 238) scale(0.65)">
              <rect x="0" y="0" width="110" height="34" rx="8" fill="#0C0E12" stroke="#F97316" strokeWidth="1" />
              <text x="14" y="16" fill="#FFFFFF" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="11" letterSpacing="1">
                PIT STOP
              </text>
              <text x="14" y="27" fill="#F97316" fontFamily="'JetBrains Mono', monospace" fontWeight="800" fontSize="7.5" letterSpacing="2">
                CAR HIRE
              </text>
            </g>

            {/* 6. HIGH-DOWNFORCE FRONT WING ASSEMBLY (1:1 with Official Vector) */}
            <polygon points="50,326 215,326 215,318 60,314" fill="#0D0F14" stroke="#F97316" strokeWidth="1.5" />
            <polygon points="55,315 200,317 195,312 62,310" fill="#181A22" stroke="#2C3240" strokeWidth="1" />
            <polygon points="65,310 185,311 180,306 72,305" fill="#181A22" stroke="#2C3240" strokeWidth="1" />
            {/* Front Wing Endplate with Diveplane */}
            <path d="M 45,330 L 48,296 L 72,304 L 70,328 Z" fill="url(#carbonWing)" stroke="#F97316" strokeWidth="1.5" />
            <path d="M 48,310 C 58,308 68,312 75,314" fill="none" stroke="#F97316" strokeWidth="2" />

            {/* 7. REAR WING ASSEMBLY & FIA SAFETY RAIN BEACON */}
            <path d="M 830,248 L 840,172 L 915,170 L 910,250 Z" fill="url(#carbonWing)" stroke="#27272A" strokeWidth="1.5" />
            <polygon points="840,172 915,170 915,182 840,184" fill="#0C0E14" stroke="#F97316" strokeWidth="1.5" />
            <polygon points="840,188 915,186 915,198 840,200" fill="#151820" stroke="#3F3F46" strokeWidth="1" />
            {/* DRS Hydraulic Pod */}
            <rect x="872" y="166" width="10" height="18" rx="2" fill="#F97316" />
            {/* Rear Diffuser */}
            <polygon points="820,320 905,314 910,326 815,330" fill="#090A0D" stroke="#F97316" strokeWidth="1" />

            {/* FIA Formula 1 Rear Rain Safety Warning Strobe (Pulsing Red LED) */}
            {isIgnited && (
              <g className="pulse-rain-light">
                <ellipse cx="912" cy="275" rx="14" ry="14" fill="url(#fiaRainLightGlow)" />
                <rect x="908" y="271" width="8" height="8" rx="2" fill="#FFFFFF" />
              </g>
            )}

            {/* 8. FRONT OPEN RACING SLICK (Exposed F1 Wheel with Pirelli-Style Stripe) */}
            <g transform="translate(195, 302)">
              {/* Brake Rotor Glowing Inside */}
              <circle cx="0" cy="0" r="28" fill="#18181B" stroke="#F97316" strokeWidth="2" />
              <circle cx="0" cy="0" r="24" fill="url(#brakeHeatGlow)" />
              {/* Orange Brembo Monobloc Caliper */}
              <path d="M -18,-18 L -6,-24 L -4,-10 L -16,-6 Z" fill="#F97316" />

              {/* Main Black Slick Tire Rubber */}
              <circle cx="0" cy="0" r="44" fill="none" stroke="url(#slickTireGrad)" strokeWidth="26" />
              <circle cx="0" cy="0" r="54" fill="none" stroke="#050608" strokeWidth="4" />
              {/* Pirelli-style High-Speed Orange Wall Line */}
              <circle cx="0" cy="0" r="45" fill="none" stroke="#F97316" strokeWidth="2.5" strokeDasharray="14, 6" />

              {/* Centerlock Magnesium Rim (Rotates during glide/launch) */}
              <g
                className={isGliding || isLaunching ? "safari-f1-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <circle cx="0" cy="0" r="28" fill="url(#f1RimGrad)" stroke="#3F3F46" strokeWidth="1" />
                <g stroke="#71717A" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="0" y1="-24" x2="0" y2="24" />
                  <line x1="-24" y1="0" x2="24" y2="0" />
                  <line x1="-17" y1="-17" x2="17" y2="17" />
                  <line x1="17" y1="-17" x2="-17" y2="17" />
                </g>
                <circle cx="0" cy="0" r="8" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="4" fill="#000000" />
              </g>
            </g>

            {/* 9. REAR OPEN RACING SLICK (Wider Profile) */}
            <g transform="translate(795, 298)">
              {/* Brake Rotor Glowing Inside */}
              <circle cx="0" cy="0" r="32" fill="#18181B" stroke="#F97316" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="28" fill="url(#brakeHeatGlow)" />
              {/* Orange Caliper */}
              <path d="M -22,-20 L -8,-28 L -6,-12 L -20,-8 Z" fill="#F97316" />

              {/* Extra Wide Rear Slick Tire Rubber */}
              <circle cx="0" cy="0" r="48" fill="none" stroke="url(#slickTireGrad)" strokeWidth="28" />
              <circle cx="0" cy="0" r="59" fill="none" stroke="#050608" strokeWidth="4" />
              {/* Pirelli-style High-Speed Orange Wall Line */}
              <circle cx="0" cy="0" r="50" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray="16, 7" />

              {/* Centerlock Rim (Rotates during glide/launch) */}
              <g
                className={isGliding || isLaunching ? "safari-f1-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <circle cx="0" cy="0" r="32" fill="url(#f1RimGrad)" stroke="#3F3F46" strokeWidth="1" />
                <g stroke="#71717A" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="0" y1="-28" x2="0" y2="28" />
                  <line x1="-28" y1="0" x2="28" y2="0" />
                  <line x1="-20" y1="-20" x2="20" y2="20" />
                  <line x1="20" y1="-20" x2="-20" y2="20" />
                </g>
                <circle cx="0" cy="0" r="9" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="4.5" fill="#000000" />
              </g>
            </g>

            {/* 10. SIGNATURE PIT STOP HEXAGON MONOGRAM CREST (Top Center) */}
            <g
              transform="translate(500, 68)"
              className={`transition-all duration-700 ${
                isIgnited ? "scale-105 opacity-100" : "scale-90 opacity-45"
              }`}
            >
              <polygon
                points="0,-36 32,-18 32,18 0,36 -32,18 -32,-18"
                fill="none"
                stroke="#F97316"
                strokeWidth="6"
                strokeOpacity="0.25"
              />
              <polygon
                points="0,-36 32,-18 32,18 0,36 -32,18 -32,-18"
                fill="rgba(10, 11, 16, 0.92)"
                stroke="url(#monogramGold)"
                strokeWidth="2.2"
              />
              <text
                x="0"
                y="8"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="20"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                PS
              </text>
            </g>
          </svg>
        </div>

        {/* 5. Pit Wall Telemetry & Tachometer HUD */}
        <div
          className={`mt-3 flex flex-col items-center justify-center transition-all duration-500 ${
            isIgnited ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 bg-stone-900/85 border border-white/12 px-4 sm:px-6 py-2 rounded-full backdrop-blur-md shadow-2xs font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">
                TACHOMETER
              </span>
              <span className="font-black text-sm text-orange-500">
                <span ref={rpmRef}>0</span> <span className="text-[10px] text-stone-400">RPM</span>
              </span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-stone-700" />
            <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-[11px]">
              <span className="text-stone-500">GEAR:</span>
              <strong className="text-white">7TH</strong>
            </div>
            <div className="hidden sm:block h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-500">DRS:</span>
              <strong className="text-emerald-400 font-bold">&bull; ARMED</strong>
            </div>
            <div className="h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                ref={statusRef}
                className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
              >
                SYSTEM CALIBRATION
              </span>
            </div>
          </div>
        </div>

        {/* 6. Brand Typography Reveal */}
        <div
          className={`mt-5 text-center space-y-1 transition-all duration-700 ${
            isRevving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.38em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading">
            PIT STOP
          </h1>
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.45em] text-stone-400 font-semibold">
            CAR HIRE • 36 TRIQ IL-KBIRA, MGARR, MALTA
          </p>
        </div>

        {/* 7. Bottom Linear Acceleration Progress Line */}
        <div className="w-64 h-1 bg-stone-800/80 rounded-full mt-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-800 ease-out"
            style={{
              width:
                phase === "arrival"
                  ? "20%"
                  : phase === "ignition"
                  ? "55%"
                  : phase === "revving"
                  ? "85%"
                  : "100%",
            }}
          />
        </div>
      </div>
    </div>
  )
}
