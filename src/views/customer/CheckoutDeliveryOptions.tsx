import React from "react"
import { LocationIcon, CheckIcon } from "../../components/Icons"

interface CheckoutDeliveryOptionsProps {
  deliveryType: "garage" | "custom"
  setDeliveryType: (type: "garage" | "custom") => void
  deliveryLocationCustom: string
  setDeliveryLocationCustom: (loc: string) => void
  deliveryFee: number
  returnType: "garage" | "custom"
  setReturnType: (type: "garage" | "custom") => void
  returnLocationCustom: string
  setReturnLocationCustom: (loc: string) => void
  returnFee: number
}

const COMMON_MALTA_LOCATIONS = [
  "Malta International Airport (MLA) Terminal",
  "Sliema / St. Julian's Hotel Delivery",
  "Valletta Cruise Port / Waterfront",
  "Cirkewwa Ferry Terminal (Gozo Link)",
  "St. Paul's Bay / Bugibba Accommodation",
]

export default function CheckoutDeliveryOptions({
  deliveryType,
  setDeliveryType,
  deliveryLocationCustom,
  setDeliveryLocationCustom,
  deliveryFee,
  returnType,
  setReturnType,
  returnLocationCustom,
  setReturnLocationCustom,
  returnFee,
}: CheckoutDeliveryOptionsProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          3
        </span>
        <div>
          <h2 className="text-base font-bold text-[#17191C] font-heading flex items-center gap-2">
            <span>Delivery &amp; Return Handover Locations</span>
            <span className="text-[10px] uppercase font-mono font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
              Pit Stop Agreement
            </span>
          </h2>
          <p className="text-[11px] text-stone-500">
            Collect at our central garage in Mgarr or select custom delivery anywhere across Malta &amp; Gozo.
          </p>
        </div>
      </div>

      {/* Part 1: Delivery to Location */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <LocationIcon size={14} className="text-[#F97316]" />
            <span>Delivery to Location Option</span>
          </label>
          <span className="text-xs font-bold font-mono text-stone-900">
            Delivery Fee: {deliveryFee === 0 ? "€0.00 (Free)" : `€${deliveryFee.toFixed(2)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: Garage Collection */}
          <button
            type="button"
            onClick={() => setDeliveryType("garage")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              deliveryType === "garage"
                ? "bg-orange-50/70 border-[#F97316] text-stone-900 shadow-xs ring-2 ring-orange-500/20"
                : "bg-stone-50/50 border-stone-200 hover:border-stone-300 text-stone-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold block text-stone-900">
                  Central Garage Pickup (Mgarr)
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  36 Triq Il-Kbira, Mgarr, Malta
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                €0 Free
              </span>
            </div>
          </button>

          {/* Option B: Custom Delivery */}
          <button
            type="button"
            onClick={() => setDeliveryType("custom")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              deliveryType === "custom"
                ? "bg-orange-50/70 border-[#F97316] text-stone-900 shadow-xs ring-2 ring-orange-500/20"
                : "bg-stone-50/50 border-stone-200 hover:border-stone-300 text-stone-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold block text-stone-900">
                  Custom Location Delivery
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Malta Airport (MLA), Hotel or Ferry
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-900 text-white">
                +€20.00
              </span>
            </div>
          </button>
        </div>

        {deliveryType === "custom" && (
          <div className="pt-2 space-y-2 animate-fade-in">
            <input
              type="text"
              placeholder="e.g. Malta International Airport (MLA) Terminal / Sliema Hotel"
              value={deliveryLocationCustom}
              onChange={(e) => setDeliveryLocationCustom(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50 text-stone-900"
            />
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MALTA_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setDeliveryLocationCustom(loc)}
                  className="px-2 py-1 text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition cursor-pointer"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Return to Location */}
      <div className="space-y-3 pt-3 border-t border-stone-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <LocationIcon size={14} className="text-[#F97316]" />
            <span>Return to Location Option</span>
          </label>
          <span className="text-xs font-mono font-bold text-stone-900">
            Return Fee: {returnFee === 0 ? "€0.00 (Free)" : `€${returnFee.toFixed(2)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: Garage Return */}
          <button
            type="button"
            onClick={() => setReturnType("garage")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              returnType === "garage"
                ? "bg-orange-50/70 border-[#F97316] text-stone-900 shadow-xs ring-2 ring-orange-500/20"
                : "bg-stone-50/50 border-stone-200 hover:border-stone-300 text-stone-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold block text-stone-900">
                  Return to Central Garage (Mgarr)
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  36 Triq Il-Kbira, Mgarr, Malta
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                €0 Free
              </span>
            </div>
          </button>

          {/* Option B: Custom Return */}
          <button
            type="button"
            onClick={() => setReturnType("custom")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              returnType === "custom"
                ? "bg-orange-50/70 border-[#F97316] text-stone-900 shadow-xs ring-2 ring-orange-500/20"
                : "bg-stone-50/50 border-stone-200 hover:border-stone-300 text-stone-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold block text-stone-900">
                  Return at Custom Location
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Malta Airport (MLA), Hotel or Ferry
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-900 text-white">
                +€20.00
              </span>
            </div>
          </button>
        </div>

        {returnType === "custom" && (
          <div className="pt-2 space-y-2 animate-fade-in">
            <input
              type="text"
              placeholder="e.g. Malta International Airport (MLA) Departures / St. Julian's Hotel"
              value={returnLocationCustom}
              onChange={(e) => setReturnLocationCustom(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50 text-stone-900"
            />
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MALTA_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setReturnLocationCustom(loc)}
                  className="px-2 py-1 text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition cursor-pointer"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
