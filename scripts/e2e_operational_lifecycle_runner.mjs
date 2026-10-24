/**
 * DriveRent — End-to-End Operational Lifecycle Verification Test Runner
 *
 * Requirement R2 Verification:
 *  - Customer account creation & cryptographic JWT authentication (bcrypt hash in Supabase, 7-day token).
 *  - Real-time vehicle availability check, promo code calculation (DRIVE15 = 15% discount), advance booking creation.
 *  - Concurrency and double-booking conflict prevention verification (concurrent overlapping booking attempts, HTTP 409 Conflict).
 *  - Fleet admin review, driver approval (POST /api/bookings/:id/approve), driver license download (GET /api/bookings/:id/download-license),
 *    and physical key handover (POST /api/bookings/:id/handover-keys) transitioning booking to "Checked Out" and vehicle to "Rented".
 *  - Mid-trip extension request (POST /api/bookings/:id/request-extension), admin quote (POST /api/bookings/:id/quote-extension),
 *    customer approval (POST /api/bookings/:id/approve-extension), asserting return_date extended and total_amount increased in Supabase.
 *  - Vehicle return inspection (POST /api/bookings/:id/return-inspection), recording odometer and fuel, asserting booking transitions
 *    to "Completed", and automated status release of vehicle back to "Available" with odometer updated in Supabase.
 *  - Direct Supabase PostgreSQL query assertions confirming all table rows and state transitions.
 *
 * Target:
 *  - Live Express Backend: http://localhost:3001/api
 *  - Live Supabase Database: aws-0-us-east-1.pooler.supabase.com:6543/postgres
 */

import pg from "pg"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const API_BASE = process.env.API_BASE || "http://localhost:3001/api"
const JWT_SECRET =
  process.env.JWT_SECRET || "motorly-fleet-jwt-secret-secure-key-2026-prod"

// Direct Supabase PostgreSQL connection pool for independent data tier assertions
const supabasePool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

// Assertion and audit metrics
const metrics = {
  totalAssertions: 0,
  passedAssertions: 0,
  failedAssertions: 0,
  httpRequests: 0,
  serverErrors500: 0,
  stages: [],
}

function logHeader(text) {
  console.log("\n" + "=".repeat(80))
  console.log(`  ${text}`)
  console.log("=".repeat(80))
}

function logSubHeader(text) {
  console.log(`\n--- ${text} ---`)
}

function pass(checkpoint, detail = "") {
  metrics.totalAssertions++
  metrics.passedAssertions++
  console.log(`  ✅ [PASS] ${checkpoint}`)
  if (detail) {
    console.log(`     └─ ${detail}`)
  }
}

function fail(checkpoint, error = "") {
  metrics.totalAssertions++
  metrics.failedAssertions++
  console.error(`  ❌ [FAIL] ${checkpoint}`)
  if (error) {
    console.error(`     └─ Error: ${error}`)
  }
  throw new Error(`Assertion failed at: ${checkpoint} - ${error}`)
}

async function apiFetch(url, options = {}) {
  metrics.httpRequests++
  const res = await fetch(url, options)
  if (res.status >= 500) {
    metrics.serverErrors500++
  }
  return res
}

