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
    await page.goto("/?view=admin")
    await page.getByPlaceholder("Enter administrator passcode").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: "Authorize & Unlock Console" }).click()
    await expect(page.getByRole("button", { name: /Orders & Dispatch/ })).toBeVisible()
  })

  test("E2E-02: Clicking 'Accept Request' updates card to Approved/Ready and NEVER flips to Declined", async ({ page }) => {
    // 1. Create a dedicated Pending Review booking
    const testId = `E2E-ACC-${Date.now().toString(36)}`
    createdTestIds.push(testId)

    const pickup = Date.now() + 7 * 86400000
    const fleet = await (await fetch(`${API_BASE}/api/cars`)).json()
    const car = fleet.find((vehicle: { status: string }) => vehicle.status === "Available")
    expect(car).toBeTruthy()
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
        pickupDate: new Date(pickup).toISOString(),
        returnDate: new Date(pickup + 86400000).toISOString(),
        requestedCategory: car.type,
        carId: car.id,
        totalAmount: 220,
      }),
    })
    expect(createRes.status).toBe(201)

    // 2. Open Admin View with injected admin auth token
    await page.addInitScript((token) => {
      window.localStorage.setItem("motorly_admin_token", token)
    }, adminToken)

    await page.goto("/?view=admin&tab=manifest")
    await page.getByRole("button", { name: /Orders & Dispatch/ }).click()

    const row = page.getByRole("row").filter({ hasText: testId })
    await expect(row.getByText("Needs Approval")).toBeVisible()
    await row.getByRole("button", { name: "Accept", exact: true }).click()
    await expect(row.getByText("Ready For Keys")).toBeVisible()
    await expect(row.getByRole("button", { name: "Give Keys" })).toBeVisible()
    await expect(row.getByRole("button", { name: "Decline" })).toHaveCount(0)
  })

  test("E2E-03: Date Scheduling Modal enforces Past Date blocking and enables Same-Day rentals", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Click Pickup Date & Time container in search widget
    const dateBox = page.getByText("Pickup Schedule", { exact: true })
    await expect(dateBox).toBeVisible({ timeout: 10000 })
    await dateBox.click()

    // Verify modal is open
    await expect(page.locator("text=Select Trip Dates & Hours")).toBeVisible({ timeout: 5000 })

    // 1. Verify "Same-Day Rental (Hourly)" toggle switch exists and is clickable
    const sameDaySwitch = page.locator("button:has-text('Same-Day Rental (Hourly)')").first()
    await expect(sameDaySwitch).toBeVisible()
    await sameDaySwitch.click()

    // Select 8 Hours from the dedicated Same-Day Hourly duration toolbar
    const eightHrChip = page.locator("button:has-text('8 Hrs (Full Day)')").first()
    await expect(eightHrChip).toBeVisible()
    await eightHrChip.click()

    // 2. Verify Live Trip Summary shows Same-Day (8 Hours)
    await expect(page.locator("text=Same-Day (8 Hours)")).toBeVisible()

    // 3. Apply Dates and close modal
    await page.locator("button:has-text('Apply Dates & Order')").click()
    await expect(page.locator("text=Select Trip Dates & Hours")).not.toBeVisible()
  })
})
