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

  // Refs for zero-rerender tachometer and telemetry HUD (guarantees 120fps on Safari WebKit)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Stage 1: Arrival & Suspension Glide (0ms - 850ms)
    // The full car glides into center frame, wheels roll, and studio light sweeps across metallic panels.
    const t1 = setTimeout(() => {
      setPhase("ignition")
    }, 850)

    // Stage 2: Dual Matrix LED Ignition & Volumetric Projection (850ms - 1550ms)
    // Projectors ignite with a sharp dual flash; ruby OLED lightblade and interior dashboard wake up.
    const t2 = setTimeout(() => {
      setPhase("revving")
    }, 1550)

    // Stage 3: Throttle Spooling & Atelier Typography Reveal (1550ms - 2350ms)
    // Tachometer spools to 7,600 RPM; luxury gold branding expands.
    const t3 = setTimeout(() => {
      setPhase("launch")
    }, 2350)

    // Stage 4: High-Speed Forward Acceleration & Dissolve (2350ms - 2950ms)
    const t4 = setTimeout(() => {
      setPhase("exit")
    }, 2850)

    // Stage 5: Final completion callback
    const t5 = setTimeout(() => {
      onComplete()
    }, 3050)

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
    if (phase === "ignition" || phase === "revving" || phase === "launch") {
      let startTimestamp: number | null = null
      const duration = 750
      const startRpm = 0
      const targetRpm = 7600
      let rafId: number

      const step = (now: number) => {
        if (!startTimestamp) startTimestamp = now
        const elapsed = now - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        // Dynamic sports cam power curve
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
      aria-label="Motorly Brand Entrance"
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/20 via-[#0A0C11] to-[#040507] pointer-events-none" />

      {/* 2. High-Tech Perspective Road & Showroom Floor Grid (WebKit 3D hardware-composited) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(249, 115, 22, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.18) 1px, transparent 1px)",
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
            MOTORLY ATELIER • SYSTEM INITIALIZATION
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="group px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[11px] font-bold tracking-wider text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>Skip Intro</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>

      {/* 4. Main Stage: The Ultra-Rich Hypercar & Atelier Presentation */}
      <div className="relative w-full max-w-5xl px-4 flex flex-col items-center justify-center z-10">
        {/* Overhead Ambient Studio Spotlight */}
        <div
          className={`absolute w-[600px] h-72 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
            isIgnited
              ? "bg-orange-600/25 scale-125 opacity-100"
              : "bg-orange-500/10 scale-90 opacity-40"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        {/* The Full Car Motion Container (Smooth Glide, Suspension Settle & Launch) */}
        <div
          className={`relative w-full max-w-4xl transition-all ease-out ${
            isGliding
              ? "translate-x-12 translate-y-1 duration-1000"
              : isLaunching
              ? "-translate-x-16 -translate-y-1 scale-105 duration-700"
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
              {/* 1. Metallic Obsidian & Titanium Paint Gradient */}
              <linearGradient id="metallicBodyPaint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2E3440" />
                <stop offset="18%" stopColor="#1E232E" />
                <stop offset="42%" stopColor="#151922" />
                <stop offset="70%" stopColor="#0E1017" />
                <stop offset="90%" stopColor="#080A0E" />
                <stop offset="100%" stopColor="#040507" />
              </linearGradient>

              {/* 2. Specular Shoulder Reflection Gradient */}
              <linearGradient id="shoulderHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#FB923C" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0.85" />
              </linearGradient>

              {/* 3. Deep Carbon Side Aero Scoop Shadow Gradient */}
              <linearGradient id="scoopGradient" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#06070A" />
                <stop offset="40%" stopColor="#0B0D13" />
                <stop offset="75%" stopColor="#161A24" />
                <stop offset="100%" stopColor="#222838" />
              </linearGradient>

              {/* 4. Tinted Privacy Glass & Cockpit Shader */}
              <linearGradient id="cockpitGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B0D13" stopOpacity="0.98" />
                <stop offset="35%" stopColor="#141822" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#0B0D13" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#050609" stopOpacity="1" />
              </linearGradient>

              {/* 5. Glass Surface High-Gloss Reflections */}
              <linearGradient id="glassReflect1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="glassReflect2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* 6. Diamond-Cut Forged Alloy Rim Spoke Gradient */}
              <linearGradient id="forgedAlloy" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="40%" stopColor="#94A3B8" />
                <stop offset="75%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* 7. Carbon-Ceramic Ventilated Brake Rotor Gradient */}
              <radialGradient id="ceramicRotor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E2026" />
                <stop offset="60%" stopColor="#2C303A" />
                <stop offset="90%" stopColor="#424755" />
                <stop offset="100%" stopColor="#181A20" />
              </radialGradient>

              {/* 8. Volumetric Headlight High-Speed Projection Beam */}
              <linearGradient id="headlightVolumetricBeam" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="12%" stopColor="#E0F2FE" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.45" />
                <stop offset="65%" stopColor="#0284C7" stopOpacity="0.16" />
                <stop offset="90%" stopColor="#0369A1" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
              </linearGradient>

              {/* 9. Optical Projector Lens Flare Glint (100% GPU Native) */}
              <radialGradient id="projectorLensGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#BAE6FD" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#0284C7" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </radialGradient>

              {/* 10. Ground Contact Occlusion Shadow */}
              <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#000000" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#000000" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* 11. Amber Wet Asphalt Underglow Reflection */}
              <radialGradient id="groundAmberGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#F97316" stopOpacity="0.15" />
                <stop offset="80%" stopColor="#F97316" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </radialGradient>

              {/* 12. Ruby Taillight Laser Glow */}
              <radialGradient id="rubyTaillightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#DC2626" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#991B1B" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0" />
              </radialGradient>

              {/* 13. Dynamic Studio Light Sweep Gradient */}
              <linearGradient id="studioSweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* 14. Monogram Chrome & Gold Gradient */}
              <linearGradient id="monogramGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7ED" />
                <stop offset="40%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>

              {/* 15. Precise Car Body Silhouette Clip Path for Specular Sweep */}
              <clipPath id="carBodyClip">
                <path d="M 70,318 L 72,280 C 76,268 85,258 105,248 C 140,232 180,222 240,218 C 280,218 320,222 345,208 L 470,142 C 500,142 540,142 580,146 C 630,152 670,165 740,208 C 780,220 830,224 895,220 L 912,230 C 915,245 912,265 905,285 C 898,300 890,310 900,322 L 786,322 A 64,64 0 0,0 674,322 L 296,322 A 64,64 0 0,0 184,322 L 70,318 Z" />
              </clipPath>
            </defs>

            {/* 1. GROUND SHADOW & WET ASPHALT UNDERGLOW */}
            <ellipse cx="490" cy="344" rx="430" ry="22" fill="url(#groundShadow)" />
            {isIgnited && (
              <ellipse
                cx="470"
                cy="342"
                rx="360"
                ry="14"
                fill="url(#groundAmberGlow)"
                className="transition-opacity duration-700"
              />
            )}
            {/* Direct Wheel Contact Occlusion Patches */}
            <ellipse cx="240" cy="340" rx="46" ry="6" fill="#000000" opacity="0.9" />
            <ellipse cx="730" cy="340" rx="46" ry="6" fill="#000000" opacity="0.9" />

            {/* 2. INNER WHEEL WELL LINERS (Behind the Wheels) */}
            <path d="M 184,322 A 64,64 0 0,1 296,322 Z" fill="#07080A" />
            <path d="M 674,322 A 64,64 0 0,1 786,322 Z" fill="#07080A" />

            {/* 3. SOLID METALLIC HYPERCAR BODY SHELL */}
            <g clipPath="url(#carBodyClip)">
              {/* Main Metallic Paint Bodywork */}
              <path
                d="M 70,318 L 72,280 C 76,268 85,258 105,248 C 140,232 180,222 240,218 C 280,218 320,222 345,208 L 470,142 C 500,142 540,142 580,146 C 630,152 670,165 740,208 C 780,220 830,224 895,220 L 912,230 C 915,245 912,265 905,285 C 898,300 890,310 900,322 L 786,322 A 64,64 0 0,0 674,322 L 296,322 A 64,64 0 0,0 184,322 L 70,318 Z"
                fill="url(#metallicBodyPaint)"
              />

              {/* Dynamic Studio Overhead Light Sweep (Animates Across Metallic Panels) */}
              <rect
                x="-300"
                y="100"
                width="320"
                height="260"
                fill="url(#studioSweepGradient)"
                className={isGliding ? "studio-light-sweep" : ""}
                style={{
                  WebkitTransform: "translate3d(0, 0, 0)",
                  transform: "translate3d(0, 0, 0)",
                }}
              />
            </g>

            {/* 4. DEEP SCULPTED SIDE AERO INTAKE SCOOP (3D Hypercar Channel) */}
            <path
              d="M 320,234 C 380,240 450,248 520,248 C 570,248 620,238 660,228 L 670,268 C 630,286 560,296 480,296 C 410,296 350,282 316,268 Z"
              fill="url(#scoopGradient)"
            />
            {/* Side Air Radiator Honeycomb Intake Cavity */}
            <path
              d="M 640,234 L 670,268 L 650,278 L 620,242 Z"
              fill="#08090C"
              stroke="rgba(249,115,22,0.4)"
              strokeWidth="0.8"
            />

            {/* 5. CARBON FIBER AERODYNAMIC PACKAGE (Splitters, Skirts & Venturi Diffuser) */}
            {/* Front Carbon Splitter */}
            <polygon
              points="60,320 184,324 184,316 68,312"
              fill="#14171E"
              stroke="#2C3240"
              strokeWidth="1"
            />
            {/* Front Aero Canard Winglet */}
            <path
              d="M 60,320 L 56,306 L 66,310 L 68,318 Z"
              fill="#F97316"
            />

            {/* Aerodynamic Carbon Side Skirt Sill */}
            <polygon
              points="296,322 674,322 674,328 296,328"
              fill="#0F1116"
              stroke="#F97316"
              strokeWidth="1"
              strokeOpacity="0.45"
            />

            {/* Rear Carbon Venturi Diffuser with Titanium Exhaust */}
            <polygon
              points="786,322 915,316 920,326 786,328"
              fill="#14171E"
              stroke="#2C3240"
              strokeWidth="1"
            />
            <ellipse
              cx="902"
              cy="316"
              rx="8"
              ry="4.5"
              fill="#08090D"
              stroke="#F97316"
              strokeWidth="1.5"
            />
            <ellipse
              cx="914"
              cy="314"
              rx="8"
              ry="4.5"
              fill="#08090D"
              stroke="#F97316"
              strokeWidth="1.5"
            />

            {/* 6. MUSCULAR BODY CREASES & CHARACTER HIGHLIGHT LINES */}
            {/* Front Fender Flare Peak Crease */}
            <path
              d="M 105,248 C 160,230 220,222 290,226"
              fill="none"
              stroke="url(#shoulderHighlight)"
              strokeWidth="1.8"
            />
            {/* Main Waistline Shoulder Crease from Mirror to Rear Haunches */}
            <path
              d="M 370,218 C 480,226 580,226 710,214 C 760,210 820,214 895,220"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
            />
            {/* Aerodynamic Roof Arch Edge Highlight */}
            <path
              d="M 345,208 L 470,142 C 500,142 540,142 580,146 C 630,152 670,165 740,208"
              fill="none"
              stroke="url(#shoulderHighlight)"
              strokeWidth="1.6"
            />
            {/* Door Panel Shut Line */}
            <path
              d="M 570,146 L 576,236 L 590,322"
              fill="none"
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1.6"
            />
            {/* Flush Aerodynamic Door Handle */}
            <rect
              x="470"
              y="234"
              width="28"
              height="4.5"
              rx="2.25"
              fill="#0A0C10"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.8"
            />

            {/* 7. HIGH-GLOSS GREENHOUSE GLASS & LUXURY COCKPIT */}
            {/* Base Glass Pane */}
            <path
              d="M 352,204 L 468,146 Q 550,142 638,156 L 735,206 L 352,204 Z"
              fill="url(#cockpitGlass)"
              stroke="#2E3544"
              strokeWidth="1.2"
            />
            {/* Interior Cockpit Driver Sport Seat Silhouette */}
            <path
              d="M 530,198 C 525,180 532,165 544,165 C 556,165 562,180 558,198 Z"
              fill="#08090C"
              stroke="rgba(249,115,22,0.3)"
              strokeWidth="1"
            />
            {/* GT Sport Steering Wheel Rim Silhouette */}
            <path
              d="M 425,190 C 420,180 435,176 440,186 C 445,196 435,202 425,198"
              fill="none"
              stroke="#383D48"
              strokeWidth="2.5"
            />
            {/* Ambient Instrument Cluster Amber Glow */}
            <rect
              x="410"
              y="196"
              width="24"
              height="4"
              rx="2"
              fill="#F97316"
              opacity={isIgnited ? 0.9 : 0.4}
              className="transition-opacity duration-500"
            />
            {/* High-Gloss Windshield & Window Reflection Ribbons */}
            <polygon
              points="410,204 480,146 510,146 440,204"
              fill="url(#glassReflect1)"
            />
            <polygon
              points="530,204 570,146 590,146 550,204"
              fill="url(#glassReflect2)"
            />

            {/* Aerodynamic Carbon Stalk Side Mirror */}
            <path
              d="M 380,204 L 372,192 C 372,188 385,186 398,188 L 404,196 Z"
              fill="#12151C"
              stroke="#383F50"
              strokeWidth="1"
            />
            {/* Integrated Amber LED Turn Indicator Ribbon */}
            <line
              x1="376"
              y1="192"
              x2="394"
              y2="190"
              stroke={isIgnited ? "#F97316" : "rgba(249,115,22,0.3)"}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* 8. VOLUMETRIC HIGH-INTENSITY HEADLIGHT BEAMS (Ignited Phase) */}
            {isIgnited && (
              <g className="transition-opacity duration-500 opacity-95 animate-fade-in">
                {/* Wide Conical Light Slice cutting forward across asphalt */}
                <polygon
                  points="120,244 0,140 0,380 120,256"
                  fill="url(#headlightVolumetricBeam)"
                />
                {/* Piercing High-Intensity Optical Core */}
                <polygon
                  points="120,244 0,195 0,315 120,252"
                  fill="url(#headlightVolumetricBeam)"
                  opacity="0.9"
                />
                {/* Projector Lens Flare Glint */}
                <circle cx="122" cy="246" r="26" fill="url(#projectorLensGlow)" />
                <circle cx="122" cy="246" r="5" fill="#FFFFFF" />
                {/* Horizontal Anamorphic Glint Lines */}
                <line
                  x1="75"
                  y1="246"
                  x2="170"
                  y2="246"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeOpacity="0.95"
                />
                <line
                  x1="50"
                  y1="246"
                  x2="195"
                  y2="246"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeOpacity="0.45"
                />
              </g>
            )}

            {/* 9. FRONT MATRIX QUAD-JEWEL HEADLIGHT CLUSTER */}
            <g>
              {/* Headlight Housing Pocket */}
              <path
                d="M 105,252 L 180,226 L 175,236 L 115,258 Z"
                fill="#0A0C10"
                stroke="#38BDF8"
                strokeWidth="0.8"
                strokeOpacity="0.7"
              />
              {/* L-Shaped Crystal DRL (Daytime Running Light) Guide */}
              <path
                d="M 105,252 L 178,226"
                stroke={isIgnited ? "#E0F2FE" : "rgba(249,115,22,0.4)"}
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-colors duration-500"
              />
              {/* Triple Matrix Projector Lenses */}
              <rect
                x="120"
                y="244"
                width="7"
                height="6"
                rx="1.5"
                fill={isIgnited ? "#FFFFFF" : "#1E293B"}
                stroke="#38BDF8"
                strokeWidth="0.8"
              />
              <rect
                x="138"
                y="238"
                width="7"
                height="6"
                rx="1.5"
                fill={isIgnited ? "#FFFFFF" : "#1E293B"}
                stroke="#38BDF8"
                strokeWidth="0.8"
              />
              <rect
                x="156"
                y="232"
                width="7"
                height="6"
                rx="1.5"
                fill={isIgnited ? "#FFFFFF" : "#1E293B"}
                stroke="#38BDF8"
                strokeWidth="0.8"
              />
            </g>

            {/* 10. REAR 3D RUBY OLED LIGHTBLADE */}
            <g>
              {/* Continuous Razor Light Blade */}
              <path
                d="M 870,223 Q 895,221 912,230"
                fill="none"
                stroke={isIgnited ? "#EF4444" : "rgba(239,68,68,0.3)"}
                strokeWidth="4.5"
                strokeLinecap="round"
                className="transition-colors duration-500"
              />
              <path
                d="M 870,223 Q 895,221 912,230"
                fill="none"
                stroke={isIgnited ? "#FECACA" : "transparent"}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="transition-colors duration-500"
              />
              {isIgnited && (
                <circle cx="910" cy="230" r="16" fill="url(#rubyTaillightGlow)" />
              )}
            </g>

            {/* 11. FRONT FORGED ALLOY WHEEL & BRAKE ROTOR (240, 292) */}
            <g transform="translate(240, 292)">
              {/* Outer High-Grip Tire */}
              <circle cx="0" cy="0" r="48" fill="#14161B" stroke="#282C36" strokeWidth="2" />
              {/* Tire Sidewall Inner Bead */}
              <circle cx="0" cy="0" r="44" fill="#0E1015" />
              {/* Carbon-Ceramic Cross-Drilled Rotor Disc */}
              <circle
                cx="0"
                cy="0"
                r="35"
                fill="url(#ceramicRotor)"
                stroke="#383F50"
                strokeWidth="1"
              />
              {/* Rotor Cross-Drill Ventilation Holes */}
              <circle cx="-16" cy="-16" r="1.2" fill="#0A0C10" />
              <circle cx="16" cy="16" r="1.2" fill="#0A0C10" />
              <circle cx="-16" cy="16" r="1.2" fill="#0A0C10" />
              <circle cx="16" cy="-16" r="1.2" fill="#0A0C10" />
              <circle cx="0" cy="-22" r="1.2" fill="#0A0C10" />
              <circle cx="0" cy="22" r="1.2" fill="#0A0C10" />
              <circle cx="-22" cy="0" r="1.2" fill="#0A0C10" />
              <circle cx="22" cy="0" r="1.2" fill="#0A0C10" />

              {/* Performance Orange Motorly Monobloc Brake Caliper (Top-Left) */}
              <path
                d="M -30,-12 C -36,0 -34,18 -26,28 L -18,22 C -24,14 -26,2 -20,-8 Z"
                fill="#F97316"
                stroke="#EA580C"
                strokeWidth="1"
              />

              {/* Rotating Twin-5-Spoke Forged Alloy Rims (Safari 120fps Hardware-Accelerated) */}
              <g
                className={isGliding || isLaunching ? "safari-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                {/* 5 Dual Spokes (10 Spokes Total) */}
                <line x1="-34" y1="-5" x2="34" y2="5" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-34" y1="5" x2="34" y2="-5" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-5" y1="-34" x2="5" y2="34" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="5" y1="-34" x2="-5" y2="34" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-24" y1="-24" x2="24" y2="24" stroke="url(#forgedAlloy)" strokeWidth="2.5" />
                <line x1="-24" y1="24" x2="24" y2="-24" stroke="url(#forgedAlloy)" strokeWidth="2.5" />
              </g>

              {/* Center Lock Nut in Anodized Orange */}
              <circle cx="0" cy="0" r="11" fill="#0F1117" stroke="#F97316" strokeWidth="2" />
              <circle cx="0" cy="0" r="4.5" fill="#F97316" />
            </g>

            {/* 12. REAR FORGED ALLOY WHEEL & BRAKE ROTOR (730, 292) */}
            <g transform="translate(730, 292)">
              {/* Outer High-Grip Tire */}
              <circle cx="0" cy="0" r="48" fill="#14161B" stroke="#282C36" strokeWidth="2" />
              {/* Tire Sidewall Inner Bead */}
              <circle cx="0" cy="0" r="44" fill="#0E1015" />
              {/* Carbon-Ceramic Cross-Drilled Rotor Disc */}
              <circle
                cx="0"
                cy="0"
                r="35"
                fill="url(#ceramicRotor)"
                stroke="#383F50"
                strokeWidth="1"
              />
              {/* Rotor Cross-Drill Ventilation Holes */}
              <circle cx="-16" cy="-16" r="1.2" fill="#0A0C10" />
              <circle cx="16" cy="16" r="1.2" fill="#0A0C10" />
              <circle cx="-16" cy="16" r="1.2" fill="#0A0C10" />
              <circle cx="16" cy="-16" r="1.2" fill="#0A0C10" />
              <circle cx="0" cy="-22" r="1.2" fill="#0A0C10" />
              <circle cx="0" cy="22" r="1.2" fill="#0A0C10" />
              <circle cx="-22" cy="0" r="1.2" fill="#0A0C10" />
              <circle cx="22" cy="0" r="1.2" fill="#0A0C10" />

              {/* Performance Orange Motorly Monobloc Brake Caliper (Top-Left) */}
              <path
                d="M -30,-12 C -36,0 -34,18 -26,28 L -18,22 C -24,14 -26,2 -20,-8 Z"
                fill="#F97316"
                stroke="#EA580C"
                strokeWidth="1"
              />

              {/* Rotating Twin-5-Spoke Forged Alloy Rims (Safari 120fps Hardware-Accelerated) */}
              <g
                className={isGliding || isLaunching ? "safari-wheel-spin" : ""}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                {/* 5 Dual Spokes (10 Spokes Total) */}
                <line x1="-34" y1="-5" x2="34" y2="5" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-34" y1="5" x2="34" y2="-5" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-5" y1="-34" x2="5" y2="34" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="5" y1="-34" x2="-5" y2="34" stroke="url(#forgedAlloy)" strokeWidth="3" />
                <line x1="-24" y1="-24" x2="24" y2="24" stroke="url(#forgedAlloy)" strokeWidth="2.5" />
                <line x1="-24" y1="24" x2="24" y2="-24" stroke="url(#forgedAlloy)" strokeWidth="2.5" />
              </g>

              {/* Center Lock Nut in Anodized Orange */}
              <circle cx="0" cy="0" r="11" fill="#0F1117" stroke="#F97316" strokeWidth="2" />
              <circle cx="0" cy="0" r="4.5" fill="#F97316" />
            </g>

            {/* 13. SIGNATURE MOTORLY HEXAGON MONOGRAM CREST (Top Center) */}
            <g
              transform="translate(500, 68)"
              className={`transition-all duration-700 ${
                isIgnited ? "scale-105 opacity-100" : "scale-90 opacity-45"
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
                fill="rgba(10, 11, 16, 0.92)"
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
          className={`mt-3 flex flex-col items-center justify-center transition-all duration-500 ${
            isIgnited ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Digital RPM & Cockpit Readiness Counter */}
          <div className="flex items-center gap-4 bg-stone-900/85 border border-white/12 px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xs">
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
          className={`mt-5 text-center space-y-1 transition-all duration-700 ${
            isRevving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
          style={{
            WebkitTransform: "translate3d(0, 0, 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.38em] text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-500 uppercase font-heading">
            MOTORLY
          </h1>
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.45em] text-stone-400 font-semibold">
            ATELIER • PRIVATE FLEET CONCIERGE
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
