import React from "react"
import type { Car, FilterState, VehicleType } from "../../types"
import {
  SearchIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
} from "../../components/Icons"

interface ListingStickyToolbarProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeFilterCount: number
  onOpenMobileFilter: () => void
  compareCount: number
  onOpenCompare: () => void
  filterState: FilterState
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  liveCars: Car[]
  onTypeToggle: (type: VehicleType) => void
  onFuelToggle: (fuel: any) => void
  clearAllFilters: () => void
}

export default function ListingStickyToolbar({
  searchQuery,
  setSearchQuery,
  activeFilterCount,
  onOpenMobileFilter,
  compareCount,
  onOpenCompare,
  filterState,
  setFilterState,
  viewMode,
  setViewMode,
  liveCars,
  onTypeToggle,
  onFuelToggle,
  clearAllFilters,
}: ListingStickyToolbarProps) {
  return (
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
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 sm:pb-0 w-full sm:w-auto">
            {/* Filter Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenMobileFilter}
              className="h-10 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap transition"
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
              onClick={onOpenCompare}
              className={`h-10 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                compareCount > 0
                  ? "bg-[#F97316] hover:bg-[#EA580C] text-white ring-2 ring-orange-300 shadow-md"
                  : "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 hover:border-orange-300"
              }`}
              title="Open Side-by-Side Comparison Studio"
            >
              <span className="text-orange-500 font-bold">&#8644;</span>
              <span className="font-extrabold hidden min-[400px]:inline">
                Compare
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  compareCount > 0
                    ? "bg-white text-[#F97316]"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {compareCount}
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
                type="button"
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
                type="button"
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

        {/* Quick Filter Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-1 pt-1 text-xs border-t border-stone-100">
          <button
            type="button"
            onClick={clearAllFilters}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterState.types.length === 0 &&
              filterState.maxPrice === 500 &&
              !searchQuery
                ? "bg-[#17191C] text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {liveCars.length > 0 ? `All (${liveCars.length})` : "All Vehicles"}
          </button>
          <button
            type="button"
            onClick={() => onTypeToggle("SUV")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterState.types.includes("SUV")
                ? "bg-[#F97316] text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {liveCars.filter((c) => c.type === "SUV").length > 0
              ? `SUVs (${liveCars.filter((c) => c.type === "SUV").length})`
              : "SUVs"}
          </button>
          <button
            type="button"
            onClick={() => onTypeToggle("Sedan")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterState.types.includes("Sedan")
                ? "bg-[#F97316] text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {liveCars.filter((c) => c.type === "Sedan").length > 0
              ? `Sedans (${liveCars.filter((c) => c.type === "Sedan").length})`
              : "Sedans"}
          </button>
          <button
            type="button"
            onClick={() => onTypeToggle("Luxury")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterState.types.includes("Luxury")
                ? "bg-[#F97316] text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {liveCars.filter((c) => c.type === "Luxury").length > 0
              ? `Luxury (${liveCars.filter((c) => c.type === "Luxury").length})`
              : "Luxury"}
          </button>
          <button
            type="button"
            onClick={() => onFuelToggle("Hybrid")}
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
            type="button"
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
            Under €60/day
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs font-bold text-[#F97316] hover:underline cursor-pointer whitespace-nowrap px-2 shrink-0"
            >
              Clear Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
