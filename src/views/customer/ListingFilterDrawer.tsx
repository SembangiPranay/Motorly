import React from "react"
import { createPortal } from "react-dom"
import type {
  Car,
  FilterState,
  VehicleType,
  Transmission,
  FuelType,
} from "../../types"
import { FilterIcon, ArrowRightIcon } from "../../components/Icons"
import ListingFilterControls from "./ListingFilterControls"

interface ListingFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  liveCars: Car[]
  filteredCarsCount: number
  filterState: FilterState
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>
  activeFilterCount: number
  onTypeToggle: (type: VehicleType) => void
  onTransmissionToggle: (trans: Transmission) => void
  onFuelToggle: (fuel: FuelType) => void
  onSeatToggle: (seats: number) => void
  clearAllFilters: () => void
}

export default function ListingFilterDrawer({
  isOpen,
  onClose,
  liveCars,
  filteredCarsCount,
  filterState,
  setFilterState,
  activeFilterCount,
  onTypeToggle,
  onTransmissionToggle,
  onFuelToggle,
  onSeatToggle,
  clearAllFilters,
}: ListingFilterDrawerProps) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex flex-col justify-end lg:justify-center lg:items-center bg-black/60 backdrop-blur-xs animate-fade-in p-0 lg:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-xl w-full lg:max-w-md max-h-[85vh] lg:max-h-[80vh] flex flex-col shadow-2xl animate-slide-up border border-stone-200"
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
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
              >
                Reset All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Filter Controls */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <ListingFilterControls
            liveCars={liveCars}
            filterState={filterState}
            setFilterState={setFilterState}
            onTypeToggle={onTypeToggle}
            onTransmissionToggle={onTransmissionToggle}
            onFuelToggle={onFuelToggle}
            onSeatToggle={onSeatToggle}
          />
        </div>

        {/* Sticky Apply Button */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/90 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>
              Show {filteredCarsCount} Available{" "}
              {filteredCarsCount === 1 ? "Vehicle" : "Vehicles"}
            </span>
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
