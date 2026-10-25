// Built-in environment or flags

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

async function run() {
  console.log("=== Testing Accept Request Workflow Fix ===")

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@motorly.com", password: ADMIN_PASSWORD }),
  })
  const loginData = await loginRes.json()
  if (!loginData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`)
  }
  const token = loginData.token
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  // 2. Create a test unassigned booking in Pending Review
  const testId = `TEST-ACCEPT-${Date.now().toString(36)}`
  const bookingPayload = {
    id: testId,
    customer: {
      firstName: "TestAccept",
      lastName: "Tester",
      email: `accept-test-${Date.now()}@test.org`,
      phone: "+15550001111",
      driverLicense: "DL-ACCEPT-999",
      address: "123 Test St",
    },
    carId: null,
    requestedCategory: "Sedan",
    pickupDate: "2026-11-10 10:00",
    returnDate: "2026-11-12 18:00",
    pickupLocation: "Downtown Garage",
    totalPrice: 250,
  }

  const createRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload),
  })
  const createData = await createRes.json()
  const createdBooking = createData.booking || (createData.id ? createData : null)
  if (!createdBooking) {
    throw new Error(`Failed to create test booking: ${JSON.stringify(createData)}`)
  }
  console.log("1. Created Pending Review booking:", createdBooking.id, "Status:", createdBooking.status, "Approved:", createdBooking.approvedByAdmin)

  try {
    // 3. Admin Accepts the Request (POST /api/bookings/:id/accept)
    const acceptRes = await fetch(`${BASE_URL}/api/bookings/${testId}/accept`, {
      method: "POST",
      headers: authHeaders,
    })
    const acceptData = await acceptRes.json()
    console.log("2. Admin Accept Response:", acceptData.message)
    console.log("   Updated Booking Status:", acceptData.booking.status)
    console.log("   Approved by Admin:", acceptData.booking.approvedByAdmin)
    console.log("   Matched Car ID:", acceptData.booking.matchedCarId || "None (Pending Assignment)")

    // 4. Assert invariants
    if (acceptData.booking.status === "Cancelled") {
      throw new Error("CRITICAL FAILURE: Status was set to Cancelled!")
    }
    if (!acceptData.booking.approvedByAdmin) {
      throw new Error("CRITICAL FAILURE: approvedByAdmin is false!")
    }
    if (acceptData.booking.status !== "Assigned" && acceptData.booking.status !== "Pending Assignment") {
      throw new Error(`Unexpected status: ${acceptData.booking.status}`)
    }

    // 5. Simulate AdminView badge logic
    const b = acceptData.booking
    const isPendingReview = !b.approvedByAdmin && (b.status === "Pending Assignment" || b.status === "Draft" || b.status === "Reserved")
    let badgeText = ""
    if (isPendingReview) {
      badgeText = "Pending Review"
    } else if (b.status === "Assigned") {
      badgeText = "Confirmed (Ready)"
    } else if (b.status === "Pending Assignment") {
      badgeText = b.approvedByAdmin ? "Approved (Assign Car)" : "Pending Mating"
    } else if (b.status === "Checked Out") {
      badgeText = "Active Trip"
    } else if (b.status === "Returned") {
      badgeText = "Returned"
    } else if (b.status === "Completed") {
      badgeText = "Completed"
    } else if (b.status === "Cancelled") {
      badgeText = "Declined"
    } else {
      badgeText = b.status
    }

    console.log("3. Simulated AdminView Badge Text:", badgeText)
    if (badgeText === "Declined") {
      throw new Error("CRITICAL FAILURE: Badge resolved to Declined!")
    }
    console.log("✅ ACCEPT REQUEST BUG VERIFIED FIXED: Badge is", badgeText)

    // Also test accepting when NO car can be mated (e.g. unknown category)
    const testId2 = `TEST-ACCEPT-UNMATED-${Date.now().toString(36)}`
    const bookingPayload2 = {
      ...bookingPayload,
      id: testId2,
      requestedCategory: "ExoticRocketShip",
    }
    const createRes2 = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload2),
    })
    const createData2 = await createRes2.json()
    console.log("5. Created Unmateable category booking response:", JSON.stringify(createData2))
    const acceptRes2 = await fetch(`${BASE_URL}/api/bookings/${testId2}/accept`, {
      method: "POST",
      headers: authHeaders,
    })
    const acceptData2 = await acceptRes2.json()
    console.log("6. Admin Accept Response JSON:", JSON.stringify(acceptData2))
    console.log("   Admin Accept Response:", acceptData2.message)
    console.log("   Updated Booking Status:", acceptData2.booking.status)
    console.log("   Approved by Admin:", acceptData2.booking.approvedByAdmin)
    console.log("   Matched Car ID:", acceptData2.booking.matchedCarId || "None (Pending Assignment)")

    const b2 = acceptData2.booking
    const isPendingReview2 = !b2.approvedByAdmin && (b2.status === "Pending Assignment" || b2.status === "Draft" || b2.status === "Reserved")
    let badgeText2 = ""
    if (isPendingReview2) {
      badgeText2 = "Pending Review"
    } else if (b2.status === "Assigned") {
      badgeText2 = "Confirmed (Ready)"
    } else if (b2.status === "Pending Assignment") {
      badgeText2 = b2.approvedByAdmin ? "Approved (Assign Car)" : "Pending Mating"
    } else if (b2.status === "Cancelled") {
      badgeText2 = "Declined"
    } else {
      badgeText2 = b2.status
    }
    console.log("7. Simulated AdminView Badge Text for Unassigned Approved:", badgeText2)
    if (badgeText2 === "Declined") {
      throw new Error("CRITICAL FAILURE: Unassigned approved booking badge resolved to Declined!")
    }
    console.log("✅ UNASSIGNED APPROVAL VERIFIED: Badge is", badgeText2)

    await fetch(`${BASE_URL}/api/bookings/${testId2}`, {
      method: "DELETE",
      headers: authHeaders,
    }).catch(() => {})

  } finally {
    // Cleanup test record
    await fetch(`${BASE_URL}/api/bookings/${testId}`, {
      method: "DELETE",
      headers: authHeaders,
    }).catch(() => {})
    console.log("4. Cleaned up test booking:", testId)
  }
}

run().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
