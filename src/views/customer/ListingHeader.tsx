import React from "react"
import type { BookingState } from "../../types"
import {
  SparklesIcon,
  CalendarIcon,
  LocationIcon,
  ArrowRightIcon,
} from "../../components/Icons"

interface ListingHeaderProps {
  bookingState: BookingState
  tripDurationDays: number
  isSameDayBooking: boolean
  sameDayHours: number
  onOpenScheduleModal: () => void
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    }
  } catch {}
  return dateStr
}

export default function ListingHeader({
  bookingState,
  tripDurationDays,
  isSameDayBooking,
  sameDayHours,
  onOpenScheduleModal,
}: ListingHeaderProps) {
  return (
    <div className="relative bg-white border-b border-stone-200/90 py-3 sm:py-8 px-3 sm:px-6 lg:px-8 xl:px-12 overflow-hidden shadow-xs">
      <div className="relative w-full max-w-[1780px] mx-auto z-10 text-center space-y-2.5 sm:space-y-3.5">
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest">
          <SparklesIcon size={12} />
          <span>Verified Fleet Inventory</span>
        </div>

        <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading text-[#17191C]">
          Find Your Ideal Vehicle
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto font-medium hidden sm:block">
          Inspected garage fleet ready for reservation, direct manager review, and garage pickup.
        </p>

        {/* Mobile Classical 1-Line Minimal Trip Pill */}
        <div
          onClick={onOpenScheduleModal}
          className="sm:hidden w-full max-w-md mx-auto mt-2.5 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-2 text-[#17191C] shadow-2xs flex items-center justify-between border border-stone-200/90 cursor-pointer transition text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon size={14} className="text-[#F97316] shrink-0" />
            <span className="font-bold text-stone-900 truncate">
              {formatDisplayDate(bookingState.pickupDate)} &rarr;{" "}
              {formatDisplayDate(bookingState.returnDate)}
            </span>
            <span className="text-[10px] font-mono text-[#F97316] bg-orange-100 px-1.5 py-0.2 rounded font-bold shrink-0">
              {isSameDayBooking ? `${sameDayHours}h` : `${tripDurationDays}d`}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#F97316] shrink-0 ml-2">
            Change &rarr;
          </span>
        </div>

        {/* Desktop Luxury Trip Summary Strip */}
        <div
          onClick={onOpenScheduleModal}
          className="hidden sm:flex w-full max-w-3xl mx-auto mt-3 sm:mt-5 bg-stone-50/80 hover:bg-stone-100/90 rounded-xl p-2.5 sm:p-3.5 text-[#17191C] shadow-xs items-center justify-between gap-2.5 sm:gap-4 border border-stone-200/80 hover:border-orange-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100/80 text-[#F97316] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarIcon size={18} />
            </div>

            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-tight">
                  {isSameDayBooking ? (
                    <>
                      {formatDisplayDate(bookingState.pickupDate)} •{" "}
                      <span className="text-[#F97316]">
                        {bookingState.pickupTime} → {bookingState.returnTime}
                      </span>{" "}
                      (Same Day)
                    </>
                  ) : (
                    <>
                      {formatDisplayDate(bookingState.pickupDate)} (
                      {bookingState.pickupTime}) –{" "}
                      {formatDisplayDate(bookingState.returnDate)} (
                      {bookingState.returnTime})
                    </>
                  )}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#F97316] bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                  {isSameDayBooking
                    ? `⚡ Same-Day (${sameDayHours} Hours)`
                    : `${tripDurationDays} ${
                        tripDurationDays === 1 ? "day" : "days"
                      }`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 font-medium truncate mt-0.5">
                <LocationIcon size={12} className="text-[#F97316] shrink-0" />
                <span className="truncate">
                  {bookingState.pickupLocation || "Fleet Garage Hub (Set by Owner)"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenScheduleModal()
            }}
            className="px-3 sm:px-4 py-2 bg-white group-hover:bg-[#F97316] text-stone-700 group-hover:text-white border border-stone-200 group-hover:border-[#F97316] text-xs font-bold rounded-xl transition-all ml-auto shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Change</span>
            <ArrowRightIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
