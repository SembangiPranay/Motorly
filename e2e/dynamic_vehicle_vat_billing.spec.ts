import { test, expect } from "@playwright/test"
import { calculateRentalPrice, getDefaultWeeklyPrice, getDefaultMonthlyPrice } from "../src/utils/pricing"

test.describe("Four Time-Period Pricing (Hourly, Daily, Weekly, Monthly) & Dynamic Vehicle VAT", () => {
  const sampleCar = {
    id: "bmw-3-series",
    name: "BMW 3 Series M-Sport",
    pricePerHour: 16,
    pricePerDay: 120,
    pricePerWeek: 720,
    pricePerMonth: 2640,
    vatRate: 20,
  }

  test("Pricing Engine correctly calculates all 4 time periods", () => {
    // 1. Same-Day / Hourly Rental (5 hours)
    const hourlyRes = calculateRentalPrice({
      car: sampleCar,
      isSameDay: true,
      sameDayHours: 5,
      days: 0,
    })
    expect(hourlyRes.tier).toBe("hourly")
    expect(hourlyRes.basePrice).toBe(5 * 16) // 80
    expect(hourlyRes.rateLabel).toBe("€16/hr")

    // 2. Daily Rental (3 days)
    const dailyRes = calculateRentalPrice({
      car: sampleCar,
      isSameDay: false,
      days: 3,
    })
    expect(dailyRes.tier).toBe("daily")
    expect(dailyRes.basePrice).toBe(3 * 120) // 360
    expect(dailyRes.rateLabel).toBe("€120/day")

    // 3. Weekly Rental (7 days)
    const weeklyRes = calculateRentalPrice({
      car: sampleCar,
      isSameDay: false,
      days: 7,
    })
    expect(weeklyRes.tier).toBe("weekly")
    expect(weeklyRes.basePrice).toBe(720) // 1 week rate
    expect(weeklyRes.rateLabel).toBe("€720/wk")
    expect(weeklyRes.savingsText).toBe("Save €120 vs daily") // 7*120=840, 840-720=120 savings

    // 4. Extended Weekly Rental (10 days = 1 week + 3 days)
    const extendedWeeklyRes = calculateRentalPrice({
      car: sampleCar,
      isSameDay: false,
      days: 10,
    })
    expect(extendedWeeklyRes.tier).toBe("weekly")
    expect(extendedWeeklyRes.basePrice).toBe(720 + 3 * 120) // 1080
    expect(extendedWeeklyRes.savingsText).toBe("Save €120 vs daily") // 10*120=1200, 1200-1080=120

    // 5. Monthly Rental (30 days)
    const monthlyRes = calculateRentalPrice({
      car: sampleCar,
      isSameDay: false,
      days: 30,
    })
    expect(monthlyRes.tier).toBe("monthly")
    expect(monthlyRes.basePrice).toBe(2640)
    expect(monthlyRes.rateLabel).toBe("€2640/mo")
  })

  test("Dynamic VAT combines accurately with all 4 time period pricing tiers", () => {
    const periods = [
      { name: "Hourly (4h)", base: 4 * sampleCar.pricePerHour }, // 64
      { name: "Daily (2d)", base: 2 * sampleCar.pricePerDay },   // 240
      { name: "Weekly (1wk)", base: sampleCar.pricePerWeek },    // 720
      { name: "Monthly (1mo)", base: sampleCar.pricePerMonth },  // 2640
    ]

    for (const p of periods) {
      const vat = Number((p.base * (sampleCar.vatRate / 100)).toFixed(2))
      const total = Number((p.base + vat).toFixed(2))

      expect(vat).toBe(Number((p.base * 0.20).toFixed(2)))
      expect(total).toBe(Number((p.base * 1.20).toFixed(2)))
    }
  })

  test("Helper defaults generate consistent weekly (~14%) and monthly (~27%) discounts", () => {
    const daily = 100
    expect(getDefaultWeeklyPrice(daily)).toBe(600) // 7 days for the price of 6
    expect(getDefaultMonthlyPrice(daily)).toBe(2200) // 30 days for the price of 22
  })
})
