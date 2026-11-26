import assert from "node:assert/strict"
import { createHash, randomBytes } from "node:crypto"
import { once } from "node:events"
import { after, before, test } from "node:test"

const postgresUrl = process.env.PITSTOP_TEST_DATABASE_URL
const adminPassword = "pitstop-integration-test-password"
let db
let server
let baseUrl
let admin
let customer
let otherCustomer
const carId = "qa-integration-sedan"
const customerEmail = "customer@example.org"

before(async () => {
  // The production database and mail credentials must never be loaded by this suite.
  process.env.DATABASE_URL = postgresUrl || ""
  process.env.SUPABASE_DIRECT_URL = ""
  process.env.NODE_ENV = postgresUrl ? "production" : "test"
  process.env.SQLITE_PATH = ":memory:"
  process.env.JWT_SECRET = "pitstop-integration-test-secret-local-only"
  process.env.ADMIN_PASSWORD = adminPassword
  process.env.ADMIN_PASSWORD_HASH = ""
  process.env.SMTP_USER = ""
  process.env.SMTP_PASS = ""
  process.env.GOOGLE_OAUTH_CLIENT_ID = "pitstop-tests.apps.googleusercontent.com"
  process.env.VERCEL = "1"
  if (postgresUrl) {
    const selected = new URL(postgresUrl)
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(selected.hostname))
    assert.match(selected.pathname, /^\/pitstop_test\w*$/)
  }

  const { default: app } = await import("../api/index.ts")
  ;({ db } = await import("../server/db.ts"))
  server = app.listen(0, "127.0.0.1")
  await once(server, "listening")
  baseUrl = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await db?.pool?.end()
})

async function call(path, { method = "GET", body, token, expect = 200 } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const contentType = res.headers.get("content-type")
  assert.equal(res.status, expect, `${method} ${path}`)
  return contentType?.includes("json") ? res.json() : res
}

function post(path, body, token, expect) {
  return call(path, { method: "POST", body, token, expect })
}

test("health, admin authentication and isolated customer sessions", async () => {
  const health = await call("/health")
  assert.equal(health.status, "ok")
  assert.equal(health.supabase, Boolean(postgresUrl))
  await call("/not-a-route", { expect: 404 })
  await post("/auth/google-admin-login", { email: "admin@example.org" }, undefined, 400)
  await post("/auth/login", { password: "wrong-password" }, undefined, 401)
  admin = (await post("/auth/login", { password: adminPassword })).token
  assert.equal((await post("/auth/verify", {}, admin)).authenticated, true)
  customer = (
    await post(
      "/auth/register",
      {
        name: "QA Customer",
        email: customerEmail,
        password: "safe-qa-password",
      },
      undefined,
      201,
    )
  ).token
  otherCustomer = (
    await post(
      "/auth/register",
      {
        name: "Other Customer",
        email: "other@example.org",
        password: "other-qa-password",
      },
      undefined,
      201,
    )
  ).token
  await call("/admin/stats", { token: customer, expect: 403 })
  assert.equal((await call("/auth/customer-me", { token: customer })).user.email, customerEmail)
  const session = (
    await post("/auth/customer-login", { email: customerEmail, password: "safe-qa-password" })
  ).token
  await post("/auth/customer-logout", {}, session)
  await call("/auth/customer-me", { token: session, expect: 401 })
})

