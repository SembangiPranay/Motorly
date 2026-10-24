const BASE_URL = "http://localhost:3001/api"

async function run() {
  console.log("🚀 Testing Simplified DriveRent Workflow & Super-Efficient RBAC")

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`)
  const health = await healthRes.json()
  console.log("1. Health Status:", health.status, "| Supabase:", health.supabase)
  if (health.status !== "ok") throw new Error("Health check failed")

  // 2. Test RBAC: Manager Auth vs Customer Auth
  console.log("\n--- Testing Super-Efficient RBAC ---")
  
  // 2a. Login as Manager (Admin)
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "0709" }),
  })
  const adminLogin = await adminLoginRes.json()
  const adminToken = adminLogin.token
  console.log("2a. Manager Auth Token received (role: admin):", Boolean(adminToken))

  // 2b. Register/Login as Customer
  const customerEmail = `renter_${Date.now()}@example.com`
  const customerRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: customerEmail,
      name: "Marcus Aurelius",
      password: "Password123!",
      phone: "+1 (555) 345-6789",
    }),
  })
  const customerReg = await customerRegRes.json()
  const customerToken = customerReg.token
  const customerId = customerReg.user?.id
  console.log("2b. Customer Registered (role: customer):", customerEmail, "ID:", customerId)

  // 2c. Fast RBAC Barrier Check: Customer cannot access Manager routes (403 Forbidden)
  const forbiddenAdminCheck = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  })
  console.log("2c. Customer trying to access Admin Stats:", forbiddenAdminCheck.status, "(Expected: 403 Forbidden)")
  if (forbiddenAdminCheck.status !== 403) throw new Error("RBAC failed: Customer was not blocked with 403!")

  // 2d. Manager accessing Manager routes (200 OK)
  const adminStatsCheck = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  console.log("2d. Manager accessing Admin Stats:", adminStatsCheck.status, "(Expected: 200 OK)")
  if (adminStatsCheck.status !== 200) throw new Error("Manager failed to access Admin Stats!")

  // 3. Clean car checking & dynamic price & availability
  console.log("\n--- Checking Cars, Free Dates & Transparent Pricing ---")
  const carsRes = await fetch(`${BASE_URL}/cars`)
  const cars = await carsRes.json()
  const targetCar = cars.find((c) => c.status === "Available") || cars[0]
  console.log(`3a. Selected Car: "${targetCar.name}" | Daily Rate: $${targetCar.pricePerDay}/day`)

  // Generate unique test dates based on timestamp
  const randomOffsetDays = Math.floor(200 + Math.random() * 500)
  const dStart = new Date(Date.now() + randomOffsetDays * 86400000)
  const dEnd = new Date(Date.now() + (randomOffsetDays + 4) * 86400000)
  const testPickup = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const testReturn = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const availRes = await fetch(
    `${BASE_URL}/cars/${targetCar.id}/availability?pickupDate=${encodeURIComponent(testPickup)}&returnDate=${encodeURIComponent(testReturn)}`
  )
  const avail = await availRes.json()
  console.log(`3b. Checking Availability (${testPickup} -> ${testReturn}):`, avail.isAvailable ? "FREE / AVAILABLE" : "OCCUPIED")
  if (!avail.isAvailable) throw new Error("Expected test dates to be available")

  // Calculate pricing
  const days = 4
  const expectedBase = targetCar.pricePerDay * days
  const taxes = expectedBase * 0.18
  const grandTotal = expectedBase + taxes
  console.log(`3c. Pricing Breakdown: $${targetCar.pricePerDay} × ${days} days = $${expectedBase} (+ taxes: $${taxes.toFixed(2)}) -> Grand Total: $${grandTotal.toFixed(2)} (Due on Pickup)`)

  // 4. Create Booking Request with NO ONLINE PAYMENT
  console.log("\n--- Submitting Booking Request (Zero Online Payment) ---")
  const bookingPayload = {
    carId: targetCar.id,
    matchedCarId: targetCar.id,
    userId: customerId,
    customer: {
      firstName: "Marcus",
      lastName: "Aurelius",
      email: customerEmail,
      phone: "+1 (555) 345-6789",
    },
    driver: {
      dateOfBirth: "04/26/1980",
      licenseNumber: "FL-9918-2027",
      licenseState: "Florida",
      licenseExpiry: "05/15/2030",
    },
    payment: {
      method: "pickup", // NO CARD DETAILS!
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "Pay at Hub",
    },
    pickupLocation: "Miami International Airport (MIA)",
    returnLocation: "Miami International Airport (MIA)",
    pickupDate: testPickup,
    returnDate: testReturn,
    totalAmount: grandTotal,
  }

  const createRes = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify(bookingPayload),
  })

  if (createRes.status !== 201) {
    const errText = await createRes.text()
    throw new Error(`Booking creation failed (${createRes.status}): ${errText}`)
  }

  const newBooking = await createRes.json()
  console.log(`4a. Reservation Request Created: ${newBooking.id}`)
  console.log(`    Status: "${newBooking.status}" | Approved by Manager: ${Boolean(newBooking.approvedByAdmin) ? "Yes" : "No (Pending)"}`)
  console.log(`    Total Due at Hub: $${newBooking.totalAmount}`)
  if (Boolean(newBooking.approvedByAdmin)) throw new Error("Expected booking to start unapproved (pending manager acceptance)")

  // 5. Manager Reviews and Accepts Request
  console.log("\n--- Manager Reviews & Accepts Request ---")
  const acceptRes = await fetch(`${BASE_URL}/bookings/${newBooking.id}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  })

  if (acceptRes.status !== 200) {
    const errText = await acceptRes.text()
    throw new Error(`Manager acceptance failed (${acceptRes.status}): ${errText}`)
  }

  const acceptData = await acceptRes.json()
  console.log("5a. Manager Accept Response:", acceptData.message)
  console.log(`    Booking Approved by Manager: ${Boolean(acceptData.booking.approvedByAdmin) ? "✅ YES" : "❌ NO"}`)
  if (!Boolean(acceptData.booking.approvedByAdmin)) throw new Error("Booking was not approved in database!")

  // 6. Customer Checks Their Bookings
  console.log("\n--- Customer Verifies Accepted Booking in Portal ---")
  const customerBookingsRes = await fetch(`${BASE_URL}/users/bookings`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  })
  const customerBookings = await customerBookingsRes.json()
  const found = customerBookings.find((b) => b.id === newBooking.id)
  console.log(`6a. Found in Customer Portal: ${Boolean(found)} | Approved: ${Boolean(found?.approvedByAdmin) ? "✅ YES" : "❌ NO"}`)
  if (!found || !Boolean(found.approvedByAdmin)) throw new Error("Customer portal does not reflect manager acceptance!")

  // 7. Test Manager Decline Flow
  console.log("\n--- Testing Manager Decline Flow ---")
  const dDeclineStart = new Date(Date.now() + Math.floor(2500 + Math.random() * 800) * 86400000)
  const dDeclineEnd = new Date(dDeclineStart.getTime() + 4 * 86400000)
  const declinePickup = dDeclineStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const declineReturn = dDeclineEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const declineBookingRes = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      ...bookingPayload,
      pickupDate: declinePickup,
      returnDate: declineReturn,
    }),
  })
  const toDecline = await declineBookingRes.json()
  if (declineBookingRes.status !== 201) {
    console.error("Booking creation for decline failed:", declineBookingRes.status, toDecline)
    throw new Error("Failed to create booking for decline test")
  }
  console.log(`7a. New Request to Decline: ${toDecline.id}`)

  const declineRes = await fetch(`${BASE_URL}/bookings/${toDecline.id}/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  })
  const declineData = await declineRes.json()
  console.log(`7b. Manager Decline Response: "${declineData.message}" | Status: ${declineData.booking.status}`)
  if (declineData.booking.status !== "Cancelled") throw new Error("Decline did not mark booking as Cancelled!")

  console.log("\n======================================================================")
  console.log("  🏆 ALL CHECKS PASSED: SIMPLIFIED WORKFLOW & RBAC VERIFIED 100%")
  console.log("======================================================================")
}

run().catch((err) => {
  console.error("❌ Test failed:", err)
  process.exit(1)
})
