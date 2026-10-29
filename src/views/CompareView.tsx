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
  PlusIcon,
  TrashIcon,
  SearchIcon,
  StarIcon,
  FuelIcon,
  TransmissionIcon,
  LuggageIcon,
  InfoIcon,
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

interface CommonFeature {
  name: string

  key: string

  category?: string
}

export default function CompareView({
  cars,

  compareIds,

  setCompareIds,

  onSelectCar,

  onQuickBook,

  onNavigateListing,
}: CompareViewProps) {
  if (!cars || cars.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 font-heading">
          {!cars || cars.length === 0
            ? "No Vehicles in Fleet"
            : "Select at Least 2 Vehicles"}
        </h2>
        <p className="text-stone-500 text-sm">
          {!cars || cars.length === 0
            ? "There are currently no vehicles in the fleet catalog to compare."
            : "Vehicle comparison requires at least 2 vehicles to compare side-by-side."}
        </p>
        <button
          onClick={onNavigateListing}
          className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition cursor-pointer text-sm"
        >
          Browse Fleet
        </button>
      </div>
    )
  }

  // Filter toggle: show all specs vs differences only

  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false)

  // Active category filter tab

  const [activeTab, setActiveTab] =
    useState<"all" | "pricing" | "specs" | "garage" | "features">("all")

  // Modal for swapping / selecting a vehicle cleanly without native select clipping

  const [swapModalState, setSwapModalState] = useState<{
    isOpen: boolean

    targetCarId?: string // If swapping an existing car

    isAdding?: boolean // If adding a new car slot
  }>({ isOpen: false })

  // Search filter inside the swap modal

  const [modalSearchQuery, setModalSearchQuery] = useState("")

  // On mobile, if > 2 cars are selected, allow user to pick which 2 cars are shown head-to-head

  const [mobilePairIndex, setMobilePairIndex] = useState<[number, number]>([
    0, 1,
  ])

  // Get active cars list, fallback to 2-3 cars if empty

  const activeComparedCars = useMemo(() => {
    const valid = (cars || []).filter(
      (c) => Boolean(c) && compareIds.includes(c.id),
    )

    if (valid.length >= 2) return valid

    if (valid.length === 1) {
      const other = (cars || []).find((c) => Boolean(c) && c.id !== valid[0].id)

      return other ? [valid[0], other] : valid
    }

    return (cars || []).filter(Boolean).slice(0, 2)
  }, [cars, compareIds])

  // Mobile focused pair

  const mobileCars = useMemo(() => {
    if (activeComparedCars.length <= 2)
      return activeComparedCars.filter(Boolean)

    const idx1 = Math.min(mobilePairIndex[0], activeComparedCars.length - 1)

    let idx2 = Math.min(mobilePairIndex[1], activeComparedCars.length - 1)

    if (idx1 === idx2) {
      idx2 = (idx1 + 1) % activeComparedCars.length
    }

    return [activeComparedCars[idx1], activeComparedCars[idx2]].filter(Boolean)
  }, [activeComparedCars, mobilePairIndex])

  // Presets

  const presets = [
    {
      name: "Luxury Sport Sedans",

      badge: "Sport",

      ids: ["bmw-3-series", "mercedes-c-class"],
    },

    {
      name: "Executive & Electric",

      badge: "EV",

      ids: ["tesla-model-3", "porsche-taycan"],
    },

    {
      name: "Premium SUVs",

      badge: "SUV",

      ids: ["audi-q5", "porsche-macan", "toyota-highlander"],
    },

    {
      name: "Value & City",

      badge: "Economy",

      ids: ["toyota-camry", "honda-crv"],
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
      setCompareIds(cars.slice(0, 2).map((c) => c.id))
    }

    setMobilePairIndex([0, 1])
  }

  const handleRemoveCar = (carId: string) => {
    if (activeComparedCars.length <= 2) {
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

    setSwapModalState({ isOpen: false })
  }

  const handleAddCar = (newCarId: string) => {
    if (!compareIds.includes(newCarId) && compareIds.length < 4) {
      setCompareIds((prev) => [...prev, newCarId])
    }

    setSwapModalState({ isOpen: false })
  }

  // Feature matrix checklist

  const COMMON_FEATURES: CommonFeature[] = [
    { name: "Apple CarPlay & Android Auto", key: "CarPlay" },

    { name: "Bluetooth Audio & Handsfree", key: "Bluetooth" },

    { name: "Backup Camera & Park Assist", key: "Backup Camera" },

    { name: "Built-in GPS Navigation", key: "Navigation" },

    { name: "Leather / Premium Seating", key: "Leather" },

    { name: "Panoramic Sunroof", key: "Sunroof" },

    { name: "Adaptive Cruise Control", key: "Adaptive Cruise" },

    { name: "Heated Front Seats", key: "Heated" },

    { name: "Keyless Push-Button Start", key: "Keyless" },

    { name: "Blind Spot Monitoring", key: "Blind Spot" },

    { name: "Wireless Phone Charger", key: "Wireless" },
  ]

  // Head-to-Head calculations

  const priceWinner = useMemo(() => {
    if (activeComparedCars.length < 2) return null

    let lowest = activeComparedCars[0]

    let highest = activeComparedCars[0]

    for (const car of activeComparedCars) {
      if (car.pricePerDay < lowest.pricePerDay) lowest = car

      if (car.pricePerDay > highest.pricePerDay) highest = car
    }

    const diff = highest.pricePerDay - lowest.pricePerDay

    const percent = Math.round((diff / highest.pricePerDay) * 100)

    return { lowest, highest, diff, percent }
  }, [activeComparedCars])

  // Count total differences

  const differenceMetricsCount = useMemo(() => {
    if (activeComparedCars.length < 2) return 0

    let count = 0

    const first = activeComparedCars[0]

    // Price

    if (activeComparedCars.some((c) => c.pricePerDay !== first.pricePerDay))
      count++

    // Hourly

    if (activeComparedCars.some((c) => c.pricePerHour !== first.pricePerHour))
      count++

    // Fuel

    if (activeComparedCars.some((c) => c.fuelType !== first.fuelType)) count++

    // Transmission

    if (activeComparedCars.some((c) => c.transmission !== first.transmission))
      count++

    // Mileage

    if (activeComparedCars.some((c) => c.mileage !== first.mileage)) count++

    // Seats

    if (activeComparedCars.some((c) => c.seats !== first.seats)) count++

    // Luggage

    if (activeComparedCars.some((c) => c.luggage !== first.luggage)) count++

    // Garage

    if (
      activeComparedCars.some(
        (c) => (c.garageName || "Hub") !== (first.garageName || "Hub"),
      )
    )
      count++

    // Features

    for (const feat of COMMON_FEATURES) {
      const hasFirst =
        first?.features &&
        first?.features.some((f) =>
          f.toLowerCase().includes(feat.key.toLowerCase()),
        )

      const diffFound = activeComparedCars.some((c) => {
        const hasC =
          c?.features &&
          c?.features.some((f) =>
            f.toLowerCase().includes(feat.key.toLowerCase()),
          )

        return hasC !== hasFirst
      })

      if (diffFound) count++
    }

    return count
  }, [activeComparedCars, COMMON_FEATURES])

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] pt-20 pb-28">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            onClick={onNavigateListing}
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#F97316] bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs transition"
          >
            <ArrowLeftIcon size={14} /> Back to Fleet Listing
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              Comparing {activeComparedCars.length} of 4 Max
            </span>
            {activeComparedCars.length < 4 && (
              <button
                onClick={() =>
                  setSwapModalState({ isOpen: true, isAdding: true })
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg transition"
              >
                <PlusIcon size={14} /> Add Car
              </button>
            )}
            <button
              onClick={() => setCompareIds(cars.slice(0, 2).map((c) => c.id))}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline decoration-stone-300 ml-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Hero & Preset Studio Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 mb-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#F97316] border border-orange-200 mb-2.5">
                <SparklesIcon size={14} />
                <span>Smart Vehicle Comparison Studio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17191C] font-heading">
                Side-by-Side Fleet Matcher
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Evaluate daily rates, fuel efficiency, assigned garage hub bays,
                and amenities side-by-side with instant difference highlights.
              </p>
            </div>

            {/* Quick Match Presets */}
            <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
                  <ZapIcon size={12} className="text-amber-500" /> Quick Match
                  Presets:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => {
                  const isActive =
                    p.ids.length === activeComparedCars.length &&
                    p.ids.every((id) =>
                      activeComparedCars.some(
                        (c) =>
                          c.id.toLowerCase().includes(id) ||
                          c.model.toLowerCase().includes(id),
                      ),
                    )

                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p.ids)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#17191C] text-white border border-[#17191C]"
                          : "bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-[#F97316]"
                      }`}
                    >
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-stone-200/50 text-stone-600">
                        {p.badge}
                      </span>
                      <span>{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Efficiency Bar: Difference Filter & Category Navigation */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: "all", label: "All Specs" },

                { id: "pricing", label: "Rates & Protection" },

                { id: "specs", label: "Performance & Space" },

                { id: "garage", label: "Garage Hub Location" },

                { id: "features", label: "Amenities" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "bg-[#F97316] text-white shadow-xs"
                      : "bg-stone-100/80 hover:bg-stone-200/70 text-stone-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Differences Only Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowOnlyDifferences((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border shadow-xs ${
                  showOnlyDifferences
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                <TagIcon size={14} />
                <span>
                  {showOnlyDifferences
                    ? "Showing Differences"
                    : "Show Differences Only"}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    showOnlyDifferences
                      ? "bg-amber-700 text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {differenceMetricsCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Head-to-Head Summary Banner (If 2 cars compared) */}
        {priceWinner && priceWinner.diff > 0 && (
          <div className="mb-6 bg-linear-to-r from-emerald-50 via-teal-50 to-orange-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-base">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                  <span className="text-emerald-700 font-black">
                    Best Value Advantage:
                  </span>{" "}
                  {priceWinner.lowest.name} is ${priceWinner.diff}/day cheaper
                  than {priceWinner.highest.name}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Save {priceWinner.percent}% per rental day ($
                  {priceWinner.lowest.pricePerDay}
                  /day vs ${priceWinner.highest.pricePerDay}/day). Both vehicles
                  include full commercial liability protection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => onQuickBook(priceWinner.lowest.id)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                Book Best Value (${priceWinner.lowest.pricePerDay}){" "}
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MOBILE HEAD-TO-HEAD COMPARISON VIEW (< md screens)
            Guaranteed ZERO horizontal table overflow and ZERO text truncation!
           ========================================================================= */}
        <div className="block md:hidden">
          {/* If > 2 cars, mobile slot switcher */}
          {activeComparedCars.length > 2 && (
            <div className="mb-4 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Mobile Head-to-Head Slots:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-1">
                    Slot A:
                  </label>
                  <select
                    value={mobileCars[0]?.id || ""}
                    onChange={(e) => {
                      const idx = activeComparedCars.findIndex(
                        (c) => c.id === e.target.value,
                      )

                      if (idx !== -1) setMobilePairIndex(([_, b]) => [idx, b])
                    }}
                    className="w-full text-xs font-bold py-1.5 px-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
                  >
                    {activeComparedCars.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (${c.pricePerDay})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-1">
                    Slot B:
                  </label>
                  <select
                    value={mobileCars[1]?.id || ""}
                    onChange={(e) => {
                      const idx = activeComparedCars.findIndex(
                        (c) => c.id === e.target.value,
                      )

                      if (idx !== -1) setMobilePairIndex(([a, _]) => [a, idx])
                    }}
                    className="w-full text-xs font-bold py-1.5 px-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
                  >
                    {activeComparedCars.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (${c.pricePerDay})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Mobile Vehicle Header Cards */}
          <div className="sticky top-16 z-20 bg-[#FAF7F2]/95 backdrop-blur-md pt-2 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {mobileCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white rounded-2xl border border-stone-200 p-2.5 shadow-sm flex flex-col justify-between"
                >
                  {/* Image & Quick Swap */}
                  <div className="relative h-24 rounded-xl overflow-hidden bg-stone-100 mb-2">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        setSwapModalState({
                          isOpen: true,

                          targetCarId: car.id,
                        })
                      }
                      className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold backdrop-blur-xs flex items-center gap-1 hover:bg-orange-600 transition"
                      title="Switch this car"
                    >
                      Swap
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/90 text-stone-800 backdrop-blur-xs">
                      {car.type}
                    </span>
                  </div>

                  {/* Name & Pricing */}
                  <div className="mb-2">
                    <h3 className="font-bold text-xs text-stone-900 truncate leading-tight">
                      {car.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-[#F97316] font-mono">
                        ${car.pricePerDay}
                      </span>
                      <span className="text-[10px] text-stone-400">/day</span>
                      <span className="text-[10px] font-mono text-stone-500">
                        (${car.pricePerHour}/hr)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Designed to never truncate */}
                  <div className="space-y-1">
                    <button
                      onClick={() => onQuickBook(car.id)}
                      className="w-full py-1.5 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1"
                    >
                      Reserve <ArrowRightIcon size={12} />
                    </button>
                    <button
                      onClick={() => onSelectCar(car.id)}
                      className="w-full py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] transition text-center"
                    >
                      Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Metric Cards */}
          <div className="space-y-3 mt-3">
            {/* CATEGORY 1: PRICING & RATES */}
            {(activeTab === "all" || activeTab === "pricing") && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TagIcon size={14} className="text-[#F97316]" />
                  <span>1. Rates &amp; Payment Options</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {/* Daily Rate */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.pricePerDay !==
                      mobileCars[1]?.pricePerDay) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Daily Rate (24 Hours)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => {
                          const isLowest =
                            priceWinner && priceWinner.lowest.id === c.id

                          return (
                            <div
                              key={c.id}
                              className={`p-2 rounded-xl border ${
                                isLowest
                                  ? "bg-emerald-50/70 border-emerald-200"
                                  : "bg-stone-50 border-stone-100"
                              }`}
                            >
                              <div className="font-mono font-black text-sm text-stone-900">
                                ${c.pricePerDay}.00
                              </div>
                              {isLowest && (
                                <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded mt-0.5">
                                  ✓ Best Rate
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hourly Flex Rate */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.pricePerHour !==
                      mobileCars[1]?.pricePerHour) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Hourly Flex Rate
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100"
                          >
                            <span className="font-mono font-bold text-stone-800">
                              ${c.pricePerHour}.00/hr
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Rate */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.pricePerDay !==
                      mobileCars[1]?.pricePerDay) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Weekly Rate (7 Days · 10% Off)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-mono text-stone-700"
                          >
                            ${Math.round(c.pricePerDay * 7 * 0.9)}.00
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Protection Waiver */}
                  {!showOnlyDifferences && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Damage Waiver Protection
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 font-semibold"
                          >
                            ✓ Included ($0 Liability)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORY 2: GARAGE LOCATION & STAGING (Crucial user requirement) */}
            {(activeTab === "all" || activeTab === "garage") && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <LocationIcon size={14} className="text-[#F97316]" />
                  <span>2. Garage Hub &amp; Bay Location</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {/* Garage Hub & Bay */}
                  <div className="p-3">
                    <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                      Assigned Garage Hub &amp; Bay
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {mobileCars.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-xl bg-stone-50 border border-stone-100 space-y-1"
                        >
                          <div className="font-bold text-stone-900 line-clamp-1">
                            {c.garageName || "Main Garage Facility"}
                          </div>
                          <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                            {c.garageBay || "Bay 14-B"}
                          </span>
                          <p className="text-[10px] text-stone-500 line-clamp-1">
                            {c.garageAddress || "4200 NW 21st St, Miami, FL"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Baseline Odometer */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.currentOdometer !==
                      mobileCars[1]?.currentOdometer) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Current Odometer Reading
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-mono text-stone-800"
                          >
                            {(c.currentOdometer || 14200).toLocaleString()} mi
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Health & Sanitation */}
                  {!showOnlyDifferences && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Sanitation &amp; Inspection
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 font-bold"
                          >
                            ✓ {c.healthScore || 98}% Certified Clean
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORY 3: POWERTRAIN & SPACE */}
            {(activeTab === "all" || activeTab === "specs") && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FuelIcon size={14} className="text-[#F97316]" />
                  <span>3. Powertrain, Range &amp; Capacity</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {/* Fuel / Powertrain */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.fuelType !== mobileCars[1]?.fuelType) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Fuel / Powertrain
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-semibold text-stone-800"
                          >
                            {c.fuelType}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fuel Efficiency / Range */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.mileage !== mobileCars[1]?.mileage) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Fuel Economy / Range
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-mono font-bold text-[#F97316]"
                          >
                            {c.mileage}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seating Capacity */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.seats !== mobileCars[1]?.seats) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Seating Capacity
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-semibold text-stone-800"
                          >
                            {c.seats} Passengers
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Luggage Capacity */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.luggage !== mobileCars[1]?.luggage) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Luggage Capacity
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-semibold text-stone-800"
                          >
                            {c.luggage}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transmission */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.transmission !==
                      mobileCars[1]?.transmission) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Transmission
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-semibold text-stone-800"
                          >
                            {c.transmission}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Year */}
                  {(!showOnlyDifferences ||
                    mobileCars[0]?.year !== mobileCars[1]?.year) && (
                    <div className="p-3">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono mb-1.5">
                        Model Year
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mobileCars.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 font-mono text-stone-800"
                          >
                            {c.year}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORY 4: FEATURES & AMENITIES CHECKLIST */}
            {(activeTab === "all" || activeTab === "features") && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <SparklesIcon size={14} className="text-[#F97316]" />
                  <span>4. Tech &amp; Amenities Checklist</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {COMMON_FEATURES.map((feature) => {
                    const has1 = Boolean(
                      mobileCars[0]?.features &&
                        mobileCars[0]?.features.some((f) =>
                          f.toLowerCase().includes(feature.key.toLowerCase()),
                        ),
                    )

                    const has2 = Boolean(
                      mobileCars[1]?.features &&
                        mobileCars[1]?.features.some((f) =>
                          f.toLowerCase().includes(feature.key.toLowerCase()),
                        ),
                    )

                    if (showOnlyDifferences && has1 === has2) return null

                    return (
                      <div key={feature.key} className="p-3">
                        <div className="text-[11px] font-bold text-stone-500 mb-1.5 flex items-center justify-between">
                          <span>{feature.name}</span>
                          {has1 !== has2 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                              Differs
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            className={`p-2 rounded-xl border flex items-center gap-1.5 font-bold ${
                              has1
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                : "bg-stone-50 border-stone-100 text-stone-400 font-normal"
                            }`}
                          >
                            {has1 ? (
                              <>
                                <CheckIcon size={12} /> Included
                              </>
                            ) : (
                              "— Not Included"
                            )}
                          </div>
                          <div
                            className={`p-2 rounded-xl border flex items-center gap-1.5 font-bold ${
                              has2
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                : "bg-stone-50 border-stone-100 text-stone-400 font-normal"
                            }`}
                          >
                            {has2 ? (
                              <>
                                <CheckIcon size={12} /> Included
                              </>
                            ) : (
                              "— Not Included"
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            DESKTOP MATRIX TABLE VIEW (>= md screens)
            High-efficiency, unclipped, spacious side-by-side comparative table
           ========================================================================= */}
        <div className="hidden md:block bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80">
                  {/* Left Column: Metric Specs Label */}
                  <th className="p-6 w-60 lg:w-72 align-top text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                    <div className="space-y-1.5">
                      <span className="text-stone-900 font-black text-sm block font-heading">
                        Fleet Asset Details
                      </span>
                      <p className="text-[11px] text-stone-500 normal-case font-sans">
                        Comparing up to 4 models. Tap swap or remove to change.
                      </p>
                    </div>
                  </th>

                  {/* Vehicle Card Columns */}
                  {activeComparedCars.map((car) => {
                    const isLowest =
                      priceWinner && priceWinner.lowest.id === car.id

                    return (
                      <th
                        key={car.id}
                        className="p-5 min-w-[240px] max-w-[300px] align-top border-l border-stone-200"
                      >
                        <div className="space-y-3">
                          {/* Card Top Action: Swap & Remove */}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() =>
                                setSwapModalState({
                                  isOpen: true,

                                  targetCarId: car.id,
                                })
                              }
                              className="flex-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-stone-800 hover:text-[#F97316] transition text-left flex items-center justify-between shadow-2xs"
                            >
                              <span className="truncate">{car.name}</span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                Swap ▾
                              </span>
                            </button>

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

                          {/* Image */}
                          <div className="h-36 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative group">
                            <img
                              src={car.image}
                              alt={car.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-stone-800 shadow-2xs">
                              {car.type}
                            </span>
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#17191C]/80 text-amber-400 backdrop-blur-xs">
                              {car.plateNumber || "FL-MTR"}
                            </span>
                            {isLowest && (
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                                Best Value
                              </span>
                            )}
                          </div>

                          {/* Title & Price */}
                          <div>
                            <h3 className="font-bold text-base text-stone-900 font-heading truncate">
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

                          {/* Action CTAs */}
                          <div className="space-y-1.5 pt-1">
                            <button
                              onClick={() => onQuickBook(car.id)}
                              className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                            >
                              Reserve This Car <ArrowRightIcon size={14} />
                            </button>
                            <button
                              onClick={() => onSelectCar(car.id)}
                              className="w-full py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
                            >
                              Full Spec Sheet
                            </button>
                          </div>
                        </div>
                      </th>
                    )
                  })}

                  {/* Empty Add Slot Column if < 4 */}
                  {activeComparedCars.length < 4 && (
                    <th className="p-5 w-48 align-middle text-center border-l border-stone-200 bg-stone-50/40">
                      <div className="p-5 border-2 border-dashed border-stone-200 hover:border-orange-300 rounded-2xl text-center space-y-3 transition">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto">
                          <PlusIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-stone-800">
                            Add Vehicle
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Compare up to 4 models
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSwapModalState({ isOpen: true, isAdding: true })
                          }
                          className="w-full py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-bold text-[#F97316] shadow-2xs transition"
                        >
                          + Pick Vehicle
                        </button>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {/* SECTION 1: RATES & FINANCIALS */}
                {(activeTab === "all" || activeTab === "pricing") && (
                  <>
                    <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                      <td
                        colSpan={activeComparedCars.length + 2}
                        className="px-6 py-2.5 text-stone-800"
                      >
                        1. Rates &amp; Payment Options
                      </td>
                    </tr>
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) =>
                          c.pricePerDay !== activeComparedCars[0].pricePerDay,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
                          Daily Rate (24h)
                        </td>
                        {activeComparedCars.map((c) => {
                          const isLowest =
                            priceWinner && priceWinner.lowest.id === c.id

                          return (
                            <td
                              key={c.id}
                              className={`px-5 py-3 border-l border-stone-100 font-mono font-bold ${
                                isLowest
                                  ? "text-emerald-700 bg-emerald-50/40"
                                  : "text-stone-900"
                              }`}
                            >
                              ${c.pricePerDay}.00
                              {isLowest && (
                                <span className="ml-2 text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                  Lowest
                                </span>
                              )}
                            </td>
                          )
                        })}
                        {activeComparedCars.length < 4 && (
                          <td className="border-l border-stone-100" />
                        )}
                      </tr>
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) =>
                          c.pricePerHour !== activeComparedCars[0].pricePerHour,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) =>
                          c.pricePerDay !== activeComparedCars[0].pricePerDay,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
                          Weekly Rate (7 Days · 10% Off)
                        </td>
                        {activeComparedCars.map((c) => (
                          <td
                            key={c.id}
                            className="px-5 py-3 border-l border-stone-100 font-mono text-stone-700"
                          >
                            ${Math.round(c.pricePerDay * 7 * 0.9)}.00
                          </td>
                        ))}
                        {activeComparedCars.length < 4 && (
                          <td className="border-l border-stone-100" />
                        )}
                      </tr>
                    )}
                    {!showOnlyDifferences && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                  </>
                )}

                {/* SECTION 2: GARAGE LOCATION & STAGING (Owner Defined) */}
                {(activeTab === "all" || activeTab === "garage") && (
                  <>
                    <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                      <td
                        colSpan={activeComparedCars.length + 2}
                        className="px-6 py-2.5 text-stone-800"
                      >
                        2. Garage Hub &amp; Bay Location
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-stone-600">
                        Assigned Garage Hub &amp; Bay
                      </td>
                      {activeComparedCars.map((c) => (
                        <td
                          key={c.id}
                          className="px-5 py-3 border-l border-stone-100"
                        >
                          <div className="font-bold text-stone-900 truncate max-w-[210px]">
                            {c.garageName || "Main Garage Facility"}
                          </div>
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5 text-[11px]">
                            {c.garageBay || "Bay 14-B"}
                          </span>
                          <div className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[210px]">
                            {c.garageAddress || "4200 NW 21st St, Miami, FL"}
                          </div>
                        </td>
                      ))}
                      {activeComparedCars.length < 4 && (
                        <td className="border-l border-stone-100" />
                      )}
                    </tr>
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) =>
                          c.currentOdometer !==
                          activeComparedCars[0].currentOdometer,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {!showOnlyDifferences && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
                          Sanitation &amp; Inspection
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
                    )}
                  </>
                )}

                {/* SECTION 3: POWERTRAIN & SPACE */}
                {(activeTab === "all" || activeTab === "specs") && (
                  <>
                    <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                      <td
                        colSpan={activeComparedCars.length + 2}
                        className="px-6 py-2.5 text-stone-800"
                      >
                        3. Powertrain, Engineering &amp; Space
                      </td>
                    </tr>
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) => c.fuelType !== activeComparedCars[0].fuelType,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) =>
                          c.transmission !== activeComparedCars[0].transmission,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) => c.mileage !== activeComparedCars[0].mileage,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) => c.seats !== activeComparedCars[0].seats,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) => c.luggage !== activeComparedCars[0].luggage,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                    {(!showOnlyDifferences ||
                      activeComparedCars.some(
                        (c) => c.year !== activeComparedCars[0].year,
                      )) && (
                      <tr>
                        <td className="px-6 py-3 font-semibold text-stone-600">
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
                    )}
                  </>
                )}

                {/* SECTION 4: FEATURES & AMENITIES */}
                {(activeTab === "all" || activeTab === "features") && (
                  <>
                    <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                      <td
                        colSpan={activeComparedCars.length + 2}
                        className="px-6 py-2.5 text-stone-800"
                      >
                        4. Technology &amp; Comfort Amenities
                      </td>
                    </tr>
                    {COMMON_FEATURES.map((feature) => {
                      const hasFeatureList = activeComparedCars.map((c) =>
                        Boolean(
                          c?.features &&
                            c?.features.some((f) =>
                              f.toLowerCase().includes(
                                feature.key.toLowerCase(),
                              ),
                            ),
                        ),
                      )

                      const isIdentical = hasFeatureList.every(
                        (val) => val === hasFeatureList[0],
                      )

                      if (showOnlyDifferences && isIdentical) return null

                      return (
                        <tr key={feature.key}>
                          <td className="px-6 py-3 font-semibold text-stone-600">
                            {feature.name}
                          </td>
                          {activeComparedCars.map((c) => {
                            const hasFeature =
                              c?.features &&
                              c?.features.some((f) =>
                                f.toLowerCase().includes(
                                  feature.key.toLowerCase(),
                                ),
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
                                  <span className="text-stone-300 font-mono">
                                    —
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          {activeComparedCars.length < 4 && (
                            <td className="border-l border-stone-100" />
                          )}
                        </tr>
                      )
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VEHICLE SWAP / ADD MODAL
          Clean, beautiful modal replacing clunky native browser selects
         ========================================================================= */}
      {swapModalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-heading font-black text-lg text-stone-900">
                  {swapModalState.isAdding
                    ? "Add Vehicle to Comparison"
                    : "Select Replacement Model"}
                </h3>
                <p className="text-xs text-stone-500">
                  Pick from our verified fleet to compare specs side by side
                </p>
              </div>
              <button
                onClick={() => setSwapModalState({ isOpen: false })}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="my-3 relative">
              <SearchIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search by model, brand, or category..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:bg-white transition"
              />
            </div>

            {/* Cars List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-1">
              {cars

                .filter((c) => {
                  const matchQuery =
                    !modalSearchQuery ||
                    c.name

                      .toLowerCase()

                      .includes(modalSearchQuery.toLowerCase()) ||
                    c.brand

                      .toLowerCase()

                      .includes(modalSearchQuery.toLowerCase()) ||
                    c.type

                      .toLowerCase()

                      .includes(modalSearchQuery.toLowerCase())

                  const notAlreadyCompared = swapModalState.isAdding
                    ? !compareIds.includes(c.id)
                    : c.id !== swapModalState.targetCarId

                  return matchQuery && notAlreadyCompared
                })

                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (swapModalState.isAdding) {
                        handleAddCar(c.id)
                      } else if (swapModalState.targetCarId) {
                        handleSwapCar(swapModalState.targetCarId, c.id)
                      }
                    }}
                    className="w-full p-2.5 rounded-2xl hover:bg-orange-50/70 text-left flex items-center gap-3 transition group border border-transparent hover:border-orange-200"
                  >
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-16 h-12 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 group-hover:text-[#F97316] truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                          {c.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-stone-700">
                          ${c.pricePerDay}/day
                        </span>
                        <span>·</span>
                        <span>{c.mileage}</span>
                        <span>·</span>
                        <span className="truncate">
                          {c.garageName || "Main Garage Facility"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#F97316] px-2.5 py-1 rounded-xl bg-orange-100/60 shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition">
                      Select
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
