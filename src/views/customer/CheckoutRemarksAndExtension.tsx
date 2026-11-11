import React from "react"
import { AlertTriangleIcon } from "../../components/Icons"

interface CheckoutRemarksAndExtensionProps {
  remarks: string
  setRemarks: (val: string) => void
}

export default function CheckoutRemarksAndExtension({
  remarks,
  setRemarks,
}: CheckoutRemarksAndExtensionProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          5
        </span>
        <div>
          <h2 className="text-base font-bold text-[#17191C] font-heading">
            Booking Remarks &amp; Rental Extension Notice
          </h2>
          <p className="text-[11px] text-stone-500">
            Special instructions, flight arrivals MLA, or baby seat age requirements.
          </p>
        </div>
      </div>

      {/* Extension Notice Banner from Physical Agreement */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-amber-950 uppercase tracking-wide font-heading text-[11px]">
            &ldquo;If Rental will be extended please advise before&rdquo;
          </p>
          <p className="text-amber-900 text-[11px] leading-relaxed">
            Per <strong>Clause 14 &amp; 15</strong>, car keys must be returned to Pit Stop premises at the agreed date, time, and place. Automatic extension is not guaranteed without prior operations clearance. Minimum extension billing applies on a 24-hour basis.
          </p>
        </div>
      </div>

      {/* Remarks Field */}
      <div>
        <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
          <span>Remarks (Optional)</span>
          <span className="text-[10px] text-stone-400 font-normal">
            Flight #, ferry timing, hotel room, or delivery notes
          </span>
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Inbound flight KM613 arriving 14:30 at Malta Airport (MLA). Please prepare child booster seat in back row."
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900 resize-none"
        />
      </div>
    </div>
  )
}
