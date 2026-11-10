import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import { CheckIcon, AlertTriangleIcon } from "../../components/Icons"

interface AdminReturnModalProps {
  booking: BookingRecord
  car?: Car
  onConfirm: (data: {
    odometerIn: number
    cleanlinessPass: boolean
    damageFound: boolean
  }) => Promise<void>
  onClose: () => void
}

export default function AdminReturnModal({
  booking,
  car,
  onConfirm,
  onClose,
}: AdminReturnModalProps) {
  const currentOdo = booking.odometerOut || car?.currentOdometer || 15000
  const [odometerIn, setOdometerIn] = useState<string>(String(currentOdo + 120))
  const [cleanlinessPass, setCleanlinessPass] = useState(true)
  const [damageFound, setDamageFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerName = `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() || "Valued Customer"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(odometerIn.replace(/,/g, ""), 10)
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid return odometer reading.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm({
        odometerIn: num,
        cleanlinessPass,
        damageFound,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to complete return audit.")
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Vehicle Return & Check-In Audit
              </h3>
              <p className="text-[11px] text-stone-500">
                Booking: <span className="font-mono font-bold text-stone-700">{booking.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Customer & Vehicle Info */}
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Customer:</span>
            <span className="font-bold text-stone-900">{customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Vehicle:</span>
            <span className="font-bold text-stone-900">
              {car ? car.name : "Vehicle"} {car?.plateNumber && `(${car.plateNumber})`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Departure Odometer:</span>
            <span className="font-mono text-stone-700">{currentOdo.toLocaleString()} km</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Final Return Odometer (km)
            </label>
            <input
              type="text"
              required
              value={odometerIn}
              onChange={(e) => setOdometerIn(e.target.value)}
              className="w-full h-9 px-3 text-xs font-mono font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
              <input
                type="checkbox"
                checked={cleanlinessPass}
                onChange={(e) => setCleanlinessPass(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Cabin is clean & fuel tank filled</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
              <input
                type="checkbox"
                checked={damageFound}
                onChange={(e) => setDamageFound(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className={damageFound ? "text-amber-800 font-bold" : ""}>
                New dents / damage detected (Send vehicle to Maintenance Bay)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Completing..." : "Complete Return & Close Audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
