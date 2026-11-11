import React, { useState, useMemo, useEffect } from "react"
import type { Car } from "../types"
import { ArrowLeftIcon, PlusIcon, SparklesIcon } from "../components/Icons"
import ComparePresets from "./customer/ComparePresets"
import CompareFilterBar from "./customer/CompareFilterBar"
import CompareTable from "./customer/CompareTable"
import CompareSwapModal from "./customer/CompareSwapModal"

interface CompareViewProps {
  cars: Car[]
  compareIds: string[]
  setCompareIds: React.Dispatch<React.SetStateAction<string[]>>
  onSelectCar: (carId: string) => void
  onQuickBook: (carId: string) => void
  onNavigateHome: () => void
  onNavigateListing: () => void
}

const COMMON_FEATURES = [
  { name: "Apple CarPlay & Android Auto", key: "carplay" },
  { name: "Bluetooth & Wireless Audio", key: "bluetooth" },
  { name: "GPS Navigation System", key: "gps" },
  { name: "Leather Upholstery", key: "leather" },
  { name: "HD Rearview Camera", key: "camera" },
  { name: "Heated Front Seats", key: "heated" },
  { name: "Keyless Digital Entry", key: "keyless" },
  { name: "Panoramic Sunroof", key: "sunroof" },
  { name: "Adaptive Cruise Control", key: "cruise" },
]

