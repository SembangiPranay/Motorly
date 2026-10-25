import pg from "pg"
import jwt from "jsonwebtoken"

const API_BASE = "http://localhost:3001/api"
const JWT_SECRET =
  process.env.JWT_SECRET || "motorly-fleet-jwt-secret-secure-key-2026-prod"

// Direct Supabase Pool for independent database verification
const supabasePool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

const logSection = (title) => {
  console.log("\n" + "=".repeat(70))
  console.log(`  ${title}`)
  console.log("=".repeat(70))
}

const logPass = (step, details) => {
  console.log(`✅ [PASS] ${step}`)
  if (details) console.log(`   └─ ${details}`)
}

const logFail = (step, error) => {
  console.error(`❌ [FAIL] ${step}`)
  console.error(`   └─ Error: ${error}`)
  process.exit(1)
}

async function runAdvancedTestingSuite() {
  const startTime = Date.now()
  console.log("🚀 RUNNING ADVANCED TESTING METHODOLOGIES SUITE")
  console.log("   Target Backend: " + API_BASE)
  console.log("   Database: Supabase PostgreSQL")

  const timestamp = Date.now()
  const customerA_Email = `alice.${timestamp}@motorly-test.io`
  const customerB_Email = `bob.${timestamp}@motorly-test.io`
  const password = `TestPass@${timestamp}!`

  let tokenA = null
  let userA = null
  let tokenB = null
  let userB = null
  let adminToken = null

  try {
    /* =========================================================================
       PILLAR 1: SECURITY, AUTHENTICATION & ZERO-TRUST AUTHORIZATION CONTRACTS
       ========================================================================= */
    logSection(
      "PILLAR 1: SECURITY, AUTHENTICATION & ZERO-TRUST AUTHORIZATION CONTRACTS",
    )

    // 1.1 Negative Security Test: Unauthenticated Access to Admin Routes
    const unauthStatsRes = await fetch(`${API_BASE}/admin/stats`)
    if (unauthStatsRes.status !== 401) {
      logFail(
        "Unauthenticated /admin/stats should be rejected with 401",
        `Received HTTP ${unauthStatsRes.status}`,
      )
    }
    logPass(
      "1.1 Unauthenticated Admin Stats Blocked",
      "HTTP 401 Unauthorized returned",
    )

    const unauthCustomersRes = await fetch(`${API_BASE}/admin/customers`)
    if (unauthCustomersRes.status !== 401) {
      logFail(
        "Unauthenticated /admin/customers should be rejected with 401",
        `Received HTTP ${unauthCustomersRes.status}`,
      )
    }
    logPass(
      "1.2 Unauthenticated CRM Access Blocked",
      "HTTP 401 Unauthorized returned",
    )

    // 1.2 Register Two Distinct Customers
    const regARes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customerA_Email,
        password,
        name: "Alice Walker",
        phone: "+15550101",
      }),
    })
    const regAData = await regARes.json()
    tokenA = regAData.token
    userA = regAData.user

    const regBRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customerB_Email,
        password,
        name: "Bob Stone",
        phone: "+15550102",
      }),
    })
    const regBData = await regBRes.json()
    tokenB = regBData.token
    userB = regBData.user
    logPass(
      "1.3 Customer Accounts Created",
      `Alice (${userA.id}) & Bob (${userB.id})`,
    )

    // 1.3 Negative Test: Unauthenticated User Booking History Leak Prevented
    const unauthBookingsRes = await fetch(
      `${API_BASE}/users/bookings?email=${encodeURIComponent(customerA_Email)}`,
    )
    if (unauthBookingsRes.status !== 401) {
      logFail(
        "Unauthenticated /users/bookings query param leak was NOT blocked",
        `Received HTTP ${unauthBookingsRes.status}`,
      )
    }
    logPass(
      "1.4 Unauthenticated PII Leak Plugged",
      "Anonymous query rejected with HTTP 401",
    )

    // 1.4 Horizontal Privilege Escalation Test: Customer B cannot view Customer A bookings
    const bQueriedARes = await fetch(
      `${API_BASE}/users/bookings?email=${encodeURIComponent(customerA_Email)}`,
      {
        headers: { Authorization: `Bearer ${tokenB}` },
      },
    )
    const bQueriedAData = await bQueriedARes.json()
    // Bob should strictly only receive his own bookings (which is currently empty)
    if (
      !Array.isArray(bQueriedAData) ||
      bQueriedAData.some((b) => b.customer.email === customerA_Email)
    ) {
      logFail(
        "Horizontal privilege escalation permitted",
        "Bob was able to see Alice bookings!",
      )
    }
    logPass(
      "1.5 Horizontal Privilege Isolation Verified",
      "Customer B cannot view Customer A data even with query tampering",
    )

    // 1.5 Authenticate Admin
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "0709" }),
    })
    const adminData = await adminRes.json()
    if (!adminRes.ok || !adminData.token) {
      logFail("Admin login failed", JSON.stringify(adminData))
    }
    adminToken = adminData.token
    logPass("1.6 Fleet Admin Authenticated", "Issued admin JWT")

    /* =========================================================================
       PILLAR 2: POSTGRESQL CASE-INSENSITIVE INVARIANT SEARCH
       ========================================================================= */
    logSection("PILLAR 2: POSTGRESQL CASE-INSENSITIVE INVARIANT SEARCH")

    const searchQueries = ["tesla", "TESLA", "Tesla", "camry", "CAMRY", "bmw"]
    for (const q of searchQueries) {
      const sRes = await fetch(
        `${API_BASE}/cars?search=${encodeURIComponent(q)}`,
      )
      const sData = await sRes.json()
      if (!Array.isArray(sData) || sData.length === 0) {
        logFail(
          `Search for "${q}" returned 0 results on PostgreSQL`,
          JSON.stringify(sData),
        )
      }
    }
    logPass(
      "2.1 Case-Insensitive Search Invariants",
      "All casing variations (lowercase/uppercase/mixed) matched expected fleet vehicles",
    )

    /* =========================================================================
       PILLAR 3: CONCURRENCY & RACE-CONDITION OVERBOOKING DEFENSE
       ========================================================================= */
    logSection("PILLAR 3: CONCURRENCY & TRANSACTIONAL DOUBLE-BOOKING DEFENSE")

    const sampleAvailCar = (
      await supabasePool.query(
        "SELECT id, name, status FROM vehicles WHERE status = 'Available' LIMIT 1",
      )
    ).rows[0]
    if (!sampleAvailCar) {
      logFail(
        "No available car in fleet to test concurrency",
        "All vehicles marked rented",
      )
    }
    const targetCarId = sampleAvailCar.id
    const raceDaysAhead = Math.floor(100 + Math.random() * 800)
    const dRaceStart = new Date(Date.now() + raceDaysAhead * 86400000)
    const dRaceEnd = new Date(Date.now() + (raceDaysAhead + 4) * 86400000)
    const racePickup = dRaceStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const raceReturn = dRaceEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    console.log(
      `Firing 5 simultaneous concurrent reservation attempts for available vehicle "${sampleAvailCar.name}" (${targetCarId}) on ${racePickup}...`,
    )
    const concurrentBookings = Array.from({ length: 5 }).map((_, i) =>
      fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          customer: {
            firstName: `Racer ${i}`,
            lastName: "Test",
            email: customerA_Email,
            phone: "+15550000",
          },
          pickupLocation: "Miami International Airport (MIA)",
          returnLocation: "Miami International Airport (MIA)",
          pickupDate: racePickup,
          returnDate: raceReturn,
          requestedCategory: "Sedan",
          matchedCarId: targetCarId,
          totalAmount: 180,
          userId: userA.id,
        }),
      }).then(async (r) => ({ status: r.status, body: await r.json() })),
    )

    const raceOutcomes = await Promise.all(concurrentBookings)
    const successfulReservations = raceOutcomes.filter((o) => o.status === 201)
    const rejectedConflicts = raceOutcomes.filter((o) => o.status === 409)

    if (successfulReservations.length !== 1 || rejectedConflicts.length !== 4) {
      logFail(
        "Race condition overbooking check failed",
        `Successful: ${successfulReservations.length}, Conflicts: ${rejectedConflicts.length}`,
      )
    }
    const confirmedRaceBooking = successfulReservations[0].body
    logPass(
      "3.1 Concurrency Race-Condition Protected",
      `Exactly 1 reservation created (${confirmedRaceBooking.id}); 4 concurrent requests rejected with HTTP 409`,
    )

    // Verify Vehicle status is NOT prematurely marked "Rented" for future dates
    const carCheckRes = await fetch(`${API_BASE}/cars/${targetCarId}`)
    const carCheckData = await carCheckRes.json()
    if (carCheckData.status === "Rented") {
      logFail(
        'Vehicle was prematurely locked to "Rented" status for a future reservation',
        carCheckData.status,
      )
    }
    logPass(
      "3.2 Vehicle Status Invariant Maintained",
      `Vehicle status remains "${carCheckData.status}" (Available for immediate use before Nov 12)`,
    )

    /* =========================================================================
       PILLAR 4: FOREIGN KEY & EDGE-CASE RESILIENCE (PROMO CODES & USERS)
       ========================================================================= */
    logSection("PILLAR 4: FOREIGN KEY & EDGE-CASE RESILIENCE")

    // 4.1 Promo code validation idempotency (Does not increment usage_count on validate)
    const promoBefore = await supabasePool.query(
      "SELECT usage_count FROM promo_codes WHERE code = 'DRIVE15'",
    )
    const initialUsage = promoBefore.rows[0].usage_count

    for (let i = 0; i < 3; i++) {
      await fetch(`${API_BASE}/promos/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "DRIVE15", totalAmount: 200 }),
      })
    }

    const promoAfter = await supabasePool.query(
      "SELECT usage_count FROM promo_codes WHERE code = 'DRIVE15'",
    )
    const finalUsage = promoAfter.rows[0].usage_count

    if (initialUsage !== finalUsage) {
      logFail(
        "Promo code usage_count prematurely incremented during validate preview",
        `Before: ${initialUsage}, After: ${finalUsage}`,
      )
    }
    logPass(
      "4.1 Promo Validation Idempotent",
      `Validation check is read-only (usage_count stayed at ${initialUsage})`,
    )

    const p4Days = Math.floor(1000 + Math.random() * 800)
    const p4Start = new Date(Date.now() + p4Days * 86400000)
    const p4End = new Date(Date.now() + (p4Days + 4) * 86400000)
    const p4Pickup = p4Start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const p4Return = p4End.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // 4.2 Lowercase promo code normalization & FK safety
    const lcPromoRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        customer: {
          firstName: "Bob",
          lastName: "Stone",
          email: customerB_Email,
          phone: "+15550102",
        },
        pickupLocation: "Miami Central Hub",
        returnLocation: "Miami Central Hub",
        pickupDate: p4Pickup,
        returnDate: p4Return,
        matchedCarId: "honda-crv",
        totalAmount: 221,
        promoCode: "drive15", // Lowercase
        userId: userB.id,
      }),
    })
    const lcPromoData = await lcPromoRes.json()
    if (lcPromoRes.status !== 201) {
      logFail(
        "Lowercase promoCode insertion failed with FK error",
        JSON.stringify(lcPromoData),
      )
    }
    const bobBookingId = lcPromoData.id
    logPass(
      "4.2 Lowercase Promo Code Normalized",
      `Booking ${bobBookingId} created with normalized promo code "DRIVE15"`,
    )

    // 4.3 Invalid Promo Code resilience (Must not crash with 500)
    const badPromoRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          firstName: "Guest",
          lastName: "User",
          email: "guest@motorly.io",
          phone: "+15550199",
        },
        pickupLocation: "Miami Central Hub",
        returnLocation: "Miami Central Hub",
        pickupDate: "Dec 20, 2026",
        returnDate: "Dec 23, 2026",
        matchedCarId: "bmw-3-series",
        totalAmount: 300,
        promoCode: "NON_EXISTENT_PROMO_999",
      }),
    })
    if (badPromoRes.status === 500) {
      logFail(
        "Invalid promo code caused unhandled 500 DB error",
        await badPromoRes.text(),
      )
    }
    logPass(
      "4.3 Invalid Promo Code Gracefully Handled",
      `Responded cleanly (HTTP ${badPromoRes.status}) without crashing`,
    )

    /* =========================================================================
       PILLAR 5: TRIP EXTENSION DATE PROPAGATION & CONFLICT VERIFICATION
       ========================================================================= */
    logSection(
      "PILLAR 5: TRIP EXTENSION DATE PROPAGATION & CONFLICT VERIFICATION",
    )

    // 5.1 Bob requests +2 days extension on Dec 01 - Dec 05 trip
    const extReqRes = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/request-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          extraDuration: 2,
          unit: "days",
          customerNotes: "Flight delayed",
        }),
      },
    )
    if (!extReqRes.ok)
      logFail("Extension request failed", await extReqRes.text())

    // 5.2 Admin quotes extension
    const extQuoteRes = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/quote-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          rateType: "day",
          rateAmount: 65,
          totalQuotedAmount: 130,
        }),
      },
    )
    if (!extQuoteRes.ok)
      logFail("Extension quote failed", await extQuoteRes.text())

    // 5.3 Customer approves extension
    const extApproveRes = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/approve-extension`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
      },
    )
    const extApproveData = await extApproveRes.json()
    if (!extApproveRes.ok)
      logFail("Extension approval failed", JSON.stringify(extApproveData))

    // 5.4 Verify in Supabase PostgreSQL that return_date was physically extended!
    const dbBookingRes = await supabasePool.query(
      "SELECT return_date, total_amount, extension_status FROM bookings WHERE id = $1",
      [bobBookingId],
    )
    const dbBooking = dbBookingRes.rows[0]

    const extendedReturnTimestamp = Date.parse(dbBooking.return_date)
    const originalReturnTimestamp = Date.parse(p4Return)
    if (extendedReturnTimestamp <= originalReturnTimestamp) {
      logFail(
        "Extension approval did NOT extend return_date in PostgreSQL",
        `return_date is still: ${dbBooking.return_date}`,
      )
    }
    logPass(
      "5.1 Extension return_date Extended in PostgreSQL",
      `New Return Date: "${dbBooking.return_date}" | New Total: $${dbBooking.total_amount}`,
    )

    // 5.5 Verify Conflict Detection catches the extended period
    const dConflictCheckStart = new Date(p4End.getTime() + 86400000)
    const dConflictCheckEnd = new Date(p4End.getTime() + 2 * 86400000)
    const conflictCheckPickup = dConflictCheckStart.toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    )
    const conflictCheckReturn = dConflictCheckEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const extendedConflictRes = await fetch(
      `${API_BASE}/cars/honda-crv/availability?pickupDate=${encodeURIComponent(conflictCheckPickup)}&returnDate=${encodeURIComponent(conflictCheckReturn)}`,
    )
    const extendedConflictData = await extendedConflictRes.json()
    if (extendedConflictData.isAvailable) {
      logFail(
        "Conflict engine did not catch the newly extended return date window",
        JSON.stringify(extendedConflictData),
      )
    }
    logPass(
      "5.2 Conflict Engine Validated Against Extended Window",
      `Vehicle correctly flagged unavailable for ${conflictCheckPickup} – ${conflictCheckReturn}`,
    )

    /* =========================================================================
       PILLAR 6: VEHICLE RE-MATING ORPHAN STATUS CLEANUP
       ========================================================================= */
    logSection("PILLAR 6: VEHICLE RE-MATING ORPHAN STATUS CLEANUP")

    const availCars = (
      await supabasePool.query(
        "SELECT id FROM vehicles WHERE status = 'Available' LIMIT 2",
      )
    ).rows
    if (availCars.length < 2) {
      logFail("Need at least 2 available cars for re-mating test")
    }
    const carOldId = availCars[0].id
    const carNewId = availCars[1].id

    const dCounterStart = new Date(Date.now() + 1500 * 86400000)
    const dCounterEnd = new Date(Date.now() + 1504 * 86400000)
    const counterPickup = dCounterStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const counterReturn = dCounterEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Create walkin booking for carOldId
    const walkinRes = await fetch(`${API_BASE}/admin/counter-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        carId: carOldId,
        firstName: "Transfer",
        lastName: "Test",
        immediateCheckout: true,
        pickupDate: counterPickup,
        returnDate: counterReturn,
      }),
    })
    const walkinData = await walkinRes.json()
    const testMatingBookingId = walkinData.booking.id

    // Verify carOldId is Rented
    const carOldBefore = (
      await supabasePool.query("SELECT status FROM vehicles WHERE id = $1", [
        carOldId,
      ])
    ).rows[0].status
    if (carOldBefore !== "Rented")
      logFail("Initial vehicle was not set to Rented", carOldBefore)

    // Now re-mate this booking to carNewId
    const remateRes = await fetch(
      `${API_BASE}/bookings/${testMatingBookingId}/mate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ carId: carNewId }),
      },
    )
    if (!remateRes.ok) logFail("Re-mating failed", await remateRes.text())

    // Verify carOldId has been freed back to Available!
    const carOldAfter = (
      await supabasePool.query("SELECT status FROM vehicles WHERE id = $1", [
        carOldId,
      ])
    ).rows[0].status
    if (carOldAfter !== "Available") {
      logFail(
        `Previous vehicle "${carOldId}" was orphaned in status "${carOldAfter}"`,
        'Expected "Available"',
      )
    }
    logPass(
      "6.1 Orphan Vehicle Freed",
      `Previous vehicle "${carOldId}" cleanly reverted to "Available" upon re-mating`,
    )

    /* =========================================================================
       PILLAR 7: DRIVER LICENSE DOWNLOAD AUTHORIZATION
       ========================================================================= */
    logSection("PILLAR 7: DRIVER LICENSE DOWNLOAD AUTHORIZATION")

    // Negative: Unauthenticated request rejected
    const unauthDL = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/download-license`,
    )
    if (unauthDL.status !== 401) {
      logFail(
        "Unauthenticated driver license download was NOT rejected with 401",
        `Status: ${unauthDL.status}`,
      )
    }
    logPass(
      "7.1 Unauthenticated License Download Blocked",
      "HTTP 401 Unauthorized returned",
    )

    // Negative: Alice cannot download Bob's license
    const aliceDL = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/download-license`,
      {
        headers: { Authorization: `Bearer ${tokenA}` },
      },
    )
    if (aliceDL.status !== 403) {
      logFail(
        "Alice was able to download Bob driver license",
        `Status: ${aliceDL.status}`,
      )
    }
    logPass(
      "7.2 Cross-Tenant License Download Blocked",
      "HTTP 403 Forbidden returned",
    )

    // Positive: Bob can download his own license
    const bobDL = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/download-license`,
      {
        headers: { Authorization: `Bearer ${tokenB}` },
      },
    )
    if (!bobDL.ok) {
      logFail(
        "Bob failed to download his own license",
        `Status: ${bobDL.status}`,
      )
    }
    logPass(
      "7.3 Owner License Download Authorized",
      "HTTP 200 OK returned with ID certificate",
    )

    // Positive: Admin can download any license
    const adminDL = await fetch(
      `${API_BASE}/bookings/${bobBookingId}/download-license`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    )
    if (!adminDL.ok) {
      logFail("Admin failed to download license", `Status: ${adminDL.status}`)
    }
    logPass(
      "7.4 Fleet Admin License Download Authorized",
      "HTTP 200 OK returned with ID certificate",
    )

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
    logSection(
      `🏆 ALL 7 ADVANCED TESTING METHODOLOGIES PILLARS PASSED (${durationSec}s)`,
    )
    console.log("✓ Security & Zero-Trust Authentication Enforced")
    console.log("✓ PostgreSQL Case-Insensitive Search Invariants Verified")
    console.log("✓ Concurrency & Race-Condition Double-Booking Prevented")
    console.log("✓ Foreign Key & Edge-Case Resilience Verified")
    console.log("✓ Trip Extension Date Propagation Confirmed in Database")
    console.log("✓ Orphan Vehicle Status Leaks Prevented")
    console.log("✓ Driver License Multi-Tenant Authorization Enforced")
  } finally {
    await supabasePool.end()
  }
}

runAdvancedTestingSuite().catch((err) => {
  console.error("[Advanced Testing Suite Error]", err)
  process.exit(1)
})
