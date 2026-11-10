import React, { useState, useMemo } from "react"
import type { Car, CarStatus } from "../../types"
import {
  CarIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  WrenchIcon,
  CheckIcon,
} from "../../components/Icons"

interface AdminFleetViewProps {
  cars: Car[]
  searchQuery: string
  onAddCar: () => void
  onEditCar: (car: Car) => void
  onDeleteCar: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: CarStatus) => Promise<void>
}

type FleetStatusFilter = "all" | "available" | "rented" | "maintenance"

export default function AdminFleetView({
  cars,
  searchQuery,
  onAddCar,
  onEditCar,
  onDeleteCar,
  onUpdateStatus,
}: AdminFleetViewProps) {
  const [statusFilter, setStatusFilter] = useState<FleetStatusFilter>("all")
  const [localSearch, setLocalSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Status counters
  const counts = useMemo(() => {
    let available = 0
    let rented = 0
    let maintenance = 0

    cars.forEach((c) => {
      const s = (c.status || "available").toLowerCase()
      if (s === "rented") rented++
      else if (s === "maintenance") maintenance++
      else available++
    })

    return { all: cars.length, available, rented, maintenance }
  }, [cars])

  // Filtered cars
  const filteredCars = useMemo(() => {
    let list = cars

    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const s = (c.status || "available").toLowerCase()
        if (statusFilter === "available") return s === "available"
        if (statusFilter === "rented") return s === "rented"
        if (statusFilter === "maintenance") return s === "maintenance"
        return true
      })
    }

    const term = (localSearch || searchQuery).trim().toLowerCase()
    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.type && c.type.toLowerCase().includes(term)) ||
          (c.plateNumber && c.plateNumber.toLowerCase().includes(term))
      )
    }

    return list
  }, [cars, statusFilter, localSearch, searchQuery])

  const handleToggleStatus = async (car: Car) => {
    const nextStatus: CarStatus =
      (car.status || "Available").toLowerCase() === "available" ? "Maintenance" : "Available"
    setUpdatingId(car.id)
    try {
      await onUpdateStatus(car.id, nextStatus)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (car: Car) => {
    if (window.confirm(`Are you sure you want to remove "${car.name}" from the fleet inventory?`)) {
      await onDeleteCar(car.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Fleet & Asset Inventory ({cars.length} Vehicles)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor vehicle availability, allocate garage bays, and toggle maintenance states.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddCar}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <PlusIcon size={14} />
          <span>+ Add New Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all" as FleetStatusFilter, label: "All Vehicles", count: counts.all },
            { id: "available" as FleetStatusFilter, label: "Available", count: counts.available },
            { id: "rented" as FleetStatusFilter, label: "On Road", count: counts.rented },
            { id: "maintenance" as FleetStatusFilter, label: "In Service", count: counts.maintenance },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search cars by name or plate..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredCars.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <CarIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No vehicles found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {localSearch || searchQuery
              ? "No cars match your search filter."
              : "Click the + Add New Vehicle button to add your first car."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCars.map((car) => {
            const status = (car.status || "Available").toLowerCase()
            const isAvailable = status === "available"
            const isRented = status === "rented"
            const isUpdating = updatingId === car.id

            return (
              <div
                key={car.id}
                className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl overflow-hidden shadow-2xs transition flex flex-col justify-between"
              >
                {/* Image & Plate Header */}
                <div className="relative h-40 bg-stone-100">
                  <img
                    src={car.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? "bg-emerald-600 text-white"
                          : isRented
                          ? "bg-blue-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {car.status || "Available"}
                    </span>
                  </div>
                  {car.plateNumber && (
                    <div className="absolute top-2.5 right-2.5 bg-stone-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-stone-700">
                      {car.plateNumber}
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">{car.name}</h3>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {car.type || "Sedan"} • {car.transmission || "Automatic"} • {car.fuelType || "Petrol"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-stone-900">
                          €{car.pricePerDay}
                        </div>
                        <div className="text-[10px] text-stone-400">per day</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                      <span>Seats: {car.seats || 5}</span>
                      <span>Odometer: {car.currentOdometer ? `${car.currentOdometer.toLocaleString()} km` : "Standard"}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Status Toggle Button */}
                    {!isRented && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggleStatus(car)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                          isAvailable
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        } disabled:opacity-50`}
                      >
                        {isAvailable ? (
                          <>
                            <WrenchIcon size={12} />
                            <span>Send to Service</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon size={12} />
                            <span>Set Available</span>
                          </>
                        )}
                      </button>
                    )}

                    {isRented && (
                      <span className="text-xs text-blue-700 font-bold px-2 py-1 bg-blue-50 rounded border border-blue-200">
                        Active on Trip
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditCar(car)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
                        title="Edit Vehicle Details"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(car)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Vehicle"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
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
