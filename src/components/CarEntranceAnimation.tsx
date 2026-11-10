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
    "intro" | "tracing" | "ignition" | "revving" | "exit"
  >("intro")

  // Refs for zero-rerender tachometer and status HUD (prevents Safari main-thread thrashing)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Laser silhouette vector contour starts immediately (0ms - 600ms)
    const t1 = setTimeout(() => {
      setPhase("tracing")
    }, 50)

    // Stage 2: Dual LED projector headlights ignite & volumetric light beams slice forward (650ms - 1300ms)
    const t2 = setTimeout(() => {
      setPhase("ignition")
    }, 650)

    // Stage 3: RPM revving and Motorly brand typography expands (1300ms - 2150ms)
    const t3 = setTimeout(() => {
      setPhase("revving")
    }, 1300)

    // Stage 4: Cinematic forward acceleration and smooth curtain dissolve (2150ms - 2750ms)
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 2150)

    // Stage 5: Final completion callback
    const t5 = setTimeout(() => {
      onComplete()
    }, 2750)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  // Native requestAnimationFrame Tachometer Counter (Zero React re-renders, 60-120fps smooth on Safari)
  useEffect(() => {
    if (phase === "ignition" || phase === "revving") {
      let startTimestamp: number | null = null
      const duration = 800
      const startRpm = 0
      const targetRpm = 7600
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic curve for natural engine spooling
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startRpm + (targetRpm - startRpm) * ease)

        if (rpmRef.current) {
          rpmRef.current.textContent = current.toLocaleString()
        }
        if (statusRef.current && current >= 6800) {
          statusRef.current.textContent = "V12 TWIN-TURBO ENGAGED"
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

  const isIgnited = phase === "ignition" || phase === "revving" || phase === "exit"
  const isRevving = phase === "revving" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Motorly Brand Entrance"
      className={`fixed inset-0 z-[10000] bg-[#08090C] text-white flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
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
      {/* 1. Deep Space Carbon & Amber Radial Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-950/25 via-[#0A0C11] to-[#050608] pointer-events-none" />

      {/* 2. High-Tech Perspective Road Grid (WebKit 3D hardware-composited, zero flicker) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            WebkitTransform: "perspective(360px) rotateX(62deg) translate3d(0, -20px, 0)",
            transform: "perspective(360px) rotateX(62deg) translate3d(0, -20px, 0)",
            WebkitTransformStyle: "preserve-3d",
            transformStyle: "preserve-3d",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransformOrigin: "bottom center",
            transformOrigin: "bottom center",
          }}
        />
        {/* Road Horizon Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#08090C]/80 to-[#08090C]" />
      </div>

      {/* 3. Top Skip Button & Brand Watermark */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
            MOTORLY ATELIER • SYSTEM INITIALIZATION
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>

      {/* 4. Main Stage: The Aerodynamic Hypercar & Monogram Animation */}
      <div className="relative w-full max-w-4xl px-4 flex flex-col items-center justify-center z-10">
        {/* Ambient Glow Aura behind Car */}
        <div
          className={`absolute w-96 h-48 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isIgnited
              ? "bg-orange-600/30 scale-125 opacity-100"
              : "bg-orange-500/10 scale-75 opacity-40"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        {/* The Sleek Aerodynamic Silhouette SVG Canvas */}
        <div
          className={`relative w-full max-w-2xl transition-all duration-700 ease-out ${
            isExiting ? "scale-110 -translate-y-2" : "scale-100 translate-y-0"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform, opacity",
          }}
        >
          <svg
            viewBox="0 0 800 320"
            className="w-full h-auto overflow-visible"
            style={{
              WebkitTransform: "translate3d(0, 0, 0)",
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
            }}
          >
            <defs>
              {/* Laser Orange Gradient */}
              <linearGradient id="laserOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
                <stop offset="50%" stopColor="#FB923C" stopOpacity="1" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="1" />
              </linearGradient>

              {/* Volumetric Headlight High-Speed Beam with Multi-Stop Native Falloff (Zero CPU blur) */}
              <linearGradient id="headlightBeam" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                <stop offset="14%" stopColor="#E0F2FE" stopOpacity="0.75" />
                <stop offset="38%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="68%" stopColor="#0284C7" stopOpacity="0.14" />
                <stop offset="92%" stopColor="#0369A1" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
              </linearGradient>

              {/* Optical Lens Flare Glint (100% GPU Native) */}
              <radialGradient id="projectorFlare" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#BAE6FD" stopOpacity="0.8" />
                <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="80%" stopColor="#0284C7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </radialGradient>

              {/* Ground Shadow Radial Gradient (Zero CPU blur) */}
              <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#000000" stopOpacity="0.55" />
                <stop offset="75%" stopColor="#000000" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Amber Ground Underglow Gradient (Zero CPU blur) */}
              <radialGradient id="groundUnderglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
                <stop offset="45%" stopColor="#F97316" stopOpacity="0.12" />
                <stop offset="80%" stopColor="#F97316" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </radialGradient>

              {/* Ruby Taillight Radial Glow (Zero CPU blur) */}
              <radialGradient id="rubyTaillightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#DC2626" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#991B1B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0" />
              </radialGradient>

              {/* Monogram Chrome & Gold Gradient */}
              <linearGradient id="monogramGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7ED" />
                <stop offset="40%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>

            {/* GROUND SHADOW & WET REFLECTION (Native GPU Radial Gradients) */}
            <ellipse cx="400" cy="275" rx="340" ry="22" fill="url(#groundShadow)" />
            {isIgnited && (
              <ellipse
                cx="380"
                cy="270"
                rx="280"
                ry="14"
                fill="url(#groundUnderglow)"
                className="transition-opacity duration-500"
              />
            )}

            {/* VOLUMETRIC HEADLIGHT BEAM RAYS (Ignited Phase) */}
            {isIgnited && (
              <g className="transition-opacity duration-500 opacity-95 animate-fade-in">
                {/* Outer Conical Beam cutting left across asphalt */}
                <polygon
                  points="110,215 0,165 0,310 110,230"
                  fill="url(#headlightBeam)"
                />
                {/* Inner High-Intensity Core Beam */}
                <polygon
                  points="110,215 0,188 0,272 110,225"
                  fill="url(#headlightBeam)"
                  opacity="0.9"
                />
                {/* Projector Lens Flare Glint */}
                <circle cx="110" cy="216" r="22" fill="url(#projectorFlare)" />
                <circle cx="110" cy="216" r="4.5" fill="#FFFFFF" />
                {/* Horizontal Projector Glint Lines */}
                <line
                  x1="75"
                  y1="216"
                  x2="145"
                  y2="216"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeOpacity="0.95"
                />
                <line
                  x1="55"
                  y1="216"
                  x2="165"
                  y2="216"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeOpacity="0.45"
                />
              </g>
            )}

            {/* TAILLIGHT NEON RED DIFFUSER GLOW */}
            {isIgnited && (
              <g className="animate-fade-in">
                <circle cx="718" cy="208" r="14" fill="url(#rubyTaillightGlow)" />
                <circle cx="718" cy="208" r="3.5" fill="#FFFFFF" />
                <line
                  x1="700"
                  y1="208"
                  x2="735"
                  y2="208"
                  stroke="#EF4444"
                  strokeWidth="5"
                  strokeOpacity="0.35"
                  strokeLinecap="round"
                />
                <line
                  x1="700"
                  y1="208"
                  x2="735"
                  y2="208"
                  stroke="#F87171"
                  strokeWidth="2.5"
                  strokeOpacity="0.95"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* CAR SILHOUETTE VECTOR PATHS (Safari-optimized with pathLength=100) */}
            <g
              fill="none"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            >
              {/* 1. Main Aerodynamic Roofline & Body Silhouette */}
              <path
                d="M 85,235 C 105,215 140,195 210,185 C 260,178 305,138 375,134 C 430,130 500,132 545,148 C 585,162 630,188 685,196 C 715,200 730,215 720,235"
                stroke="url(#laserOrange)"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={phase === "intro" ? 100 : 0}
                style={{
                  transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
                  WebkitTransition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
                  willChange: "stroke-dashoffset",
                }}
              />

              {/* 2. Cabin Glass Greenhouse Contour */}
              <path
                d="M 285,178 C 330,145 385,140 440,140 C 490,140 525,155 550,178 Z"
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth="1.8"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={phase === "intro" ? 100 : 0}
                style={{
                  transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                  WebkitTransition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                  willChange: "stroke-dashoffset",
                }}
              />

              {/* 3. Aerodynamic Side Skirt & Lower Chassis */}
              <path
                d="M 85,235 L 140,235 M 240,235 L 565,235 M 665,235 L 720,235"
                stroke="url(#laserOrange)"
                strokeWidth="3.2"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={phase === "intro" ? 100 : 0}
                style={{
                  transition: "stroke-dashoffset 0.8s ease-out 0.1s",
                  WebkitTransition: "stroke-dashoffset 0.8s ease-out 0.1s",
                  willChange: "stroke-dashoffset",
                }}
              />

              {/* 4. High-Performance Front Wheel Arch */}
              <path
                d="M 140,235 A 50,50 0 0,1 240,235"
                stroke="#F97316"
                strokeWidth="2.5"
              />

              {/* 5. High-Performance Rear Wheel Arch */}
              <path
                d="M 565,235 A 50,50 0 0,1 665,235"
                stroke="#F97316"
                strokeWidth="2.5"
              />

              {/* 6. Sculpted Side Aero Air Intake S-Duct */}
              <path
                d="M 275,190 C 340,195 430,205 520,190 C 538,187 555,215 565,230"
                stroke="rgba(249, 115, 22, 0.75)"
                strokeWidth="1.8"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={phase === "intro" ? 100 : 0}
                style={{
                  transition: "stroke-dashoffset 0.8s ease-out 0.3s",
                  WebkitTransition: "stroke-dashoffset 0.8s ease-out 0.3s",
                  willChange: "stroke-dashoffset",
                }}
              />

              {/* 7. Front Razor LED Headlight Slash (Dual-stroke GPU laser glow) */}
              {isIgnited && (
                <path
                  d="M 105,218 Q 150,208 178,202"
                  stroke="#38BDF8"
                  strokeWidth="8"
                  strokeOpacity="0.35"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
              <path
                d="M 105,218 Q 150,208 178,202"
                stroke={isIgnited ? "#E0F2FE" : "#F97316"}
                strokeWidth={isIgnited ? "3" : "2"}
                strokeLinecap="round"
                className="transition-all duration-500"
              />

              {/* 8. Rear Ruby Neon Lightbar (Dual-stroke GPU laser glow) */}
              {isIgnited && (
                <path
                  d="M 685,206 Q 715,208 720,218"
                  stroke="#EF4444"
                  strokeWidth="8"
                  strokeOpacity="0.35"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
              <path
                d="M 685,206 Q 715,208 720,218"
                stroke={isIgnited ? "#FECACA" : "#F97316"}
                strokeWidth={isIgnited ? "3" : "2"}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </g>

            {/* FRONT WHEEL & ALLOY ROTOR (Hardware-Accelerated Safari Roll & Spin) */}
            <g transform="translate(190, 235)">
              {/* Outer Tire */}
              <circle cx="0" cy="0" r="44" fill="#0C0A09" stroke="#332B25" strokeWidth="2" />
              {/* Brake Rotor Disc */}
              <circle cx="0" cy="0" r="34" fill="#17191C" stroke="#292524" strokeWidth="1.5" />
              {/* Rolling Rim Perforations (stroke-dashoffset roll is 100% immune to WebKit origin bugs) */}
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="none"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeDasharray="14 10"
                className={isIgnited ? "safari-wheel-roll" : ""}
              />
              {/* High-Speed Multi-Spoke Rotor Blades */}
              <g
                className={isIgnited ? "safari-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <line x1="-28" y1="0" x2="28" y2="0" stroke="rgba(249,115,22,0.85)" strokeWidth="1.8" />
                <line x1="0" y1="-28" x2="0" y2="28" stroke="rgba(249,115,22,0.85)" strokeWidth="1.8" />
                <line x1="-20" y1="-20" x2="20" y2="20" stroke="rgba(249,115,22,0.5)" strokeWidth="1.2" />
                <line x1="-20" y1="20" x2="20" y2="-20" stroke="rgba(249,115,22,0.5)" strokeWidth="1.2" />
              </g>
              {/* Center Hub Cap */}
              <circle cx="0" cy="0" r="13" fill="#1C1917" stroke="#F97316" strokeWidth="2.5" />
            </g>

            {/* REAR WHEEL & ALLOY ROTOR (Hardware-Accelerated Safari Roll & Spin) */}
            <g transform="translate(615, 235)">
              {/* Outer Tire */}
              <circle cx="0" cy="0" r="44" fill="#0C0A09" stroke="#332B25" strokeWidth="2" />
              {/* Brake Rotor Disc */}
              <circle cx="0" cy="0" r="34" fill="#17191C" stroke="#292524" strokeWidth="1.5" />
              {/* Rolling Rim Perforations */}
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="none"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeDasharray="14 10"
                className={isIgnited ? "safari-wheel-roll" : ""}
              />
              {/* High-Speed Multi-Spoke Rotor Blades */}
              <g
                className={isIgnited ? "safari-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <line x1="-28" y1="0" x2="28" y2="0" stroke="rgba(249,115,22,0.85)" strokeWidth="1.8" />
                <line x1="0" y1="-28" x2="0" y2="28" stroke="rgba(249,115,22,0.85)" strokeWidth="1.8" />
                <line x1="-20" y1="-20" x2="20" y2="20" stroke="rgba(249,115,22,0.5)" strokeWidth="1.2" />
                <line x1="-20" y1="20" x2="20" y2="-20" stroke="rgba(249,115,22,0.5)" strokeWidth="1.2" />
              </g>
              {/* Center Hub Cap */}
              <circle cx="0" cy="0" r="13" fill="#1C1917" stroke="#F97316" strokeWidth="2.5" />
            </g>

            {/* 9. SIGNATURE "M" MONOGRAM (Dual-stroke GPU Glow Emblem) */}
            <g
              transform="translate(400, 65)"
              className={`transition-all duration-700 ${
                isIgnited ? "scale-105 opacity-100" : "scale-90 opacity-40"
              }`}
            >
              {/* Outer Glowing Hex Ring Halo */}
              <polygon
                points="0,-36 32,-18 32,18 0,36 -32,18 -32,-18"
                fill="none"
                stroke="#F97316"
                strokeWidth="6"
                strokeOpacity="0.25"
              />
              {/* Inner Solid Hex Ring */}
              <polygon
                points="0,-36 32,-18 32,18 0,36 -32,18 -32,-18"
                fill="rgba(10, 11, 16, 0.9)"
                stroke="url(#monogramGold)"
                strokeWidth="2.2"
              />
              {/* Geometric Precision "M" Lettermark Outer Aura */}
              <path
                d="M -18,16 L -18,-12 L 0,6 L 18,-12 L 18,16"
                fill="none"
                stroke="#F97316"
                strokeWidth="6"
                strokeOpacity="0.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Geometric Precision "M" Lettermark Core */}
              <path
                d="M -18,16 L -18,-12 L 0,6 L 18,-12 L 18,16"
                fill="none"
                stroke="url(#monogramGold)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* 5. Center High-Tech HUD & Tachometer Gauge (Zero React Re-renders, Pure RAF) */}
        <div
          className={`mt-4 flex flex-col items-center justify-center transition-all duration-500 ${
            isIgnited ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Digital RPM & Cockpit Readiness Counter */}
          <div className="flex items-center gap-4 bg-stone-900/80 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400">
                TACHOMETER
              </span>
              <span className="font-mono font-black text-sm text-orange-500">
                <span ref={rpmRef}>0</span> <span className="text-[10px] text-stone-400">RPM</span>
              </span>
            </div>
            <div className="h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                ref={statusRef}
                className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider"
              >
                SYSTEM CALIBRATION
              </span>
            </div>
          </div>
        </div>

        {/* 6. Brand Typography Reveal */}
        <div
          className={`mt-6 text-center space-y-1.5 transition-all duration-700 ${
            isRevving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading">
            MOTORLY
          </h1>
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.4em] text-stone-400 font-semibold">
            ATELIER • PRIVATE FLEET CONCIERGE
          </p>
        </div>

        {/* 7. Bottom Linear Acceleration Progress Line */}
        <div className="w-64 h-1 bg-stone-800/80 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-1000 ease-out"
            style={{
              width:
                phase === "intro"
                  ? "10%"
                  : phase === "tracing"
                  ? "35%"
                  : phase === "ignition"
                  ? "70%"
                  : "100%",
            }}
          />
        </div>
      </div>
    </div>
  )
}
