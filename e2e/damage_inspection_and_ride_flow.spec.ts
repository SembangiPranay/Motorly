import { test, expect } from "@playwright/test"

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001"
const FRONTEND_BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

test.describe("E2E: Vehicle Return Inspection, Damage Photo Audit & Ride History Flow", () => {
  test.setTimeout(120000)
  let adminToken: string
  const createdTestIds: string[] = []

  test.beforeAll(async () => {
    // Authenticate as Admin to get API token
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
    // Teardown created test bookings
    for (const id of createdTestIds) {
      await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }

    // Reset cars back to Available so fleet remains operational
    const carsRes = await fetch(`${API_BASE}/api/cars`).catch(() => null)
    if (carsRes) {
      const cars = await carsRes.json()
      for (const car of cars) {
        if (car.status === "Maintenance") {
          await fetch(`${API_BASE}/api/cars/${car.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ ...car, status: "Available" }),
          }).catch(() => {})
        }
      }
    }
  })

  test("1. API Level: Return check with damage photos saves report and puts vehicle into Maintenance", async () => {
    const testId = `MTR-DMG-${Date.now().toString(36)}`
    createdTestIds.push(testId)

    // 1. Fetch available cars
    const carsRes = await fetch(`${API_BASE}/api/cars`)
    const cars = await carsRes.json()
    const availableCar = cars.find((c: any) => c.status !== "Maintenance") || cars[0]
    expect(availableCar).toBeTruthy()

    // 2. Create walk-in / direct booking
    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "Audit",
          lastName: "Tester",
          email: `audit-${Date.now()}@motorly.test`,
          phone: "+15559876543",
        },
        driver: {
          licenseNumber: "DL-AUDIT-999",
          licenseState: "FL",
          licenseExpiry: "2029-10-10",
        },
        pickupDate: "2026-11-20 10:00",
        returnDate: "2026-11-22 10:00",
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

    // 1. Ensure an Available car exists for the test
    const carsRes = await fetch(`${API_BASE}/api/cars`)
    const cars = await carsRes.json()
    let car = cars.find((c: any) => c.status === "Available")
    if (!car) {
      await fetch(`${API_BASE}/api/cars/${cars[0].id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ...cars[0], status: "Available" }),
      })
      car = cars[0]
    }

    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "Jean-Paul",
          lastName: "Sartre",
          email: "jeanpaul@atelier.fr",
          phone: "+33612345678",
        },
        driver: {
          licenseNumber: "FR-994821",
          licenseState: "PARIS",
          licenseExpiry: "2030-01-01",
        },
        pickupDate: "2026-11-25 10:00",
        returnDate: "2026-11-28 10:00",
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
      localStorage.setItem("motorly_admin_token", token)
      localStorage.setItem("motorly_current_view", "admin")
    }, { token: adminToken })

    // Open Admin Console
    await page.goto("/admin")
    await page.waitForLoadState("domcontentloaded")

    // Verify Admin is loaded
    await expect(page.locator("h2:has-text('ORDERS & DISPATCH REGISTRY')")).toBeVisible({ timeout: 15000 })

    // Find our booking card and scroll into view
    const bookingCard = page.locator(`div.rounded-2xl:has-text('${testId}')`).first()
    await expect(bookingCard).toBeVisible({ timeout: 10000 })
    await bookingCard.scrollIntoViewIfNeeded()

    // Click "Return Check" button inside our booking card
    const returnCheckBtn = bookingCard.locator("button:has-text('Return Check')").first()
    await expect(returnCheckBtn).toBeVisible({ timeout: 5000 })
    await returnCheckBtn.click()

    // Verify Return Modal is Open
    await expect(page.locator("h3:has-text('Vehicle Return Inspection & Closeout')")).toBeVisible({ timeout: 5000 })

    // Toggle "Damage Identified on Return"
    const damageCheckbox = page.locator("label:has-text('Damage Identified on Return') input[type='checkbox']").first()
    await damageCheckbox.check()

    // Verify Damage Incident & Photo Audit section expanded
    await expect(page.locator("text=Damage Incident & Photo Audit")).toBeVisible({ timeout: 5000 })

    // Click "+ Sample Scuff Photo" button
    const samplePhotoBtn = page.locator("button:has-text('+ Sample Scuff Photo')").first()
    await expect(samplePhotoBtn).toBeVisible()
    await samplePhotoBtn.click()

    // Verify 1 photo thumbnail is attached
    await expect(page.locator("text=Damage Inspection Photos (1)")).toBeVisible({ timeout: 5000 })

    // Fill notes
    const notesInput = page.locator("textarea[placeholder*='Document exact location']").first()
    await notesInput.fill("Scuff detected on rear bumper right corner with paint abrasion.")

    // Ensure Inspection Certified is checked
    const certifiedCheckbox = page.locator("label:has-text('Inspection Certified') input[type='checkbox']").first()
    if (!(await certifiedCheckbox.isChecked())) {
      await certifiedCheckbox.check()
    }

    // Submit Return Inspection
    const submitBtn = page.locator("button:has-text('Complete Ride & Release Fleet')").first()
    await submitBtn.click()

    // Wait for modal to close and success toast
    await expect(page.locator("text=Return inspection certified")).toBeVisible({ timeout: 10000 })

    // Navigate to "Completed & Invoices" tab in Admin
    const completedTabBtn = page.locator("button:has-text('Completed & Invoices')").first()
    await completedTabBtn.click()

    // Verify page header is "COMPLETED ORDERS & INVOICE ARCHIVE"
    await expect(page.locator("h2:has-text('COMPLETED ORDERS & INVOICE ARCHIVE')")).toBeVisible({ timeout: 10000 })

    // Verify the booking card shows "Damage (1 Photos)"
    const completedCard = page.locator(`div.rounded-2xl:has-text('${testId}')`).first()
    await expect(completedCard).toBeVisible({ timeout: 10000 })
    await expect(completedCard.locator("text=Damage (1 Photos)").first()).toBeVisible({ timeout: 5000 })

    // Click "Damage" or "Audit" button on the completed card to view the report
    const auditBtn = completedCard.locator("button:has-text('Damage')").first()
    await auditBtn.click()

    // Verify the inspection report modal opens with documented damage photos
    await expect(page.locator("text=Post-Trip Inspection: Damage Documented")).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Documented Photo Evidence (1 photos):")).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Scuff detected on rear bumper")).toBeVisible({ timeout: 5000 })

    // Click the photo to open Zoom Lightbox
    const photoEvidence = page.locator("img[alt='Damage Evidence 1']").first()
    await photoEvidence.click({ force: true })

    // Verify lightbox opens
    await expect(page.locator("div.fixed.inset-0.z-50")).toBeVisible({ timeout: 5000 })

    // Close lightbox
    await page.keyboard.press("Escape")

    console.log("PASS: Browser UI Return Inspection, Damage Photo inclusion, Zooming, and Completed Archive verified successfully!")
  })
})
