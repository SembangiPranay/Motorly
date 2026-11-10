import React, { useState } from "react"
import type { Car, VehicleType, Transmission, FuelType } from "../../types"
import {
  CarIcon,
  CheckIcon,
  TagIcon,
  SparklesIcon,
  ShieldIcon,
  ZapIcon,
  InfoIcon,
} from "../../components/Icons"

interface AdminCarModalProps {
  car: Car | null
  onSave: (carData: Partial<Car>) => Promise<void>
  onClose: () => void
}

const VAT_PRESETS = [
  { value: 0, label: "0% Exempt", desc: "Government / Diplomatic" },
  { value: 5, label: "5% Concession", desc: "Green / EV Incentive" },
  { value: 10, label: "10% Reduced", desc: "Tourism / Domestic" },
  { value: 15, label: "15% Tier-2", desc: "Interstate Commercial" },
  { value: 18, label: "18% Standard", desc: "Default Fleet Tier" },
  { value: 20, label: "20% Luxury", desc: "High-Performance / VIP" },
]

const IMAGE_PRESETS = [
  {
    name: "Executive Sedan",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Premium SUV",
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Electric Sport",
    url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Luxury Tourer",
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "4x4 Adventure",
    url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function AdminCarModal({
  car,
  onSave,
  onClose,
}: AdminCarModalProps) {
  const isEditing = Boolean(car)

  const [name, setName] = useState(car?.name || "")
  const [brand, setBrand] = useState(car?.brand || "")
  const [model, setModel] = useState(car?.model || "")
  const [type, setType] = useState<VehicleType>(car?.type || "Sedan")
  const [year, setYear] = useState<number>(car?.year || 2024)
  const [plateNumber, setPlateNumber] = useState(car?.plateNumber || "")
  const [pricePerDay, setPricePerDay] = useState<number>(car?.pricePerDay || 75)
  const [pricePerHour, setPricePerHour] = useState<number>(
    car?.pricePerHour || Math.max(1, Math.round((car?.pricePerDay || 75) / 8))
  )
  const [vatRate, setVatRate] = useState<number>(
    car?.vatRate != null ? car.vatRate : 18
  )
  const [seats, setSeats] = useState<number>(car?.seats || 5)
  const [transmission, setTransmission] = useState<Transmission>(
    car?.transmission || "Automatic"
  )
  const [fuelType, setFuelType] = useState<FuelType>(car?.fuelType || "Petrol")
  const [garageBay, setGarageBay] = useState(car?.garageBay || "Bay 14-A")
  const [image, setImage] = useState(
    car?.image ||
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations for live preview
  const validDaily = Math.max(0, pricePerDay || 0)
  const validVat = Math.max(0, vatRate || 0)
  const vatAmount = Number((validDaily * (validVat / 100)).toFixed(2))
  const totalCustomerCost = Number((validDaily + vatAmount).toFixed(2))

  const handleDailyChange = (val: number) => {
    setPricePerDay(val)
    if (!isEditing || !car?.pricePerHour) {
      setPricePerHour(Math.max(1, Math.round(val / 8)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert("Please enter a vehicle make and model name.")
      return
    }

    // Auto infer brand/model if blank
    const inferredBrand = brand.trim() || name.trim().split(" ")[0] || "Custom"
    const inferredModel =
      model.trim() || name.trim().split(" ").slice(1).join(" ") || "Fleet"

    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        brand: inferredBrand,
        model: inferredModel,
        type,
        year: Number(year) || 2024,
        plateNumber: plateNumber.trim().toUpperCase() || `FL-${Math.floor(100 + Math.random() * 900)}-MTR`,
        pricePerDay: Number(validDaily) || 75,
        pricePerHour: Number(pricePerHour) || Math.max(1, Math.round(validDaily / 8)),
        pricePerMonth: Math.round(validDaily * 22),
        vatRate: Number(validVat),
        seats: Number(seats) || 5,
        transmission,
        fuelType,
        garageBay: garageBay.trim() || "Bay 1",
        image: image.trim(),
        status: car?.status || "Available",
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black shadow-2xs">
              <CarIcon size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                Atelier Fleet Asset Manager
              </div>
              <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                {isEditing ? `Edit Vehicle: ${car?.name}` : "Add New Vehicle to Fleet"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Vehicle Identity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TagIcon size={13} className="text-stone-500" />
                1. Vehicle Identity & Classification
              </span>
              <span className="text-[10px] text-stone-400">Core Registry</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Vehicle Make & Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Audi A4 Sport Sedan or BMW 330i M Sport"
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Category / Body Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-semibold"
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
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. FL-992-MTR"
                    className="w-full h-9 px-3 text-xs font-mono font-bold uppercase bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Production Year
                  </label>
                  <input
                    type="number"
                    min="2018"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                    className="w-full h-9 px-3 text-xs font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Technical Specifications & Garage Bay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldIcon size={13} className="text-stone-500" />
                2. Technical Specifications & Garage Bay
              </span>
              <span className="text-[10px] text-stone-400">Engineering</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Transmission
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as Transmission)}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-semibold"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-semibold"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
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

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Assigned Bay
                </label>
                <input
                  type="text"
                  value={garageBay}
                  onChange={(e) => setGarageBay(e.target.value)}
                  placeholder="e.g. Bay 14-A"
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Dynamic VAT Engine */}
          <div className="space-y-3 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <SparklesIcon size={14} className="text-orange-600" />
                3. Pricing Structure & Dynamic Vehicle VAT
              </span>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                Configurable per Vehicle
              </span>
            </div>

            {/* Rates & VAT Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Base Daily Rate (€) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={pricePerDay}
                    onChange={(e) => handleDailyChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 pl-7 pr-3 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Hourly Rate (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 pl-7 pr-3 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-900 mb-1 flex items-center justify-between">
                  <span>Dynamic Vehicle VAT</span>
                  <span className="text-orange-600 font-extrabold">{validVat}%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 pl-3 pr-7 text-xs font-black bg-white rounded-lg border border-orange-300 text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Quick VAT Preset Pills */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Quick Select VAT Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                {VAT_PRESETS.map((preset) => {
                  const isSelected = vatRate === preset.value
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setVatRate(preset.value)}
                      className={`px-2 py-1.5 rounded-lg text-left transition border cursor-pointer ${
                        isSelected
                          ? "bg-orange-600 text-white border-orange-600 shadow-2xs font-bold"
                          : "bg-white text-stone-700 hover:bg-stone-100 border-stone-200"
                      }`}
                    >
                      <div className="text-[11px] font-extrabold leading-none">{preset.label}</div>
                      <div
                        className={`text-[9px] mt-0.5 leading-tight truncate ${
                          isSelected ? "text-orange-100" : "text-stone-400"
                        }`}
                      >
                        {preset.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Calculation Receipt Box */}
            <div className="mt-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-800 font-bold text-[11px]">
                <span className="flex items-center gap-1 text-stone-600">
                  <InfoIcon size={13} className="text-orange-500" />
                  Customer Checkout Preview (1 Day Rental)
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Calculated in Real-Time</span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Base Vehicle Rate (1 Day):</span>
                  <span className="font-mono font-semibold">€{validDaily.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dynamic VAT Rate ({validVat}%):</span>
                  <span className="font-mono font-semibold text-orange-700">+€{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-stone-100 text-xs font-black text-stone-900">
                  <span>Final Customer Total:</span>
                  <span className="font-mono text-orange-600 text-sm">€{totalCustomerCost.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 italic pt-1">
                When booked online or via dispatch, this specific {validVat}% VAT will apply to all customer bills and invoices for this vehicle.
              </p>
            </div>
          </div>

          {/* Section 4: Photography & Imagery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ZapIcon size={13} className="text-stone-500" />
                4. Photography & Asset Imagery
              </span>
              <span className="text-[10px] text-stone-400">Media Presets</span>
            </div>

            {/* 1-Click Curated Presets */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Quick 1-Click Studio Photo Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border cursor-pointer ${
                      image === preset.url
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Custom High-Res Image URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            {/* Responsive Live Preview Card */}
            {image && (
              <div className="relative h-32 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
                <img
                  src={image}
                  alt="Vehicle Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback on invalid image url
                    ;(e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                  }}
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="bg-stone-900/90 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-stone-700">
                    {plateNumber || "FL-NEW-MTR"}
                  </span>
                  <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    VAT {validVat}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
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
              className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckIcon size={14} />
              <span>
                {isSubmitting
                  ? "Saving to Fleet..."
                  : isEditing
                  ? "Save Vehicle Specifications"
                  : "Add Vehicle to Fleet"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
