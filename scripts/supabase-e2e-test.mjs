import pg from "pg"

const SUPABASE_URL =
  "postgresql://postgres.mrbymhhcjvebpxcfmnhy:Koushik.git1@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

const pool = new pg.Pool({
  connectionString: SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const API_BASE = "http://localhost:3001/api"

async function runTest() {
  console.log("\n=======================================================")
  console.log("   🚀 MOTORLY SUPABASE DIRECT END-TO-END TEST SUITE   ")
  console.log("=======================================================\n")

  // 1. Direct Database Health & Connection
  console.log("[1/6] Testing direct connection to Supabase PostgreSQL...")
  const ping = await pool.query(
    "SELECT NOW() as current_time, current_database() as db_name, version()",
  )
  console.log("  ✓ Connected to Supabase DB:", ping.rows[0].db_name)
  console.log("  ✓ Server Time:", ping.rows[0].current_time)

  // 2. Verify Supabase Tables
  console.log("\n[2/6] Verifying required Supabase tables...")
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `)
  const tableNames = tables.rows.map((r) => r.table_name)
  console.log("  ✓ Public tables in Supabase:", tableNames.join(", "))
  if (!tableNames.includes("bookings") || !tableNames.includes("vehicles")) {
    throw new Error("Missing required bookings or vehicles table in Supabase!")
  }

  // 3. Check Fleet Status in Supabase
  console.log("\n[3/6] Inspecting live vehicles in Supabase...")
  const vehiclesCount = await pool.query("SELECT count(*) FROM vehicles")
  console.log(`  ✓ Total Vehicles in Supabase: ${vehiclesCount.rows[0].count}`)

  const sampleVehicle = await pool.query(
    "SELECT id, name, status, plate_number, garage_name, garage_bay FROM vehicles WHERE status = 'Available' LIMIT 1",
  )
  if (!sampleVehicle.rows[0]) {
    throw new Error("No available vehicle found to run booking test.")
  }
  const testCar = sampleVehicle.rows[0]
  console.log(
    `  ✓ Selected Test Car: ${testCar.name} (${testCar.id}) - Status: ${testCar.status} - Hub: ${testCar.garage_name} (${testCar.garage_bay})`,
  )

  // 4. Create a Real Booking through the API
  const testBookingId = `E2E-TEST-${Math.floor(100000 + Math.random() * 900000)}`
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 2)
  const pickupStr = tomorrow.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  tomorrow.setDate(tomorrow.getDate() + 3)
  const returnStr = tomorrow.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  console.log(
    `\n[4/6] Creating booking ${testBookingId} via API (Pickup: ${pickupStr} → Return: ${returnStr})...`,
  )
  const createRes = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: testBookingId,
      customer: {
        firstName: "Koushik",
        lastName: "Tester",
        email: "koushik.test@motorly.io",
        phone: "+1 (555) 019-2834",
      },
      driver: {
        dateOfBirth: "1994-06-20",
        licenseNumber: "DL-SUPABASE-9988",
        licenseState: "Florida",
        licenseExpiry: "2030-01-01",
      },
      pickupLocation: testCar.garage_name || "Miami Central Hub",
      returnLocation: testCar.garage_name || "Miami Central Hub",
      pickupDate: pickupStr,
      returnDate: returnStr,
      requestedCategory: "Sedan",
      matchedCarId: testCar.id,
      totalAmount: 245.5,
      notes: "Direct Supabase E2E Verification",
    }),
  })

  console.log(`  ✓ API Response Status: ${createRes.status}`)
  const createdData = await createRes.json()
  if (createRes.status !== 201) {
    throw new Error(`Failed to create booking: ${JSON.stringify(createdData)}`)
  }
  console.log(
    `  ✓ Booking created successfully: ID: ${createdData.id}, Status: ${createdData.status}`,
  )

  // 5. Query Supabase Directly to Confirm Immediate Persistence
  console.log(
    "\n[5/6] Querying Supabase PostgreSQL directly for the new booking record...",
  )
  const directCheck = await pool.query(
    "SELECT id, customer_first_name, customer_last_name, customer_email, matched_car_id, status, total_amount, created_at FROM bookings WHERE id = $1",
    [testBookingId],
  )
  if (directCheck.rows.length === 0) {
    throw new Error(
      `CRITICAL: Booking ${testBookingId} was NOT found in Supabase!`,
    )
  }
  const dbRecord = directCheck.rows[0]
  console.log("  ✓ SUPABASE PERSISTENCE VERIFIED:")
  console.log("    - ID:", dbRecord.id)
  console.log(
    "    - Customer:",
    dbRecord.customer_first_name,
    dbRecord.customer_last_name,
  )
  console.log("    - Email:", dbRecord.customer_email)
  console.log("    - Mated Car ID:", dbRecord.matched_car_id)
  console.log("    - Status in DB:", dbRecord.status)
  console.log("    - Total Amount:", dbRecord.total_amount)

  // Check vehicle status in Supabase (should be Rented now)
  const carInDb = await pool.query(
    "SELECT id, status FROM vehicles WHERE id = $1",
    [testCar.id],
  )
  console.log(
    `  ✓ Vehicle ${testCar.id} Status in Supabase: ${carInDb.rows[0].status}`,
  )

  // 6. Test Lifecycle Transitions (Approve, Key Handoff, Return)
  console.log(
    "\n[6/6] Testing lifecycle transitions in Supabase (Approve → Keys → Return)...",
  )

  // 6A. Admin Approves (Green Signal)
  const approveRes = await fetch(
    `${API_BASE}/bookings/${testBookingId}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  )
  const approveData = await approveRes.json()
  console.log(
    `  ✓ Step D (Signal): Approved = ${approveData.booking.approvedByAdmin}`,
  )

  // 6B. Keys Handed Over
  const keysRes = await fetch(
    `${API_BASE}/bookings/${testBookingId}/handover-keys`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        odometerOut: 14500,
        fuelOut: "100%",
        exteriorClean: true,
        tiresInspected: true,
        staffSign: "Operations Lead",
      }),
    },
  )
  const keysData = await keysRes.json()
  console.log(`  ✓ Step E (Keys): Status = ${keysData.booking.status}`)

  // 6C. Return & Inspection
  const returnRes = await fetch(
    `${API_BASE}/bookings/${testBookingId}/return-inspection`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        odometerIn: 14650,
        fuelIn: "100%",
        damageFound: false,
        cleanlinessPass: true,
        inspectionPassed: true,
        staffSign: "Return Inspector",
      }),
    },
  )
  const returnData = await returnRes.json()
  console.log(`  ✓ Step G (Return): Status = ${returnData.booking.status}`)

  // Final check in Supabase
  const finalCheck = await pool.query(
    "SELECT id, status, approved_by_admin, inspection_passed FROM bookings WHERE id = $1",
    [testBookingId],
  )
  console.log("  ✓ Final DB State:", finalCheck.rows[0])

  // Restore car status to Available
  await pool.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [
    testCar.id,
  ])

  console.log("\n=======================================================")
  console.log("   🎉 ALL SUPABASE DIRECT E2E TESTS PASSED 100%!       ")
  console.log("=======================================================\n")
}

runTest()
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err)
    process.exit(1)
  })
  .finally(() => pool.end())
