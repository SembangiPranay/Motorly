import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CalendarIcon, ClockIcon, ArrowRightIcon } from "./Icons"

interface DateSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
  pickupLocation?: string
  onApply: (data: {
    pickupDate: string
    pickupTime: string
    returnDate: string
    returnTime: string
    rentalDurationDays: number
  }) => void
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const TIME_OPTIONS = [
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
]

function parseDateStr(str: string): Date {
  if (!str) return new Date()
  const parsed = Date.parse(str)
  if (!isNaN(parsed)) {
    const d = new Date(parsed)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  return new Date()
}

function formatDateStr(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function DateSchedulingModal({
  isOpen,
  onClose,
  pickupDate: initialPickupDate,
  pickupTime: initialPickupTime,
  returnDate: initialReturnDate,
  returnTime: initialReturnTime,
  pickupLocation = "Miami International Airport (MIA)",
  onApply,
}: DateSchedulingModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<Date>(() =>
    parseDateStr(initialPickupDate),
  )
  const [selectedReturn, setSelectedReturn] = useState<Date>(() =>
    parseDateStr(initialReturnDate),
  )
  const [pickupTime, setPickupTime] = useState(initialPickupTime || "10:00 AM")
  const [returnTime, setReturnTime] = useState(initialReturnTime || "10:00 AM")
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    parseDateStr(initialPickupDate),
  )
  const [selectionStep, setSelectionStep] = useState<"pickup" | "return">(
    "pickup",
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSelectedPickup(parseDateStr(initialPickupDate))
      setSelectedReturn(parseDateStr(initialReturnDate))
      setPickupTime(initialPickupTime || "10:00 AM")
      setReturnTime(initialReturnTime || "10:00 AM")
      setCurrentMonth(parseDateStr(initialPickupDate))
      setSelectionStep("pickup")
    }
  }, [
    isOpen,
    initialPickupDate,
    initialReturnDate,
    initialPickupTime,
    initialReturnTime,
  ])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  // Calculate rental duration in days
  const rentalDays = Math.max(
    1,
    Math.round(
      (selectedReturn.getTime() - selectedPickup.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  )

  // Calendar grid calculations
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day)

    if (selectionStep === "pickup") {
      setSelectedPickup(clickedDate)
      // If return date is on or before new pickup, set return to pickup + 3 days
      if (selectedReturn <= clickedDate) {
        setSelectedReturn(new Date(year, month, day + 3))
      }
      setSelectionStep("return")
    } else {
      // Selecting return
      if (clickedDate <= selectedPickup) {
        // Reset pickup if clicked date is before pickup
        setSelectedPickup(clickedDate)
        setSelectedReturn(new Date(year, month, day + 3))
        setSelectionStep("return")
      } else {
        setSelectedReturn(clickedDate)
        setSelectionStep("pickup")
      }
    }
  }

  const applyPresetDays = (days: number) => {
    const newReturn = new Date(
      selectedPickup.getFullYear(),
      selectedPickup.getMonth(),
      selectedPickup.getDate() + days,
    )
    setSelectedReturn(newReturn)
  }

  const handleConfirm = () => {
    onApply({
      pickupDate: formatDateStr(selectedPickup),
      pickupTime,
      returnDate: formatDateStr(selectedReturn),
      returnTime,
      rentalDurationDays: rentalDays,
    })
    onClose()
  }

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-7 shadow-2xl relative space-y-4 sm:space-y-5 border border-stone-200 animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
              <CalendarIcon size={14} />
              <span>Rental Schedule &amp; Order Calendar</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
              Select Trip Dates &amp; Hours
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Pickup from {pickupLocation}. Tap dates on calendar to configure.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center font-bold text-base transition cursor-pointer shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Step Guide Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-50 p-1.5 sm:p-2 rounded-xl border border-stone-200/80 text-xs">
          <button
            type="button"
            onClick={() => setSelectionStep("pickup")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              selectionStep === "pickup"
                ? "bg-white text-[#F97316] shadow-xs border border-orange-200"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-orange-100 text-[#F97316] text-[10px] font-black flex items-center justify-center shrink-0">
              1
            </span>
            <span className="text-[11px] sm:text-xs truncate">
              Pickup: {formatDateStr(selectedPickup)}
            </span>
          </button>
          <span className="text-stone-300 shrink-0">→</span>
          <button
            type="button"
            onClick={() => setSelectionStep("return")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              selectionStep === "return"
                ? "bg-white text-[#F97316] shadow-xs border border-orange-200"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-orange-100 text-[#F97316] text-[10px] font-black flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-[11px] sm:text-xs truncate">
              Return: {formatDateStr(selectedReturn)}
            </span>
          </button>
        </div>

        {/* Quick Duration Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Quick Duration Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "1 Day", days: 1 },
              { label: "3 Days (Weekend)", days: 3 },
              { label: "7 Days (Week)", days: 7 },
              { label: "14 Days", days: 14 },
              { label: "30 Days (Month)", days: 30 },
            ].map((p) => {
              const isSelected = rentalDays === p.days
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => applyPresetDays(p.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#F97316] text-white border-[#F97316] shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:border-orange-300 hover:bg-stone-100"
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Month Calendar */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
          {/* Month Navigation Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              ← Prev
            </button>
            <h4 className="text-sm font-extrabold text-stone-900 font-heading">
              {FULL_MONTHS[month]} {year}
            </h4>
            <button
              type="button"
              onClick={handleNextMonth}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Next →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-stone-400 py-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
            {/* Empty offset padding for days before the 1st */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const thisDate = new Date(year, month, day)
              const isPickup = isSameDay(thisDate, selectedPickup)
              const isReturn = isSameDay(thisDate, selectedReturn)
              const isInRange =
                thisDate > selectedPickup && thisDate < selectedReturn

              let style =
                "bg-white hover:bg-orange-50 text-stone-800 border border-transparent"
              if (isPickup || isReturn) {
                style =
                  "bg-[#F97316] text-white font-extrabold shadow-sm scale-105 z-10"
              } else if (isInRange) {
                style = "bg-orange-100/80 text-[#C2410C] font-bold"
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`h-9 w-full rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${style}`}
                >
                  <span className="text-xs">{day}</span>
                  {isPickup && (
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none -mt-0.5">
                      Pickup
                    </span>
                  )}
                  {isReturn && (
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none -mt-0.5">
                      Return
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pickup & Return Time Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <ClockIcon size={12} className="text-[#F97316]" />
              <span>Pickup Time ({formatDateStr(selectedPickup)})</span>
            </label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full text-xs font-bold text-stone-900 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#F97316] cursor-pointer shadow-xs"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <ClockIcon size={12} className="text-[#F97316]" />
              <span>Return Time ({formatDateStr(selectedReturn)})</span>
            </label>
            <select
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full text-xs font-bold text-stone-900 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#F97316] cursor-pointer shadow-xs"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Trip Summary & Order Action Button */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="text-left w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-stone-900 font-heading">
                {rentalDays} {rentalDays === 1 ? "Day" : "Days"} Total
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Available for Order
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">
              {formatDateStr(selectedPickup)} ({pickupTime}) →{" "}
              {formatDateStr(selectedReturn)} ({returnTime})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 sm:h-10 px-4 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-11 sm:h-10 px-5 sm:px-6 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg active:scale-95"
            >
              <span>Apply Dates &amp; Order</span>
              <ArrowRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}
