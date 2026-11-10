import React from "react"
import type { BookingState } from "../../types"
import {
  LocationIcon,
  CalendarIcon,
  ChevronDownIcon,
  ArrowRightIcon,
} from "../../components/Icons"

export interface DurationPreset {
  label: string
  pill: string
  hoursOrDays: number
  discountBadge?: string
}

export const TIER_PRESETS: Record<
  "Hourly" | "Daily" | "Weekly" | "Monthly",
  DurationPreset[]
> = {
  Hourly: [
    { label: "2h", pill: "2 Hours", hoursOrDays: 2 },
    { label: "4h", pill: "4 Hours", hoursOrDays: 4 },
    { label: "8h", pill: "8 Hours", hoursOrDays: 8 },
  ],
  Daily: [
    { label: "1d", pill: "24h Express", hoursOrDays: 1 },
    { label: "3d", pill: "3 Days (Popular)", hoursOrDays: 3 },
    { label: "5d", pill: "5 Days (Workweek)", hoursOrDays: 5 },
  ],
  Weekly: [
    {
      label: "7d",
      pill: "1 Week Vacation",
      hoursOrDays: 7,
      discountBadge: "Save 15%",
    },
    {
      label: "14d",
      pill: "2 Weeks Extended",
      hoursOrDays: 14,
      discountBadge: "Save 20%",
    },
  ],
  Monthly: [
    {
      label: "30d",
      pill: "1 Month Long-term",
      hoursOrDays: 30,
      discountBadge: "Save 25%",
    },
    {
      label: "60d",
      pill: "2 Months Flex",
      hoursOrDays: 60,
      discountBadge: "Save 30%",
    },
  ],
}

interface HomeBookingBarProps {
  bookingState: BookingState
  selectedDuration: "Hourly" | "Daily" | "Weekly" | "Monthly"
  activeDurationPill: string
  onSelectTier: (tier: "Hourly" | "Daily" | "Weekly" | "Monthly") => void
  onApplyPreset: (
    tier: "Hourly" | "Daily" | "Weekly" | "Monthly",
    preset: DurationPreset,
  ) => void
  onOpenScheduleModal: () => void
  onSearch: () => void
}

export default function HomeBookingBar({
  bookingState,
  selectedDuration,
  activeDurationPill,
  onSelectTier,
  onApplyPreset,
  onOpenScheduleModal,
  onSearch,
}: HomeBookingBarProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 relative z-20">
      <div className="bg-white rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.05)] border border-stone-200/90 p-4 sm:p-5 space-y-3.5">
        {/* Top Bar: Rental Plan Segments & Duration Tiers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Select Rental Plan:
            </span>
            <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
              {(["Hourly", "Daily", "Weekly", "Monthly"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSelectTier(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDuration === mode
                        ? "bg-white text-[#F97316] shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {mode}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Quick Pick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mr-1">
              Duration:
            </span>
            {TIER_PRESETS[selectedDuration].map((preset) => {
              const isActive = activeDurationPill === preset.label

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onApplyPreset(selectedDuration, preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-[#17191C] text-white border-[#17191C] shadow-xs"
                      : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 hover:border-orange-300"
                  }`}
                >
                  <span>{preset.pill}</span>
                  {preset.discountBadge && (
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-orange-100 text-orange-700 font-extrabold"
                      }`}
                    >
                      {preset.discountBadge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Interactive Selectors Grid (Architectural Hairline Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_1.1fr_auto] gap-3 items-center">
          {/* Garage Hub Indicator */}
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#F97316] flex items-center justify-center shrink-0">
              <LocationIcon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-stone-900 block truncate">
                Assigned Garage Bay
              </span>
              <span className="text-[10px] text-stone-500 block truncate">
                Direct vehicle handoff by manager
              </span>
            </div>
          </div>

          {/* Pickup Date & Time */}
          <div
            onClick={onOpenScheduleModal}
            className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-400 bg-white flex items-center gap-3 cursor-pointer transition-colors shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-stone-100 group-hover:bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0 transition-colors">
              <CalendarIcon size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">
                Pickup Schedule
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {bookingState.pickupDate}
                </span>
                <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                  {bookingState.pickupTime}
                </span>
              </div>
            </div>
            <ChevronDownIcon size={14} className="text-stone-400" />
          </div>

          {/* Return Date & Time */}
          <div
            onClick={onOpenScheduleModal}
            className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-400 bg-white flex items-center gap-3 cursor-pointer transition-colors shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-stone-100 group-hover:bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0 transition-colors">
              <CalendarIcon size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">
                Return Schedule
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {bookingState.returnDate}
                </span>
                <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                  {bookingState.returnTime}
                </span>
              </div>
            </div>
            <ChevronDownIcon size={14} className="text-stone-400" />
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={onSearch}
            className="w-full lg:w-auto h-11 px-6 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all whitespace-nowrap cursor-pointer group"
          >
            <span>Search Fleet</span>
            <ArrowRightIcon
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
