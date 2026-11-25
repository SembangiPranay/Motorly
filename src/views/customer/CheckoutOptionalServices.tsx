import React from "react"
import { CheckIcon, ShieldIcon } from "../../components/Icons"

import { AVAILABLE_OPTIONAL_SERVICES } from "../../utils/pricing"

interface CheckoutOptionalServicesProps {
  selectedServices: string[]
  setSelectedServices: React.Dispatch<React.SetStateAction<string[]>>
  days: number
}

export default function CheckoutOptionalServices({
  selectedServices,
  setSelectedServices,
  days,
}: CheckoutOptionalServicesProps) {
  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const effectiveDays = Math.max(1, days)
  const totalServicesPerDay = AVAILABLE_OPTIONAL_SERVICES.filter((s) =>
    selectedServices.includes(s.id),
  ).reduce((acc, curr) => acc + curr.pricePerDay, 0)
  const totalCost = totalServicesPerDay * effectiveDays

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          4
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17191C] font-heading flex items-center gap-2">
              <span>Optional Services &amp; Equipment</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                Clause 1 Add-ons
              </span>
            </h2>
            <span className="text-xs font-mono font-bold text-stone-900">
              Total: €{totalCost.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Equipment listed in Clause 1 (Stroller, Booster &amp; Playpen) and driver protection options.
          </p>
        </div>
      </div>

      {/* Grid of Add-ons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABLE_OPTIONAL_SERVICES.map((item) => {
          const isChecked = selectedServices.includes(item.id)
          const itemTotal = item.pricePerDay * effectiveDays
          return (
            <div
              key={item.id}
              onClick={() => toggleService(item.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isChecked
                  ? "bg-orange-50/70 border-[#F97316] ring-2 ring-orange-500/20 shadow-xs"
                  : "bg-stone-50/50 border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-orange-600 shrink-0">
                      €{item.pricePerDay}/day
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100/80 text-[11px]">
                <span className="text-[10px] font-mono text-stone-400">
                  {item.clauseReference}
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={isChecked ? "text-stone-900" : "text-stone-400"}>
                    {effectiveDays}d = €{itemTotal.toFixed(2)}
                  </span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? "bg-[#F97316] border-[#F97316] text-white"
                        : "border-stone-300 bg-white"
                    }`}
                  >
                    {isChecked && <CheckIcon size={12} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
