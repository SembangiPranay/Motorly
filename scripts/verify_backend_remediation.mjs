import pg from "pg"

const { Pool } = pg

// 1. Strict Staging Database Isolation: STAGING_DATABASE_URL is mandatory.
// No fallback to DATABASE_URL and no production overrides permitted.
const STAGING_DB_URL = process.env.STAGING_DATABASE_URL
if (!STAGING_DB_URL) {
  console.error(
    "\n[FATAL TEST SAFETY ERROR] STAGING_DATABASE_URL environment variable is strictly required for this mutating test suite.\n" +
      "Falling back to DATABASE_URL is disallowed to protect non-staging environments.\n" +
      "Please set STAGING_DATABASE_URL to your designated staging database.\n",
  )
  process.exit(1)
}

if (process.env.NODE_ENV === "production") {
  console.error(
    "\n[FATAL TEST SAFETY ERROR] NODE_ENV is set to production. Mutating verification suite cannot run against production. No overrides permitted.\n",
  )
  process.exit(1)
}

let stagingUrl
try {
  stagingUrl = new URL(STAGING_DB_URL)
} catch {
  console.error(
    "\n[FATAL TEST SAFETY ERROR] STAGING_DATABASE_URL is not a valid URL.\n",
  )
  process.exit(1)
}

// Positively identify staging: Ensure URL is not pointing to a production host
if (/production|prod-db|motorly-prod/i.test(stagingUrl.host)) {
  console.error(
    `\n[FATAL TEST SAFETY ERROR] STAGING_DATABASE_URL (${stagingUrl.host}) contains production markers. Aborting.\n`,
  )
  process.exit(1)
}

const API_BASE = process.env.API_BASE || "http://localhost:3001/api"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error(
    "\n[SAFETY ERROR] ADMIN_PASSWORD environment variable must be set to run test verification.\n",
  )
  process.exit(1)
}

