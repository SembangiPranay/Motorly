import { test, expect } from "@playwright/test"
import path from "node:path"
import fs from "node:fs"
import pg from "pg"

const SCREENSHOTS_DIR = path.resolve("./screenshots")

test.describe("DriveRent Visual Screenshot Capture Suite (Requirement R1)", () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    }

    try {
      const pool = new pg.Pool({
        host: "aws-0-us-east-1.pooler.supabase.com",
        port: 6543,
        user: "postgres.mrbymhhcjvebpxcfmnhy",
        password: "Koushik.git1",
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      })
      await pool.query("DELETE FROM bookings WHERE pickup_date = 'Dec 15, 2026' AND return_date = 'Dec 18, 2026'")
      await pool.end()
    } catch (err) {
      console.warn("Notice: Stale slot cleanup skipped:", err)
    }
  })

  test("Capture All 23 Requirement R1 Visual Evidence Artifacts", async ({
    page,
  }) => {
    test.setTimeout(240000)
    await page.setViewportSize({ width: 1440, height: 900 })
    const APP_URL = process.env.APP_URL || "http://localhost:3000"

    // Step 0: Authenticate Customer and Admin against live Express API
    console.log("--> Authenticating test accounts against live API...")
    const custRes = await fetch("http://localhost:3001/api/auth/customer-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "john.doe@email.com", password: "pass123" }),
    })
    const { token: customerToken, user: customerUser } = await custRes.json()

    const admRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "0709" }),
    })
    const { token: adminToken } = await admRes.json()

    console.log(`   Customer authenticated: ${customerUser.email}`)
    console.log(`   Admin token obtained.`)

    // Seed continuous authenticated tokens for both sessions
    await page.addInitScript(
      ({ cToken, cUser, aToken }) => {
        localStorage.setItem("motorly_customer_token", cToken)
        localStorage.setItem("motorly_customer_user", JSON.stringify(cUser))
        localStorage.setItem("motorly_admin_token", aToken)
      },
      { cToken: customerToken, cUser: customerUser, aToken: adminToken },
    )

    // Helper to switch views seamlessly
    async function switchView(targetName: string, expectedSelector?: string) {
      console.log(`   Navigating to view: ${targetName}...`)
      const portalDrawer = page.locator('aside[aria-label="Screen Flow Preview"]')
      if (!(await portalDrawer.isVisible({ timeout: 500 }).catch(() => false))) {
        const switcherBtn = page.locator('button:has-text("Portal Switcher")')
        if (await switcherBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await switcherBtn.click()
          await page.waitForTimeout(300)
        }
      }

      const targetBtn = page.locator(`aside[aria-label="Screen Flow Preview"] button:has-text("${targetName}")`).first()
      if (await targetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await targetBtn.click()
        await page.waitForTimeout(800)
      } else {
        const viewMap: Record<string, string> = {
          Home: "home",
          Fleet: "listing",
          Details: "detail",
          Checkout: "checkout",
          "My Trips": "my-bookings",
          Admin: "admin",
          "Admin Panel": "admin",
        }
        const key = viewMap[targetName] || targetName.toLowerCase()
        await page.evaluate((v) => {
          localStorage.setItem("motorly_current_view", v)
        }, key)
        await page.goto(APP_URL)
        await page.waitForTimeout(1000)
      }

      if (expectedSelector) {
        try {
          await page.locator(expectedSelector).first().waitFor({ timeout: 8000 })
        } catch {
          console.warn(`   [switchView] Notice: ${expectedSelector} not immediately detected, proceeding...`)
        }
        await page.waitForTimeout(600)
      }
    }

    // Initial page load
    await page.goto(APP_URL)
    await page.waitForTimeout(1000)

    /* =========================================================================
       FLOW 1: FLEET CATALOG (01 to 05)
       ========================================================================= */
    console.log("--> Starting Flow 1: Fleet Catalog...")
    await switchView("Fleet", 'input[placeholder*="Search"]')

    // 01: Fleet Catalog Browse (Grid View)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01_fleet_catalog_browse.png"),
      fullPage: true,
    })
    console.log("   Captured 01_fleet_catalog_browse.png")

    // 02: Category Filters (Select SUVs pill)
    const suvPill = page.locator('button:has-text("SUVs")').first()
    await expect(suvPill).toBeVisible({ timeout: 5000 })
    await suvPill.click()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02_fleet_catalog_category_filters.png"),
      fullPage: true,
    })
    console.log("   Captured 02_fleet_catalog_category_filters.png")

    // Reset category filter back to all
    const allVehiclesPill = page.locator('button:has-text("All Vehicles")').first()
    await allVehiclesPill.click()
    await page.waitForTimeout(400)

    // 03: Price Range Slider (filter down to 60 to visibly prove real catalog filtering)
    const priceSlider = page.locator('input[type="range"]').first()
    await expect(priceSlider).toBeVisible({ timeout: 5000 })
    await priceSlider.fill("60")
    await priceSlider.dispatchEvent("input")
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03_fleet_catalog_price_slider.png"),
      fullPage: true,
    })
    console.log("   Captured 03_fleet_catalog_price_slider.png")

    // Reset price slider
    await priceSlider.fill("500")
    await priceSlider.dispatchEvent("input")
    await page.waitForTimeout(400)

    // 04: Search Results
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    await searchInput.fill("BMW")
    await searchInput.dispatchEvent("input")
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04_fleet_catalog_search_results.png"),
      fullPage: true,
    })
    console.log("   Captured 04_fleet_catalog_search_results.png")

    // Clear search
    await searchInput.fill("")
    await searchInput.dispatchEvent("input")
    await page.waitForTimeout(400)

    // 05: List View Mode Toggle
    const listModeBtn = page.locator('button[title="List View"]').first()
    await expect(listModeBtn).toBeVisible({ timeout: 5000 })
    await listModeBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05_fleet_catalog_list_mode.png"),
      fullPage: true,
    })
    console.log("   Captured 05_fleet_catalog_list_mode.png")

    // Reset back to grid mode
    const gridModeBtn = page.locator('button[title="Grid View"]').first()
    await gridModeBtn.click()
    await page.waitForTimeout(400)

    /* =========================================================================
       FLOW 2: VEHICLE DETAILS & TABS (06 to 08)
       ========================================================================= */
    console.log("--> Starting Flow 2: Vehicle Details & Tabs...")
    await switchView("Details", 'button:has-text("Rental Rates")')

    // 06: Vehicle Details Specs Overview
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06_vehicle_details_specs_overview.png"),
      fullPage: true,
    })
    console.log("   Captured 06_vehicle_details_specs_overview.png")

    // 07: Garage & Map Location Tab
    const garageTab = page.locator('button:has-text("Garage"), button:has-text("Map Location")').first()
    await garageTab.click()
    await page.waitForTimeout(1000)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07_vehicle_details_garage_map.png"),
      fullPage: true,
    })
    console.log("   Captured 07_vehicle_details_garage_map.png")

    // 08: Rental Rates Tab
    const ratesTab = page.locator('button:has-text("Rental Rates")').first()
    await ratesTab.click()
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08_vehicle_details_rental_rates.png"),
      fullPage: true,
    })
    console.log("   Captured 08_vehicle_details_rental_rates.png")

    /* =========================================================================
       FLOW 3: CUSTOMER RESERVATION & CHECKOUT FLOW (09 to 12)
       ========================================================================= */
    console.log("--> Starting Flow 3: Customer Reservation & Checkout...")
    const proceedBtn = page.locator('button:has-text("Proceed to Instant Checkout")').first()
    if (await proceedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await proceedBtn.click()
      await page.waitForTimeout(1000)
    } else {
      await switchView("Checkout", 'text=Complete Your Reservation')
    }

    // 09: Driver Details & License Upload Preview
    const autofillBtn = page.locator('button:has-text("Autofill"), button:has-text("Express Demo Autofill")').first()
    await expect(autofillBtn).toBeVisible({ timeout: 5000 })
    await autofillBtn.click()
    await page.waitForTimeout(800)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09_checkout_driver_license_upload.png"),
      fullPage: true,
    })
    console.log("   Captured 09_checkout_driver_license_upload.png")

    // 10: Promo Code Applied (DRIVE15)
    const promoInput = page.locator('input[placeholder*="promo" i], input[placeholder*="DRIVE15" i], input[placeholder*="coupon" i]').first()
    await expect(promoInput).toBeVisible({ timeout: 5000 })
    await promoInput.fill("DRIVE15")
    const applyBtn = page.locator('button:has-text("Apply")').first()
    await applyBtn.click()
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10_checkout_promo_code_applied.png"),
      fullPage: true,
    })
    console.log("   Captured 10_checkout_promo_code_applied.png")

    // 11: Date Scheduling Calendar Modal
    const editDatesBtn = page.locator('button[data-testid="edit-dates-btn"]').first()
    if (await editDatesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editDatesBtn.scrollIntoViewIfNeeded()
      await editDatesBtn.click()
    } else {
      await page.evaluate(() => {
        if ((window as any).__setIsScheduleModalOpen) {
          (window as any).__setIsScheduleModalOpen(true)
        }
      })
    }

    const dateModal = page.locator('h3:has-text("Select Trip Dates & Hours")').first()
    await expect(dateModal).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "11_checkout_date_scheduling_modal.png"),
    })
    console.log("   Captured 11_checkout_date_scheduling_modal.png")

    // In modal, advance calendar to December 2026 to ensure zero booking conflict
    const nextMonthBtn = page.locator('button:has-text("Next →")').first()
    await nextMonthBtn.click()
    await page.waitForTimeout(200)
    await nextMonthBtn.click()
    await page.waitForTimeout(300)

    // Select conflict-free dates: Dec 15 to Dec 18, 2026
    const day15Btn = page.locator('div.grid-cols-7 button:has-text("15")').first()
    await day15Btn.click()
    await page.waitForTimeout(200)
    const day18Btn = page.locator('div.grid-cols-7 button:has-text("18")').first()
    await day18Btn.click()
    await page.waitForTimeout(300)

    // Apply Dates & Order and verify modal detaches cleanly
    const applyDateModalBtn = page.locator('button:has-text("Apply Dates & Order")').first()
    await applyDateModalBtn.click()
    await dateModal.waitFor({ state: "detached" })
    await page.waitForTimeout(1200)

    // 12: Booking Confirmation Modal (Boarding Pass & QR Code)
    const confirmPayBtn = page.locator('#confirm-booking-btn')
    await expect(confirmPayBtn).toBeEnabled({ timeout: 10000 })
    await confirmPayBtn.scrollIntoViewIfNeeded()
    await confirmPayBtn.click()

    const confirmModal = page.locator('text=Booking Confirmed').first()
    await expect(confirmModal).toBeVisible({ timeout: 12000 })
    await page.waitForTimeout(1000)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "12_booking_confirmation_modal.png"),
    })
    console.log("   Captured 12_booking_confirmation_modal.png")

    // Dismiss Confirmation Modal cleanly
    const closeConfirmBtn = page.locator('button[data-testid="close-confirmation-modal"], button:has-text("✕")').first()
    await closeConfirmBtn.click()
    await confirmModal.waitFor({ state: "detached" })
    await page.waitForTimeout(600)

    /* =========================================================================
       FLOW 4: CUSTOMER DASHBOARD, PROFILE, VOUCHER QR & GREEN SIGNAL (13 to 15)
       ========================================================================= */
    console.log("--> Starting Flow 4: Customer Dashboard & Profile...")

    // Fetch the newly confirmed booking ID for John Doe and approve it as Admin to generate Green Signal
    let activeBookingId = ""
    try {
      const myBookingsRes = await fetch("http://localhost:3001/api/users/bookings", {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
      const myBookings = await myBookingsRes.json()
      if (Array.isArray(myBookings) && myBookings.length > 0) {
        activeBookingId = myBookings[0].id
      }
    } catch {}

    if (!activeBookingId) {
      const allBRes = await fetch("http://localhost:3001/api/bookings", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const allB = await allBRes.json()
      const arr = Array.isArray(allB) ? allB : (allB.bookings || [])
      activeBookingId = arr[0]?.id
    }

    if (activeBookingId) {
      console.log(`   Approving newly created booking ${activeBookingId} via Admin API to generate Green Signal...`)
      await fetch(`http://localhost:3001/api/bookings/${activeBookingId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }

    await switchView("My Trips", 'h1:has-text("John Doe")')

    // 13: Customer Profile & Active Trips Dashboard
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "13_customer_profile_dashboard.png"),
      fullPage: true,
    })
    console.log("   Captured 13_customer_profile_dashboard.png")

    // 14: Digital Boarding Pass Voucher with QR Code Modal
    const voucherBtn = page.locator('button:has-text("Digital Boarding Voucher"), button:has-text("Boarding Voucher")').first()
    await expect(voucherBtn).toBeVisible({ timeout: 8000 })
    await voucherBtn.click()

    const voucherModal = page.locator('text=MOTORLY EXPRESS BOARDING PASS').first()
    await expect(voucherModal).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "14_customer_booking_boarding_pass_qr.png"),
    })
    console.log("   Captured 14_customer_booking_boarding_pass_qr.png")

    // Close voucher modal cleanly and ensure detached so background card is unobstructed
    const closeVoucherBtn = page.locator('button[data-testid="close-voucher-modal"]').first()
    if (await closeVoucherBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeVoucherBtn.click()
    } else {
      await page.evaluate(() => {
        if ((window as any).__setSelectedVoucher) (window as any).__setSelectedVoucher(null)
      })
    }
    await voucherModal.waitFor({ state: "detached" })
    await page.waitForTimeout(600)

    // 15: Green Signal Garage Bay Clearance Card with GarageMapViewer
    const greenSignalCard = page.locator('div:has-text("GREEN SIGNAL: APPROVED BY GARAGE MANAGER!")').first()
    await expect(greenSignalCard).toBeVisible({ timeout: 8000 })
    await greenSignalCard.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "15_customer_booking_green_signal_bay.png"),
    })
    console.log("   Captured 15_customer_booking_green_signal_bay.png")

    /* =========================================================================
       FLOW 5: FLEET ADMIN COMMAND CENTER, INVENTORY & EDIT MODAL (16 to 18)
       ========================================================================= */
    console.log("--> Starting Flow 5: Fleet Admin Command Center...")
    await switchView("Admin Panel", 'text="Total Fleet"')

    // 16: Admin KPI Stats Bar & Reservation Manifest
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "16_admin_kpi_manifest_overview.png"),
      fullPage: true,
    })
    console.log("   Captured 16_admin_kpi_manifest_overview.png")

    // 17: Fleet Management & Telemetry Table
    const fleetTab = page.locator('button:has-text("Fleet Vehicles"), button:has-text("Fleet")').first()
    await fleetTab.click()
    await page.locator('th:has-text("Vehicle / Specs"), div:has-text("All Fleet")').first().waitFor({ timeout: 10000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "17_admin_fleet_management_table.png"),
      fullPage: true,
    })
    console.log("   Captured 17_admin_fleet_management_table.png")

    // 18: Vehicle Add/Edit Modal (isCarModalOpen)
    const registerCarBtn = page.locator('button:has-text("+ Register Vehicle"), button:has-text("Register Vehicle")').first()
    await expect(registerCarBtn).toBeVisible({ timeout: 5000 })
    await registerCarBtn.click()

    const carModal = page.locator('text=Add New Vehicle').first()
    await expect(carModal).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "18_admin_vehicle_edit_modal.png"),
    })
    console.log("   Captured 18_admin_vehicle_edit_modal.png")

    // Dismiss Modal cleanly using our data-testid close button and React state helper
    const closeCarModalBtn = page.locator('button[data-testid="close-car-modal"]').first()
    if (await closeCarModalBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeCarModalBtn.click()
    } else {
      await page.evaluate(() => {
        if ((window as any).__setAdminCarModalOpen) (window as any).__setAdminCarModalOpen(false)
      })
    }
    await carModal.waitFor({ state: "detached" })
    await page.waitForTimeout(600)

    /* =========================================================================
       FLOW 6: ADMIN KEY HANDOVER & PRE-TRIP CHECKLIST MODAL (19)
       ========================================================================= */
    console.log("--> Starting Flow 6: Admin Digital Key Handover...")

    // Switch to Active Bookings tab
    const bookingsTab = page.locator('button:has-text("Active Bookings"), button:has-text("Manifest")').first()
    await bookingsTab.click()
    await page.evaluate(() => (window as any).__refreshAdminData && (window as any).__refreshAdminData())
    await page.waitForTimeout(1000)

    // Locate the Assigned booking row and click Keys Given / Handover Keys in the desktop table
    const keysBtn = page.locator('table tr button[title*="Handoff keys"], table tr button:has-text("Keys")').first()
    await expect(keysBtn).toBeVisible({ timeout: 8000 })
    await keysBtn.scrollIntoViewIfNeeded()
    await keysBtn.click()

    const keyModal = page.locator('text=FLOW E: KEY HANDOVER PROTOCOL').first()
    await expect(keyModal).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "19_admin_key_handover_modal.png"),
    })
    console.log("   Captured 19_admin_key_handover_modal.png")

    // Certify Key Handover and start live rental clock
    const certifyBtn = page.locator('button:has-text("Keys Given & Start Clock")').first()
    await expect(certifyBtn).toBeVisible({ timeout: 3000 })
    await certifyBtn.click()
    await keyModal.waitFor({ state: "detached" })
    await page.waitForTimeout(1500)

    /* =========================================================================
       FLOW 7: MID-TRIP EXTENSION NEGOTIATION & CUSTOMER APPROVAL (20 to 21)
       ========================================================================= */
    console.log("--> Starting Flow 7: Extension Negotiation...")

    // Customer requests extension via API on the active Checked Out booking
    console.log(`   Customer requesting 2-day extension on booking ${activeBookingId}...`)
    await fetch(`http://localhost:3001/api/bookings/${activeBookingId}/request-extension`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extraDuration: 2,
        unit: "days",
        customerNotes: "Business conference extended. Requesting 2 additional days with full insurance.",
      }),
    })

    // Re-sync admin manifest
    await page.evaluate(async () => {
      if ((window as any).__refreshAdminData) {
        await (window as any).__refreshAdminData()
      }
    })
    await page.waitForTimeout(1000)

    // Click Quote Ext button on the booking row in the desktop table
    const quoteExtBtn = page.locator('button[data-testid="quote-extension-btn"], table tr button:has-text("🔔 Quote Ext"), table tr button[title*="click to quote"]').first()
    if (await quoteExtBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await quoteExtBtn.scrollIntoViewIfNeeded()
      await quoteExtBtn.click()
    } else {
      await page.evaluate((bId) => {
        if ((window as any).__handleOpenExtensionQuote) {
          (window as any).__handleOpenExtensionQuote(bId)
        }
      }, activeBookingId)
    }

    const quoteModal = page.locator('text=FLOW F: EXTENSION PRICING CONSOLE').first()
    await expect(quoteModal).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "20_admin_extension_quote_modal.png"),
    })
    console.log("   Captured 20_admin_extension_quote_modal.png")

    // Dispatch Official Quotation to customer
    const sendQuoteBtn = page.locator('button:has-text("Send Quotation to Customer")').first()
    await expect(sendQuoteBtn).toBeVisible({ timeout: 4000 })
    await sendQuoteBtn.click()
    await quoteModal.waitFor({ state: "detached" })
    await page.waitForTimeout(1500)

    // Customer views Extension Quotation Review & Approval Card in My Trips
    await switchView("My Trips", 'h1:has-text("John Doe")')
    const quoteCard = page.locator('text=Extension Quotation Received from Garage Manager!').first()
    await expect(quoteCard).toBeVisible({ timeout: 10000 })
    await quoteCard.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "21_customer_extension_approval_card.png"),
      fullPage: true,
    })
    console.log("   Captured 21_customer_extension_approval_card.png")

    /* =========================================================================
       FLOW 8: VEHICLE RETURN INTAKE INSPECTION & FINALIZATION (22 to 23)
       ========================================================================= */
    console.log("--> Starting Flow 8: Return Vehicle Inspection...")

    await switchView("Admin Panel", 'text="Total Fleet"')
    await page.evaluate(async () => {
      if ((window as any).__refreshAdminData) {
        await (window as any).__refreshAdminData()
      }
    })
    await page.waitForTimeout(1000)

    // Click Return Check on the Checked Out booking in the desktop table
    const returnCheckBtn = page.locator('button[data-testid="return-audit-btn"], table tr button:has-text("Return Audit"), table tr button[title*="return vehicle audit"]').first()
    if (await returnCheckBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await returnCheckBtn.scrollIntoViewIfNeeded()
      await returnCheckBtn.click()
    } else {
      await page.evaluate((bId) => {
        if ((window as any).__handleOpenReturnInspection) {
          (window as any).__handleOpenReturnInspection(bId)
        }
      }, activeBookingId)
    }

    const returnModal = page.locator('text=FLOW G: POST-TRIP AUDIT').first()
    await expect(returnModal).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "22_admin_return_inspection_modal.png"),
    })
    console.log("   Captured 22_admin_return_inspection_modal.png")

    // Certify Return Inspection and complete the ride
    const certifyReturnBtn = page.locator('button:has-text("Complete Ride & Release Fleet")').first()
    await expect(certifyReturnBtn).toBeVisible({ timeout: 4000 })
    await certifyReturnBtn.click()
    await returnModal.waitFor({ state: "detached" })
    await page.evaluate(async () => {
      if ((window as any).__refreshAdminData) {
        await (window as any).__refreshAdminData()
      }
    })
    await page.waitForTimeout(1500)

    // 23: Admin Manifest with Completed Booking Status & Released Vehicle
    const completedBookingRow = page.locator('table tr:has-text("Completed")').first()
    await expect(completedBookingRow).toBeVisible({ timeout: 8000 })
    await completedBookingRow.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "23_admin_completed_booking_status.png"),
      fullPage: true,
    })
    console.log("   Captured 23_admin_completed_booking_status.png")

    console.log("\n==> All 23 Visual Evidence Screenshots Successfully Captured!")
  })
})
