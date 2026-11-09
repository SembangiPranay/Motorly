import React, { useState } from "react"
import type { Car, VehicleType, FuelType, Transmission, CarStatus } from "../../types"
import { CarIcon, CheckIcon, PlusIcon } from "../../components/Icons"

interface ElderlyCarModalProps {
  car?: Car | null // If null, creating new car; if Car, editing existing
  onSave: (carData: Partial<Car>) => Promise<void>
  onClose: () => void
}

const PRESET_PHOTOS = [
  {
    label: "Sedan (White)",
    url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "SUV (Black)",
    url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Luxury (Silver)",
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Electric / EV",
    url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function ElderlyCarModal({
  car,
  onSave,
  onClose,
}: ElderlyCarModalProps) {
  const isEditing = Boolean(car)

  const [name, setName] = useState(car?.name || "")
  const [type, setType] = useState<VehicleType>(car?.type || "Sedan")
  const [plateNumber, setPlateNumber] = useState(car?.plateNumber || "")
  const [pricePerDay, setPricePerDay] = useState(
    car?.pricePerDay ? String(car.pricePerDay) : "65"
  )
  const [image, setImage] = useState(
    car?.image || PRESET_PHOTOS[0].url
  )
  const [transmission, setTransmission] = useState<Transmission>(
    car?.transmission || "Automatic"
  )
  const [fuelType, setFuelType] = useState<FuelType>(car?.fuelType || "Gasoline")
  const [seats, setSeats] = useState(car?.seats ? String(car.seats) : "5")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Please provide a name for the car (e.g. 'Toyota Camry 2024').")
      return
    }
    const priceNum = parseFloat(pricePerDay)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid daily price.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const payload: Partial<Car> = {
        name: name.trim(),
        brand: name.trim().split(" ")[0] || "Motorly",
        model: name.trim().split(" ").slice(1).join(" ") || "Fleet",
        year: car?.year || new Date().getFullYear(),
        type,
        plateNumber: plateNumber.trim().toUpperCase(),
        pricePerDay: priceNum,
        pricePerHour: Math.round(priceNum / 10),
        image: image.trim() || PRESET_PHOTOS[0].url,
        transmission,
        fuelType,
        seats: parseInt(seats, 10) || 5,
        status: car?.status || "Available",
      }
      await onSave(payload)
    } catch (err: any) {
      setError(err?.message || "Failed to save car. Please check fields and try again.")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-modal-title"
    >
      <div className="bg-white text-stone-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-stone-200 animate-fadeIn my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b-2 border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl">
              <CarIcon size={32} />
            </div>
            <div>
              <h2 id="car-modal-title" className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {isEditing ? "Edit Car Details" : "Add a Car to Garage"}
              </h2>
              <p className="text-base text-stone-500 font-medium">
                {isEditing
                  ? "Update pricing, name, and details for this vehicle"
                  : "Fill in the car's basic information below"}
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
          {/* Car Name */}
          <div>
            <label
              htmlFor="car-name-input"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Car Name (Make & Model)
            </label>
            <input
              id="car-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toyota Camry 2024"
              className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:border-emerald-600"
            />
          </div>

          {/* Category & Plate Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="car-type-select"
                className="block text-stone-900 font-bold text-lg mb-1"
              >
                Category / Body Type
              </label>
              <select
                id="car-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
                className="w-full text-lg font-bold px-4 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:border-emerald-600"
              >
                <option value="Sedan">Sedan (Comfortable car)</option>
                <option value="SUV">SUV (Family / Spacious)</option>
                <option value="Luxury">Luxury (Executive)</option>
                <option value="Electric">Electric (EV / Battery)</option>
                <option value="Van">Van / Minivan</option>
                <option value="Economy">Economy</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="car-plate-input"
                className="block text-stone-900 font-bold text-lg mb-1"
              >
                License Plate Number
              </label>
              <input
                id="car-plate-input"
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="e.g. FL-882-MTR"
                className="w-full text-xl font-mono font-bold uppercase px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Daily Price */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border-2 border-emerald-300">
            <label
              htmlFor="car-price-input"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Rental Price Per Day ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-2xl">
                $
              </span>
              <input
                id="car-price-input"
                type="number"
                min="10"
                step="1"
                required
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                className="w-full text-2xl font-black font-mono pl-12 pr-20 py-4 bg-white rounded-2xl border-2 border-emerald-400 text-stone-900 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:border-emerald-600"
                placeholder="65"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">
                / day
              </span>
            </div>
          </div>

          {/* Quick Photo Selector */}
          <div>
            <label className="block text-stone-900 font-bold text-lg mb-2">
              Car Photo
            </label>
            <p className="text-sm text-stone-500 mb-3 font-medium">
              Click a sample photo below, or enter your own picture link:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {PRESET_PHOTOS.map((preset) => {
                const isSelected = image === preset.url
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition group ${
                      isSelected
                        ? "border-emerald-600 ring-4 ring-emerald-500/20"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-16 object-cover"
                    />
                    <div className="p-1.5 bg-white text-xs font-bold text-stone-800 text-center truncate">
                      {preset.label}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Or paste an image web link here"
              className="w-full text-base font-medium px-4 py-3 bg-stone-50 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Transmission & Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="car-trans-select"
                className="block text-stone-900 font-bold text-base mb-1"
              >
                Transmission
              </label>
              <select
                id="car-trans-select"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as Transmission)}
                className="w-full text-base font-bold px-3 py-3 bg-stone-50 rounded-xl border border-stone-300 text-stone-900"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual (Stick shift)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="car-fuel-select"
                className="block text-stone-900 font-bold text-base mb-1"
              >
                Fuel Type
              </label>
              <select
                id="car-fuel-select"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full text-base font-bold px-3 py-3 bg-stone-50 rounded-xl border border-stone-300 text-stone-900"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="car-seats-select"
                className="block text-stone-900 font-bold text-base mb-1"
              >
                Seats
              </label>
              <select
                id="car-seats-select"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full text-base font-bold px-3 py-3 bg-stone-50 rounded-xl border border-stone-300 text-stone-900"
              >
                <option value="2">2 Passenger</option>
                <option value="4">4 Passenger</option>
                <option value="5">5 Passenger</option>
                <option value="7">7 Passenger (Van/SUV)</option>
                <option value="8">8 Passenger</option>
              </select>
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
              disabled={submitting}
              className="flex-1 w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 min-h-[56px] disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving Car...</span>
              ) : (
                <>
                  <CheckIcon size={24} />
                  <span>{isEditing ? "Save Changes" : "Add Car to Garage"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
