import type { Car } from "../types"

export interface PricingCalculationResult {
  tier: "hourly" | "daily" | "monthly"
  basePrice: number
  rateApplied: number
  rateLabel: string
  durationText: string
  savingsText?: string
}

export function getDefaultMonthlyPrice(pricePerDay: number): number {
  return Math.round(pricePerDay * 22)
}

export function calculateRentalPrice(params: {
  car: Pick<Car, "pricePerHour" | "pricePerDay" | "pricePerMonth">
  isSameDay: boolean
  sameDayHours?: number
  days: number
}): PricingCalculationResult {
  const { car, isSameDay, sameDayHours = 8, days } = params

  const effectiveHourlyRate = car.pricePerHour || Math.max(5, Math.round(car.pricePerDay / 7))
  const effectiveDailyRate = car.pricePerDay || 50
  const effectiveMonthlyRate = car.pricePerMonth || getDefaultMonthlyPrice(effectiveDailyRate)

  if (isSameDay) {
    const hours = Math.max(3, sameDayHours)
    const basePrice = Math.round(hours * effectiveHourlyRate)
    return {
      tier: "hourly",
      basePrice,
      rateApplied: effectiveHourlyRate,
      rateLabel: `$${effectiveHourlyRate}/hr`,
      durationText: `${hours} Hours (Same-Day)`,
    }
  }

  if (days >= 30) {
    const months = Math.floor(days / 30)
    const remainderDays = days % 30
    const basePrice = Math.round(months * effectiveMonthlyRate + remainderDays * effectiveDailyRate)
    const standardDailyCost = days * effectiveDailyRate
    const savings = standardDailyCost - basePrice

    return {
      tier: "monthly",
      basePrice,
      rateApplied: effectiveMonthlyRate,
      rateLabel: `$${effectiveMonthlyRate}/mo`,
      durationText: `${days} Days (${months} Mo${remainderDays > 0 ? ` + ${remainderDays}d` : ""})`,
      savingsText: savings > 0 ? `Save $${savings.toLocaleString()} vs daily` : undefined,
    }
  }

  const basePrice = Math.round(Math.max(1, days) * effectiveDailyRate)
  return {
    tier: "daily",
    basePrice,
    rateApplied: effectiveDailyRate,
    rateLabel: `$${effectiveDailyRate}/day`,
    durationText: `${days} ${days === 1 ? "Day" : "Days"}`,
  }
}
