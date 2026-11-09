import React, { useState } from "react"
import type { Car } from "../../types"
import { CarIcon, CheckIcon, UserIcon, PhoneIcon, CalendarIcon } from "../../components/Icons"

interface ElderlyWalkinModalProps {
  availableCars: Car[]
  onConfirm: (data: {
    customerName: string
    customerPhone: string
    carId: string
    totalDays: number
    dailyRate: number
    totalPrice: number
  }) => Promise<void>
  onClose: () => void
}

export default function ElderlyWalkinModal({
  availableCars,
  onConfirm,
  onClose,
}: ElderlyWalkinModalProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCarId, setSelectedCarId] = useState<string>(
    availableCars[0]?.id || ""
  )
  const [days, setDays] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCar = availableCars.find((c) => c.id === selectedCarId) || availableCars[0]
  const dailyRate = selectedCar?.pricePerDay || 65
  const totalPrice = dailyRate * days

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setError("Please enter the customer's full name.")
      return
    }
    if (!customerPhone.trim()) {
      setError("Please enter the customer's phone number.")
      return
    }
    if (!selectedCar) {
      setError("No car selected. Please select a vehicle from the fleet.")
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await onConfirm({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        carId: selectedCar.id,
        totalDays: days,
        dailyRate,
        totalPrice,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to create walk-in booking. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkin-modal-title"
    >
      <div className="bg-white text-stone-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-stone-200 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-3xl">
              🚶
            </div>
            <div>
              <h2 id="walkin-modal-title" className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Walk-In Customer
              </h2>
              <p className="text-base text-stone-500 font-medium">
                Quick 1-minute rental for a customer at your desk
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
          {/* Customer Name & Phone */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="walkin-name"
                className="block text-stone-900 font-bold text-lg mb-1"
              >
                1. Customer's Full Name
              </label>
              <div className="relative">
                <input
                  id="walkin-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-400/30 focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="walkin-phone"
                className="block text-stone-900 font-bold text-lg mb-1"
              >
                2. Phone Number
              </label>
              <div className="relative">
                <input
                  id="walkin-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. (555) 234-5678"
                  className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-400/30 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Select Vehicle */}
          <div>
            <label
              htmlFor="walkin-car-select"
              className="block text-stone-900 font-bold text-lg mb-2"
            >
              3. Which car are they taking?
            </label>
            {availableCars.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-bold text-base">
                ⚠️ No cars currently marked as "Ready in Garage". Please check in returned cars first.
              </div>
            ) : (
              <select
                id="walkin-car-select"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full text-lg sm:text-xl font-bold px-4 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-400/30 focus:border-amber-600"
              >
                {availableCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} ({car.plateNumber || "No plate"}) — ${car.pricePerDay}/day
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Days selector with big plus and minus buttons */}
          <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200">
            <label className="block text-stone-900 font-bold text-lg mb-2">
              4. How many days will they rent?
            </label>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-16 h-16 rounded-2xl bg-white hover:bg-stone-200 text-stone-900 font-black text-3xl border-2 border-stone-300 flex items-center justify-center transition active:scale-95 shadow-sm"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-4xl font-black text-stone-900 font-mono">
                  {days}
                </span>
                <span className="block text-sm font-bold text-stone-500 uppercase tracking-wider">
                  {days === 1 ? "Day" : "Days"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDays(days + 1)}
                className="w-16 h-16 rounded-2xl bg-white hover:bg-stone-200 text-stone-900 font-black text-3xl border-2 border-stone-300 flex items-center justify-center transition active:scale-95 shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-300 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-amber-800">
                Total Due at Counter
              </span>
              <div className="text-base text-amber-900 font-medium">
                ${dailyRate}/day × {days} {days === 1 ? "day" : "days"}
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-950 font-mono">
              ${totalPrice}
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
              disabled={submitting || availableCars.length === 0}
              className="flex-1 w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-3 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Registering Customer...</span>
              ) : (
                <>
                  <CheckIcon size={24} />
                  <span>Start Rental for Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
