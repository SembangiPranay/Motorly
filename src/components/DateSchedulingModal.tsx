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

function parseHourFromTimeStr(t: string): number {
  if (!t) return 10
  const parts = t.split(" ")
  const time = parts[0] || "10:00"
  const modifier = parts[1] || "AM"
  let [hours] = time.split(":").map(Number)
  if (modifier === "PM" && hours < 12) hours += 12
  if (modifier === "AM" && hours === 12) hours = 0
  return hours
}

function formatHourToTimeStr(h: number): string {
  const period = h >= 12 ? "PM" : "AM"
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour.toString().padStart(2, "0")}:00 ${period}`
}

export default function DateSchedulingModal({
  isOpen,
  onClose,
  pickupDate: initialPickupDate,
  pickupTime: initialPickupTime,
  returnDate: initialReturnDate,
  returnTime: initialReturnTime,
  pickupLocation = "Main Garage Facility",
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
  const [tripMode, setTripMode] = useState<"same-day" | "multi-day">(() =>
    isSameDay(parseDateStr(initialPickupDate), parseDateStr(initialReturnDate))
      ? "same-day"
      : "multi-day",
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      const p = parseDateStr(initialPickupDate)
      const r = parseDateStr(initialReturnDate)
      setSelectedPickup(p)
      setSelectedReturn(r)
      setPickupTime(initialPickupTime || "10:00 AM")
      setReturnTime(initialReturnTime || "10:00 AM")
      setCurrentMonth(p)
      setSelectionStep("pickup")
      setTripMode(isSameDay(p, r) ? "same-day" : "multi-day")
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isSameDayBooking = isSameDay(selectedPickup, selectedReturn)
  const pickupHour = parseHourFromTimeStr(pickupTime)
  const returnHour = parseHourFromTimeStr(returnTime)
  const sameDayHours = Math.max(0, returnHour - pickupHour)

  // Calculate rental duration in days
  const rentalDays = isSameDayBooking
    ? 1
    : Math.max(
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

  const isCurrentMonthOrPast =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month <= today.getMonth())

  const handlePrevMonth = () => {
    if (isCurrentMonthOrPast) return
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day)
    if (clickedDate < today) return

    if (tripMode === "same-day") {
      setSelectedPickup(clickedDate)
      setSelectedReturn(clickedDate)
      setSelectionStep("pickup")
      if (returnHour < pickupHour + 3) {
        const newReturnHour = Math.min(22, Math.max(pickupHour + 4, 17))
        setReturnTime(formatHourToTimeStr(newReturnHour))
      }
      return
    }

    if (selectionStep === "pickup") {
      setSelectedPickup(clickedDate)
      // If return date is before new pickup, align return date with pickup
      if (selectedReturn < clickedDate) {
        setSelectedReturn(clickedDate)
        if (returnHour < pickupHour + 3) {
          const newReturnHour = Math.min(22, Math.max(pickupHour + 4, 17))
          setReturnTime(formatHourToTimeStr(newReturnHour))
        }
      }
      setSelectionStep("return")
    } else {
      // Selecting return
      if (clickedDate < selectedPickup) {
        // If clicked date is before pickup, treat it as new pickup
        setSelectedPickup(clickedDate)
        setSelectedReturn(clickedDate)
        setSelectionStep("return")
      } else {
        setSelectedReturn(clickedDate)
        // If selecting same day, ensure return time is at least 3 hours after pickup
        if (isSameDay(selectedPickup, clickedDate)) {
          if (returnHour < pickupHour + 3) {
            const newReturnHour = Math.min(22, Math.max(pickupHour + 4, 17))
            setReturnTime(formatHourToTimeStr(newReturnHour))
          }
        }
        setSelectionStep("pickup")
      }
    }
  }

  const applyPresetDays = (days: number) => {
    if (days === 0) {
      // Same day hourly rental preset
      setTripMode("same-day")
      setSelectedReturn(new Date(selectedPickup))
      setPickupTime("09:00 AM")
      setReturnTime("05:00 PM")
      return
    }
    setTripMode("multi-day")
    const newReturn = new Date(
      selectedPickup.getFullYear(),
      selectedPickup.getMonth(),
      selectedPickup.getDate() + days,
    )
    setSelectedReturn(newReturn)
  }

  const handleConfirm = () => {
    if (isSameDayBooking && returnHour < pickupHour + 3) {
      alert(
        "Minimum rental duration is 3 hours for same-day rentals. Please choose a return time at least 3 hours after pickup.",
      )
      return
    }
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative border border-stone-200 animate-scale-up my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Fixed Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 bg-white shrink-0 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-0.5">
                <CalendarIcon size={14} />
                <span>Rental Schedule &amp; Order Calendar</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-stone-900 font-heading">
                Select Trip Dates &amp; Hours
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Pickup from {pickupLocation}. Configure trip below.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0 ml-2"
            >
              ✕
            </button>
          </div>

          {/* Trip Type Segmented Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setTripMode("same-day")
                setSelectedReturn(new Date(selectedPickup))
                if (returnHour < pickupHour + 3) {
                  setReturnTime(formatHourToTimeStr(Math.min(22, pickupHour + 8)))
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tripMode === "same-day"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900 bg-transparent hover:bg-stone-200/60"
              }`}
            >
              <span>⚡ Same-Day Rental (Hourly)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTripMode("multi-day")
                if (isSameDay(selectedPickup, selectedReturn)) {
                  const nextDay = new Date(selectedPickup)
                  nextDay.setDate(nextDay.getDate() + 3)
                  setSelectedReturn(nextDay)
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tripMode === "multi-day"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900 bg-transparent hover:bg-stone-200/60"
              }`}
            >
              <span>📅 Multi-Day Rental (1-45 Days)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Center Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Same-Day Hourly Duration Quick Toolbar (Only shown in Same-Day mode) */}
          {tripMode === "same-day" ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <ClockIcon size={14} className="text-[#F97316]" />
                  <span>Same-Day Rental Hours: <span className="text-[#F97316]">{sameDayHours} Hours Total</span></span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                  Min 3 Hrs • Return by {returnTime}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { label: "3 Hrs (Min)", hrs: 3 },
                  { label: "4 Hrs", hrs: 4 },
                  { label: "6 Hrs", hrs: 6 },
                  { label: "8 Hrs (Full Day)", hrs: 8 },
                  { label: "10 Hrs", hrs: 10 },
                  { label: "12 Hrs (Max)", hrs: 12 },
                ].map((h) => {
                  const isCurrent = sameDayHours === h.hrs
                  return (
                    <button
                      key={h.hrs}
                      type="button"
                      onClick={() => {
                        const newReturnHour = Math.min(23, pickupHour + h.hrs)
                        setReturnTime(formatHourToTimeStr(newReturnHour))
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                        isCurrent
                          ? "bg-[#F97316] text-white shadow-xs"
                          : "bg-white text-stone-700 hover:bg-orange-100/60 border border-amber-200/80"
                      }`}
                    >
                      {h.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Step Guide Indicator for Multi-Day */
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
          )}

          {/* Quick Duration Presets (Only shown in Multi-Day Mode to avoid visual conflict) */}
          {tripMode === "multi-day" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Quick Duration Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "1 Day (24 Hrs)", days: 1 },
                  { label: "3 Days (Weekend)", days: 3 },
                  { label: "7 Days (Week)", days: 7 },
                  { label: "14 Days", days: 14 },
                  { label: "30 Days (Month)", days: 30 },
                ].map((p) => {
                  const isSelected = !isSameDayBooking && rentalDays === p.days
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
          )}

        {/* Interactive Month Calendar */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
          {/* Month Navigation Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={isCurrentMonthOrPast}
              onClick={handlePrevMonth}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${
                isCurrentMonthOrPast
                  ? "opacity-30 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
              }`}
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
              const isPast = thisDate < today
              const isPickup = isSameDay(thisDate, selectedPickup)
              const isReturn = isSameDay(thisDate, selectedReturn)
              const isInRange =
                thisDate > selectedPickup && thisDate < selectedReturn

              if (isPast) {
                return (
                  <button
                    key={day}
                    type="button"
                    disabled
                    className="h-9 w-full rounded-xl flex items-center justify-center opacity-25 cursor-not-allowed bg-stone-100/60 text-stone-400 font-medium"
                    title="Past dates are unavailable"
                  >
                    <span className="text-xs">{day}</span>
                  </button>
                )
              }

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
                  {isPickup && isReturn ? (
                    <span className="text-[7.5px] font-black uppercase tracking-tighter leading-none -mt-0.5">
                      Same Day
                    </span>
                  ) : isPickup ? (
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none -mt-0.5">
                      Pickup
                    </span>
                  ) : isReturn ? (
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none -mt-0.5">
                      Return
                    </span>
                  ) : null}
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
              onChange={(e) => {
                const newPickupTime = e.target.value
                setPickupTime(newPickupTime)
                if (isSameDayBooking) {
                  const newPickupHour = parseHourFromTimeStr(newPickupTime)
                  if (returnHour < newPickupHour + 3) {
                    const newReturnHour = Math.min(22, Math.max(newPickupHour + 4, 17))
                    setReturnTime(formatHourToTimeStr(newReturnHour))
                  }
                }
              }}
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ClockIcon size={12} className="text-[#F97316]" />
                <span>
                  {isSameDayBooking
                    ? `Return Time (Same-Day • ${formatDateStr(selectedReturn)})`
                    : `Return Time (${formatDateStr(selectedReturn)})`}
                </span>
              </span>
              {isSameDayBooking && (
                <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-md">
                  ⚡ {sameDayHours} Hrs Trip
                </span>
              )}
            </label>
            <select
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full text-xs font-bold text-stone-900 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#F97316] cursor-pointer shadow-xs"
            >
              {TIME_OPTIONS.map((t) => {
                const tHour = parseHourFromTimeStr(t)
                const isTooEarlyForSameDay =
                  isSameDayBooking && tHour < pickupHour + 3
                return (
                  <option
                    key={t}
                    value={t}
                    disabled={isTooEarlyForSameDay}
                    className={isTooEarlyForSameDay ? "text-stone-300" : ""}
                  >
                    {t} {isTooEarlyForSameDay ? "(Min 3 hrs required)" : ""}
                  </option>
                )
              })}
            </select>
          </div>
          </div>
        </div>

        {/* Sticky Fixed Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-white shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="text-left w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-stone-900 font-heading">
                {isSameDayBooking
                  ? `Same-Day (${sameDayHours} Hours)`
                  : `${rentalDays} ${rentalDays === 1 ? "Day" : "Days"} Total`}
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
