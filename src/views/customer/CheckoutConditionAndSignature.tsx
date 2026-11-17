import React, { useRef, useState, useEffect } from "react"
import { CheckIcon, ShieldIcon } from "../../components/Icons"
import PitStop5ViewSchematic, { ConditionPin } from "../../components/contract/PitStop5ViewSchematic"

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw")
  const [showPaperModal, setShowPaperModal] = useState(false)

  // Local state fallbacks if parent doesn't provide setters
  const [localPins, setLocalPins] = useState<ConditionPin[]>(conditionPins)
  const [localPhotos, setLocalPhotos] = useState<string[]>(conditionPhotos)

  const activePins = setConditionPins ? conditionPins : localPins
  const activePhotos = setConditionPhotos ? conditionPhotos : localPhotos

  // Keep pins synchronized with conditionNotes
  const handleAddPin = (pin: ConditionPin) => {
    const updated = [...activePins, pin]
    if (setConditionPins) setConditionPins(updated)
    else setLocalPins(updated)

    // Append to condition notes
    const pinSummary = updated.map((p, i) => `[${i + 1}] ${p.viewLabel}: ${p.note}`).join("; ")
    if (setConditionNotes) {
      setConditionNotes(pinSummary)
    }
  }

  const handleRemovePin = (id: string) => {
    const updated = activePins.filter((p) => p.id !== id)
    if (setConditionPins) setConditionPins(updated)
    else setLocalPins(updated)

    const pinSummary = updated.map((p, i) => `[${i + 1}] ${p.viewLabel}: ${p.note}`).join("; ")
    if (setConditionNotes) {
      setConditionNotes(pinSummary)
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

  // Handle Photo Upload with Compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const maxDim = 800
          let width = img.width
          let height = img.height
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressed = canvas.toDataURL("image/jpeg", 0.75)
            const updated = [...activePhotos, compressed].slice(0, 4)
            if (setConditionPhotos) setConditionPhotos(updated)
            else setLocalPhotos(updated)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    })

    if (e.target) e.target.value = ""
  }

  const handleRemovePhoto = (index: number) => {
    const updated = activePhotos.filter((_, i) => i !== index)
    if (setConditionPhotos) setConditionPhotos(updated)
    else setLocalPhotos(updated)
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
              <span>Vehicle Condition Chart &amp; Client Signature</span>
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
                5-View Pre-Rental Inspection
              </span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Official 5-view schematic diagram from Pit Stop Car Hire (36 Triq Il-Kbira, Mgarr). Tap on any view to mark existing scratches, or attach pre-rental photos.
          </p>
        </div>
      </div>

      {/* 5-View Technical Diagram */}
      <div className="bg-stone-50/70 border border-stone-200/80 rounded-xl p-3.5 sm:p-5 space-y-4">
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

        {/* 5-View Schematic Interactive Grid */}
        <PitStop5ViewSchematic
          pins={activePins}
          onAddPin={handleAddPin}
          onRemovePin={handleRemovePin}
          readOnly={false}
        />

        {/* Optional Condition Photos Attachment */}
        <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-800 block">
                Attach Pre-Rental Condition Photos (Optional Evidence)
              </span>
              <span className="text-[10px] text-stone-500">
                Take or upload up to 4 photos of existing scratches, wheels, or mileage before departure.
              </span>
            </div>
            {activePhotos.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>+ Attach Photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Photo Previews */}
          {activePhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {activePhotos.map((photo, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-[4/3] bg-stone-100">
                  <img src={photo} alt={`Vehicle condition evidence ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs hover:bg-red-600 transition cursor-pointer"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                    Photo {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Condition Check Confirmation & Manual Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/80 text-xs">
          <div className="flex items-center gap-1.5 text-stone-700">
            <CheckIcon size={14} className="text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">
              Pre-rental exterior, tyres and glass in good mechanical order (Clause 2).
            </span>
          </div>
          {setConditionNotes && (
            <input
              type="text"
              placeholder="Additional condition notes or ding details (optional)"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="text-[11px] px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white w-full sm:w-80 focus:outline-none focus:ring-1 focus:ring-[#F97316]"
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

      {/* Official Paper Contract Form Modal */}
      {showPaperModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
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
                  Pit Stop Car Hire — Official Paper Rental Agreement (Malta)
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
                  src="/images/contract/views/front.png"
                  alt="Pit Stop official paper contract"
                  className="hidden"
                />
                <img
                  src="/images/contract/pitstop_5view_master_sheet.png"
                  alt="Authentic 5-View Schematic from Pit Stop Contract"
                  className="w-full rounded-lg border border-stone-200"
                />
              </div>
              <div className="text-[11px] text-stone-600 bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                <strong className="text-stone-900 block font-bold">Pit Stop Car Hire Operational Details:</strong>
                <p>• Central Garage: 36 Triq Il-Kbira, Mgarr, Malta</p>
                <p>• Emergency &amp; Fleet Telemetry: 99827192 / 99804255</p>
                <p>• Standard Excess: €700 (Waived to €0 with Collision Waiver)</p>
                <p>• Clauses: 21 Operating Clauses governing territorial use, wear &amp; tear, and extension notices.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
