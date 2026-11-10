import React, { useState, useMemo, useEffect } from "react"
import type {
  Car,
  FilterState,
  VehicleType,
  Transmission,
  FuelType,
  BookingState,
} from "../types"
import { api } from "../services/api"
import DateSchedulingModal from "../components/DateSchedulingModal"
import ListingHeader from "./customer/ListingHeader"
import ListingStickyToolbar from "./customer/ListingStickyToolbar"
import ListingFilterDrawer from "./customer/ListingFilterDrawer"
import ListingVehicleGrid from "./customer/ListingVehicleGrid"
import ListingCompareDrawer from "./customer/ListingCompareDrawer"

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
        if (filterState.fuelTypes.length > 0) {
          const normalizedFuel =
            car.fuelType === "Gasoline" ? "Petrol" : car.fuelType
          if (
            !filterState.fuelTypes.includes(normalizedFuel) &&
            !filterState.fuelTypes.includes(car.fuelType)
          ) {
            return false
          }
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
        return 0
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

  return (
    <div className="pb-28 animate-fade-in bg-[#FAF7F2] text-stone-900 min-h-screen">
      {/* 1. Top Showroom Header Banner & Luxury Trip Summary */}
      <ListingHeader
        bookingState={bookingState}
        tripDurationDays={tripDurationDays}
        isSameDayBooking={isSameDayBooking}
        sameDayHours={sameDayHours}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
      />

      {/* 2. Pinned Sticky Navigation & Toolbar */}
      <ListingStickyToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilterCount={activeFilterCount}
        onOpenMobileFilter={() => setMobileFilterOpen(true)}
        compareCount={compareIds.length}
        onOpenCompare={() => {
          if (onNavigateCompare) onNavigateCompare()
          else setIsCompareOpen(true)
        }}
        filterState={filterState}
        setFilterState={setFilterState}
        viewMode={viewMode}
        setViewMode={setViewMode}
        liveCars={liveCars}
        onTypeToggle={handleTypeToggle}
        onFuelToggle={handleFuelToggle}
        clearAllFilters={clearAllFilters}
      />

      {/* 3. Main Full-Width Fleet Explorer Viewport */}
      <ListingVehicleGrid
        filteredCars={filteredCars}
        liveCars={liveCars}
        backendSyncing={backendSyncing}
        viewMode={viewMode}
        bookingState={bookingState}
        tripDurationDays={tripDurationDays}
        isSameDayBooking={isSameDayBooking}
        sameDayHours={sameDayHours}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        compareIds={compareIds}
        toggleCompare={toggleCompare}
        onSelectCar={onSelectCar}
        onQuickBook={onQuickBook}
        clearAllFilters={clearAllFilters}
      />

      {/* 4. Filter Bottom Sheet / Modal Drawer */}
      <ListingFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        liveCars={liveCars}
        filteredCarsCount={filteredCars.length}
        filterState={filterState}
        setFilterState={setFilterState}
        activeFilterCount={activeFilterCount}
        onTypeToggle={handleTypeToggle}
        onTransmissionToggle={handleTransmissionToggle}
        onFuelToggle={handleFuelToggle}
        onSeatToggle={handleSeatToggle}
        clearAllFilters={clearAllFilters}
      />

      {/* 5. Floating Compare Dock Bar & Modal */}
      <ListingCompareDrawer
        compareIds={compareIds}
        liveCars={liveCars}
        isCompareOpen={isCompareOpen}
        setIsCompareOpen={setIsCompareOpen}
        onClearCompare={() => setCompareIds([])}
        onNavigateCompare={onNavigateCompare}
        onSelectCar={onSelectCar}
        onQuickBook={onQuickBook}
      />

      {/* 6. Interactive Date & Scheduling Calendar Modal */}
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