const pool = new Pool({
  connectionString: STAGING_DB_URL,
  ssl: {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
  },
  connectionTimeoutMillis: 15000,
})

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`)
    passed++
  } else {
    console.error(`  [FAIL] ${message}`)
    failed++
  }
}

async function runTests() {
  console.log("\n=======================================================")
  console.log("  DRIVERENT BACKEND ENHANCEMENTS VERIFICATION SUITE")
  console.log("=======================================================\n")

  // --- 0. Positive Staging Database Handshake ---
  console.log(
    "--- 0. Verifying Test Runner and Server Staging Database Alignment ---",
  )
  const healthRes = await fetch(`${API_BASE}/health`).catch((err) => {
    console.error(
      `  [ABORT] Cannot reach server at ${API_BASE}/health: ${err.message}`,
    )
    process.exit(1)
  })
  const health = await healthRes.json()

  if (health.environment === "production") {
    console.error(
      "  [ABORT] Server reports environment: 'production'. Aborting before any writes.",
    )
    process.exit(1)
  }

  const serverDbHost = health.database?.host
  const serverDbName = health.database?.name
  const runnerDbHost = stagingUrl.host
  const runnerDbName = stagingUrl.pathname.replace(/^\//, "")

  if (
    !serverDbHost ||
    serverDbHost !== runnerDbHost ||
    serverDbName !== runnerDbName
  ) {
    console.error(
      `  [ABORT] Target Database Mismatch!\n` +
        `    Server Database:      ${serverDbHost || "unknown"}/${serverDbName || "unknown"}\n` +
        `    Test Runner Database: ${runnerDbHost}/${runnerDbName}\n` +
        `  The server on port 3001 and the test runner MUST be configured with the exact same staging database. Aborting before any writes.`,
    )
    process.exit(1)
  }

  assert(
    serverDbHost === runnerDbHost && serverDbName === runnerDbName,
    `Staging database alignment positively verified: ${serverDbHost}/${serverDbName} (Environment: ${health.environment})`,
  )

  // Generate unique test execution run tag to strictly isolate test records
  const testBatchId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const testEmailDomain = `db-lock-test-${testBatchId}.org`
  const testEmailPattern = `%@${testEmailDomain}`

  try {
    // --- Login as admin to get token for protected endpoints ---
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    })
    const loginData = await loginRes.json()
    const adminToken = loginData.token
    const adminHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    // =========================================================================
    // 1. DATABASE-LEVEL CONCURRENCY PROTECTION
    // =========================================================================
    console.log("--- 1. Testing Database-Level Concurrency Protection ---")
    const targetCarId = "tesla-model-3"
    const racePickup = "Jul 10, 2028"
    const raceReturn = "Jul 15, 2028"
    const BATCH_SIZE = 10

    console.log(
      `  Launching ${BATCH_SIZE} SIMULTANEOUS bookings for ${targetCarId} across database connections...`,
    )
    const racePromises = Array.from({ length: BATCH_SIZE }).map((_, i) =>
      fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName: "DbConcurrency",
            lastName: `Runner_${i}`,
            email: `race_${i}_${testBatchId}@${testEmailDomain}`,
            phone: `+1-555-020${i}`,
          },
          pickupDate: racePickup,
          returnDate: raceReturn,
          matchedCarId: targetCarId,
          requestedCategory: "Sedan",
          totalAmount: 420,
        }),
      }).then(async (res) => ({ status: res.status, body: await res.json() })),
    )

    const outcomes = await Promise.all(racePromises)
    const status201 = outcomes.filter((o) => o.status === 201)
    const status409 = outcomes.filter((o) => o.status === 409)

    assert(
      status201.length === 1,
      `Exactly 1 simultaneous request succeeded (HTTP 201): received ${status201.length}`,
    )
    assert(
      status409.length === BATCH_SIZE - 1,
      `Exactly ${BATCH_SIZE - 1} simultaneous requests rejected with HTTP 409 Conflict: received ${status409.length}`,
    )

    // Audit Supabase strictly by the unique test email pattern - never by dates alone
    const dbAudit = await pool.query(
      "SELECT id, customer_email, status FROM bookings WHERE customer_email LIKE $1",
      [testEmailPattern],
    )
    assert(
      dbAudit.rows.length === 1,
      `Database audit confirms exactly 1 test booking row persisted in database: found ${dbAudit.rows.length}`,
    )

    // =========================================================================
    // 2. FAIL-SAFE AVAILABILITY CHECKS
    // =========================================================================
    console.log("\n--- 2. Testing Fail-Safe Availability Checks ---")

    // 2.1 Invalid date range: return before pickup
    const resBadDates = await fetch(
      `${API_BASE}/cars/${targetCarId}/availability?pickupDate=Jul 20, 2028&returnDate=Jul 15, 2028`,
    )
    const dataBadDates = await resBadDates.json()
    assert(
      resBadDates.status === 400 && dataBadDates.isAvailable === false,
      `Reverse date range fails safely: HTTP 400 with isAvailable=false ("${dataBadDates.error}")`,
    )

    // 2.2 Malformed non-date strings
    const resGarbageDates = await fetch(
      `${API_BASE}/cars/${targetCarId}/availability?pickupDate=not-a-date&returnDate=also-not-a-date`,
    )
    const dataGarbageDates = await resGarbageDates.json()
    assert(
      resGarbageDates.status === 400 && dataGarbageDates.isAvailable === false,
      `Garbage date strings fail safely: HTTP 400 with isAvailable=false`,
    )

    // 2.3 Non-existent vehicle
    const resNoCar = await fetch(
      `${API_BASE}/cars/non-existent-ghost-car/availability?pickupDate=Jul 20, 2028&returnDate=Jul 25, 2028`,
    )
    const dataNoCar = await resNoCar.json()
    assert(
      resNoCar.status === 404 && dataNoCar.isAvailable === false,
      `Non-existent vehicle fails safely: HTTP 404 with isAvailable=false`,
    )

    // 2.4 Maintenance vehicle check
    const maintCarId = "ford-mustang"
    const resMaint = await fetch(
      `${API_BASE}/cars/${maintCarId}/availability?pickupDate=Aug 1, 2028&returnDate=Aug 5, 2028`,
    )
    const dataMaint = await resMaint.json()
    assert(
      dataMaint.isAvailable === false && dataMaint.carStatus === "Maintenance",
      `Vehicle in maintenance reports isAvailable=false with Maintenance conflict status`,
    )

    // =========================================================================
    // 3. OPTIMIZED DASHBOARD AGGREGATION & VEHICLE AVAILABILITY QUERIES
    // =========================================================================
    console.log(
      "\n--- 3. Testing Optimized Dashboard Aggregation & Availability Queries ---",
    )

    // 3.1 Dashboard stats SQL aggregation
    const startStatsTime = Date.now()
    const resStats = await fetch(`${API_BASE}/admin/stats`, {
      headers: adminHeaders,
    })
    const statsTime = Date.now() - startStatsTime
    const stats = await resStats.json()

    assert(
      resStats.status === 200,
      `GET /api/admin/stats returned HTTP 200 in ${statsTime}ms`,
    )
    assert(
      typeof stats.fleet?.total === "number" &&
        typeof stats.fleet?.available === "number" &&
        typeof stats.fleet?.rented === "number" &&
        typeof stats.fleet?.maintenance === "number" &&
        typeof stats.fleet?.cleaning === "number" &&
        typeof stats.fleet?.utilization === "number" &&
        typeof stats.fleet?.activeRevenue === "number",
      `Fleet aggregation payload structure is fully populated (total: ${stats.fleet?.total}, utilization: ${stats.fleet?.utilization}%, revenue: $${stats.fleet?.activeRevenue})`,
    )
    assert(
      typeof stats.bookings?.total === "number" &&
        typeof stats.bookings?.pendingMating === "number" &&
        typeof stats.bookings?.assigned === "number",
      `Bookings aggregation payload structure is fully populated (total: ${stats.bookings?.total}, pending: ${stats.bookings?.pendingMating})`,
    )
    assert(
      stats.fleet.total ===
        stats.fleet.available +
          stats.fleet.rented +
          stats.fleet.maintenance +
          stats.fleet.cleaning,
      `Fleet invariant strictly matches: total (${stats.fleet.total}) == available (${stats.fleet.available}) + rented (${stats.fleet.rented}) + maintenance (${stats.fleet.maintenance}) + cleaning (${stats.fleet.cleaning})`,
    )

    // 3.2 Vehicle availability single batch query
    const startFleetQueryTime = Date.now()
    const resCars = await fetch(
      `${API_BASE}/cars?pickupDate=${encodeURIComponent(racePickup)}&returnDate=${encodeURIComponent(raceReturn)}`,
    )
    const fleetQueryTime = Date.now() - startFleetQueryTime
    const cars = await resCars.json()

    assert(
      resCars.status === 200 && Array.isArray(cars),
      `GET /api/cars with date availability returned HTTP 200 with ${cars.length} vehicles in ${fleetQueryTime}ms (Batch query optimization)`,
    )

    const targetCar = cars.find((c) => c.id === targetCarId)
    assert(
      targetCar &&
        targetCar.isAvailableForDates === false &&
        targetCar.statusForDates === "Reserved",
      `Vehicle with active booking (${targetCarId}) correctly identified as isAvailableForDates=false & statusForDates='Reserved'`,
    )

    const freeCar = cars.find(
      (c) => c.id !== targetCarId && c.status === "Available",
    )
    assert(
      freeCar && freeCar.isAvailableForDates === true,
      `Non-conflicting vehicle (${freeCar?.id}) correctly identified as isAvailableForDates=true`,
    )

    // =========================================================================
    // 4. PAGINATED & AUTHENTICATED MAINTENANCE HISTORY
    // =========================================================================
    console.log(
      "\n--- 4. Testing Paginated & Authenticated Maintenance History ---",
    )

    // 4.1 Unauthenticated access MUST be rejected (Security requirement)
    const resUnauthMnt = await fetch(`${API_BASE}/maintenance?page=1&limit=3`)
    assert(
      resUnauthMnt.status === 401,
      `Unauthenticated GET /api/maintenance correctly rejected with HTTP 401 Unauthorized`,
    )

    // 4.2 Authenticated Page 1 with limit 3
    const resMntP1 = await fetch(`${API_BASE}/maintenance?page=1&limit=3`, {
      headers: adminHeaders,
    })
    const dataMntP1 = await resMntP1.json()

    assert(
      resMntP1.status === 200,
      `Authenticated GET /api/maintenance?page=1&limit=3 returned HTTP 200`,
    )
    assert(
      Array.isArray(dataMntP1.data) && dataMntP1.data.length <= 3,
      `Page 1 returned array of ${dataMntP1.data?.length} records`,
    )
    assert(
      dataMntP1.pagination?.page === 1 &&
        dataMntP1.pagination?.limit === 3 &&
        typeof dataMntP1.pagination?.total === "number" &&
        typeof dataMntP1.pagination?.totalPages === "number",
      `Pagination metadata properly structured (total: ${dataMntP1.pagination?.total}, pages: ${dataMntP1.pagination?.totalPages}, hasNext: ${dataMntP1.pagination?.hasNextPage})`,
    )

    // 4.3 Page 2 with limit 3
    if (dataMntP1.pagination.totalPages > 1) {
      const resMntP2 = await fetch(`${API_BASE}/maintenance?page=2&limit=3`, {
        headers: adminHeaders,
      })
      const dataMntP2 = await resMntP2.json()

      assert(
        dataMntP2.pagination?.page === 2 &&
          dataMntP2.pagination?.hasPrevPage === true,
        `Page 2 correctly accessed with hasPrevPage=true`,
      )
      assert(
        dataMntP1.data[0]?.id !== dataMntP2.data[0]?.id,
        `Page 2 records are distinct from Page 1 records (${dataMntP1.data[0]?.id} !== ${dataMntP2.data[0]?.id})`,
      )
    }

    // 4.4 Filter by status
    const resMntCompleted = await fetch(
      `${API_BASE}/maintenance?status=Completed&limit=5`,
      { headers: adminHeaders },
    )
    const dataMntCompleted = await resMntCompleted.json()
    const allCompleted = dataMntCompleted.data.every(
      (r) => r.status === "Completed",
    )
    assert(
      allCompleted,
      `Status filter ?status=Completed returned only records with status 'Completed'`,
    )

    // 4.5 Backward compatibility check: raw/all=true
    const resMntAll = await fetch(`${API_BASE}/maintenance?all=true`, {
      headers: adminHeaders,
    })
    const dataMntAll = await resMntAll.json()
    assert(
      Array.isArray(dataMntAll),
      `Legacy backward compatibility check (?all=true) returned raw Array with ${dataMntAll.length} items`,
    )
  } finally {
    // GUARANTEED CLEANUP: Strictly cleans only test records by unique test email pattern
    console.log("\n--- Cleaning up test records in try/finally ---")
    try {
      const delRes = await pool.query(
        "DELETE FROM bookings WHERE customer_email LIKE $1",
        [testEmailPattern],
      )
      console.log(`  Purged ${delRes.rowCount || 0} test booking record(s).`)
    } catch (cleanupErr) {
      console.error(
        "  [WARNING] Failed to clean up test records:",
        cleanupErr?.message,
      )
    }
    await pool.end().catch(() => {})
  }

  console.log("\n=======================================================")
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log("=======================================================\n")

  if (failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with fatal error:", err)
  process.exit(1)
})
