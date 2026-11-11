import React, { useState, useEffect, useRef } from "react"

interface CarEntranceAnimationProps {
  onComplete: () => void
  onSkip?: () => void
}

type EntrancePhase =
  | "init"       // 01 INIT - COMPLETE DARKNESS
  | "ignition"   // 02 FRONT EDGE IGNITION
  | "tracing"    // 03 SILHOUETTE TRACING
  | "outline"    // 04 FULL OUTLINE REVEAL
  | "material"   // 05 MATERIAL & DETAIL FADE IN
  | "reveal"     // 06 COMPLETE VEHICLE REVEAL
  | "brand"      // 07 BRAND ELEMENTS APPEAR
  | "hero"       // 08 BRAND + DETAILS REVEAL
  | "launch"     // 09 FINAL HERO (TRANSITION TO SITE)
  | "exit"       // DISSOLVE INTO SHOWROOM

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  const [phase, setPhase] = useState<EntrancePhase>("init")

  // Refs for zero-rerender callbacks and telemetry (120 FPS hardware acceleration)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const onSkipRef = useRef(onSkip)
  onSkipRef.current = onSkip

  const rangeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // 01 INIT: Complete darkness (0ms - 700ms)
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 700)

    // 02 FRONT EDGE IGNITION: Nose & DRL flare (700ms - 1700ms)
    const t2 = setTimeout(() => {
      setPhase("tracing")
    }, 1700)

    // 03 SILHOUETTE TRACING: Specular laser ribbon climbs roofline (1700ms - 3300ms)
    const t3 = setTimeout(() => {
      setPhase("outline")
    }, 3300)

    // 04 FULL OUTLINE REVEAL: Taillight & underglow ignite (3300ms - 4500ms)
    const t4 = setTimeout(() => {
      setPhase("material")
    }, 4500)

    // 05 MATERIAL & DETAIL FADE IN: Clearcoat & aero turbine wheels emerge (4500ms - 5700ms)
    const t5 = setTimeout(() => {
      setPhase("reveal")
    }, 5700)

    // 06 COMPLETE VEHICLE REVEAL: 8K studio lighting & wet floor reflection (5700ms - 6900ms)
    const t6 = setTimeout(() => {
      setPhase("brand")
    }, 6900)

    // 07 BRAND ELEMENTS APPEAR: PS crest, headlight beam throw, amber halo (6900ms - 8100ms)
    const t7 = setTimeout(() => {
      setPhase("hero")
    }, 8100)

    // 08 BRAND + DETAILS REVEAL: Clean telemetry HUD pill, PIT STOP typography (8100ms - 9500ms)
    const t8 = setTimeout(() => {
      setPhase("launch")
    }, 9500)

    // 09 FINAL HERO & DISSOLVE: Forward glide & seamless showroom transition (9500ms - 10300ms)
    const t9 = setTimeout(() => {
      setPhase("exit")
    }, 10300)

    // 10 SITE ENTRY: Main application mounted (10600ms)
    const t10 = setTimeout(() => {
      onCompleteRef.current()
    }, 10600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
      clearTimeout(t7)
      clearTimeout(t8)
      clearTimeout(t9)
      clearTimeout(t10)
    }
  }, []) // Runs once on mount, immune to parent component re-renders

  // Native requestAnimationFrame Telemetry Counter (Zero React re-render overhead)
  useEffect(() => {
    if (phase === "hero" || phase === "launch" || phase === "exit") {
      let startTimestamp: number | null = null
      const duration = 900
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
          rangeRef.current.textContent = `${current} KM RANGE`
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
    if (onSkipRef.current) onSkipRef.current()
    else onCompleteRef.current()
  }

  // Visual state flags based on the 9-stage storyboard choreography
  const isIgnition = phase === "ignition" || phase === "tracing" || phase === "outline"
  const isTracing = phase === "tracing"
  const isOutline = phase === "outline"
  const isWheelOutline = phase === "tracing" || phase === "outline"
  const isPermanentGlow =
    phase === "outline" ||
    phase === "material" ||
    phase === "reveal" ||
    phase === "brand" ||
    phase === "hero" ||
    phase === "launch" ||
    phase === "exit"
  const isMaterial = phase === "material"
  const isRevealed =
    phase === "reveal" ||
    phase === "brand" ||
    phase === "hero" ||
    phase === "launch" ||
    phase === "exit"
  const isBrand =
    phase === "brand" ||
    phase === "hero" ||
    phase === "launch" ||
    phase === "exit"
  const isHero = phase === "hero" || phase === "launch" || phase === "exit"
  const isLaunching = phase === "launch" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire Cinematic Photorealistic Entrance"
      className={`fixed inset-0 z-[10000] bg-[#000000] text-white flex flex-col items-center justify-between p-3 sm:p-6 lg:p-8 overflow-hidden select-none transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-102 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        WebkitTransform: "translate3d(0, 0, 0)",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity",
      }}
    >
      {/* 1. Overhead Ambient Studio Softbox Halo */}
      <div
        className={`absolute top-[36%] left-1/2 -translate-x-1/2 w-[950px] max-w-[120vw] h-[480px] rounded-full blur-3xl pointer-events-none transition-all duration-1200 ${
          isHero
            ? "bg-orange-500/22 scale-110 opacity-100"
            : isBrand
            ? "bg-orange-500/18 scale-100 opacity-90"
            : isRevealed
            ? "bg-orange-600/14 scale-95 opacity-75"
            : isMaterial
            ? "bg-orange-950/20 scale-90 opacity-40"
            : isTracing || isOutline
            ? "bg-orange-950/10 scale-85 opacity-20"
            : "opacity-0 scale-80"
        }`}
      />

      {/* 2. Top Navigation Bar: Brand Watermark & Skip Intro Button */}
      <div className="relative w-full max-w-6xl flex items-center justify-between z-40 pt-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#F97316]" />
          <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold tracking-widest text-stone-300">
            PIT STOP CAR HIRE <span className="hidden sm:inline text-orange-500/80">•</span>{" "}
            <span className="hidden sm:inline text-stone-400">PRESTIGE & EXECUTIVE FLEET</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/18 backdrop-blur-md text-[10px] sm:text-[11px] font-bold tracking-wider text-stone-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 sm:gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 3. Center 8K Commercial Studio Vehicle Stage */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center z-20">
        <div
          className={`relative w-full max-w-4xl aspect-[1376/768] flex items-center justify-center transition-all ease-out ${
            isLaunching
              ? "-translate-x-16 sm:-translate-x-24 scale-[1.02] duration-800"
              : "translate-x-0 scale-100 duration-1000"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          {/* Master 8K Photorealistic Vehicle Photography (Liquid Platinum GT with BMW Aero Turbine Wheels & Brembo Calipers) */}
          <img
            src="/images/entrance/gt_full_reveal.jpg"
            alt="Pit Stop Grand Tourer Liquid Platinum Studio Presentation"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-all ease-out"
            style={{
              filter:
                phase === "init"
                  ? "brightness(0) contrast(200%)"
                  : phase === "ignition"
                  ? "brightness(0.03) contrast(180%)"
                  : phase === "tracing"
                  ? "brightness(0.04) contrast(180%)"
                  : phase === "outline"
                  ? "brightness(0.05) contrast(180%)"
                  : phase === "material"
                  ? "brightness(0.55) contrast(120%)"
                  : "brightness(1) contrast(100%)",
              opacity: phase === "init" ? 0 : 1,
              transitionDuration:
                phase === "material" ? "1200ms" : phase === "reveal" ? "1200ms" : "700ms",
            }}
            loading="eager"
            decoding="async"
          />

          {/* Volumetric Headlight Beam Throw */}
          <div
            className={`absolute top-[42%] -left-[14%] sm:-left-[18%] w-[320px] sm:w-[420px] h-[120px] sm:h-[160px] pointer-events-none mix-blend-screen transition-opacity duration-1000 z-22 ${
              isBrand ? "opacity-90" : isRevealed ? "opacity-35" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(ellipse at 100% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(186, 230, 253, 0.7) 20%, rgba(56, 189, 248, 0.3) 50%, rgba(2, 132, 199, 0.05) 80%, transparent 95%)",
              clipPath: "polygon(100% 48%, 0% 15%, 0% 85%, 100% 55%)",
              filter: "blur(10px)",
            }}
          />

          {/* Calibrated Specular Silhouette Tracing SVG Overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-25"
            viewBox="0 0 1376 768"
          >
            {/* Front Headlight Ignition Point (DRL pulse) */}
            <circle
              cx="165"
              cy="370"
              r="7"
              fill="#FFFFFF"
              className={`transition-opacity duration-500 ${
                isIgnition ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 12px #FFFFFF) drop-shadow(0 0 24px #38BDF8)",
              }}
            />

            {/* Specular Roofline Laser Ribbon (Storyboard Stages 03 & 04) */}
            <path
              d="M 115,395 
                 C 135,380 160,370 210,360 
                 C 280,348 350,345 430,340 
                 C 490,336 530,320 580,280 
                 C 630,248 680,238 745,236 
                 C 810,235 880,242 950,268 
                 C 1010,290 1060,320 1110,345 
                 C 1150,368 1185,395 1220,416"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeDasharray="1400"
              strokeDashoffset={
                phase === "init" || phase === "ignition"
                  ? "1400"
                  : phase === "tracing"
                  ? "400"
                  : "0"
              }
              className={`transition-all duration-1200 ease-out ${
                isTracing
                  ? "opacity-95"
                  : isOutline
                  ? "opacity-90"
                  : phase === "material"
                  ? "opacity-40"
                  : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 18px #38BDF8)",
                willChange: "stroke-dashoffset, opacity",
              }}
            />

            {/* Ruby OLED Taillight Flare (Storyboard Stage 04 onwards) */}
            <circle
              cx="1220"
              cy="416"
              r="7"
              fill="#FF1E44"
              className={`transition-opacity duration-500 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 10px #FF1E44) drop-shadow(0 0 24px #BE123C)",
              }}
            />

            {/* Front Wheel Aero Rim Outline */}
            <circle
              cx="316"
              cy="490"
              r="75"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              className={`transition-opacity duration-600 ${
                isWheelOutline ? "opacity-75" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 6px #38BDF8)",
              }}
            />

            {/* Rear Wheel Aero Rim Outline */}
            <circle
              cx="1035"
              cy="490"
              r="75"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              className={`transition-opacity duration-600 ${
                isOutline ? "opacity-75" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 6px #38BDF8)",
              }}
            />

            {/* Amber Rocker Panel Underglow Line */}
            <line
              x1="440"
              y1="548"
              x2="925"
              y2="548"
              stroke="#F97316"
              strokeWidth="3.5"
              className={`transition-opacity duration-600 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 10px #F97316)",
              }}
            />
          </svg>

          {/* Overhead PS Hexagon Crest Badge */}
          <div
            className={`absolute top-[4%] sm:top-[6%] left-1/2 -translate-x-1/2 transition-all duration-800 ease-out z-30 pointer-events-none ${
              isBrand ? "scale-100 opacity-100" : "scale-85 opacity-0"
            }`}
          >
            <svg width="44" height="50" viewBox="-24 -28 48 56">
              <polygon
                points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13"
                fill="none"
                stroke="#F97316"
                strokeWidth="5"
                strokeOpacity="0.3"
              />
              <polygon
                points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13"
                fill="rgba(10, 13, 20, 0.95)"
                stroke="#F97316"
                strokeWidth="2"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="14"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                PS
              </text>
            </svg>
          </div>
        </div>

        {/* 4. Clean, High-End Storyboard End-Screen Reveal */}
        <div
          className={`mt-1 sm:mt-3 flex flex-col items-center justify-center transition-all duration-700 px-2 ${
            isHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Minimalist Telemetry Diagnostics Pill */}
          <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-2.5 bg-stone-900/90 border border-white/14 px-3 sm:px-6 py-1.5 rounded-full backdrop-blur-md shadow-2xs font-mono text-[9px] sm:text-xs">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="text-[#38BDF8] font-bold whitespace-nowrap">AIR LEVEL 0 (GT LOW)</span>
            <span className="text-stone-600">•</span>
            <span className="text-orange-500 font-bold whitespace-nowrap">GT CRUISE</span>
            <span className="text-stone-600">•</span>
            <strong ref={rangeRef} className="text-white font-bold whitespace-nowrap">
              640 KM RANGE
            </strong>
            <span className="text-stone-600">•</span>
            <span className="text-emerald-400 font-bold tracking-wider whitespace-nowrap">
              FLEET READY
            </span>
          </div>

          {/* Hero Brand Title */}
          <h1 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-black tracking-[0.24em] sm:tracking-[0.36em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading text-center whitespace-nowrap">
            PIT STOP
          </h1>

          {/* Clean Subtitle */}
          <p className="mt-0.5 text-[8.5px] sm:text-xs font-mono uppercase tracking-[0.2em] sm:tracking-[0.42em] text-stone-400 font-semibold text-center whitespace-nowrap">
            PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA
          </p>

          {/* Bottom Linear Acceleration Progress Line */}
          <div className="w-48 sm:w-64 h-1 bg-stone-800/80 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-800 ease-out"
              style={{
                width:
                  phase === "init"
                    ? "10%"
                    : phase === "ignition"
                    ? "25%"
                    : phase === "tracing"
                    ? "40%"
                    : phase === "outline"
                    ? "55%"
                    : phase === "material"
                    ? "70%"
                    : phase === "reveal"
                    ? "82%"
                    : phase === "brand"
                    ? "90%"
                    : phase === "hero"
                    ? "96%"
                    : "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
