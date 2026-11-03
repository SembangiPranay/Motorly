import { spawn } from "node:child_process"

const PORT = 3001
const BASE_URL = `http://127.0.0.1:${PORT}`

console.log("Starting server for E2E coupon test on port", PORT)
const serverProc = spawn("node", ["api/index.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
})

serverProc.stdout.on("data", (d) => process.stdout.write(`[SERVER] ${d}`))
serverProc.stderr.on("data", (d) => process.stderr.write(`[SERVER ERR] ${d}`))

async function waitServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error("Server failed to start")
}

async function runTests() {
  try {
    await waitServer()
    console.log("Server online, beginning tests...")

    // TEST 1: Unauthenticated user requests GET /api/promos -> Must be BLOCKED (401)
    console.log(
      "\n[TEST 1] Testing coupon privacy: Public cannot list admin promo codes",
    )
    const publicPromosRes = await fetch(`${BASE_URL}/api/promos`)
    console.log("Status:", publicPromosRes.status)
    if (publicPromosRes.status !== 401 && publicPromosRes.status !== 403) {
      throw new Error(
        `Expected 401/403 for unauthenticated GET /api/promos, got ${publicPromosRes.status}`,
      )
    }
    console.log(
      "PASS: Unauthenticated access to /api/promos is securely blocked!",
    )

    // TEST 2: Customer validates an invalid promo code
    console.log("\n[TEST 2] Testing validation of invalid promo code")
    const invalidValRes = await fetch(`${BASE_URL}/api/promos/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "FAKE999" }),
    })
    const invalidValData = await invalidValRes.json()
    console.log("Validation response:", invalidValData)
    if (invalidValData.valid !== false) {
      throw new Error("Expected valid: false for fake code")
    }
    console.log("PASS: Invalid promo returns valid: false instantly!")

    // TEST 3: Admin logs in
    console.log("\n[TEST 3] Admin authentication")
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@motorly.com",
        password: process.env.ADMIN_PASSWORD || "0709",
      }),
    })
    const loginData = await loginRes.json()
    if (!loginRes.ok || !loginData.token) {
      throw new Error("Admin login failed: " + JSON.stringify(loginData))
    }
    const adminToken = loginData.token
    console.log("PASS: Admin authenticated, token acquired.")

    // TEST 4: Admin fetches coupon list with token
    console.log("\n[TEST 4] Admin fetches promo list")
    const adminPromosRes = await fetch(`${BASE_URL}/api/promos`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    if (!adminPromosRes.ok) {
      throw new Error(
        `Admin failed to fetch promos: status ${adminPromosRes.status}`,
      )
    }
    const promosList = await adminPromosRes.json()
    console.log(
      `PASS: Admin successfully fetched ${promosList.length} promo codes!`,
    )

    // TEST 5: Admin creates a new promo code "EUROPE25"
    console.log("\n[TEST 5] Admin creates new promo coupon: EUROPE25 (25% off)")
    const testCode = "EUROPE25"
    // Delete first if already exists from previous runs
    await fetch(`${BASE_URL}/api/promos/${testCode}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch(() => {})

    const createPromoRes = await fetch(`${BASE_URL}/api/promos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: testCode,
        discountPercent: 25,
        description: "European Atelier Concession",
        expiryDate: "2027-12-31",
      }),
    })
    if (!createPromoRes.ok) {
      const err = await createPromoRes.text()
      throw new Error(`Failed to create promo: ${err}`)
    }
    const createdPromo = await createPromoRes.json()
    console.log("Created promo:", createdPromo)
    if (
      createdPromo.code !== "EUROPE25" ||
      createdPromo.discountPercent !== 25
    ) {
      throw new Error("Created promo data mismatch")
    }
    console.log("PASS: Admin created promo EUROPE25 successfully!")

    // TEST 6: Customer validates "europe25" (case-insensitive)
    console.log("\n[TEST 6] Customer validates coupon code 'europe25'")
    const custValRes = await fetch(`${BASE_URL}/api/promos/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "europe25" }),
    })
    const custValData = await custValRes.json()
    console.log("Customer validation response:", custValData)
    if (custValData.valid !== true || custValData.discountPercent !== 25) {
      throw new Error("Customer validation of EUROPE25 failed")
    }
    console.log("PASS: Customer validated EUROPE25 and got 25% discount!")

    // TEST 7: Customer creates a booking using "EUROPE25"
    console.log("\n[TEST 7] Creating reservation using promo code EUROPE25")
    const bookingId = "MTR-" + Math.floor(100000 + Math.random() * 900000)
    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bookingId,
        customer: {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@atelier.fr",
          phone: "+33 6 12 34 56 78",
        },
        driver: {
          licenseNumber: "FR-987654",
          licenseState: "Paris",
          licenseExpiry: "2029-12-31",
          dateOfBirth: "1990-05-15",
        },
        pickupLocation: "MOTORLY European Atelier Hub",
        returnLocation: "MOTORLY European Atelier Hub",
        pickupDate: "2026-11-10 10:00",
        returnDate: "2026-11-15 10:00",
        totalAmount: 375.0, // 500 - 25% ($125) = 375
        promoCode: "EUROPE25",
        status: "Pending Assignment",
      }),
    })
    if (!bookingRes.ok) {
      const err = await bookingRes.text()
      throw new Error(`Failed to create booking: ${err}`)
    }
    const createdBooking = await bookingRes.json()
    console.log("Created Booking promoCode:", createdBooking.promoCode)
    if (createdBooking.promoCode !== "EUROPE25") {
      throw new Error("Created booking did not persist promoCode")
    }
    console.log("PASS: Booking successfully created with promoCode EUROPE25!")

    // TEST 8: Verify EUROPE25 usage count was incremented
    console.log("\n[TEST 8] Verify promo usage count is incremented")
    const verifyPromoRes = await fetch(`${BASE_URL}/api/promos`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const updatedPromos = await verifyPromoRes.json()
    const euroPromo = updatedPromos.find((p) => p.code === "EUROPE25")
    console.log("EUROPE25 usageCount:", euroPromo?.usageCount)
    if (!euroPromo || euroPromo.usageCount < 1) {
      throw new Error("Usage count was not incremented")
    }
    console.log("PASS: EUROPE25 usage count correctly incremented to 1!")

    // TEST 9: Admin toggles coupon to inactive
    console.log("\n[TEST 9] Admin deactivates coupon")
    const toggleRes = await fetch(`${BASE_URL}/api/promos/EUROPE25/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const toggledPromo = await toggleRes.json()
    console.log("Toggled promo isActive:", toggledPromo.isActive)
    if (toggledPromo.isActive !== false) {
      throw new Error("Expected isActive to be false")
    }

    // Customer re-attempts to validate deactivated code
    const deactValRes = await fetch(`${BASE_URL}/api/promos/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "EUROPE25" }),
    })
    const deactValData = await deactValRes.json()
    console.log("Deactivated code validation response:", deactValData)
    if (deactValData.valid !== false) {
      throw new Error("Expected deactivated coupon to be rejected")
    }
    console.log("PASS: Deactivated coupon is properly rejected!")

    // Clean up test promo
    await fetch(`${BASE_URL}/api/promos/EUROPE25`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    console.log("\nALL 9 END-TO-END TESTS PASSED WITH 100% SUCCESS!")
  } finally {
    serverProc.kill("SIGINT")
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e)
  serverProc.kill("SIGINT")
  process.exit(1)
})