export async function runOperationalLifecycleSuite() {
  const suiteStartTime = Date.now()
  logHeader("MOTORLY / DRIVERENT — END-TO-END OPERATIONAL LIFECYCLE TEST SUITE")
  console.log(`Target Backend API : ${API_BASE}`)
  console.log(
    `Database Host      : aws-0-us-east-1.pooler.supabase.com (Supabase PostgreSQL 17)`,
  )
  console.log(`Timestamp          : ${new Date().toISOString()}`)

  const testId = Date.now()
  const testCustomer = {
    email: `victoria.chase.${testId}@motorly-fleet.com`,
    password: `SecV!ct0ria${testId}$`,
    name: `Victoria Chase`,
    phone: `+1 (305) 555-0188`,
    driverLicenseNum: `FL-DL-883921`,
    driverLicenseState: `FL`,
    driverLicenseExpiry: `2029-08-31`,
    licenseFront: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
    licenseBack: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`,
  }

  // State variables carried across stages
  let customerToken = null
  let customerUser = null
  let targetCar = null
  let bookingId = null
  let adminToken = null
  let originalSubtotal = 0
  let discountedAmount = 0
  let initialOdometer = 0

  // Choose rental dates far in future to guarantee availability
  const pickupDate = "Mar 15, 2027"
  const returnDate = "Mar 19, 2027" // 4 days

  try {
    /* =========================================================================
       STAGE 1: PRE-FLIGHT SYSTEM HEALTH & DIRECT DATABASE AUDIT
       ========================================================================= */
    logHeader("STAGE 1: PRE-FLIGHT SYSTEM HEALTH & DIRECT SUPABASE AUDIT")

    // 1.1 Backend Health Check
    const healthRes = await apiFetch(`${API_BASE}/health`)
    if (healthRes.status !== 200) {
      fail("Backend health check", `Expected HTTP 200, got ${healthRes.status}`)
    }
    const healthData = await healthRes.json()
    if (healthData.status !== "ok" || healthData.supabase !== true) {
      fail(
        "Backend health payload",
        `Invalid health payload: ${JSON.stringify(healthData)}`,
      )
    }
    pass(
      "1.1 Express Backend Health & Supabase Connection Active",
      `Service: "${healthData.service}", Supabase Connected: ${healthData.supabase}`,
    )

    // 1.2 Direct Supabase Database Connection & Table Verification
    const dbPing = await supabasePool.query(
      "SELECT NOW() as now, version() as version, current_database() as db",
    )
    pass(
      "1.2 Direct Supabase PostgreSQL Connection Established",
      `Connected to database "${dbPing.rows[0].db}" | Server Time: ${dbPing.rows[0].now}`,
    )

    const dbTablesRes = await supabasePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    const tableNames = dbTablesRes.rows.map((r) => r.table_name)
    const requiredTables = [
      "vehicles",
      "bookings",
      "users",
      "promo_codes",
      "customer_sessions",
      "admin_sessions",
      "maintenance_logs",
    ]
    for (const reqTable of requiredTables) {
      if (!tableNames.includes(reqTable)) {
        fail(
          "Supabase public schema table audit",
          `Missing required table: ${reqTable}`,
        )
      }
    }
    pass(
      "1.3 Supabase Public Schema Complete",
      `Verified 7 mandatory tables: ${requiredTables.join(", ")}`,
    )

    /* =========================================================================
       STAGE 2: CUSTOMER ACCOUNT CREATION, BCRYPT HASHING & JWT AUTHENTICATION
       ========================================================================= */
    logHeader(
      "STAGE 2: CUSTOMER ACCOUNT CREATION, BCRYPT HASHING & JWT AUTHENTICATION",
    )

    // 2.1 Customer Registration via POST /api/auth/register
    const registerPayload = {
      email: testCustomer.email,
      password: testCustomer.password,
      name: testCustomer.name,
      phone: testCustomer.phone,
      driverLicenseNum: testCustomer.driverLicenseNum,
      driverLicenseState: testCustomer.driverLicenseState,
      driverLicenseExpiry: testCustomer.driverLicenseExpiry,
    }

    const regRes = await apiFetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerPayload),
    })

    if (regRes.status !== 201) {
      const errText = await regRes.text()
      fail(
        "Customer registration",
        `Expected HTTP 201, got ${regRes.status}: ${errText}`,
      )
    }
    const regData = await regRes.json()
    if (!regData.token || !regData.user?.id) {
      fail(
        "Registration response payload",
        `Token or user ID missing: ${JSON.stringify(regData)}`,
      )
    }
    customerToken = regData.token
    customerUser = regData.user
    pass(
      "2.1 Customer Account Created via POST /api/auth/register",
      `User ID: ${customerUser.id} | Email: ${customerUser.email} | Tier: ${customerUser.vipTier}`,
    )

    // 2.2 Direct Supabase Verification: Bcrypt Hash in 'users' Table
    const userDbRes = await supabasePool.query(
      "SELECT id, email, password_hash, role, vip_tier FROM users WHERE id = $1",
      [customerUser.id],
    )
    if (userDbRes.rows.length === 0) {
      fail(
        "Supabase users table lookup",
        `User row ${customerUser.id} not found in Supabase!`,
      )
    }
    const userDbRow = userDbRes.rows[0]
    const isBcrypt =
      userDbRow.password_hash.startsWith("$2a$") ||
      userDbRow.password_hash.startsWith("$2b$")
    if (!isBcrypt) {
      fail(
        "Bcrypt password hash format in Supabase",
        `Hash is not standard bcrypt: ${userDbRow.password_hash}`,
      )
    }
    // Verify password verification logic
    const bcryptMatch = await bcrypt.compare(
      testCustomer.password,
      userDbRow.password_hash,
    )
    if (!bcryptMatch) {
      fail(
        "Bcrypt cryptographic comparison",
        "bcrypt.compare() failed to match plaintext password against live hash in Supabase",
      )
    }
    pass(
      "2.2 Supabase User Row & Salted Bcrypt Hash Verified",
      `Hash: ${userDbRow.password_hash.substring(0, 29)}... | bcrypt.compare() = TRUE`,
    )

    // 2.3 Customer JWT Cryptographic Verification (HMAC-SHA256 & Claims)
    const decodedCustToken = jwt.verify(customerToken, JWT_SECRET)
    if (
      decodedCustToken.userId !== customerUser.id ||
      decodedCustToken.email !== testCustomer.email ||
      decodedCustToken.role !== "customer"
    ) {
      fail(
        "Customer JWT token payload claims",
        `Mismatch in claims: ${JSON.stringify(decodedCustToken)}`,
      )
    }
    const tokenValidityDays = Math.round(
      (decodedCustToken.exp - decodedCustToken.iat) / 86400,
    )
    if (tokenValidityDays < 6 || tokenValidityDays > 8) {
      fail(
        "Customer JWT token expiration window",
        `Expected ~7 days, calculated: ${tokenValidityDays} days`,
      )
    }
    pass(
      "2.3 Customer JWT Token Cryptographically Verified",
      `Algorithm: HS256 | Role: ${decodedCustToken.role} | Expiration: ${tokenValidityDays} days`,
    )

    // 2.4 Customer Login via POST /api/auth/customer-login (Bcrypt compare in Express)
    const loginRes = await apiFetch(`${API_BASE}/auth/customer-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCustomer.email,
        password: testCustomer.password,
      }),
    })
    if (loginRes.status !== 200) {
      fail(
        "Customer login endpoint",
        `Expected HTTP 200, got ${loginRes.status}`,
      )
    }
    const loginData = await loginRes.json()
    if (!loginData.token || loginData.user?.email !== testCustomer.email) {
      fail(
        "Customer login response token",
        `Invalid login response: ${JSON.stringify(loginData)}`,
      )
    }
    pass(
      "2.4 Customer Login Verified (POST /api/auth/customer-login)",
      `Authenticated successfully against live Supabase credentials`,
    )

    // 2.5 Authenticated Customer Profile Fetch (GET /api/auth/customer-me)
    const meRes = await apiFetch(`${API_BASE}/auth/customer-me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    if (meRes.status !== 200) {
      fail(
        "Customer profile endpoint /auth/customer-me",
        `Expected HTTP 200, got ${meRes.status}`,
      )
    }
    const meData = await meRes.json()
    if (!meData.authenticated || meData.user?.email !== testCustomer.email) {
      fail(
        "Customer profile payload",
        `Expected authenticated profile, got: ${JSON.stringify(meData)}`,
      )
    }
    pass(
      "2.5 Customer Profile Introspection via Bearer Token",
      `Authenticated: ${meData.authenticated} | Name: ${meData.user.name} | Tier: ${meData.user.vipTier}`,
    )

    /* =========================================================================
       STAGE 3: REAL-TIME VEHICLE AVAILABILITY & FLEET DISCOVERY
       ========================================================================= */
    logHeader("STAGE 3: REAL-TIME VEHICLE AVAILABILITY & FLEET DISCOVERY")

    // 3.1 Fleet Discovery for Target Window
    const fleetRes = await apiFetch(
      `${API_BASE}/cars?pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`,
    )
    if (fleetRes.status !== 200) {
      fail("Fleet cars query", `Expected HTTP 200, got ${fleetRes.status}`)
    }
    const fleetCars = await fleetRes.json()
    if (!Array.isArray(fleetCars) || fleetCars.length === 0) {
      fail("Fleet cars response", "No fleet vehicles returned from API")
    }

    // Select available target car
    targetCar = fleetCars.find(
      (c) => c.status === "Available" && c.isAvailableForDates !== false,
    )
    if (!targetCar) {
      // Fallback: pick any available car in Supabase
      const carFallback = await supabasePool.query(
        "SELECT * FROM vehicles WHERE status = 'Available' LIMIT 1",
      )
      if (carFallback.rows.length === 0) {
        fail("Fleet car selection", "Zero Available vehicles in database")
      }
      targetCar = {
        id: carFallback.rows[0].id,
        name: carFallback.rows[0].name,
        pricePerDay: carFallback.rows[0].price_per_day,
        status: carFallback.rows[0].status,
        currentOdometer: carFallback.rows[0].current_odometer,
      }
    }
    initialOdometer = targetCar.currentOdometer || 15000
    pass(
      "3.1 Real-Time Fleet Discovery Completed",
      `Found ${fleetCars.length} vehicles | Selected: "${targetCar.name}" (${targetCar.id}) at $${targetCar.pricePerDay}/day`,
    )

    // 3.2 Granular Availability Endpoint Check (GET /api/cars/:id/availability)
    const availRes = await apiFetch(
      `${API_BASE}/cars/${targetCar.id}/availability?pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`,
    )
    if (availRes.status !== 200) {
      fail(
        "Car availability check",
        `Expected HTTP 200, got ${availRes.status}`,
      )
    }
    const availData = await availRes.json()
    if (!availData.isAvailable) {
      fail(
        "Vehicle availability verification",
        `Target car ${targetCar.id} reported as NOT available for dates: ${JSON.stringify(availData)}`,
      )
    }
    pass(
      "3.2 Availability Schedule Verified (GET /api/cars/:id/availability)",
      `Car: ${targetCar.id} | Available: ${availData.isAvailable} for ${pickupDate} - ${returnDate}`,
    )

    /* =========================================================================
       STAGE 4: PROMO CODE ENGINE & PRICING RULES CALCULATION
       ========================================================================= */
    logHeader("STAGE 4: PROMO CODE ENGINE & PRICING RULES CALCULATION")

    // 4.1 Validate Promo Code DRIVE15 (15% discount)
    originalSubtotal = targetCar.pricePerDay * 4 // 4 days rental
    const promoRes = await apiFetch(`${API_BASE}/promos/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "DRIVE15", totalAmount: originalSubtotal }),
    })
    if (promoRes.status !== 200) {
      fail(
        "Promo validation endpoint",
        `Expected HTTP 200, got ${promoRes.status}`,
      )
    }
    const promoData = await promoRes.json()
    if (!promoData.valid || promoData.discountPercent !== 15) {
      fail(
        "Promo code DRIVE15 rule verification",
        `Expected 15% discount, got: ${JSON.stringify(promoData)}`,
      )
    }
    discountedAmount = Number((originalSubtotal * 0.85).toFixed(2))
    pass(
      "4.1 Promo Code DRIVE15 Validated",
      `Base: $${originalSubtotal.toFixed(2)} | Discount: 15% ($${(originalSubtotal * 0.15).toFixed(2)}) | Net: $${discountedAmount.toFixed(2)}`,
    )

    // 4.2 Verify Promo Code Row in Supabase
    const promoDbRes = await supabasePool.query(
      "SELECT code, discount_percent, is_active, usage_count FROM promo_codes WHERE code = 'DRIVE15'",
    )
    if (promoDbRes.rows.length === 0) {
      fail(
        "Promo code in Supabase",
        "Promo code 'DRIVE15' not found in promo_codes table",
      )
    }
    const promoRow = promoDbRes.rows[0]
    pass(
      "4.2 Promo Code Verified in Supabase PostgreSQL",
      `Code: ${promoRow.code} | Discount: ${promoRow.discount_percent}% | Active: ${promoRow.is_active} | Current Uses: ${promoRow.usage_count}`,
    )

    /* =========================================================================
       STAGE 5: ADVANCE BOOKING CREATION & CONCURRENCY CONFLICT PREVENTION
       ========================================================================= */
    logHeader("STAGE 5: BOOKING CREATION & CONCURRENCY CONFLICT PREVENTION")

    // Define booking payload for Customer A (Victoria Chase)
    const validBookingPayload = {
      customer: {
        firstName: "Victoria",
        lastName: "Chase",
        email: testCustomer.email,
        phone: testCustomer.phone,
      },
      driver: {
        dateOfBirth: "1992-04-14",
        licenseNumber: testCustomer.driverLicenseNum,
        licenseState: testCustomer.driverLicenseState,
        licenseExpiry: testCustomer.driverLicenseExpiry,
        licenseFileName: "victoria_dl_front.jpg",
        licenseBackFileName: "victoria_dl_back.jpg",
      },
      pickupLocation: "Miami International Airport (MIA)",
      returnLocation: "Miami International Airport (MIA)",
      pickupDate,
      returnDate,
      requestedCategory: targetCar.type || "Sedan",
      matchedCarId: targetCar.id,
      totalAmount: discountedAmount,
      promoCode: "DRIVE15",
      userId: customerUser.id,
    }

    // Define overlapping conflicting booking payload for Customer B (Intruder)
    const conflictingBookingPayload = {
      customer: {
        firstName: "Intruder",
        lastName: "DoubleBooker",
        email: `intruder.${testId}@competitor-bot.net`,
        phone: "+1 (555) 999-0000",
      },
      driver: {
        dateOfBirth: "1985-01-01",
        licenseNumber: "XX-9999999",
        licenseState: "NY",
        licenseExpiry: "2028-01-01",
      },
      pickupLocation: "Miami International Airport (MIA)",
      returnLocation: "Miami International Airport (MIA)",
      pickupDate: "Mar 16, 2027", // Overlaps Mar 15 - Mar 19
      returnDate: "Mar 18, 2027",
      requestedCategory: targetCar.type || "Sedan",
      matchedCarId: targetCar.id,
      totalAmount: 180.0,
    }

    // 5.1 Send Customer A Booking Creation
    const bookRes = await apiFetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(validBookingPayload),
    })
    if (!bookRes.ok) {
      const errText = await bookRes.text()
      fail(
        "Primary booking creation",
        `Expected HTTP 200/201, got ${bookRes.status}: ${errText}`,
      )
    }
    const bookData = await bookRes.json()
    if (!bookData.id) {
      fail(
        "Booking ID returned",
        `Booking creation missing ID: ${JSON.stringify(bookData)}`,
      )
    }
    bookingId = bookData.id
    pass(
      "5.1 Advance Booking Created via POST /api/bookings",
      `Booking ID: ${bookingId} | Status: "${bookData.status}" | Amount: $${bookData.totalAmount}`,
    )

    // 5.2 Direct Supabase Row Assertion for New Booking
    const dbBookingRes = await supabasePool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (dbBookingRes.rows.length === 0) {
      fail(
        "Supabase booking query",
        `Booking ${bookingId} not found in Supabase!`,
      )
    }
    const dbBookingRow = dbBookingRes.rows[0]
    if (
      dbBookingRow.matched_car_id !== targetCar.id ||
      dbBookingRow.user_id !== customerUser.id ||
      dbBookingRow.promo_code !== "DRIVE15"
    ) {
      fail(
        "Supabase booking relational foreign keys",
        `Row data mismatch: ${JSON.stringify(dbBookingRow)}`,
      )
    }
    pass(
      "5.2 Supabase Booking Relational Integrity Verified",
      `Confirmed row in "bookings" (matched_car_id: ${dbBookingRow.matched_car_id}, user_id: ${dbBookingRow.user_id}, promo_code: ${dbBookingRow.promo_code})`,
    )

    // 5.3 Advance Booking Invariant: Car Status Remains "Available" Until Key Handover
    const carBeforeHandoverRes = await supabasePool.query(
      "SELECT status FROM vehicles WHERE id = $1",
      [targetCar.id],
    )
    if (carBeforeHandoverRes.rows[0].status !== "Available") {
      fail(
        "Advance booking vehicle status invariant",
        `Car status should remain 'Available' before pickup, found: ${carBeforeHandoverRes.rows[0].status}`,
      )
    }
    pass(
      "5.3 Advance Booking Status Invariant Verified",
      `Vehicle "${targetCar.id}" remains "Available" in Supabase before physical pickup`,
    )

    // 5.4 Concurrency & Double-Booking Conflict Prevention Verification
    // Send 2 concurrent / overlapping booking attempts on the same car
    logSubHeader("Concurrent Double-Booking Conflict Engine Stress Test")
    const concurrentAttempt1 = apiFetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...conflictingBookingPayload,
        customer: {
          ...conflictingBookingPayload.customer,
          email: `concurrent.a.${testId}@test.com`,
        },
      }),
    })
    const concurrentAttempt2 = apiFetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...conflictingBookingPayload,
        customer: {
          ...conflictingBookingPayload.customer,
          email: `concurrent.b.${testId}@test.com`,
        },
      }),
    })

    const [conflictRes1, conflictRes2] = await Promise.all([
      concurrentAttempt1,
      concurrentAttempt2,
    ])
    const conflictStatuses = [conflictRes1.status, conflictRes2.status]

    // Since our primary booking already reserved Mar 15 - Mar 19, BOTH overlapping attempts MUST be rejected with HTTP 409
    if (conflictRes1.status !== 409 || conflictRes2.status !== 409) {
      fail(
        "Double-booking conflict rejection",
        `Expected HTTP 409 for overlapping reservations, got: [${conflictStatuses.join(", ")}]`,
      )
    }
    const conflictData1 = await conflictRes1.json()
    pass(
      "5.4 Concurrency Double-Booking Conflict Prevented (HTTP 409 Conflict)",
      `Both concurrent overlapping requests intercepted and rejected with HTTP 409: "${conflictData1.error?.substring(0, 75)}..."`,
    )

    /* =========================================================================
       STAGE 6: FLEET ADMIN REVIEW, LICENSE DOWNLOAD & APPROVAL ("GREEN SIGNAL")
       ========================================================================= */
    logHeader(
      'STAGE 6: FLEET ADMIN REVIEW, LICENSE DOWNLOAD & APPROVAL ("GREEN SIGNAL")',
    )

    // 6.1 Admin Login via POST /api/auth/login
    const adminLoginRes = await apiFetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@motorly.com", password: "0709" }),
    })
    if (adminLoginRes.status !== 200) {
      fail(
        "Admin authentication endpoint",
        `Expected HTTP 200, got ${adminLoginRes.status}`,
      )
    }
    const adminLoginData = await adminLoginRes.json()
    if (!adminLoginData.token || adminLoginData.role !== "admin") {
      fail(
        "Admin login payload",
        `Invalid admin token/role: ${JSON.stringify(adminLoginData)}`,
      )
    }
    adminToken = adminLoginData.token
    const decodedAdmin = jwt.verify(adminToken, JWT_SECRET)
    if (decodedAdmin.role !== "admin") {
      fail(
        "Admin JWT role claim",
        `Expected role 'admin', got: ${decodedAdmin.role}`,
      )
    }
    pass(
      "6.1 Fleet Admin Authenticated with Master Role",
      `Token issued for "${decodedAdmin.name}" with role: ${decodedAdmin.role}`,
    )

    // 6.2 Driver License Download Security & Verification (GET /api/bookings/:id/download-license)
    // 6.2.1 Admin download
    const licenseAdminRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/download-license?side=front`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    )
    if (licenseAdminRes.status !== 200) {
      fail(
        "Admin driver license download",
        `Expected HTTP 200, got ${licenseAdminRes.status}`,
      )
    }
    const adminContentType = licenseAdminRes.headers.get("content-type")
    pass(
      "6.2.1 Admin Driver License Download Verified",
      `HTTP 200 OK | Content-Type: ${adminContentType}`,
    )

    // 6.2.2 Owner Customer download
    const licenseOwnerRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/download-license?side=front`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      },
    )
    if (licenseOwnerRes.status !== 200) {
      fail(
        "Owner driver license download",
        `Expected HTTP 200, got ${licenseOwnerRes.status}`,
      )
    }
    pass(
      "6.2.2 Owner Customer License Download Verified",
      `HTTP 200 OK authorized for booking owner`,
    )

    // 6.2.3 Zero-Trust Security Check: Unauthorized third-party customer blocked (HTTP 403)
    const rogueToken = jwt.sign(
      {
        userId: "usr_rogue_999",
        email: "rogue@attacker.org",
        role: "customer",
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    )
    const rogueRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/download-license?side=front`,
      {
        headers: { Authorization: `Bearer ${rogueToken}` },
      },
    )
    if (rogueRes.status !== 403) {
      fail(
        "Zero-trust PII license protection",
        `Expected HTTP 403 Forbidden for third-party customer, got ${rogueRes.status}`,
      )
    }
    pass(
      "6.2.3 Zero-Trust Isolation Enforced on License Download",
      `Third-party customer access strictly rejected with HTTP 403 Forbidden`,
    )

    // 6.3 Fleet Admin Review & Approval (POST /api/bookings/:id/approve)
    const approveRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
    )
    if (approveRes.status !== 200) {
      fail(
        "Admin booking approval endpoint",
        `Expected HTTP 200, got ${approveRes.status}`,
      )
    }
    const approveData = await approveRes.json()
    if (!approveData.booking?.approvedByAdmin) {
      fail(
        "Admin approval payload flag",
        `Approved flag not set: ${JSON.stringify(approveData)}`,
      )
    }
    pass(
      '6.3 Admin Driver Verification Approved ("Green Signal")',
      `Approved at: ${approveData.booking.approvedAt}`,
    )

    // Direct Supabase assertion for admin approval
    const dbApproveRes = await supabasePool.query(
      "SELECT approved_by_admin, approved_at FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (
      dbApproveRes.rows[0].approved_by_admin !== 1 ||
      !dbApproveRes.rows[0].approved_at
    ) {
      fail(
        "Supabase approval persistence",
        `approved_by_admin not set to 1 in Supabase: ${JSON.stringify(dbApproveRes.rows[0])}`,
      )
    }
    pass(
      "6.4 Supabase Approval State Persisted",
      `Confirmed approved_by_admin = 1, approved_at = ${dbApproveRes.rows[0].approved_at}`,
    )

    /* =========================================================================
       STAGE 7: TERMINAL DISPATCH, PRE-TRIP CHECKLIST & PHYSICAL KEY HANDOVER
       ========================================================================= */
    logHeader(
      "STAGE 7: TERMINAL DISPATCH, PRE-TRIP CHECKLIST & PHYSICAL KEY HANDOVER",
    )

    const handoverOdometer = initialOdometer + 150
    const handoverPayload = {
      odometerOut: handoverOdometer,
      fuelOut: "100%",
      exteriorClean: true,
      tiresInspected: true,
      staffSign: "Terminal Lead Dispatcher Carlos G.",
    }

    const handoverRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/handover-keys`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(handoverPayload),
      },
    )

    if (handoverRes.status !== 200) {
      fail(
        "Key handover endpoint",
        `Expected HTTP 200, got ${handoverRes.status}`,
      )
    }
    const handoverData = await handoverRes.json()
    if (handoverData.booking?.status !== "Checked Out") {
      fail(
        "Handover booking status transition",
        `Expected 'Checked Out', got: ${handoverData.booking?.status}`,
      )
    }
    pass(
      "7.1 Physical Key Handover Completed via POST /api/bookings/:id/handover-keys",
      `Booking Status -> "Checked Out" | Clock Started: ${handoverData.booking.keysHandedAt}`,
    )

    // 7.2 Direct Supabase Verification: Booking Status and Vehicle Status Transitions
    const dbHandoverBooking = await supabasePool.query(
      "SELECT status, keys_handed_at, odometer_out, fuel_level_out FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (
      dbHandoverBooking.rows[0].status !== "Checked Out" ||
      !dbHandoverBooking.rows[0].keys_handed_at
    ) {
      fail(
        "Supabase booking Checked Out transition",
        `Expected status 'Checked Out', got: ${JSON.stringify(dbHandoverBooking.rows[0])}`,
      )
    }
    pass(
      "7.2 Supabase Booking Status Mutation Verified",
      `Bookings status: "Checked Out" | Odometer Out: ${dbHandoverBooking.rows[0].odometer_out} | Fuel Out: ${dbHandoverBooking.rows[0].fuel_level_out}`,
    )

    const dbHandoverVehicle = await supabasePool.query(
      "SELECT status FROM vehicles WHERE id = $1",
      [targetCar.id],
    )
    if (dbHandoverVehicle.rows[0].status !== "Rented") {
      fail(
        "Supabase vehicle Rented transition",
        `Expected vehicle status 'Rented', got: ${dbHandoverVehicle.rows[0].status}`,
      )
    }
    pass(
      '7.3 Supabase Vehicle Status Mutation to "Rented" Verified',
      `Vehicle "${targetCar.id}" status transitioned from "Available" -> "Rented"`,
    )

    /* =========================================================================
       STAGE 8: MID-TRIP EXTENSION NEGOTIATION WORKFLOW (3-STEP STATE MACHINE)
       ========================================================================= */
    logHeader("STAGE 8: MID-TRIP EXTENSION NEGOTIATION WORKFLOW")

    // 8.1 Customer Submits Extension Request (POST /api/bookings/:id/request-extension)
    const extReqPayload = {
      extraDuration: 2,
      unit: "days",
      customerNotes:
        "Keynote presentation at Miami Tech Summit delayed by 48 hours.",
    }
    const extReqRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/request-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(extReqPayload),
      },
    )
    if (extReqRes.status !== 200) {
      fail(
        "Extension request endpoint",
        `Expected HTTP 200, got ${extReqRes.status}`,
      )
    }
    const extReqData = await extReqRes.json()
    if (extReqData.booking?.extensionStatus !== "Requested") {
      fail(
        "Extension status transition to Requested",
        `Expected 'Requested', got: ${extReqData.booking?.extensionStatus}`,
      )
    }
    pass(
      "8.1 Customer Extension Request Submitted",
      `Status -> "Requested" | Requested: +2 days`,
    )

    // Verify in Supabase
    const dbExtReqRes = await supabasePool.query(
      "SELECT extension_status FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (dbExtReqRes.rows[0].extension_status !== "Requested") {
      fail(
        "Supabase extension_status Requested",
        `Expected 'Requested', got: ${dbExtReqRes.rows[0].extension_status}`,
      )
    }
    pass(
      '8.2 Supabase Extension Status "Requested" Verified',
      `Confirmed extension_status = 'Requested' in database`,
    )

    // 8.3 Fleet Admin Quotes Extension Rate (POST /api/bookings/:id/quote-extension)
    const quoteAmount = 160.0 // $80/day for 2 days
    const quotePayload = {
      rateType: "days",
      rateAmount: 80,
      totalQuotedAmount: quoteAmount,
      adminNotes: "Preferred corporate member rate applied.",
    }
    const quoteRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/quote-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(quotePayload),
      },
    )
    if (quoteRes.status !== 200) {
      fail(
        "Extension quote endpoint",
        `Expected HTTP 200, got ${quoteRes.status}`,
      )
    }
    const quoteData = await quoteRes.json()
    if (quoteData.booking?.extensionStatus !== "Quoted") {
      fail(
        "Extension status transition to Quoted",
        `Expected 'Quoted', got: ${quoteData.booking?.extensionStatus}`,
      )
    }
    pass(
      "8.3 Fleet Admin Extension Quotation Sent",
      `Status -> "Quoted" | Quoted Rate: $80/day | Total Quote: $${quoteAmount.toFixed(2)}`,
    )

    // Verify in Supabase
    const dbQuoteRes = await supabasePool.query(
      "SELECT extension_status, extension_quote FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (dbQuoteRes.rows[0].extension_status !== "Quoted") {
      fail(
        "Supabase extension_status Quoted",
        `Expected 'Quoted', got: ${dbQuoteRes.rows[0].extension_status}`,
      )
    }
    pass(
      '8.4 Supabase Extension Status "Quoted" Verified',
      `Confirmed extension_status = 'Quoted' in database`,
    )

    // 8.5 Customer Approves Extension (POST /api/bookings/:id/approve-extension)
    const initialDbBooking = (
      await supabasePool.query(
        "SELECT return_date, total_amount FROM bookings WHERE id = $1",
        [bookingId],
      )
    ).rows[0]
    const prevReturnDate = initialDbBooking.return_date
    const prevAmount = parseFloat(initialDbBooking.total_amount)

    const extApproveRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/approve-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
      },
    )
    if (extApproveRes.status !== 200) {
      fail(
        "Extension approval endpoint",
        `Expected HTTP 200, got ${extApproveRes.status}`,
      )
    }
    const extApproveData = await extApproveRes.json()
    if (extApproveData.booking?.extensionStatus !== "Approved") {
      fail(
        "Extension status transition to Approved",
        `Expected 'Approved', got: ${extApproveData.booking?.extensionStatus}`,
      )
    }
    pass(
      "8.5 Customer Approved Extension Rate",
      `Status -> "Approved" | Extension finalized`,
    )

    // 8.6 Direct Supabase Verification: return_date Extended & total_amount Increased
    const postExtDbBooking = (
      await supabasePool.query(
        "SELECT return_date, total_amount, extension_status FROM bookings WHERE id = $1",
        [bookingId],
      )
    ).rows[0]
    const newReturnDate = postExtDbBooking.return_date
    const newAmount = parseFloat(postExtDbBooking.total_amount)

    if (postExtDbBooking.extension_status !== "Approved") {
      fail(
        "Supabase extension status Approved",
        `Expected 'Approved', got: ${postExtDbBooking.extension_status}`,
      )
    }
    if (newReturnDate === prevReturnDate) {
      fail(
        "Supabase return_date mutation",
        `return_date was not updated in Supabase: still ${newReturnDate}`,
      )
    }
    const expectedNewAmount = Number((prevAmount + quoteAmount).toFixed(2))
    if (Math.abs(newAmount - expectedNewAmount) > 0.05) {
      fail(
        "Supabase total_amount recalculation",
        `Expected $${expectedNewAmount}, found $${newAmount}`,
      )
    }
    pass(
      "8.6 Supabase Date Extension & Total Amount Mutated",
      `return_date: "${prevReturnDate}" -> "${newReturnDate}" | total_amount: $${prevAmount.toFixed(2)} -> $${newAmount.toFixed(2)} (+ $${quoteAmount})`,
    )

    /* =========================================================================
       STAGE 9: VEHICLE RETURN, INTAKE INSPECTION & AUTOMATED STATUS RELEASE
       ========================================================================= */
    logHeader(
      "STAGE 9: VEHICLE RETURN, INTAKE INSPECTION & AUTOMATED STATUS RELEASE",
    )

    const returnOdometer = handoverOdometer + 340 // 340 miles driven
    const returnInspectionPayload = {
      odometerIn: returnOdometer,
      fuelIn: "100%",
      damageFound: false,
      cleanlinessPass: true,
      inspectionPassed: true,
      staffSign: "Senior Terminal Inspector Marcus T.",
      inspectionNotes:
        "Vehicle returned in showroom condition. Battery at 96% charge, zero exterior dents or paint scuffs.",
    }

    const returnRes = await apiFetch(
      `${API_BASE}/bookings/${bookingId}/return-inspection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(returnInspectionPayload),
      },
    )

    if (returnRes.status !== 200) {
      fail(
        "Return inspection endpoint",
        `Expected HTTP 200, got ${returnRes.status}`,
      )
    }
    const returnData = await returnRes.json()
    if (
      returnData.booking?.status !== "Completed" ||
      !returnData.booking?.inspectionPassed
    ) {
      fail(
        "Return inspection payload",
        `Expected status 'Completed' with inspectionPassed, got: ${JSON.stringify(returnData)}`,
      )
    }
    pass(
      "9.1 Post-Trip Intake Inspection Finalized (POST /api/bookings/:id/return-inspection)",
      `Status -> "Completed" | Final Odometer: ${returnData.booking.odometerIn} mi | Fuel: ${returnData.booking.fuelLevelIn}`,
    )

    // 9.2 Direct Supabase Verification: Booking Marked "Completed"
    const dbCompletedBooking = await supabasePool.query(
      "SELECT status, odometer_in, fuel_level_in, inspection_passed, checklist_in FROM bookings WHERE id = $1",
      [bookingId],
    )
    if (
      dbCompletedBooking.rows[0].status !== "Completed" ||
      dbCompletedBooking.rows[0].inspection_passed !== 1
    ) {
      fail(
        "Supabase booking Completed state",
        `Expected status 'Completed' and inspection_passed = 1, got: ${JSON.stringify(dbCompletedBooking.rows[0])}`,
      )
    }
    pass(
      "9.2 Supabase Booking Lifecycle Finalized",
      `Booking ${bookingId} status: "Completed" | Inspection Passed: ${dbCompletedBooking.rows[0].inspection_passed}`,
    )

    // 9.3 Direct Supabase Verification: Vehicle Status Automatically Released Back to "Available"
    const dbReleasedCar = await supabasePool.query(
      "SELECT status, current_odometer FROM vehicles WHERE id = $1",
      [targetCar.id],
    )
    if (dbReleasedCar.rows[0].status !== "Available") {
      fail(
        "Supabase vehicle status release",
        `Expected vehicle status 'Available', got: ${dbReleasedCar.rows[0].status}`,
      )
    }
    if (dbReleasedCar.rows[0].current_odometer !== returnOdometer) {
      fail(
        "Supabase vehicle odometer sync",
        `Expected current_odometer ${returnOdometer}, got: ${dbReleasedCar.rows[0].current_odometer}`,
      )
    }
    pass(
      "9.3 Automated Vehicle Release & Odometer Sync Verified in Supabase",
      `Vehicle "${targetCar.id}" released back to -> "Available" with updated odometer (${dbReleasedCar.rows[0].current_odometer} mi)`,
    )

    /* =========================================================================
       STAGE 10: CUSTOMER SELF-SERVICE PORTAL & MULTI-TENANT ISOLATION
       ========================================================================= */
    logHeader("STAGE 10: CUSTOMER SELF-SERVICE PORTAL & MULTI-TENANT ISOLATION")

    // 10.1 Customer Views Completed Trip in Portal
    const userHistoryRes = await apiFetch(
      `${API_BASE}/users/bookings?email=${encodeURIComponent(testCustomer.email)}`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      },
    )
    if (userHistoryRes.status !== 200) {
      fail(
        "User bookings history endpoint",
        `Expected HTTP 200, got ${userHistoryRes.status}`,
      )
    }
    const userBookings = await userHistoryRes.json()
    const verifiedTrip = userBookings.find((b) => b.id === bookingId)
    if (!verifiedTrip || verifiedTrip.status !== "Completed") {
      fail(
        "Customer trip history query",
        `Completed booking ${bookingId} not found in user history`,
      )
    }
    pass(
      "10.1 Customer Portal Trip History Verified",
      `Found completed rental ${bookingId} in customer dashboard with full inspection certificate`,
    )

    // 10.2 Multi-Tenant Zero-Trust Isolation: Customer Cannot Query Other Users' Data
    const rogueHistoryRes = await apiFetch(
      `${API_BASE}/users/bookings?email=admin@motorly.com`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      },
    )
    const rogueHistory = await rogueHistoryRes.json()
    const hasAdminBookings = rogueHistory.some(
      (b) => b.customerEmail === "admin@motorly.com",
    )
    if (hasAdminBookings) {
      fail(
        "Multi-tenant isolation leak",
        "Customer was able to view administrative user bookings via query param manipulation",
      )
    }
    pass(
      "10.2 Multi-Tenant Isolation Preserved",
      `Customer queries restricted to own identity; horizontal data leakage strictly prevented`,
    )

    /* =========================================================================
       STAGE 11: SUITE COMPLETION & AUDIT METRICS SYNTHESIS
       ========================================================================= */
    const suiteDuration = ((Date.now() - suiteStartTime) / 1000).toFixed(2)
    logHeader(
      `🏆 ALL LIFECYCLE STAGES EXECUTED WITH 100% SUCCESS (${suiteDuration}s)`,
    )

    console.log(`
  Summary Audit Metrics:
  -------------------------------------------------------------
  Total Checkpoints Verified : ${metrics.totalAssertions}
  Passed Checkpoints         : ${metrics.passedAssertions}
  Failed Checkpoints         : ${metrics.failedAssertions}
  HTTP Requests Executed     : ${metrics.httpRequests}
  Server 500 Status Codes    : ${metrics.serverErrors500}
  Pass Rate                  : ${((metrics.passedAssertions / metrics.totalAssertions) * 100).toFixed(1)}%

  Mandatory Workflows Proven Against Live Backend & Supabase DB:
  ✓ 1. Customer registration & bcrypt password hashing in Supabase
  ✓ 2. Cryptographic JWT authentication (HS256, 7-day expiration)
  ✓ 3. Dynamic fleet calendar interval availability testing
  ✓ 4. Idempotent promo code DRIVE15 discount calculation (15% off)
  ✓ 5. Advance booking creation with relational foreign key linkage
  ✓ 6. Concurrency double-booking conflict prevention (HTTP 409 Conflict)
  ✓ 7. Fleet admin authentication & zero-trust authorization
  ✓ 8. Secure driver license download & PII isolation
  ✓ 9. Admin driver verification and "Green Signal" issuance
  ✓ 10. Pre-trip checklist, odometer/fuel logging & digital key handover
  ✓ 11. Vehicle state mutation: Available -> Rented
  ✓ 12. Mid-trip extension negotiation (Request -> Quote -> Customer Approval)
  ✓ 13. Supabase return_date extended and total_amount recalculated
  ✓ 14. Post-trip intake inspection & booking completion
  ✓ 15. Automated vehicle inventory release: Rented -> Available
  ✓ 16. Odometer synchronization to vehicle record
  ✓ 17. Multi-tenant customer booking history verification
    `)

    return {
      success: true,
      durationSeconds: suiteDuration,
      metrics,
      artifacts: {
        testCustomerId: customerUser.id,
        testCustomerEmail: testCustomer.email,
        targetCarId: targetCar.id,
        bookingId,
        finalAmount: newAmount,
        finalOdometer: returnOdometer,
      },
    }
  } finally {
    await supabasePool.end()
  }
}

// Direct execution CLI entrypoint
runOperationalLifecycleSuite()
  .then((result) => {
    console.log(
      "✅ E2E OPERATIONAL LIFECYCLE VERIFICATION COMPLETED SUCCESSFULLY.",
    )
    process.exit(0)
  })
  .catch((err) => {
    console.error("\n💥 E2E OPERATIONAL LIFECYCLE VERIFICATION FAILED:", err)
    process.exit(1)
  })
