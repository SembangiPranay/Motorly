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
