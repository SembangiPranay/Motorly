import React from "react"
import type { Car, BookingState } from "../../types"
import { calculateRentalPrice } from "../../utils/pricing"
import {
  CarIcon,
  StarIcon,
  HeartIcon,
  ZapIcon,
  CheckIcon,
  UserIcon,
  TransmissionIcon,
  FuelIcon,
  SparklesIcon,
  LocationIcon,
  CalendarIcon,
} from "../../components/Icons"

interface ListingVehicleGridProps {
  filteredCars: Car[]
  liveCars: Car[]
  backendSyncing: boolean
  viewMode: "grid" | "list"
  bookingState: BookingState
  tripDurationDays: number
  isSameDayBooking: boolean
  sameDayHours: number
  favorites: string[]
  onToggleFavorite: (id: string) => void
  compareIds: string[]
  toggleCompare: (id: string) => void
  onSelectCar: (carId: string) => void
  onQuickBook?: (carId: string) => void
  clearAllFilters: () => void
}

const formatFuelDisplay = (mileage?: string, fuelType?: string): string => {
  if (!mileage || !mileage.trim()) {
    return fuelType === "Electric" ? "100% EV" : "45 Liters"
  }
  const clean = mileage.trim()
  if (fuelType === "Electric") {
    if (
      clean.includes("%") ||
      clean.toLowerCase().includes("kwh") ||
      clean.toLowerCase().includes("ev")
    ) {
      return clean
    }
    return `${clean} kWh`
  }
  if (/liters?|ltrs?|\bl\b/i.test(clean)) {
    return clean
  }
  if (/mpg|mpge/i.test(clean)) {
    const num = clean.replace(/[^0-9.]/g, "")
    return num ? `${num} Liters` : "45 Liters"
  }
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return `${clean} Liters`
  }
  return `${clean} Liters`
}

