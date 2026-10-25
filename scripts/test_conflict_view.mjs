import { chromium } from "playwright"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // 1. Navigate to home first to set localStorage
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.evaluate(() => {
    localStorage.setItem("motorly_current_view", "checkout")
    localStorage.setItem("motorly_selected_car_id", "honda-crv")
    localStorage.setItem(
      "motorly_booking_state",
      JSON.stringify({
        pickupDate: "Oct 10, 2026",
        pickupTime: "10:00 AM",
        returnDate: "Oct 20, 2026",
        returnTime: "10:00 AM",
        pickupLocation: "4200 NW 21st St, Miami, FL 33142",
        returnLocation: "4200 NW 21st St, Miami, FL 33142",
        rentalDurationDays: 10,
        protectionPlan: false,
      }),
    )
  })

  // 2. Reload page to trigger checkout view with conflict
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)

  // Take screenshot of checkout view (full page and right panel)
  await page.screenshot({
    path: "screenshots/20_checkout_conflict_full.png",
    fullPage: true,
  })
  console.log("Saved screenshots/20_checkout_conflict_full.png")

  // Scroll to summary on right
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(500)
  await page.screenshot({ path: "screenshots/22_checkout_conflict_detail.png" })
  console.log("Saved screenshots/22_checkout_conflict_detail.png")

  // Also check mobile viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.scrollTo(0, 2400))
  await page.waitForTimeout(600)
  await page.screenshot({ path: "screenshots/21_mobile_checkout_conflict.png" })
  console.log("Saved screenshots/21_mobile_checkout_conflict.png")

  await browser.close()
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
