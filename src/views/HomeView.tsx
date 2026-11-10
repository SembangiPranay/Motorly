import React, { useState } from "react"

import type { Car, BookingState, VehicleType } from "../types"

import DateSchedulingModal from "../components/DateSchedulingModal"

import {
  CarIcon,
  CalendarIcon,
  LocationIcon,
  ShieldIcon,
  HeadsetIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  StarIcon,
  ZapIcon,
  SparklesIcon,
} from "../components/Icons"

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

interface HomeViewProps {
  cars?: Car[]

  bookingState: BookingState

  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>

  onSearch: () => void

  onSelectCategory: (category: VehicleType) => void

  onSelectCar: (carId: string) => void

  onQuickBook?: (carId: string) => void

  onNavigateCompare?: () => void
}

function isSameDay(dateA?: string, dateB?: string): boolean {
  if (!dateA || !dateB) return false

  const a = new Date(dateA)

  const b = new Date(dateB)

  if (isNaN(a.getTime()) || isNaN(b.getTime()))
    return dateA.trim() === dateB.trim()

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function advanceDateByDays(baseDateStr: string, daysToAdd: number): string {
  const parsed = Date.parse(baseDateStr)

  if (isNaN(parsed)) return baseDateStr

  const next = new Date(parsed + daysToAdd * 24 * 60 * 60 * 1000)

  const monthNames = [
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

  return `${monthNames[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`
}

function advanceTimeByHours(baseTimeStr: string, hoursToAdd: number): string {
  try {
    const match = baseTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)

    if (!match) return "05:00 PM"

    let hour = parseInt(match[1], 10)

    const minutes = match[2]

    const meridiem = match[3].toUpperCase()

    if (meridiem === "PM" && hour < 12) hour += 12

    if (meridiem === "AM" && hour === 12) hour = 0

    const targetHour = (hour + hoursToAdd) % 24

    const newMeridiem = targetHour >= 12 ? "PM" : "AM"

    let displayHour = targetHour % 12

    if (displayHour === 0) displayHour = 12

    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${newMeridiem}`
  } catch {
    return "05:00 PM"
  }
}

interface DurationPreset {
  label: string

  pill: string

  hoursOrDays: number

  discountBadge?: string
}

const TIER_PRESETS: Record<
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

export default function HomeView({
  cars = [],

  bookingState,

  setBookingState,

  onSearch,

  onSelectCategory,

  onSelectCar,

  onQuickBook,

  onNavigateCompare,
}: HomeViewProps) {
  const [selectedDuration, setSelectedDuration] = useState<
    "Hourly" | "Daily" | "Weekly" | "Monthly"
  >(() => {
    if (bookingState.rentalPlan === "hourly") return "Hourly"

    if (bookingState.rentalPlan === "weekly") return "Weekly"

    if (bookingState.rentalPlan === "monthly") return "Monthly"

    return "Daily"
  })

  const [activeDurationPill, setActiveDurationPill] = useState<string>("3d")

  const handleSelectTier = (tier: "Hourly" | "Daily" | "Weekly" | "Monthly") => {
    setSelectedDuration(tier)

    const firstPreset = TIER_PRESETS[tier][0]

    setActiveDurationPill(firstPreset.label)

    if (tier === "Hourly") {
      const returnTime = advanceTimeByHours(
        bookingState.pickupTime || "10:00 AM",
        firstPreset.hoursOrDays,
      )

      setBookingState((prev) => ({
        ...prev,

        rentalPlan: "hourly",

        rentalDurationDays: 1,

        returnDate: prev.pickupDate,

        returnTime,
      }))
    } else {
      const returnDate = advanceDateByDays(
        bookingState.pickupDate,
        firstPreset.hoursOrDays,
      )

      setBookingState((prev) => ({
        ...prev,

        rentalPlan: tier.toLowerCase() as BookingState["rentalPlan"],

        rentalDurationDays: firstPreset.hoursOrDays,

        returnDate,
      }))
    }
  }

  const handleApplyPreset = (
    tier: "Hourly" | "Daily" | "Weekly" | "Monthly",
    preset: DurationPreset,
  ) => {
    setActiveDurationPill(preset.label)

    if (tier === "Hourly") {
      const returnTime = advanceTimeByHours(
        bookingState.pickupTime || "10:00 AM",
        preset.hoursOrDays,
      )

      setBookingState((prev) => ({
        ...prev,

        rentalPlan: "hourly",

        rentalDurationDays: 1,

        returnDate: prev.pickupDate,

        returnTime,
      }))
    } else {
      const returnDate = advanceDateByDays(
        bookingState.pickupDate,
        preset.hoursOrDays,
      )

      setBookingState((prev) => ({
        ...prev,

        rentalPlan: tier.toLowerCase() as BookingState["rentalPlan"],

        rentalDurationDays: preset.hoursOrDays,

        returnDate,
      }))
    }
  }

  const [fleetFilter, setFleetFilter] = useState<string>("All")

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Curated category gallery items (inspired by COOLVINTAGECARS reference layout)
  const fleetCategories: {
    type: VehicleType

    label: string

    price: string

    image: string

    description: string
  }[] = [
    {
      type: "Sedan",

      label: "Sedan",

      price: "From €45/day",

      image:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",

      description: "Quiet, executive comfort for city and highway travel.",
    },

    {
      type: "SUV",

      label: "SUV & 4x4",

      price: "From €65/day",

      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",

      description: "All-terrain confidence with generous passenger space.",
    },

    {
      type: "Luxury",

      label: "Performance GT",

      price: "From €120/day",

      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",

      description: "Refined German engineering and high-output dynamics.",
    },

    {
      type: "Economy",

      label: "Economy Flex",

      price: "From €35/day",

      image:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",

      description: "Smart daily commuters with exceptional fuel efficiency.",
    },
  ]

  // Featured vehicles from live fleet
  const featuredCars = (cars.length > 0 ? cars : [])

    .filter((car) => {
      if (fleetFilter === "All") return true

      return car.type === fleetFilter
    })

    .slice(0, 4)

  // FAQ Items
  const faqItems = [
    {
      q: "How do I request a vehicle from the garage?",

      a: "Browse the available fleet, choose your preferred vehicle, and submit your rental dates along with your contact information. The garage manager reviews and confirms your request promptly.",
    },

    {
      q: "When and how do I pay?",

      a: "No online payment or advance deposit is required. You simply pay directly at the garage when you inspect the vehicle and collect the keys.",
    },

    {
      q: "What documents do I need to bring?",

      a: "Please bring a valid driver's license and a government-issued photo ID upon vehicle pickup at the garage.",
    },

    {
      q: "Where do I pick up and return the car?",

      a: "All pickups and returns occur directly at our garage facility. The manager inspects the car with you at pickup and drop-off.",
    },
  ]

  return (
    <div className="space-y-16 sm:space-y-20 pb-24 animate-fade-in bg-[#FAF7F2]">
      {/* 1. Hero Section - Inspired by Reference COOLVINTAGECARS */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column: Bold Editorial Typography & Direct Atelier Narrative */}
            <div className="lg:col-span-6 z-10 flex flex-col justify-center space-y-6 lg:pr-4">
              {/* Eyebrow - Clean uppercase text with generous tracking */}
              <div className="inline-flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
                  MOTORLY ATELIER • PRIVATE FLEET CONCIERGE
                </p>
              </div>

              {/* Bold Graphic Editorial Headline (Matching Reference "NEW LUXURY") */}
              <h1 className="text-5xl sm:text-7xl lg:text-[76px] font-black tracking-[-0.035em] text-[#17191C] leading-[1.02] font-heading">
                NEW LUXURY <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-orange-500 to-amber-500">
                  MOBILITY.
                </span>
              </h1>

              {/* Editorial Narrative */}
              <p className="text-base sm:text-lg text-stone-600 max-w-lg leading-relaxed font-normal">
                No middleman fleet site. Exclusively dedicated to verified garage collections, luxury highway cruisers, and pristine private rentals. Transparent rates, direct manager handoff, zero counter queues.
              </p>

              {/* Quick Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onSearch}
                  className="px-6 py-3.5 bg-[#17191C] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Explore The Fleet</span>
                  <ArrowRightIcon
                    size={14}
                    className="group-hover:translate-x-1 transition-transform text-[#F97316]"
                  />
                </button>
                <a
                  href="#fleet-categories"
                  className="px-5 py-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Curated Categories
                </a>
              </div>
            </div>

            {/* Right Hero Image: Unboxed Staging Floating on Canvas (Matching Reference) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="w-full relative flex flex-col items-center justify-center group">
                {/* Subtle Studio Ambient Spotlight behind car */}
                <div className="absolute w-[460px] h-[240px] bg-gradient-to-tr from-orange-500/10 via-amber-200/15 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* The Unboxed Hero Vehicle Image (Clean, No Box Border) */}
                <div className="relative w-full max-w-xl aspect-[16/10] flex items-center justify-center overflow-visible">
                  <img
                    src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                    alt="Luxury flagship performance vehicle staged at atelier"
                    className="w-full h-full object-contain filter drop-shadow-[0_22px_38px_rgba(0,0,0,0.18)] group-hover:scale-[1.02] transition-transform duration-700 select-none"
                  />
                  {/* Natural Ground Contact Shadow */}
                  <div className="absolute -bottom-1 inset-x-10 h-6 bg-stone-900/15 rounded-full blur-md -z-10" />
                </div>

                {/* Minimalist Editorial Floating Spec Badge */}
                <div className="mt-3 inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-stone-200/80 shadow-xs text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-stone-900 font-heading">
                    Atelier Staged Vehicle
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500 font-medium">
                    Pre-inspected &amp; Bay Sanitized
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Streamlined Precision Booking Console Bar (Replaced Bulky Box) */}
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
                        onClick={() => handleSelectTier(mode)}
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
                      onClick={() => handleApplyPreset(selectedDuration, preset)}
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
                onClick={() => setIsScheduleModalOpen(true)}
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
                onClick={() => setIsScheduleModalOpen(true)}
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
      </section>

      {/* 3. Reference Gallery: Curated Vehicle Format Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="fleet-categories">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
                CURATED CATEGORIES
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
              Explore Fleet by Format
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              High-definition category selection inspired by classic automotive ateliers.
            </p>
          </div>
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F97316] hover:text-[#EA580C] transition-colors group cursor-pointer"
          >
            <span>View All Categories</span>
            <ArrowRightIcon
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        {/* 4 Landscape Editorial Cards (Matching Reference bottom row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {fleetCategories.map((cat) => (
            <div
              key={cat.type}
              onClick={() => onSelectCategory(cat.type)}
              className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
            >
              {/* 16:10 Landscape Cinematic Vehicle Photography */}
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.label}
                  onError={(e) => {
                    e.currentTarget.onerror = null

                    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Floating Minimal Spec Tag */}
                <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                  {cat.price}
                </div>
              </div>

              {/* Minimalist Card Footer */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17191C] font-heading group-hover:text-[#F97316] transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {cat.description}
                  </p>
                </div>
                <span className="w-7 h-7 rounded-lg bg-stone-50 group-hover:bg-orange-50 text-stone-400 group-hover:text-[#F97316] border border-stone-200/80 flex items-center justify-center transition-colors shrink-0 ml-2">
                  <ArrowRightIcon
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Atelier Assurance Ribbon (Replacing bulky feature boxes) */}
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

      {/* 5. Popular Vehicles Instant Showcase (Refined Crisp Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon size={15} className="text-[#F97316]" />
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
                POPULAR CHOICES
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
              Garage Fleet Ready for Pickup
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Serviced, clean vehicles maintained and staged at our facility.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["All", "Sedan", "SUV", "Luxury", "Economy"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFleetFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  fleetFilter === cat
                    ? "bg-[#17191C] text-white shadow-xs"
                    : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards Grid with 1-Click Quick Booking */}
        {featuredCars.length === 0 ? (
          <div className="py-16 text-center text-stone-500 bg-white rounded-xl border border-stone-200/80 shadow-xs">
            <p className="text-base font-bold text-stone-800">
              No vehicles currently listed in the fleet.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Check back soon as new vehicles are added to inventory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCars.map((car) => {
              const isConflicted =
                car.status === "Maintenance" ||
                car.status === "Rented" ||
                car.statusForDates === "Reserved" ||
                car.isAvailableForDates === false ||
                Boolean(
                  car.conflict && car.conflict?.status !== "Invalid Dates",
                )

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                >
                  {/* Image & Badges (16:10 Aspect Ratio) */}
                  <div
                    className="relative aspect-[16/10] bg-stone-100 overflow-hidden cursor-pointer"
                    onClick={() => onSelectCar(car.id)}
                  >
                    <img
                      src={car.image}
                      alt={car.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null

                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-[#17191C]/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {car.type}
                      </span>
                      {isConflicted && (
                        <span className="bg-amber-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {car.status === "Maintenance"
                            ? "Maintenance"
                            : car.conflict || car.statusForDates === "Reserved"
                            ? "Reserved for Dates"
                            : "Rented"}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <StarIcon size={12} filled className="text-amber-500" />
                      <span className="text-[11px] font-bold text-stone-800">
                        {car.rating}
                      </span>
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        onClick={() => onSelectCar(car.id)}
                        className="text-base font-bold text-[#17191C] font-heading hover:text-[#F97316] transition-colors cursor-pointer truncate"
                      >
                        {car.name}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.fuelType}</span>
                        <span>•</span>
                        <span>{car.seats} Seats</span>
                      </p>

                      {isConflicted && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200/90 text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                          <CalendarIcon
                            size={12}
                            className="text-amber-600 shrink-0"
                          />
                          <span className="truncate">
                            {car.status === "Maintenance"
                              ? "Under garage maintenance"
                              : `Reserved for ${bookingState.pickupDate || "selected dates"}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-[#17191C] font-heading">
                          €{car.pricePerDay}
                        </span>
                        <span className="text-[10px] text-stone-400"> /day</span>
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectCar(car.id)}
                          className="px-2.5 py-1.5 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Inspect Specifications"
                        >
                          Details
                        </button>
                        <button
                          disabled={isConflicted}
                          onClick={() => {
                            if (!isConflicted) {
                              if (onQuickBook) onQuickBook(car.id)
                              else onSelectCar(car.id)
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 ${
                            isConflicted
                              ? "bg-stone-200 text-stone-500 cursor-not-allowed shadow-none"
                              : "bg-[#F97316] hover:bg-[#EA580C] text-white cursor-pointer"
                          }`}
                        >
                          <ZapIcon size={12} />
                          <span>
                            {isConflicted
                              ? car.status === "Maintenance"
                                ? "Maintenance"
                                : "Reserved"
                              : "Book"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Comparison Studio Banner */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-white text-[#F97316] border border-orange-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              ⚡
            </span>
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">
                Can't decide which car fits your trip?
              </span>
              <span className="text-stone-500 text-[11px]">
                Compare mileage, passenger capacity, insurance, and rates
                side-by-side.
              </span>
            </div>
          </div>
          {onNavigateCompare && (
            <button
              onClick={onNavigateCompare}
              className="px-3.5 py-1.5 bg-[#17191C] hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>Compare Vehicles</span>
              <ArrowRightIcon size={13} />
            </button>
          )}
        </div>
      </section>

      {/* 6. How It Works: 3 Steps to the Road */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        id="how-it-works"
      >
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316] mb-1">
            SIMPLE PROCESS
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Straightforward rental reservation and pickup in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-2xs relative group hover:shadow-md transition-shadow">
            <span className="text-3xl font-black text-stone-200 font-heading absolute top-5 right-5">
              01
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-4">
              <CarIcon size={20} />
            </div>
            <h3 className="text-base font-bold text-[#17191C] font-heading mb-1.5">
              1. Choose a Vehicle
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore available cars in our garage with clear daily and weekly
              rates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-2xs relative group hover:shadow-md transition-shadow">
            <span className="text-3xl font-black text-stone-200 font-heading absolute top-5 right-5">
              02
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-4">
              <ShieldIcon size={20} />
            </div>
            <h3 className="text-base font-bold text-[#17191C] font-heading mb-1.5">
              2. Submit Request
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pick your rental dates and fill in your contact details. No online
              payment required upfront.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-2xs relative group hover:shadow-md transition-shadow">
            <span className="text-3xl font-black text-stone-200 font-heading absolute top-5 right-5">
              03
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-4">
              <ZapIcon size={20} />
            </div>
            <h3 className="text-base font-bold text-[#17191C] font-heading mb-1.5">
              3. Manager Approval &amp; Pickup
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              The garage manager approves your request. Inspect your car, pay on
              arrival, and pick up the keys.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Interactive FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316] mb-1">
            QUESTIONS &amp; ANSWERS
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqItems.map((item, idx) => {
            const isOpen = expandedFaq === idx

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#17191C] font-heading hover:text-[#F97316] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <span
                    className={`text-[#F97316] transform transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 text-xs text-stone-500 leading-relaxed animate-fade-in border-t border-stone-100">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Interactive Date & Scheduling Calendar Modal */}
      <DateSchedulingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        pickupDate={bookingState.pickupDate}
        pickupTime={bookingState.pickupTime}
        returnDate={bookingState.returnDate}
        returnTime={bookingState.returnTime}
        pickupLocation={bookingState.pickupLocation}
        onApply={(data) => {
          setBookingState((prev) => ({
            ...prev,

            ...data,
          }))

          onSearch()
        }}
      />
    </div>
  )
}
