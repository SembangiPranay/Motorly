import React from "react"
import type { Car } from "../../types"
import {
  CheckIcon,
  ArrowRightIcon,
  PlusIcon,
  TagIcon,
  FuelIcon,
} from "../../components/Icons"

interface CommonFeature {
  name: string
  key: string
  category?: string
}

interface CompareTableProps {
  activeComparedCars: Car[]
  mobileCars: Car[]
  activeTab: "all" | "pricing" | "specs" | "garage" | "features"
  showOnlyDifferences: boolean
  priceWinner: { lowest: Car } | null
  commonFeatures: CommonFeature[]
  onQuickBook: (carId: string) => void
  onSelectCar: (carId: string) => void
  onSwapCar: (carId: string) => void
  onRemoveCar: (carId: string) => void
  onAddCar: () => void
}

export default function CompareTable({
  activeComparedCars,
  mobileCars,
  activeTab,
  showOnlyDifferences,
  priceWinner,
  commonFeatures,
  onQuickBook,
  onSelectCar,
  onSwapCar,
  onRemoveCar,
  onAddCar,
}: CompareTableProps) {
  return (
    <>
      {/* Mobile Stack View (< md) */}
      <div className="block md:hidden">
        {/* Sticky Mobile Vehicle Header Cards */}
        <div className="sticky top-16 z-20 bg-[#FAF7F2]/95 backdrop-blur-md pt-2 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {mobileCars.map((car) => {
              const isConflicted =
                car.status === "Maintenance" ||
                car.status === "Rented" ||
                car.statusForDates === "Reserved" ||
                car.isAvailableForDates === false

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-xl border border-stone-200/90 p-2.5 shadow-2xs flex flex-col justify-between"
                >
                  <div className="relative h-24 rounded-lg overflow-hidden bg-stone-100 mb-2 border border-stone-200/60">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onSwapCar(car.id)}
                      className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold backdrop-blur-xs flex items-center gap-1 hover:bg-[#F97316] transition cursor-pointer"
                    >
                      Swap
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/90 text-stone-800 backdrop-blur-xs">
                      {car.type}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h3 className="font-bold text-xs text-stone-900 truncate leading-tight">
                      {car.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-[#F97316] font-mono">
                        €{car.pricePerDay}
                      </span>
                      <span className="text-[10px] text-stone-400">/day</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled={isConflicted}
                      onClick={() => {
                        if (!isConflicted) onQuickBook(car.id)
                      }}
                      className={`w-full py-1.5 rounded-lg font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer ${
                        isConflicted
                          ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                          : "bg-[#F97316] hover:bg-[#EA580C] text-white"
                      }`}
                    >
                      {isConflicted
                        ? car.status === "Maintenance"
                          ? "Maintenance"
                          : "Reserved"
                        : "Reserve"}{" "}
                      {!isConflicted && <ArrowRightIcon size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectCar(car.id)}
                      className="w-full py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] transition text-center cursor-pointer"
                    >
                      Full Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Metric Sections */}
        <div className="space-y-3 mt-3">
          {(activeTab === "all" || activeTab === "pricing") && (
            <div className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs">
              <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon size={14} className="text-[#F97316]" />
                <span>1. Rates &amp; Payment Options</span>
              </div>
              <div className="divide-y divide-stone-100 text-xs p-3">
                <div className="grid grid-cols-2 gap-2">
                  {mobileCars.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-100 font-mono font-bold text-stone-900"
                    >
                      €{c.pricePerDay}/day
                      <span className="text-[10px] text-stone-400 block font-normal">
                        €{c.pricePerHour}/hr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === "all" || activeTab === "specs") && (
            <div className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs">
              <div className="bg-stone-100/80 px-3.5 py-2 border-b border-stone-200 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <FuelIcon size={14} className="text-[#F97316]" />
                <span>2. Powertrain &amp; Capacity</span>
              </div>
              <div className="divide-y divide-stone-100 text-xs p-3">
                <div className="grid grid-cols-2 gap-2">
                  {mobileCars.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-100 text-stone-800 space-y-1"
                    >
                      <p className="font-bold">{c.fuelType}</p>
                      <p className="text-[11px] text-stone-500">
                        {c.transmission} • {c.seats} Seats
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Matrix Table View (>= md screens) */}
      <div className="hidden md:block bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                {/* Metric Specs Label */}
                <th className="p-6 w-60 lg:w-72 align-top text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                  <div className="space-y-1.5">
                    <span className="text-stone-900 font-black text-sm block font-heading">
                      Fleet Asset Details
                    </span>
                    <p className="text-[11px] text-stone-500 normal-case font-sans">
                      Comparing up to 4 models. Tap swap or remove to change.
                    </p>
                  </div>
                </th>

                {/* Vehicle Card Columns */}
                {activeComparedCars.map((car) => {
                  const isLowest =
                    priceWinner && priceWinner.lowest.id === car.id
                  const isConflicted =
                    car.status === "Maintenance" ||
                    car.status === "Rented" ||
                    car.statusForDates === "Reserved" ||
                    car.isAvailableForDates === false

                  return (
                    <th
                      key={car.id}
                      className="p-5 min-w-[240px] max-w-[300px] align-top border-l border-stone-200"
                    >
                      <div className="space-y-3">
                        {/* Swap & Remove */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSwapCar(car.id)}
                            className="flex-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-stone-800 hover:text-[#F97316] transition text-left flex items-center justify-between shadow-2xs cursor-pointer"
                          >
                            <span className="truncate">{car.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              Swap ▾
                            </span>
                          </button>

                          {activeComparedCars.length > 2 && (
                            <button
                              type="button"
                              onClick={() => onRemoveCar(car.id)}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-400 text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
                              title="Remove from comparison"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Image */}
                        <div className="h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative group">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-stone-800 shadow-2xs">
                            {car.type}
                          </span>
                          {isLowest && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                              Best Value
                            </span>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div>
                          <h3 className="font-bold text-base text-stone-900 font-heading truncate">
                            {car.name}
                          </h3>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-[#F97316] font-mono">
                              €{car.pricePerDay}
                            </span>
                            <span className="text-xs font-medium text-stone-400">
                              /day
                            </span>
                            <span className="text-xs font-mono text-stone-500 ml-2">
                              (€{car.pricePerHour}/hr)
                            </span>
                          </div>
                        </div>

                        {/* Action CTAs */}
                        <div className="space-y-1.5 pt-1">
                          <button
                            type="button"
                            disabled={isConflicted}
                            onClick={() => {
                              if (!isConflicted) onQuickBook(car.id)
                            }}
                            className={`w-full py-2 rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isConflicted
                                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                                : "bg-[#F97316] hover:bg-[#EA580C] text-white"
                            }`}
                          >
                            {isConflicted
                              ? car.status === "Maintenance"
                                ? "Maintenance"
                                : "Reserved"
                              : "Reserve This Car"}{" "}
                            {!isConflicted && <ArrowRightIcon size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectCar(car.id)}
                            className="w-full py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
                          >
                            Full Spec Sheet
                          </button>
                        </div>
                      </div>
                    </th>
                  )
                })}

                {/* Empty Add Slot Column if < 4 */}
                {activeComparedCars.length < 4 && (
                  <th className="p-5 w-48 align-middle text-center border-l border-stone-200 bg-stone-50/40">
                    <div
                      onClick={onAddCar}
                      className="p-5 border-2 border-dashed border-stone-200 hover:border-orange-400 hover:bg-orange-50/30 rounded-xl text-center space-y-3 transition cursor-pointer group"
                      title="Add another vehicle to compare side by side"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white flex items-center justify-center mx-auto transition shadow-2xs">
                        <PlusIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-stone-800 group-hover:text-[#F97316] transition">
                          Add Vehicle
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Compare up to 4 models
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddCar()
                        }}
                        className="w-full py-1.5 rounded-lg bg-white hover:bg-orange-500 hover:text-white border border-stone-200 hover:border-orange-500 text-xs font-bold text-[#F97316] shadow-2xs transition cursor-pointer"
                      >
                        + Pick Vehicle
                      </button>
                    </div>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs font-sans">
              {/* SECTION 1: RATES & FINANCIALS */}
              {(activeTab === "all" || activeTab === "pricing") && (
                <>
                  <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                    <td
                      colSpan={activeComparedCars.length + 2}
                      className="px-6 py-2.5 text-stone-800"
                    >
                      1. Rates &amp; Payment Options
                    </td>
                  </tr>
                  {(!showOnlyDifferences ||
                    activeComparedCars.some(
                      (c) =>
                        c.pricePerDay !== activeComparedCars[0].pricePerDay,
                    )) && (
                    <tr>
                      <td className="px-6 py-3 font-semibold text-stone-600">
                        Daily Rate (24h)
                      </td>
                      {activeComparedCars.map((c) => {
                        const isLowest =
                          priceWinner && priceWinner.lowest.id === c.id

                        return (
                          <td
                            key={c.id}
                            className={`px-5 py-3 border-l border-stone-100 font-mono font-bold ${
                              isLowest
                                ? "text-emerald-700 bg-emerald-50/40"
                                : "text-stone-900"
                            }`}
                          >
                            €{c.pricePerDay}.00
                            {isLowest && (
                              <span className="ml-2 text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                Lowest
                              </span>
                            )}
                          </td>
                        )
                      })}
                      {activeComparedCars.length < 4 && (
                        <td className="border-l border-stone-100" />
                      )}
                    </tr>
                  )}
                  {(!showOnlyDifferences ||
                    activeComparedCars.some(
                      (c) =>
                        c.pricePerHour !== activeComparedCars[0].pricePerHour,
                    )) && (
                    <tr>
                      <td className="px-6 py-3 font-semibold text-stone-600">
                        Hourly Flex Rate
                      </td>
                      {activeComparedCars.map((c) => (
                        <td
                          key={c.id}
                          className="px-5 py-3 border-l border-stone-100 font-mono font-bold text-stone-700"
                        >
                          €{c.pricePerHour}.00 / hr
                        </td>
                      ))}
                      {activeComparedCars.length < 4 && (
                        <td className="border-l border-stone-100" />
                      )}
                    </tr>
                  )}
                  {(!showOnlyDifferences ||
                    activeComparedCars.some(
                      (c) =>
                        c.pricePerWeek !== activeComparedCars[0].pricePerWeek,
                    )) && (
                    <tr>
                      <td className="px-6 py-3 font-semibold text-stone-600">
                        Weekly Rate (7 Days)
                      </td>
                      {activeComparedCars.map((c) => (
                        <td
                          key={c.id}
                          className="px-5 py-3 border-l border-stone-100 font-mono text-stone-700"
                        >
                          €{c.pricePerWeek || Math.round(c.pricePerDay * 6)}.00
                        </td>
                      ))}
                      {activeComparedCars.length < 4 && (
                        <td className="border-l border-stone-100" />
                      )}
                    </tr>
                  )}
                </>
              )}

              {/* SECTION 2: GARAGE LOCATION */}
              {(activeTab === "all" || activeTab === "garage") && (
                <>
                  <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                    <td
                      colSpan={activeComparedCars.length + 2}
                      className="px-6 py-2.5 text-stone-800"
                    >
                      2. Garage Hub &amp; Bay Location
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-stone-600">
                      Assigned Garage Hub &amp; Bay
                    </td>
                    {activeComparedCars.map((c) => (
                      <td
                        key={c.id}
                        className="px-5 py-3 border-l border-stone-100"
                      >
                        <div className="font-bold text-stone-900 truncate max-w-[210px]">
                          {c.garageName || "Main Garage Facility"}
                        </div>
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5 text-[11px]">
                          {c.garageBay || "Bay 14-B"}
                        </span>
                      </td>
                    ))}
                    {activeComparedCars.length < 4 && (
                      <td className="border-l border-stone-100" />
                    )}
                  </tr>
                </>
              )}

              {/* SECTION 3: POWERTRAIN & SPACE */}
              {(activeTab === "all" || activeTab === "specs") && (
                <>
                  <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                    <td
                      colSpan={activeComparedCars.length + 2}
                      className="px-6 py-2.5 text-stone-800"
                    >
                      3. Powertrain &amp; Capacity
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-stone-600">
                      Transmission
                    </td>
                    {activeComparedCars.map((c) => (
                      <td
                        key={c.id}
                        className="px-5 py-3 border-l border-stone-100 font-semibold text-stone-800"
                      >
                        {c.transmission}
                      </td>
                    ))}
                    {activeComparedCars.length < 4 && (
                      <td className="border-l border-stone-100" />
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-stone-600">
                      Fuel / Powertrain
                    </td>
                    {activeComparedCars.map((c) => (
                      <td
                        key={c.id}
                        className="px-5 py-3 border-l border-stone-100 font-semibold text-stone-800"
                      >
                        {c.fuelType}
                      </td>
                    ))}
                    {activeComparedCars.length < 4 && (
                      <td className="border-l border-stone-100" />
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-stone-600">
                      Passenger Seats
                    </td>
                    {activeComparedCars.map((c) => (
                      <td
                        key={c.id}
                        className="px-5 py-3 border-l border-stone-100 font-semibold text-stone-800"
                      >
                        {c.seats} Passengers
                      </td>
                    ))}
                    {activeComparedCars.length < 4 && (
                      <td className="border-l border-stone-100" />
                    )}
                  </tr>
                </>
              )}

              {/* SECTION 4: FEATURES */}
              {(activeTab === "all" || activeTab === "features") && (
                <>
                  <tr className="bg-stone-100/70 font-mono font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                    <td
                      colSpan={activeComparedCars.length + 2}
                      className="px-6 py-2.5 text-stone-800"
                    >
                      4. Equipment &amp; Features
                    </td>
                  </tr>
                  {commonFeatures.map((feature) => {
                    return (
                      <tr key={feature.key}>
                        <td className="px-6 py-3 font-semibold text-stone-600">
                          {feature.name}
                        </td>
                        {activeComparedCars.map((c) => {
                          const hasFeature =
                            Array.isArray(c?.features) &&
                            c.features.some(
                              (f) =>
                                typeof f === "string" &&
                                f
                                  .toLowerCase()
                                  .includes(feature.key.toLowerCase()),
                            )

                          return (
                            <td
                              key={c.id}
                              className="px-5 py-3 border-l border-stone-100 font-semibold"
                            >
                              {hasFeature ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  <CheckIcon size={12} /> Included
                                </span>
                              ) : (
                                <span className="text-stone-300 font-mono">—</span>
                              )}
                            </td>
                          )
                        })}
                        {activeComparedCars.length < 4 && (
                          <td className="border-l border-stone-100" />
                        )}
                      </tr>
                    )
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
