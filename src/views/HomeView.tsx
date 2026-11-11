import React, { useState } from "react"
import type { Car, VehicleType, BookingState } from "../types"
import DateSchedulingModal from "../components/DateSchedulingModal"
import HomeHero from "./customer/HomeHero"
import HomeBookingBar, {
  DurationPreset,
  TIER_PRESETS,
} from "./customer/HomeBookingBar"
import HomeCategories from "./customer/HomeCategories"
import HomeAssuranceRibbon from "./customer/HomeAssuranceRibbon"
import HomeFeaturedFleet from "./customer/HomeFeaturedFleet"
import HomeHowItWorks from "./customer/HomeHowItWorks"
import HomeFaq from "./customer/HomeFaq"

interface HomeViewProps {
  cars: Car[]
  bookingState: BookingState
  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>
  onSearch: () => void
  onSelectCategory: (category: VehicleType) => void
  onSelectCar: (carId: string) => void
  onQuickBook?: (carId: string) => void
  onNavigateCompare?: () => void
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
  const [fleetFilter, setFleetFilter] = useState<string>("All")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

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

  // Filter featured vehicles from live fleet
  const featuredCars = (cars.length > 0 ? cars : []).filter((car) => {
    if (fleetFilter === "All") return true
    return car.type === fleetFilter
  })

  return (
    <div className="space-y-16 sm:space-y-20 pb-24 animate-fade-in bg-[#FAF7F2]">
      {/* 1. Hero Section - Inspired by Reference COOLVINTAGECARS */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-8 sm:pb-12">
        <HomeHero onSearch={onSearch} />
        <HomeBookingBar
          bookingState={bookingState}
          selectedDuration={selectedDuration}
          activeDurationPill={activeDurationPill}
          onSelectTier={handleSelectTier}
          onApplyPreset={handleApplyPreset}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onSearch={onSearch}
        />
      </section>

      {/* 2. Editorial Vehicle Category Gallery Strip */}
      <HomeCategories onSelectCategory={onSelectCategory} onViewAll={onSearch} />

      {/* 3. Assurance Ribbon */}
      <HomeAssuranceRibbon />

      {/* 4. Popular Vehicles Showcase */}
      <HomeFeaturedFleet
        cars={cars}
        featuredCars={featuredCars}
        fleetFilter={fleetFilter}
        setFleetFilter={setFleetFilter}
        bookingState={bookingState}
        onSelectCar={onSelectCar}
        onQuickBook={onQuickBook}
        onNavigateCompare={onNavigateCompare}
      />

      {/* 5. How It Works (3 Steps) */}
      <HomeHowItWorks />

      {/* 6. Frequently Asked Questions */}
      <HomeFaq />

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
