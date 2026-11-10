import React, { useState } from "react"
import type { Car } from "../../types"
import { ZapIcon, CarIcon, CheckIcon, UserIcon, PhoneIcon, CalendarIcon } from "../../components/Icons"

interface AdminWalkinViewProps {
  availableCars: Car[]
  onSubmitWalkin: (data: {
    customerName: string
    customerPhone: string
    carId: string
    totalDays: number
    dailyRate: number
    totalPrice: number
  }) => Promise<void>
}

export default function AdminWalkinView({
  availableCars,
  onSubmitWalkin,
}: AdminWalkinViewProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCarId, setSelectedCarId] = useState<string>(
    availableCars[0]?.id || ""
  )
  const [totalDays, setTotalDays] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const selectedCar = availableCars.find((c) => c.id === selectedCarId)
  const dailyRate = selectedCar?.pricePerDay || 50
  const vatRate = selectedCar?.vatRate != null ? selectedCar.vatRate : 18
  const baseRental = dailyRate * totalDays
  const vatAmount = Number((baseRental * (vatRate / 100)).toFixed(2))
  const totalPrice = Number((baseRental + vatAmount).toFixed(2))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      alert("Please enter customer name.")
      return
    }
    if (!customerPhone.trim()) {
      alert("Please enter customer phone number.")
      return
    }
    if (!selectedCarId) {
      alert("Please select an available vehicle.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmitWalkin({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        carId: selectedCarId,
        totalDays,
        dailyRate,
        totalPrice,
      })
      setSuccessNotice(`Booking created and keys dispatched for ${customerName}!`)
      setCustomerName("")
      setCustomerPhone("")
      setTotalDays(1)
      setTimeout(() => setSuccessNotice(null), 5000)
    } catch (err: any) {
      alert("Failed to create walk-in booking: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
            <ZapIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Walk-In Counter Dispatch
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Rapid on-site rental processing. Immediate key handover in under 60 seconds.
            </p>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckIcon size={16} className="text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {availableCars.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-xl p-8 text-center">
          <CarIcon size={32} className="mx-auto text-amber-500 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No Vehicles Available</h3>
          <p className="text-xs text-stone-500 mt-1">
            All vehicles in your fleet are currently rented out or in maintenance. Return an active car or add a new vehicle to dispatch walk-in customers.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
          {/* 1. Customer Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Customer Full Name
            </label>
            <div className="relative">
              <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full h-10 pl-9 pr-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* 2. Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Customer Phone Number
            </label>
            <div className="relative">
              <PhoneIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +1 555-019-9000"
                className="w-full h-10 pl-9 pr-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* 3. Vehicle Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Ready Vehicle
            </label>
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              {availableCars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.plateNumber || "No plate"}) — €{c.pricePerDay}/day
                </option>
              ))}
            </select>
          </div>

          {/* 4. Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Rental Duration (Days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="60"
                value={totalDays}
                onChange={(e) => setTotalDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 h-10 px-3 text-xs text-center font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTotalDays(d)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      totalDays === d
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Calculated Counter Rate
              </span>
              <div className="text-xs text-stone-600 mt-0.5">
                {totalDays} day{totalDays > 1 ? "s" : ""} × €{dailyRate}/day (€{baseRental}) + {vatRate}% VAT (€{vatAmount.toFixed(2)})
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Due Now
              </span>
              <div className="text-xl font-black text-emerald-600">€{totalPrice}</div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
          >
            <CheckIcon size={16} />
            <span>{isSubmitting ? "Dispatching..." : "Instant Dispatch & Hand Over Keys"}</span>
          </button>
        </form>
      )}
    </div>
  )
}