test("fleet CRUD, promos, hub settings, maintenance and mail diagnostics", async () => {
  await post(
    "/cars",
    {
      id: carId,
      name: "QA Sedan",
      pricePerDay: 100,
      pricePerHour: 20,
      vatRate: 18,
      securityDeposit: 400,
    },
    admin,
    201,
  )
  const car = await call(`/cars/${carId}`)
  assert.equal(car.securityDeposit, 400)
  const pricing = await call(`/cars/${carId}/pricing`, {
    token: admin,
    method: "PATCH",
    body: {
      pricePerHour: 20,
      pricePerDay: 100,
      pricePerWeek: 600,
      pricePerMonth: 2200,
    },
  })
  assert.equal(pricing.car.pricePerWeek, 600)
  assert.ok((await call("/cars?search=QA%20Sedan")).some(({ id }) => id === carId))
  await post(
    "/promos",
    { code: "QA10", discountPercent: 10, description: "QA", expiryDate: "2099-12-31" },
    admin,
    201,
  )
  assert.equal((await post("/promos/validate", { code: "QA10" })).discountPercent, 10)
  await call("/promos/QA10/toggle", { method: "PATCH", token: admin })
  assert.equal((await post("/promos/validate", { code: "QA10" })).valid, false)
  await call("/promos/QA10/toggle", { method: "PATCH", token: admin })
  await call("/admin/promos", { token: admin })
  await call("/settings", {
    method: "PATCH",
    token: admin,
    body: {
      settings: { reviews_enabled: true, contact_phone: "+356 12345678" },
    },
  })
  assert.equal((await call("/settings")).settings.contact_phone, "+356 12345678")
  await post(
    "/settings/sync-hub",
    { hub_address: "QA Garage, Malta", hub_lat: 35.9, hub_lng: 14.4 },
    admin,
  )
  assert.match((await call(`/cars/${carId}`)).garageAddress, /QA Garage/)
  const maintenance = await post(
    "/maintenance",
    {
      carId,
      serviceType: "Oil change",
      cost: 75,
      odometer: 16000,
      date: "2026-11-25",
      status: "Scheduled",
    },
    admin,
    201,
  )
  await call(`/maintenance/${maintenance.id}/status`, {
    method: "PATCH",
    token: admin,
    body: { status: "Completed" },
  })
  const logs = await call(`/maintenance?carId=${carId}`, { token: admin })
  assert.equal(logs.data[0].status, "Completed")
  const status = await call("/admin/email-status", { token: admin })
  assert.equal(status.smtp.configured, false)
  await post(
    "/contact",
    { name: "QA", email: customerEmail, message: "Availability?" },
    undefined,
    503,
  )
})

