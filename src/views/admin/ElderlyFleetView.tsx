import React, { useState, useMemo } from "react"
import type { Car, CarStatus } from "../../types"
import {
  CarIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  CheckIcon,
  WrenchIcon,
} from "../../components/Icons"

interface ElderlyFleetViewProps {
  cars: Car[]
  onAddCar: () => void
  onEditCar: (car: Car) => void
  onDeleteCar: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: CarStatus) => Promise<void>
}

export default function ElderlyFleetView({
  cars,
  onAddCar,
  onEditCar,
  onDeleteCar,
  onUpdateStatus,
}: ElderlyFleetViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Available" | "Rented" | "Maintenance">("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Status counts (case-insensitive for safety with existing DB records)
  const isCarAvailable = (c: Car) =>
    !c.status || c.status.toLowerCase() === "available"
  const isCarRented = (c: Car) =>
    c.status && (c.status.toLowerCase() === "rented" || c.status.toLowerCase() === "reserved")
  const isCarMaintenance = (c: Car) =>
    c.status && (c.status.toLowerCase() === "maintenance" || c.status.toLowerCase() === "cleaning")

  const availableCount = cars.filter(isCarAvailable).length
  const rentedCount = cars.filter(isCarRented).length
  const maintenanceCount = cars.filter(isCarMaintenance).length

  // Filtered cars
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // Status match
      if (statusFilter === "Available" && !isCarAvailable(car)) {
        return false
      }
      if (statusFilter === "Rented" && !isCarRented(car)) {
        return false
      }
      if (statusFilter === "Maintenance" && !isCarMaintenance(car)) {
        return false
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = car.name.toLowerCase().includes(q)
        const matchPlate = car.plateNumber?.toLowerCase().includes(q)
        const matchBrand = car.brand?.toLowerCase().includes(q)
        const matchType = car.type?.toLowerCase().includes(q)
        if (!matchName && !matchPlate && !matchBrand && !matchType) {
          return false
        }
      }

      return true
    })
  }, [cars, statusFilter, searchQuery])

  const handleStatusToggle = async (car: Car) => {
    if (updatingId) return
    const nextStatus: CarStatus = isCarMaintenance(car) ? "Available" : "Maintenance"
    try {
      setUpdatingId(car.id)
      await onUpdateStatus(car.id, nextStatus)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteClick = async (car: Car) => {
    if (updatingId) return
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${car.name}" from your garage fleet?`
    )
    if (!confirmDelete) return
    try {
      setUpdatingId(car.id)
      await onDeleteCar(car.id)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Add */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold tracking-wide uppercase mb-2">
            Garage Floor
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            My Garage Fleet
          </h1>
          <p className="text-stone-500 font-medium text-lg mt-1">
            Total of {cars.length} vehicles registered in your garage.
          </p>
        </div>

        {/* Big Add Car Button */}
        <div>
          <button
            type="button"
            onClick={onAddCar}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 min-h-[56px]"
          >
            <PlusIcon size={24} />
            <span>+ Add a Car to Fleet</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-5 rounded-2xl border-2 text-left transition ${
            statusFilter === "all"
              ? "bg-stone-900 border-stone-900 text-white shadow-md"
              : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
          }`}
        >
          <div className="text-sm font-bold uppercase tracking-wider opacity-80">
            Total Fleet
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1 font-mono">
            {cars.length}
          </div>
          <div className="text-xs font-medium opacity-80 mt-1">All vehicles</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Available")}
          className={`p-5 rounded-2xl border-2 text-left transition ${
            statusFilter === "Available"
              ? "bg-emerald-700 border-emerald-700 text-white shadow-md shadow-emerald-700/30"
              : "bg-white border-emerald-200 text-emerald-950 hover:bg-emerald-50/50"
          }`}
        >
          <div className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-100">
            🟢 Ready in Garage
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1 font-mono text-emerald-900 dark:text-white">
            {availableCount}
          </div>
          <div className="text-xs font-medium opacity-80 mt-1">Available to rent</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Rented")}
          className={`p-5 rounded-2xl border-2 text-left transition ${
            statusFilter === "Rented"
              ? "bg-blue-700 border-blue-700 text-white shadow-md shadow-blue-700/30"
              : "bg-white border-blue-200 text-blue-950 hover:bg-blue-50/50"
          }`}
        >
          <div className="text-sm font-bold uppercase tracking-wider text-blue-800 dark:text-blue-100">
            🔵 With Customers
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1 font-mono text-blue-900 dark:text-white">
            {rentedCount}
          </div>
          <div className="text-xs font-medium opacity-80 mt-1">Currently on trip</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Maintenance")}
          className={`p-5 rounded-2xl border-2 text-left transition ${
            statusFilter === "Maintenance"
              ? "bg-amber-700 border-amber-700 text-white shadow-md shadow-amber-700/30"
              : "bg-white border-amber-200 text-amber-950 hover:bg-amber-50/50"
          }`}
        >
          <div className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-100">
            🟠 Cleaning / Service
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1 font-mono text-amber-900 dark:text-white">
            {maintenanceCount}
          </div>
          <div className="text-xs font-medium opacity-80 mt-1">Needs attention</div>
        </button>
      </div>

      {/* Large-Target Search Bar */}
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400">
          <SearchIcon size={24} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cars by name or license plate..."
          className="w-full text-lg sm:text-xl font-medium pl-14 pr-12 py-4 bg-white rounded-2xl border-2 border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-500 shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Vehicle Grid */}
      {filteredCars.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-stone-200 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-3xl mx-auto mb-4">
            🚗
          </div>
          <h3 className="text-2xl font-bold text-stone-900 mb-2">
            No cars found matching your filter
          </h3>
          <p className="text-stone-500 font-medium mb-6">
            Try clearing your search query or selecting "Total Fleet".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
            }}
            className="px-6 py-3 rounded-2xl bg-stone-900 text-white font-bold text-base"
          >
            Show All Cars
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const isAvail = isCarAvailable(car)
            const isRent = isCarRented(car)
            const isMaint = isCarMaintenance(car)

            return (
              <div
                key={car.id}
                className="bg-white rounded-3xl border-2 border-stone-200 hover:border-stone-300 transition shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Status Badge */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                        <CarIcon size={56} />
                      </div>
                    )}

                    {/* Status Pill on top of photo */}
                    <div className="absolute top-3 left-3">
                      {isAvail && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          Ready in Garage
                        </span>
                      )}
                      {isRent && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          With Customer
                        </span>
                      )}
                      {isMaint && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          In Service / Wash
                        </span>
                      )}
                    </div>

                    {/* License Plate Badge on photo */}
                    {car.plateNumber && (
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-stone-900/90 text-white font-mono font-black text-sm rounded-lg shadow border border-white/20 tracking-wider">
                        {car.plateNumber}
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                          {car.type || "Vehicle"} • {car.year || "2024"}
                        </span>
                        <h3 className="text-2xl font-black text-stone-900 leading-tight">
                          {car.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-stone-900 font-mono">
                          ${car.pricePerDay}
                        </div>
                        <div className="text-xs font-bold text-stone-400 uppercase">
                          per day
                        </div>
                      </div>
                    </div>

                    {/* Spec tags */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-600">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100">
                        {car.transmission === "Manual" ? "Manual" : "Automatic"}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100">
                        {car.seats || 5} Seats
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100 capitalize">
                        {car.fuelType || "Gasoline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-6 pt-0 space-y-3">
                  {/* Status Toggle Button */}
                  {!isRent && (
                    <button
                      type="button"
                      disabled={updatingId === car.id}
                      onClick={() => handleStatusToggle(car)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-base transition flex items-center justify-center gap-2 border min-h-[48px] ${
                        isAvail
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                      }`}
                    >
                      {updatingId === car.id ? (
                        <span>Updating...</span>
                      ) : isAvail ? (
                        <>
                          <WrenchIcon size={18} className="text-amber-700" />
                          <span>Mark for Cleaning/Repairs</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon size={18} className="text-emerald-700" />
                          <span>Mark Ready to Rent</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Edit & Delete row */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditCar(car)}
                      className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-base transition flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <EditIcon size={18} />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === car.id}
                      onClick={() => handleDeleteClick(car)}
                      className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-500 font-bold transition flex items-center justify-center shrink-0"
                      title="Remove from fleet"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
