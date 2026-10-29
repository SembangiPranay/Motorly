const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

async function run() {
  console.log("=== COMPREHENSIVE BOOKING VALIDATION SUITE ===")
  const createdIds = []

  // Authenticate as Admin for teardown
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@motorly.com",
      password: ADMIN_PASSWORD,
    }),
  })
  const { token } = await loginRes.json()
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const baseCustomer = {
    firstName: "ValTest",
    lastName: "Customer",
    email: `val-test-${Date.now()}@test.org`,
    phone: "+1 (555) 019-9000",
  }

  const baseDriver = {
    dateOfBirth: "1995-06-15",
    licenseNumber: "DL-VALID-9999",
    licenseState: "FL",
    licenseExpiry: "2029-12-31",
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Past-Date Booking Prevention
    // -------------------------------------------------------------
    console.log("\n[Test 1] Past-Date Booking Prevention...")
    const resPast = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: baseDriver,
        pickupDate: "2022-01-10 10:00",
        returnDate: "2022-01-12 18:00",
        requestedCategory: "Sedan",
      }),
    })
    const dataPast = await resPast.json()
    console.log("  Status:", resPast.status, "| Error:", dataPast.error)
    if (resPast.status !== 400 || !dataPast.error?.includes("past")) {
      throw new Error(
        `Failed Test 1: Expected 400 with past date error, got: ${resPast.status} ${JSON.stringify(dataPast)}`,
      )
    }
    console.log("  ✅ Past-date booking rejected successfully.")

    // -------------------------------------------------------------
    // Test 2: Same-Day / Hourly Rental (Valid 5 hours)
    // -------------------------------------------------------------
    console.log(
      "\n[Test 2] Same-Day Rental (Valid 5 Hours: 10:00 AM to 03:00 PM)...",
    )
    const testIdSameDay = `TEST-SAMEDAY-${Date.now().toString(36)}`
    const resSameDay = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testIdSameDay,
        customer: { ...baseCustomer, email: `same-day-${Date.now()}@test.org` },
        driver: baseDriver,
        pickupDate: "2026-11-20 10:00 AM",
        returnDate: "2026-11-20 03:00 PM",
        requestedCategory: "Sedan",
        totalAmount: 95,
      }),
    })
    const dataSameDay = await resSameDay.json()
    console.log(
      "  Status:",
      resSameDay.status,
      "| Booking ID:",
      dataSameDay.id,
      "| Status:",
      dataSameDay.status,
    )
    if (resSameDay.status !== 201) {
      throw new Error(
        `Failed Test 2: Expected 201 for 5-hour same-day booking, got: ${resSameDay.status} ${JSON.stringify(dataSameDay)}`,
      )
    }
    createdIds.push(testIdSameDay)
    console.log("  ✅ Same-day 5-hour rental created successfully.")

    // -------------------------------------------------------------
    // Test 3: Same-Day Rental (Too Short: < 3 Hours)
    // -------------------------------------------------------------
    console.log(
      "\n[Test 3] Same-Day Rental Too Short (< 3 Hours: 10:00 AM to 11:30 AM)...",
    )
    const resTooShort = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: baseDriver,
        pickupDate: "2026-11-20 10:00 AM",
        returnDate: "2026-11-20 11:30 AM",
        requestedCategory: "Sedan",
      }),
    })
    const dataTooShort = await resTooShort.json()
    console.log("  Status:", resTooShort.status, "| Error:", dataTooShort.error)
    if (
      resTooShort.status !== 400 ||
      !dataTooShort.error?.includes("3 hours")
    ) {
      throw new Error(
        `Failed Test 3: Expected 400 minimum duration error, got: ${resTooShort.status} ${JSON.stringify(dataTooShort)}`,
      )
    }
    console.log("  ✅ Sub-3-hour booking rejected successfully.")

    // -------------------------------------------------------------
    // Test 4: Maximum Rental Duration (Exceeding 45 Days)
    // -------------------------------------------------------------
    console.log(
      "\n[Test 4] Maximum Rental Duration Ceiling (Exceeding 45 Days)...",
    )
    const resTooLong = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: baseDriver,
        pickupDate: "2026-11-01 10:00",
        returnDate: "2027-01-15 10:00", // 75 days
        requestedCategory: "Sedan",
      }),
    })
    const dataTooLong = await resTooLong.json()
    console.log("  Status:", resTooLong.status, "| Error:", dataTooLong.error)
    if (resTooLong.status !== 400 || !dataTooLong.error?.includes("45 days")) {
      throw new Error(
        `Failed Test 4: Expected 400 max duration error, got: ${resTooLong.status} ${JSON.stringify(dataTooLong)}`,
      )
    }
    console.log("  ✅ >45-day booking rejected successfully.")

    // -------------------------------------------------------------
    // Test 5: Driver Minimum Age (Under 21)
    // -------------------------------------------------------------
    console.log(
      "\n[Test 5] Driver Minimum Age Enforcement (Under 21: Age 18)...",
    )
    const resYoung = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: {
          ...baseDriver,
          dateOfBirth: "2008-05-10", // 18 years old in 2026
        },
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-13 18:00",
        requestedCategory: "Sedan",
      }),
    })
    const dataYoung = await resYoung.json()
    console.log("  Status:", resYoung.status, "| Error:", dataYoung.error)
    if (resYoung.status !== 400 || !dataYoung.error?.includes("21 years old")) {
      throw new Error(
        `Failed Test 5: Expected 400 age guard error, got: ${resYoung.status} ${JSON.stringify(dataYoung)}`,
      )
    }
    console.log("  ✅ Under-21 driver rejected successfully.")

    // -------------------------------------------------------------
    // Test 6: Driver License Already Expired
    // -------------------------------------------------------------
    console.log("\n[Test 6] Expired Driver License...")
    const resExpired = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: {
          ...baseDriver,
          licenseExpiry: "2024-01-15", // Expired in the past
        },
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-13 18:00",
        requestedCategory: "Sedan",
      }),
    })
    const dataExpired = await resExpired.json()
    console.log("  Status:", resExpired.status, "| Error:", dataExpired.error)
    if (resExpired.status !== 400 || !dataExpired.error?.includes("expired")) {
      throw new Error(
        `Failed Test 6: Expected 400 expired license error, got: ${resExpired.status} ${JSON.stringify(dataExpired)}`,
      )
    }
    console.log("  ✅ Expired license rejected successfully.")

    // -------------------------------------------------------------
    // Test 7: Driver License Expiring Mid-Rental
    // -------------------------------------------------------------
    console.log("\n[Test 7] Driver License Expiring Mid-Rental...")
    const resExpiringMidTrip = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: baseCustomer,
        driver: {
          ...baseDriver,
          licenseExpiry: "2026-11-12", // Expiring during trip (return is Nov 15)
        },
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-15 18:00",
        requestedCategory: "Sedan",
      }),
    })
    const dataMidTrip = await resExpiringMidTrip.json()
    console.log(
      "  Status:",
      resExpiringMidTrip.status,
      "| Error:",
      dataMidTrip.error,
    )
    if (
      resExpiringMidTrip.status !== 400 ||
      !dataMidTrip.error?.includes("before the scheduled rental return date")
    ) {
      throw new Error(
        `Failed Test 7: Expected 400 mid-trip expiry error, got: ${resExpiringMidTrip.status} ${JSON.stringify(dataMidTrip)}`,
      )
    }
    console.log("  ✅ License expiring mid-trip rejected successfully.")

    // -------------------------------------------------------------
    // Test 8: Invalid Customer Contact Info
    // -------------------------------------------------------------
    console.log(
      "\n[Test 8] Invalid Customer Contact Details (Malformed Email)...",
    )
    const resBadEmail = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          firstName: "John",
          lastName: "Doe",
          email: "not-a-valid-email",
          phone: "123",
        },
        driver: baseDriver,
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-12 18:00",
      }),
    })
    const dataBadEmail = await resBadEmail.json()
    console.log("  Status:", resBadEmail.status, "| Error:", dataBadEmail.error)
    if (resBadEmail.status !== 400 || !dataBadEmail.error?.includes("email")) {
      throw new Error(
        `Failed Test 8: Expected 400 email error, got: ${resBadEmail.status} ${JSON.stringify(dataBadEmail)}`,
      )
    }
    console.log("  ✅ Malformed contact info rejected successfully.")

    // -------------------------------------------------------------
    // Test 9: Fully Valid Standard Multi-Day Booking
    // -------------------------------------------------------------
    console.log("\n[Test 9] Fully Valid Standard Multi-Day Booking...")
    const testIdValid = `TEST-FULLVALID-${Date.now().toString(36)}`
    const resValid = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testIdValid,
        customer: {
          ...baseCustomer,
          email: `full-valid-${Date.now()}@test.org`,
        },
        driver: baseDriver,
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-14 18:00",
        requestedCategory: "Sedan",
        totalAmount: 320,
      }),
    })
    const dataValid = await resValid.json()
    console.log(
      "  Status:",
      resValid.status,
      "| Booking ID:",
      dataValid.id,
      "| Status:",
      dataValid.status,
    )
    if (resValid.status !== 201) {
      throw new Error(
        `Failed Test 9: Expected 201 valid booking, got: ${resValid.status} ${JSON.stringify(dataValid)}`,
      )
    }
    createdIds.push(testIdValid)
    console.log(
      "  ✅ Fully valid booking accepted with status:",
      dataValid.status,
    )

    console.log("\n🎉 ALL 9 BOOKING VALIDATION TESTS PASSED WITH 100% SUCCESS!")
  } finally {
    console.log("\nCleaning up test bookings:", createdIds)
    for (const id of createdIds) {
      await fetch(`${BASE_URL}/api/bookings/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => {})
    }
    console.log("Teardown complete.")
  }
}

run().catch((err) => {
  console.error("FATAL SUITE ERROR:", err)
  process.exit(1)
})
