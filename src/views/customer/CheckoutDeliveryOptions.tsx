import React from "react"
import { LocationIcon, CheckIcon } from "../../components/Icons"
import MaltaLocationMapPicker from "../../components/common/MaltaLocationMapPicker"
import { useStudioSettings, getHubCoordinates } from "../../utils/studioSettings"
import type { DeliveryCoordinates } from "../../types"

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
  deliveryCoordinates?: DeliveryCoordinates
  setDeliveryCoordinates?: (coords: DeliveryCoordinates) => void
  returnCoordinates?: DeliveryCoordinates
  setReturnCoordinates?: (coords: DeliveryCoordinates) => void
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
  deliveryCoordinates,
  setDeliveryCoordinates,
  returnCoordinates,
  setReturnCoordinates,
}: CheckoutDeliveryOptionsProps) {
  const studioSettings = useStudioSettings()
  const hub = getHubCoordinates(studioSettings)

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
            Collect at our central garage or select custom delivery anywhere worldwide.
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
                  Central Garage Pickup
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  {hub.address}
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
                  Airport, Hotel, Residence or Custom Address
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-900 text-white">
                +€20.00
              </span>
            </div>
          </button>
        </div>

        {deliveryType === "custom" && (
          <div className="pt-2 animate-fade-in">
            <MaltaLocationMapPicker
              value={deliveryCoordinates}
              onChange={(coords) => setDeliveryCoordinates?.(coords)}
              addressText={deliveryLocationCustom}
              onAddressChange={setDeliveryLocationCustom}
              label="Delivery Location"
              placeholder="Search address or tap map to place pin..."
            />
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
                  Return to Central Garage
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  {hub.address}
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
                  Airport, Hotel, Residence or Custom Address
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-900 text-white">
                +€20.00
              </span>
            </div>
          </button>
        </div>

        {returnType === "custom" && (
          <div className="pt-2 animate-fade-in">
            <MaltaLocationMapPicker
              value={returnCoordinates}
              onChange={(coords) => setReturnCoordinates?.(coords)}
              addressText={returnLocationCustom}
              onAddressChange={setReturnLocationCustom}
              label="Return Handover Location"
              placeholder="Search return address or tap map to place pin..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
