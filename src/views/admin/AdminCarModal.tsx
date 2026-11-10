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
  ClockIcon,
  CalendarIcon,
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

const SECURITY_DEPOSIT_PRESETS = [
  { value: 500, label: "€500", desc: "Economy / Compact" },
  { value: 800, label: "€800", desc: "Standard Sedan" },
  { value: 1200, label: "€1,200", desc: "Premium / Executive" },
  { value: 1800, label: "€1,800", desc: "Luxury SUV / 4x4" },
  { value: 2500, label: "€2,500", desc: "High Performance" },
  { value: 3500, label: "€3,500", desc: "Supercar / Exotic" },
]

const GALLERY_PRESETS = [
  {
    name: "Front Dynamic Angle",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Rear 3/4 Perspective",
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cockpit Interior",
    url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Side Profile Aerodynamic",
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Executive Cabin Detail",
    url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Sport Rim & Calipers",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
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

  // 4 Time Period Pricing Rates
  const [pricePerHour, setPricePerHour] = useState<number>(
    car?.pricePerHour || Math.max(1, Math.round((car?.pricePerDay || 75) / 8))
  )
  const [pricePerDay, setPricePerDay] = useState<number>(car?.pricePerDay || 75)
  const [pricePerWeek, setPricePerWeek] = useState<number>(
    car?.pricePerWeek || Math.round((car?.pricePerDay || 75) * 6)
  )
  const [pricePerMonth, setPricePerMonth] = useState<number>(
    car?.pricePerMonth || Math.round((car?.pricePerDay || 75) * 22)
  )

  const [vatRate, setVatRate] = useState<number>(
    car?.vatRate != null ? car.vatRate : 18
  )
  const [securityDeposit, setSecurityDeposit] = useState<number>(
    car?.securityDeposit != null
      ? car.securityDeposit
      : car?.type === "Luxury"
      ? 2500
      : car?.type === "SUV"
      ? 1500
      : car?.type === "Economy"
      ? 500
      : 1000
  )
  const [seats, setSeats] = useState<number>(car?.seats || 5)
  const [transmission, setTransmission] = useState<Transmission>(
    car?.transmission || "Automatic"
  )
  const [fuelType, setFuelType] = useState<FuelType>(car?.fuelType || "Petrol")
  const [garageBay, setGarageBay] = useState(car?.garageBay || "Bay 14-A")

  // Multi-Photo Gallery Studio State
  const initialGallery: string[] =
    Array.isArray(car?.gallery) && car.gallery.length > 0
      ? car.gallery
      : car?.image
      ? [car.image]
      : [
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        ]

  const [gallery, setGallery] = useState<string[]>(initialGallery)
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [activePreviewIdx, setActivePreviewIdx] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations for live preview across all 4 time periods
  const validHourly = Math.max(0, pricePerHour || 0)
  const validDaily = Math.max(0, pricePerDay || 0)
  const validWeekly = Math.max(0, pricePerWeek || 0)
  const validMonthly = Math.max(0, pricePerMonth || 0)
  const validVat = Math.max(0, vatRate || 0)
  const validDeposit = Math.max(0, securityDeposit || 0)

  const handleDailyChange = (val: number) => {
    setPricePerDay(val)
    if (!isEditing || !car?.pricePerHour) {
      setPricePerHour(Math.max(1, Math.round(val / 8)))
    }
    if (!isEditing || !car?.pricePerWeek) {
      setPricePerWeek(Math.round(val * 6))
    }
    if (!isEditing || !car?.pricePerMonth) {
      setPricePerMonth(Math.round(val * 22))
    }
  }

  const handleAddPhoto = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || newPhotoUrl).trim()
    if (!targetUrl) return
    if (gallery.includes(targetUrl)) {
      alert("This image is already in the vehicle gallery.")
      return
    }
    setGallery((prev) => [...prev, targetUrl])
    if (!urlToAdd) setNewPhotoUrl("")
  }

  const handleRemovePhoto = (index: number) => {
    if (gallery.length <= 1) {
      alert("A vehicle must retain at least one photo.")
      return
    }
    setGallery((prev) => prev.filter((_, idx) => idx !== index))
    if (activePreviewIdx >= gallery.length - 1) {
      setActivePreviewIdx(Math.max(0, gallery.length - 2))
    }
  }

  const handleSetPrimaryPhoto = (index: number) => {
    if (index === 0) return
    setGallery((prev) => {
      const selected = prev[index]
      const remaining = prev.filter((_, idx) => idx !== index)
      return [selected, ...remaining]
    })
    setActivePreviewIdx(0)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
      const primaryCover =
        gallery[0] ||
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"

      await onSave({
        name: name.trim(),
        brand: inferredBrand,
        model: inferredModel,
        type,
        year: Number(year) || 2024,
        plateNumber: plateNumber.trim().toUpperCase() || `FL-${Math.floor(100 + Math.random() * 900)}-MTR`,
        pricePerHour: Number(validHourly) || Math.max(1, Math.round(validDaily / 8)),
        pricePerDay: Number(validDaily) || 75,
        pricePerWeek: Number(validWeekly) || Math.round(validDaily * 6),
        pricePerMonth: Number(validMonthly) || Math.round(validDaily * 22),
        vatRate: Number(validVat),
        securityDeposit: Number(validDeposit) || 1000,
        seats: Number(seats) || 5,
        transmission,
        fuelType,
        garageBay: garageBay.trim() || "Bay 1",
        image: primaryCover,
        gallery: gallery.length > 0 ? gallery : [primaryCover],
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
      className="fixed inset-0 z-50 bg-[#F7F7F8] flex flex-col h-screen w-screen overflow-hidden animate-fadeIn"
    >
      {/* 1. Full-Screen Studio Header */}
      <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>← Back to Fleet</span>
          </button>
          <div className="h-5 w-px bg-stone-200 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
              <CarIcon size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                Atelier Fleet Specification Studio
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 leading-tight">
                {isEditing ? `Edit Vehicle: ${car?.name}` : "New Vehicle Studio Specification"}
              </h2>
            </div>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Spec Synchronizer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckIcon size={14} />
            <span>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Publish to Fleet"}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Full-Screen Workspace Body (2-Column Studio Grid) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Comprehensive Vehicle Specifications & Pricing */}
          <form
            id="vehicle-form"
            onSubmit={handleSubmit}
            className="lg:col-span-7 space-y-6"
          >
            {/* Section 1: Vehicle Identity & Classification */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <TagIcon size={14} className="text-orange-600" />
                  1. Vehicle Identity & Classification
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">Core Registry</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Vehicle Make & Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Audi A4 Sport Sedan or BMW 330i M Sport"
                  className="w-full h-10 px-3.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category / Body Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full h-10 px-3 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 font-semibold"
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. FL-992-MTR"
                    className="w-full h-10 px-3 text-xs font-mono font-bold uppercase bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Production Year
                  </label>
                  <input
                    type="number"
                    min="2018"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                    className="w-full h-10 px-3 text-xs font-bold bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Technical Specifications & Garage Bay Allocation */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldIcon size={14} className="text-stone-600" />
                  2. Technical Specifications & Garage Bay
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">Engineering</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Transmission
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as Transmission)}
                    className="w-full h-10 px-3 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 font-semibold"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full h-10 px-3 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 font-semibold"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={seats}
                    onChange={(e) => setSeats(parseInt(e.target.value) || 5)}
                    className="w-full h-10 px-3 text-xs font-bold bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Assigned Bay
                  </label>
                  <input
                    type="text"
                    value={garageBay}
                    onChange={(e) => setGarageBay(e.target.value)}
                    placeholder="e.g. Bay 14-A"
                    className="w-full h-10 px-3 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Four Time-Period Pricing (Hourly, Daily, Weekly, Monthly) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <SparklesIcon size={14} className="text-orange-600" />
                  3. Four Time-Period Pricing Rates
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                  All 4 Tiers Supported
                </span>
              </div>

              {/* 4 Time Period Input Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Hourly */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <ClockIcon size={12} className="text-stone-500" />
                    Hourly (€/hr)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 pl-6 pr-2 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">Same-day flex</span>
                </div>

                {/* 2. Daily */}
                <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200">
                  <label className="block text-[11px] font-bold text-orange-950 mb-1 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-orange-600" />
                    Daily (€/day) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-600 font-bold">€</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={pricePerDay}
                      onChange={(e) => handleDailyChange(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 pl-6 pr-2 text-xs font-black bg-white rounded-lg border border-orange-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <span className="text-[10px] text-orange-700 font-bold mt-1 block">Primary daily base</span>
                </div>

                {/* 3. Weekly */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <TagIcon size={12} className="text-stone-500" />
                    Weekly (€/wk)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={pricePerWeek}
                      onChange={(e) => setPricePerWeek(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 pl-6 pr-2 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold mt-1 block">7+ days discount</span>
                </div>

                {/* 4. Monthly */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <SparklesIcon size={12} className="text-stone-500" />
                    Monthly (€/mo)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={pricePerMonth}
                      onChange={(e) => setPricePerMonth(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 pl-6 pr-2 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">30+ days long-term</span>
                </div>
              </div>

              {/* Dynamic Vehicle VAT Rate */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900">Dynamic Vehicle VAT Rate</span>
                    <p className="text-[11px] text-stone-500">
                      Applied dynamically to this vehicle at checkout and invoice generation.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      required
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-20 h-9 px-2 text-sm font-black text-right bg-white rounded-lg border border-orange-300 text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-stone-600">%</span>
                  </div>
                </div>

                {/* Quick Select VAT Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {VAT_PRESETS.map((preset) => {
                    const isSelected = vatRate === preset.value
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setVatRate(preset.value)}
                        className={`p-2 rounded-xl text-left transition border cursor-pointer ${
                          isSelected
                            ? "bg-orange-600 text-white border-orange-600 shadow-2xs font-bold"
                            : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold leading-none">{preset.label}</div>
                        <div
                          className={`text-[9px] mt-1 leading-tight truncate ${
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

              {/* Dynamic Vehicle Security Deposit (Refundable Hold Value) */}
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ShieldIcon size={14} className="text-stone-800" />
                      <span className="text-xs font-bold text-stone-900">
                        Refundable Security Deposit Money Value
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Specific pre-authorization hold on customer card at pickup. 100% released within 48-72h of return.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">€</span>
                      <input
                        type="number"
                        min="100"
                        max="25000"
                        step="50"
                        required
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-28 h-9 pl-6 pr-2 text-sm font-black text-right bg-white rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Select Security Deposit Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {SECURITY_DEPOSIT_PRESETS.map((preset) => {
                    const isSelected = securityDeposit === preset.value
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSecurityDeposit(preset.value)}
                        className={`p-2 rounded-xl text-left transition border cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white border-stone-900 shadow-2xs font-bold"
                            : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold leading-none">{preset.label}</div>
                        <div
                          className={`text-[9px] mt-1 leading-tight truncate ${
                            isSelected ? "text-stone-300" : "text-stone-400"
                          }`}
                        >
                          {preset.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Photography & Multi-Angle Asset Media Studio */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ZapIcon size={14} className="text-orange-600" />
                  4. Vehicle Photo Gallery & Multi-Angle Media
                </span>
                <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {gallery.length} {gallery.length === 1 ? "Photo" : "Photos"} Configured
                </span>
              </div>

              {/* Current Gallery Filmstrip */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700">
                    Vehicle Photo Strip (Cover & Additional Angles)
                  </label>
                  <span className="text-[10px] text-stone-400">
                    First photo is primary cover displayed in customer catalog
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((photoUrl, idx) => {
                    const isPrimary = idx === 0
                    const isSelectedForPreview = activePreviewIdx === idx

                    return (
                      <div
                        key={`${photoUrl}-${idx}`}
                        className={`relative group rounded-xl border overflow-hidden bg-stone-100 transition ${
                          isSelectedForPreview
                            ? "border-orange-500 ring-2 ring-orange-400/40"
                            : isPrimary
                            ? "border-emerald-500 ring-1 ring-emerald-400/30"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="relative aspect-4/3 overflow-hidden bg-stone-900">
                          <img
                            src={photoUrl}
                            alt={`Angle ${idx + 1}`}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"
                            }}
                          />
                          {/* Badge: Primary / Index */}
                          <div className="absolute top-1.5 left-1.5">
                            {isPrimary ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                                ★ Primary Cover
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-900/80 text-white backdrop-blur-xs">
                                Angle #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Quick delete button */}
                          {gallery.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center text-xs font-bold transition shadow-2xs cursor-pointer opacity-90 group-hover:opacity-100"
                              title="Remove photo from gallery"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Bottom Actions under thumbnail */}
                        <div className="p-2 bg-white flex items-center justify-between gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setActivePreviewIdx(idx)}
                            className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                              isSelectedForPreview
                                ? "bg-orange-100 text-orange-800"
                                : "text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            {isSelectedForPreview ? "Active" : "Preview"}
                          </button>

                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(idx)}
                              className="px-2 py-1 rounded font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                              title="Promote this photo to primary cover"
                            >
                              Make Cover
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add Photo Input */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Add High-Res Photo by URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddPhoto()
                      }
                    }}
                    placeholder="Paste high-res image URL (e.g. https://images.unsplash.com/...)"
                    className="flex-1 h-10 px-3.5 text-xs bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPhoto()}
                    disabled={!newPhotoUrl.trim()}
                    className="px-4 h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shrink-0 disabled:opacity-40 cursor-pointer"
                  >
                    + Add Photo
                  </button>
                </div>
              </div>

              {/* Quick Studio Presets */}
              <div className="pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-600 mb-1.5">
                  Curated Studio Angles (Click to Append to Gallery)
                </label>
                <div className="flex flex-wrap gap-2">
                  {GALLERY_PRESETS.map((preset) => {
                    const alreadyAdded = gallery.includes(preset.url)
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPhoto(preset.url)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
                          alreadyAdded
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                            : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
                        }`}
                      >
                        <span>{alreadyAdded ? "✓ Added" : "+ Add"}</span>
                        <span>{preset.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Form Bottom Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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

          {/* Right Column (5 cols): Sticky Live Digital Twin & Billing Computation */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
            {/* Live Vehicle Digital Twin Preview */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
              <div className="relative h-52 w-full bg-stone-100 overflow-hidden">
                <img
                  src={gallery[activePreviewIdx] || gallery[0]}
                  alt={name || "Vehicle Preview"}
                  className="w-full h-full object-cover transition duration-300"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                    {car?.status || "Available"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-900/80 backdrop-blur-xs text-white">
                    {type}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="bg-stone-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-xs font-mono font-black border border-stone-700 shadow-2xs">
                    {plateNumber || "FL-NEW-MTR"}
                  </span>
                  <span className="bg-orange-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-2xs">
                    VAT {validVat}%
                  </span>
                  <span className="bg-stone-900/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-xs font-bold border border-stone-700 shadow-2xs">
                    Dep €{validDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Gallery Angle Switcher under preview */}
              {gallery.length > 1 && (
                <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-2 overflow-x-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 shrink-0">
                    Angle {activePreviewIdx + 1} of {gallery.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {gallery.map((imgUrl, i) => (
                      <button
                        key={`thumb-${i}`}
                        type="button"
                        onClick={() => setActivePreviewIdx(i)}
                        className={`w-9 h-7 rounded border overflow-hidden transition shrink-0 cursor-pointer ${
                          activePreviewIdx === i
                            ? "border-orange-500 ring-2 ring-orange-400"
                            : "border-stone-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                      {name || "Untitled Vehicle Specification"}
                    </h3>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {type} • {transmission} • {fuelType} • {seats} Seats
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-stone-900">
                      €{validDaily.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-stone-400">per day base</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <span>Assigned Bay: <strong>{garageBay || "Bay 1"}</strong></span>
                  <span>Model Year: <strong>{year}</strong></span>
                </div>
              </div>
            </div>

            {/* Live 4-Period Customer Checkout Billing Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                  <InfoIcon size={14} className="text-orange-600" />
                  Live Customer Pricing By Time Period
                </span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Dynamic {validVat}% VAT Included
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Hourly Tier */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <ClockIcon size={12} className="text-stone-400" />
                      Hourly Flex Rate (3 Hours Example)
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Base: €{(validHourly * 3).toFixed(2)} + VAT: €{((validHourly * 3) * (validVat / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right font-black text-stone-900 text-sm">
                    €{((validHourly * 3) * (1 + validVat / 100)).toFixed(2)}
                  </div>
                </div>

                {/* Daily Tier */}
                <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-orange-950 flex items-center gap-1">
                      <CalendarIcon size={12} className="text-orange-600" />
                      Daily Standard Rate (1 Day / 24 Hours)
                    </div>
                    <div className="text-[11px] text-orange-800 mt-0.5">
                      Base: €{validDaily.toFixed(2)} + VAT: €{(validDaily * (validVat / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right font-black text-orange-600 text-base">
                    €{(validDaily * (1 + validVat / 100)).toFixed(2)}
                  </div>
                </div>

                {/* Weekly Tier */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <TagIcon size={12} className="text-blue-600" />
                      Weekly Extended Rate (7 Days)
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Base: €{validWeekly.toFixed(2)} + VAT: €{(validWeekly * (validVat / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right font-black text-blue-700 text-sm">
                    €{(validWeekly * (1 + validVat / 100)).toFixed(2)}
                  </div>
                </div>

                {/* Monthly Tier */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <SparklesIcon size={12} className="text-emerald-600" />
                      Monthly Long-Term Rate (30 Days)
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Base: €{validMonthly.toFixed(2)} + VAT: €{(validMonthly * (validVat / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right font-black text-emerald-700 text-sm">
                    €{(validMonthly * (1 + validVat / 100)).toFixed(2)}
                  </div>
                </div>

                {/* Refundable Deposit Line */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <ShieldIcon size={12} className="text-stone-500" />
                      Refundable Security Deposit
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Temporary pre-authorization hold at counter • 100% refunded
                    </div>
                  </div>
                  <div className="text-right font-black text-stone-900 text-sm">
                    €{validDeposit.toLocaleString()}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 italic pt-1">
                When customer bookings match each duration window, checkout invoices dynamically apply these exact rates, the {validVat}% vehicle VAT, and the vehicle-specific €{validDeposit.toLocaleString()} security deposit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
