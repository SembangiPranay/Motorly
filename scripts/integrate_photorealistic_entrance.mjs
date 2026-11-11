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
  // Photorealistic 5-Stage Cinematic Sequence (faithfully matching the 9-stage storyboard)
  const [phase, setPhase] = useState<
    "init" | "tracing" | "reveal" | "hero" | "launch" | "exit"
  >("init")

  // Ref for zero-rerender telemetry counter (120 FPS hardware acceleration)
  const rangeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Complete Darkness & Initial Ambiance (0ms - 900ms)
    const t1 = setTimeout(() => {
      setPhase("tracing")
    }, 900)

    // Stage 2: Specular Silhouette Tracing & Light Lines (900ms - 2800ms)
    const t2 = setTimeout(() => {
      setPhase("reveal")
    }, 2800)

    // Stage 3: Liquid Platinum Material & Complete Vehicle Reveal (2800ms - 4800ms)
    const t3 = setTimeout(() => {
      setPhase("hero")
    }, 4800)

    // Stage 4: Brand Hero, Telemetry & Studio Halo (4800ms - 6800ms)
    const t4 = setTimeout(() => {
      setPhase("launch")
    }, 6800)

    // Stage 5: High-Performance GT Smooth Acceleration & Dissolve (6800ms - 7600ms)
    const t5 = setTimeout(() => {
      setPhase("exit")
    }, 7600)

    // Final completion callback (7600ms - 7900ms)
    const t6 = setTimeout(() => {
      onComplete()
    }, 7900)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
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

  const isTracing = phase === "tracing"
  const isRevealed = phase === "reveal" || phase === "hero" || phase === "launch" || phase === "exit"
  const isHero = phase === "hero" || phase === "launch" || phase === "exit"
  const isLaunching = phase === "launch" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire Cinematic Photorealistic Entrance"
      className={\`fixed inset-0 z-[10000] bg-[#000000] text-white flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-hidden select-none transition-all duration-700 ease-out \${
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
      {/* 1. Overhead Ambient Studio Softbox Halo */}
      <div
        className={\`absolute top-[35%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-3xl pointer-events-none transition-all duration-1200 \${
          isHero
            ? "bg-orange-500/22 scale-110 opacity-100"
            : isRevealed
            ? "bg-orange-600/16 scale-100 opacity-75"
            : "bg-orange-950/10 scale-90 opacity-20"
        }\`}
      />

      {/* 2. Top Navigation Bar: Brand Watermark & Skip Intro Button */}
      <div className="relative w-full max-w-6xl flex items-center justify-between z-40 pt-1">
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
          className="group px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/18 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-200 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 3. Center 8K Commercial Studio Vehicle Stage */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center z-20">
        <div
          className={\`relative w-full max-w-4xl aspect-[16/9] flex items-center justify-center transition-all ease-out \${
            isLaunching
              ? "-translate-x-28 scale-105 duration-800"
              : "translate-x-0 scale-100 duration-1000"
          }\`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          {/* Layer A: Photorealistic Specular Silhouette Teaser (Tracing Phase) */}
          <img
            src="/images/entrance/gt_silhouette_teaser.jpg"
            alt="Pit Stop Grand Tourer Specular Silhouette Teaser"
            className={\`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-out pointer-events-none \${
              isTracing ? "opacity-100" : "opacity-0"
            }\`}
            loading="eager"
            decoding="async"
          />

          {/* Layer B: Photorealistic 8K Liquid Platinum Grand Tourer (Complete Reveal Phase) */}
          <img
            src="/images/entrance/gt_full_reveal.jpg"
            alt="Pit Stop Grand Tourer Liquid Platinum Studio Reveal"
            className={\`absolute inset-0 w-full h-full object-contain transition-opacity duration-1200 ease-out pointer-events-none \${
              isRevealed ? "opacity-100" : "opacity-0"
            }\`}
            loading="eager"
            decoding="async"
          />

          {/* Layer C: Overhead Signature PS Hexagon Crest Badge */}
          <div
            className={\`absolute top-[10%] left-1/2 -translate-x-1/2 transition-all duration-800 ease-out z-30 pointer-events-none \${
              isHero ? "scale-105 opacity-100" : "scale-90 opacity-0"
            }\`}
          >
            <svg width="48" height="54" viewBox="-24 -28 48 56">
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
          className={\`mt-2 sm:mt-4 flex flex-col items-center justify-center transition-all duration-700 \${
            isHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }\`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Minimalist Telemetry Diagnostics Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-stone-900/90 border border-white/14 px-4 sm:px-6 py-1.5 rounded-full backdrop-blur-md shadow-2xs font-mono text-[10.5px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
            <span className="text-[#38BDF8] font-bold">AIR LEVEL 0 (GT LOW)</span>
            <span className="text-stone-600">•</span>
            <span className="text-orange-500 font-bold">GT CRUISE</span>
            <span className="text-stone-600">•</span>
            <strong ref={rangeRef} className="text-white font-bold">
              640 KM RANGE
            </strong>
            <span className="text-stone-600">•</span>
            <span className="text-emerald-400 font-bold tracking-wider">
              FLEET READY
            </span>
          </div>

          {/* Hero Brand Title */}
          <h1 className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.36em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading text-center">
            PIT STOP
          </h1>

          {/* Clean Subtitle */}
          <p className="mt-1 text-[10.5px] sm:text-xs font-mono uppercase tracking-[0.42em] text-stone-400 font-semibold text-center">
            PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA
          </p>

          {/* Bottom Linear Acceleration Progress Line */}
          <div className="w-56 sm:w-64 h-1 bg-stone-800/80 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-800 ease-out"
              style={{
                width:
                  phase === "init"
                    ? "10%"
                    : phase === "tracing"
                    ? "35%"
                    : phase === "reveal"
                    ? "65%"
                    : phase === "hero"
                    ? "88%"
                    : "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
`

fs.writeFileSync(filePath, componentCode, "utf-8")
console.log("Successfully wrote photorealistic CarEntranceAnimation.tsx!")
