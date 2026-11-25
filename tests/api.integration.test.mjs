import assert from "node:assert/strict"
import { once } from "node:events"
import { after, before, test } from "node:test"

const postgresUrl = process.env.MOTORLY_TEST_DATABASE_URL
const adminPassword = "motorly-integration-test-password"
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
  process.env.JWT_SECRET = "motorly-integration-test-secret-local-only"
  process.env.ADMIN_PASSWORD = adminPassword
  process.env.ADMIN_PASSWORD_HASH = ""
  process.env.SMTP_USER = ""
  process.env.SMTP_PASS = ""
  process.env.GOOGLE_OAUTH_CLIENT_ID = "motorly-tests.apps.googleusercontent.com"
  process.env.VERCEL = "1"
  if (postgresUrl) {
    const selected = new URL(postgresUrl)
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(selected.hostname))
    assert.match(selected.pathname, /^\/motorly_test\w*$/)
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

test("a passcode change replaces the bootstrap password and invalidates other admin sessions", async () => {
  const otherAdmin = (await post("/auth/login", { password: adminPassword })).token
  const replacement = "motorly-replacement-passcode"
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
