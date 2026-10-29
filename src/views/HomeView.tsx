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
  InfoIcon,
  StarIcon,
  CheckIcon,
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
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return dateA.trim() === dateB.trim()
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
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
  const [selectedDuration, setSelectedDuration] =
    useState<"Hourly" | "Daily" | "Weekly" | "Monthly">("Daily")
  const [fleetFilter, setFleetFilter] = useState<string>("All")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Quick category cards
  const fleetCategories: {
    type: VehicleType
    label: string
    price: string
    image: string
    carId: string
    description: string
  }[] = [
    {
      type: "Economy",
      label: "Economy",
      price: "From $35/day",
      image:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      description: "Smart, fuel-efficient daily commuters with great MPG.",
    },
    {
      type: "Sedan",
      label: "Sedan",
      price: "From $45/day",
      image:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
      description: "Comfortable, quiet highway cruisers for executive travel.",
    },
    {
      type: "SUV",
      label: "SUV",
      price: "From $65/day",
      image:
        "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=800&q=80",
      description:
        "Spacious all-weather crossovers built for family roadtrips.",
    },
    {
      type: "Luxury",
      label: "Luxury",
      price: "From $120/day",
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
      description: "Refined German performance and cutting-edge cockpit tech.",
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
    <div className="space-y-20 pb-24 animate-fade-in bg-[#FAF7F2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 z-10 flex flex-col justify-center space-y-6 lg:pr-4">
              {/* Eyebrow - Clean uppercase text with generous tracking */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F97316]">
                  FLEXIBLE CAR RENTALS
                </p>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[70px] font-extrabold tracking-[-0.03em] text-[#17191C] leading-[1.04] font-heading">
                Your next drive <br />
                <span className="text-[#F97316]">starts here.</span>
              </h1>

              {/* Refined Subtitle */}
              <p className="text-base sm:text-lg text-gray-500 max-w-lg leading-relaxed font-normal">
                Direct garage rentals. Clean vehicles, transparent prices, and
                fast manager-approved bookings.
              </p>

              {/* Segmented Duration Switcher */}
              <div className="pt-2">
                <div className="inline-flex p-1.5 bg-[#EEF0F2] rounded-2xl gap-1 shadow-inner">
                  {(["Hourly", "Daily", "Weekly", "Monthly"] as const).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSelectedDuration(mode)
                          if (mode === "Hourly") {
                            // Same-day hourly rental: return is on the same day!
                            setBookingState((prev) => ({
                              ...prev,
                              rentalPlan: "hourly",
                              rentalDurationDays: 1,
                              returnDate: prev.pickupDate,
                              pickupTime: prev.pickupTime || "09:00 AM",
                              returnTime: "05:00 PM",
                            }))
                            return
                          }
                          const days =
                            mode === "Daily"
                              ? 3
                              : mode === "Weekly"
                                ? 7
                                : 30

                          // Advance returnDate based on pickupDate + duration days
                          let newReturnDate = bookingState.returnDate
                          const start = Date.parse(bookingState.pickupDate)
                          if (!isNaN(start)) {
                            const end = new Date(
                              start + days * 24 * 60 * 60 * 1000,
                            )
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
                            newReturnDate = `${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
                          }

                          setBookingState((prev) => ({
                            ...prev,
                            rentalPlan:
                              mode.toLowerCase() as BookingState["rentalPlan"],
                            rentalDurationDays: days,
                            returnDate: newReturnDate,
                          }))
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          selectedDuration === mode
                            ? "bg-white text-[#F97316] font-bold shadow-sm"
                            : "text-gray-500 hover:text-gray-900 font-medium"
                        }`}
                      >
                        {mode}
                      </button>
                    ),
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 font-medium">
                  {selectedDuration === "Hourly" &&
                    "⚡ Short trips and quick errands around town."}
                  {selectedDuration === "Daily" &&
                    "★ Standard daily rental for business or personal travel."}
                  {selectedDuration === "Weekly" &&
                    "🏷️ Multi-day discount for week-long rentals."}
                  {selectedDuration === "Monthly" &&
                    "💎 Extended rental for long-term vehicle needs."}
                </p>
              </div>
            </div>

            {/* Right Hero Image Card (Matching Reference Design with Glass Badge) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="w-full relative rounded-[32px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.12)] border border-white/60 bg-gray-100 aspect-[551/354] transform hover:scale-[1.01] transition-transform duration-500 group">
                <img
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                  alt="Luxury white SUV parked by modern villa at golden hour"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Glassmorphism Badge from reference screenshot */}
                <div className="absolute bottom-5 left-5 z-20 bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-xl border border-white/80 flex items-center gap-3 animate-fade-in max-w-xs">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <StarIcon size={20} filled className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#17191C] font-heading leading-tight">
                      Highly rated fleet
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Clean vehicles • Transparent pricing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Search Widget Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-28 mt-8 sm:mt-12 relative z-20">
          <div className="bg-white rounded-3xl shadow-[0_16px_45px_rgba(0,0,0,0.06)] border border-gray-100/90 p-6 sm:p-7 space-y-4">
            {/* Top Row: Garage Staging Info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Instant Vehicle Availability Search
              </span>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full font-medium">
                <LocationIcon size={13} className="text-[#F97316]" />
                <span>Garage locations set per vehicle by owner</span>
              </div>
            </div>

            {/* Responsive Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_1.1fr_auto] gap-3.5 items-end">
              {/* Garage Hub Indicator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-900">
                  Garage Location
                </label>
                <div className="relative h-[52px] border border-amber-200 bg-amber-50/40 rounded-xl px-3.5 flex items-center transition-all">
                  <LocationIcon
                    size={18}
                    className="text-[#F97316] mr-2.5 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-stone-900 block truncate">
                      Assigned by Vehicle Owner
                    </span>
                    <span className="text-[10px] text-stone-500 block truncate">
                      Pickup directly from vehicle's staged garage bay
                    </span>
                  </div>
                </div>
              </div>

              {/* Pickup Date & Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-900">
                  Pickup Date &amp; Time
                </label>
                <div
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="relative h-[52px] border border-gray-200 hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl px-3.5 flex items-center bg-white transition-all cursor-pointer group shadow-xs"
                >
                  <CalendarIcon
                    size={18}
                    className="text-[#F97316] mr-2.5 flex-shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-stone-900">
                      {bookingState.pickupDate}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md ml-1">
                      {bookingState.pickupTime}
                    </span>
                  </div>
                  <ChevronDownIcon
                    size={14}
                    className="text-gray-400 ml-2 flex-shrink-0 group-hover:text-stone-700 transition-colors"
                  />
                </div>
              </div>

              {/* Return Date & Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-900">
                    Return Date &amp; Time
                  </label>
                  {isSameDay(bookingState.pickupDate, bookingState.returnDate) && (
                    <span className="text-[10px] font-extrabold text-[#F97316] bg-orange-100/80 border border-orange-200 px-1.5 py-0.5 rounded-md">
                      ⚡ Same-Day Return
                    </span>
                  )}
                </div>
                <div
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="relative h-[52px] border border-gray-200 hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl px-3.5 flex items-center bg-white transition-all cursor-pointer group shadow-xs"
                >
                  <CalendarIcon
                    size={18}
                    className="text-[#F97316] mr-2.5 flex-shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-stone-900">
                      {bookingState.returnDate}
                      {isSameDay(bookingState.pickupDate, bookingState.returnDate) && (
                        <span className="ml-1 text-[10px] font-bold text-[#F97316]">
                          (Same Day)
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md ml-1">
                      {bookingState.returnTime}
                    </span>
                  </div>
                  <ChevronDownIcon
                    size={14}
                    className="text-gray-400 ml-2 flex-shrink-0 group-hover:text-stone-700 transition-colors"
                  />
                </div>
              </div>

              {/* Search Available Cars Button */}
              <div className="w-full sm:col-span-2 lg:col-span-1">
                <button
                  type="button"
                  onClick={onSearch}
                  className="w-full lg:w-auto h-[52px] px-7 sm:px-8 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(249,115,22,0.35)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap group"
                >
                  <span>Search Available Cars</span>
                  <ArrowRightIcon
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-[#F97316] group-hover:text-white transition-colors flex items-center justify-center text-[#F97316] flex-shrink-0">
              <CarIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#17191C] font-heading">
                Clean Fleet
              </h4>
              <p className="text-xs text-gray-500">Sanitized &amp; inspected</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-[#F97316] group-hover:text-white transition-colors flex items-center justify-center text-[#F97316] flex-shrink-0">
              <ShieldIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#17191C] font-heading">
                Transparent Pricing
              </h4>
              <p className="text-xs text-gray-500">Zero hidden surcharges</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-[#F97316] group-hover:text-white transition-colors flex items-center justify-center text-[#F97316] flex-shrink-0">
              <ClockIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#17191C] font-heading">
                Flexible Plans
              </h4>
              <p className="text-xs text-gray-500">Hourly, daily, weekly</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-[#F97316] group-hover:text-white transition-colors flex items-center justify-center text-[#F97316] flex-shrink-0">
              <HeadsetIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#17191C] font-heading">
                Direct Contact
              </h4>
              <p className="text-xs text-gray-500">
                Owner &amp; manager support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Vehicles Instant Showcase (Live SQLite Fleet) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon size={16} className="text-[#F97316]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                POPULAR CHOICES
              </p>
            </div>
            <h2 className="text-3xl font-extrabold text-[#17191C] font-heading">
              Garage Fleet Ready for Pickup
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Serviced, clean vehicles maintained and ready at our garage.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["All", "Sedan", "SUV", "Luxury", "Economy"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFleetFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  fleetFilter === cat
                    ? "bg-[#17191C] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards Grid with 1-Click Quick Booking */}
        {featuredCars.length === 0 ? (
          <div className="py-16 text-center text-stone-500 bg-white rounded-3xl border border-stone-200/80 shadow-xs">
            <p className="text-base font-bold text-stone-800">No vehicles currently listed in the fleet.</p>
            <p className="text-xs text-stone-400 mt-1">Check back soon as new vehicles are added to inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group"
            >
              {/* Image & Badges */}
              <div
                className="relative h-48 bg-gray-50 overflow-hidden cursor-pointer"
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
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-[#17191C]/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {car.type}
                  </span>
                  {car.status === "Rented" && (
                    <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                      🔴 Rented
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                  <StarIcon size={12} filled className="text-amber-500" />
                  <span className="text-[11px] font-bold text-gray-800">
                    {car.rating}
                  </span>
                </div>
              </div>

              {/* Car Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3
                    onClick={() => onSelectCar(car.id)}
                    className="text-lg font-bold text-[#17191C] font-heading hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    {car.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>{car.transmission}</span>
                    <span>•</span>
                    <span>{car.fuelType}</span>
                    <span>•</span>
                    <span>{car.seats} Seats</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-[#17191C] font-heading">
                      ${car.pricePerDay}
                    </span>
                    <span className="text-[11px] text-gray-400"> /day</span>
                  </div>

                  {/* 1-Click Fast Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectCar(car.id)}
                      className="px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
                      title="Inspect Specifications"
                    >
                      Details
                    </button>
                    <button
                      disabled={car.status === "Rented"}
                      onClick={() => {
                        if (car.status !== "Rented") {
                          if (onQuickBook) onQuickBook(car.id)
                          else onSelectCar(car.id)
                        }
                      }}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1 group/btn ${
                        car.status === "Rented"
                          ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                          : "bg-[#F97316] hover:bg-[#EA580C] text-white"
                      }`}
                    >
                      <ZapIcon size={13} />
                      <span>{car.status === "Rented" ? "Rented" : "Book"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Quick Comparison Studio Banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-orange-50/80 border border-orange-200/80 rounded-2xl gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-white text-[#F97316] border border-orange-200 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              ⚡
            </span>
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">
                Can't decide which car fits your trip?
              </span>
              <span className="text-stone-500">
                Compare mileage, passenger capacity, insurance, and rates
                side-by-side.
              </span>
            </div>
          </div>
          {onNavigateCompare && (
            <button
              onClick={onNavigateCompare}
              className="px-4 py-2 bg-[#17191C] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>Compare Vehicles Side-by-Side</span>
              <ArrowRightIcon size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Fleet Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="fleet">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#F97316] mb-1">
              OUR FLEET
            </p>
            <h2 className="text-3xl font-extrabold text-[#17191C] font-heading">
              Cars for Every Journey
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Explore our wide range of vehicles, from economy cars to premium
              SUVs.
            </p>
          </div>
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F97316] hover:text-[#EA580C] transition-colors group"
          >
            <span>View All Fleet</span>
            <ArrowRightIcon
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fleetCategories.map((cat) => (
            <div
              key={cat.type}
              onClick={() => onSelectCategory(cat.type)}
              className="group cursor-pointer bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div className="p-5 pb-3">
                <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-md">
                  {cat.price}
                </span>
                <h3 className="text-xl font-bold text-[#17191C] mt-2 font-heading">
                  {cat.label}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="h-44 overflow-hidden px-4 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.label}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                  }}
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 group-hover:text-[#F97316] transition-colors">
                <span>Browse {cat.label} Fleet</span>
                <ArrowRightIcon
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works: 3 Steps to the Road */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        id="how-it-works"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F97316] mb-1">
            SIMPLE PROCESS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191C] font-heading">
            How It Works
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Straightforward rental reservation and pickup in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm relative group hover:shadow-lg transition-shadow">
            <span className="text-4xl font-black text-gray-200 font-heading absolute top-6 right-6">
              01
            </span>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-5">
              <CarIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#17191C] font-heading mb-2">
              1. Choose a Vehicle
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Explore available cars in our garage with clear daily and weekly
              rates.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm relative group hover:shadow-lg transition-shadow">
            <span className="text-4xl font-black text-gray-200 font-heading absolute top-6 right-6">
              02
            </span>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-5">
              <ShieldIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#17191C] font-heading mb-2">
              2. Submit Request
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pick your rental dates and fill in your contact details. No online
              payment required upfront.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm relative group hover:shadow-lg transition-shadow">
            <span className="text-4xl font-black text-gray-200 font-heading absolute top-6 right-6">
              03
            </span>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-5">
              <ZapIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#17191C] font-heading mb-2">
              3. Manager Approval &amp; Pickup
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              The garage manager approves your request. Inspect your car, pay on
              arrival, and pick up the keys.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F97316] mb-1">
            QUESTIONS &amp; ANSWERS
          </p>
          <h2 className="text-3xl font-extrabold text-[#17191C] font-heading">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = expandedFaq === idx
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#17191C] font-heading hover:text-[#F97316] transition-colors"
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
                  <div className="px-5 pb-5 pt-0 text-xs text-gray-500 leading-relaxed animate-fade-in border-t border-gray-100">
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
