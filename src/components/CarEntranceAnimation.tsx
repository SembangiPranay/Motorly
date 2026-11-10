import React, { useState, useEffect } from "react"

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
  const [rpm, setRpm] = useState(0)

  useEffect(() => {
    // Stage 1: Initial laser tracing begins immediately (0ms - 600ms)
    const t1 = setTimeout(() => {
      setPhase("tracing")
    }, 50)

    // Stage 2: Headlights ignite & volumetric light beams slice through (600ms - 1300ms)
    const t2 = setTimeout(() => {
      setPhase("ignition")
    }, 650)

    // Stage 3: RPM revving and brand typography expands (1300ms - 2100ms)
    const t3 = setTimeout(() => {
      setPhase("revving")
    }, 1300)

    // Stage 4: Cinematic forward acceleration and smooth dissolve (2100ms - 2700ms)
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

  // Tachometer digital RPM counter effect during revving
  useEffect(() => {
    if (phase === "ignition" || phase === "revving") {
      let current = 0
      const target = 7600
      const step = 280
      const interval = setInterval(() => {
        current = Math.min(target, current + step)
        setRpm(current)
        if (current >= target) clearInterval(interval)
      }, 30)
      return () => clearInterval(interval)
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
    >
      {/* 1. Deep Space Carbon & Amber Radial Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-950/30 via-[#0A0C11] to-[#050608] pointer-events-none" />

      {/* 2. High-Tech Perspective Road Grid Lines */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            transform: "perspective(300px) rotateX(60deg) translateY(-20px)",
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
        />

        {/* The Sleek Aerodynamic Silhouette SVG Canvas */}
        <div
          className={`relative w-full max-w-2xl transition-all duration-700 ease-out ${
            isExiting ? "scale-110 -translate-y-2" : "scale-100 translate-y-0"
          }`}
        >
          <svg
            viewBox="0 0 800 320"
            className="w-full h-auto overflow-visible filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
          >
            <defs>
              {/* Laser Orange Gradient */}
              <linearGradient id="laserOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
                <stop offset="50%" stopColor="#FB923C" stopOpacity="1" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="1" />
              </linearGradient>

              {/* Headlight Volumetric Beam Gradient */}
              <linearGradient id="headlightBeam" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#0284C7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </linearGradient>

              {/* Alloy Wheel Rim Gradient */}
              <radialGradient id="rimGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#1C1917" stopOpacity="1" />
                <stop offset="100%" stopColor="#0C0A09" stopOpacity="1" />
              </radialGradient>

              {/* Monogram Chrome Gradient */}
              <linearGradient id="monogramGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7ED" />
                <stop offset="40%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>

            {/* VOLUMETRIC HEADLIGHT BEAM RAYS (Ignited Phase) */}
            {isIgnited && (
              <g className="transition-opacity duration-500 opacity-90 animate-fade-in">
                {/* Main Conical Beam cutting left across asphalt */}
                <polygon
                  points="110,215 0,165 0,310 110,230"
                  fill="url(#headlightBeam)"
                  className="blur-xs"
                />
                <polygon
                  points="110,215 0,190 0,270 110,225"
                  fill="url(#headlightBeam)"
                  opacity="0.9"
                />
                {/* Projector Lens Flare Glint */}
                <circle cx="110" cy="216" r="8" fill="#FFFFFF" className="blur-2xs animate-pulse" />
                <circle cx="110" cy="216" r="18" fill="#38BDF8" opacity="0.6" className="blur-xs" />
                <line
                  x1="60"
                  y1="216"
                  x2="160"
                  y2="216"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="blur-2xs opacity-80"
                />
              </g>
            )}

            {/* GROUND SHADOW & WET REFLECTION */}
            <ellipse
              cx="400"
              cy="275"
              rx="340"
              ry="22"
              fill="rgba(0,0,0,0.9)"
              className="blur-md"
            />
            {isIgnited && (
              <ellipse
                cx="380"
                cy="270"
                rx="280"
                ry="12"
                fill="rgba(249,115,22,0.18)"
                className="blur-sm animate-pulse"
              />
            )}

            {/* TAILLIGHT NEON RED DIFFUSER GLOW */}
            {isIgnited && (
              <g className="animate-fade-in">
                <circle cx="718" cy="208" r="6" fill="#EF4444" className="blur-2xs" />
                <line
                  x1="700"
                  y1="208"
                  x2="735"
                  y2="208"
                  stroke="#EF4444"
                  strokeWidth="3"
                  className="blur-xs opacity-90"
                />
              </g>
            )}

            {/* CAR SILHOUETTE VECTOR PATHS */}
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
                style={{
                  strokeDasharray: 900,
                  strokeDashoffset: phase === "intro" ? 900 : 0,
                  transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />

              {/* 2. Cabin Glass Greenhouse Contour */}
              <path
                d="M 285,178 C 330,145 385,140 440,140 C 490,140 525,155 550,178 Z"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="1.8"
                style={{
                  strokeDasharray: 450,
                  strokeDashoffset: phase === "intro" ? 450 : 0,
                  transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                }}
              />

              {/* 3. Aerodynamic Side Skirt & Lower Chassis */}
              <path
                d="M 85,235 L 140,235 M 240,235 L 565,235 M 665,235 L 720,235"
                stroke="url(#laserOrange)"
                strokeWidth="3.2"
                style={{
                  strokeDasharray: 500,
                  strokeDashoffset: phase === "intro" ? 500 : 0,
                  transition: "stroke-dashoffset 0.8s ease-out 0.1s",
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

              {/* 6. Sculpted Side Aero Air Intake Intake S-Duct */}
              <path
                d="M 275,190 C 340,195 430,205 520,190 C 538,187 555,215 565,230"
                stroke="rgba(249, 115, 22, 0.7)"
                strokeWidth="1.8"
                style={{
                  strokeDasharray: 350,
                  strokeDashoffset: phase === "intro" ? 350 : 0,
                  transition: "stroke-dashoffset 0.8s ease-out 0.3s",
                }}
              />

              {/* 7. Front Razor LED Headlight Slash */}
              <path
                d="M 105,218 Q 150,208 178,202"
                stroke={isIgnited ? "#38BDF8" : "#F97316"}
                strokeWidth={isIgnited ? "3.5" : "2"}
                className={isIgnited ? "filter drop-shadow-[0_0_8px_#38BDF8]" : ""}
              />

              {/* 8. Rear Ruby Neon Lightbar */}
              <path
                d="M 685,206 Q 715,208 720,218"
                stroke={isIgnited ? "#EF4444" : "#F97316"}
                strokeWidth={isIgnited ? "3.5" : "2"}
                className={isIgnited ? "filter drop-shadow-[0_0_8px_#EF4444]" : ""}
              />
            </g>

            {/* FRONT WHEEL & ALLOY ROTOR (Animated Spin) */}
            <g transform="translate(190, 235)">
              <circle cx="0" cy="0" r="44" fill="#0C0A09" stroke="#332B25" strokeWidth="2" />
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="none"
                stroke="#F97316"
                strokeWidth="2"
                strokeDasharray="12 8"
                className={isIgnited ? "animate-spin" : ""}
                style={{ animationDuration: "1.2s" }}
              />
              <circle cx="0" cy="0" r="14" fill="#1C1917" stroke="#F97316" strokeWidth="2.5" />
            </g>

            {/* REAR WHEEL & ALLOY ROTOR (Animated Spin) */}
            <g transform="translate(615, 235)">
              <circle cx="0" cy="0" r="44" fill="#0C0A09" stroke="#332B25" strokeWidth="2" />
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="none"
                stroke="#F97316"
                strokeWidth="2"
                strokeDasharray="12 8"
                className={isIgnited ? "animate-spin" : ""}
                style={{ animationDuration: "1.2s" }}
              />
              <circle cx="0" cy="0" r="14" fill="#1C1917" stroke="#F97316" strokeWidth="2.5" />
            </g>

            {/* 9. SIGNATURE "M" MONOGRAM (Center Top Emblem) */}
            <g
              transform="translate(400, 65)"
              className={`transition-all duration-700 ${
                isIgnited ? "scale-105 opacity-100" : "scale-90 opacity-40"
              }`}
            >
              {/* Outer Glowing Hex Ring */}
              <polygon
                points="0,-36 32,-18 32,18 0,36 -32,18 -32,-18"
                fill="rgba(10, 11, 16, 0.85)"
                stroke="url(#monogramGold)"
                strokeWidth="2.2"
                className="filter drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]"
              />
              {/* Geometric Precision "M" Lettermark */}
              <path
                d="M -18,16 L -18,-12 L 0,6 L 18,-12 L 18,16"
                fill="none"
                stroke="url(#monogramGold)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="filter drop-shadow-[0_0_6px_#F97316]"
              />
            </g>
          </svg>
        </div>

        {/* 5. Center High-Tech HUD & Tachometer Gauge (During Ignition / Revving) */}
        <div
          className={`mt-4 flex flex-col items-center justify-center transition-all duration-500 ${
            isIgnited ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Digital RPM & Cockpit Readiness Counter */}
          <div className="flex items-center gap-4 bg-stone-900/80 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400">
                TACHOMETER
              </span>
              <span className="font-mono font-black text-sm text-orange-500">
                {rpm.toLocaleString()} <span className="text-[10px] text-stone-400">RPM</span>
              </span>
            </div>
            <div className="h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {rpm >= 7000 ? "V12 TWIN-TURBO ENGAGED" : "SYSTEM CALIBRATION"}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Brand Typography Reveal */}
        <div
          className={`mt-6 text-center space-y-1.5 transition-all duration-700 ${
            isRevving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading drop-shadow-[0_4px_16px_rgba(249,115,22,0.4)]">
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
              width: phase === "intro" ? "10%" : phase === "tracing" ? "35%" : phase === "ignition" ? "70%" : "100%",
            }}
          />
        </div>
      </div>
    </div>
  )
}
