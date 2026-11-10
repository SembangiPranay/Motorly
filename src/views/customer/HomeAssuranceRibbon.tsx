import React from "react"
import {
  CarIcon,
  ShieldIcon,
  ClockIcon,
  HeadsetIcon,
} from "../../components/Icons"

export default function HomeAssuranceRibbon() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl border border-stone-200/80 p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 divide-y md:divide-y-0 md:divide-x divide-stone-100 text-xs">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
              <CarIcon size={18} />
            </div>
            <div>
              <span className="font-bold text-stone-900 block font-heading">
                Clean Fleet
              </span>
              <span className="text-[11px] text-stone-500">
                Sanitized &amp; inspected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 pt-3 md:pt-2 md:pl-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
              <ShieldIcon size={18} />
            </div>
            <div>
              <span className="font-bold text-stone-900 block font-heading">
                Transparent Rates
              </span>
              <span className="text-[11px] text-stone-500">
                Zero hidden surcharges
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 pt-3 md:pt-2 md:pl-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
              <ClockIcon size={18} />
            </div>
            <div>
              <span className="font-bold text-stone-900 block font-heading">
                Flexible Tiers
              </span>
              <span className="text-[11px] text-stone-500">
                Hourly, daily, weekly
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 pt-3 md:pt-2 md:pl-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
              <HeadsetIcon size={18} />
            </div>
            <div>
              <span className="font-bold text-stone-900 block font-heading">
                Direct Concierge
              </span>
              <span className="text-[11px] text-stone-500">
                Owner &amp; manager support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
