import React from "react"
import type { Car, BookingState } from "../../types"
import {
  StarIcon,
  CalendarIcon,
  ZapIcon,
  HeartIcon,
} from "../../components/Icons"

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

interface CustomerCarCardProps {
  car: Car
  bookingState?: BookingState
  onSelectCar: (carId: string) => void
  onQuickBook?: (carId: string) => void
  isFavorite?: boolean
  onToggleFavorite?: (carId: string) => void
  isComparing?: boolean
  onToggleCompare?: (carId: string) => void
}

export default function CustomerCarCard({
  car,
  bookingState,
  onSelectCar,
  onQuickBook,
  isFavorite,
  onToggleFavorite,
  isComparing,
  onToggleCompare,
}: CustomerCarCardProps) {
  const isConflicted =
    car.status === "Maintenance" ||
    car.status === "Rented" ||
    car.statusForDates === "Reserved" ||
    car.isAvailableForDates === false ||
    Boolean(car.conflict && car.conflict?.status !== "Invalid Dates")

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group">
      {/* Image & Badges (16:10 Aspect Ratio) */}
      <div
        className="relative aspect-[16/10] bg-stone-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectCar(car.id)}
      >
        <img
          src={car.image}
          alt={car.name}
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="bg-[#17191C]/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            {car.type}
          </span>
          {isConflicted && (
            <span className="bg-amber-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {car.status === "Maintenance"
                ? "Maintenance"
                : car.conflict || car.statusForDates === "Reserved"
                ? "Reserved for Dates"
                : "Rented"}
            </span>
          )}
        </div>

        {/* Top Right Controls (Rating / Favorite) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(car.id)
              }}
              className={`p-1.5 rounded-md backdrop-blur-md transition-colors cursor-pointer ${
                isFavorite
                  ? "bg-rose-50 text-rose-500"
                  : "bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900"
              }`}
              title="Add to wishlist"
            >
              <HeartIcon size={12} filled={isFavorite} />
            </button>
          )}

          <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
            <StarIcon size={12} filled className="text-amber-500" />
            <span className="text-[11px] font-bold text-stone-800">
              {car.rating}
            </span>
          </div>
        </div>

        {/* Compare Checkbox pill (optional) */}
        {onToggleCompare && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onToggleCompare(car.id)
            }}
            className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={Boolean(isComparing)}
              onChange={() => {}}
              className="accent-[#F97316] w-3 h-3 cursor-pointer"
            />
            <span>Compare</span>
          </div>
        )}
      </div>

      {/* Car Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3
            onClick={() => onSelectCar(car.id)}
            className="text-base font-bold text-[#17191C] font-heading hover:text-[#F97316] transition-colors cursor-pointer truncate"
          >
            {car.name}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
            <span>{car.transmission}</span>
            <span>•</span>
            <span>{car.fuelType}</span>
            <span>•</span>
            <span>{car.seats} Seats</span>
          </p>

          {isConflicted && (
            <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200/90 text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
              <CalendarIcon size={12} className="text-amber-600 shrink-0" />
              <span className="truncate">
                {car.status === "Maintenance"
                  ? "Under garage maintenance"
                  : `Reserved for ${bookingState?.pickupDate || "selected dates"}`}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-[#17191C] font-heading">
              €{car.pricePerDay}
            </span>
            <span className="text-[10px] text-stone-400"> /day</span>
          </div>

          {/* Fast Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCar(car.id)}
              className="px-2.5 py-1.5 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Inspect Specifications"
            >
              Details
            </button>
            <button
              type="button"
              disabled={isConflicted}
              onClick={() => {
                if (!isConflicted) {
                  if (onQuickBook) onQuickBook(car.id)
                  else onSelectCar(car.id)
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 ${
                isConflicted
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed shadow-none"
                  : "bg-[#F97316] hover:bg-[#EA580C] text-white cursor-pointer"
              }`}
            >
              <ZapIcon size={12} />
              <span>
                {isConflicted
                  ? car.status === "Maintenance"
                    ? "Maintenance"
                    : "Reserved"
                  : "Book"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
