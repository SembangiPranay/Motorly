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
    "horizon" | "monogram" | "branding" | "hold" | "exit"
  >("horizon")

  // Refs for zero-rerender tachometer and telemetry HUD (guarantees 120fps on Safari WebKit)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Anamorphic Laser Horizon Ignition (0ms - 350ms)
    const t1 = setTimeout(() => {
      setPhase("monogram")
    }, 350)

    // Stage 2: Monogram Medallion Rises & Typography Unveils (350ms - 850ms)
    const t2 = setTimeout(() => {
      setPhase("branding")
    }, 850)

    // Stage 3: Full Atelier Crest & Telemetry at Peak Glory (850ms - 2200ms)
    const t3 = setTimeout(() => {
      setPhase("hold")
    }, 1800)

    // Stage 4: Cinematic Curtain Dissolve (2200ms - 2800ms)
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 2250)

    // Stage 5: Final completion callback
    const t5 = setTimeout(() => {
      onComplete()
    }, 2850)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  // Native requestAnimationFrame Tachometer Counter (Zero React re-renders, 60-120fps on Safari)
  useEffect(() => {
    if (phase === "branding" || phase === "hold" || phase === "exit") {
      let startTimestamp: number | null = null
      const duration = 750
      const startRpm = 0
      const targetRpm = 7600
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        // High-performance sports cam power curve
        const ease = 1 - Math.pow(1 - progress, 4)
        const current = Math.round(startRpm + (targetRpm - startRpm) * ease)

        if (rpmRef.current) {
          rpmRef.current.textContent = current.toLocaleString()
        }
        if (statusRef.current && current >= 6800) {
          statusRef.current.textContent = "FLEET ACTIVE // V12 ENGAGED"
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

  const isHorizon = phase === "horizon"
  const isMonogram = phase !== "horizon"
  const isBranding = phase === "branding" || phase === "hold" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Motorly Brand Entrance"
      className={`fixed inset-0 z-[10000] bg-[#050608] text-white flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
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
      {/* 1. Deep Space Carbon & Amber Atmosphere Radial Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,_var(--tw-gradient-stops))] from-orange-600/15 via-[#08090E] to-[#040507] pointer-events-none" />

      {/* 2. Micro-Precision Swiss Atelier Markings (Clean non-overlapping corners) */}
      <div className="absolute inset-6 pointer-events-none flex flex-col justify-between opacity-30 text-[9px] font-mono tracking-widest text-stone-400">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">+</span>
            <span>MTR-ATELIER // CALIBRE-12</span>
          </div>
          <div className="flex items-center gap-2 pr-28 sm:pr-32">
            <span>FLT-SPEC 4.0</span>
            <span className="text-orange-500 font-bold">+</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">+</span>
            <span>LAT 45.4642° N • LON 9.1900° E</span>
          </div>
          <div className="flex items-center gap-2">
            <span>120 FPS // METAL ENGINE</span>
            <span className="text-orange-500 font-bold">+</span>
          </div>
        </div>
      </div>

      {/* 3. Top Skip Intro Button */}
      <div className="absolute top-6 right-6 z-30">
        <button
          type="button"
          onClick={handleSkip}
          className="group px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/12 backdrop-blur-md text-[11px] font-bold tracking-widest uppercase text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform text-orange-400">→</span>
        </button>
      </div>

      {/* 4. Anamorphic Laser Horizon Line (Cuts Across Viewport) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10 overflow-hidden">
        {/* Full-width Razor Laser Horizon */}
        <div
          className={`h-[1px] w-full bg-gradient-to-r from-transparent via-orange-500/70 to-transparent transition-all duration-1000 ease-out ${
            isHorizon ? "scale-x-100 opacity-95" : "scale-x-90 opacity-35"
          }`}
        />
        {/* Center Optical Anamorphic Diamond Flare */}
        <div
          className={`absolute w-36 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent transition-all duration-700 ${
            isHorizon ? "scale-x-150 opacity-100" : "scale-x-50 opacity-0"
          }`}
        />
        <div
          className={`absolute w-14 h-14 rounded-full bg-orange-500/30 blur-md transition-all duration-700 ${
            isHorizon ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </div>

      {/* 5. Center Hero: The Faceted 3D "M" Medallion & Typographic Climax */}
      <div className="relative flex flex-col items-center justify-center z-20 max-w-2xl px-4">
        {/* Center Ambient Radial Aura */}
        <div
          className={`absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isMonogram
              ? "bg-orange-500/22 scale-110 opacity-100"
              : "bg-orange-500/5 scale-50 opacity-0"
          }`}
        />

        {/* The Sculpted Hexagonal "M" Medallion SVG */}
        <div
          className={`relative transition-all duration-900 cubic-bezier(0.16, 1, 0.3, 1) ${
            isMonogram
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-75 translate-y-6"
          }`}
        >
          <svg
            viewBox="0 0 240 240"
            className="w-40 h-40 sm:w-48 sm:h-48 overflow-visible"
            style={{
              WebkitTransform: "translate3d(0, 0, 0)",
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
            }}
          >
            <defs>
              {/* Outer Bevel Titanium & Platinum Gradient */}
              <linearGradient id="titaniumPlatinum" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#E2E8F0" />
                <stop offset="60%" stopColor="#94A3B8" />
                <stop offset="85%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Inner Medallion Basin Carbon Gradient */}
              <radialGradient id="innerMedallionBasin" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#181B22" />
                <stop offset="60%" stopColor="#0F1116" />
                <stop offset="100%" stopColor="#07080B" />
              </radialGradient>

              {/* Left Facet Cool Platinum Highlight */}
              <linearGradient id="facetPlatinum" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#E2E8F0" />
                <stop offset="75%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Right Facet Warm Champagne Gold & Amber Highlight */}
              <linearGradient id="facetChampagne" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="35%" stopColor="#FDBA74" />
                <stop offset="70%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>

              {/* Central Spine Razor Gold Core */}
              <linearGradient id="spineGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#FED7AA" />
                <stop offset="80%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>

              {/* Specular Diagonal Gleam Gradient */}
              <linearGradient id="gleamSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* Emblem Mask for Specular Sweep */}
              <clipPath id="emblemClip">
                <polygon points="120,24 204,72 204,168 120,216 36,168 36,72" />
              </clipPath>
            </defs>

            {/* Concentric Calibre Rotating Dial Rings */}
            <circle
              cx="120"
              cy="120"
              r="112"
              fill="none"
              stroke="rgba(249, 115, 22, 0.22)"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="safari-wheel-spin"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animationDuration: "20s",
              }}
            />
            <circle
              cx="120"
              cy="120"
              r="104"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="0.8"
            />

            {/* Outer Hexagonal Shield Halo Aura */}
            <polygon
              points="120,20 208,70 208,170 120,220 32,170 32,70"
              fill="none"
              stroke="rgba(249, 115, 22, 0.38)"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Main Outer Hexagonal Shield Body */}
            <polygon
              points="120,24 204,72 204,168 120,216 36,168 36,72"
              fill="url(#innerMedallionBasin)"
              stroke="url(#titaniumPlatinum)"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Inner Precision Recessed Rim */}
            <polygon
              points="120,34 194,77 194,163 120,206 46,163 46,77"
              fill="none"
              stroke="rgba(249, 115, 22, 0.45)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* 6 Precision Micro-Rivets at Hexagon Vertices */}
            <circle cx="120" cy="34" r="2" fill="#FFFFFF" />
            <circle cx="194" cy="77" r="2" fill="#FFFFFF" />
            <circle cx="194" cy="163" r="2" fill="#FFFFFF" />
            <circle cx="120" cy="206" r="2" fill="#FFFFFF" />
            <circle cx="46" cy="163" r="2" fill="#FFFFFF" />
            <circle cx="46" cy="77" r="2" fill="#FFFFFF" />

            {/* THE ARCHITECTURAL "M" LETTERMARK (Dual-Faceted Metallic Architecture) */}
            <g clipPath="url(#emblemClip)">
              {/* Left Pillar (Cool Platinum Facet) */}
              <polygon
                points="68,162 68,76 86,76 86,162"
                fill="url(#facetPlatinum)"
                stroke="#334155"
                strokeWidth="0.8"
              />

              {/* Right Pillar (Warm Champagne Gold Facet) */}
              <polygon
                points="154,76 172,76 172,162 154,162"
                fill="url(#facetChampagne)"
                stroke="#9A3412"
                strokeWidth="0.8"
              />

              {/* Left Downward Diagonal Chevron (Platinum) */}
              <polygon
                points="86,76 120,136 106,144 68,76"
                fill="url(#facetPlatinum)"
              />

              {/* Right Downward Diagonal Chevron (Champagne Gold) */}
              <polygon
                points="172,76 120,136 134,144 172,76"
                fill="url(#facetChampagne)"
              />

              {/* Center Keystone Razor Ridge (Pure Mirror Light) */}
              <line
                x1="120"
                y1="82"
                x2="120"
                y2="136"
                stroke="url(#spineGold)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Specular Catchlight Gleam Across Medallion Face */}
              <rect
                x="-120"
                y="0"
                width="140"
                height="240"
                fill="url(#gleamSweep)"
                className="studio-light-sweep"
                style={{
                  WebkitTransform: "translate3d(0, 0, 0)",
                  transform: "translate3d(0, 0, 0)",
                  animationDuration: "1.8s",
                  animationDelay: "0.2s",
                }}
              />
            </g>
          </svg>
        </div>

        {/* 6. Authority Wordmark & Luxury Typographic Reveal */}
        <div
          className={`mt-5 text-center space-y-1.5 transition-all duration-700 ${
            isBranding ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.45em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading">
            MOTORLY
          </h1>
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.5em] text-stone-400 font-medium">
            ATELIER • PRIVATE FLEET CONCIERGE
          </p>
        </div>

        {/* 7. Precision Atelier Telemetry HUD Tag (Zero React Re-renders) */}
        <div
          className={`mt-4 flex flex-col items-center justify-center transition-all duration-600 ${
            isBranding ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <div className="flex items-center gap-3.5 bg-stone-900/90 border border-white/12 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono font-bold text-stone-400">
                TACHOMETER
              </span>
              <span className="font-mono font-black text-sm text-orange-500">
                <span ref={rpmRef}>0</span>{" "}
                <span className="text-[9px] text-stone-400 font-normal">RPM</span>
              </span>
            </div>
            <div className="h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                ref={statusRef}
                className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest"
              >
                SYSTEM CALIBRATING
              </span>
            </div>
          </div>
        </div>

        {/* 8. Bottom Precision Acceleration Hairline */}
        <div className="w-56 h-[2px] bg-stone-800/80 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-800 ease-out"
            style={{
              width:
                phase === "horizon"
                  ? "20%"
                  : phase === "monogram"
                  ? "55%"
                  : phase === "branding"
                  ? "85%"
                  : "100%",
            }}
          />
        </div>
      </div>
    </div>
  )
}
