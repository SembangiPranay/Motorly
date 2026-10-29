import React, { useState, useMemo, useEffect } from "react"

import { createPortal } from "react-dom"

import type {
  Car,
  FilterState,
  BookingState,
  VehicleType,
  Transmission,
  FuelType,
} from "../types"

import { api } from "../services/api"

import DateSchedulingModal from "../components/DateSchedulingModal"

import { calculateRentalPrice } from "../utils/pricing"

import {
  HeartIcon,
  ArrowRightIcon,
  FilterIcon,
  LocationIcon,
  CalendarIcon,
  CheckIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  ZapIcon,
  StarIcon,
  UserIcon,
  TransmissionIcon,
  FuelIcon,
  SparklesIcon,
} from "../components/Icons"

interface ListingViewProps {
  cars: Car[]

  bookingState: BookingState

  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>

  filterState: FilterState

  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>

  favorites: string[]

  onToggleFavorite: (id: string) => void

  compareIds?: string[]

  setCompareIds?: React.Dispatch<React.SetStateAction<string[]>>

  onNavigateCompare?: () => void

  onSelectCar: (carId: string) => void

  onQuickBook?: (carId: string) => void
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return ""

  try {
    const parts = dateStr.split("-")

    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)

      const month = parseInt(parts[1], 10) - 1

      const day = parseInt(parts[2], 10)

      const d = new Date(year, month, day)

      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    }
  } catch {}

  return dateStr
}