export default function ListingVehicleGrid({
  filteredCars,
  liveCars,
  backendSyncing,
  viewMode,
  bookingState,
  tripDurationDays,
  isSameDayBooking,
  sameDayHours,
  favorites,
  onToggleFavorite,
  compareIds,
  toggleCompare,
  onSelectCar,
  onQuickBook,
  clearAllFilters,
}: ListingVehicleGridProps) {
  return (
    <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-5">
      <main className="w-full space-y-4">
        {/* Results Header Counter & Live Status Indicator */}
        <div className="hidden sm:flex items-center justify-between text-xs text-stone-500 px-1">
          <span className="font-medium">
            Showing{" "}
            <strong className="text-stone-900 font-extrabold">
              {filteredCars.length}
            </strong>{" "}
            of {liveCars.length} certified fleet vehicles
          </span>

          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendSyncing
                  ? "bg-amber-500 animate-spin"
                  : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span>
              {backendSyncing
                ? "Syncing Fleet..."
                : "Live Fleet Availability Verified"}
            </span>
          </span>
        </div>

        {/* Empty State */}
        {filteredCars.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto border border-orange-200/80 shadow-xs">
              <CarIcon size={28} />
            </div>
            <h3 className="text-lg font-extrabold text-stone-900 font-heading">
              No vehicles match your active criteria
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try adjusting your price ceiling or clearing specific category
              filters to view available garage vehicles.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW: High-Impact Visual Showcase */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredCars.map((car) => {
              const isFav = favorites.includes(car.id)
              const isCompared = compareIds.includes(car.id)
              const pricing = calculateRentalPrice({
                car,
                isSameDay: isSameDayBooking,
                sameDayHours,
                days: tripDurationDays,
              })
              const tripTotal = pricing.basePrice

              const isRentedOrConflicted =
                car.status === "Maintenance" ||
                car.status === "Rented" ||
                car.statusForDates === "Reserved" ||
                (Boolean(car.conflict) &&
                  car.conflict?.status !== "Invalid Dates") ||
                (car.isAvailableForDates === false &&
                  car.conflict?.status !== "Invalid Dates")

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-xl border border-stone-200/90 hover:border-orange-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Framed Image Showcase */}
                  <div
                    className="relative h-52 sm:h-56 w-full bg-gradient-to-b from-stone-50 via-stone-100/50 to-stone-50/20 flex items-center justify-center overflow-hidden cursor-pointer rounded-t-xl border-b border-stone-100 select-none"
                    onClick={() => onSelectCar(car.id)}
                  >
                    {/* Ambient Backdrop */}
                    <img
                      src={car.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none select-none"
                    />
                    <div className="absolute inset-0 bg-stone-50/50 pointer-events-none" />

                    {/* Ground Shadow */}
                    <div className="absolute bottom-2.5 inset-x-8 h-3 bg-stone-900/10 rounded-full blur-[6px] pointer-events-none transform scale-95 transition-transform group-hover:scale-100" />

                    {/* Foreground Vehicle Image */}
                    <img
                      src={car.image}
                      alt={car.name}
                      loading="lazy"
                      className="relative z-10 w-full h-full object-contain p-3.5 sm:p-4 group-hover:scale-105 transition-transform duration-300 ease-out drop-shadow-md"
                    />

                    {/* Top Left: Clean Availability Status Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
                      {isRentedOrConflicted ? (
                        <span className="bg-rose-600/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {car.status === "Maintenance"
                            ? "Maintenance"
                            : car.conflict || car.statusForDates === "Reserved"
                              ? "Reserved"
                              : "Rented"}
                        </span>
                      ) : (
                        <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          Available
                        </span>
                      )}
                    </div>

                    {/* Top Right: Glassmorphism Action Buttons */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCompare(car.id)
                        }}
                        title={
                          isCompared
                            ? "Remove from compare"
                            : "Add to comparison studio"
                        }
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition shadow-xs cursor-pointer backdrop-blur-md ${
                          isCompared
                            ? "bg-[#F97316] text-white border-orange-500 ring-2 ring-orange-300"
                            : "bg-white/90 text-stone-700 border-stone-200 hover:border-[#F97316] hover:text-[#F97316]"
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">⇄</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(car.id)
                        }}
                        title={isFav ? "Saved to favorites" : "Save to favorites"}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <HeartIcon
                          size={14}
                          filled={isFav}
                          className={isFav ? "text-red-500" : ""}
                        />
                      </button>
                    </div>

                    {/* Bottom Left: Rating Badge */}
                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
                      <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-stone-900 border border-stone-200/80 shadow-xs flex items-center gap-1">
                        <StarIcon size={11} filled className="text-amber-500" />
                        <span>{car.rating}</span>
                        <span className="text-stone-400 font-normal">
                          ({car.reviewsCount || 48})
                        </span>
                      </div>
                    </div>

                    {/* Bottom Right: Year & Category */}
                    <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
                      <span className="bg-stone-900/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                        {car.year} • {car.type}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-2.5">
                      {/* Brand & Vehicle Title */}
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          {car.brand}
                        </div>
                        <h3
                          onClick={() => onSelectCar(car.id)}
                          className="text-base sm:text-lg font-extrabold text-stone-900 font-heading hover:text-[#F97316] transition-colors leading-snug truncate cursor-pointer"
                        >
                          {car.name}
                        </h3>
                      </div>

                      {/* Garage Hub Location */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate bg-stone-50/80 px-2.5 py-1.5 rounded-xl border border-stone-200/60">
                        <LocationIcon
                          size={13}
                          className="text-[#F97316] shrink-0"
                        />
                        <span className="truncate">
                          {car.garageName ||
                            car.garageAddress ||
                            car.location ||
                            "Miami Executive Garage"}
                        </span>
                        {car.garageBay && (
                          <span className="shrink-0 text-[10px] bg-white text-stone-700 font-bold px-1.5 py-0.5 rounded border border-stone-200">
                            Bay {car.garageBay}
                          </span>
                        )}
                        <a
                          href={
                            car.garageLat && car.garageLng
                              ? `https://www.google.com/maps/search/?api=1&query=${car.garageLat},${car.garageLng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  car.garageAddress ||
                                    car.garageName ||
                                    car.location ||
                                    "Pit Stop Central Garage (Mgarr)",
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto text-[10px] font-bold text-[#F97316] hover:text-[#EA580C] hover:underline shrink-0"
                          title="View garage location on Google Maps"
                        >
                          Maps ↗
                        </a>
                      </div>

                      {/* 4 Micro Specs Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-stone-600 font-medium">
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                          <UserIcon size={12} className="text-stone-400 shrink-0" />
                          <span className="truncate">{car.seats} Seats</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                          <TransmissionIcon
                            size={12}
                            className="text-stone-400 shrink-0"
                          />
                          <span className="truncate">{car.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                          <FuelIcon size={12} className="text-stone-400 shrink-0" />
                          <span className="truncate">{car.fuelType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                          <SparklesIcon
                            size={12}
                            className="text-stone-400 shrink-0"
                          />
                          <span className="truncate">
                            {formatFuelDisplay(car.mileage, car.fuelType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isRentedOrConflicted && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/90 text-[11px] font-bold text-amber-900 flex items-center gap-1.5 shadow-2xs">
                        <CalendarIcon
                          size={12}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="truncate">
                          {car.status === "Maintenance"
                            ? "Under routine maintenance"
                            : `Reserved for ${bookingState.pickupDate || "selected dates"}`}
                        </span>
                      </div>
                    )}

                    {/* Pricing & Booking Actions Footer */}
                    <div className="pt-3 border-t border-stone-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-stone-900 font-heading">
                              €{car.pricePerDay}
                            </span>
                            <span className="text-xs text-stone-500 font-semibold">
                              /day
                            </span>
                            <span className="text-[11px] text-stone-400 font-medium ml-1">
                              (€{car.pricePerHour}/hr • €
                              {car.pricePerWeek || Math.round(car.pricePerDay * 6)}
                              /wk • €
                              {car.pricePerMonth ||
                                Math.round(car.pricePerDay * 22)}
                              /mo)
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <CheckIcon size={11} />
                            <span>
                              €{tripTotal} total • {pricing.durationText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clean 2-Button Action Row */}
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => onSelectCar(car.id)}
                          className="h-10 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          disabled={isRentedOrConflicted}
                          onClick={() => {
                            if (!isRentedOrConflicted) {
                              if (onQuickBook) onQuickBook(car.id)
                              else onSelectCar(car.id)
                            }
                          }}
                          className={`flex-1 h-10 px-4 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap truncate ${
                            isRentedOrConflicted
                              ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                              : "bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white hover:shadow-md"
                          }`}
                        >
                          <ZapIcon size={13} className="shrink-0" />
                          <span className="truncate">
                            {isRentedOrConflicted
                              ? car.status === "Maintenance"
                                ? "Maintenance"
                                : car.conflict || car.statusForDates === "Reserved"
                                  ? "Reserved"
                                  : "Rented"
                              : "Instant Book"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* LIST VIEW: High-Density Studio Rows */
          <div className="space-y-4">
            {filteredCars.map((car) => {
              const pricing = calculateRentalPrice({
                car,
                isSameDay: isSameDayBooking,
                sameDayHours,
                days: tripDurationDays,
              })
              const tripTotal = pricing.basePrice

              const isRentedOrConflicted =
                car.status === "Maintenance" ||
                car.status === "Rented" ||
                car.statusForDates === "Reserved" ||
                (Boolean(car.conflict) &&
                  car.conflict?.status !== "Invalid Dates") ||
                (car.isAvailableForDates === false &&
                  car.conflict?.status !== "Invalid Dates")

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-xl border border-stone-200 hover:border-orange-300 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-5 group"
                >
                  {/* Vehicle Image Frame */}
                  <div
                    className="w-full md:w-64 h-44 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0 relative flex items-center justify-center cursor-pointer border border-stone-100 select-none"
                    onClick={() => onSelectCar(car.id)}
                  >
                    <img
                      src={car.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-110 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-stone-50/50 pointer-events-none" />
                    <div className="absolute bottom-2 inset-x-6 h-2.5 bg-stone-900/10 rounded-full blur-[4px] pointer-events-none" />
                    <img
                      src={car.image}
                      alt={car.name}
                      loading="lazy"
                      className="relative z-10 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                    />
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <span className="bg-stone-900/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {car.year} • {car.type}
                      </span>
                    </div>
                    {isRentedOrConflicted && (
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {car.status === "Maintenance"
                            ? "Maintenance"
                            : car.conflict || car.statusForDates === "Reserved"
                              ? "Reserved"
                              : "Rented"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Specifications Column */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {car.brand}
                      </span>
                      <span className="text-stone-300">•</span>
                      <h3
                        onClick={() => onSelectCar(car.id)}
                        className="text-base sm:text-lg font-extrabold text-stone-900 font-heading hover:text-[#F97316] transition-colors cursor-pointer"
                      >
                        {car.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold ml-auto sm:ml-0 bg-amber-50 px-2 py-0.5 rounded-md">
                        <StarIcon size={12} filled />
                        <span>{car.rating}</span>
                        <span className="text-stone-400 font-normal">
                          ({car.reviewsCount || 48})
                        </span>
                      </div>
                    </div>

                    {/* Garage Hub Location */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                      <LocationIcon size={14} className="text-[#F97316] shrink-0" />
                      <span>
                        {car.garageName ||
                          car.garageAddress ||
                          car.location ||
                          "Miami Executive Garage"}
                      </span>
                      {car.garageBay && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.5 rounded">
                          Bay {car.garageBay}
                        </span>
                      )}
                      <a
                        href={
                          car.garageLat && car.garageLng
                            ? `https://www.google.com/maps/search/?api=1&query=${car.garageLat},${car.garageLng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                car.garageAddress ||
                                  car.garageName ||
                                  car.location ||
                                  "Pit Stop Central Garage (Mgarr)",
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto text-[11px] font-bold text-[#F97316] hover:text-[#EA580C] hover:underline shrink-0"
                        title="View garage location on Google Maps"
                      >
                        Maps ↗
                      </a>
                    </div>

                    {/* Specs row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 pt-1 font-medium">
                      <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                        <UserIcon size={13} className="text-stone-400" />
                        {car.seats} Passengers
                      </span>
                      <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                        <TransmissionIcon size={13} className="text-stone-400" />
                        {car.transmission}
                      </span>
                      <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                        <FuelIcon size={13} className="text-stone-400" />
                        {car.fuelType}
                      </span>
                      <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                        <SparklesIcon size={13} className="text-stone-400" />
                        {formatFuelDisplay(car.mileage, car.fuelType)}
                      </span>
                    </div>

                    {/* Top Features */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-stone-500 pt-1">
                      {(car.features || []).slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="flex items-center gap-1 text-stone-600 font-medium"
                        >
                          <CheckIcon size={11} className="text-[#F97316]" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Price & Actions Block */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-60 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 gap-3 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-black text-stone-900 font-heading">
                        €{car.pricePerDay}
                        <span className="text-xs font-semibold text-stone-500">
                          /day
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">
                        €{car.pricePerHour || 8}/hr • €
                        {car.pricePerWeek || Math.round(car.pricePerDay * 6)}/wk •
                        €
                        {car.pricePerMonth || Math.round(car.pricePerDay * 22)}
                        /mo
                      </div>
                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        €{tripTotal} total • {pricing.durationText}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCar(car.id)}
                        className="h-10 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        disabled={isRentedOrConflicted}
                        onClick={() => {
                          if (!isRentedOrConflicted) {
                            if (onQuickBook) onQuickBook(car.id)
                            else onSelectCar(car.id)
                          }
                        }}
                        className={`h-10 px-4 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                          isRentedOrConflicted
                            ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                            : "bg-[#F97316] hover:bg-[#EA580C] text-white hover:shadow-md"
                        }`}
                      >
                        <ZapIcon size={12} />
                        <span>
                          {isRentedOrConflicted
                            ? car.status === "Maintenance"
                              ? "Maintenance"
                              : car.conflict || car.statusForDates === "Reserved"
                                ? "Reserved"
                                : "Rented"
                            : "Book"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
