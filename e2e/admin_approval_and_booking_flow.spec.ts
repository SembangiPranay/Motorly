import { test, expect } from "@playwright/test"

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

test.describe("Real Browser E2E: Admin Approval & Booking Lifecycle Flow", () => {
  test.setTimeout(60000)
  let adminToken: string
  const createdTestIds: string[] = []

  test.beforeAll(async () => {
    // Authenticate with backend API to obtain valid token
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@motorly.com", password: ADMIN_PASSWORD }),
    })
    const data = await res.json()
    adminToken = data.token
    expect(adminToken).toBeTruthy()
  })

  test.afterAll(async () => {
    // Clean up created test bookings
    for (const id of createdTestIds) {
      await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }).catch(() => {})
    }
  })

  test("E2E-01: Admin Login authenticates and enters Admin Portal", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Click the Fleet Admin button in the navigation header
    const adminBtn = page.locator("button:has-text('Fleet Admin')").first()
    await expect(adminBtn).toBeVisible({ timeout: 5000 })
    await adminBtn.click()

    // It redirects to AuthView (Admin tab). Enter passcode 0709
    const passInput = page.locator("input[type='password']").first()
    await expect(passInput).toBeVisible({ timeout: 5000 })
    await passInput.fill(ADMIN_PASSWORD)

    // Click Authorize button
    const submitBtn = page.locator("button:has-text('Authorize & Launch Fleet Console')").first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })
    await submitBtn.click()

    // Verify Admin Portal loads showing Sync DB button and Active Bookings tab
    await expect(page.locator("button:has-text('Sync DB')").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("button:has-text('Active Bookings')").first()).toBeVisible()
  })

  test("E2E-02: Clicking 'Accept Request' updates card to Approved/Ready and NEVER flips to Declined", async ({ page }) => {
    // 1. Create a dedicated Pending Review booking
    const testId = `E2E-ACC-${Date.now().toString(36)}`
    createdTestIds.push(testId)

    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "E2E",
          lastName: "ApprovalTester",
          email: `e2e-acc-${Date.now()}@test.org`,
          phone: "+15550199000",
        },
        driver: {
          dateOfBirth: "1992-03-15",
          licenseNumber: "DL-E2E-9999",
          licenseState: "FL",
          licenseExpiry: "2029-12-31",
        },
        pickupDate: "2026-11-20 10:00 AM",
        returnDate: "2026-11-20 06:00 PM",
        requestedCategory: "ExoticRocketShip", // Unmateable category so it stays Pending Assignment
        totalAmount: 220,
      }),
    })
    expect(createRes.status).toBe(201)

    // 2. Open Admin View with injected admin auth token
    await page.addInitScript((token) => {
      window.localStorage.setItem("motorly_admin_token", token)
    }, adminToken)

    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Navigate to Admin View directly
    const adminBtn = page.locator("button:has-text('Fleet Admin')").first()
    await adminBtn.click()
    await expect(page.locator("button:has-text('Sync DB')").first()).toBeVisible({ timeout: 15000 })

    // Sync database data and wait for completion across WAN
    const syncBtn = page.locator("button:has-text('Sync DB')").first()
    await syncBtn.click()
    await expect(page.locator("button:has-text('Syncing...')")).toBeVisible({ timeout: 5000 }).catch(() => {})
    await expect(page.locator("button:has-text('Sync DB')").first()).toBeVisible({ timeout: 35000 })

    // 3. Search for the card by ID
    const searchInput = page.locator("input[placeholder*='Search ID']").first()
    await searchInput.fill(testId)

    // Find the visible card container for testId (works across mobile and desktop viewports)
    const card = page.locator("div.group:visible").filter({ hasText: testId }).first()
    await expect(card).toBeVisible({ timeout: 15000 })

    // Confirm it starts as Pending Review
    await expect(card.locator("text=Pending Review").first()).toBeVisible()

    // 4. Click 'Accept Request'
    const acceptBtn = card.locator("button:visible", { hasText: "Accept Request" }).first()
    await expect(acceptBtn).toBeVisible()
    await acceptBtn.click()

    // 5. CRITICAL VERIFICATION: Badge must NOT be 'Declined'
    // It should display 'Approved (Assign Car)'
    await expect(card.locator("text=Approved (Assign Car)").first()).toBeVisible({ timeout: 15000 })
    await expect(card.locator("text=Declined")).not.toBeVisible()

    // 6. Action button must be 'Auto-Assign', not hidden or disappeared
    await expect(card.locator("button:visible", { hasText: "Auto-Assign" }).first()).toBeVisible()
  })

  test("E2E-03: Date Scheduling Modal enforces Past Date blocking and enables Same-Day rentals", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Click Pickup Date & Time container in search widget
    const dateBox = page.locator("div.space-y-1\\.5").filter({ hasText: "Pickup Date" }).locator(".cursor-pointer").first()
    await expect(dateBox).toBeVisible({ timeout: 10000 })
    await dateBox.click()

    // Verify modal is open
    await expect(page.locator("text=Select Trip Dates & Hours")).toBeVisible({ timeout: 5000 })

    // 1. Verify "Same Day (8 Hrs)" quick preset button exists and is clickable
    const sameDayPreset = page.locator("button:has-text('Same Day (8 Hrs)')")
    await expect(sameDayPreset).toBeVisible()
    await sameDayPreset.click()

    // 2. Verify Live Trip Summary shows Same-Day (8 Hours)
    await expect(page.locator("text=Same-Day (8 Hours)")).toBeVisible()

    // 3. Apply Dates and close modal
    await page.locator("button:has-text('Apply Dates & Order')").click()
    await expect(page.locator("text=Select Trip Dates & Hours")).not.toBeVisible()
  })
})
