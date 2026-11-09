import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import { CheckIcon, CarIcon, UserIcon } from "../../components/Icons"

interface ElderlyReturnModalProps {
  booking: BookingRecord
  car?: Car
  onConfirm: (data: {
    odometerIn: number
    cleanlinessPass: boolean
    damageFound: boolean
  }) => Promise<void>
  onClose: () => void
}

export default function ElderlyReturnModal({
  booking,
  car,
  onConfirm,
  onClose,
}: ElderlyReturnModalProps) {
  const startOdo = booking.odometerOut || car?.currentOdometer || 12500
  const [odometerIn, setOdometerIn] = useState<string>(String(startOdo + 85))
  const [isClean, setIsClean] = useState<boolean>(true)
  const [keysReturned, setKeysReturned] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerName = `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || "Valued Customer"
  const carName = car?.name || booking.carType || "Assigned Vehicle"
  const plateNumber = car?.plateNumber || "Plate on File"

  const odoNum = parseInt(odometerIn.replace(/,/g, ""), 10)
  const milesDriven = !isNaN(odoNum) && odoNum >= startOdo ? odoNum - startOdo : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(odoNum) || odoNum < 0) {
      setError("Please enter a valid mileage number from the dashboard.")
      return
    }
    if (odoNum < startOdo) {
      setError(`Return mileage (${odoNum}) cannot be less than pickup mileage (${startOdo}).`)
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await onConfirm({
        odometerIn: odoNum,
        cleanlinessPass: isClean,
        damageFound: !isClean,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to process return. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div className="bg-white text-stone-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-stone-200 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl">
              📥
            </div>
            <div>
              <h2 id="return-modal-title" className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Take Car Back (Return)
              </h2>
              <p className="text-base text-stone-500 font-medium">
                Check vehicle in and release it back to the garage floor
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
          {/* Vehicle & Customer Summary */}
          <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200">
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
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Return Odometer */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border-2 border-emerald-200">
            <label
              htmlFor="return-odo-input"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Step 1 • What does the dashboard odometer say now?
            </label>
            <p className="text-sm text-stone-600 mb-3 font-medium">
              Start mileage was <strong className="font-mono text-stone-900">{startOdo.toLocaleString()}</strong>.
              Enter the new numbers:
            </p>
            <div className="relative">
              <input
                id="return-odo-input"
                type="number"
                min={startOdo}
                step="1"
                required
                value={odometerIn}
                onChange={(e) => setOdometerIn(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-black font-mono px-5 py-4 bg-white rounded-2xl border-2 border-emerald-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:border-emerald-600"
                placeholder={String(startOdo + 50)}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg">
                Miles / KM
              </span>
            </div>
            {milesDriven > 0 && (
              <p className="mt-2 text-sm text-emerald-800 font-bold">
                ✓ Customer drove approximately {milesDriven.toLocaleString()} miles.
              </p>
            )}
          </div>

          {/* Step 2: Cleanliness & Condition */}
          <div className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200">
            <p className="text-stone-900 font-bold text-lg mb-3">
              Step 2 • Is the car in good condition?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsClean(true)}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                  isClean
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                    isClean ? "bg-emerald-600 text-white" : "border-2 border-stone-300"
                  }`}
                >
                  {isClean ? "✓" : ""}
                </div>
                <div>
                  <div className="font-bold text-base">YES, All Good</div>
                  <div className="text-xs text-stone-500 font-normal">Clean & ready to rent</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsClean(false)}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                  !isClean
                    ? "bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-sm"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                    !isClean ? "bg-amber-600 text-white" : "border-2 border-stone-300"
                  }`}
                >
                  {!isClean ? "✓" : ""}
                </div>
                <div>
                  <div className="font-bold text-base">Needs Attention</div>
                  <div className="text-xs text-stone-500 font-normal">Requires wash or repair</div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Keys back */}
          <div
            onClick={() => setKeysReturned(!keysReturned)}
            className="cursor-pointer bg-stone-50 hover:bg-stone-100 transition rounded-2xl p-5 border-2 border-stone-200 flex items-center gap-4"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white transition ${
                keysReturned ? "bg-emerald-600" : "bg-stone-300"
              }`}
            >
              {keysReturned && <CheckIcon size={22} />}
            </div>
            <div>
              <div className="text-lg font-bold text-stone-900">
                Step 3 • Keys returned to garage key hook
              </div>
              <p className="text-sm text-stone-500 font-medium">
                The driver has handed over all key fobs
              </p>
            </div>
          </div>

          {/* Actions */}
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
              disabled={submitting || !keysReturned}
              className="flex-1 w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Finishing Return...</span>
              ) : (
                <>
                  <CheckIcon size={24} />
                  <span>Complete Return & Release Car</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