const PRESETS = [
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

export default function CompareView({
  cars,
  compareIds,
  setCompareIds,
  onSelectCar,
  onQuickBook,
  onNavigateListing,
}: CompareViewProps) {
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false)
  const [activeTab, setActiveTab] =
    useState<"all" | "pricing" | "specs" | "garage" | "features">("all")

  const [swapModalState, setSwapModalState] = useState<{
    isOpen: boolean
    targetCarId?: string
    isAdding?: boolean
  }>({ isOpen: false })

  const [modalSearchQuery, setModalSearchQuery] = useState("")
  const [mobilePairIndex, setMobilePairIndex] = useState<[number, number]>([
    0, 1,
  ])

  const activeComparedCars = useMemo(() => {
    // Preserve the exact order of car IDs in compareIds
    const ordered = compareIds
      .map((id) => (cars || []).find((c) => c && c.id === id))
      .filter((c): c is Car => Boolean(c))

    if (ordered.length >= 2) return ordered.slice(0, 4)
    if (ordered.length === 1) {
      const other = (cars || []).find(
        (c) => Boolean(c) && c.id !== ordered[0].id,
      )
      return other ? [ordered[0], other] : ordered
    }
    return (cars || []).filter(Boolean).slice(0, 2)
  }, [cars, compareIds])

  // Synchronize compareIds in parent state with activeComparedCars so state is never stale or empty
  useEffect(() => {
    if (compareIds.length < 2 && activeComparedCars.length >= 2) {
      setCompareIds(activeComparedCars.map((c) => c.id))
    }
  }, [compareIds.length, activeComparedCars, setCompareIds])

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
      setCompareIds(matched.slice(0, 4).map((m) => m.id))
    } else {
      setCompareIds(cars.slice(0, 2).map((c) => c.id))
    }
    setMobilePairIndex([0, 1])
  }

  const handleAddCar = (newCarId: string) => {
    setCompareIds((prev) => {
      // Use currently displayed cars as the baseline so existing compared cars are never lost
      const currentIds = activeComparedCars.map((c) => c.id)
      const base = currentIds.length >= 2 ? currentIds : prev
      if (base.includes(newCarId)) return base
      if (base.length >= 4) return base
      return [...base, newCarId]
    })
    setSwapModalState({ isOpen: false })
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
    setCompareIds((prev) => {
      const currentIds = activeComparedCars.map((c) => c.id)
      const base = currentIds.length >= 2 ? currentIds : prev
      return base.filter((id) => id !== carId)
    })
  }

  const handleSwapCar = (oldCarId: string, newCarId: string) => {
    setCompareIds((prev) => {
      const currentIds = activeComparedCars.map((c) => c.id)
      const base = currentIds.length >= 2 ? currentIds : prev
      return base.map((id) => (id === oldCarId ? newCarId : id))
    })
    setSwapModalState({ isOpen: false })
  }

  const priceWinner = useMemo(() => {
    if (activeComparedCars.length < 2) return null
    const sorted = [...activeComparedCars].sort(
      (a, b) => a.pricePerDay - b.pricePerDay,
    )
    return {
      lowest: sorted[0],
      highest: sorted[sorted.length - 1],
      difference: sorted[sorted.length - 1].pricePerDay - sorted[0].pricePerDay,
    }
  }, [activeComparedCars])

  const differenceCount = useMemo(() => {
    if (activeComparedCars.length < 2) return 0
    let count = 0
    const first = activeComparedCars[0]
    if (activeComparedCars.some((c) => c.pricePerDay !== first.pricePerDay))
      count++
    if (activeComparedCars.some((c) => c.transmission !== first.transmission))
      count++
    if (activeComparedCars.some((c) => c.fuelType !== first.fuelType)) count++
    if (activeComparedCars.some((c) => c.seats !== first.seats)) count++
    return count
  }, [activeComparedCars])

  if (activeComparedCars.length < 2) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] pt-24 pb-28 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-xl border border-stone-200 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto mb-4 border border-orange-100">
            <SparklesIcon size={24} />
          </div>
          <h2 className="text-xl font-black text-stone-900 font-heading mb-2">
            {!cars || cars.length === 0
              ? "No Vehicles in Fleet"
              : "Select at Least 2 Vehicles"}
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed mb-6">
            Side-by-side vehicle comparison requires at least 2 vehicles from the
            fleet catalog.
          </p>
          <button
            type="button"
            onClick={onNavigateListing}
            className="w-full py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeftIcon size={14} /> Browse Fleet Catalog
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] pt-20 pb-28">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={onNavigateListing}
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#F97316] bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeftIcon size={14} /> Back to Fleet Listing
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              Comparing {activeComparedCars.length} of 4 Max
            </span>
            {activeComparedCars.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setSwapModalState({ isOpen: true, isAdding: true })
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg transition cursor-pointer"
              >
                <PlusIcon size={14} /> Add Car
              </button>
            )}
            <button
              type="button"
              onClick={() => setCompareIds(cars.slice(0, 2).map((c) => c.id))}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline decoration-stone-300 ml-1 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Studio Presets */}
        <ComparePresets presets={PRESETS} onApplyPreset={handleApplyPreset} />

        {/* Filter Bar */}
        <CompareFilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showOnlyDifferences={showOnlyDifferences}
          setShowOnlyDifferences={setShowOnlyDifferences}
          differenceCount={differenceCount}
        />

        {/* Comparison Table */}
        <CompareTable
          activeComparedCars={activeComparedCars}
          mobileCars={mobileCars}
          activeTab={activeTab}
          showOnlyDifferences={showOnlyDifferences}
          priceWinner={priceWinner}
          commonFeatures={COMMON_FEATURES}
          onQuickBook={onQuickBook}
          onSelectCar={onSelectCar}
          onSwapCar={(carId) =>
            setSwapModalState({ isOpen: true, targetCarId: carId })
          }
          onRemoveCar={handleRemoveCar}
          onAddCar={() =>
            setSwapModalState({ isOpen: true, isAdding: true })
          }
        />
      </div>

      {/* Swap / Add Modal */}
      <CompareSwapModal
        isOpen={swapModalState.isOpen}
        isAdding={swapModalState.isAdding}
        targetCarId={swapModalState.targetCarId}
        cars={cars}
        compareIds={activeComparedCars.map((c) => c.id)}
        searchQuery={modalSearchQuery}
        setSearchQuery={setModalSearchQuery}
        onClose={() => setSwapModalState({ isOpen: false })}
        onSelectCar={(newCarId) => {
          if (swapModalState.isAdding) {
            handleAddCar(newCarId)
          } else if (swapModalState.targetCarId) {
            handleSwapCar(swapModalState.targetCarId, newCarId)
          }
        }}
      />
    </div>
  )
}
