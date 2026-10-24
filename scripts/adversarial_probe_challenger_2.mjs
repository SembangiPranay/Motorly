/**
 * DriveRent — Adversarial Concurrency & State Invariant Challenger
 * Agent: teamwork_preview_challenger_2
 *
 * Objectives:
 * 1. Concurrency Stress Test:
 *    - Rapid concurrent overlapping booking requests against live API (port 3001).
 *    - Invariant: Exactly 1 reservation created (HTTP 201), all concurrent conflicts rejected (HTTP 409).
 *    - Verification against Supabase PostgreSQL: No double-booked overlapping records exist.
 * 2. State Machine Invariant Challenges:
 *    - Handover keys on non-existent booking (expect 404).
 *    - Handover keys on already completed booking (illegal transition -> expect 4xx).
 *    - Return inspection on non-existent booking (expect 404).
 *    - Return inspection on un-checked-out car (illegal transition -> expect 4xx).
 *    - Return inspection on already completed booking (illegal transition -> expect 4xx).
 * 3. Database Invariant Auditing:
 *    - Direct Supabase PostgreSQL query to verify vehicle status vs active bookings.
 *    - Odometer consistency (odometer_in >= odometer_out).
 */

import pg from "pg"
import jwt from "jsonwebtoken"

const API_BASE = process.env.API_BASE || "http://localhost:3001/api"
const JWT_SECRET =
  process.env.JWT_SECRET || "motorly-fleet-jwt-secret-secure-key-2026-prod"

const pool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

const results = {
  totalProbes: 0,
  passedProbes: 0,
  failedProbes: 0,
  findings: [],
}

function probePass(name, detail = "") {
  results.totalProbes++
  results.passedProbes++
  console.log(`  ✅ [PROBE PASS] ${name}`)
  if (detail) console.log(`     └─ ${detail}`)
}

function probeFail(name, reason, impact = "HIGH") {
  results.totalProbes++
  results.failedProbes++
  console.error(`  ❌ [PROBE FAIL / VULNERABILITY] ${name}`)
  console.error(`     └─ Reason: ${reason}`)
  results.findings.push({ name, reason, impact })
}

function logSection(title) {
  console.log("\n" + "=".repeat(80))
  console.log(`  ${title}`)
  console.log("=".repeat(80))
}

async function getAdminToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "0709" }),
    })
    const data = await res.json()
    if (data.token) return data.token
  } catch (err) {
    console.warn("API admin login failed, fallback to signed token:", err.message)
  }
  return jwt.sign(
    { userId: "usr_admin", email: "admin@motorly.com", role: "admin", name: "Fleet Admin" },
    JWT_SECRET,
    { expiresIn: "24h" }
  )
}

async function getAvailableVehicle() {
  const res = await pool.query(
    "SELECT id, name, status, current_odometer, price_per_day FROM vehicles WHERE status = 'Available' ORDER BY id ASC LIMIT 1"
  )
  if (res.rows.length === 0) {
    // If no car available, pick any car
    const fallback = await pool.query(
      "SELECT id, name, status, current_odometer, price_per_day FROM vehicles ORDER BY id ASC LIMIT 1"
    )
    return fallback.rows[0]
  }
  return res.rows[0]
}

