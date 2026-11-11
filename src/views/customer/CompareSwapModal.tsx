import React from "react"
import type { Car } from "../../types"
import { SearchIcon, StarIcon } from "../../components/Icons"

interface CompareSwapModalProps {
  isOpen: boolean
  isAdding?: boolean
  targetCarId?: string
  cars: Car[]
  compareIds: string[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  onClose: () => void
  onSelectCar: (carId: string) => void
}

export default function CompareSwapModal({
  isOpen,
  isAdding,
  targetCarId,
  cars,
  compareIds,
  searchQuery,
  setSearchQuery,
  onClose,
  onSelectCar,
}: CompareSwapModalProps) {
  if (!isOpen) return null

  const filteredCars = cars.filter((c) => {
    const matchQuery =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())

    const notAlreadyCompared = !compareIds.includes(c.id)

    return matchQuery && notAlreadyCompared
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-heading font-black text-lg text-stone-900">
              {isAdding
                ? "Add Vehicle to Comparison"
                : "Select Replacement Model"}
            </h3>
            <p className="text-xs text-stone-500">
              Pick from our verified fleet to compare specs side by side
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:bg-white transition"
          />
        </div>

        {/* Cars List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-1">
          {filteredCars.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No vehicles found matching "{searchQuery}"
            </div>
          ) : (
            filteredCars.map((car) => (
              <div
                key={car.id}
                onClick={() => {
                  onSelectCar(car.id)
                  onClose()
                }}
                className="p-2.5 rounded-xl hover:bg-orange-50/50 transition flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-16 h-12 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                    {car.brand}
                  </span>
                  <p className="text-xs font-bold text-stone-900 group-hover:text-[#F97316] transition-colors truncate">
                    {car.name}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {car.type} • {car.transmission} • {car.fuelType}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-stone-900 font-heading">
                    €{car.pricePerDay}
                    <span className="text-[10px] text-stone-400 font-normal">
                      /day
                    </span>
                  </p>
                  <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-amber-500">
                    <StarIcon size={10} filled />
                    <span>{car.rating}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
