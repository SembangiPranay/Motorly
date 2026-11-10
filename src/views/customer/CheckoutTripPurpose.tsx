import React from "react"

interface CheckoutTripPurposeProps {
  tripReason: string
  setTripReason: (reason: string) => void
  tripDestination: string
  setTripDestination: (dest: string) => void
}

const TRIP_PURPOSES = [
  { id: "Vacation & Leisure Travel", icon: "🌴", label: "Vacation & Leisure" },
  { id: "Business & Corporate Travel", icon: "💼", label: "Business Travel" },
  { id: "Road Trip & Outstation", icon: "🚗", label: "Road Trip / Outstation" },
  { id: "Daily Commute & City Drive", icon: "🏙️", label: "Daily City Commute" },
  { id: "Special Event / Wedding", icon: "🎉", label: "Wedding / Event" },
  { id: "Temporary Vehicle Replacement", icon: "🔧", label: "Car in Service" },
]

export default function CheckoutTripPurpose({
  tripReason,
  setTripReason,
  tripDestination,
  setTripDestination,
}: CheckoutTripPurposeProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#F97316] text-white text-xs font-black flex items-center justify-center shadow-xs">
          ✈️
        </span>
        <div>
          <h2 className="text-base font-bold text-[#17191C] font-heading">
            Trip Purpose &amp; Rental Reason
          </h2>
          <p className="text-[11px] text-stone-400">
            Helps our fleet manager prepare and stage your vehicle for your exact journey.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-stone-700">
            Select Primary Rental Reason <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          {tripReason && (
            <button
              type="button"
              onClick={() => setTripReason("")}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TRIP_PURPOSES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTripReason(tripReason === item.id ? "" : item.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                tripReason === item.id
                  ? "bg-orange-50/70 border-[#F97316] text-orange-950 shadow-xs ring-2 ring-orange-500/20"
                  : "bg-stone-50/60 border-stone-200 hover:border-stone-300 text-stone-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Trip Destination / Specific Notes <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={tripDestination}
            onChange={(e) => setTripDestination(e.target.value)}
            placeholder="e.g. Napa Valley wine tour, Miami Beach weekend, Silicon Valley tech summit, Aspen ski trip"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-xs text-stone-800 transition bg-stone-50/50"
          />
        </div>
      </div>
    </div>
  )
}
