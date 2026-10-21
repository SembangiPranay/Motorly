import React, { useState, useMemo } from "react"
import type { Car } from "../types"
import {
  CarIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ShieldIcon,
  LocationIcon,
  SparklesIcon,
  ZapIcon,
  TagIcon,
} from "../components/Icons"

interface CompareViewProps {
  cars: Car[]
  compareIds: string[]
  setCompareIds: React.Dispatch<React.SetStateAction<string[]>>
  onSelectCar: (carId: string) => void
  onQuickBook: (carId: string) => void
  onNavigateHome: () => void
  onNavigateListing: () => void
}

export default function CompareView({
  cars,
  compareIds,
  setCompareIds,
  onSelectCar,
  onQuickBook,
  onNavigateHome,
  onNavigateListing,
}: CompareViewProps) {
  // If no vehicles are selected, default to top 2 or 3 vehicles so it is NEVER blank or empty
  const activeComparedCars = useMemo(() => {
    const valid = cars.filter((c) => compareIds.includes(c.id))
    if (valid.length >= 2) return valid
    if (valid.length === 1) {
      // Pick another car from fleet that isn't this one
      const other = cars.find((c) => c.id !== valid[0].id)
      return other ? [valid[0], other] : valid
    }
    // Default fallback: first 3 available cars
    return cars.slice(0, 3)
  }, [cars, compareIds])

  // Head-to-Head quick presets
  const presets = [
    {
      name: "Luxury Sport Sedans",
      ids: ["bmw-3-series", "mercedes-c-class"],
    },
    {
      name: "Executive & Electric",
      ids: ["tesla-model-3", "porsche-taycan"],
    },
    {
      name: "Premium SUVs",
      ids: ["audi-q5", "porsche-macan", "toyota-highlander"],
    },
  ]

  const handleApplyPreset = (presetIds: string[]) => {
    const matched = cars.filter((c) =>
      presetIds.some(
        (p) =>
          c.id.toLowerCase().includes(p) ||
          c.model.toLowerCase().includes(p) ||
          c.brand.toLowerCase().includes(p),
      ),
    )
    if (matched.length >= 2) {
      setCompareIds(matched.map((m) => m.id))
    } else {
      setCompareIds(cars.slice(0, 3).map((c) => c.id))
    }
  }

  const handleRemoveCar = (carId: string) => {
    if (activeComparedCars.length <= 2) {
      // If only 2 cars, swap with another car
      const remainingCar = activeComparedCars.find((c) => c.id !== carId)
      const replacement = cars.find(
        (c) => c.id !== carId && c.id !== remainingCar?.id,
      )
      if (remainingCar && replacement) {
        setCompareIds([remainingCar.id, replacement.id])
      }
      return
    }
    setCompareIds((prev) => prev.filter((id) => id !== carId))
  }

  const handleSwapCar = (oldCarId: string, newCarId: string) => {
    setCompareIds((prev) => {
      const filtered = prev.filter((id) => id !== oldCarId)
      if (!filtered.includes(newCarId)) {
        return [...filtered, newCarId]
      }
      return filtered
    })
  }

  const handleAddCar = (newCarId: string) => {
    if (!compareIds.includes(newCarId)) {
      setCompareIds((prev) => [...prev, newCarId])
    }
  }

  // Feature matrix checklist keys
  const COMMON_FEATURES = [
    { name: "Apple CarPlay & Android Auto", key: "Apple CarPlay" },
    { name: "Bluetooth Audio & Handsfree", key: "Bluetooth" },
    { name: "Backup Camera & Park Assist", key: "Backup Camera" },
    { name: "Built-in GPS Navigation", key: "Navigation" },
    { name: "Leather / Premium Seating", key: "Leather Seats" },
    { name: "Panoramic Sunroof", key: "Sunroof" },
    { name: "Adaptive Cruise Control", key: "Adaptive Cruise" },
    { name: "Heated Front Seats", key: "Heated Seats" },
    { name: "Keyless Push-Button Start", key: "Keyless" },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateListing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#F97316] transition"
          >
            <ArrowLeftIcon size={14} /> Back to Fleet Listing
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">
              Comparing {activeComparedCars.length} of 4 Max
            </span>
            <button
              onClick={() => setCompareIds(cars.slice(0, 2).map((c) => c.id))}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline decoration-stone-300"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Hero Title Section */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#F97316] border border-orange-200 mb-3">
                <SparklesIcon size={14} />
                <span>Side-by-Side Fleet Comparison</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17191C] font-heading">
                Vehicle Comparison Studio
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
                Compare official rental rates, seating capacity, fuel
                efficiency, insurance coverage, and garage hub staging side by
                side before reserving.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 shrink-0">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2 font-mono">
                ⚡ Quick Match Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p.ids)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-medium text-stone-700 hover:text-[#F97316] transition shadow-xs"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Swipe Guidance Banner */}
        <div className="flex sm:hidden items-center justify-between px-4 py-2.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl text-xs font-bold text-[#EA580C]">
          <span>👉 Swipe horizontally to compare models</span>
          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-orange-200">
            {activeComparedCars.length} models
          </span>
        </div>

        {/* Comparison Table / Grid */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                {/* Vehicle Cards Header */}
                <tr className="border-b border-stone-200 bg-stone-50/70">
                  <th className="p-5 w-52 sm:w-64 align-top text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                    <div className="space-y-1">
                      <span className="text-stone-900 font-black text-sm block">
                        Fleet Asset Details
                      </span>
                      <span>Switch or replace vehicle below</span>
                    </div>
                  </th>

                  {activeComparedCars.map((car, idx) => (
                    <th
                      key={car.id}
                      className="p-5 min-w-[260px] max-w-[320px] align-top border-l border-stone-200"
                    >
                      <div className="space-y-3">
                        {/* Dropdown Vehicle Selector & Remove */}
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={car.id}
                            onChange={(e) =>
                              handleSwapCar(car.id, e.target.value)
                            }
                            className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                          >
                            {cars.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (${c.pricePerDay}/day)
                              </option>
                            ))}
                          </select>
                          {activeComparedCars.length > 2 && (
                            <button
                              onClick={() => handleRemoveCar(car.id)}
                              className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-400 text-xs font-bold transition flex items-center justify-center shrink-0"
                              title="Remove from comparison"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Vehicle Image */}
                        <div className="h-36 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative group">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-stone-800 shadow-xs">
                            {car.type}
                          </span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#17191C]/80 text-amber-400 backdrop-blur-xs">
                            {car.plateNumber || "FL-MTR"}
                          </span>
                        </div>

                        {/* Vehicle Title & Daily Price */}
                        <div>
                          <h3 className="font-bold text-base text-stone-900 font-heading">
                            {car.name}
                          </h3>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-[#F97316] font-mono">
                              ${car.pricePerDay}
                            </span>
                            <span className="text-xs font-medium text-stone-400">
                              /day
                            </span>
                            <span className="text-xs font-mono text-stone-500 ml-2">
                              (${car.pricePerHour}/hr)
                            </span>
                          </div>
                        </div>

                        {/* Direct Reserve CTA */}
                        <div className="space-y-1.5 pt-1">
                          <button
                            onClick={() => onQuickBook(car.id)}
                            className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            Reserve This Car <ArrowRightIcon size={14} />
                          </button>
                          <button
                            onClick={() => onSelectCar(car.id)}
                            className="w-full py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
                          >
                            View Full Spec Sheet
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Add Slot Column if < 4 */}
                  {activeComparedCars.length < 4 && (
                    <th className="p-5 w-48 align-middle text-center border-l border-stone-200 bg-stone-50/40">
                      <div className="p-4 border-2 border-dashed border-stone-200 rounded-2xl text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto">
                          <CarIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-stone-800">
                            Add Vehicle
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Compare up to 4 models
                          </p>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAddCar(e.target.value)
                          }}
                          defaultValue=""
                          className="w-full text-xs px-2 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs"
                        >
                          <option value="" disabled>
                            + Select Model...
                          </option>
                          {cars
                            .filter(
                              (c) =>
                                !activeComparedCars.some(
                                  (ac) => ac.id === c.id,
                                ),
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {/* SECTION 1: RATES & FINANCIALS */}
                <tr className="bg-stone-100/60 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={activeComparedCars.length + 2}
                    className="px-5 py-2.5 text-stone-800"
                  >
                    1. Rates &amp; Payment Options
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Daily Rate (24h)
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono font-bold text-stone-900"
                    >
                      ${c.pricePerDay}.00
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Hourly Flex Rate
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono font-bold text-stone-700"
                    >
                      ${c.pricePerHour}.00 / hr
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Weekly Rate (7 Days)
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono text-stone-700"
                    >
                      ${Math.round(c.pricePerDay * 7 * 0.9)}.00 (10% Off)
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Protection &amp; Damage Waiver
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 text-emerald-700 font-semibold"
                    >
                      ✓ Included ($0 Liability)
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>

                {/* SECTION 2: POWERTRAIN & PERFORMANCE */}
                <tr className="bg-stone-100/60 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={activeComparedCars.length + 2}
                    className="px-5 py-2.5 text-stone-800"
                  >
                    2. Powertrain &amp; Engineering
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Fuel / Powertrain
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-medium text-stone-800"
                    >
                      {c.fuelType}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Transmission
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-medium text-stone-800"
                    >
                      {c.transmission}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Fuel Efficiency / Range
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono font-bold text-[#F97316]"
                    >
                      {c.mileage}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Model Year
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono text-stone-800"
                    >
                      {c.year}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>

                {/* SECTION 3: CAPACITY & SPACE */}
                <tr className="bg-stone-100/60 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={activeComparedCars.length + 2}
                    className="px-5 py-2.5 text-stone-800"
                  >
                    3. Passenger &amp; Luggage Capacity
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Seating Capacity
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-medium text-stone-800"
                    >
                      {c.seats} Passengers
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Luggage Capacity
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-medium text-stone-800"
                    >
                      {c.luggage}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Body Style
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-medium text-stone-800"
                    >
                      {c.type}
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>

                {/* SECTION 4: INSURANCE & FLEET TELEMETRY (7-Phase Flow A & B) */}
                <tr className="bg-stone-100/60 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={activeComparedCars.length + 2}
                    className="px-5 py-2.5 text-stone-800"
                  >
                    4. Commercial Insurance &amp; Garage Hub Location
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Insurance Coverage
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 text-stone-800 text-[11px]"
                    >
                      <span className="font-semibold block">
                        {c.insuranceProvider || "Geico Commercial Fleet"}
                      </span>
                      <span className="font-mono text-stone-400">
                        {c.insurancePolicy || "POL-FL-883201"}
                      </span>
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Garage Hub &amp; Bay
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 text-[11px]"
                    >
                      <span className="font-semibold text-stone-900 block truncate max-w-[200px]">
                        {c.garageName || "Central Airport Hub"}
                      </span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                        {c.garageBay || "Bay 14-B"}
                      </span>
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Current Baseline Odometer
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 font-mono text-stone-800"
                    >
                      {(c.currentOdometer || 14200).toLocaleString()} mi
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-stone-500">
                    Health &amp; Sanitation
                  </td>
                  {activeComparedCars.map((c) => (
                    <td
                      key={c.id}
                      className="px-5 py-3 border-l border-stone-100 text-emerald-700 font-bold"
                    >
                      ✓ {c.healthScore || 98}% Certified Sanitized
                    </td>
                  ))}
                  {activeComparedCars.length < 4 && (
                    <td className="border-l border-stone-100" />
                  )}
                </tr>

                {/* SECTION 5: FEATURES & AMENITIES CHECKLIST */}
                <tr className="bg-stone-100/60 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                  <td
                    colSpan={activeComparedCars.length + 2}
                    className="px-5 py-2.5 text-stone-800"
                  >
                    5. Technology &amp; Comfort Amenities
                  </td>
                </tr>
                {COMMON_FEATURES.map((feature) => (
                  <tr key={feature.key}>
                    <td className="px-5 py-3 font-semibold text-stone-600">
                      {feature.name}
                    </td>
                    {activeComparedCars.map((c) => {
                      const hasFeature =
                        c.features &&
                        c.features.some((f) =>
                          f.toLowerCase().includes(feature.key.toLowerCase()),
                        )
                      return (
                        <td
                          key={c.id}
                          className="px-5 py-3 border-l border-stone-100 font-semibold"
                        >
                          {hasFeature ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <CheckIcon size={12} /> Included
                            </span>
                          ) : (
                            <span className="text-stone-300 font-mono">—</span>
                          )}
                        </td>
                      )
                    })}
                    {activeComparedCars.length < 4 && (
                      <td className="border-l border-stone-100" />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
