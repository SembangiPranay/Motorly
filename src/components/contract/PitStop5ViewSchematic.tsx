import React, { useState } from "react"

export interface ConditionPin {
  id: string
  view: "front" | "rear" | "driver" | "passenger" | "aerial"
  viewLabel: string
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  note: string
}

interface PitStop5ViewSchematicProps {
  pins: ConditionPin[]
  onAddPin?: (pin: ConditionPin) => void
  onRemovePin?: (id: string) => void
  readOnly?: boolean
}

export default function PitStop5ViewSchematic({
  pins,
  onAddPin,
  onRemovePin,
  readOnly = false,
}: PitStop5ViewSchematicProps) {
  const [activePinPrompt, setActivePinPrompt] = useState<{
    view: "front" | "rear" | "driver" | "passenger" | "aerial"
    viewLabel: string
    x: number
    y: number
  } | null>(null)
  const [promptNote, setPromptNote] = useState("")

  const handleViewClick = (
    e: React.MouseEvent<HTMLDivElement>,
    view: "front" | "rear" | "driver" | "passenger" | "aerial",
    viewLabel: string
  ) => {
    if (readOnly || !onAddPin) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setActivePinPrompt({ view, viewLabel, x, y })
    setPromptNote(`Minor mark on ${viewLabel}`)
  }

  const handleSavePin = () => {
    if (!activePinPrompt || !onAddPin) return
    const newPin: ConditionPin = {
      id: "pin-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      view: activePinPrompt.view,
      viewLabel: activePinPrompt.viewLabel,
      x: activePinPrompt.x,
      y: activePinPrompt.y,
      note: promptNote.trim() || `Mark on ${activePinPrompt.viewLabel}`,
    }
    onAddPin(newPin)
    setActivePinPrompt(null)
    setPromptNote("")
  }

  return (
    <div className="space-y-4">
      {/* 5-View Technical Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
        {/* VIEW 1: FRONT VIEW */}
        <div className="border border-stone-200/70 rounded-xl p-3 bg-stone-50/50 flex flex-col items-center relative group">
          <div className="w-full flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              1. Front View (Headlights &amp; Bumper)
            </span>
            {!readOnly && (
              <span className="text-[9px] font-mono text-stone-400 group-hover:text-orange-600 transition">
                Tap to pin mark
              </span>
            )}
          </div>
          <div
            onClick={(e) => handleViewClick(e, "front", "Front View")}
            className={`w-full max-w-[210px] aspect-[4/3] relative flex items-center justify-center ${
              !readOnly ? "cursor-crosshair" : ""
            }`}
          >
            <svg
              viewBox="0 0 200 150"
              className="w-full h-full text-stone-900 select-none pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Roof & Windshield */}
              <path d="M 46 62 L 62 18 L 138 18 L 154 62 Z" fill="#F4F4F5" />
              <line x1="62" y1="18" x2="62" y2="62" stroke="#D4D4D8" strokeWidth="1" />
              <line x1="138" y1="18" x2="138" y2="62" stroke="#D4D4D8" strokeWidth="1" />

              {/* Hood & Main Body Contour */}
              <path
                d="M 28 62 C 28 62 55 58 100 58 C 145 58 172 62 172 62 C 182 62 188 72 188 88 L 188 116 C 188 122 182 126 176 126 L 160 126 C 156 126 156 118 156 118 L 44 118 C 44 118 44 126 40 126 L 24 126 C 18 126 12 122 12 116 L 12 88 C 12 72 18 62 28 62 Z"
                fill="#FFFFFF"
              />

              {/* Headlights (Authentic Maltese Hatchback Contours) */}
              <path d="M 24 72 L 52 72 C 48 88 44 92 22 86 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
              <circle cx="36" cy="80" r="5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />
              <path d="M 176 72 L 148 72 C 152 88 156 92 178 86 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
              <circle cx="164" cy="80" r="5" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1" />

              {/* Upper Grille with Pit Stop Logo Notch */}
              <path d="M 64 74 L 136 74 C 132 82 124 85 100 85 C 76 85 68 82 64 74 Z" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.2" />

              {/* Lower Bumper Air Dam & Fog Lights */}
              <rect x="52" y="98" width="96" height="16" rx="3" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.2" />
              <line x1="72" y1="98" x2="72" y2="114" stroke="#A1A1AA" strokeWidth="1" />
              <line x1="100" y1="98" x2="100" y2="114" stroke="#A1A1AA" strokeWidth="1" />
              <line x1="128" y1="98" x2="128" y2="114" stroke="#A1A1AA" strokeWidth="1" />
              <rect x="26" y="100" width="16" height="8" rx="2" fill="#FAFAFA" stroke="#71717A" strokeWidth="1" />
              <rect x="158" y="100" width="16" height="8" rx="2" fill="#FAFAFA" stroke="#71717A" strokeWidth="1" />

              {/* Malta Registration Plate */}
              <rect x="74" y="87" width="52" height="12" rx="2" fill="#FFFFFF" stroke="#18181B" strokeWidth="1" />
              <text x="100" y="96" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" fill="#000" stroke="none">PIT STOP</text>

              {/* Side Mirrors */}
              <path d="M 44 64 L 22 56 L 22 68 Z" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.2" />
              <path d="M 156 64 L 178 56 L 178 68 Z" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.2" />

              {/* Wheels */}
              <rect x="18" y="112" width="18" height="24" rx="4" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
              <rect x="164" y="112" width="18" height="24" rx="4" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
            </svg>

            {/* Render Pins on Front View */}
            {pins
              .filter((p) => p.view === "front")
              .map((p, idx) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                  title={p.note}
                >
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white animate-bounce-subtle">
                    {pins.indexOf(p) + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* VIEW 2: PASSENGER SIDE PROFILE (Facing Left) */}
        <div className="border border-stone-200/70 rounded-xl p-3 bg-stone-50/50 flex flex-col items-center relative group">
          <div className="w-full flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              2. Passenger Side Profile
            </span>
            {!readOnly && (
              <span className="text-[9px] font-mono text-stone-400 group-hover:text-orange-600 transition">
                Tap to pin mark
              </span>
            )}
          </div>
          <div
            onClick={(e) => handleViewClick(e, "passenger", "Passenger Side Profile")}
            className={`w-full aspect-[2/1] relative flex items-center justify-center ${
              !readOnly ? "cursor-crosshair" : ""
            }`}
          >
            <svg
              viewBox="0 0 280 130"
              className="w-full h-full text-stone-900 select-none pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Silhouette facing left */}
              <path
                d="M 265 92 L 245 92 C 240 70 215 70 210 92 L 95 92 C 90 70 65 70 60 92 L 20 92 C 12 92 8 85 8 76 C 8 68 18 64 36 60 L 80 54 L 125 24 L 205 24 L 245 42 L 260 52 C 270 56 272 65 272 74 C 272 85 270 92 265 92 Z"
                fill="#FFFFFF"
              />
              {/* Windows */}
              <path d="M 88 52 L 128 28 L 165 28 L 165 52 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />
              <path d="M 172 28 L 202 28 L 235 46 L 240 52 L 172 52 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />
              {/* Door Seams */}
              <line x1="168" y1="28" x2="168" y2="88" stroke="#A1A1AA" strokeWidth="1.2" />
              <line x1="94" y1="52" x2="94" y2="88" stroke="#A1A1AA" strokeWidth="1.2" />
              {/* Handles */}
              <rect x="144" y="56" width="12" height="3" rx="1.5" fill="#18181B" stroke="none" />
              <rect x="180" y="56" width="12" height="3" rx="1.5" fill="#18181B" stroke="none" />
              {/* Front & Rear Wheels (Alloy Styling) */}
              <circle cx="78" cy="92" r="22" fill="#27272A" stroke="#18181B" strokeWidth="2" />
              <circle cx="78" cy="92" r="12" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
              <circle cx="78" cy="92" r="4" fill="#18181B" stroke="none" />
              <circle cx="228" cy="92" r="22" fill="#27272A" stroke="#18181B" strokeWidth="2" />
              <circle cx="228" cy="92" r="12" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
              <circle cx="228" cy="92" r="4" fill="#18181B" stroke="none" />
              {/* Front Lamp Wrap */}
              <path d="M 12 74 L 28 66 L 36 78 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
              {/* Rear Lamp Wrap */}
              <path d="M 268 64 L 255 64 L 258 76 L 268 74 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
            </svg>

            {pins
              .filter((p) => p.view === "passenger")
              .map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                  title={p.note}
                >
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white animate-bounce-subtle">
                    {pins.indexOf(p) + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* VIEW 3: REAR VIEW */}
        <div className="border border-stone-200/70 rounded-xl p-3 bg-stone-50/50 flex flex-col items-center relative group">
          <div className="w-full flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              3. Rear View (Boot, Glass &amp; Lights)
            </span>
            {!readOnly && (
              <span className="text-[9px] font-mono text-stone-400 group-hover:text-orange-600 transition">
                Tap to pin mark
              </span>
            )}
          </div>
          <div
            onClick={(e) => handleViewClick(e, "rear", "Rear View")}
            className={`w-full max-w-[210px] aspect-[4/3] relative flex items-center justify-center ${
              !readOnly ? "cursor-crosshair" : ""
            }`}
          >
            <svg
              viewBox="0 0 200 150"
              className="w-full h-full text-stone-900 select-none pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Roof & Rear Windshield */}
              <path d="M 48 60 L 64 22 L 136 22 L 152 60 Z" fill="#F4F4F5" />
              <line x1="100" y1="22" x2="100" y2="60" stroke="#D4D4D8" strokeWidth="1" strokeDasharray="3 3" />

              {/* Trunk Hatch & Main Rear Body */}
              <path
                d="M 26 60 C 26 60 55 58 100 58 C 145 58 174 60 174 60 C 184 60 188 72 188 88 L 188 116 C 188 122 182 126 176 126 L 160 126 C 156 126 156 118 156 118 L 44 118 C 44 118 44 126 40 126 L 24 126 C 18 126 12 122 12 116 L 12 88 C 12 72 16 60 26 60 Z"
                fill="#FFFFFF"
              />

              {/* Rear Tail Lamps */}
              <path d="M 20 70 L 46 70 C 42 90 38 94 18 86 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
              <path d="M 180 70 L 154 70 C 158 90 162 94 182 86 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />

              {/* Boot Hatch Seam Line */}
              <path d="M 44 60 L 50 102 L 150 102 L 156 60" stroke="#A1A1AA" strokeWidth="1.2" />

              {/* Number Plate & Handle */}
              <rect x="72" y="78" width="56" height="15" rx="2" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.2" />
              <text x="100" y="89" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle" fill="#000" stroke="none">MALTA</text>
              <rect x="88" y="72" width="24" height="3" rx="1.5" fill="#71717A" stroke="none" />

              {/* Rear Bumper & Reflector Inserts */}
              <rect x="24" y="106" width="16" height="5" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
              <rect x="160" y="106" width="16" height="5" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
              <circle cx="148" cy="120" r="4" fill="#52525B" stroke="#27272A" strokeWidth="1" />

              {/* Wheels */}
              <rect x="18" y="112" width="18" height="24" rx="4" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
              <rect x="164" y="112" width="18" height="24" rx="4" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
            </svg>

            {pins
              .filter((p) => p.view === "rear")
              .map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                  title={p.note}
                >
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white animate-bounce-subtle">
                    {pins.indexOf(p) + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* VIEW 4: DRIVER SIDE PROFILE (Facing Right) */}
        <div className="border border-stone-200/70 rounded-xl p-3 bg-stone-50/50 flex flex-col items-center relative group">
          <div className="w-full flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              4. Driver Side Profile
            </span>
            {!readOnly && (
              <span className="text-[9px] font-mono text-stone-400 group-hover:text-orange-600 transition">
                Tap to pin mark
              </span>
            )}
          </div>
          <div
            onClick={(e) => handleViewClick(e, "driver", "Driver Side Profile")}
            className={`w-full aspect-[2/1] relative flex items-center justify-center ${
              !readOnly ? "cursor-crosshair" : ""
            }`}
          >
            <svg
              viewBox="0 0 280 130"
              className="w-full h-full text-stone-900 select-none pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Silhouette facing right */}
              <path
                d="M 15 92 L 35 92 C 40 70 65 70 70 92 L 185 92 C 190 70 215 70 220 92 L 260 92 C 268 92 272 85 272 76 C 272 68 262 64 244 60 L 200 54 L 155 24 L 75 24 L 35 42 L 20 52 C 10 56 8 65 8 74 C 8 85 10 92 15 92 Z"
                fill="#FFFFFF"
              />
              {/* Windows */}
              <path d="M 192 52 L 152 28 L 115 28 L 115 52 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />
              <path d="M 108 28 L 78 28 L 45 46 L 40 52 L 108 52 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />
              {/* Door Seams */}
              <line x1="112" y1="28" x2="112" y2="88" stroke="#A1A1AA" strokeWidth="1.2" />
              <line x1="186" y1="52" x2="186" y2="88" stroke="#A1A1AA" strokeWidth="1.2" />
              {/* Handles */}
              <rect x="124" y="56" width="12" height="3" rx="1.5" fill="#18181B" stroke="none" />
              <rect x="88" y="56" width="12" height="3" rx="1.5" fill="#18181B" stroke="none" />
              {/* Fuel Flap */}
              <rect x="42" y="58" width="10" height="12" rx="2" stroke="#A1A1AA" strokeWidth="1" fill="#FAFAFA" />
              {/* Wheels */}
              <circle cx="52" cy="92" r="22" fill="#27272A" stroke="#18181B" strokeWidth="2" />
              <circle cx="52" cy="92" r="12" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
              <circle cx="52" cy="92" r="4" fill="#18181B" stroke="none" />
              <circle cx="202" cy="92" r="22" fill="#27272A" stroke="#18181B" strokeWidth="2" />
              <circle cx="202" cy="92" r="12" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
              <circle cx="202" cy="92" r="4" fill="#18181B" stroke="none" />
              {/* Front Lamp */}
              <path d="M 268 74 L 252 66 L 244 78 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
              {/* Rear Lamp */}
              <path d="M 12 64 L 25 64 L 22 76 L 12 74 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
            </svg>

            {pins
              .filter((p) => p.view === "driver")
              .map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                  title={p.note}
                >
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white animate-bounce-subtle">
                    {pins.indexOf(p) + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* VIEW 5: TOP AERIAL VIEW (Spans full width on desktop) */}
        <div className="md:col-span-2 border border-stone-200/70 rounded-xl p-3 bg-stone-50/50 flex flex-col items-center relative group">
          <div className="w-full flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              5. Top Aerial View (Roof, Bonnet &amp; Boot)
            </span>
            {!readOnly && (
              <span className="text-[9px] font-mono text-stone-400 group-hover:text-orange-600 transition">
                Tap to pin mark
              </span>
            )}
          </div>
          <div
            onClick={(e) => handleViewClick(e, "aerial", "Top Aerial View")}
            className={`w-full max-w-[420px] aspect-[2.4/1] relative flex items-center justify-center ${
              !readOnly ? "cursor-crosshair" : ""
            }`}
          >
            <svg
              viewBox="0 0 320 130"
              className="w-full h-full text-stone-900 select-none pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer Body Boundary */}
              <path
                d="M 32 32 C 22 32 16 46 16 65 C 16 84 22 98 32 98 L 275 98 C 292 98 304 84 304 65 C 304 46 292 32 275 32 Z"
                fill="#FFFFFF"
              />

              {/* Front Windscreen */}
              <path d="M 85 36 L 102 46 L 102 84 L 85 94 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />

              {/* Roof Panel with Sunroof Line */}
              <rect x="110" y="42" width="105" height="46" rx="4" fill="#FAFAFA" stroke="#A1A1AA" strokeWidth="1.2" />
              <line x1="150" y1="42" x2="150" y2="88" stroke="#D4D4D8" strokeWidth="1" strokeDasharray="3 3" />

              {/* Rear Windscreen */}
              <path d="M 224 45 L 244 38 L 244 92 L 224 85 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.2" />

              {/* Centerlines & Seams */}
              <line x1="20" y1="65" x2="80" y2="65" stroke="#D4D4D8" strokeWidth="1" />
              <line x1="250" y1="65" x2="300" y2="65" stroke="#D4D4D8" strokeWidth="1" />

              {/* Side Mirrors */}
              <rect x="88" y="22" width="10" height="8" rx="2" fill="#71717A" stroke="#18181B" strokeWidth="1" />
              <rect x="88" y="100" width="10" height="8" rx="2" fill="#71717A" stroke="#18181B" strokeWidth="1" />
            </svg>

            {pins
              .filter((p) => p.view === "aerial")
              .map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                  title={p.note}
                >
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white animate-bounce-subtle">
                    {pins.indexOf(p) + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Pin Description Prompt Modal */}
      {activePinPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                  {pins.length + 1}
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  Mark on {activePinPrompt.viewLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePinPrompt(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-700 block">
                Condition Description:
              </label>
              <input
                type="text"
                value={promptNote}
                onChange={(e) => setPromptNote(e.target.value)}
                placeholder="e.g. 2cm bumper stone chip, alloy scuff..."
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePin()
                }}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Stone chip", "Light scratch", "Wheel curb scuff", "Clean"].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setPromptNote(sample)}
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded text-stone-700 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setActivePinPrompt(null)}
                className="px-3 py-1.5 text-xs text-stone-600 font-semibold hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="px-4 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Pin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Pinned Marks List */}
      {pins.length > 0 && (
        <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-3 sm:p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-orange-100 pb-1.5">
            <span className="font-bold text-stone-900 font-heading text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Recorded Pre-Rental Condition Marks ({pins.length})
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              Clause 2: Fair Wear &amp; Tear
            </span>
          </div>
          <div className="space-y-1.5">
            {pins.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-orange-100 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-stone-800">{p.viewLabel}:</span>
                  <span className="text-stone-600">{p.note}</span>
                </div>
                {!readOnly && onRemovePin && (
                  <button
                    type="button"
                    onClick={() => onRemovePin(p.id)}
                    className="text-stone-400 hover:text-red-600 p-1 cursor-pointer transition text-xs"
                    title="Remove Pin"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
