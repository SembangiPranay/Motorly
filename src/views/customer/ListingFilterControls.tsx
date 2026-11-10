import React from "react"
import type {
  Car,
  FilterState,
  VehicleType,
  Transmission,
  FuelType,
} from "../../types"

interface ListingFilterControlsProps {
  liveCars: Car[]
  filterState: FilterState
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>
  onTypeToggle: (type: VehicleType) => void
  onTransmissionToggle: (trans: Transmission) => void
  onFuelToggle: (fuel: FuelType) => void
  onSeatToggle: (seats: number) => void
}

export default function ListingFilterControls({
  liveCars,
  filterState,
  setFilterState,
  onTypeToggle,
  onTransmissionToggle,
  onFuelToggle,
  onSeatToggle,
}: ListingFilterControlsProps) {
  return (
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
                      onChange={() => onTypeToggle(type)}
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
            €{filterState.maxPrice}/day
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
        <div className="flex justify-between text-[11px] text-stone-400 font-bold">
          <span>€30/day</span>
          <span>€500/day</span>
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Transmission
        </h4>
        <div className="space-y-2">
          {(["Automatic", "Manual"] as Transmission[]).map((trans) => {
            const count = liveCars.filter((c) => c.transmission === trans).length
            const checked = filterState.transmissions.includes(trans)

            return (
              <label
                key={trans}
                className="flex items-center justify-between text-xs text-stone-700 cursor-pointer hover:text-black py-0.5 group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onTransmissionToggle(trans)}
                    className="w-4 h-4 rounded border-stone-300 text-[#F97316] focus:ring-[#F97316]"
                  />
                  <span className="font-semibold group-hover:text-[#F97316] transition-colors">
                    {trans}
                  </span>
                </div>
                <span className="text-stone-400 font-semibold text-[11px]">
                  ({count})
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="space-y-3 pt-3.5 border-t border-stone-100">
        <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
          Fuel &amp; Powertrain
        </h4>
        <div className="space-y-2">
          {(["Petrol", "Diesel", "Hybrid", "Electric"] as FuelType[]).map(
            (fuel) => {
              const count = liveCars.filter(
                (c) =>
                  c.fuelType === fuel ||
                  (fuel === "Petrol" && c.fuelType === "Gasoline"),
              ).length
              const checked = filterState.fuelTypes.includes(fuel)

              return (
                <label
                  key={fuel}
                  className="flex items-center justify-between text-xs text-stone-700 cursor-pointer hover:text-black py-0.5 group"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onFuelToggle(fuel)}
                      className="w-4 h-4 rounded border-stone-300 text-[#F97316] focus:ring-[#F97316]"
                    />
                    <span className="font-semibold group-hover:text-[#F97316] transition-colors">
                      {fuel}
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
                onClick={() => onSeatToggle(seatNum)}
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
}
