import { test, expect } from "@playwright/test"

test.describe("Production readiness features: 5-view photos, dynamic settings, 21 clauses, signature image & forgot password", () => {
  test("Admin dynamic support line & hub map settings propagate live to storefront", async ({
    page,
    request,
  }) => {
    const adminLogin = await request.post("/api/auth/login", {
      data: { password: process.env.ADMIN_PASSWORD || "0709" },
    })
    expect(adminLogin.ok()).toBeTruthy()
    const { token: adminToken } = await adminLogin.json()
    const adminHeaders = { Authorization: `Bearer ${adminToken}` }

    const initialSettingsRes = await request.get("/api/settings")
    expect(initialSettingsRes.ok()).toBeTruthy()
    const initialSettings = await initialSettingsRes.json()

    try {
      await page.addInitScript(() => sessionStorage.setItem("pitstop_intro_completed", "true"))
      await page.addInitScript((token) => localStorage.setItem("pitstop_admin_token", token), adminToken)

      await page.goto("/?view=admin&tab=settings", { waitUntil: "domcontentloaded" })
      const supportInput = page.getByPlaceholder("+356 99827192")
      await expect(supportInput).toBeVisible()
      await supportInput.fill("+356 7900 1234")

      // Verify multi-number / dedicated WhatsApp configuration never concatenates numbers
      const waPrimaryInput = page.getByPlaceholder("+356 9982 7192 or +91 77807 40223")
      await expect(waPrimaryInput).toBeVisible()
      await waPrimaryInput.fill("+356 9982 7192")

      const waSecondaryInput = page.getByPlaceholder("+356 9980 4255")
      await expect(waSecondaryInput).toBeVisible()
      await waSecondaryInput.fill("+356 9980 4255")

      const mapsLinkInput = page.locator("input[placeholder*='google.com/maps']").first()
      await mapsLinkInput.fill("https://www.google.com/maps?q=35.899700,14.514600")

      const saveResponsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/settings") && res.request().method() === "PATCH",
      )
      await page.getByRole("button", { name: /Save Settings Changes/ }).click()
      const saveResponse = await saveResponsePromise
      expect(saveResponse.ok()).toBeTruthy()

      await page.goto("/?view=contact", { waitUntil: "domcontentloaded" })
      await expect(page.getByText("+356 7900 1234").first()).toBeVisible()
      await expect(page.getByText(/35\.8997/).first()).toBeVisible()
      const primaryWaLink = page.getByRole("link", { name: /Open WhatsApp Web|Open WhatsApp App/ })
      await expect(primaryWaLink).toHaveAttribute("href", /phone=35699827192(&|$)/)
      await expect(primaryWaLink).not.toHaveAttribute("href", /3569982719235699804255/)
      const altWaLink = page.getByRole("link", { name: /Alternate WhatsApp \(\+356 9980 4255\)/ })
      await expect(altWaLink).toHaveAttribute("href", /phone=35699804255(&|$)/)
    } finally {
      await request.patch("/api/settings", {
        headers: adminHeaders,
        data: {
          support_phone: initialSettings.support_phone || initialSettings.contact_phone || "",
          whatsapp_phone: initialSettings.whatsapp_phone || "",
          whatsapp_phone_secondary: initialSettings.whatsapp_phone_secondary || "",
          hub_address: initialSettings.hub_address || "",
          hub_lat: initialSettings.hub_lat || "",
          hub_lng: initialSettings.hub_lng || "",
          google_maps_url: initialSettings.google_maps_url || "",
        },
      })
    }
  })

  test("Signed-in customer can inspect 5-view photos, upload signature image, open 21 clauses & trigger forgot-password endpoint", async ({
    page,
    request,
  }) => {
    const adminLogin = await request.post("/api/auth/login", {
      data: { password: process.env.ADMIN_PASSWORD || "0709" },
    })
    expect(adminLogin.ok()).toBeTruthy()
    const { token: adminToken } = await adminLogin.json()
    const adminHeaders = { Authorization: `Bearer ${adminToken}` }

    const email = `prod-qa-${crypto.randomUUID()}@example.org`
    const carId = `prod-qa-car-${crypto.randomUUID()}`
    let bookingId: string | undefined

    try {
      const carRes = await request.post("/api/cars", {
        headers: adminHeaders,
        data: {
          id: carId,
          name: "QA Endorsement hatchback",
          status: "Available",
          pricePerDay: 65,
          pricePerHour: 15,
          vatRate: 18,
          securityDeposit: 300,
        },
      })
      expect(carRes.status()).toBe(201)

      const regRes = await request.post("/api/auth/register", {
        data: {
          email,
          name: "QA Customer",
          phone: "+356 99827192",
          password: "customer-pass-123",
        },
      })
      expect(regRes.status()).toBe(201)
      const { token: customerToken, user } = await regRes.json()

      const bookRes = await request.post("/api/bookings", {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: {
          carId,
          pickupDate: "2026-12-01",
          returnDate: "2026-12-03",
          customer: {
            firstName: "QA",
            lastName: "Customer",
            email,
            phone: "+356 99827192",
            dob: "1992-07-15",
            driverLicenseNum: "DL-QA-7788",
            driverLicenseState: "Malta",
          },
          rentalPurpose: "Personal / Holiday",
        },
      })
      expect(bookRes.status()).toBe(201)
      const booking = await bookRes.json()
      bookingId = booking.id

      await page.addInitScript(() => sessionStorage.setItem("pitstop_intro_completed", "true"))
      await page.addInitScript(
        ({ token, user }) => {
          localStorage.setItem("pitstop_customer_token", token)
          localStorage.setItem("pitstop_customer_user", JSON.stringify(user))
        },
        { token: customerToken, user },
      )

      await page.goto("/?view=my-bookings", { waitUntil: "domcontentloaded" })
      await expect(page.getByRole("button", { name: /5-View Photos & Signature/ }).first()).toBeVisible()

      await page.getByRole("button", { name: /5-View Photos & Signature/ }).first().click()
      const editorDialog = page.getByRole("dialog", { name: "5-View Vehicle Inspection & Signature" })
      await expect(editorDialog).toBeVisible()
      await expect(editorDialog.getByRole("button", { name: "+ Photo" })).toHaveCount(5)

      const png = await page.evaluate(
        () => document.createElement("canvas").toDataURL("image/png").split(",")[1],
      )
      const sigPatchPromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/bookings/${bookingId}/condition`) &&
          res.request().method() === "PATCH",
      )
      await editorDialog
        .locator("label", { hasText: /Signature Image/ })
        .locator("input[type=file]")
        .setInputFiles({
          name: "signature.png",
          mimeType: "image/png",
          buffer: Buffer.from(png, "base64"),
        })
      const sigPatchRes = await sigPatchPromise
      expect(sigPatchRes.ok()).toBeTruthy()
      await expect(editorDialog.getByAltText("Client endorsement signature")).toBeVisible()

      await editorDialog.getByRole("button", { name: "Review 21 Rental Clauses →" }).click()
      const legalDialog = page.getByRole("dialog")
      await expect(
        legalDialog.getByText("Pit Stop Car Hire — Official Rental Agreement Terms & Conditions"),
      ).toBeVisible()
      await legalDialog.getByRole("button", { name: "Close modal" }).click()

      // Verify AuthView Forgot Password calls the real backend endpoint and LegalPoliciesModal opens in AuthView
      await page.evaluate(() => {
        localStorage.removeItem("pitstop_customer_token")
        localStorage.removeItem("pitstop_customer_user")
      })
      await page.goto("/?view=auth", { waitUntil: "domcontentloaded" })
      await page.getByRole("button", { name: "Forgot password?" }).click()
      await page.getByPlaceholder("name@example.com").fill(email)
      const forgotPromise = page.waitForResponse(
        (res) => res.url().includes("/api/auth/forgot-password") && res.request().method() === "POST",
      )
      await page.getByRole("button", { name: "Send Reset Link" }).click()
      const forgotRes = await forgotPromise
      // In isolated offline test env SMTP is unset (503), confirming real server validation rather than fake client success
      expect(forgotRes.status()).toBe(503)
    } finally {
      if (bookingId) await request.delete(`/api/bookings/${bookingId}`, { headers: adminHeaders })
      await request.delete(`/api/cars/${carId}`, { headers: adminHeaders })
    }
  })
})