export default function ListingView({
  cars: initialCars,

  bookingState,

  setBookingState,

  filterState,

  setFilterState,

  favorites,

  onToggleFavorite,

  compareIds: propCompareIds,

  setCompareIds: propSetCompareIds,

  onNavigateCompare,

  onSelectCar,

  onQuickBook,
}: ListingViewProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const [desktopFilterOpen, setDesktopFilterOpen] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [internalCompareIds, setInternalCompareIds] = useState<string[]>([])

  const compareIds = propCompareIds ?? internalCompareIds

  const setCompareIds = propSetCompareIds ?? setInternalCompareIds

  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Live Backend Synced Fleet State

  const [liveCars, setLiveCars] = useState<Car[]>(initialCars)

  const [backendSyncing, setBackendSyncing] = useState(false)

  // Calculate exact days between pickup and return dates dynamically

  const tripDurationDays = useMemo(() => {
    try {
      const start = Date.parse(bookingState.pickupDate)

      const end = Date.parse(bookingState.returnDate)

      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
      }
    } catch {}

    return bookingState.rentalDurationDays || 3
  }, [
    bookingState.pickupDate,

    bookingState.returnDate,

    bookingState.rentalDurationDays,
  ])

  const isSameDayBooking = useMemo(() => {
    if (!bookingState.pickupDate || !bookingState.returnDate) return false

    const p = new Date(bookingState.pickupDate)

    const r = new Date(bookingState.returnDate)

    if (isNaN(p.getTime()) || isNaN(r.getTime())) {
      return bookingState.pickupDate.trim() === bookingState.returnDate.trim()
    }

    return (
      p.getFullYear() === r.getFullYear() &&
      p.getMonth() === r.getMonth() &&
      p.getDate() === r.getDate()
    )
  }, [bookingState.pickupDate, bookingState.returnDate])

  const sameDayHours = useMemo(() => {
    if (!isSameDayBooking) return 0

    const parseHour = (t?: string): number => {
      if (!t) return 10

      const parts = t.split(" ")

      const time = parts[0] || "10:00"

      const modifier = parts[1] || "AM"

      let [h] = time.split(":").map(Number)

      if (modifier === "PM" && h < 12) h += 12

      if (modifier === "AM" && h === 12) h = 0

      return h
    }

    const pHour = parseHour(bookingState.pickupTime)

    const rHour = parseHour(bookingState.returnTime)

    return Math.max(0, rHour - pHour)
  }, [isSameDayBooking, bookingState.pickupTime, bookingState.returnTime])

  // Synchronize with backend availability on mount and when dates change

  useEffect(() => {
    let isMounted = true

    async function syncBackendAvailability() {
      setBackendSyncing(true)

      try {
        const freshCars = await api.getCars({
          pickupDate: bookingState.pickupDate,

          returnDate: bookingState.returnDate,
        })

        if (isMounted && Array.isArray(freshCars)) {
          setLiveCars(freshCars)
        }
      } catch (err) {
        console.warn("Backend dynamic fleet sync:", err)
      } finally {
        if (isMounted) setBackendSyncing(false)
      }
    }

    syncBackendAvailability()

    return () => {
      isMounted = false
    }
  }, [bookingState.pickupDate, bookingState.returnDate])

  // Keep liveCars updated if initialCars changes from parent

  useEffect(() => {
    if (Array.isArray(initialCars)) {
      if (initialCars.length === 0) {
        setLiveCars([])
      } else {
        setLiveCars((prev) => {
          return initialCars.map((ic) => {
            const match = prev.find((p) => p.id === ic.id)

            return match
              ? {
                  ...ic,

                  isAvailableForDates: match.isAvailableForDates,

                  conflict: match.conflict,

                  statusForDates: match.statusForDates,
                }
              : ic
          })
        })
      }
    }
  }, [initialCars])

  // Filter & Sort calculation

  const filteredCars = useMemo(() => {
    return liveCars

      .filter((car) => {
        // Text Search

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()

          const matchName = car.name.toLowerCase().includes(q)

          const matchBrand = car.brand.toLowerCase().includes(q)

          const matchType = car.type.toLowerCase().includes(q)

          const matchLocation = (
            car.garageName ||
            car.garageAddress ||
            car.location ||
            ""
          )

            .toLowerCase()

            .includes(q)

          if (!matchName && !matchBrand && !matchType && !matchLocation)
            return false
        }

        // Vehicle Type filter

        if (
          filterState.types.length > 0 &&
          !filterState.types.includes(car.type)
        ) {
          return false
        }

        // Price filter

        if (car.pricePerDay > filterState.maxPrice) {
          return false
        }

        // Transmission filter

        if (
          filterState.transmissions.length > 0 &&
          !filterState.transmissions.includes(car.transmission)
        ) {
          return false
        }

        // Fuel Type filter

        if (
          filterState.fuelTypes.length > 0 &&
          !filterState.fuelTypes.includes(car.fuelType)
        ) {
          return false
        }

        // Seats filter

        if (filterState.seats.length > 0) {
          const matchSeat = filterState.seats.some((s) => {
            if (s === 6) return car.seats >= 6

            return car.seats === s
          })

          if (!matchSeat) return false
        }

        // Features filter

        if (filterState.features.length > 0) {
          const hasAllFeatures = filterState.features.every((f) =>
            (car.features || []).some((cf) =>
              cf.toLowerCase().includes(f.toLowerCase()),
            ),
          )

          if (!hasAllFeatures) return false
        }

        return true
      })

      .sort((a, b) => {
        if (filterState.sortBy === "price-asc")
          return a.pricePerDay - b.pricePerDay

        if (filterState.sortBy === "price-desc")
          return b.pricePerDay - a.pricePerDay

        if (filterState.sortBy === "rating") return b.rating - a.rating

        return 0 // recommended
      })
  }, [liveCars, filterState, searchQuery])

  const activeFilterCount =
    filterState.types.length +
    (filterState.maxPrice < 500 ? 1 : 0) +
    filterState.transmissions.length +
    filterState.fuelTypes.length +
    filterState.seats.length +
    filterState.features.length +
    (searchQuery.trim() ? 1 : 0)

  const handleTypeToggle = (type: VehicleType) => {
    setFilterState((prev) => {
      const exists = prev.types.includes(type)

      return {
        ...prev,

        types: exists
          ? prev.types.filter((t) => t !== type)
          : [...prev.types, type],
      }
    })
  }

  const handleTransmissionToggle = (trans: Transmission) => {
    setFilterState((prev) => {
      const exists = prev.transmissions.includes(trans)

      return {
        ...prev,

        transmissions: exists
          ? prev.transmissions.filter((t) => t !== trans)
          : [...prev.transmissions, trans],
      }
    })
  }

  const handleFuelToggle = (fuel: FuelType) => {
    setFilterState((prev) => {
      const exists = prev.fuelTypes.includes(fuel)

      return {
        ...prev,

        fuelTypes: exists
          ? prev.fuelTypes.filter((f) => f !== fuel)
          : [...prev.fuelTypes, fuel],
      }
    })
  }

  const handleSeatToggle = (seats: number) => {
    setFilterState((prev) => {
      const exists = prev.seats.includes(seats)

      return {
        ...prev,

        seats: exists
          ? prev.seats.filter((s) => s !== seats)
          : [...prev.seats, seats],
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")

    setFilterState({
      types: [],

      maxPrice: 500,

      transmissions: [],

      fuelTypes: [],

      seats: [],

      features: [],

      sortBy: "recommended",
    })
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    )
  }

  const comparedCars = liveCars.filter((c) => compareIds.includes(c.id))

  // Shared Filter Controls (Used in Desktop Sidebar & Mobile Bottom Sheet Drawer)

  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Vehicle Type */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Vehicle Category
        </h4>
        <div className="space-y-2">
          {(["Economy", "Sedan", "SUV", "Luxury", "Van"] as VehicleType[]).map(
            (type) => {
              const count = liveCars.filter((c) => c.type === type).length

              const checked = filterState.types.includes(type)

              return (
                <label
                  key={type}
                  className="flex items-center justify-between text-xs text-stone-700 cursor-pointer hover:text-black py-0.5 group"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTypeToggle(type)}
                      className="w-4 h-4 rounded border-stone-300 text-[#F97316] focus:ring-[#F97316]"
                    />
                    <span className="font-semibold group-hover:text-[#F97316] transition-colors">
                      {type}
                    </span>
                  </div>
                  <span className="text-stone-400 font-semibold text-[11px]">
                    ({count})
                  </span>
                </label>
              )
            },
          )}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
            Max Daily Rate
          </h4>
          <span className="text-sm font-black text-[#F97316] font-mono">
            ${filterState.maxPrice}/day
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="500"
          step="10"
          value={filterState.maxPrice}
          onChange={(e) =>
            setFilterState((prev) => ({
              ...prev,

              maxPrice: Number(e.target.value),
            }))
          }
          className="w-full accent-[#F97316] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] font-semibold text-stone-400 font-mono">
          <span>$30</span>
          <span>$250</span>
          <span>$500</span>
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Transmission
        </h4>
        <div className="space-y-2">
          {(["Automatic", "Manual"] as Transmission[]).map((label) => (
            <label
              key={label}
              className="flex items-center justify-between text-xs text-stone-700 cursor-pointer hover:text-black"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterState.transmissions.includes(label)}
                  onChange={() => handleTransmissionToggle(label)}
                  className="w-4 h-4 rounded border-stone-300 text-[#F97316] focus:ring-[#F97316]"
                />
                <span className="font-semibold">{label}</span>
              </div>
              <span className="text-stone-400 font-semibold text-[11px]">
                ({liveCars.filter((c) => c.transmission === label).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fuel & Powertrain */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Powertrain &amp; Fuel
        </h4>
        <div className="space-y-2">
          {(["Gasoline", "Hybrid", "Electric"] as FuelType[]).map((label) => (
            <label
              key={label}
              className="flex items-center justify-between text-xs text-stone-700 cursor-pointer hover:text-black"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterState.fuelTypes.includes(label)}
                  onChange={() => handleFuelToggle(label)}
                  className="w-4 h-4 rounded border-stone-300 text-[#F97316] focus:ring-[#F97316]"
                />
                <span className="font-semibold">{label}</span>
              </div>
              <span className="text-stone-400 font-semibold text-[11px]">
                ({liveCars.filter((c) => c.fuelType === label).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Passenger Capacity */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Passenger Capacity
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {[2, 4, 5, 6].map((seatNum) => {
            const isChecked = filterState.seats.includes(seatNum)

            return (
              <button
                key={seatNum}
                type="button"
                onClick={() => handleSeatToggle(seatNum)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isChecked
                    ? "bg-[#F97316] text-white border-[#F97316] shadow-xs"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400"
                }`}
              >
                {seatNum === 6 ? "5+" : seatNum} Seats
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="pb-28 animate-fade-in bg-[#FAF7F2] text-stone-900 min-h-screen">
      {/* Top Showroom Header Banner */}
      <div className="relative bg-white border-b border-stone-200/90 py-5 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden shadow-xs">
        <div className="relative w-full max-w-[1780px] mx-auto z-10 text-center space-y-2.5 sm:space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest">
            <SparklesIcon size={12} />
            <span>Verified Fleet Inventory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading text-[#17191C]">
            Find Your Ideal Vehicle
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto font-medium hidden sm:block">
            Inspected garage fleet ready for reservation, direct manager review,
            and garage pickup.
          </p>

          {/* Sleek, Luxury Trip Summary Strip (Tapping opens DateSchedulingModal immediately) */}
          <div
            onClick={() => setIsScheduleModalOpen(true)}
            className="w-full max-w-3xl mx-auto mt-3 sm:mt-5 bg-stone-50/80 hover:bg-stone-100/90 rounded-2xl p-2.5 sm:p-3.5 text-[#17191C] shadow-xs flex items-center justify-between gap-2.5 sm:gap-4 border border-stone-200/80 hover:border-orange-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100/80 text-[#F97316] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CalendarIcon size={18} />
              </div>

              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-tight">
                    {isSameDayBooking ? (
                      <>
                        {formatDisplayDate(bookingState.pickupDate)} •{" "}
                        <span className="text-[#F97316]">
                          {bookingState.pickupTime} → {bookingState.returnTime}
                        </span>{" "}
                        (Same Day)
                      </>
                    ) : (
                      <>
                        {formatDisplayDate(bookingState.pickupDate)} (
                        {bookingState.pickupTime}) –{" "}
                        {formatDisplayDate(bookingState.returnDate)} (
                        {bookingState.returnTime})
                      </>
                    )}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-[#F97316] bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                    {isSameDayBooking
                      ? `⚡ Same-Day (${sameDayHours} Hours)`
                      : `${tripDurationDays} ${
                          tripDurationDays === 1 ? "day" : "days"
                        }`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 font-medium truncate mt-0.5">
                  <LocationIcon size={12} className="text-[#F97316] shrink-0" />
                  <span className="truncate">
                    {bookingState.pickupLocation ||
                      "Fleet Garage Hub (Set by Owner)"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()

                setIsScheduleModalOpen(true)
              }}
              className="px-3 sm:px-4 py-2 bg-white group-hover:bg-[#F97316] text-stone-700 group-hover:text-white border border-stone-200 group-hover:border-[#F97316] text-xs font-bold rounded-xl transition-all ml-auto shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Change</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* STICKY TOOLBAR: Stays pinned at top when scrolling down */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs py-2.5 sm:py-3 px-3 sm:px-6 lg:px-8 xl:px-10 transition-all">
        <div className="w-full max-w-[1780px] mx-auto space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Live Search Bar */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search make, model, or hub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/80 text-stone-900 font-medium shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Controls Row with smooth no-scrollbar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 sm:pb-0 w-full sm:w-auto">
              {/* Desktop Filter Toggle */}
              <button
                type="button"
                onClick={() => setDesktopFilterOpen(!desktopFilterOpen)}
                className={`hidden lg:flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                  desktopFilterOpen
                    ? "bg-stone-100 text-stone-900 border-stone-300"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                <FilterIcon
                  size={14}
                  className={desktopFilterOpen ? "text-[#F97316]" : ""}
                />
                <span>
                  {desktopFilterOpen ? "Hide Filters" : "Show Filters"}
                </span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#F97316] text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden h-10 px-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
              >
                <FilterIcon size={14} className="text-[#F97316]" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#F97316] text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Compare Studio Button */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateCompare) onNavigateCompare()
                  else setIsCompareOpen(true)
                }}
                className={`h-10 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                  compareIds.length > 0
                    ? "bg-[#F97316] hover:bg-[#EA580C] text-white ring-2 ring-orange-300 shadow-md"
                    : "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 hover:border-orange-300"
                }`}
                title="Open Side-by-Side Comparison Studio"
              >
                <span>⚖️</span>
                <span className="font-extrabold hidden min-[400px]:inline">
                  Compare
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    compareIds.length > 0
                      ? "bg-white text-[#F97316]"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {compareIds.length}
                </span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 text-xs font-medium text-stone-500 shrink-0">
                <select
                  value={filterState.sortBy}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,

                      sortBy: e.target.value as FilterState["sortBy"],
                    }))
                  }
                  className="h-10 px-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F97316] cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="h-10 p-1 bg-stone-100 rounded-xl border border-stone-200 flex items-center shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`h-8 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    viewMode === "grid"
                      ? "bg-white text-[#F97316] shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <GridIcon size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`h-8 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    viewMode === "list"
                      ? "bg-white text-[#F97316] shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Category Pills: Zero Scrollbars */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-1 pt-1 text-xs border-t border-stone-100">
            <button
              onClick={clearAllFilters}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.types.length === 0 &&
                filterState.maxPrice === 500 &&
                !searchQuery
                  ? "bg-[#17191C] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              All Vehicles ({liveCars.length})
            </button>
            <button
              onClick={() => handleTypeToggle("SUV")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.types.includes("SUV")
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              SUVs ({liveCars.filter((c) => c.type === "SUV").length})
            </button>
            <button
              onClick={() => handleTypeToggle("Sedan")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.types.includes("Sedan")
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              Sedans ({liveCars.filter((c) => c.type === "Sedan").length})
            </button>
            <button
              onClick={() => handleTypeToggle("Luxury")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.types.includes("Luxury")
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              Luxury ({liveCars.filter((c) => c.type === "Luxury").length})
            </button>
            <button
              onClick={() => handleFuelToggle("Hybrid")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.fuelTypes.includes("Hybrid")
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              Hybrid &amp; EV (
              {
                liveCars.filter(
                  (c) => c.fuelType === "Hybrid" || c.fuelType === "Electric",
                ).length
              }
              )
            </button>
            <button
              onClick={() =>
                setFilterState((prev) => ({
                  ...prev,

                  maxPrice: prev.maxPrice <= 60 ? 500 : 60,
                }))
              }
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                filterState.maxPrice <= 60
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              Under $60/day
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs font-bold text-[#F97316] hover:underline cursor-pointer whitespace-nowrap px-2 shrink-0"
              >
                Clear Filters ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Width Fleet Explorer Viewport */}
      <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-5">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Desktop Sidebar Filter Panel */}
          {desktopFilterOpen && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-6 lg:sticky lg:top-[128px] max-h-[calc(100vh-148px)] overflow-y-auto scrollbar-thin z-20">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                <h3 className="font-extrabold text-base text-stone-900 font-heading flex items-center gap-2">
                  <FilterIcon size={18} className="text-[#F97316]" />
                  Fleet Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
                  >
                    Reset All ({activeFilterCount})
                  </button>
                )}
              </div>

              {renderFilterControls()}
            </aside>
          )}

          {/* Right Main Vehicle Display Section */}
          <main className="flex-1 min-w-0 w-full space-y-4">
            {/* Results Header Counter & Live Status Indicator */}
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
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
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center mx-auto text-2xl font-bold">
                  🚗
                </div>
                <h3 className="text-lg font-extrabold text-stone-900 font-heading">
                  No vehicles match your active criteria
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Try adjusting your price ceiling or clearing specific category
                  filters to view available garage vehicles.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW: High-Impact Visual Showcase */

              <div
                className={`grid gap-5 sm:gap-6 ${
                  desktopFilterOpen
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                }`}
              >
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

                  // Dynamic conflict & availability check against requested dates

                  const isRentedOrConflicted =
                    car.status === "Rented" ||
                    car.statusForDates === "Reserved" ||
                    car.isAvailableForDates === false

                  return (
                    <div
                      key={car.id}
                      className="bg-white rounded-3xl border border-stone-200/90 hover:border-orange-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Framed Image Showcase: Clean 4-corner badges */}
                      <div
                        className="relative h-52 sm:h-56 w-full bg-gradient-to-b from-stone-50 via-stone-100/50 to-stone-50/20 flex items-center justify-center overflow-hidden cursor-pointer rounded-t-3xl border-b border-stone-100 select-none"
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
                            <span className="bg-rose-600/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              {car.conflict ? "Reserved" : "Rented"}
                            </span>
                          ) : (
                            <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Available
                            </span>
                          )}
                        </div>

                        {/* Top Right: Glassmorphism Action Buttons (Compare & Favorite) */}
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
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition shadow-xs cursor-pointer backdrop-blur-md ${
                              isCompared
                                ? "bg-[#F97316] text-white border-orange-500 ring-2 ring-orange-300"
                                : "bg-white/90 text-stone-700 border-stone-200 hover:border-[#F97316] hover:text-[#F97316]"
                            }`}
                          >
                            <span className="text-xs sm:text-sm">⚖️</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()

                              onToggleFavorite(car.id)
                            }}
                            title={
                              isFav ? "Saved to favorites" : "Save to favorites"
                            }
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
                            <StarIcon
                              size={11}
                              filled
                              className="text-amber-500"
                            />
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

                          {/* Garage Hub Location (Owner-Defined Garage) */}
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
                          </div>

                          {/* 4 Micro Specs Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-xs text-stone-600 font-medium">
                            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                              <UserIcon
                                size={12}
                                className="text-stone-400 shrink-0"
                              />
                              <span className="truncate">
                                {car.seats} Seats
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                              <TransmissionIcon
                                size={12}
                                className="text-stone-400 shrink-0"
                              />
                              <span className="truncate">
                                {car.transmission}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                              <FuelIcon
                                size={12}
                                className="text-stone-400 shrink-0"
                              />
                              <span className="truncate">{car.fuelType}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                              <SparklesIcon
                                size={12}
                                className="text-stone-400 shrink-0"
                              />
                              <span className="truncate">
                                {car.mileage || "32 MPG"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Booking Actions Footer */}
                        <div className="pt-3 border-t border-stone-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-stone-900 font-heading">
                                  ${car.pricePerDay}
                                </span>
                                <span className="text-xs text-stone-500 font-semibold">
                                  /day
                                </span>
                                <span className="text-[11px] text-stone-400 font-medium ml-1">
                                  (${car.pricePerHour}/hr • $
                                  {car.pricePerMonth ||
                                    Math.round(car.pricePerDay * 22)}
                                  /mo)
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                <CheckIcon size={11} />
                                <span>
                                  ${tripTotal} total • {pricing.durationText}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Clean 2-Button Action Row on Mobile */}
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => onSelectCar(car.id)}
                              className="h-10 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Details
                            </button>

                            <button
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
                                  ? car.conflict
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
                    car.status === "Rented" ||
                    car.statusForDates === "Reserved" ||
                    car.isAvailableForDates === false

                  return (
                    <div
                      key={car.id}
                      className="bg-white rounded-3xl border border-stone-200 hover:border-orange-300 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-5 group"
                    >
                      {/* Vehicle Image Frame */}
                      <div
                        className="w-full md:w-64 h-44 rounded-2xl overflow-hidden bg-stone-50 flex-shrink-0 relative flex items-center justify-center cursor-pointer border border-stone-100 select-none"
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
                              {car.conflict ? "Reserved" : "Rented"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle Specifications & Highlights Column */}
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
                          <LocationIcon
                            size={14}
                            className="text-[#F97316] shrink-0"
                          />
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
                        </div>

                        {/* Specs row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 pt-1 font-medium">
                          <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                            <UserIcon size={13} className="text-stone-400" />
                            {car.seats} Passengers
                          </span>
                          <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                            <TransmissionIcon
                              size={13}
                              className="text-stone-400"
                            />
                            {car.transmission}
                          </span>
                          <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                            <FuelIcon size={13} className="text-stone-400" />
                            {car.fuelType}
                          </span>
                          <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5">
                            <SparklesIcon
                              size={13}
                              className="text-stone-400"
                            />
                            {car.mileage || "32 MPG"}
                          </span>
                        </div>

                        {/* Top Features */}
                        <div className="flex flex-wrap gap-2 text-[11px] text-stone-500 pt-1">
                          {(car.features || []).slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="flex items-center gap-1 text-stone-600 font-medium"
                            >
                              <CheckIcon size={11} className="text-[#F97316]" />{" "}
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Price & Actions Block */}
                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-60 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 gap-3 shrink-0">
                        <div className="text-left md:text-right">
                          <div className="text-2xl font-black text-stone-900 font-heading">
                            ${car.pricePerDay}
                            <span className="text-xs font-semibold text-stone-500">
                              /day
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 font-medium">
                            ${car.pricePerHour || 8}/hr • $
                            {car.pricePerMonth ||
                              Math.round(car.pricePerDay * 22)}
                            /mo
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                            ${tripTotal} total • {pricing.durationText}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectCar(car.id)}
                            className="h-10 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                          >
                            Details
                          </button>
                          <button
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
                                ? car.conflict
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
      </div>

      {/* Floating Comparison Dock Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center px-4 w-full max-w-xl animate-fade-in pointer-events-none">
          <div className="pointer-events-auto bg-[#17191C]/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-white block">
                  {compareIds.length}{" "}
                  {compareIds.length === 1 ? "Vehicle" : "Vehicles"} in Compare
                  Studio
                </span>
                <span className="text-stone-400 text-[11px] hidden sm:inline">
                  Compare side-by-side specs, rates &amp; garage hubs
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCompareIds([])}
                className="px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (onNavigateCompare) onNavigateCompare()
                  else setIsCompareOpen(true)
                }}
                className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer ring-2 ring-orange-400/30"
              >
                <span>Open Studio</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet Modal Drawer (Slide-up native UX) */}
      {mobileFilterOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in lg:hidden"
            onClick={() => setMobileFilterOpen(false)}
          >
            <div
              className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-stone-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Drag Handle & Header */}
              <div className="pt-3 pb-3 px-5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FilterIcon size={18} className="text-[#F97316]" />
                  <h3 className="font-extrabold text-base text-stone-900 font-heading">
                    Fleet Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[11px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Controls */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                {renderFilterControls()}
              </div>

              {/* Sticky Apply Button */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/90 backdrop-blur-sm">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    Show {filteredCars.length} Available{" "}
                    {filteredCars.length === 1 ? "Vehicle" : "Vehicles"}
                  </span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          </div>,

          document.body,
        )}

      {/* Comparison Modal Drawer */}
      {isCompareOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
            onClick={() => setIsCompareOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-5 border border-stone-200 my-auto animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-stone-900 font-heading">
                    Vehicle Comparison
                  </h3>
                  <p className="text-xs text-stone-500">
                    Compare rates, seating, powertrain, and hub bays side by
                    side.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onNavigateCompare && (
                    <button
                      onClick={() => {
                        setIsCompareOpen(false)

                        onNavigateCompare()
                      }}
                      className="text-xs font-bold text-[#F97316] hover:text-orange-700 flex items-center gap-1 mr-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 transition cursor-pointer"
                    >
                      <span>Full Studio View</span>
                      <ArrowRightIcon size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsCompareOpen(false)}
                    className="text-stone-400 hover:text-stone-600 p-2 text-sm font-bold cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {comparedCars.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-stone-600 text-sm font-medium">
                    No vehicles currently selected for comparison.
                  </p>
                  {onNavigateCompare && (
                    <button
                      onClick={() => {
                        setIsCompareOpen(false)

                        onNavigateCompare()
                      }}
                      className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Open Comparison Studio with Fleet Presets
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {comparedCars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3"
                    >
                      <div className="h-32 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2 border border-stone-200/60">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-full h-full object-contain drop-shadow-sm"
                        />
                      </div>
                      <h4 className="font-bold text-stone-900 font-heading text-sm truncate">
                        {car.name}
                      </h4>
                      <div className="text-lg font-black text-[#F97316] font-heading">
                        ${car.pricePerDay}{" "}
                        <span className="text-xs font-normal text-stone-500">
                          /day
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-200 pt-2 font-medium">
                        <p>
                          <strong>Category:</strong> {car.type}
                        </p>
                        <p>
                          <strong>Seats:</strong> {car.seats} Passengers
                        </p>
                        <p>
                          <strong>Transmission:</strong> {car.transmission}
                        </p>
                        <p>
                          <strong>Fuel:</strong> {car.fuelType}
                        </p>
                        <p>
                          <strong>Luggage:</strong> {car.luggage}
                        </p>
                        <p>
                          <strong>MPG:</strong> {car.mileage}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsCompareOpen(false)

                          if (onQuickBook) onQuickBook(car.id)
                          else onSelectCar(car.id)
                        }}
                        className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Select {car.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,

          document.body,
        )}

      {/* Interactive Date & Scheduling Calendar Modal */}
      <DateSchedulingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        pickupDate={bookingState.pickupDate}
        pickupTime={bookingState.pickupTime}
        returnDate={bookingState.returnDate}
        returnTime={bookingState.returnTime}
        pickupLocation={bookingState.pickupLocation}
        onApply={(data) => {
          setBookingState((prev) => ({
            ...prev,

            ...data,
          }))
        }}
      />
    </div>
  )
}
