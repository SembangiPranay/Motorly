import React, { useState, useEffect, useMemo } from "react"
import type { Car, BookingState } from "../types"
import { api } from "../services/api"
import GarageMapViewer from "../components/GarageMapViewer"
import DateSchedulingModal from "../components/DateSchedulingModal"
import {
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  LocationIcon,
  CalendarIcon,
  ShieldIcon,
  LuggageIcon,
  TransmissionIcon,
  FuelIcon,
  UserIcon,
  ZapIcon,
  TagIcon,
  SparklesIcon,
} from "../components/Icons"

interface CarDetailViewProps {
  car: Car
  allCars: Car[]
  bookingState: BookingState
  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>
  onProceedToBooking: () => void
  onSelectSimilarCar: (carId: string) => void
  onNavigateHome: () => void
  onNavigateListing: () => void
}

export default function CarDetailView({
  car,
  allCars,
  bookingState,
  setBookingState,
  onProceedToBooking,
  onSelectSimilarCar,
  onNavigateHome,
  onNavigateListing,
}: CarDetailViewProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [activeTab, setActiveTab] =
    useState<"overview" | "garage" | "features" | "rates" | "reviews">(
      "overview",
    )
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    isAvailable: boolean
    conflict: any
    loading: boolean
  }>({
    isAvailable: true,
    conflict: null,
    loading: false,
  })

  // Live Double Booking Prevention: Check vehicle reservation availability
  useEffect(() => {
    let isCancelled = false
    async function verifyAvailability() {
      if (!car?.id) return
      setAvailabilityCheck((prev) => ({ ...prev, loading: true }))
      try {
        const res = await api.checkCarAvailability(
          car.id,
          bookingState.pickupDate,
          bookingState.returnDate,
        )
        if (!isCancelled) {
          setAvailabilityCheck({
            isAvailable: Boolean(res.isAvailable),
            conflict: res.conflict,
            loading: false,
          })
        }
      } catch {
        if (!isCancelled) {
          setAvailabilityCheck({
            isAvailable: true,
            conflict: null,
            loading: false,
          })
        }
      }
    }
    verifyAvailability()
    return () => {
      isCancelled = true
    }
  }, [car?.id, bookingState.pickupDate, bookingState.returnDate])

  const galleryImages =
    car.gallery && car.gallery.length > 0 ? car.gallery : [car.image]

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1,
    )
  }

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1,
    )
  }

  // Find similar vehicles
  const similarCars = allCars
    .filter(
      (c) =>
        c.id !== car.id &&
        (c.type === car.type ||
          Math.abs(c.pricePerDay - car.pricePerDay) <= 35),
    )
    .slice(0, 3)

  // Live dynamic calculations
  const days = useMemo(() => {
    try {
      const start = Date.parse(bookingState.pickupDate)
      const end = Date.parse(bookingState.returnDate)
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
      }
    } catch {}
    return bookingState.rentalDurationDays || 3
  }, [
    bookingState.pickupDate,
    bookingState.returnDate,
    bookingState.rentalDurationDays,
  ])
  const baseRental = car.pricePerDay * days
  const discountMultiplier = promoApplied ? 0.85 : 1.0 // 15% off with promo code
  const discountedBase = baseRental * discountMultiplier
  const taxes = Number((discountedBase * 0.18).toFixed(2))
  const protectionFee = bookingState.protectionPlan
    ? Number((12.0 * days).toFixed(2))
    : 0.0
  const grandTotal = Number((discountedBase + taxes + protectionFee).toFixed(2))

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "DRIVE15") {
      setPromoApplied(true)
      setQuoteMessage("Success: 15% discount applied with code DRIVE15!")
    } else {
      setQuoteMessage("Code invalid. Try promo code: DRIVE15")
    }
    setTimeout(() => setQuoteMessage(null), 4000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 pb-32 lg:pb-20">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-[#F97316] transition-colors"
        >
          Home
        </button>
        <span>&gt;</span>
        <button
          onClick={onNavigateListing}
          className="hover:text-[#F97316] transition-colors"
        >
          Fleet Inventory
        </button>
        <span>&gt;</span>
        <span className="text-gray-900 font-bold">{car.name}</span>
      </nav>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main Details Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery View Card */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4 sm:p-5 shadow-sm space-y-4">
            {/* Big Active Image */}
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center group">
              <img
                src={galleryImages[selectedPhotoIndex] || car.image}
                alt={`${car.name} view ${selectedPhotoIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-800 shadow-md hover:bg-white hover:text-[#F97316] transition-colors"
                aria-label="Previous photo"
              >
                <ArrowLeftIcon size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-800 shadow-md hover:bg-white hover:text-[#F97316] transition-colors"
                aria-label="Next photo"
              >
                <ArrowRightIcon size={18} />
              </button>

              {/* Counter Badge */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                {selectedPhotoIndex + 1} / {galleryImages.length}
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-800">
                  {car.status || "Available Today"}
                </span>
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedPhotoIndex === idx
                      ? "border-[#F97316] ring-2 ring-orange-200"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Info & Spec Bar */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
                    {car.name}
                  </h1>
                  <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-lg">
                    {car.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600 font-medium">
                  <span className="flex items-center text-amber-500 font-bold gap-1">
                    <StarIcon size={14} filled /> {car.rating}
                  </span>
                  <span>•</span>
                  <span>({car.reviewsCount}+ verified renter reviews)</span>
                  <span>•</span>
                  <span className="text-green-600 font-semibold">
                    Terminal Dispatch Guaranteed
                  </span>
                </div>
              </div>

              {/* Health Score Badge */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <SparklesIcon size={16} className="text-emerald-600" />
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block leading-none">
                    Vehicle Health
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {car.healthScore || 98}% Certified Clean
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Specs Badges Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <UserIcon size={18} className="text-[#F97316]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">
                    Capacity
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {car.seats} Passengers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <TransmissionIcon size={18} className="text-[#F97316]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">
                    Transmission
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {car.transmission}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <FuelIcon size={18} className="text-[#F97316]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">
                    Fuel &amp; MPG
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {car.fuelType} ({car.mileage})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <LuggageIcon size={18} className="text-[#F97316]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">
                    Luggage
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {car.luggage}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Tabs: Overview, Garage Map, Features, Rental Rates, Reviews */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6 sm:gap-8 text-sm font-bold overflow-x-auto no-scrollbar">
                {[
                  { id: "overview", label: "Overview & Specs" },
                  { id: "garage", label: "📍 Garage & Map Location" },
                  { id: "features", label: "Features & Tech" },
                  { id: "rates", label: "Rental Rates" },
                  { id: "reviews", label: "Reviews" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`pb-3 font-heading transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-[#F97316] border-[#F97316]"
                        : "text-gray-500 border-transparent hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6 pt-2 animate-fade-in">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {car.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB]">
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      Manufacturer
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {car.brand}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      Model Year
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {car.year}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      Plate Registration
                    </span>
                    <span className="text-sm font-bold font-mono text-[#F97316]">
                      {car.plateNumber || "FL-492-MTR"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      Hub Station
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {car.location || "MIA Airport"}
                    </span>
                  </div>
                </div>

                {/* Insurance & Acquisition History Box */}
                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldIcon size={14} className="text-amber-600" />
                      Comprehensive Insurance & Ownership Verification
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      100% COVERED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700">
                    <div>
                      <span className="text-[11px] text-stone-500 block">
                        Insurance Provider & Policy:
                      </span>
                      <span className="font-bold">
                        {car.insuranceProvider || "State Farm Commercial"}
                      </span>
                      <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                        {car.insurancePolicy || "POL-STF-994021"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 block">
                        Fleet Acquisition Date:
                      </span>
                      <span className="font-bold">
                        {car.purchaseDate || "Jan 10, 2024"}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Purchased new for fleet
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 block">
                        Certified Mileage:
                      </span>
                      <span className="font-bold font-mono text-stone-900">
                        {car.currentOdometer
                          ? `${car.currentOdometer.toLocaleString()} mi`
                          : car.mileage}
                      </span>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        ✓ Odometer Verified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Garage & Exact Map Engine */}
            {activeTab === "garage" && (
              <div className="pt-2 animate-fade-in space-y-4">
                <p className="text-xs text-stone-600">
                  This vehicle is staged and ready for pickup at our dedicated
                  garage facility. Use the interactive map below to find the
                  exact garage bay.
                </p>
                <GarageMapViewer
                  garageName={
                    car.garageName ||
                    `${car.location || "Miami International Airport"} Staging Garage`
                  }
                  garageAddress={
                    car.garageAddress ||
                    car.location ||
                    "4200 NW 21st St, Miami, FL 33142"
                  }
                  garageBay={car.garageBay || "Bay 14-B"}
                  lat={car.garageLat || 25.7959}
                  lng={car.garageLng || -80.287}
                  height="300px"
                />
              </div>
            )}

            {/* Tab 2: Features */}
            {activeTab === "features" && (
              <div className="pt-2 animate-fade-in space-y-4">
                <p className="text-xs text-gray-500">
                  All equipment is thoroughly inspected and disinfected between
                  each rental.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {car.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 border border-gray-100"
                    >
                      <CheckIcon size={14} className="text-[#F97316]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 border border-gray-100">
                    <CheckIcon size={14} className="text-[#F97316]" />
                    <span>Emergency SOS Roadside</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 border border-gray-100">
                    <CheckIcon size={14} className="text-[#F97316]" />
                    <span>Keyless Digital Lock</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Rental Rates */}
            {activeTab === "rates" && (
              <div className="pt-2 animate-fade-in space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Hourly Flex
                    </span>
                    <p className="text-2xl font-black text-[#17191C] font-heading mt-1">
                      ${car.pricePerHour}
                    </p>
                    <span className="text-[11px] text-gray-400">
                      Fuel &amp; 30 miles included
                    </span>
                  </div>
                  <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 text-center relative">
                    <span className="absolute -top-2.5 right-4 bg-[#F97316] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Popular
                    </span>
                    <span className="text-xs font-bold text-[#F97316] uppercase">
                      Daily Standard
                    </span>
                    <p className="text-2xl font-black text-[#F97316] font-heading mt-1">
                      ${car.pricePerDay}
                    </p>
                    <span className="text-[11px] text-gray-500">
                      Unlimited miles across state
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Weekly (7+ Days)
                    </span>
                    <p className="text-2xl font-black text-[#17191C] font-heading mt-1">
                      ${(car.pricePerDay * 0.82).toFixed(0)}/day
                    </p>
                    <span className="text-[11px] text-green-600 font-bold">
                      18% Automatic Savings
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Reviews */}
            {activeTab === "reviews" && (
              <div className="pt-2 animate-fade-in space-y-3">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      James T. • Verified Renter
                    </span>
                    <span className="text-amber-500 font-bold text-xs">
                      ★★★★★ 5.0
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    "Vehicle was spotless, smelling fresh, and waiting right at
                    the airport gate. Smooth ride and exceptional fuel economy."
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      Sophia K. • Verified Renter
                    </span>
                    <span className="text-amber-500 font-bold text-xs">
                      ★★★★★ 5.0
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    "Fastest rental experience I have had in Florida. Zero sales
                    pressure for add-ons."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Similar Vehicles Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#17191C] font-heading">
              Similar Vehicles You May Like
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarCars.map((sCar) => (
                <div
                  key={sCar.id}
                  onClick={() => onSelectSimilarCar(sCar.id)}
                  className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-orange-300 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="h-32 rounded-xl overflow-hidden bg-gray-50 mb-3">
                    <img
                      src={sCar.image}
                      alt={sCar.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#F97316] transition-colors">
                    {sCar.name}
                  </h4>
                  <p className="text-xs font-bold text-[#F97316] mt-1">
                    ${sCar.pricePerDay} /day
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Fare Calculator Column */}
        <div className="lg:col-span-4 sticky top-28 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-xl space-y-5">
            {/* Price Header & Live Date Availability */}
            <div className="border-b border-gray-100 pb-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-[#17191C] font-heading">
                    ${car.pricePerDay}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {" "}
                    / day
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  ${car.pricePerHour} / hour
                </span>
              </div>

              {/* Availability Status Badge */}
              <div className="pt-1">
                {availabilityCheck.loading ? (
                  <span className="text-[11px] text-gray-400 animate-pulse">
                    Checking live calendar dates...
                  </span>
                ) : availabilityCheck.isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    🟢 Available for {bookingState.pickupDate} →{" "}
                    {bookingState.returnDate}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                    🔴 Reserved / Unavailable for Selected Dates
                  </span>
                )}
              </div>
            </div>

            {/* Trip Parameters */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Garage Location (Pickup &amp; Return)
                </label>
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <LocationIcon
                    size={16}
                    className="text-[#F97316] mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-stone-900 truncate">
                      {car.garageName || "MOTORLY Central Hub & Garage"}
                    </p>
                    <p className="text-[11px] text-stone-600 truncate mt-0.5">
                      {car.garageAddress || car.location || "4200 NW 21st St, Miami, FL 33142"}
                    </p>
                    {car.garageBay && (
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold text-amber-800 bg-white border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                        Stall: {car.garageBay}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Trip Dates &amp; Scheduling
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="text-[11px] font-bold text-[#F97316] hover:underline cursor-pointer"
                  >
                    Change Dates
                  </button>
                </div>
                <div
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="p-3 bg-stone-50 hover:bg-orange-50/50 border border-stone-200 hover:border-orange-400 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon
                      size={16}
                      className="text-[#F97316] group-hover:scale-110 transition-transform shrink-0"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-stone-900">
                        {bookingState.pickupDate} ({bookingState.pickupTime})
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        to {bookingState.returnDate} ({bookingState.returnTime})
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#F97316] bg-orange-100/80 px-2 py-0.5 rounded-md shrink-0">
                    {days} {days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              {/* Full Collision Protection Toggle */}
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50/30 border border-gray-200 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <ShieldIcon size={18} className="text-[#F97316]" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Collision Protection
                      </p>
                      <p className="text-[10px] text-gray-400">
                        $12/day • $0 Deductible
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingState.protectionPlan}
                    onChange={(e) =>
                      setBookingState((prev) => ({
                        ...prev,
                        protectionPlan: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-[#F97316] accent-[#F97316]"
                  />
                </label>
              </div>

              {/* Promo Code Box */}
              <div className="pt-1 flex gap-2">
                <div className="relative flex-1">
                  <TagIcon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Promo code (DRIVE15)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {quoteMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold text-center animate-fade-in ${
                  promoApplied
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-orange-50 text-[#F97316] border border-orange-200"
                }`}
              >
                {quoteMessage}
              </div>
            )}

            {/* Calculated Breakdown */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>
                  Base (${car.pricePerDay} × {days} days)
                </span>
                <span className="font-semibold text-gray-900">
                  ${baseRental.toFixed(2)}
                </span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>15% Promo Discount (DRIVE15)</span>
                  <span>-${(baseRental * 0.15).toFixed(2)}</span>
                </div>
              )}
              {bookingState.protectionPlan && (
                <div className="flex justify-between">
                  <span>Collision Protection ($12 × {days} days)</span>
                  <span className="font-semibold text-gray-900">
                    ${protectionFee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes &amp; Airport Surcharges (18%)</span>
                <span className="font-semibold text-gray-900">
                  ${taxes.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-extrabold text-[#17191C] font-heading">
                <span>Estimated Total</span>
                <span className="text-[#F97316] text-xl font-black">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Book Now Primary Button */}
            <div className="space-y-2.5 pt-2">
              {!availabilityCheck.isAvailable && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Reserved for these dates:</span>
                  </p>
                  <p className="font-mono text-[11px]">
                    {availabilityCheck.conflict?.pickupDate} →{" "}
                    {availabilityCheck.conflict?.returnDate}
                  </p>
                  <p className="text-[10px] text-rose-600">
                    Please pick different rental dates above to book this car.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onProceedToBooking}
                disabled={!availabilityCheck.isAvailable}
                className={`w-full py-3.5 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group text-sm ${
                  !availabilityCheck.isAvailable
                    ? "bg-stone-300 text-stone-600 cursor-not-allowed opacity-80"
                    : "bg-[#F97316] hover:bg-[#EA580C] text-white hover:shadow-lg"
                }`}
              >
                {!availabilityCheck.isAvailable ? (
                  <span>🚫 Unavailable for Selected Dates</span>
                ) : (
                  <>
                    <ZapIcon size={16} />
                    <span>Proceed to Instant Checkout</span>
                    <ArrowRightIcon
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckIcon size={14} className="text-green-500 flex-shrink-0" />
                <span>Free cancellation up to 24h before pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon size={14} className="text-green-500 flex-shrink-0" />
                <span>No security deposit on credit cards at MIA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon size={14} className="text-green-500 flex-shrink-0" />
                <span>Instant dispatch &amp; vehicle mating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Sticky Floating Booking Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between lg:hidden shadow-2xl">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-stone-900 font-heading">
              ${car.pricePerDay}
            </span>
            <span className="text-xs text-stone-500 font-semibold">/day</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700">
            ${grandTotal.toFixed(2)} total • {days}{" "}
            {days === 1 ? "day" : "days"}
          </p>
        </div>
        <button
          type="button"
          onClick={onProceedToBooking}
          disabled={!availabilityCheck.isAvailable}
          className={`h-11 px-5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
            !availabilityCheck.isAvailable
              ? "bg-stone-300 text-stone-600 cursor-not-allowed"
              : "bg-[#F97316] hover:bg-[#EA580C] text-white active:scale-95"
          }`}
        >
          <ZapIcon size={14} />
          <span>
            {availabilityCheck.isAvailable ? "Instant Book" : "Reserved"}
          </span>
          <ArrowRightIcon size={14} />
        </button>
      </div>

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
        }}
      />
    </div>
  )
}
