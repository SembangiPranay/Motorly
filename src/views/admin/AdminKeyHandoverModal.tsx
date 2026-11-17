import React, { useState, useRef } from "react"
import type { BookingRecord, Car } from "../../types"
import {
  KeyIcon,
  CheckIcon,
  CarIcon,
  UserIcon,
  CameraIcon,
  FuelIcon,
  AlertTriangleIcon,
} from "../../components/Icons"
import PitStop5ViewSchematic, {
  ConditionPin,
} from "../../components/contract/PitStop5ViewSchematic"

export interface KeyHandoverPayload {
  odometerOut: number
  fuelOut: string
  conditionPhotos: string[]
  conditionPins: ConditionPin[]
  conditionNotes: string
}

interface AdminKeyHandoverModalProps {
  booking: BookingRecord
  car?: Car
  onConfirm: (payload: KeyHandoverPayload) => Promise<void>
  onClose: () => void
}

export default function AdminKeyHandoverModal({
  booking,
  car,
  onConfirm,
  onClose,
}: AdminKeyHandoverModalProps) {
  const [odometer, setOdometer] = useState<string>(
    car?.currentOdometer ? String(car.currentOdometer) : "12500"
  )
  const [fuelLevel, setFuelLevel] = useState<string>("100% (Full)")
  const [conditionPhotos, setConditionPhotos] = useState<string[]>(
    booking.conditionPhotos || []
  )
  const [conditionPins, setConditionPins] = useState<ConditionPin[]>(
    booking.conditionPins || []
  )
  const [conditionNotes, setConditionNotes] = useState<string>("")
  const [showSchematic, setShowSchematic] = useState<boolean>(
    Boolean(booking.conditionPins && booking.conditionPins.length > 0)
  )

  // Checklist states
  const [licenseVerified, setLicenseVerified] = useState(true)
  const [depositSecured, setDepositSecured] = useState(true)
  const [keysHanded, setKeysHanded] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const customerName =
    `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() ||
    "Valued Customer"

  // Photo upload with compression
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
            setConditionPhotos((prev) => [...prev, compressed].slice(0, 4))
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    })

    if (e.target) e.target.value = ""
  }

  const handleRemovePhoto = (index: number) => {
    setConditionPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddPin = (pin: ConditionPin) => {
    setConditionPins((prev) => [...prev, pin])
  }

  const handleRemovePin = (id: string) => {
    setConditionPins((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(odometer.replace(/,/g, ""), 10)
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid departure odometer reading.")
      return
    }

    if (!licenseVerified || !depositSecured || !keysHanded) {
      setError("Please verify all departure checklist items before releasing keys.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm({
        odometerOut: num,
        fuelOut: fuelLevel,
        conditionPhotos,
        conditionPins,
        conditionNotes,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to handover keys.")
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <KeyIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Key Handover &amp; Garage Bay Inspection
              </h3>
              <p className="text-[11px] text-stone-300">
                Reservation: <span className="font-mono font-bold text-orange-400">{booking.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangleIcon size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Staged Vehicle Card */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-stone-500 text-[10px] uppercase font-mono block">Renting Driver</span>
              <span className="font-bold text-stone-900 text-sm">{customerName}</span>
              {booking.customer?.phone && (
                <span className="text-stone-500 text-[11px] block">{booking.customer.phone}</span>
              )}
            </div>
            <div>
              <span className="text-stone-500 text-[10px] uppercase font-mono block">Staged Vehicle</span>
              <span className="font-bold text-stone-900 text-sm">
                {car ? car.name : "Assigned Car"}
              </span>
              <span className="text-orange-600 font-mono font-bold text-[11px] block">
                Plate: {car?.plateNumber || "Pending"}
              </span>
            </div>
            <div className="sm:col-span-2 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
              <span>Rental Schedule: <strong>{booking.pickupDate}</strong> → <strong>{booking.returnDate}</strong></span>
              <span className="font-mono text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-700">
                Bay Staging: Mgarr Central
              </span>
            </div>
          </div>

          {/* 1. Pre-Departure Walkaround Photos (Optional Garage Bay Evidence) */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 font-heading block">
                  1. Pre-Departure Walkaround Photos (Optional)
                </span>
                <span className="text-[11px] text-stone-500">
                  Snap or upload up to 4 quick photos of vehicle exterior &amp; wheels before handing over keys.
                </span>
              </div>
              {conditionPhotos.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <CameraIcon size={13} />
                  <span>+ Snap Photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {conditionPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {conditionPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-[4/3] bg-stone-100"
                  >
                    <img
                      src={photo}
                      alt={`Departure photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs hover:bg-red-600 transition cursor-pointer"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                      Bay Photo {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-stone-50 border border-dashed border-stone-200 text-center text-stone-400 text-[11px]">
                No departure photos uploaded yet. Tap <strong>+ Snap Photo</strong> to document pre-existing state.
              </div>
            )}
          </div>

          {/* 2. 5-View Condition Schematic & Flaw Pin Marker */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 font-heading block">
                  2. Pit Stop 5-View Condition Inspector
                </span>
                <span className="text-[11px] text-stone-500">
                  Tap to drop pins on Front, Profile, Rear or Aerial views for any pre-existing scratches or stone chips.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSchematic((prev) => !prev)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                {showSchematic
                  ? `Hide Schematic (${conditionPins.length} flaws)`
                  : conditionPins.length > 0
                  ? `View ${conditionPins.length} Marked Flaws`
                  : "+ Mark Condition Pins"}
              </button>
            </div>

            {showSchematic && (
              <div className="pt-2 border-t border-stone-100 space-y-3 animate-fadeIn">
                <PitStop5ViewSchematic
                  pins={conditionPins}
                  onAddPin={handleAddPin}
                  onRemovePin={handleRemovePin}
                  readOnly={false}
                />
              </div>
            )}
          </div>

          {/* 3. Odometer & Fuel Level Readings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 rounded-xl p-3.5 border border-stone-200/80">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Departure Odometer (km) *
              </label>
              <input
                type="text"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Departure Fuel Level *
              </label>
              <select
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full h-9 px-3 text-xs font-semibold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="100% (Full)">100% (Full Tank)</option>
                <option value="87% (7/8)">87% (7/8 Tank)</option>
                <option value="75% (3/4)">75% (3/4 Tank)</option>
                <option value="50% (1/2)">50% (1/2 Tank)</option>
                <option value="25% (1/4)">25% (1/4 Tank)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Inspection &amp; Staging Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Clean interior, vehicle staged at Bay 2, child seat fitted"
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 4. Pre-Departure Verification Checklist */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 space-y-2">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              Handover Protocol Checklist
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={licenseVerified}
                onChange={(e) => setLicenseVerified(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
              />
              <span>Physical driver's license presented and verified against contract record.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={depositSecured}
                onChange={(e) => setDepositSecured(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
              />
              <span>Security deposit (€700 or waiver) pre-authorized on client card.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={keysHanded}
                onChange={(e) => setKeysHanded(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
              />
              <span>Physical vehicle key set and telemetry fob released to client.</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <KeyIcon size={14} />
              <span>{isSubmitting ? "Dispatching..." : "Confirm Handover & Release Keys"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
