import { test, expect } from "@playwright/test"

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

test.describe("Finite State Machine (FSM) Booking Lifecycle Suite", () => {
  let authToken: string
  let authHeaders: Record<string, string>
  const createdBookingIds: string[] = []

  test.beforeAll(async () => {
    // Authenticate as Admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@motorly.com", password: ADMIN_PASSWORD }),
    })
    const data = await loginRes.json()
    expect(data.token).toBeTruthy()
    authToken = data.token
    authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    }
  })

  test.afterAll(async () => {
    // Teardown created test records
    for (const id of createdBookingIds) {
      await fetch(`${BASE_URL}/api/bookings/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => {})
    }
  })

  test("FSM-01: Full Legal Lifecycle (Pending Review -> Approved -> Assigned -> Checked Out -> Returned -> Completed)", async () => {
    const testId = `FSM-FLOW-${Date.now().toString(36)}`
    createdBookingIds.push(testId)

    // 1. Create initial Pending Review booking
    const createRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "FsmUser",
          lastName: "Lifecycle",
          email: `fsm-${Date.now()}@test.org`,
          phone: "+15550199000",
        },
        driver: {
          dateOfBirth: "1994-04-12",
          licenseNumber: "DL-FSM-001",
          licenseState: "FL",
          licenseExpiry: "2029-12-31",
        },
        pickupDate: "2026-12-01 10:00",
        returnDate: "2026-12-05 18:00",
        requestedCategory: "Sedan",
        totalAmount: 380,
      }),
    })
    expect(createRes.status).toBe(201)
    const b1 = await createRes.json()
    expect(b1.id).toBe(testId)
    expect(b1.approvedByAdmin).toBe(false)
    expect(b1.status).toBe("Pending Assignment")

    // 2. Admin Accepts Request (POST /api/bookings/:id/accept)
    const acceptRes = await fetch(`${BASE_URL}/api/bookings/${testId}/accept`, {
      method: "POST",
      headers: authHeaders,
    })
    expect(acceptRes.status).toBe(200)
    const b2 = (await acceptRes.json()).booking
    expect(b2.approvedByAdmin).toBe(true)
    // Status must be either Assigned (if car auto-mated) or Pending Assignment (awaiting car)
    expect(["Assigned", "Pending Assignment"]).toContain(b2.status)
    expect(b2.status).not.toBe("Cancelled")

    // 3. Ensure a vehicle is assigned
    let assignedCarId = b2.matchedCarId
    if (!assignedCarId) {
      // Find an available sedan
      const carsRes = await fetch(`${BASE_URL}/api/cars`)
      const cars = await carsRes.json()
      const availableSedan = cars.find((c: any) => c.status === "Available" && c.type.toLowerCase().includes("sedan"))
      expect(availableSedan).toBeTruthy()
      assignedCarId = availableSedan.id

      const mateRes = await fetch(`${BASE_URL}/api/bookings/${testId}/mate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ carId: assignedCarId }),
      })
      expect(mateRes.status).toBe(200)
    }

    // 4. Handover Keys -> Transition to Checked Out
    const handoffRes = await fetch(`${BASE_URL}/api/bookings/${testId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "Checked Out",
        odometerOut: 12500,
        fuelLevelOut: "Full",
      }),
    })
    expect(handoffRes.status).toBe(200)
    const b4 = (await handoffRes.json()).booking
    expect(b4.status).toBe("Checked Out")
    expect(b4.odometerOut).toBe(12500)

    // 5. Vehicle Return Inspection -> Transition to Returned
    const returnRes = await fetch(`${BASE_URL}/api/bookings/${testId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "Returned",
        odometerIn: 12780,
        fuelLevelIn: "Full",
      }),
    })
    expect(returnRes.status).toBe(200)
    const b5 = (await returnRes.json()).booking
    expect(b5.status).toBe("Returned")
    expect(b5.odometerIn).toBe(12780)

    // 6. Complete Trip & Settlement -> Transition to Completed
    const completeRes = await fetch(`${BASE_URL}/api/bookings/${testId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "Completed",
      }),
    })
    expect(completeRes.status).toBe(200)
    const b6 = (await completeRes.json()).booking
    expect(b6.status).toBe("Completed")
  })

  test("FSM-02: Admin Decline Transition (Pending Review -> Cancelled)", async () => {
    const testId = `FSM-DECLINE-${Date.now().toString(36)}`
    createdBookingIds.push(testId)

    const createRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "DeclineTest",
          lastName: "Customer",
          email: `decline-${Date.now()}@test.org`,
          phone: "+15550199000",
        },
        pickupDate: "2026-12-10 10:00",
        returnDate: "2026-12-12 18:00",
        requestedCategory: "Sedan",
      }),
    })
    expect(createRes.status).toBe(201)

    // Decline booking (POST /api/bookings/:id/decline)
    const declineRes = await fetch(`${BASE_URL}/api/bookings/${testId}/decline`, {
      method: "POST",
      headers: authHeaders,
    })
    expect(declineRes.status).toBe(200)
    const declinedBooking = (await declineRes.json()).booking
    expect(declinedBooking.status).toBe("Cancelled")
  })

  test("FSM-03: Illegal Transition Rejection (Cannot Accept Already Cancelled Booking)", async () => {
    const testId = `FSM-ILLEGAL-CANCEL-${Date.now().toString(36)}`
    createdBookingIds.push(testId)

    await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "IllegalTest",
          lastName: "Customer",
          email: `illegal-${Date.now()}@test.org`,
          phone: "+15550199000",
        },
        pickupDate: "2026-12-10 10:00",
        returnDate: "2026-12-12 18:00",
        requestedCategory: "Sedan",
      }),
    })

    // Cancel first
    await fetch(`${BASE_URL}/api/bookings/${testId}/decline`, {
      method: "POST",
      headers: authHeaders,
    })

    // Attempting to Accept a cancelled reservation must be rejected
    const acceptRes = await fetch(`${BASE_URL}/api/bookings/${testId}/accept`, {
      method: "POST",
      headers: authHeaders,
    })
    expect(acceptRes.status).toBe(400)
    const errorBody = await acceptRes.json()
    expect(errorBody.error).toContain("cancelled")
  })

  test("FSM-04: Cannot Mate Vehicle Under Maintenance", async () => {
    const testId = `FSM-MAINT-TEST-${Date.now().toString(36)}`
    createdBookingIds.push(testId)

    await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        customer: {
          firstName: "MaintTest",
          lastName: "Customer",
          email: `maint-${Date.now()}@test.org`,
          phone: "+15550199000",
        },
        pickupDate: "2026-12-10 10:00",
        returnDate: "2026-12-12 18:00",
        requestedCategory: "Sedan",
      }),
    })

    // Find maintenance vehicle
    const carsRes = await fetch(`${BASE_URL}/api/cars`)
    const cars = await carsRes.json()
    const maintCar = cars.find((c: any) => c.status === "Maintenance")
    if (maintCar) {
      const mateRes = await fetch(`${BASE_URL}/api/bookings/${testId}/mate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ carId: maintCar.id }),
      })
      expect(mateRes.status).toBe(409)
      const err = await mateRes.json()
      expect(err.error).toContain("maintenance")
    }
  })
})
