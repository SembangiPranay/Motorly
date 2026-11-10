import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import { KeyIcon, CheckIcon, CarIcon, UserIcon } from "../../components/Icons"

interface AdminKeyHandoverModalProps {
  booking: BookingRecord
  car?: Car
  onConfirm: (odometerOut: number) => Promise<void>
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerName = `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() || "Valued Customer"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(odometer.replace(/,/g, ""), 10)
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid departure odometer reading.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm(num)
    } catch (err: any) {
      setError(err?.message || "Failed to handover keys.")
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
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <KeyIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Key Handover Dispatch
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
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Customer:</span>
            <span className="font-bold text-stone-900">{customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Vehicle:</span>
            <span className="font-bold text-stone-900">
              {car ? car.name : "Assigned Car"} {car?.plateNumber && `(${car.plateNumber})`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-medium">Schedule:</span>
            <span className="text-stone-700">{booking.pickupDate} → {booking.returnDate}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Departure Odometer Reading (km)
            </label>
            <input
              type="text"
              required
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className="w-full h-9 px-3 text-xs font-mono font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200/80 text-[11px] text-blue-900 flex items-center gap-2">
            <CheckIcon size={14} className="text-blue-600 shrink-0" />
            <span>Vehicle inspected, fuel full, and physical key handed to driver.</span>
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Starting..." : "Confirm & Start Rental Clock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
