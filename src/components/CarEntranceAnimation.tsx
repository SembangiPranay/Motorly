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
    "arrival" | "ignition" | "telemetry" | "brand" | "exit"
  >("arrival")

  const rangeRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Arrival & road glide (0ms - 900ms)
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 900)

    // Stage 2: Matrix LED welcome, volumetric beam throw & smoke illumination (900ms - 1900ms)
    const t2 = setTimeout(() => {
      setPhase("telemetry")
    }, 1900)

    // Stage 3: Executive Cockpit Telemetry & Diagnostics (1900ms - 3200ms)
    const t3 = setTimeout(() => {
      setPhase("brand")
    }, 3200)

    // Stage 4: High-speed smooth dissolve transition into showroom (3200ms - 4200ms)
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 4200)

    // Stage 5: Final completion callback
    const t5 = setTimeout(() => {
      onComplete()
    }, 4600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  // Native requestAnimationFrame Diagnostic Calibration Counter (60-120fps, zero React re-renders)
  useEffect(() => {
    if (phase === "telemetry" || phase === "brand") {
      let startTimestamp: number | null = null
      const duration = 1100
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        const currentRange = Math.round(520 + 120 * ease)

        if (rangeRef.current) {
          rangeRef.current.textContent = `${currentRange} KM`
        }
        if (statusRef.current && progress >= 0.8) {
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
  const isIgnited = phase !== "arrival"
  const isTelemetry = phase === "telemetry" || phase === "brand" || phase === "exit"
  const isBrand = phase === "brand" || phase === "exit"
  const isExiting = phase === "exit"

  return (
    <div
      role="banner"
      aria-label="Pit Stop Luxury Executive GT Entrance"
      className={`fixed inset-0 z-[10000] bg-[#040507] text-white flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-102 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        WebkitTransform: "translate3d(0, 0, 0)",
        transform: "translate3d(0, 0, 0)",
        willChange: "transform, opacity",
      }}
    >
      {/* 1. Cinematic Wet Asphalt Road & Atmospheric Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-70 transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/images/entrance/dark_road_smoke.jpg')",
          backgroundPosition: "center bottom",
          filter: "contrast(1.1) brightness(0.9)",
        }}
      />

      {/* 2. Atmospheric Rolling Smoke & Tire Mist Layers */}
      <div
        className="absolute bottom-[22%] -left-[10%] w-[130%] h-64 pointer-events-none filter blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 45% 70%, rgba(249, 115, 22, 0.2), rgba(56, 189, 248, 0.08) 50%, transparent 75%)",
          animation: "driftSmokeA 9s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute bottom-[18%] -right-[10%] w-[130%] h-72 pointer-events-none filter blur-3xl opacity-45"
        style={{
          background:
            "radial-gradient(ellipse at 65% 75%, rgba(255, 255, 255, 0.22), rgba(14, 165, 233, 0.12) 45%, transparent 70%)",
          animation: "driftSmokeB 11s ease-in-out infinite alternate",
        }}
      />

      {/* 3. Deep Cinematic Studio Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 20%, rgba(4,5,7,0.72) 65%, #040507 94%), linear-gradient(to bottom, #040507 0%, transparent 20%, transparent 72%, #040507 100%)",
        }}
      />

      {/* 4. Top Navigation Bar & 1-Click Skip */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
            PIT STOP CAR HIRE • MGARR ATELIER • MALTA
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Enter Fleet Showroom</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </button>
      </div>

      {/* 5. Center Stage: The Hyper-Realistic Luxury Grand Tourer */}
      <div className="relative w-full max-w-5xl px-4 flex flex-col items-center justify-center z-10">
        
        {/* Soft Ambient Horizon Keylight */}
        <div
          className={`absolute w-[780px] h-52 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isIgnited ? "bg-orange-600/15 scale-110 opacity-100" : "bg-orange-500/5 scale-90 opacity-40"
          }`}
        />

        {/* Physical Vehicle Glide & Deceleration Container */}
        <div
          className={`relative w-full max-w-4xl transition-all ease-out ${
            isGliding
              ? "translate-x-14 duration-900"
              : isExiting
              ? "-translate-x-12 scale-102 duration-700 ease-in"
              : "translate-x-0 duration-600"
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Masked Frame ensuring 100% seamless feathering onto wet asphalt */}
          <div
            className="relative w-full"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
              maskComposite: "intersect",
            }}
          >
            {/* The Photorealistic Luxury GT Coupe Asset */}
            <img
              src="/images/entrance/luxury_gt_car.jpg"
              alt="Pit Stop Luxury Grand Tourer"
              className="w-full h-auto block select-none pointer-events-none"
              style={{
                filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.85))",
              }}
            />

            {/* Volumetric Matrix LED Headlight Beam Cone (Originating exactly at the front headlight lens, shooting left) */}
            {isIgnited && (
              <div
                className="absolute pointer-events-none transition-opacity duration-700 w-[240px] sm:w-[480px] h-[120px] sm:h-[210px]"
                style={{
                  top: "43%",
                  right: "91.5%",
                  background:
                    "radial-gradient(ellipse at 100% 32%, rgba(255, 255, 255, 0.98) 0%, rgba(186, 230, 253, 0.82) 20%, rgba(56, 189, 248, 0.35) 50%, rgba(2, 132, 199, 0.08) 80%, transparent 95%)",
                  clipPath: "polygon(100% 32%, 0% 12%, 0% 88%, 100% 48%)",
                  filter: "blur(8px)",
                  mixBlendMode: "screen",
                  animation: "beamPulse 2.4s ease-in-out infinite alternate",
                }}
              />
            )}

            {/* Crystalline Headlight Lens Flare & DRL Diode Core */}
            {isIgnited && (
              <div
                className="absolute pointer-events-none transition-opacity duration-500 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5"
                style={{
                  top: "49%",
                  left: "8%",
                  background: "#ffffff",
                  borderRadius: "50%",
                  boxShadow:
                    "0 0 16px 5px #38bdf8, 0 0 35px 12px #0284c7, 0 0 50px 18px rgba(255,255,255,0.4)",
                }}
              />
            )}

            {/* Wet Asphalt Caustic Light Sheen under Front Bumper */}
            {isIgnited && (
              <div
                className="absolute pointer-events-none transition-opacity duration-700 w-[180px] sm:w-[340px] h-[50px] sm:h-[90px]"
                style={{
                  top: "56%",
                  right: "88%",
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(186, 230, 253, 0.4), rgba(56, 189, 248, 0.18) 40%, rgba(2, 132, 199, 0.05) 70%, transparent 90%)",
                  filter: "blur(14px)",
                  mixBlendMode: "screen",
                }}
              />
            )}

            {/* High-Luminance Ruby OLED Rear Lightbar Flare */}
            {isIgnited && (
              <div
                className="absolute pointer-events-none transition-opacity duration-500 w-1.5 sm:w-2.5 h-2.5 sm:h-3.5"
                style={{
                  top: "42%",
                  right: "5.5%",
                  background: "#ff1e44",
                  borderRadius: "50%",
                  boxShadow:
                    "0 0 18px 6px #ff1e44, 0 0 40px 12px #be123c, 0 0 55px 18px rgba(255,30,68,0.3)",
                }}
              />
            )}
          </div>
        </div>

        {/* 6. Executive Cockpit Telemetry HUD */}
        <div
          className={`mt-4 flex flex-col items-center justify-center transition-all duration-500 ${
            isTelemetry ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 bg-stone-900/85 border border-white/12 px-4 sm:px-6 py-2 rounded-full backdrop-blur-md shadow-2xs font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">CHASSIS:</span>
              <strong className="text-stone-200">AIR LEVEL 0 (GT LOW)</strong>
            </div>

            <div className="hidden sm:block h-3 w-px bg-stone-700" />

            <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-[11px]">
              <span className="text-stone-500">MODE:</span>
              <strong className="text-orange-400 font-bold">GT CRUISE</strong>
            </div>

            <div className="hidden sm:block h-3 w-px bg-stone-700" />

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-500">EST. RANGE:</span>
              <strong ref={rangeRef} className="text-emerald-400 font-bold">640 KM</strong>
            </div>

            <div className="h-3 w-px bg-stone-700" />

            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                ref={statusRef}
                className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
              >
                SYSTEMS INITIALIZED
              </span>
            </div>
          </div>
        </div>

        {/* 7. Prestige Atelier Brand Typography Reveal */}
        <div
          className={`mt-4 text-center space-y-1 transition-all duration-700 ${
            isBrand ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-white via-stone-100 to-orange-500 uppercase font-heading">
            PIT STOP
          </h1>
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.45em] text-stone-400 font-semibold">
            PRESTIGE & EXECUTIVE FLEET • 36 TRIQ IL-KBIRA, MGARR, MALTA
          </p>
        </div>

        {/* 8. Linear Staging Progress Bar */}
        <div className="w-64 h-1 bg-stone-800/80 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white transition-all duration-700 ease-out"
            style={{
              width:
                phase === "arrival"
                  ? "25%"
                  : phase === "ignition"
                  ? "55%"
                  : phase === "telemetry"
                  ? "85%"
                  : "100%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes driftSmokeA {
          0% { transform: translateX(50px) translateY(0px) scale(1); opacity: 0.35; }
          50% { transform: translateX(-30px) translateY(-10px) scale(1.15); opacity: 0.6; }
          100% { transform: translateX(-120px) translateY(4px) scale(1.25); opacity: 0.25; }
        }
        @keyframes driftSmokeB {
          0% { transform: translateX(80px) scale(0.9); opacity: 0.3; }
          50% { transform: translateX(-20px) scale(1.2); opacity: 0.55; }
          100% { transform: translateX(-100px) scale(1.3); opacity: 0.2; }
        }
        @keyframes beamPulse {
          0% { opacity: 0.88; transform: scaleY(0.97); }
          100% { opacity: 1; transform: scaleY(1.03); }
        }
      `}</style>
    </div>
  )
}
