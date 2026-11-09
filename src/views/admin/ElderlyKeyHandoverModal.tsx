import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import { KeyIcon, CheckIcon, CarIcon, UserIcon, PhoneIcon } from "../../components/Icons"

interface ElderlyKeyHandoverModalProps {
  booking: BookingRecord
  car?: Car
  onConfirm: (odometerOut: number) => Promise<void>
  onClose: () => void
}

export default function ElderlyKeyHandoverModal({
  booking,
  car,
  onConfirm,
  onClose,
}: ElderlyKeyHandoverModalProps) {
  const [odometer, setOdometer] = useState<string>(
    car?.currentOdometer ? String(car.currentOdometer) : "12500"
  )
  const [keysChecked, setKeysChecked] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerName = `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || "Valued Customer"
  const carName = car?.name || booking.carType || "Assigned Vehicle"
  const plateNumber = car?.plateNumber || "Plate on File"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(odometer.replace(/,/g, ""), 10)
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid mileage number from the dashboard.")
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await onConfirm(num)
    } catch (err: any) {
      setError(err?.message || "Failed to complete key handover. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-modal-title"
    >
      <div className="bg-white text-stone-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-stone-200 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl">
              <KeyIcon size={32} />
            </div>
            <div>
              <h2 id="handover-modal-title" className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Give Keys to Driver
              </h2>
              <p className="text-base text-stone-500 font-medium">
                Step-by-step key handover for customer departure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xl flex items-center justify-center transition"
            aria-label="Close popup"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-5 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 text-base font-semibold flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Step 1: Customer & Car Details */}
          <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Step 1 • Confirm Customer & Vehicle
            </p>
            <div className="flex items-center gap-4">
              {car?.image ? (
                <img
                  src={car.image}
                  alt={carName}
                  className="w-20 h-16 object-cover rounded-xl border border-stone-200 bg-white"
                />
              ) : (
                <div className="w-20 h-16 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400">
                  <CarIcon size={28} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xl font-black text-stone-900 truncate">
                  {carName}
                </div>
                <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-stone-200 text-stone-800 font-mono font-bold text-sm rounded-md tracking-wider">
                  {plateNumber}
                </div>
                <div className="mt-1 text-base text-stone-600 flex items-center gap-2">
                  <UserIcon size={18} className="text-stone-400" />
                  <span className="font-bold text-stone-800">{customerName}</span>
                  {booking.customer.phone && (
                    <span className="text-stone-500 font-mono text-sm">
                      • {booking.customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Dashboard Odometer */}
          <div className="bg-blue-50/60 rounded-2xl p-5 border-2 border-blue-200">
            <label
              htmlFor="odometer-input"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Step 2 • What does the dashboard odometer say?
            </label>
            <p className="text-sm text-stone-600 mb-3 font-medium">
              Look at the numbers on the car dashboard and type them here:
            </p>
            <div className="relative">
              <input
                id="odometer-input"
                type="number"
                min="0"
                step="1"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-black font-mono px-5 py-4 bg-white rounded-2xl border-2 border-blue-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-600"
                placeholder="12500"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg">
                Miles / KM
              </span>
            </div>
          </div>

          {/* Step 3: Keys in Hand */}
          <div
            onClick={() => setKeysChecked(!keysChecked)}
            className="cursor-pointer bg-stone-50 hover:bg-stone-100 transition rounded-2xl p-5 border-2 border-stone-200 flex items-center gap-4"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white transition ${
                keysChecked ? "bg-emerald-600" : "bg-stone-300"
              }`}
            >
              {keysChecked && <CheckIcon size={22} />}
            </div>
            <div>
              <div className="text-lg font-bold text-stone-900">
                Step 3 • Physical keys handed to customer
              </div>
              <p className="text-sm text-stone-500 font-medium">
                Customer has the key fob and is ready to drive away
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg transition min-h-[56px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !keysChecked}
              className="flex-1 w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-3 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Starting Trip...</span>
              ) : (
                <>
                  <KeyIcon size={24} />
                  <span>Hand Over Keys & Start Trip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
