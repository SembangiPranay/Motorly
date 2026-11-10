import React from "react"
import { createPortal } from "react-dom"
import type { Car } from "../../types"
import { ArrowRightIcon } from "../../components/Icons"

interface ListingCompareDrawerProps {
  compareIds: string[]
  liveCars: Car[]
  isCompareOpen: boolean
  setIsCompareOpen: (open: boolean) => void
  onClearCompare: () => void
  onNavigateCompare?: () => void
  onSelectCar: (carId: string) => void
  onQuickBook?: (carId: string) => void
}

const formatFuelDisplay = (mileage?: string, fuelType?: string): string => {
  if (!mileage || !mileage.trim()) {
    return fuelType === "Electric" ? "100% EV" : "45 Liters"
  }
  return mileage.trim()
}

export default function ListingCompareDrawer({
  compareIds,
  liveCars,
  isCompareOpen,
  setIsCompareOpen,
  onClearCompare,
  onNavigateCompare,
  onSelectCar,
  onQuickBook,
}: ListingCompareDrawerProps) {
  const comparedCars = liveCars.filter((c) => compareIds.includes(c.id))

  return (
    <>
      {/* Floating Comparison Dock Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center px-4 w-full max-w-xl animate-fade-in pointer-events-none">
          <div className="pointer-events-auto bg-[#17191C]/95 backdrop-blur-md text-white px-5 py-3.5 rounded-xl shadow-2xl border border-stone-700/80 flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-white block">
                  {compareIds.length}{" "}
                  {compareIds.length === 1 ? "Vehicle" : "Vehicles"} in Compare Studio
                </span>
                <span className="text-stone-400 text-[11px] hidden sm:inline">
                  Compare side-by-side specs, rates &amp; garage hubs
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClearCompare}
                className="px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
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

      {/* Comparison Modal Drawer */}
      {isCompareOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
            onClick={() => setIsCompareOpen(false)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-5 border border-stone-200 my-auto animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-stone-900 font-heading">
                    Vehicle Comparison
                  </h3>
                  <p className="text-xs text-stone-500">
                    Compare rates, seating, powertrain, and hub bays side by side.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onNavigateCompare && (
                    <button
                      type="button"
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
                    type="button"
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
                      type="button"
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
                      className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3"
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
                        €{car.pricePerDay}{" "}
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
                          <strong>Tank / Battery:</strong>{" "}
                          {formatFuelDisplay(car.mileage, car.fuelType)}
                        </p>
                      </div>
                      <button
                        type="button"
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
    </>
  )
}
