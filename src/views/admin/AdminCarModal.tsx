import React, { useState } from "react"
import type { Car, VehicleType, Transmission, FuelType } from "../../types"
import { CarIcon, CheckIcon } from "../../components/Icons"

interface AdminCarModalProps {
  car: Car | null
  onSave: (carData: Partial<Car>) => Promise<void>
  onClose: () => void
}

export default function AdminCarModal({
  car,
  onSave,
  onClose,
}: AdminCarModalProps) {
  const isEditing = Boolean(car)

  const [name, setName] = useState(car?.name || "")
  const [type, setType] = useState<VehicleType>(car?.type || "Sedan")
  const [plateNumber, setPlateNumber] = useState(car?.plateNumber || "")
  const [pricePerDay, setPricePerDay] = useState<number>(car?.pricePerDay || 75)
  const [seats, setSeats] = useState<number>(car?.seats || 5)
  const [transmission, setTransmission] = useState<Transmission>(
    car?.transmission || "Automatic"
  )
  const [fuelType, setFuelType] = useState<FuelType>(car?.fuelType || "Petrol")
  const [image, setImage] = useState(
    car?.image ||
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert("Please enter a vehicle name.")
      return
    }
    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        type,
        plateNumber: plateNumber.trim().toUpperCase(),
        pricePerDay,
        seats,
        transmission,
        fuelType,
        image: image.trim(),
      })
    } catch (err: any) {
      alert("Failed to save vehicle: " + err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <CarIcon size={16} />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              {isEditing ? `Edit Vehicle: ${car?.name}` : "Add New Vehicle to Fleet"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Vehicle Make & Model Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Audi A4 Sport Sedan"
              className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Luxury">Luxury</option>
                <option value="Economy">Economy</option>
                <option value="Van">Van</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                License Plate
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="e.g. FL-992-MTR"
                className="w-full h-9 px-3 text-xs font-mono uppercase bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Rate / Day (€)
              </label>
              <input
                type="number"
                min="1"
                required
                value={pricePerDay}
                onChange={(e) => setPricePerDay(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-xs font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as Transmission)}
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Seats
              </label>
              <input
                type="number"
                min="1"
                max="9"
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value) || 5)}
                className="w-full h-9 px-3 text-xs font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Vehicle Image URL
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            {image && (
              <div className="mt-2 h-24 w-full rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
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
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
