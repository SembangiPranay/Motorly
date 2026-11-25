import type { Car } from "../types"

export interface PricingCalculationResult {
  tier: "hourly" | "daily" | "weekly" | "monthly"
  basePrice: number
  rateApplied: number
  rateLabel: string
  durationText: string
  savingsText?: string
}

export function getDefaultWeeklyPrice(pricePerDay: number): number {
  return Math.round(pricePerDay * 6) // Standard 7-day rental for the cost of 6 days (~14% discount)
}

export function getDefaultMonthlyPrice(pricePerDay: number): number {
  return Math.round(pricePerDay * 22) // Standard 30-day rental for the cost of 22 days (~27% discount)
}

export function calculateRentalPrice(params: {
  car: Pick<Car, "pricePerHour" | "pricePerDay" | "pricePerWeek" | "pricePerMonth">
  isSameDay: boolean
  sameDayHours?: number
  days: number
}): PricingCalculationResult {
  const { car, isSameDay, sameDayHours = 8, days } = params

  const effectiveHourlyRate =
    car.pricePerHour || Math.max(5, Math.round(car.pricePerDay / 7))
  const effectiveDailyRate = car.pricePerDay || 50
  const effectiveWeeklyRate =
    car.pricePerWeek || getDefaultWeeklyPrice(effectiveDailyRate)
  const effectiveMonthlyRate =
    car.pricePerMonth || getDefaultMonthlyPrice(effectiveDailyRate)

  // 1. Same-Day / Hourly Rental
  if (isSameDay) {
    const hours = Math.max(3, sameDayHours)
    const basePrice = Math.round(hours * effectiveHourlyRate)
    return {
      tier: "hourly",
      basePrice,
      rateApplied: effectiveHourlyRate,
      rateLabel: `€${effectiveHourlyRate}/hr`,
      durationText: `${hours} Hours (Hourly Flex)`,
    }
  }

  // 2. Monthly Rental (30+ Days)
  if (days >= 30) {
    const months = Math.floor(days / 30)
    const remainderDays = days % 30
    const basePrice = Math.round(
      months * effectiveMonthlyRate + remainderDays * effectiveDailyRate,
    )
    const standardDailyCost = days * effectiveDailyRate
    const savings = standardDailyCost - basePrice

    return {
      tier: "monthly",
      basePrice,
      rateApplied: effectiveMonthlyRate,
      rateLabel: `€${effectiveMonthlyRate}/mo`,
      durationText: `${days} Days (${months} Mo${
        remainderDays > 0 ? ` + ${remainderDays}d` : ""
      })`,
      savingsText:
        savings > 0 ? `Save €${savings.toLocaleString()} vs daily` : undefined,
    }
  }

  // 3. Weekly Rental (7 - 29 Days)
  if (days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainderDays = days % 7
    const basePrice = Math.round(
      weeks * effectiveWeeklyRate + remainderDays * effectiveDailyRate,
    )
    const standardDailyCost = days * effectiveDailyRate
    const savings = standardDailyCost - basePrice

    return {
      tier: "weekly",
      basePrice,
      rateApplied: effectiveWeeklyRate,
      rateLabel: `€${effectiveWeeklyRate}/wk`,
      durationText: `${days} Days (${weeks} Wk${
        remainderDays > 0 ? ` + ${remainderDays}d` : ""
      })`,
      savingsText:
        savings > 0 ? `Save €${savings.toLocaleString()} vs daily` : undefined,
    }
  }

  // 4. Daily Standard Rental (1 - 6 Days)
  const basePrice = Math.round(Math.max(1, days) * effectiveDailyRate)
  return {
    tier: "daily",
    basePrice,
    rateApplied: effectiveDailyRate,
    rateLabel: `€${effectiveDailyRate}/day`,
    durationText: `${days} ${days === 1 ? "Day" : "Days"}`,
  }
}

export interface OptionalServiceItem {
  id: string
  name: string
  pricePerDay: number
  description: string
  icon: string
  clauseReference: string
}

export const AVAILABLE_OPTIONAL_SERVICES: OptionalServiceItem[] = [
  {
    id: "stroller",
    name: "Baby Stroller / Buggy",
    pricePerDay: 5,
    description: "Lightweight, easy-fold stroller for sightseeing across Malta & Gozo.",
    icon: "🍼",
    clauseReference: "Clause 1",
  },
  {
    id: "booster",
    name: "Child Booster / Safety Seat",
    pricePerDay: 5,
    description: "EU-approved safety booster seat suitable for infants and toddlers.",
    icon: "💺",
    clauseReference: "Clause 1",
  },
  {
    id: "playpen",
    name: "Baby Playpen / Travel Cot",
    pricePerDay: 5,
    description: "Portable foldable playpen / sleeping cot for holiday villa & hotel stays.",
    icon: "🛏️",
    clauseReference: "Clause 1",
  },
  {
    id: "extra_driver",
    name: "Additional Authorized Driver",
    pricePerDay: 5,
    description: "Authorized secondary driver covered under Pit Stop fully comprehensive policy.",
    icon: "👤",
    clauseReference: "Clause 20(a)",
  },
  {
    id: "excess_waiver",
    name: "Collision Excess Reduction Waiver",
    pricePerDay: 15,
    description: "Waives the standard €700 insurance excess liability (Clause 4) to €0.",
    icon: "🛡️",
    clauseReference: "Clause 4",
  },
]

export function checkoutCharges(params: {
  rentalPrice: number
  discountPercent: number
  vatPercent: number
  deliveryType: string
  returnType: string
  services: readonly string[]
  days: number
}) {
  const deliveryFee = params.deliveryType === "custom" ? 20 : 0
  const returnFee = params.returnType === "custom" ? 20 : 0
  const optionalServices = AVAILABLE_OPTIONAL_SERVICES.filter((service) =>
    params.services.includes(service.id),
  )
  const optionalServicesCost = optionalServices.reduce(
    (total, service) => total + service.pricePerDay,
    0,
  ) * Math.max(1, params.days)
  const discountedRentalTotal = params.rentalPrice * (1 - params.discountPercent / 100)
  const subtotalBeforeVat = discountedRentalTotal + deliveryFee + returnFee + optionalServicesCost
  const taxesAndFees = Number((subtotalBeforeVat * params.vatPercent / 100).toFixed(2))

  return {
    deliveryFee,
    returnFee,
    optionalServices: optionalServices.map((service) => service.id),
    optionalServicesCost,
    discountedRentalTotal,
    subtotalBeforeVat,
    taxesAndFees,
    totalAmount: Number((subtotalBeforeVat + taxesAndFees).toFixed(2)),
  }
}
