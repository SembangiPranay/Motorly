import React from "react"
import type { Car, BookingState } from "../../types"
import { SparklesIcon, ArrowRightIcon } from "../../components/Icons"
import CustomerCarCard from "./CustomerCarCard"

interface HomeFeaturedFleetProps {
  cars: Car[]
  featuredCars: Car[]
  fleetFilter: string
  setFleetFilter: (filter: string) => void
  bookingState: BookingState
  onSelectCar: (carId: string) => void
  onQuickBook?: (carId: string) => void
  onNavigateCompare?: () => void
  favorites?: string[]
  onToggleFavorite?: (carId: string) => void
  compareIds?: string[]
  onToggleCompare?: (carId: string) => void
}

const FLEET_CATEGORIES = ["All", "Sedan", "SUV", "Luxury", "Economy"]

export default function HomeFeaturedFleet({
  cars,
  featuredCars,
  fleetFilter,
  setFleetFilter,
  bookingState,
  onSelectCar,
  onQuickBook,
  onNavigateCompare,
  favorites = [],
  onToggleFavorite,
  compareIds = [],
  onToggleCompare,
}: HomeFeaturedFleetProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="featured-fleet">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SparklesIcon size={15} className="text-[#F97316]" />
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
              POPULAR CHOICES
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
            Garage Fleet Ready for Pickup
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Serviced, clean vehicles maintained and staged at our facility.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FLEET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFleetFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                fleetFilter === cat
                  ? "bg-[#17191C] text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Cards Grid */}
      {featuredCars.length === 0 ? (
        <div className="py-16 text-center text-stone-500 bg-white rounded-xl border border-stone-200/80 shadow-xs">
          <p className="text-base font-bold text-stone-800">
            No vehicles currently listed in the fleet.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Check back soon as new vehicles are added to inventory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredCars.map((car) => (
            <CustomerCarCard
              key={car.id}
              car={car}
              bookingState={bookingState}
              onSelectCar={onSelectCar}
              onQuickBook={onQuickBook}
              isFavorite={favorites.includes(car.id)}
              onToggleFavorite={onToggleFavorite}
              isComparing={compareIds.includes(car.id)}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </div>
      )}

      {/* Quick Comparison Studio Banner */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-xl gap-3">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-white text-[#F97316] border border-orange-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            ⚡
          </span>
          <div className="text-xs">
            <span className="font-bold text-stone-900 block">
              Can't decide which car fits your trip?
            </span>
            <span className="text-stone-500 text-[11px]">
              Compare mileage, passenger capacity, insurance, and rates
              side-by-side.
            </span>
          </div>
        </div>
        {onNavigateCompare && (
          <button
            type="button"
            onClick={onNavigateCompare}
            className="px-3.5 py-1.5 bg-[#17191C] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
          >
            <span>Compare Vehicles</span>
            <ArrowRightIcon size={13} />
          </button>
        )}
      </div>
    </section>
  )
}
