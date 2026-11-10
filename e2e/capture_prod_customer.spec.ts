import { test } from "@playwright/test"

test.use({ channel: "msedge" })

test("capture live production customer screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  console.log("Navigating to production customer home...")
  await page.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })
  await page.waitForTimeout(2000)

  // Skip intro if visible
  const skipBtn = page.locator("button:has-text('Skip Intro')")
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click()
    await page.waitForTimeout(1000)
  }

  // 1. Home Page Hero & Booking Bar
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_customer_home.png",
    fullPage: false,
  })
  console.log("Captured prod_customer_home.png")

  // Scroll to Categories & Popular Fleet
  await page.evaluate(() => window.scrollBy(0, 750))
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_customer_categories_fleet.png",
    fullPage: false,
  })
  console.log("Captured prod_customer_categories_fleet.png")

  // 2. Listing View
  const searchFleetBtn = page.locator("button:has-text('Search Fleet')").first()
  if (await searchFleetBtn.isVisible()) {
    await searchFleetBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_customer_listing.png",
      fullPage: false,
    })
    console.log("Captured prod_customer_listing.png")
  }

  // 3. Car Detail View
  const detailsBtn = page.locator("button:has-text('Details')").first()
  if (await detailsBtn.isVisible()) {
    await detailsBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_customer_cardetail.png",
      fullPage: false,
    })
    console.log("Captured prod_customer_cardetail.png")
  }
})