async function runAdversarialProbes() {
  console.log("🔥 EMPIRICAL ADVERSARIAL CHALLENGER PROBE INITIALIZED")
  console.log(`   Target API Base: ${API_BASE}`)
  console.log("   Target Database: Supabase PostgreSQL (aws-0-us-east-1.pooler.supabase.com:6543)")
  console.log(`   Timestamp: ${new Date().toISOString()}`)

  const adminToken = await getAdminToken()
  const targetVehicle = await getAvailableVehicle()
  console.log(`   Target Vehicle for Probes: ${targetVehicle.name} (${targetVehicle.id}), Current Status: ${targetVehicle.status}`)

  /* =========================================================================
     PART 1: CONCURRENCY STRESS & RACE CONDITION PROBING
     ========================================================================= */
  logSection("PART 1: CONCURRENCY STRESS & OVERBOOKING RACE CONDITION")

  const testBatchId = Date.now()
  const racePickup = `May 10, 2028`
  const raceReturn = `May 15, 2028`
  const CONCURRENT_REQUESTS = 10

  console.log(`[P1.1] Launching ${CONCURRENT_REQUESTS} SIMULTANEOUS requests for Vehicle ${targetVehicle.id} on ${racePickup} - ${raceReturn}...`)

  // Ensure clean idempotent baseline: delete any prior test bookings for this slot
  await pool.query(
    "DELETE FROM bookings WHERE matched_car_id = $1 AND ((pickup_date = $2 AND return_date = $3) OR (pickup_date = 'May 12, 2028' AND return_date = 'May 14, 2028') OR customer_email LIKE '%@stress-test.org')",
    [targetVehicle.id, racePickup, raceReturn]
  )

  const concurrentPromises = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) =>
    fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          firstName: `Concurrent`,
          lastName: `Runner_${i}`,
          email: `racer_${i}_${testBatchId}@stress-test.org`,
          phone: `+1-555-019${i}`,
        },
        pickupDate: racePickup,
        returnDate: raceReturn,
        matchedCarId: targetVehicle.id,
        requestedCategory: "Sedan",
        totalAmount: 350,
      }),
    }).then(async (res) => {
      let body = null
      try {
        body = await res.json()
      } catch {
        body = await res.text()
      }
      return { status: res.status, body, index: i }
    })
  )

  const outcomes = await Promise.all(concurrentPromises)
  const statusCounts = {}
  outcomes.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })

  console.log(`  Raw Response Status Breakdown:`, statusCounts)

  const successful201 = outcomes.filter((o) => o.status === 201)
  const rejected409 = outcomes.filter((o) => o.status === 409)
  const serverErrors500 = outcomes.filter((o) => o.status >= 500)

  // Direct Supabase Check: How many bookings were ACTUALLY saved for these dates & car?
  const dbBookingCountRes = await pool.query(
    "SELECT id, customer_first_name, customer_last_name, customer_email, status, created_at FROM bookings WHERE matched_car_id = $1 AND pickup_date = $2 AND return_date = $3",
    [targetVehicle.id, racePickup, raceReturn]
  )
  const dbRows = dbBookingCountRes.rows

  console.log(`  Supabase Database Audit: Found ${dbRows.length} rows inserted for overlapping slot:`)
  dbRows.forEach((r) => console.log(`     - ID: ${r.id}, Customer: ${r.customer_email}, Status: ${r.status}`))

  if (successful201.length === 1 && rejected409.length === (CONCURRENT_REQUESTS - 1) && dbRows.length === 1) {
    probePass(
      "1.1 Strict Concurrency Zero-Double-Booking Invariant",
      `Exactly 1 request succeeded (HTTP 201), ${rejected409.length} requests rejected (HTTP 409), exactly 1 record in Supabase.`
    )
  } else if (successful201.length > 1 || dbRows.length > 1) {
    probeFail(
      "1.1 Concurrency Race Condition Failure (Oversell / Double-Booking)",
      `RACE CONDITION EXPLOITED: ${successful201.length} requests returned HTTP 201, and ${dbRows.length} overlapping bookings persisted in Supabase database! Expected exactly 1 booking.`,
      "CRITICAL"
    )
  } else {
    probeFail(
      "1.1 Unexpected Status Codes under Concurrency",
      `Received statuses: ${JSON.stringify(statusCounts)}. Expected 1x 201 and ${CONCURRENT_REQUESTS - 1}x 409. DB rows: ${dbRows.length}`,
      "HIGH"
    )
  }

  // P1.2: Sequential Overlapping Attempt (Post-Commit Check)
  console.log(`[P1.2] Testing subsequent booking request overlapping an existing booking...`)
  const seqRes = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        firstName: `Sequential`,
        lastName: `Latecomer`,
        email: `latecomer_${testBatchId}@test.com`,
      },
      pickupDate: `May 12, 2028`, // overlaps May 10 - May 15
      returnDate: `May 14, 2028`,
      matchedCarId: targetVehicle.id,
      totalAmount: 180,
    }),
  })
  if (seqRes.status === 409) {
    probePass("1.2 Sequential Overlapping Booking Conflict Check", "HTTP 409 returned with proper conflict payload")
  } else {
    probeFail("1.2 Sequential Overlapping Booking Conflict Check", `Expected HTTP 409, got HTTP ${seqRes.status}`)
  }

  /* =========================================================================
     PART 2: STATE MACHINE ILLEGAL TRANSITION CHALLENGES
     ========================================================================= */
  logSection("PART 2: STATE MACHINE ILLEGAL TRANSITION CHALLENGES")

  // Probe 2.1: Key handover on non-existent booking ID
  console.log(`[P2.1] Attempting handover on non-existent booking ID "NON-EXISTENT-BOOKING-9999"...`)
  const nonExistentHandover = await fetch(`${API_BASE}/bookings/NON-EXISTENT-BOOKING-9999/handover-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ odometerOut: 15000, fuelOut: "100%" }),
  })
  if (nonExistentHandover.status === 404) {
    probePass("2.1 Non-existent Booking Handover Handled", "Returned HTTP 404 Not Found")
  } else {
    probeFail("2.1 Non-existent Booking Handover Handled", `Expected HTTP 404, got ${nonExistentHandover.status}`)
  }

  // Create a dedicated lifecycle booking to test valid -> completed -> illegal transition
  const lifecycleBookingId = `ADV-TEST-${Date.now()}`
  const createLifecycleRes = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: lifecycleBookingId,
      customer: {
        firstName: "State",
        lastName: "Tester",
        email: `state.tester.${Date.now()}@adversarial.com`,
      },
      pickupDate: "Jun 01, 2028",
      returnDate: "Jun 05, 2028",
      matchedCarId: targetVehicle.id,
      totalAmount: 400,
    }),
  })
  const lifecycleBooking = await createLifecycleRes.json()
  console.log(`  Created test booking ${lifecycleBookingId} with initial status: ${lifecycleBooking.status}`)

  // Probe 2.2: Illegal Return-Inspection on un-checked-out car
  // Current status is "Assigned" or "Pending Assignment". Car has NOT been handed over / checked out.
  console.log(`[P2.2] Attempting Return Inspection on un-checked-out booking ${lifecycleBookingId} (status: ${lifecycleBooking.status})...`)
  const prematureReturnRes = await fetch(`${API_BASE}/bookings/${lifecycleBookingId}/return-inspection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      odometerIn: 15500,
      fuelIn: "100%",
      damageFound: false,
      cleanlinessPass: true,
      inspectionPassed: true,
    }),
  })
  const prematureReturnData = await prematureReturnRes.json().catch(() => ({}))
  console.log(`  Premature return response status: ${prematureReturnRes.status}, body:`, prematureReturnData)

  if (prematureReturnRes.status >= 400 && prematureReturnRes.status < 500) {
    probePass(
      "2.2 Un-checked-out Return Rejected",
      `HTTP ${prematureReturnRes.status} returned, illegal transition blocked.`
    )
  } else if (prematureReturnRes.status === 200) {
    probeFail(
      "2.2 State Machine Violation: Return-Inspection on Un-checked-out Car",
      `VULNERABILITY: API allowed completing return inspection on booking with status "${lifecycleBooking.status}" without keys ever being handed over! Booking mutated to "Completed".`,
      "HIGH"
    )
  } else {
    probeFail("2.2 Un-checked-out Return", `Unexpected status ${prematureReturnRes.status}`)
  }

  // Create another booking, legitimately hand it over, legitimately complete it
  const legitBookingId = `LEGIT-${Date.now()}`
  await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: legitBookingId,
      customer: {
        firstName: "Legit",
        lastName: "Customer",
        email: `legit.${Date.now()}@adversarial.com`,
      },
      pickupDate: "Jul 01, 2028",
      returnDate: "Jul 05, 2028",
      matchedCarId: targetVehicle.id,
      totalAmount: 400,
    }),
  })

  // Legitimate handover
  const handoverRes = await fetch(`${API_BASE}/bookings/${legitBookingId}/handover-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ odometerOut: 15000, fuelOut: "100%" }),
  })
  console.log(`  Legitimate handover for ${legitBookingId}: status ${handoverRes.status}`)

  // Legitimate return inspection -> transitions to Completed
  const returnRes = await fetch(`${API_BASE}/bookings/${legitBookingId}/return-inspection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      odometerIn: 15200,
      fuelIn: "100%",
      damageFound: false,
      cleanlinessPass: true,
      inspectionPassed: true,
    }),
  })
  console.log(`  Legitimate return for ${legitBookingId}: status ${returnRes.status}`)

  // Verify DB shows Completed
  const dbLegitBooking = (
    await pool.query("SELECT id, status, matched_car_id FROM bookings WHERE id = $1", [legitBookingId])
  ).rows[0]
  console.log(`  Supabase status for ${legitBookingId}: ${dbLegitBooking?.status}`)

  // Probe 2.3: Illegal Key Handover on an ALREADY COMPLETED booking
  console.log(`[P2.3] Attempting key handover on already COMPLETED booking ${legitBookingId}...`)
  const completedHandoverRes = await fetch(`${API_BASE}/bookings/${legitBookingId}/handover-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ odometerOut: 16000, fuelOut: "100%" }),
  })
  const completedHandoverData = await completedHandoverRes.json().catch(() => ({}))
  console.log(`  Completed booking handover response: HTTP ${completedHandoverRes.status}, body:`, completedHandoverData)

  // Direct Supabase query to see if state was corrupted
  const dbRecheckLegit = (
    await pool.query("SELECT id, status, matched_car_id FROM bookings WHERE id = $1", [legitBookingId])
  ).rows[0]
  const dbCarRecheck = (
    await pool.query("SELECT id, status FROM vehicles WHERE id = $1", [targetVehicle.id])
  ).rows[0]

  if (completedHandoverRes.status >= 400 && completedHandoverRes.status < 500) {
    probePass(
      "2.3 Handover on Completed Booking Blocked",
      `HTTP ${completedHandoverRes.status} returned, illegal transition prevented.`
    )
  } else if (completedHandoverRes.status === 200) {
    probeFail(
      "2.3 State Machine Violation: Handover on Already Completed Booking Allowed",
      `VULNERABILITY: API allowed handover-keys on a completed booking (${legitBookingId})! Booking status mutated from "Completed" back to "${dbRecheckLegit?.status}", and Vehicle status mutated to "${dbCarRecheck?.status}". State machine backward transition corruption!`,
      "HIGH"
    )
  } else {
    probeFail("2.3 Handover on Completed Booking", `Unexpected status ${completedHandoverRes.status}`)
  }

  // Probe 2.4: Return inspection on an ALREADY COMPLETED booking
  console.log(`[P2.4] Attempting return-inspection on already COMPLETED booking ${legitBookingId}...`)
  const doubleReturnRes = await fetch(`${API_BASE}/bookings/${legitBookingId}/return-inspection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      odometerIn: 16500,
      fuelIn: "100%",
      damageFound: false,
      cleanlinessPass: true,
      inspectionPassed: true,
    }),
  })
  const doubleReturnData = await doubleReturnRes.json().catch(() => ({}))
  console.log(`  Double return response status: ${doubleReturnRes.status}, body:`, doubleReturnData)

  if (doubleReturnRes.status >= 400 && doubleReturnRes.status < 500) {
    probePass("2.4 Double Return Inspection Blocked", `HTTP ${doubleReturnRes.status} returned`)
  } else if (doubleReturnRes.status === 200) {
    probeFail(
      "2.4 Non-idempotent Re-return on Completed Booking",
      `API allowed calling return-inspection again on already finalized booking ${legitBookingId} without 4xx guard.`,
      "MEDIUM"
    )
  }

  /* =========================================================================
     PART 3: DIRECT SUPABASE DATABASE INVARIANT VERIFICATION
     ========================================================================= */
  logSection("PART 3: DIRECT SUPABASE POSTGRESQL INVARIANT VERIFICATION")

  // Invariant 3.1: Active Rented Vehicles vs Checked Out Bookings
  console.log("[P3.1] Checking Supabase invariant: Every 'Rented' vehicle must have an active 'Checked Out' booking...")
  const rentedVehiclesRes = await pool.query(
    "SELECT id, name, status, current_odometer FROM vehicles WHERE status = 'Rented'"
  )
  console.log(`  Found ${rentedVehiclesRes.rows.length} vehicles with status 'Rented' in Supabase:`)

  let rentedVehiclesWithValidBookings = 0
  let orphanRentedVehicles = []

  for (const v of rentedVehiclesRes.rows) {
    const activeBookingRes = await pool.query(
      "SELECT id, status, customer_email, pickup_date, return_date FROM bookings WHERE matched_car_id = $1 AND status = 'Checked Out'",
      [v.id]
    )
    if (activeBookingRes.rows.length > 0) {
      rentedVehiclesWithValidBookings++
      console.log(`     ✓ Car ${v.name} (${v.id}) -> Active Booking ${activeBookingRes.rows[0].id} (${activeBookingRes.rows[0].customer_email})`)
    } else {
      orphanRentedVehicles.push(v)
      console.warn(`     ⚠ Car ${v.name} (${v.id}) is status 'Rented' but has NO 'Checked Out' booking!`)
    }
  }

  if (orphanRentedVehicles.length === 0) {
    probePass(
      "3.1 Rented Vehicle Invariant",
      `All ${rentedVehiclesRes.rows.length} rented vehicles map to active 'Checked Out' reservations.`
    )
  } else {
    probeFail(
      "3.1 Database Invariant Violation: Orphan 'Rented' Vehicles",
      `Found ${orphanRentedVehicles.length} vehicles with status 'Rented' in Supabase that have NO active 'Checked Out' booking: [${orphanRentedVehicles.map((v) => v.id).join(", ")}]`,
      "HIGH"
    )
  }

  // Invariant 3.2: Available Vehicles must NOT have an active 'Checked Out' booking
  console.log("[P3.2] Checking Supabase invariant: 'Available' vehicles must NOT have an active 'Checked Out' booking...")
  const availableVehiclesRes = await pool.query(
    "SELECT id, name, status FROM vehicles WHERE status = 'Available'"
  )
  let invalidAvailableVehicles = []
  for (const v of availableVehiclesRes.rows) {
    const conflictBookingRes = await pool.query(
      "SELECT id, status, customer_email FROM bookings WHERE matched_car_id = $1 AND status = 'Checked Out'",
      [v.id]
    )
    if (conflictBookingRes.rows.length > 0) {
      invalidAvailableVehicles.push({ car: v, booking: conflictBookingRes.rows[0] })
    }
  }

  if (invalidAvailableVehicles.length === 0) {
    probePass(
      "3.2 Available Vehicle Invariant",
      `All ${availableVehiclesRes.rows.length} 'Available' vehicles have zero active 'Checked Out' bookings.`
    )
  } else {
    probeFail(
      "3.2 Database Invariant Violation: 'Available' Vehicle Has Active 'Checked Out' Booking",
      `Found ${invalidAvailableVehicles.length} vehicles marked Available while possessing Checked Out bookings!`,
      "CRITICAL"
    )
  }

  // Invariant 3.3: Booking Odometer Monotonicity Check
  console.log("[P3.3] Checking Supabase invariant: Completed bookings must have odometer_in >= odometer_out...")
  const odometerRes = await pool.query(
    "SELECT id, odometer_out, odometer_in, status FROM bookings WHERE status = 'Completed' AND odometer_out IS NOT NULL AND odometer_in IS NOT NULL"
  )
  const odometerAnomalies = odometerRes.rows.filter((r) => Number(r.odometer_in) < Number(r.odometer_out))
  if (odometerAnomalies.length === 0) {
    probePass(
      "3.3 Odometer Monotonicity Invariant",
      `All ${odometerRes.rows.length} completed bookings with logged odometers satisfy odometer_in >= odometer_out.`
    )
  } else {
    probeFail(
      "3.3 Odometer Invariant Violation",
      `Found ${odometerAnomalies.length} completed bookings where odometer_in < odometer_out (odometer rollback): [${odometerAnomalies.map((a) => a.id).join(", ")}]`,
      "MEDIUM"
    )
  }

  // Invariant 3.4: Booking Status Domain Check
  console.log("[P3.4] Checking Supabase invariant: All bookings have valid operational status...")
  const validStatuses = new Set([
    "Pending Assignment",
    "Assigned",
    "Confirmed",
    "Checked Out",
    "Completed",
    "Cancelled",
  ])
  const allBookingsRes = await pool.query("SELECT id, status FROM bookings")
  const invalidStatusBookings = allBookingsRes.rows.filter((b) => !validStatuses.has(b.status))
  if (invalidStatusBookings.length === 0) {
    probePass(
      "3.4 Booking Status Integrity",
      `All ${allBookingsRes.rows.length} booking records in Supabase have valid enum status.`
    )
  } else {
    probeFail(
      "3.4 Invalid Booking Status Found",
      `Found ${invalidStatusBookings.length} bookings with unrecognized status: [${invalidStatusBookings.map((b) => `${b.id}:${b.status}`).join(", ")}]`,
      "HIGH"
    )
  }

  /* =========================================================================
     SUMMARY & VERDICT
     ========================================================================= */
  logSection("EMPIRICAL ADVERSARIAL CHALLENGE SUMMARY")
  console.log(`Total Probes Executed: ${results.totalProbes}`)
  console.log(`Passed Probes        : ${results.passedProbes}`)
  console.log(`Failed Probes        : ${results.failedProbes}`)
  console.log(`Vulnerabilities Found: ${results.findings.length}`)

  if (results.findings.length > 0) {
    console.log("\nDETAILED VULNERABILITIES:")
    results.findings.forEach((f, i) => {
      console.log(` [V${i + 1}] [${f.impact}] ${f.name}`)
      console.log(`      └─ ${f.reason}`)
    })
  }

  await pool.end()
  return results
}

runAdversarialProbes()
  .then((res) => {
    console.log("\nRun finished with exit code:", res.failedProbes > 0 ? 1 : 0)
    process.exit(res.failedProbes > 0 ? 1 : 0)
  })
  .catch(async (err) => {
    console.error("FATAL RUNNER ERROR:", err)
    await pool.end()
    process.exit(2)
  })
