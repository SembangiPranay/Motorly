import React, { useRef, useState, useEffect } from "react"
import { CheckIcon, SparklesIcon } from "../../components/Icons"

interface CheckoutConditionAndSignatureProps {
  clientSignature: string
  setClientSignature: (sig: string) => void
  conditionNotes?: string
  setConditionNotes?: (notes: string) => void
  onOpenLegalModal?: (tab: "privacy" | "terms" | "deposit" | "insurance") => void
}

export default function CheckoutConditionAndSignature({
  clientSignature,
  setClientSignature,
  conditionNotes = "",
  setConditionNotes,
  onOpenLegalModal,
}: CheckoutConditionAndSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw")

  // Setup canvas drawing context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#17191C"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false)
      const dataUrl = canvasRef.current.toDataURL("image/png")
      setClientSignature(dataUrl)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setClientSignature("")
  }

  const applyTypedSignature = (name: string) => {
    setTypedName(name)
    if (!name.trim()) {
      setClientSignature("")
      return
    }
    // Render text to canvas to create signature data URL
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 120
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#17191C"
      ctx.font = "italic 32px 'Brush Script MT', 'Dancing Script', cursive, serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(name.trim(), 200, 60)
      setClientSignature(canvas.toDataURL("image/png"))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          6
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17191C] font-heading flex items-center gap-2">
              <span>Vehicle Condition Chart &amp; Client Signature</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                Official Paper Form
              </span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              5-View Pre-Rental Inspection
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Schematic inspection diagram from the Pit Stop agreement. Endorse bodywork condition and sign below.
          </p>
        </div>
      </div>

      {/* 5-View Vehicle Schematic Diagram (SVG exact match to paper) */}
      <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-stone-900 font-heading">
              Pit Stop 5-View Vehicle Schematic (Front, Rear, Sides &amp; Aerial)
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            Fair Wear &amp; Tear Excepted (Clause 2)
          </span>
        </div>

        {/* Schematic Layout: Matching the physical paper arrangement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          {/* Left Column: Front and Rear views */}
          <div className="space-y-4">
            {/* Front View */}
            <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/40 text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Front View
              </span>
              <svg viewBox="0 0 200 110" className="w-full max-w-[180px] mx-auto text-stone-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Windshield & Roof */}
                <path d="M 45 45 L 60 15 L 140 15 L 155 45 Z" fill="#F4F4F5" />
                {/* Hood & Main Body */}
                <path d="M 25 45 C 25 45 50 42 100 42 C 150 42 175 45 175 45 C 185 45 190 55 190 70 L 190 90 C 190 95 185 98 180 98 L 165 98 C 160 98 160 90 160 90 L 40 90 C 40 90 40 98 35 98 L 20 98 C 15 98 10 95 10 90 L 10 70 C 10 55 15 45 25 45 Z" fill="#FFFFFF" />
                {/* Headlights */}
                <polygon points="25,52 48,52 42,65 22,62" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
                <polygon points="175,52 152,52 158,65 178,62" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
                {/* Grille */}
                <rect x="65" y="55" width="70" height="15" rx="3" stroke="#52525B" strokeWidth="1.5" fill="#E4E4E7" />
                <line x1="75" y1="58" x2="75" y2="67" stroke="#71717A" strokeWidth="1" />
                <line x1="85" y1="58" x2="85" y2="67" stroke="#71717A" strokeWidth="1" />
                <line x1="95" y1="58" x2="95" y2="67" stroke="#71717A" strokeWidth="1" />
                <line x1="105" y1="58" x2="105" y2="67" stroke="#71717A" strokeWidth="1" />
                <line x1="115" y1="58" x2="115" y2="67" stroke="#71717A" strokeWidth="1" />
                <line x1="125" y1="58" x2="125" y2="67" stroke="#71717A" strokeWidth="1" />
                {/* Bumper & Plate */}
                <rect x="80" y="76" width="40" height="10" rx="2" stroke="#18181B" strokeWidth="1" fill="#FFFFFF" />
                <text x="100" y="83" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle" fill="#000" stroke="none">REG OK</text>
                {/* Mirrors */}
                <path d="M 40 46 L 25 40 L 25 48 Z" fill="#E4E4E7" />
                <path d="M 160 46 L 175 40 L 175 48 Z" fill="#E4E4E7" />
                {/* Front Wheels */}
                <rect x="18" y="88" width="16" height="16" rx="3" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
                <rect x="166" y="88" width="16" height="16" rx="3" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Rear View */}
            <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/40 text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Rear View
              </span>
              <svg viewBox="0 0 200 110" className="w-full max-w-[180px] mx-auto text-stone-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Rear Window & Roof */}
                <path d="M 48 45 L 62 18 L 138 18 L 152 45 Z" fill="#F4F4F5" />
                {/* Trunk & Main Rear */}
                <path d="M 22 45 C 22 45 50 44 100 44 C 150 44 178 45 178 45 C 186 45 190 55 190 70 L 190 90 C 190 95 185 98 180 98 L 165 98 C 160 98 160 90 160 90 L 40 90 C 40 90 40 98 35 98 L 20 98 C 15 98 10 95 10 90 L 10 70 C 10 55 14 45 22 45 Z" fill="#FFFFFF" />
                {/* Tail lights */}
                <polygon points="18,52 38,52 35,68 15,64" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                <polygon points="182,52 162,52 165,68 185,64" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                {/* Hatch / Trunk line */}
                <path d="M 40 45 L 45 78 L 155 78 L 160 45" stroke="#71717A" strokeWidth="1.5" />
                {/* Number Plate */}
                <rect x="75" y="58" width="50" height="14" rx="2" stroke="#18181B" strokeWidth="1.2" fill="#FFFFFF" />
                <text x="100" y="68" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle" fill="#000" stroke="none">MALTA</text>
                {/* Rear Wheels */}
                <rect x="18" y="88" width="16" height="16" rx="3" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
                <rect x="166" y="88" width="16" height="16" rx="3" fill="#27272A" stroke="#18181B" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Right Column: Driver Side, Passenger Side & Aerial View */}
          <div className="space-y-4">
            {/* Driver Side View */}
            <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/40 text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Driver Side Profile
              </span>
              <svg viewBox="0 0 250 85" className="w-full text-stone-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Hatchback/Car Side Silhouette */}
                <path d="M 15 55 L 25 55 C 30 40 45 35 55 55 L 175 55 C 185 35 200 40 205 55 L 235 55 C 242 55 245 50 245 42 C 245 35 235 30 220 28 L 180 26 L 150 8 L 85 8 L 45 28 L 20 32 C 10 33 5 40 5 48 C 5 53 10 55 15 55 Z" fill="#FFFFFF" />
                {/* Side Windows */}
                <path d="M 88 12 L 146 12 L 175 26 L 50 26 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.5" />
                {/* Door Partition lines */}
                <line x1="115" y1="12" x2="115" y2="52" stroke="#A1A1AA" strokeWidth="1.5" />
                <line x1="170" y1="26" x2="170" y2="52" stroke="#A1A1AA" strokeWidth="1.5" />
                {/* Door handles */}
                <rect x="95" y="30" width="10" height="2" rx="1" fill="#18181B" stroke="none" />
                <rect x="150" y="30" width="10" height="2" rx="1" fill="#18181B" stroke="none" />
                {/* Wheels */}
                <circle cx="40" cy="55" r="15" fill="#27272A" stroke="#18181B" strokeWidth="2" />
                <circle cx="40" cy="55" r="7" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
                <circle cx="190" cy="55" r="15" fill="#27272A" stroke="#18181B" strokeWidth="2" />
                <circle cx="190" cy="55" r="7" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Top Aerial View */}
            <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/40 text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Top Aerial View
              </span>
              <svg viewBox="0 0 250 85" className="w-full text-stone-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Car Roof & Aerial Outline */}
                <path d="M 25 15 C 20 15 15 25 15 42.5 C 15 60 20 70 25 70 L 215 70 C 230 70 240 58 240 42.5 C 240 27 230 15 215 15 Z" fill="#FFFFFF" />
                {/* Windshield Front */}
                <path d="M 65 20 L 78 28 L 78 57 L 65 65 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.5" />
                {/* Roof Panel */}
                <rect x="85" y="24" width="80" height="37" rx="3" fill="#FAFAFA" stroke="#A1A1AA" strokeWidth="1.5" />
                {/* Rear Window */}
                <path d="M 180 25 L 195 21 L 195 64 L 180 60 Z" fill="#F4F4F5" stroke="#71717A" strokeWidth="1.5" />
                {/* Hood & Trunk Centerlines */}
                <line x1="18" y1="42.5" x2="60" y2="42.5" stroke="#D4D4D8" strokeWidth="1.5" />
                <line x1="200" y1="42.5" x2="235" y2="42.5" stroke="#D4D4D8" strokeWidth="1.5" />
                {/* Side Mirrors */}
                <rect x="68" y="10" width="8" height="6" rx="2" fill="#71717A" stroke="#18181B" strokeWidth="1" />
                <rect x="68" y="69" width="8" height="6" rx="2" fill="#71717A" stroke="#18181B" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Condition Check Confirmation */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-stone-700">
            <CheckIcon size={14} className="text-emerald-600" />
            <span className="font-semibold">Pre-rental exterior, tyres and glass in good mechanical order.</span>
          </div>
          {setConditionNotes && (
            <input
              type="text"
              placeholder="Note any minor pre-existing scratch/ding (optional)"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="text-[11px] px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          )}
        </div>
      </div>

      {/* Client Signature Pad directly matching the paper's "Client signature: ____________" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-900 font-heading flex items-center gap-2">
            <span>Client signature:</span>
            <span className="text-rose-500">*</span>
            <span className="text-[10px] font-normal text-stone-500">
              (Endorses 5-view condition &amp; 21 Pit Stop rental clauses)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSignatureMode(signatureMode === "draw" ? "type" : "draw")
                clearCanvas()
              }}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer underline"
            >
              {signatureMode === "draw" ? "Switch to Type Signature" : "Switch to Draw Pad"}
            </button>
            {(hasDrawn || typedName) && (
              <button
                type="button"
                onClick={() => {
                  clearCanvas()
                  setTypedName("")
                }}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {signatureMode === "draw" ? (
          <div className="relative border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50 hover:bg-stone-50 transition-colors">
            <canvas
              ref={canvasRef}
              width={500}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-stone-400 text-xs">
                <span className="font-heading font-medium">Draw client signature with finger or mouse here</span>
                <span className="text-[10px] mt-0.5">Endorses condition inspection &amp; Pit Stop terms</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Type your full legal name to sign digitally"
              value={typedName}
              onChange={(e) => applyTypedSignature(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl text-base font-medium italic focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50 text-stone-900"
            />
            {typedName && (
              <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 text-center">
                <span className="font-serif italic text-2xl text-stone-900 tracking-wider">
                  {typedName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Signature Status & Legal Confirmation */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
          <div className="flex items-center gap-1.5">
            {clientSignature ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-800">
                  Signature verified &amp; attached to agreement manifest
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-800">
                  Please provide signature before booking submission
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.("terms")}
            className="text-orange-600 hover:underline font-semibold cursor-pointer"
          >
            Review 21 Rental Clauses →
          </button>
        </div>
      </div>
    </div>
  )
}
