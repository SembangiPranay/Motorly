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

// Calibrated 100% precision mathematical roofline curve matching master vehicle
const ROOFLINE_PATH =
  "M 100,406 C 105.0,402.7 120.0,392.0 130.0,386.0 C 140.0,380.0 150.0,374.8 160.0,370.0 C 170.0,365.2 180.0,360.8 190.0,357.0 C 200.0,353.2 210.0,350.2 220.0,347.0 C 230.0,343.8 240.0,340.5 250.0,338.0 C 260.0,335.5 270.0,333.7 280.0,332.0 C 290.0,330.3 300.0,329.3 310.0,328.0 C 320.0,326.7 330.0,325.0 340.0,324.0 C 350.0,323.0 360.0,322.8 370.0,322.0 C 380.0,321.2 390.0,319.7 400.0,319.0 C 410.0,318.3 420.0,319.2 430.0,318.0 C 440.0,316.8 450.0,315.8 460.0,312.0 C 470.0,308.2 480.0,300.5 490.0,295.0 C 500.0,289.5 510.0,284.2 520.0,279.0 C 530.0,273.8 540.0,268.8 550.0,264.0 C 560.0,259.2 570.0,254.5 580.0,250.0 C 590.0,245.5 600.0,241.0 610.0,237.0 C 620.0,233.0 630.0,229.2 640.0,226.0 C 650.0,222.8 660.0,220.0 670.0,218.0 C 680.0,216.0 690.0,215.2 700.0,214.0 C 710.0,212.8 720.0,211.8 730.0,211.0 C 740.0,210.2 750.0,209.3 760.0,209.0 C 770.0,208.7 780.0,208.8 790.0,209.0 C 800.0,209.2 810.0,209.7 820.0,210.0 C 830.0,210.3 840.0,210.3 850.0,211.0 C 860.0,211.7 870.0,212.8 880.0,214.0 C 890.0,215.2 900.0,216.7 910.0,218.0 C 920.0,219.3 930.0,220.3 940.0,222.0 C 950.0,223.7 960.0,226.0 970.0,228.0 C 980.0,230.0 990.0,231.5 1000.0,234.0 C 1010.0,236.5 1020.0,240.2 1030.0,243.0 C 1040.0,245.8 1050.0,248.2 1060.0,251.0 C 1070.0,253.8 1080.0,256.8 1090.0,260.0 C 1100.0,263.2 1110.0,266.7 1120.0,270.0 C 1130.0,273.3 1140.0,276.7 1150.0,280.0 C 1160.0,283.3 1170.0,286.8 1180.0,290.0 C 1190.0,293.2 1200.0,295.8 1210.0,299.0 C 1220.0,302.2 1230.0,306.2 1240.0,309.0 C 1250.0,311.8 1261.7,314.3 1270.0,316.0 C 1278.3,317.7 1286.7,318.5 1290.0,319.0"

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  const [phase, setPhase] = useState<EntrancePhase>("init")

  // Zero-rerender callback references
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const onSkipRef = useRef(onSkip)
  onSkipRef.current = onSkip

  const rangeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // 01 INIT: High-speed start (0ms - 60ms)
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 60)

    // 02 FRONT EDGE IGNITION: DRL pulse & blue lens flare (60ms - 200ms)
    const t2 = setTimeout(() => {
      setPhase("tracing")
    }, 200)

    // 03 SILHOUETTE TRACING: Specular laser ribbon sweeps roofline (200ms - 480ms)
    const t3 = setTimeout(() => {
      setPhase("outline")
    }, 480)

    // 04 FULL OUTLINE REVEAL: OLED taillights & rocker ground blade (480ms - 680ms)
    const t4 = setTimeout(() => {
      setPhase("material")
    }, 680)

    // 05 MATERIAL & DETAIL FADE IN: Clearcoat & BMW aero turbine wheels (680ms - 880ms)
    const t5 = setTimeout(() => {
      setPhase("reveal")
    }, 880)

    // 06 COMPLETE VEHICLE REVEAL: 8K studio lighting & wet floor reflection (880ms - 1060ms)
    const t6 = setTimeout(() => {
      setPhase("brand")
    }, 1060)

    // 07 BRAND ELEMENTS APPEAR: PS crest & projector beam throw (1060ms - 1200ms)
    const t7 = setTimeout(() => {
      setPhase("hero")
    }, 1200)

    // 08 BRAND + DETAILS REVEAL: Telemetry HUD pill & PIT STOP branding (1200ms - 1500ms)
    const t8 = setTimeout(() => {
      setPhase("launch")
    }, 1500)

    // 09 FINAL HERO & DISSOLVE: Forward glide & seamless showroom transition (1500ms - 1650ms)
    const t9 = setTimeout(() => {
      setPhase("exit")
    }, 1650)

    // 10 SITE ENTRY: Main application mounted (1.75s total sequence)
    const t10 = setTimeout(() => {
      onCompleteRef.current()
    }, 1750)

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
  }, [])

  // Native requestAnimationFrame Telemetry Counter (Zero React re-render overhead)
  useEffect(() => {
    if (phase === "hero" || phase === "launch" || phase === "exit") {
      let startTimestamp: number | null = null
      const duration = 180
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
      className={`fixed inset-0 z-[10000] bg-[#000000] text-white flex flex-col items-center justify-between p-3 sm:p-6 lg:p-8 overflow-hidden select-none transition-all duration-300 ease-out ${
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
        className={`absolute top-[38%] left-1/2 -translate-x-1/2 w-[1000px] max-w-[120vw] h-[520px] rounded-full pointer-events-none transition-all duration-350 ease-out ${
          isHero
            ? "scale-105 opacity-100"
            : isBrand
            ? "scale-100 opacity-90"
            : isRevealed
            ? "scale-95 opacity-75"
            : isMaterial
            ? "scale-90 opacity-40"
            : isTracing || isOutline
            ? "scale-85 opacity-20"
            : "opacity-0 scale-80"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(249, 115, 22, 0.22) 0%, rgba(234, 88, 12, 0.12) 35%, rgba(15, 23, 42, 0.05) 65%, transparent 85%)",
          filter: "blur(60px)",
        }}
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
              ? "-translate-x-8 sm:-translate-x-24 scale-[1.02] duration-350"
              : "translate-x-0 scale-100 duration-400"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          {/* Master 8K Photorealistic Vehicle Photography (Liquid Metallic GT with BMW Aero Turbine Wheels & Brembo Calipers) */}
          <img
            src="/images/entrance/master_executive_gt.jpg"
            alt="Pit Stop Grand Tourer Liquid Platinum Studio Presentation"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-all ease-out"
            style={{
              filter:
                phase === "init"
                  ? "brightness(0) contrast(200%)"
                  : phase === "ignition"
                  ? "brightness(0.04) contrast(180%)"
                  : phase === "tracing"
                  ? "brightness(0.06) contrast(180%)"
                  : phase === "outline"
                  ? "brightness(0.10) contrast(180%)"
                  : phase === "material"
                  ? "brightness(0.65) contrast(120%)"
                  : "brightness(1) contrast(100%)",
              opacity: phase === "init" ? 0 : 1,
              maskImage:
                "radial-gradient(ellipse 92% 86% at 50% 50%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 92% 86% at 50% 50%, black 70%, transparent 100%)",
              transitionDuration:
                phase === "material" ? "250ms" : phase === "reveal" ? "250ms" : "180ms",
            }}
            loading="eager"
            decoding="async"
          />

          {/* Calibrated Specular Silhouette Tracing SVG Overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-25"
            viewBox="0 0 1376 768"
          >
            <defs>
              {/* Volumetric Headlight Laser Beam Gradient */}
              <linearGradient id="liveVolumetricBeamGrad" x1="100%" y1="35%" x2="0%" y2="65%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="12%" stopColor="#BAE6FD" stopOpacity="0.80" />
                <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.40" />
                <stop offset="75%" stopColor="#0284C7" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
              </linearGradient>

              {/* Wet Tarmac Forward Light Bounce */}
              <radialGradient id="liveTarmacCausticBounce" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#0284C7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* BMW Wheel Circular Rim Clips for Dynamic Forward Rotation */}
              <clipPath id="frontWheelAeroClip">
                <circle cx="0" cy="0" r="77.5" />
              </clipPath>
              <clipPath id="rearWheelAeroClip">
                <circle cx="0" cy="0" r="77.5" />
              </clipPath>
            </defs>

            {/* Volumetric Forward Projector Beam (Storyboard Stages 07 onwards) */}
            <g
              className={`transition-opacity duration-250 ease-out ${
                isBrand ? "opacity-95" : isRevealed ? "opacity-35" : "opacity-0"
              }`}
              style={{ mixBlendMode: "screen" }}
            >
              <polygon
                points="145,490 -160,420 -180,630 115,550"
                fill="url(#liveVolumetricBeamGrad)"
                style={{ filter: "blur(8px)" }}
              />
              <polygon
                points="145,490 -100,450 -120,590 125,535"
                fill="url(#liveVolumetricBeamGrad)"
                opacity="0.6"
                style={{ filter: "blur(4px)" }}
              />
              <line
                x1="145"
                y1="490"
                x2="-140"
                y2="525"
                stroke="#E0F2FE"
                strokeWidth="2.5"
                strokeOpacity="0.85"
              />
              {/* Wet Road Headlight Reflection Pool */}
              <ellipse
                cx="60"
                cy="565"
                rx="140"
                ry="18"
                fill="url(#liveTarmacCausticBounce)"
                opacity="0.85"
              />
            </g>

            {/* Front Headlight Ignition Point (DRL pulse, Storyboard Stage 02) */}
            <circle
              cx="150"
              cy="488"
              r="7"
              fill="#FFFFFF"
              className={`transition-opacity duration-180 ${
                isIgnition ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 12px #FFFFFF) drop-shadow(0 0 24px #38BDF8)",
              }}
            />
            {/* Anamorphic Blue Lens Flare Streak */}
            <line
              x1="60"
              y1="488"
              x2="240"
              y2="488"
              stroke="#38BDF8"
              strokeWidth="2.5"
              className={`transition-opacity duration-180 ${
                isIgnition ? "opacity-90" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 8px #38BDF8)",
              }}
            />

            {/* Specular Roofline Laser Ribbon (Storyboard Stages 03 & 04 - Complete uninterrupted flow) */}
            <path
              d={ROOFLINE_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeDasharray="1250"
              className={`${
                isTracing
                  ? "opacity-95"
                  : isOutline
                  ? "opacity-90"
                  : phase === "material"
                  ? "opacity-40"
                  : "opacity-0"
              }`}
              style={{
                strokeDashoffset:
                  phase === "init" || phase === "ignition"
                    ? "1250"
                    : "0",
                transition:
                  phase === "tracing"
                    ? "stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease-out"
                    : "stroke-dashoffset 150ms ease-out, opacity 150ms ease-out",
                filter: "drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 18px #38BDF8)",
                willChange: "stroke-dashoffset, opacity",
              }}
            />

            {/* Ruby OLED Taillight Flare (Storyboard Stage 04 onwards) */}
            <line
              x1="1245"
              y1="436"
              x2="1285"
              y2="436"
              stroke="#FF1E44"
              strokeWidth="4.5"
              strokeLinecap="round"
              className={`transition-opacity duration-180 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 10px #FF1E44) drop-shadow(0 0 24px #BE123C)",
              }}
            />
            <circle
              cx="1275"
              cy="436"
              r="6"
              fill="#FF1E44"
              className={`transition-opacity duration-180 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 12px #FF1E44)",
              }}
            />

            {/* Front BMW Wheel Aero Rim Outline */}
            <circle
              cx="308"
              cy="472"
              r="78.5"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              className={`transition-opacity duration-180 ${
                isWheelOutline ? "opacity-75" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 6px #38BDF8)",
              }}
            />

            {/* Rear BMW Wheel Aero Rim Outline */}
            <circle
              cx="1074"
              cy="472"
              r="78.5"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              className={`transition-opacity duration-180 ${
                isOutline ? "opacity-75" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 6px #38BDF8)",
              }}
            />

            {/* Front BMW Aero Turbine Wheel with High-Speed Forward Rolling Rotation */}
            <g
              transform="translate(308, 472)"
              className={`transition-opacity duration-250 ${
                isRevealed ? "opacity-100" : isMaterial ? "opacity-60" : "opacity-0"
              }`}
            >
              <g
                style={{
                  transformOrigin: "0px 0px",
                  transform: isLaunching ? "rotate(-540deg)" : "rotate(0deg)",
                  transition: isLaunching
                    ? "transform 350ms cubic-bezier(0.2, 0.8, 0.3, 1)"
                    : "transform 250ms ease-out",
                  willChange: "transform",
                }}
              >
                <image
                  href="/images/entrance/bmw_wheel_disc.png"
                  x="-78.5"
                  y="-78.5"
                  width="157"
                  height="157"
                  clipPath="url(#frontWheelAeroClip)"
                />
              </g>
            </g>

            {/* Rear BMW Aero Turbine Wheel with High-Speed Forward Rolling Rotation */}
            <g
              transform="translate(1074, 472)"
              className={`transition-opacity duration-250 ${
                isRevealed ? "opacity-100" : isMaterial ? "opacity-60" : "opacity-0"
              }`}
            >
              <g
                style={{
                  transformOrigin: "0px 0px",
                  transform: isLaunching ? "rotate(-540deg)" : "rotate(0deg)",
                  transition: isLaunching
                    ? "transform 350ms cubic-bezier(0.2, 0.8, 0.3, 1)"
                    : "transform 250ms ease-out",
                  willChange: "transform",
                }}
              >
                <image
                  href="/images/entrance/bmw_wheel_disc.png"
                  x="-78.5"
                  y="-78.5"
                  width="157"
                  height="157"
                  clipPath="url(#rearWheelAeroClip)"
                />
              </g>
            </g>

            {/* Amber Rocker Panel Ground Blade & Floor Bounce */}
            <line
              x1="395"
              y1="514"
              x2="985"
              y2="514"
              stroke="#F97316"
              strokeWidth="3"
              className={`transition-opacity duration-180 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "drop-shadow(0 0 10px #F97316)",
              }}
            />
            <ellipse
              cx="690"
              cy="528"
              rx="280"
              ry="12"
              fill="rgba(249, 115, 22, 0.45)"
              className={`transition-opacity duration-180 ${
                isPermanentGlow ? "opacity-100" : "opacity-0"
              }`}
              style={{
                filter: "blur(14px)",
              }}
            />
          </svg>

          {/* Overhead PS Hexagon Crest Badge */}
          <div
            className={`absolute top-[4%] sm:top-[6%] left-1/2 -translate-x-1/2 transition-all duration-250 ease-out z-30 pointer-events-none ${
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
          className={`mt-1 sm:mt-3 flex flex-col items-center justify-center transition-all duration-120 ease-out px-2 ${
            isHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
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
              className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-180 ease-out"
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
