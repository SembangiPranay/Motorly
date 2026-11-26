import React, { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CameraIcon } from "../../components/Icons"
import PitStop5ViewSchematic, { ConditionPin } from "../../components/contract/PitStop5ViewSchematic"
import { compressConditionImageFile } from "../../utils/imageCompression"
import { useStudioSettings, getSupportPhone, getHubCoordinates } from "../../utils/studioSettings"

interface CheckoutConditionAndSignatureProps {
  clientSignature: string
  setClientSignature: (sig: string) => void
  conditionNotes?: string
  setConditionNotes?: (notes: string) => void
  onOpenLegalModal?: (tab: "privacy" | "terms" | "deposit" | "insurance") => void
  conditionPhotos?: string[]
  setConditionPhotos?: (photos: string[]) => void
  conditionPins?: ConditionPin[]
  setConditionPins?: (pins: ConditionPin[]) => void
}

export default function CheckoutConditionAndSignature({
  clientSignature,
  setClientSignature,
  conditionNotes = "",
  setConditionNotes,
  onOpenLegalModal,
  conditionPhotos = [],
  setConditionPhotos,
  conditionPins = [],
  setConditionPins,
}: CheckoutConditionAndSignatureProps) {
  const studioSettings = useStudioSettings()
  const supportPhone = getSupportPhone(studioSettings)
  const hub = getHubCoordinates(studioSettings)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sigUploadInputRef = useRef<HTMLInputElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [signatureMode, setSignatureMode] = useState<"draw" | "type" | "upload">("draw")
  const [showPaperModal, setShowPaperModal] = useState(false)
  const [conditionAcknowledged, setConditionAcknowledged] = useState(true)
  const [sigUploadError, setSigUploadError] = useState<string | null>(null)

  const handleAddConditionPin = (pin: ConditionPin) => {
    if (setConditionPins) {
      setConditionPins([...conditionPins, pin])
    }
    if (pin.photo && setConditionPhotos) {
      setConditionPhotos([...conditionPhotos, pin.photo].slice(0, 16))
    }
  }

  const handleRemoveConditionPin = (pinId: string) => {
    const target = conditionPins.find((p) => p.id === pinId)
    if (setConditionPins) {
      setConditionPins(conditionPins.filter((p) => p.id !== pinId))
    }
    if (target?.photo && setConditionPhotos) {
      setConditionPhotos(conditionPhotos.filter((photo) => photo !== target.photo))
    }
  }

  const handleSignatureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSigUploadError(null)
    try {
      const compressed = await compressConditionImageFile(file, 600, 0.9, "image/png")
      setClientSignature(compressed)
      setHasDrawn(false)
      setTypedName("")
    } catch (err: any) {
      setSigUploadError(err?.message || "Could not load signature image.")
    } finally {
      if (e.target) e.target.value = ""
    }
  }

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#17191C] font-heading flex items-center gap-2">
              <span>Vehicle Condition Specification &amp; Client Endorsement</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                Official Paper Form
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPaperModal(true)}
                className="text-[10px] font-mono font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition cursor-pointer"
              >
                View Physical Contract Form ↗
              </button>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Clause 2: Fair Wear &amp; Tear
              </span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Pre-rental vehicle bodywork standard from Pit Stop Car Hire ({hub.address}). Tap any vector side diagram below to add optional photos or notes if needed.
          </p>
        </div>
      </div>

      {/* Reassuring Handover Inspection Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
          ⓘ
        </div>
        <div className="text-xs text-amber-950 space-y-1">
          <p className="font-bold text-amber-900">
            Official 5-View Pre-Rental Condition Inspection
          </p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            Tap any of the 5 vehicle sides below (Front, Passenger Side, Rear, Driver Side, or Top Aerial) or click <strong>+ Photo</strong> on that side if you wish to attach condition photos now. Normal fair wear &amp; tear is excepted under <strong>Clause 2</strong>.
          </p>
        </div>
      </div>

      {/* 5-View Technical Diagram (Interactive Optional Side Photos & Marks) */}
      <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-stone-900 font-heading">
              Pit Stop 5-View Vehicle Schematic (Tap Any Side to Add Photo)
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-500">
            Fair Wear &amp; Tear Excepted (Clause 2)
          </span>
        </div>

        {/* Interactive 5-View Schematic Grid */}
        <PitStop5ViewSchematic
          pins={conditionPins}
          onAddPin={handleAddConditionPin}
          onRemovePin={handleRemoveConditionPin}
          readOnly={!setConditionPins}
        />

        {/* Condition Check Confirmation */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/80 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={conditionAcknowledged}
              onChange={(e) => setConditionAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
            />
            <span className="font-semibold text-[11px] text-stone-800">
              I acknowledge the vehicle will be received in good mechanical order with exterior, tyres, and glass inspected at handover (Clause 2).
            </span>
          </label>
        </div>
      </div>

      {/* Client Signature Pad directly matching the paper's "Client signature: ____________" */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-stone-900 font-heading flex items-center gap-2">
            <span>Client signature:</span>
            <span className="text-rose-500">*</span>
            <span className="text-[10px] font-normal text-stone-500">
              (Endorses 5-view condition standard &amp; 21 Pit Stop rental clauses)
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["draw", "type", "upload"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSignatureMode(mode)
                  if (mode === "draw" || mode === "type") clearCanvas()
                  setSigUploadError(null)
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  signatureMode === mode
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                {mode === "draw"
                  ? "Draw Pad"
                  : mode === "type"
                    ? "Type Name"
                    : "Add Signature Image"}
              </button>
            ))}
            {(hasDrawn || typedName || clientSignature) && (
              <button
                type="button"
                onClick={() => {
                  clearCanvas()
                  setTypedName("")
                  setClientSignature("")
                  setSigUploadError(null)
                }}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 px-1.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <input
          ref={sigUploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSignatureImageUpload}
        />

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
                <span className="text-[10px] mt-0.5">Endorses condition inspection &amp; 21 Pit Stop terms</span>
              </div>
            )}
          </div>
        ) : signatureMode === "type" ? (
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
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/70 space-y-3 text-center">
            {clientSignature && clientSignature.startsWith("data:image") ? (
              <div className="space-y-2">
                <img
                  src={clientSignature}
                  alt="Uploaded client signature"
                  className="max-h-24 mx-auto object-contain bg-white rounded-lg border border-stone-200 p-2"
                />
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => sigUploadInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                  >
                    Replace Signature Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <p className="text-xs text-stone-600 font-medium">
                  Upload a photo or scan of your handwritten signature (PNG, JPG, WebP)
                </p>
                <button
                  type="button"
                  onClick={() => sigUploadInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <CameraIcon size={14} />
                  <span>Add Signature Image</span>
                </button>
              </div>
            )}
            {sigUploadError && (
              <p className="text-xs text-rose-600 font-semibold">{sigUploadError}</p>
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

      {/* Official Paper Contract Form Modal */}
      {showPaperModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
            onClick={() => setShowPaperModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 block">
                    Authentic Documentation
                  </span>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Pit Stop Car Hire — Official Paper Rental Agreement
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaperModal(false)}
                  className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3 bg-stone-100 flex-1">
                <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[11px] font-bold text-stone-900 block">
                    Page 1: Contract Header, 5-View Schematic &amp; Client Signature
                  </span>
                  <img
                    src="/images/contract/pitstop_5view_master_sheet.png"
                    alt="Authentic 5-View Schematic from Pit Stop Contract"
                    className="w-full rounded-lg border border-stone-200"
                  />
                </div>
                <div className="text-[11px] text-stone-600 bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                  <strong className="text-stone-900 block font-bold">Pit Stop Car Hire Operational Details:</strong>
                  <p>• Central Garage: {hub.address}</p>
                  <p>• Support &amp; Fleet Helpline: {supportPhone}</p>
                  <p>• Standard Excess: €700 (Waived to €0 with Collision Waiver)</p>
                  <p>• Clauses: 21 Operating Clauses governing territorial use, wear &amp; tear, and extension notices.</p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