test("checkout price, ownership, concurrency, extensions, return and reviews", async () => {
  const start = Date.now() + 3 * 86400000
  const pickupDate = new Date(start).toISOString()
  const returnDate = new Date(start + 2 * 86400000).toISOString()
  const criteria = new URLSearchParams({ pickupDate, returnDate })
  assert.equal((await call(`/cars/${carId}/availability?${criteria}`)).isAvailable, true)
  const payload = {
    carId,
    pickupDate,
    returnDate,
    promoCode: "QA10",
    totalAmount: 1,
    securityDeposit: 1,
    deliveryType: "custom",
    deliveryFee: 1,
    optionalServices: ["stroller"],
    optionalServicesCost: 0,
    customer: {
      firstName: "QA",
      lastName: "Customer",
      email: customerEmail,
      phone: "+356 12345678",
    },
    driver: {
      dateOfBirth: "1991-06-15",
      licenseNumber: "QA-1234",
      licenseState: "Malta",
      licenseExpiry: "2039-12-31",
    },
  }
  const underage = new Date(start)
  underage.setUTCFullYear(underage.getUTCFullYear() - 17)
  await post(
    "/bookings",
    {
      ...payload,
      driver: { ...payload.driver, dateOfBirth: underage.toISOString() },
    },
    customer,
    400,
  )
  const results = await Promise.all(
    ["QA-MAIN-1", "QA-MAIN-2"].map((id) =>
      fetch(baseUrl + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer}` },
        body: JSON.stringify({ ...payload, id }),
      }),
    ),
  )
  assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409])
  const booking = await results.find(({ status }) => status === 201).json()
  const path = "/bookings/" + booking.id
  assert.ok(Math.abs(booking.totalAmount - 247.8) < 0.001)
  assert.equal(booking.securityDeposit, 400)
  assert.equal(booking.deliveryFee, 20)
  assert.equal(booking.optionalServicesCost, 10)
  assert.equal((await call(`/cars/${carId}/availability?${criteria}`)).isAvailable, false)
  assert.equal((await call(`/bookings/lookup/${booking.id}`)).driver, undefined)
  assert.equal(
    (await call(`/bookings/lookup/${booking.id}`, { token: customer })).driver.licenseNumber,
    "QA-1234",
  )
  assert.equal((await call("/users/bookings", { token: customer })).length, 1)
  assert.deepEqual(await call("/users/bookings", { token: otherCustomer }), [])
  await post(path + "/upload-license", { licenseNumber: "FORBIDDEN" }, otherCustomer, 403)
  const uploaded = await post(
    path + "/upload-license",
    {
      licensePhotoFront: "data:image/png;base64,iVBORw0KGgo=",
      licenseNumber: "QA-UPDATED",
    },
    admin,
  )
  assert.equal(uploaded.booking.driver.licenseNumber, "QA-UPDATED")
  await call(path + "/download-license", { token: otherCustomer, expect: 403 })
  assert.equal(
    (await call(path + "/download-license", { token: admin })).headers.get("content-type"),
    "image/png",
  )
  assert.equal((await post(path + "/approve", {}, admin)).booking.approvedByAdmin, true)
  assert.equal(
    (await post(path + "/handover-keys", { odometerOut: 17500, fuelOut: "100%" }, admin)).booking
      .status,
    "Checked Out",
  )
  await post(path + "/request-extension", { extraDuration: 1, unit: "days" }, customer)
  await post(
    path + "/quote-extension",
    { rateType: "day", rateAmount: 30, totalQuotedAmount: 30 },
    admin,
  )
  await post(path + "/approve-extension", {}, undefined, 401)
  await post(path + "/decline-extension", { email: customerEmail }, otherCustomer, 403)
  const extension = await post(path + "/approve-extension", {}, customer)
  assert.ok(Math.abs(extension.booking.totalAmount - 277.8) < 0.001)
  await post(path + "/approve-extension", {}, customer, 409)
  const completed = await post(
    path + "/return-inspection",
    {
      odometerIn: 17600,
      fuelIn: "100%",
      inspectionPassed: true,
    },
    admin,
  )
  assert.equal(completed.booking.status, "Completed")
  assert.equal((await call(`/cars/${carId}`)).status, "Available")
  const review = await post(
    "/reviews",
    { carId, bookingId: booking.id, rating: 5, comment: "Good rental" },
    customer,
  )
  assert.equal(review.car.rating, 5)
  assert.ok(
    (await call(`/reviews?carId=${carId}`)).reviews.some(({ id }) => id === review.review.id),
  )
  assert.ok(
    (await call("/admin/customers", { token: admin })).some(({ email }) => email === customerEmail),
  )
  await call("/admin/stats", { token: admin })
  await call("/bookings", { token: admin })
})

test("counter dispatch, vehicle release and deletion use the same fleet state", async () => {
  const walkIn = await post(
    "/admin/counter-booking",
    {
      firstName: "Counter",
      lastName: "Renter",
      email: "counter@example.org",
      phone: "+356 99827192",
      carId,
      immediateCheckout: true,
    },
    admin,
    201,
  )
  assert.equal(walkIn.booking.status, "Checked Out")
  assert.ok(walkIn.booking.keysHandedAt)
  assert.equal((await call(`/cars/${carId}`)).status, "Rented")
  await post("/admin/counter-booking", { carId, immediateCheckout: true }, admin, 409)
  await post(
    `/bookings/${walkIn.booking.id}/return-inspection`,
    {
      odometerIn: 18000,
      fuelIn: "75%",
      cleanlinessPass: false,
    },
    admin,
  )
  assert.equal((await call(`/cars/${carId}`)).status, "Cleaning")
  await call(`/bookings/${walkIn.booking.id}`, { method: "DELETE", token: admin })
  await call("/promos/QA10", { method: "DELETE", token: admin })
  assert.equal((await post("/promos/validate", { code: "QA10" })).valid, false)
})

test("guest booking lookup, handover conflict guards, and orphan Rented self-healing", async () => {
  const start = Date.now() + 3 * 86400000
  const pickupDate = new Date(start).toISOString()
  const returnDate = new Date(start + 2 * 86400000).toISOString()
  const guestPayload = {
    carId,
    pickupDate,
    returnDate,
    deliveryType: "garage",
    returnType: "garage",
    customer: {
      firstName: "Unsigned",
      lastName: "Guest",
      email: "unsigned-guest@example.org",
      phone: "+356 99827192",
    },
    driver: {
      dateOfBirth: "1992-05-10",
      licenseNumber: "GUEST-DL-101",
      licenseState: "Malta",
      licenseExpiry: "2039-12-31",
    },
  }

  // Ensure test vehicle starts Available
  await call(`/cars/${carId}/status`, { method: "PATCH", token: admin, body: { status: "Available" } })

  // 1. Unsigned (guest) creates a booking without auth token
  const guestBooking = await post("/bookings", guestPayload, undefined, 201)
  assert.equal(guestBooking.userId, undefined)

  // Also pre-book a second non-overlapping guest reservation while the car is still Available
  const secondGuest = await post(
    "/bookings",
    {
      ...guestPayload,
      pickupDate: new Date(start + 10 * 86400000).toISOString(),
      returnDate: new Date(start + 12 * 86400000).toISOString(),
    },
    undefined,
    201,
  )
  await post(`/bookings/${secondGuest.id}/approve`, {}, admin)

  // 2. Public lookup exposes vehicle, price, and public garage hub, while scrubbing customer/driver PII
  const publicLookup = await call(`/bookings/lookup/${guestBooking.id.toLowerCase()}`)
  assert.equal(publicLookup.id, guestBooking.id)
  assert.equal(publicLookup.matchedCarId, carId)
  assert.equal(publicLookup.totalAmount, guestBooking.totalAmount)
  assert.equal(publicLookup.securityDeposit, 400)
  assert.equal(publicLookup.customer.email, "")
  assert.equal(publicLookup.customer.phone, "")
  assert.equal(publicLookup.driver, undefined)

  // 3. Approve and hand over keys for the unsigned guest booking
  await post(`/bookings/${guestBooking.id}/approve`, {}, admin)
  const handedOver = await post(
    `/bookings/${guestBooking.id}/handover-keys`,
    { odometerOut: 19000, fuelOut: "100%" },
    admin,
  )
  assert.equal(handedOver.booking.status, "Checked Out")
  assert.equal((await call(`/cars/${carId}`)).status, "Rented")

  // 4. While actively Checked Out, availability & new bookings & overlapping handover are blocked with clear 409
  const criteria = new URLSearchParams({
    pickupDate: new Date(start + 5 * 86400000).toISOString(),
    returnDate: new Date(start + 7 * 86400000).toISOString(),
  })
  assert.equal((await call(`/cars/${carId}/availability?${criteria}`)).isAvailable, false)
  await post(
    "/bookings",
    {
      ...guestPayload,
      pickupDate: new Date(start + 5 * 86400000).toISOString(),
      returnDate: new Date(start + 7 * 86400000).toISOString(),
    },
    undefined,
    409,
  )
  const blockedHandover = await post(
    `/bookings/${secondGuest.id}/handover-keys`,
    { odometerOut: 19100, fuelOut: "100%" },
    admin,
    409,
  )
  assert.equal(blockedHandover.conflictingBookingId, guestBooking.id)
  assert.match(blockedHandover.error, new RegExp(guestBooking.id))

  await call(`/cars/${carId}/status`, { method: "PATCH", token: admin, body: { status: "Available" } })
  const blockedWithStaleStatus = await post(
    `/bookings/${secondGuest.id}/handover-keys`,
    { odometerOut: 19100, fuelOut: "100%" },
    admin,
    409,
  )
  assert.equal(blockedWithStaleStatus.conflictingBookingId, guestBooking.id)

  // 5. Return the active booking, then verify a stale orphan 'Rented' flag self-heals on handover
  await post(
    `/bookings/${guestBooking.id}/return-inspection`,
    { odometerIn: 19150, fuelIn: "100%", inspectionPassed: true },
    admin,
  )
  assert.equal((await call(`/cars/${carId}`)).status, "Available")

  // Simulate an orphan 'Rented' vehicle status with no active Checked Out booking
  await call(`/cars/${carId}/status`, { method: "PATCH", token: admin, body: { status: "Rented" } })
  const healedHandover = await post(
    `/bookings/${secondGuest.id}/handover-keys`,
    { odometerOut: 19200, fuelOut: "100%" },
    admin,
  )
  assert.equal(healedHandover.booking.status, "Checked Out")

  // Clean up test bookings & restore car status
  await post(
    `/bookings/${secondGuest.id}/return-inspection`,
    { odometerIn: 19250, fuelIn: "100%", inspectionPassed: true },
    admin,
  )
  await call(`/bookings/${guestBooking.id}`, { method: "DELETE", token: admin })
  await call(`/bookings/${secondGuest.id}`, { method: "DELETE", token: admin })
})

test("5-view condition endorsement, dynamic support/map settings, WhatsApp multi-number splitting, and forgot/reset password validation", async () => {
  const { extractPhoneNumbers, normalizeWhatsAppPhone, formatTelHref } = await import(
    "../src/utils/whatsapp.ts"
  )
  assert.deepEqual(extractPhoneNumbers("+356 99827192 / +356 99804255"), [
    "35699827192",
    "35699804255",
  ])
  assert.equal(normalizeWhatsAppPhone("+356 99827192 / +356 99804255"), "35699827192")
  assert.equal(normalizeWhatsAppPhone("+3569982719235699804255"), "")
  assert.equal(formatTelHref("+356 99827192 / +356 99804255"), "tel:+35699827192")

  // 1. Dynamic support_phone, whatsapp_phone(s) & admin map settings propagate to GET /settings and GET /cars
  await call("/settings", {
    method: "PATCH",
    token: admin,
    body: {
      settings: {
        support_phone: "+356 2100 9999",
        whatsapp_phone: "+356 9982 7192",
        whatsapp_phone_secondary: "+356 9980 4255",
        hub_address: "Mgarr Harbour Bay 9",
        hub_lat: 35.9255,
        hub_lng: 14.3711,
        google_maps_url: "https://www.google.com/maps?q=35.9255,14.3711",
      },
    },
  })
  const settingsRes = await call("/settings")
  assert.equal(settingsRes.settings.support_phone, "+356 2100 9999")
  assert.equal(settingsRes.settings.whatsapp_phone, "+356 9982 7192")
  assert.equal(settingsRes.settings.whatsapp_phone_secondary, "+356 9980 4255")
  assert.equal(settingsRes.settings.hub_address, "Mgarr Harbour Bay 9")
  assert.equal(settingsRes.settings.google_maps_url, "https://www.google.com/maps?q=35.9255,14.3711")
  const updatedFleet = await call("/cars")
  assert.equal(updatedFleet[0].garageAddress, "Mgarr Harbour Bay 9")

  // 2. PATCH /bookings/:id/condition stores 5-view side pins/photos + signature image for owner or admin
  const customerRes = await post(
    "/auth/register",
    {
      email: `cond-user-${Date.now()}@example.org`,
      password: "Password123!",
      name: "Condition Tester",
      phone: "+35679001122",
    },
    undefined,
    201,
  )
  const customerToken = customerRes.token
  const targetCar = updatedFleet.find((c) => c.status === "Available")
  assert.ok(targetCar)
  const start = Date.now() + 25 * 86400000
  const booking = await post(
    "/bookings",
    {
      carId: targetCar.id,
      pickupDate: new Date(start).toISOString(),
      returnDate: new Date(start + 2 * 86400000).toISOString(),
      deliveryType: "garage",
      returnType: "garage",
      customer: {
        firstName: "Condition",
        lastName: "Tester",
        email: customerRes.user.email,
        phone: "+35679001122",
      },
      driver: {
        dateOfBirth: "1991-04-04",
        licenseNumber: "MT-COND-11",
        licenseState: "Malta",
        licenseExpiry: "2039-12-31",
      },
    },
    customerToken,
    201,
  )
  const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  const condUpdate = await call(`/bookings/${booking.id}/condition`, {
    method: "PATCH",
    token: customerToken,
    body: {
      conditionPins: [
        {
          id: "pin-front-1",
          view: "front",
          viewLabel: "Front View",
          x: 45,
          y: 60,
          note: "Front bumper photo",
          photo: samplePng,
        },
      ],
      conditionPhotos: [samplePng],
      clientSignature: samplePng,
    },
  })
  assert.equal(condUpdate.success, true)
  assert.equal(condUpdate.booking.conditionPins.length, 1)
  assert.equal(condUpdate.booking.conditionPins[0].view, "front")
  assert.equal(condUpdate.booking.conditionPins[0].photo, samplePng)
  assert.equal(condUpdate.booking.clientSignature, samplePng)

  // 3. Forgot & reset password endpoints enforce validation and real SMTP status instead of fake success
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST ||
      (process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)),
  )
  const forgotRes = await post(
    "/auth/forgot-password",
    { email: customerRes.user.email },
    undefined,
    smtpConfigured ? 200 : 503,
  )
  assert.equal(forgotRes.success, smtpConfigured)

  // Invalid reset code returns 400 clearly
  const badReset = await post(
    "/auth/reset-password",
    { token: "INVALID-CODE-000000000", newPassword: "NewPassword99!" },
    undefined,
    400,
  )
  assert.equal(badReset.success, false)

  const resetCode = randomBytes(16).toString("hex").toUpperCase()
  const hash = createHash("sha256").update(resetCode).digest("hex")
  await db.run(
    "INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    "qa-single-use-reset",
    customerRes.user.id,
    customerRes.user.email,
    hash,
    new Date(Date.now() + 60_000).toISOString(),
    new Date().toISOString(),
  )
  const resetAttempts = await Promise.all(
    ["NextQaPassword1!", "NextQaPassword2!"].map((newPassword) =>
      fetch(baseUrl + "/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetCode, newPassword }),
      }),
    ),
  )
  assert.deepEqual(resetAttempts.map((response) => response.status).sort(), [200, 400])
  await call("/auth/customer-me", { token: customerToken, expect: 401 })

  await call(`/bookings/${booking.id}`, { method: "DELETE", token: admin })
})

test("a passcode change replaces the bootstrap password and invalidates other admin sessions", async () => {
  const otherAdmin = (await post("/auth/login", { password: adminPassword })).token
  const replacement = "pitstop-replacement-passcode"
  await post(
    "/auth/change-admin-password",
    { currentPassword: adminPassword, newPassword: replacement },
    admin,
  )
  await post("/auth/login", { password: adminPassword }, undefined, 401)
  await post("/auth/verify", {}, otherAdmin, 401)
  const session = (await post("/auth/login", { password: replacement })).token
  await post("/auth/admin-logout", {}, session)
  await post("/auth/verify", {}, session, 401)
})
