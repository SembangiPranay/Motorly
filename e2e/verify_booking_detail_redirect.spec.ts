import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

test("verify clicking Details button redirects to the dedicated full booking page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // Pre-seed admin token in localStorage so we bypass the login gate directly into Admin Orders view
  await page.addInitScript(() => {
    localStorage.setItem("motorly_admin_token", "test-admin-token-e2e")
    localStorage.setItem("motorly_current_view", "admin")
    localStorage.setItem("motorly_admin_active_tab", "manifest")
    sessionStorage.setItem("motorly_intro_completed", "true")
  })

  console.log("Navigating to Admin Orders & Dispatch...")
  await page.goto("http://localhost:3000/?view=admin&tab=manifest", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  // If AdminLoginGate is present, enter passcode 0709
  const passInput = page.locator("input[placeholder*='passcode']").first()
  if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("Entering admin passcode 0709...")
    await passInput.fill("0709")
    const unlockBtn = page.locator("button:has-text('Authorize & Unlock Console')").first()
    await unlockBtn.click()
    await page.waitForTimeout(1500)
  }

  // Verify Admin Table is visible
  const tableHeader = page.locator("text=Orders & Dispatch").first()
  await expect(tableHeader).toBeVisible({ timeout: 10000 })

  // Find the first Details button in the Dispatch Actions column
  const detailsButtons = page.locator("button:has-text('Details')")
  const detailsBtnCount = await detailsButtons.count()
  console.log(`Found ${detailsBtnCount} Details buttons in table.`)
  expect(detailsBtnCount).toBeGreaterThan(0)

  // Capture table view before clicking Details
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/admin_orders_before_details.png",
    fullPage: false,
  })
  console.log("Captured admin_orders_before_details.png")

  // Click the Details button on MTR-525780 (which has allocated vehicle bmw-3-series)
  const bmwRow = page.locator("tr:has-text('MTR-525780')")
  const targetDetailsBtn = (await bmwRow.isVisible().catch(() => false))
    ? bmwRow.locator("button:has-text('Details')").first()
    : detailsButtons.first()

  await targetDetailsBtn.click()
  await page.waitForTimeout(1000)

  // 1. Verify URL has bookingId query parameter
  const currentUrl = page.url()
  console.log("Current URL after clicking Details:", currentUrl)
  expect(currentUrl).toContain("bookingId=")

  // 2. Verify Booking Detail Page header & back button
  const backBtn = page.locator("button:has-text('Back to Orders & Dispatch')").first()
  await expect(backBtn).toBeVisible({ timeout: 5000 })

  // 3. Verify Key Dossier Sections
  const clientDossier = page.locator("text=Client & Verified Driver Dossier").first()
  await expect(clientDossier).toBeVisible()

  const vehicleSection = page.locator("text=Allocated Vehicle & Garage Bay Logistics").first()
  await expect(vehicleSection).toBeVisible()

  const pricingSection = page.locator("text=Pricing & VAT Architecture").first()
  await expect(pricingSection).toBeVisible()

  // 4. Verify Country and Driver's License information
  const licenseSpecs = page.locator("text=Driver's License Specifications").first()
  await expect(licenseSpecs).toBeVisible()

  const countryField = page.locator("text=Country").first()
  await expect(countryField).toBeVisible()

  // Capture top view of booking detail page
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/admin_booking_detail_page.png",
    fullPage: false,
  })
  console.log("Captured admin_booking_detail_page.png")

  // Scroll the scrollable main container to capture vehicle, garage bay and station notes
  await page.evaluate(() => {
    const el = document.querySelector(".flex-1.h-screen.overflow-y-auto")
    if (el) el.scrollBy(0, 800)
  })
  await page.waitForTimeout(800)
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/admin_booking_detail_lower.png",
    fullPage: false,
  })
  console.log("Captured admin_booking_detail_lower.png")

  // 5. Test Back Button: clicking 'Back to Orders & Dispatch' returns to table
  await backBtn.click()
  await page.waitForTimeout(1000)

  // Verify URL no longer contains bookingId
  const urlAfterBack = page.url()
  console.log("URL after clicking Back:", urlAfterBack)
  expect(urlAfterBack).not.toContain("bookingId=")

  // Verify table is visible again
  await expect(detailsButtons.first()).toBeVisible()
  console.log("Successfully returned to Orders & Dispatch table!")
})
