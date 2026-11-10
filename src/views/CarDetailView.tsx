import React, { useState, useEffect, useMemo } from "react"
import type { Car, BookingState } from "../types"
import { api } from "../services/api"
import DateSchedulingModal from "../components/DateSchedulingModal"
import { calculateRentalPrice } from "../utils/pricing"
import CarDetailGallery from "./customer/CarDetailGallery"
import CarDetailSpecs from "./customer/CarDetailSpecs"
import CarDetailBookingCard from "./customer/CarDetailBookingCard"
import CarDetailSimilarFleet from "./customer/CarDetailSimilarFleet"

interface CarDetailViewProps {
  car?: Car
  carId?: string
  allCars: Car[]
  bookingState: BookingState
  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>
  onProceedToBooking: () => void
  onNavigateHome: () => void
  onNavigateListing: () => void
  onSelectSimilarCar: (carId: string) => void
}

export default function CarDetailView({
  car: propCar,
  carId: propCarId,
  allCars,
  bookingState,
  setBookingState,
  onProceedToBooking,
  onNavigateHome,
  onNavigateListing,
  onSelectSimilarCar,
}: CarDetailViewProps) {
  const activeCarId = propCar?.id || propCarId || ""
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [promoCode, setPromoCode] = useState(bookingState.promoCode || "")
  const [promoApplied, setPromoApplied] = useState(
    Boolean(bookingState.discountPercent && bookingState.discountPercent > 0),
  )
  const [discountPercent, setDiscountPercent] = useState<number>(
    bookingState.discountPercent || 0,
  )
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)
  const [isQuoteSuccess, setIsQuoteSuccess] = useState<boolean>(false)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  const [car, setCar] = useState<Car | undefined>(
    () => propCar || allCars.find((c) => c.id === activeCarId),
  )

  useEffect(() => {
    if (propCar) {
      setCar(propCar)
      return
    }
    const found = allCars.find((c) => c.id === activeCarId)
    if (found) {
      setCar(found)
    } else if (activeCarId) {
      api.getCarById(activeCarId).then((fetched) => {
        if (fetched) setCar(fetched)
      })
    }
  }, [propCar, activeCarId, allCars])

  const [availabilityCheck, setAvailabilityCheck] = useState<{
    isAvailable: boolean
    conflict?: {
      pickupDate: string
      returnDate: string
      reason?: string
    }
    loading: boolean
  }>({
    isAvailable: true,
    loading: false,
  })

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
            isAvailable: res.isAvailable,
            conflict: res.conflict || undefined,
            loading: false,
          })
        }
      } catch {
        if (!isCancelled) {
          const isConflicted =
            car.status === "Maintenance" ||
            car.status === "Rented" ||
            car.statusForDates === "Reserved" ||
            car.isAvailableForDates === false
          setAvailabilityCheck({
            isAvailable: !isConflicted,
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
    car?.gallery && car.gallery.length > 0
      ? car.gallery
      : car?.image
        ? [car.image]
        : []

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === 0
        ? galleryImages.length > 0
          ? galleryImages.length - 1
          : 0
        : prev - 1,
    )
  }

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === (galleryImages.length > 0 ? galleryImages.length - 1 : 0)
        ? 0
        : prev + 1,
    )
  }

  const similarCars = car
    ? allCars
        .filter(
          (c) =>
            c.id !== car.id &&
            (c.type === car.type ||
              Math.abs(c.pricePerDay - car.pricePerDay) <= 35),
        )
        .slice(0, 3)
    : []

  const days = useMemo(() => {
    try {
      const pStr = bookingState.pickupTime
        ? `${bookingState.pickupDate} ${bookingState.pickupTime}`
        : bookingState.pickupDate
      const rStr = bookingState.returnTime
        ? `${bookingState.returnDate} ${bookingState.returnTime}`
        : bookingState.returnDate
      const start = Date.parse(pStr)
      const end = Date.parse(rStr)
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
      }
    } catch {}
    return bookingState.rentalDurationDays || 1
  }, [
    bookingState.pickupDate,
    bookingState.pickupTime,
    bookingState.returnDate,
    bookingState.returnTime,
    bookingState.rentalDurationDays,
  ])

  const isSameDayBooking = useMemo(() => {
    if (!bookingState.pickupDate || !bookingState.returnDate) return false
    const p = new Date(bookingState.pickupDate)
    const r = new Date(bookingState.returnDate)
    if (isNaN(p.getTime()) || isNaN(r.getTime())) {
      return bookingState.pickupDate.trim() === bookingState.returnDate.trim()
    }
    return (
      p.getFullYear() === r.getFullYear() &&
      p.getMonth() === r.getMonth() &&
      p.getDate() === r.getDate()
    )
  }, [bookingState.pickupDate, bookingState.returnDate])

  const sameDayHours = useMemo(() => {
    if (!isSameDayBooking) return 0
    const parseHour = (t?: string): number => {
      if (!t) return 10
      const parts = t.split(" ")
      const time = parts[0] || "10:00"
      const modifier = parts[1] || "AM"
      let [h] = time.split(":").map(Number)
      if (modifier === "PM" && h < 12) h += 12
      if (modifier === "AM" && h === 12) h = 0
      return h
    }
    const pHour = parseHour(bookingState.pickupTime)
    const rHour = parseHour(bookingState.returnTime)
    return Math.max(0, rHour - pHour)
  }, [isSameDayBooking, bookingState.pickupTime, bookingState.returnTime])

  const pricingResult = useMemo(() => {
    if (!car) {
      return {
        tier: "daily" as const,
        basePrice: 0,
        rateApplied: 0,
        rateLabel: "€0/day",
        durationText: "0 Days",
      }
    }
    return calculateRentalPrice({
      car,
      isSameDay: isSameDayBooking,
      sameDayHours,
      days,
    })
  }, [car, isSameDayBooking, sameDayHours, days])

  const baseRental = pricingResult.basePrice
  const discountMultiplier =
    promoApplied && discountPercent > 0 ? 1 - discountPercent / 100 : 1.0
  const discountedBase = Number((baseRental * discountMultiplier).toFixed(2))
  const promoDiscountAmount = Number((baseRental - discountedBase).toFixed(2))
  const vatPercent =
    car?.vatRate != null && !isNaN(Number(car.vatRate))
      ? Number(car.vatRate)
      : 18
  const taxes = Number((discountedBase * (vatPercent / 100)).toFixed(2))
  const grandTotal = Number((discountedBase + taxes).toFixed(2))

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code) {
      setPromoApplied(false)
      setDiscountPercent(0)
      setIsQuoteSuccess(false)
      setQuoteMessage("Please enter a privilege voucher code.")
      return
    }

    setIsValidatingPromo(true)
    try {
      const res = await api.validatePromo(code)
      if (res && res.valid) {
        setPromoApplied(true)
        setDiscountPercent(res.discountPercent)
        setPromoCode(res.code)
        setIsQuoteSuccess(true)
        setQuoteMessage(
          `${res.discountPercent}% Atelier Privilege Applied (${res.code})`,
        )
        setBookingState((prev) => ({
          ...prev,
          promoCode: res.code,
          discountPercent: res.discountPercent,
        }))
      } else {
        setPromoApplied(false)
        setDiscountPercent(0)
        setIsQuoteSuccess(false)
        setQuoteMessage(
          res?.message || "Invalid or unrecognized privilege code.",
        )
        setBookingState((prev) => ({
          ...prev,
          promoCode: undefined,
          discountPercent: undefined,
        }))
      }
    } catch {
      setPromoApplied(false)
      setDiscountPercent(0)
      setIsQuoteSuccess(false)
      setQuoteMessage("Unable to validate privilege code.")
    } finally {
      setIsValidatingPromo(false)
      setTimeout(() => setQuoteMessage(null), 5000)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(false)
    setDiscountPercent(0)
    setPromoCode("")
    setIsQuoteSuccess(false)
    setQuoteMessage("Privilege code removed.")
    setBookingState((prev) => ({
      ...prev,
      promoCode: undefined,
      discountPercent: undefined,
    }))
    setTimeout(() => setQuoteMessage(null), 3000)
  }

  if (!car) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-stone-900 font-heading">
          Vehicle Not Found
        </h2>
        <p className="text-stone-500 text-sm">
          The requested vehicle could not be loaded from the garage fleet.
        </p>
        <button
          onClick={onNavigateListing}
          className="px-6 py-2.5 bg-[#F97316] text-white font-bold rounded-xl text-xs hover:bg-[#EA580C] transition cursor-pointer"
        >
          Return to Fleet Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 pb-32 lg:pb-20">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-[#F97316] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span>&gt;</span>
        <button
          onClick={onNavigateListing}
          className="hover:text-[#F97316] transition-colors cursor-pointer"
        >
          Fleet Inventory
        </button>
        <span>&gt;</span>
        <span className="text-stone-900 font-bold">{car.name}</span>
      </nav>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery, Specs, Similar Vehicles */}
        <div className="lg:col-span-8 space-y-8">
          <CarDetailGallery
            car={car}
            galleryImages={galleryImages}
            selectedPhotoIndex={selectedPhotoIndex}
            setSelectedPhotoIndex={setSelectedPhotoIndex}
            onPrevPhoto={handlePrevPhoto}
            onNextPhoto={handleNextPhoto}
          />

          <CarDetailSpecs car={car} />

          <CarDetailSimilarFleet
            similarCars={similarCars}
            onSelectSimilarCar={onSelectSimilarCar}
          />
        </div>

        {/* Right Column: Sticky Booking Console */}
        <CarDetailBookingCard
          car={car}
          bookingState={bookingState}
          availabilityCheck={availabilityCheck}
          pricingResult={pricingResult}
          days={days}
          isSameDayBooking={isSameDayBooking}
          sameDayHours={sameDayHours}
          baseRental={baseRental}
          promoApplied={promoApplied}
          discountPercent={discountPercent}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoDiscountAmount={promoDiscountAmount}
          vatPercent={vatPercent}
          taxes={taxes}
          grandTotal={grandTotal}
          quoteMessage={quoteMessage}
          isQuoteSuccess={isQuoteSuccess}
          isValidatingPromo={isValidatingPromo}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onProceedToBooking={onProceedToBooking}
        />
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
