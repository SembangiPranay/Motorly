import { test, expect } from "@playwright/test"

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

test.describe("E2E: Vehicle Return Inspection, Damage Photo Audit & Ride History Flow", () => {
  test.setTimeout(120000)
  let adminToken: string
  const createdTestIds: string[] = []
  const createdCarIds: string[] = []

  async function createCar() {
    const id = "damage-qa-" + crypto.randomUUID()
    const response = await fetch(`${API_BASE}/api/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ id, name: "Damage QA Sedan" }),
    })
    expect(response.status).toBe(201)
    createdCarIds.push(id)
    return response.json()
  }

  test.beforeAll(async () => {
    // Authenticate as Admin to get API token
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@pitstopcarhire.com", password: ADMIN_PASSWORD }),
    })
    const data = await res.json()
    adminToken = data.token
    expect(adminToken).toBeTruthy()
  })

  test.afterAll(async () => {
    // Teardown created test bookings
    for (const id of createdTestIds) {
      await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }

    for (const id of createdCarIds) {
      await fetch(`${API_BASE}/api/cars/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    }
  })

  test("1. API Level: Return check with damage photos saves report and puts vehicle into Maintenance", async () => {
    const testId = `MTR-DMG-${Date.now().toString(36)}`
    createdTestIds.push(testId)

    const availableCar = await createCar()

    // 2. Create walk-in / direct booking
    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "Audit",
          lastName: "Tester",
          email: `audit-${Date.now()}@pitstop.test`,
          phone: "+15559876543",
        },
        driver: {
          licenseNumber: "DL-AUDIT-999",
          licenseState: "FL",
          licenseExpiry: "2029-10-10",
        },
        pickupDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        returnDate: new Date(Date.now() + 9 * 86400000).toISOString(),
        requestedCategory: availableCar.type || "Sedan",
        matchedCarId: availableCar.id,
        totalAmount: 195.0,
      }),
    })
    expect(createRes.status).toBe(201)

    // 3. Admin Accepts & Dispatches (Moves to Checked Out)
    await fetch(`${API_BASE}/api/bookings/${testId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    const checkoutRes = await fetch(`${API_BASE}/api/bookings/${testId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "Checked Out",
        odometerOut: 14200,
        fuelLevelOut: "Full (100%)",
        keysHandedAt: "Nov 04, 2026 10:00 AM",
      }),
    })
    expect(checkoutRes.status).toBe(200)

    // 4. Return Vehicle with Damage Incident & Inspection Photos
    const damagePhoto1 = "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"
    const damagePhoto2 = "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80"

    const returnRes = await fetch(`${API_BASE}/api/bookings/${testId}/return-inspection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        odometerIn: 14380,
        fuelIn: "80%",
        cleanlinessPass: true,
        damageFound: true,
        damageSeverity: "Body Dent / Panel Crease",
        damageLocation: "Right Front Quarter Panel & Door",
        damageNotes: "Deep crease scratch along passenger door seam. High-resolution photographic evidence captured during vehicle check-in.",
        damagePhotos: [damagePhoto1, damagePhoto2],
        damageFee: 250,
        inspectionPassed: true,
        staffSign: "Lead Auditor Marcus",
      }),
    })
    expect(returnRes.status).toBe(200)
    const returnData = await returnRes.json()
    expect(returnData.success).toBe(true)
    expect(returnData.booking.status).toBe("Completed")

    // 5. Verify the checklist_in is fully populated in the booking record
    const savedChecklist = returnData.booking.checklistIn
    expect(savedChecklist).toBeTruthy()
    expect(savedChecklist.damageFound).toBe(true)
    expect(savedChecklist.damageSeverity).toBe("Body Dent / Panel Crease")
    expect(savedChecklist.damageLocation).toBe("Right Front Quarter Panel & Door")
    expect(savedChecklist.damagePhotos.length).toBe(2)
    expect(savedChecklist.damagePhotos[0]).toBe(damagePhoto1)
    expect(savedChecklist.damageFee).toBe(250)

    // 6. Verify vehicle is safely routed to Maintenance due to damage
    const carCheckRes = await fetch(`${API_BASE}/api/cars/${availableCar.id}`)
    const updatedCar = await carCheckRes.json()
    expect(updatedCar.status).toBe("Maintenance")
    expect(updatedCar.currentOdometer).toBe(14380)

    console.log("PASS: Vehicle return with damage photos successfully saved and car routed to Maintenance!")
  })

  test("2. Browser UI: Return Check modal allows photo inclusion, zooming, and displays damage in ride history", async ({ page }) => {
    const testId = `MTR-UI-${Date.now().toString(36)}`
    createdTestIds.push(testId)

    const car = await createCar()

    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "Jean-Paul",
          lastName: "Sartre",
          email: "return-qa@example.org",
          phone: "+33612345678",
        },
        driver: {
          licenseNumber: "FR-994821",
          licenseState: "PARIS",
          licenseExpiry: "2030-01-01",
        },
        pickupDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        returnDate: new Date(Date.now() + 9 * 86400000).toISOString(),
        requestedCategory: car.type || "Sedan",
        matchedCarId: car.id,
        totalAmount: 220.0,
      }),
    })
    expect(createRes.status).toBe(201)

    const acceptRes = await fetch(`${API_BASE}/api/bookings/${testId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(acceptRes.status).toBe(200)

    const statusRes = await fetch(`${API_BASE}/api/bookings/${testId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "Checked Out",
        odometerOut: 15000,
        fuelLevelOut: "Full (100%)",
        keysHandedAt: "Nov 25, 2026 10:00 AM",
      }),
    })
    expect(statusRes.status).toBe(200)

    // Setup browser session with admin token in localStorage
    await page.addInitScript(({ token }) => {
      localStorage.setItem("pitstop_admin_token", token)
      localStorage.setItem("pitstop_current_view", "admin")
    }, { token: adminToken })

    await page.goto("/?view=admin&tab=manifest")
    await page.getByRole("button", { name: /Orders & Dispatch/ }).click()
    const row = page.getByRole("row").filter({ hasText: testId })
    await row.getByRole("button", { name: "Inspect Return" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Vehicle Return & Check-In Audit" })).toBeVisible()
    await dialog.getByRole("checkbox", { name: /New dents/ }).check()
    await dialog.getByLabel("Damage notes").fill("Scuff detected on rear bumper.")
    const png = await page.evaluate(() => document.createElement("canvas").toDataURL("image/png").split(",")[1])
    await dialog.getByLabel("Damage photos").setInputFiles({
      name: "return-damage.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    })
    await expect(dialog.getByRole("img", { name: "Damage photo 1" })).toBeVisible()
    const saved = page.waitForResponse((response) =>
      response.url().includes(`/bookings/${testId}/return-inspection`),
    )
    await dialog.getByRole("button", { name: "Complete Return & Close Audit" }).click()
    const response = await saved
    expect(response.status()).toBe(200)
    const { booking } = await response.json()
    expect(booking.checklistIn.damageNotes).toBe("Scuff detected on rear bumper.")
    expect(booking.checklistIn.damagePhotos).toHaveLength(1)
    await expect(dialog).toHaveCount(0)

    await page.getByRole("button", { name: /Completed & Invoices/ }).click()
    await page.getByRole("row").filter({ hasText: testId }).getByRole("button", { name: new RegExp(testId) }).click()
    await expect(page.getByText("Scuff detected on rear bumper.")).toBeVisible()
    await page.getByRole("img", { name: "Return damage photo 1" }).click()
    await expect(page.getByText("Return damage photo 1", { exact: true })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByText("Return damage photo 1", { exact: true })).toHaveCount(0)
  })
})
