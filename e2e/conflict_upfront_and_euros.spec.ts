import { test, expect, type APIRequestContext } from "@playwright/test"

async function createCar(request: APIRequestContext, token: string, name: string, status: string) {
  const id = "browser-qa-" + crypto.randomUUID()
  const response = await request.post("/api/cars", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      id,
      name,
      status,
      pricePerDay: 100,
      pricePerHour: 20,
      vatRate: 18,
      securityDeposit: 475,
    },
  })
  expect(response.status()).toBe(201)
  return id
}

for (const mode of ["guest", "signed-in"] as const) {
  test(`fleet availability, pricing, and booking documents work at ${mode} checkout`, async ({
    page,
    request,
  }) => {
    const adminLogin = await request.post("/api/auth/login", {
      data: { password: process.env.ADMIN_PASSWORD || "0709" },
    })
    expect(adminLogin.ok()).toBeTruthy()
    const { token: adminToken } = await adminLogin.json()
    const adminHeaders = { Authorization: `Bearer ${adminToken}` }
    const carIds: string[] = []
    let bookingId: string | undefined
    let customerId: string | undefined
    const email = `browser-qa-${crypto.randomUUID()}@example.org`

    try {
      carIds.push(await createCar(request, adminToken, "QA Maintenance Sedan", "Maintenance"))
      carIds.push(await createCar(request, adminToken, "QA Checkout Sedan", "Available"))
      await page.addInitScript(() => sessionStorage.setItem("motorly_intro_completed", "true"))
      if (mode === "signed-in") {
        const registration = await request.post("/api/auth/register", {
          data: {
            email,
            name: "QA Renter",
            phone: "+356 99827192",
            password: "local-customer-qa-password",
          },
        })
        expect(registration.status()).toBe(201)
        const { token, user } = await registration.json()
        customerId = user.id
        await page.addInitScript(
          ({ token, user }) => {
            localStorage.setItem("motorly_customer_token", token)
            localStorage.setItem("motorly_customer_user", JSON.stringify(user))
          },
          { token, user },
        )
      }

      await page.goto("/?view=listing", { waitUntil: "domcontentloaded" })
      await page.getByPlaceholder("Search make, model, or hub...").fill("QA Maintenance Sedan")
      const unavailable = page.locator("div.group").filter({ hasText: "QA Maintenance Sedan" })
      await expect(
        unavailable.getByRole("button", { name: "Maintenance", exact: true }),
      ).toBeDisabled()
      await expect(unavailable.getByText("€100", { exact: true })).toBeVisible()

      await page.getByPlaceholder("Search make, model, or hub...").fill("QA Checkout Sedan")
      const available = page.locator("div.group").filter({ hasText: "QA Checkout Sedan" })
      await available.getByRole("button", { name: "Instant Book", exact: true }).click()
      await expect(
        page.getByRole("heading", { name: "Complete Your Reservation Request" }),
      ).toBeVisible()
      if (mode === "guest") {
        await expect(page.getByRole("heading", { name: "Book as a guest" })).toBeVisible()
        await page.getByPlaceholder("e.g. John").fill("QA")
        await page.getByPlaceholder("e.g. Borg").fill("Guest")
        await page.getByPlaceholder("+356 9982 7192").fill("+356 99827192")
        await page.getByPlaceholder("customer@example.com").fill(email)
      }
      await page.locator("input[type=date]").first().fill("1992-07-15")
      await page.locator("input[type=date]").nth(1).fill("2099-12-31")
      await page.getByPlaceholder("e.g. D123-456-789-0").fill("QA-DL-1234")
      await page.getByPlaceholder("Country", { exact: true }).fill("Malta")
      const png = await page.evaluate(
        () => document.createElement("canvas").toDataURL("image/png").split(",")[1],
      )
      await page
        .locator("input[type=file]")
        .first()
        .setInputFiles({
          name: "qa-license.png",
          mimeType: "image/png",
          buffer: Buffer.from(png, "base64"),
        })
      await expect(page.getByText("Front Captured")).toBeVisible()

      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/bookings") && response.request().method() === "POST",
      )
      await page.getByRole("button", { name: /Confirm Reservation Request/ }).click()
      const bookingResponse = await saved
      expect(bookingResponse.status()).toBe(201)
      const booking = await bookingResponse.json()
      bookingId = booking.id
      expect(booking.userId).toBe(customerId)
      expect(booking.customer.email).toBe(email)
      expect(booking.totalAmount).toBeCloseTo(354)
      expect(booking.securityDeposit).toBe(475)
      await expect(
        page.getByRole("heading", { name: "Reservation Request Received", exact: true }),
      ).toBeVisible()
      await expect(page.getByText(bookingId!, { exact: true })).toBeVisible()

      if (mode === "guest") {
        expect(bookingResponse.request().headers().authorization).toBeUndefined()
        await page.getByRole("button", { name: "View in My Reservations" }).click()
        await expect(page).toHaveURL(/view=my-bookings/)
        await page.getByPlaceholder(/Enter Booking ID/).fill(bookingId!)
        await page.getByRole("button", { name: "Find Trip" }).click()
        await expect(page.getByText(`Reservation ${bookingId} located successfully!`)).toBeVisible()
        const publicBooking = await request.get(`/api/bookings/lookup/${bookingId}`)
        expect(publicBooking.ok()).toBeTruthy()
        const publicData = await publicBooking.json()
        expect(publicData.customer.email).toBe("")
        expect(publicData.driver).toBeUndefined()
      }

      await page.evaluate((value) => localStorage.setItem("motorly_admin_token", value), adminToken)
      await page.goto(`/?view=admin&tab=manifest&bookingId=${bookingId}`, {
        waitUntil: "domcontentloaded",
      })
      const photo = page.getByRole("img", { name: /Driver License Front/ })
      await expect(photo).toHaveAttribute("src", /^blob:/)
      await expect
        .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0)
    } finally {
      if (bookingId) await request.delete(`/api/bookings/${bookingId}`, { headers: adminHeaders })
      for (const id of carIds) await request.delete(`/api/cars/${id}`, { headers: adminHeaders })
    }
  })
}
