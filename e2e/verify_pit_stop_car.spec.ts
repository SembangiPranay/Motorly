import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

const ARTIFACTS_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"
const TEST_URL = "http://localhost:3000"

test.describe("Pit Stop Car & Storefront Fleet Verification", () => {
  test("1. Customer Storefront displays Pit Stop Car and Luxury filter", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${TEST_URL}/`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Scroll to popular choices
    const fleetSection = page.locator("#featured-fleet")
    await fleetSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)

    // Click "Luxury" category filter pill
    const luxuryBtn = page.locator("#featured-fleet button:has-text('Luxury')")
    await luxuryBtn.click()
    await page.waitForTimeout(600)

    // Verify Pit Stop Special Edition card is visible
    const pitCard = page.locator("h3:has-text('Pit Stop Special Edition')")
    await expect(pitCard).toBeVisible()

    // Capture screenshot of Luxury fleet with Pit Stop Car
    await page.screenshot({ path: `${ARTIFACTS_DIR}/customer_pit_stop_fleet.png` })
    console.log("Captured customer_pit_stop_fleet.png")

    // Click "All" filter and verify view all toggle if count > 8
    const allBtn = page.locator("#featured-fleet button:has-text('All')")
    await allBtn.click()
    await page.waitForTimeout(600)

    const viewAllBtn = page.locator("button:has-text('View All')")
    if (await viewAllBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await viewAllBtn.click()
      await page.waitForTimeout(600)
    }

    await page.screenshot({ path: `${ARTIFACTS_DIR}/customer_all_fleet_expanded.png` })
    console.log("Captured customer_all_fleet_expanded.png")
  })

  test("2. Vehicle Detail View for Pit Stop Special Edition shows specs and security deposit", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${TEST_URL}/?view=detail&car=pit-stop-special-edition-2015`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify car name, deposit, and specs
    await expect(page.locator("h1:has-text('Pit Stop Special Edition')")).toBeVisible()
    await expect(page.locator("text=€2,500").first()).toBeVisible()

    await page.screenshot({ path: `${ARTIFACTS_DIR}/pit_stop_car_detail.png` })
    console.log("Captured pit_stop_car_detail.png")
  })

  test("3. Checkout view shows Pit Stop / In Service rental reason option", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${TEST_URL}/?view=checkout&car=pit-stop-special-edition-2015`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify "Pit Stop / In Service" rental reason button
    const pitStopOption = page.locator("button:has-text('Pit Stop / In Service')")
    await expect(pitStopOption).toBeVisible()

    // Select the option
    await pitStopOption.click()
    await page.waitForTimeout(400)

    await page.screenshot({ path: `${ARTIFACTS_DIR}/checkout_pit_stop_purpose.png` })
    console.log("Captured checkout_pit_stop_purpose.png")
  })

  test("4. Admin Fleet displays Pit Stop Special Edition with Pit Stop Bay 01", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
    })

    await page.goto(`${TEST_URL}/?view=admin&tab=fleet`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // If gated by admin password, enter 0709
    const pwdInput = page.locator("input[type='password']")
    if (await pwdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pwdInput.fill("0709")
      await page.locator("button:has-text('Authorize & Unlock Console')").click()
      await page.waitForTimeout(1500)
    }

    // Switch to Fleet tab if needed
    const fleetTab = page.locator("button:has-text('Fleet & Inventory')")
    if (await fleetTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fleetTab.click()
      await page.waitForTimeout(800)
    }

    // Look for Pit Stop in fleet table
    const pitRow = page.locator("text=Pit Stop Special Edition").first()
    await expect(pitRow).toBeVisible()

    await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_fleet_pit_stop.png` })
    console.log("Captured admin_fleet_pit_stop.png")
  })
})
