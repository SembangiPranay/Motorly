import { test, expect } from "@playwright/test"
import path from "node:path"
import fs from "node:fs"

const SCREENSHOT_DIR = path.resolve("./screenshots/human_e2e")
const API_BASE = "http://localhost:3001"

test.describe("Real Human End-to-End Walkthrough & Screenshot Audit Suite", () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }

    // 1. Authenticate as admin and clean up any leftover bookings for john.doe@email.com
    try {
      const adminLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@motorly.com", password: "0709" }),
      })
      const adminData = await adminLoginRes.json()
      if (adminData.token) {
        const bookingsRes = await fetch(`${API_BASE}/api/bookings`, {
          headers: { Authorization: `Bearer ${adminData.token}` },
        })
        const allBookings = await bookingsRes.json()
        if (Array.isArray(allBookings)) {
          for (const b of allBookings) {
            if (b.customer?.email?.toLowerCase().includes("john.doe")) {
              await fetch(`${API_BASE}/api/bookings/${b.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${adminData.token}` },
              }).catch(() => {})
            }
          }
        }
      }
    } catch (e) {
      console.warn("Notice: Test cleanup hook skipped:", e)
    }

    // 2. Ensure customer user exists
    try {
      await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john.doe@email.com",
          password: "pass123",
          name: "John Doe",
          phone: "+15551234567",
          driverLicenseNum: "DL123456",
          driverLicenseState: "FL",
          driverLicenseExpiry: "2029-12-31",
        }),
      })
    } catch {}
  })

  test("Comprehensive E2E Human Journey Across All Views and Capabilities", async ({
    page,
  }) => {
    test.setTimeout(300000) // 5 minutes for complete deep walkthrough

    // Desktop standard 1440x900 viewport
    await page.setViewportSize({ width: 1440, height: 900 })

    // =========================================================================
    // STEP 1: HOMEPAGE DISCOVERY & HERO SECTION
    // =========================================================================
    console.log("--> Step 1: Navigating to Homepage...")
    await page.goto("http://localhost:3000/")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Verify Header Brand & Navigation elements
    await expect(page.locator("text=MOTORLY").first()).toBeVisible()
    await expect(page.locator("nav button:has-text('Home')").first()).toBeVisible()
    await expect(page.locator("nav button:has-text('Fleet & Cars')").first()).toBeVisible()
    await expect(page.locator("nav button:has-text('Compare')").first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01_home_hero_desktop.png"),
      fullPage: false,
    })

    // =========================================================================
    // STEP 2: SEARCH BAR INTERACTION (LOCATION, DATES, SEARCH TRIGGER)
    // =========================================================================
    console.log("--> Step 2: Testing Homepage Search Bar...")
    const searchBtn = page.locator("button:has-text('Search Available Cars')").first()
    await expect(searchBtn).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02_home_search_bar.png"),
      clip: { x: 0, y: 150, width: 1440, height: 500 },
    })

    // Scroll down to explore homepage sections (Featured Fleet, How It Works, FAQs)
    console.log("--> Step 3: Exploring Homepage Content & FAQs...")
    await page.evaluate(() => window.scrollBy(0, 1000))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03_home_featured_fleet.png"),
      fullPage: false,
    })

    // Scroll to FAQs and expand an FAQ item
    await page.evaluate(() => window.scrollBy(0, 1200))
    await page.waitForTimeout(500)
    const faqItem = page.locator("button:has-text('What documents do I need')").or(page.locator("button:has-text('How do I rent')")).first()
    if (await faqItem.isVisible().catch(() => false)) {
      await faqItem.click()
      await page.waitForTimeout(300)
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04_home_faqs_and_footer.png"),
      fullPage: false,
    })

    // =========================================================================
    // STEP 4: FLEET CATALOG (LISTING VIEW) & FILTERING
    // =========================================================================
    console.log("--> Step 4: Navigating to Fleet Catalog (/listing)...")
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator("nav button:has-text('Fleet & Cars')").first().click()
    await page.waitForTimeout(1000)

    // Heading in ListingView: "Find Your Ideal Vehicle"
    await expect(page.locator("text=Find Your Ideal Vehicle").first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05_fleet_catalog_all.png"),
      fullPage: false,
    })

    // Filter by category: click 'SUV'
    console.log("--> Step 5: Applying Filters in Fleet Catalog...")
    const suvFilterBtn = page.locator("button:has-text('SUV')").first()
    if (await suvFilterBtn.isVisible().catch(() => false)) {
      await suvFilterBtn.click()
      await page.waitForTimeout(500)
    }

    // Use search bar in catalog
    const searchInput = page.locator("input[placeholder*='Search']").first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("BMW")
      await page.waitForTimeout(500)
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06_fleet_filtered_results.png"),
      fullPage: false,
    })

    // Clear search
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("")
      await page.waitForTimeout(400)
    }

    // Click 'All' category to restore list
    const allFilterBtn = page.locator("button:has-text('All')").first()
    if (await allFilterBtn.isVisible().catch(() => false)) {
      await allFilterBtn.click()
      await page.waitForTimeout(400)
    }

    // =========================================================================
    // STEP 6: VEHICLE COMPARISON TOOL
    // =========================================================================
    console.log("--> Step 6: Testing Vehicle Compare Matrix...")
    // Click compare button (⇄) on the first 2 cars
    const compareButtons = page.locator("button[title*='comparison'], button[title*='compare']")
    const compareCount = await compareButtons.count()
    if (compareCount >= 2) {
      await compareButtons.nth(0).click()
      await page.waitForTimeout(300)
      await compareButtons.nth(1).click()
      await page.waitForTimeout(300)
    }

    // Navigate to Compare View
    await page.locator("nav button:has-text('Compare')").first().click()
    await page.waitForTimeout(1000)

    await expect(page.locator("text=Side-by-Side Fleet Matcher").or(page.locator("h1:has-text('Side-by-Side')")).first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07_vehicle_comparison_matrix.png"),
      fullPage: false,
    })

    // =========================================================================
    // STEP 7: VEHICLE DETAIL VIEW & TABS & DATE SCHEDULING MODAL
    // =========================================================================
    console.log("--> Step 7: Navigating to Car Detail View...")
    await page.locator("nav button:has-text('Fleet & Cars')").first().click()
    await page.waitForTimeout(800)

    // Click on the first car card Details button
    const detailsBtn = page.locator("button:has-text('Details')").first()
    if (await detailsBtn.isVisible().catch(() => false)) {
      await detailsBtn.click()
    } else {
      await page.locator("h3").first().click()
    }
    await page.waitForTimeout(1000)

    // Verify Car Detail view loaded by checking Overview & Specs tab
    await expect(page.locator("button:has-text('Overview & Specs')").or(page.locator("text=Overview & Specs")).first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08_car_detail_overview.png"),
      fullPage: false,
    })

    // Click 'Garage & Map Location' tab to inspect GarageMapViewer
    console.log("--> Step 8: Checking Garage Map Location Tab...")
    const garageMapTab = page.locator("button:has-text('Garage & Map Location')").first()
    if (await garageMapTab.isVisible().catch(() => false)) {
      await garageMapTab.click()
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "09_car_detail_garage_map.png"),
        fullPage: false,
      })
    }

    // Test Date Scheduling Modal
    console.log("--> Step 9: Opening Date Scheduling Modal from Detail View...")
    const changeDatesBtn = page.locator("button:has-text('Change Dates')").or(page.locator("button:has-text('Adjust Rental Dates')")).first()
    if (await changeDatesBtn.isVisible().catch(() => false)) {
      await changeDatesBtn.click()
      await page.waitForTimeout(600)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "10_date_scheduling_modal.png"),
        fullPage: false,
      })

      // Close date scheduling modal
      const applyOrCloseBtn = page.locator("button:has-text('Apply Dates')").or(page.locator("button:has-text('Close')")).first()
      if (await applyOrCloseBtn.isVisible().catch(() => false)) {
        await applyOrCloseBtn.click()
        await page.waitForTimeout(400)
      }
    }

    // =========================================================================
    // STEP 10: CUSTOMER AUTHENTICATION (SIGN IN & REGISTRATION)
    // =========================================================================
    console.log("--> Step 10: Testing Customer Authentication View (/auth)...")
    await page.locator("nav button:has-text('Sign In')").or(page.locator("button:has-text('Sign In')")).first().click()
    await page.waitForTimeout(800)

    // Check Sign In tab & Registration tab
    await expect(page.locator("input[type='email']").first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11_customer_auth_signin_tab.png"),
      fullPage: false,
    })

    // Switch to Register tab to verify password strength & fields
    const registerTabBtn = page.locator("button:has-text('Create Account')").or(page.locator("button:has-text('Register')")).or(page.locator("button:has-text('Sign Up')")).first()
    if (await registerTabBtn.isVisible().catch(() => false)) {
      await registerTabBtn.click()
      await page.waitForTimeout(400)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "12_customer_auth_register_tab.png"),
        fullPage: false,
      })
    }

    // Switch back to Sign In and authenticate with registered customer
    console.log("--> Step 11: Authenticating with John Doe account...")
    const signinTabBtn = page.locator("button:has-text('Sign In')").or(page.locator("button:has-text('Log In')")).first()
    if (await signinTabBtn.isVisible().catch(() => false)) {
      await signinTabBtn.click()
      await page.waitForTimeout(300)
    }

    const emailInput = page.locator("input[type='email']").first()
    const passInput = page.locator("input[type='password']").first()
    await emailInput.fill("john.doe@email.com")
    await passInput.fill("pass123")

    const authSubmitBtn = page.locator("button[type='submit']").first()
    await authSubmitBtn.click()
    await page.waitForTimeout(1500)

    // Verify session badge appears in Header
    await expect(page.locator("text=John").first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13_customer_authenticated_header.png"),
      clip: { x: 0, y: 0, width: 1440, height: 180 },
    })

    // =========================================================================
    // STEP 12: COMPLETE BOOKING CHECKOUT FLOW
    // =========================================================================
    console.log("--> Step 12: Entering Booking Checkout View (/checkout)...")
    await page.locator("nav button:has-text('Fleet & Cars')").first().click()
    await page.waitForTimeout(800)

    // Click 'Instant Book' on an available car
    const instantBookBtn = page.locator("button:has-text('Instant Book')").first()
    if (await instantBookBtn.isVisible().catch(() => false)) {
      await instantBookBtn.click()
    } else {
      await page.locator("button:has-text('Details')").first().click()
      await page.waitForTimeout(600)
      await page.locator("button:has-text('Proceed to Checkout')").or(page.locator("button:has-text('Book This Vehicle')")).first().click()
    }
    await page.waitForTimeout(1000)

    // Verify Checkout View
    await expect(page.locator("text=Complete Your Reservation Request").first()).toBeVisible({ timeout: 10000 })

    // Fill all required driver verification fields
    const dateInputs = page.locator("input[type='date']")
    const dateCount = await dateInputs.count()
    if (dateCount >= 1) {
      await dateInputs.nth(0).fill("1994-06-15")
    }
    if (dateCount >= 2) {
      await dateInputs.nth(1).fill("2029-12-31")
    }

    const licenseInput = page.locator("input[placeholder*='License']").or(page.locator("input[placeholder*='D123']")).first()
    if (await licenseInput.isVisible().catch(() => false)) {
      const val = await licenseInput.inputValue()
      if (!val) await licenseInput.fill("DL-FL-789012")
    }

    const stateInput = page.locator("input[placeholder*='FL']").first()
    if (await stateInput.isVisible().catch(() => false)) {
      const val = await stateInput.inputValue()
      if (!val) await stateInput.fill("FL")
    }

    // Agree to terms checkbox if present
    const termsCheckbox = page.locator("input[type='checkbox']").last()
    if (await termsCheckbox.isVisible().catch(() => false)) {
      const isChecked = await termsCheckbox.isChecked()
      if (!isChecked) await termsCheckbox.check()
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14_checkout_form_filled.png"),
      fullPage: false,
    })

    // Submit booking request
    console.log("--> Step 13: Submitting Rental Request...")
    const confirmBookingBtn = page.locator("#confirm-booking-btn").or(page.locator("button:has-text('Submit Request to Manager')")).first()
    await expect(confirmBookingBtn).toBeVisible()
    await confirmBookingBtn.click()
    await page.waitForTimeout(2000)

    // Verify Confirmation Modal
    console.log("--> Step 14: Capturing Confirmation Modal...")
    await expect(page.locator("text=Booking Confirmed!").first()).toBeVisible({ timeout: 15000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "15_booking_confirmation_modal.png"),
      fullPage: false,
    })

    // Click 'View in My Reservations' to close modal and navigate to My Bookings
    const viewMyResBtn = page.locator("button:has-text('View in My Reservations')").first()
    if (await viewMyResBtn.isVisible().catch(() => false)) {
      await viewMyResBtn.click()
      await page.waitForTimeout(1000)
    }

    // =========================================================================
    // STEP 15: CUSTOMER DASHBOARD & INVOICE MODAL
    // =========================================================================
    console.log("--> Step 15: Checking Customer Trips & Invoice Modal (/my-bookings)...")
    await page.waitForTimeout(1000)
    await expect(page.locator("text=John").first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "16_my_bookings_dashboard.png"),
      fullPage: false,
    })

    // Test official Invoice Modal
    const invoiceBtn = page.locator("button:has-text('Invoice')").first()
    if (await invoiceBtn.isVisible().catch(() => false)) {
      await invoiceBtn.click()
      await page.waitForTimeout(800)

      await expect(page.locator("text=MOTORLY").or(page.locator("text=INVOICE")).first()).toBeVisible()

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "17_official_invoice_modal.png"),
        fullPage: false,
      })

      // Close invoice modal
      const closeInvoiceBtn = page.locator("button:has-text('Close')").or(page.locator("button[aria-label='Close']")).first()
      if (await closeInvoiceBtn.isVisible().catch(() => false)) {
        await closeInvoiceBtn.click()
        await page.waitForTimeout(400)
      }
    }

    // =========================================================================
    // STEP 16: ADMIN SECURITY GATE (REJECTION & AUTHORIZATION)
    // =========================================================================
    console.log("--> Step 16: Navigating to Staff/Admin Portal via in-app portal link...")
    // Click 'Staff Portal' in Footer to trigger in-memory navigation to admin gate
    const staffPortalBtn = page.locator("footer button:has-text('Staff Portal')").first()
    if (await staffPortalBtn.isVisible().catch(() => false)) {
      await staffPortalBtn.click()
    } else {
      const managerBtn = page.locator("button:has-text('Manager Portal')").first()
      if (await managerBtn.isVisible().catch(() => false)) {
        await managerBtn.click()
      }
    }
    await page.waitForTimeout(1000)

    // Must be in AdminLoginGate
    await expect(page.locator("text=Fleet Operations Console").or(page.locator("text=Restricted Operational Area")).first()).toBeVisible({ timeout: 10000 })

    // Test rejection: enter wrong password
    const adminPassInput = page.locator("input[type='password']").first()
    await adminPassInput.fill("wrongpass999")
    await page.locator("button:has-text('Authorize & Unlock Console')").first().click()
    await page.waitForTimeout(600)

    // Check error message displayed
    await expect(page.locator("text=Invalid administrator credentials").or(page.locator("text=Access denied")).first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "18_admin_login_gate_denied.png"),
      fullPage: false,
    })

    // Now enter valid master passcode: 0709
    console.log("--> Step 17: Unlocking Admin Console with Master Passcode...")
    await adminPassInput.fill("0709")
    await page.locator("button:has-text('Authorize & Unlock Console')").first().click()
    await page.waitForTimeout(2000)

    // =========================================================================
    // STEP 18: ADMIN OPERATIONS CONSOLE (KPIS & ORDERS REGISTRY)
    // =========================================================================
    console.log("--> Step 18: Inspecting Admin Operations Console...")
    await expect(page.locator("text=ORDERS & DISPATCH REGISTRY").or(page.locator("text=FLEET OPERATIONS")).first()).toBeVisible({ timeout: 15000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "19_admin_dashboard_kpis_and_orders.png"),
      fullPage: false,
    })

    // Test Admin Booking Lifecycle: Accept Request
    console.log("--> Step 19: Admin Booking Acceptance & Vehicle Assignment...")
    const acceptRequestBtn = page.locator("button:has-text('Accept Request')").first()
    if (await acceptRequestBtn.isVisible().catch(() => false)) {
      await acceptRequestBtn.click()
      await page.waitForTimeout(1500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "20_admin_booking_accepted.png"),
        fullPage: false,
      })
    }

    // Test Key Handover Check Out
    console.log("--> Step 20: Admin Key Handover Modal...")
    const handoverBtn = page.locator("button:has-text('Handover Keys')").first()
    if (await handoverBtn.isVisible().catch(() => false)) {
      await handoverBtn.click()
      await page.waitForTimeout(800)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "21_admin_key_handover_modal.png"),
        fullPage: false,
      })

      // Complete Key Handover
      const startClockBtn = page.locator("button:has-text('Keys Given & Start Clock')").first()
      if (await startClockBtn.isVisible().catch(() => false)) {
        await startClockBtn.click()
        await page.waitForTimeout(1500)
      }
    }

    // Test Return Inspection Modal
    console.log("--> Step 21: Vehicle Return Inspection & Damage Audit...")
    const returnCheckBtn = page.locator("button:has-text('Return Check')").first()
    if (await returnCheckBtn.isVisible().catch(() => false)) {
      await returnCheckBtn.click()
      await page.waitForTimeout(800)

      // Add a sample scuff photo
      const samplePhotoBtn = page.locator("button:has-text('+ Sample Scuff Photo')").first()
      if (await samplePhotoBtn.isVisible().catch(() => false)) {
        await samplePhotoBtn.click()
        await page.waitForTimeout(400)
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "22_admin_return_inspection_modal.png"),
        fullPage: false,
      })

      // Close return modal
      const cancelReturnBtn = page.locator("button:has-text('Cancel')").first()
      if (await cancelReturnBtn.isVisible().catch(() => false)) {
        await cancelReturnBtn.click()
        await page.waitForTimeout(400)
      }
    }

    // Check Fleet & Asset Inventory Tab
    console.log("--> Step 22: Switching to Fleet & Asset Inventory Tab...")
    const fleetTabBtn = page.locator("button:has-text('Fleet')").or(page.locator("button:has-text('Fleet & Asset Inventory')")).first()
    if (await fleetTabBtn.isVisible().catch(() => false)) {
      await fleetTabBtn.click()
      await page.waitForTimeout(800)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "23_admin_fleet_inventory.png"),
        fullPage: false,
      })
    }

    // Check Verified Customer CRM Tab
    console.log("--> Step 23: Switching to Customer & Driver CRM Tab...")
    const crmTabBtn = page.locator("button:has-text('CRM')").or(page.locator("button:has-text('Customers')")).first()
    if (await crmTabBtn.isVisible().catch(() => false)) {
      await crmTabBtn.click()
      await page.waitForTimeout(800)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "24_admin_customer_crm.png"),
        fullPage: false,
      })
    }

    // Check Completed Orders Archive Tab
    console.log("--> Step 24: Checking Completed Orders & Invoices Archive...")
    const completedTabBtn = page.locator("button:has-text('Completed')").first()
    if (await completedTabBtn.isVisible().catch(() => false)) {
      await completedTabBtn.click()
      await page.waitForTimeout(800)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "25_admin_completed_orders_archive.png"),
        fullPage: false,
      })
    }

    // =========================================================================
    // STEP 25: ABOUT & CONTACT STOREFRONT PAGES
    // =========================================================================
    console.log("--> Step 25: Exiting Admin Console to Storefront...")
    const exitAdminBtn = page.locator("button:has-text('Storefront')").or(page.locator("button:has-text('Exit')")).first()
    if (await exitAdminBtn.isVisible().catch(() => false)) {
      await exitAdminBtn.click()
      await page.waitForTimeout(1000)
    }

    console.log("--> Step 26: Inspecting Boutique Garage About Page (/about)...")
    await page.goto("http://localhost:3000/?view=about")
    await page.waitForTimeout(1000)

    await expect(page.locator("text=One Owner. One Garage.").or(page.locator("text=About MOTORLY")).first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "26_about_garage_page.png"),
      fullPage: false,
    })

    console.log("--> Step 27: Inspecting Garage Contact & Direct Inquiry Page (/contact)...")
    await page.goto("http://localhost:3000/?view=contact")
    await page.waitForTimeout(1000)

    await expect(page.locator("text=Speak Directly with the").or(page.locator("text=Direct Garage Contact")).first()).toBeVisible({ timeout: 10000 })

    // Test Inquiry Form submission
    const contactName = page.locator("input[placeholder*='Name']").or(page.locator("input[type='text']")).first()
    if (await contactName.isVisible().catch(() => false)) {
      await contactName.fill("Alex Carter")
      const contactEmail = page.locator("input[type='email']").first()
      if (await contactEmail.isVisible().catch(() => false)) await contactEmail.fill("alex@example.com")
      const contactMsg = page.locator("textarea").first()
      if (await contactMsg.isVisible().catch(() => false)) await contactMsg.fill("Inquiring about weekend luxury SUV availability.")

      const contactSubmit = page.locator("button[type='submit']").first()
      if (await contactSubmit.isVisible().catch(() => false)) {
        await contactSubmit.click()
        await page.waitForTimeout(600)
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "27_contact_inquiry_page_submitted.png"),
      fullPage: false,
    })

    // =========================================================================
    // STEP 28: MOBILE RESPONSIVENESS & HAMBURGER NAVIGATION (375x812)
    // =========================================================================
    console.log("--> Step 28: Testing Mobile Viewport (375px iPhone)...")
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("http://localhost:3000/?view=home")
    await page.waitForTimeout(1000)

    // Check no horizontal body overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const windowInnerWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "28_mobile_homepage_responsive.png"),
      fullPage: false,
    })

    // Test Mobile Hamburger Navigation Menu
    console.log("--> Step 29: Toggling Mobile Navigation Drawer...")
    const hamburgerBtn = page.locator("button[aria-label='Toggle Navigation Menu']").first()
    if (await hamburgerBtn.isVisible().catch(() => false)) {
      await hamburgerBtn.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "29_mobile_nav_menu_open.png"),
        fullPage: false,
      })
    }

    // Navigate to Fleet Catalog on mobile
    console.log("--> Step 30: Mobile Fleet Catalog View...")
    await page.goto("http://localhost:3000/?view=listing")
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "30_mobile_fleet_listing.png"),
      fullPage: false,
    })

    console.log("=== End-to-End Human Walkthrough & Screenshot Capture Complete! ===")
  })
})
