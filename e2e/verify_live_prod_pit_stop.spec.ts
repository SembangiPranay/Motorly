import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

const ARTIFACTS_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"
const PROD_URL = "https://motorly-ten.vercel.app"

test.describe("Live Production Pit Stop Car & Storefront Verification", () => {
  test("1. Live Production Storefront displays Pit Stop Car and Luxury filter", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    console.log("Visiting live production storefront:", PROD_URL)
    await page.goto(`${PROD_URL}/`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Scroll to popular choices
    const fleetSection = page.locator("#featured-fleet")
    await fleetSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)

    // Click "Luxury" category filter pill
    const luxuryBtn = page.locator("#featured-fleet button:has-text('Luxury')")
    await luxuryBtn.click()
    await page.waitForTimeout(800)

    // Verify Pit Stop Special Edition card is visible
    const pitCard = page.locator("h3:has-text('Pit Stop Special Edition')").first()
    await expect(pitCard).toBeVisible()

    // Capture screenshot of live production Luxury fleet with Pit Stop Car
    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_pit_stop_luxury.png` })
    console.log("Captured live_prod_pit_stop_luxury.png")

    // Click "All" filter and verify view all toggle if count > 8
    const allBtn = page.locator("#featured-fleet button:has-text('All')")
    await allBtn.click()
    await page.waitForTimeout(800)

    const viewAllBtn = page.locator("button:has-text('View All')")
    if (await viewAllBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await viewAllBtn.click()
      await page.waitForTimeout(800)
    }

    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_all_fleet_expanded.png` })
    console.log("Captured live_prod_all_fleet_expanded.png")
  })

  test("2. Live Production Vehicle Detail View for Pit Stop Special Edition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${PROD_URL}/?view=detail&car=pit-stop-special-edition-2015`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Verify car name, deposit, and specs
    await expect(page.locator("h1:has-text('Pit Stop Special Edition')")).toBeVisible()
    await expect(page.locator("text=€2,500").first()).toBeVisible()

    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_pit_stop_detail.png` })
    console.log("Captured live_prod_pit_stop_detail.png")
  })

  test("3. Live Production Checkout shows Pit Stop / In Service rental reason option", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${PROD_URL}/?view=checkout&car=pit-stop-special-edition-2015`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Verify "Pit Stop / In Service" rental reason button
    const pitStopOption = page.locator("button:has-text('Pit Stop / In Service')")
    await expect(pitStopOption).toBeVisible()

    // Select the option
    await pitStopOption.click()
    await page.waitForTimeout(600)

    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_checkout_pit_stop_purpose.png` })
    console.log("Captured live_prod_checkout_pit_stop_purpose.png")
  })
})
