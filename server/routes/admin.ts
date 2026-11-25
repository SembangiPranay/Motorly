import { Router } from "express"
import { cachedHubAddress } from "../hub.ts"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import { isProduction } from "../config.ts"
import { formatBookingRow } from "../serializers.ts"
import { findVehicleBookingConflict } from "../booking-rules.ts"

const router = Router()

// POST Purge Mock / Test Bookings and Mock Users (Database Cleanup)
router.post("/admin/clean-test-data", requireAdmin, async (req, res) => {
  if (isProduction || db.isSupabase) {
    return res
      .status(403)
      .json({ success: false, message: "Test data cleanup is available on local SQLite only." })
  }
  try {
    const deleteBookingsQuery = `
      DELETE FROM bookings
      WHERE LOWER(customer_first_name) LIKE '%test%'
         OR LOWER(customer_last_name) LIKE '%test%'
         OR LOWER(customer_last_name) LIKE '%jjjj%'
         OR LOWER(customer_last_name) LIKE '%asdas%'
         OR LOWER(customer_first_name) LIKE '%pranay%'
         OR LOWER(customer_first_name) LIKE '%koushik%'
         OR LOWER(customer_email) LIKE '%example.com%'
         OR customer_phone IN ('8899556622', '9876543210', '+1234567890')
    `
    const deleteUsersQuery = `
      DELETE FROM users
      WHERE id IN ('usr_101', 'usr_102', 'usr_103')
         OR email IN ('john.doe@email.com', 'david.c@techventure.io', 'sarah.m@vipclient.com', 'test@gmail.com')
         OR email LIKE '%example.com%'
    `
    await db.transaction(async (tx) => {
      await tx.run(deleteBookingsQuery)
      await tx.run(deleteUsersQuery)
    })
    return res.json({ success: true, message: "Test bookings and dummy users purged cleanly." })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message })
  }
})

// POST Admin Walk-In / Counter Reservation with Database-Level Concurrency Protection (< 60s)
router.post("/admin/counter-booking", requireAdmin, async (req, res) => {
  const b = req.body || {}
  const id = b.id || `CWK-${Math.floor(100000 + Math.random() * 900000)}`

  const carId = b.carId
  if (!carId) {
    return res.status(400).json({ error: "A vehicle must be selected for counter dispatch." })
  }

  const outcome = await db.withVehicleBookingLock(carId, async (tx) => {
    const car = (await tx.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)) as any
    if (!car) {
      return { status: 404, body: { error: "Selected vehicle not found." } }
    }

    if (car.status === "Maintenance" || (b.immediateCheckout && car.status !== "Available")) {
      return { status: 409, body: { error: `${car.name} is unavailable for counter dispatch.` } }
    }

    const now = new Date()
    let pickupDateStr = b.pickupDate
    let returnDateStr = b.returnDate
    if (!pickupDateStr || /today|now/i.test(pickupDateStr)) {
      pickupDateStr = now.toISOString()
    }
    if (!returnDateStr || /in\s+\d+\s+days?/i.test(returnDateStr)) {
      const days = parseInt(returnDateStr?.match(/\d+/)?.[0] || String(b.totalDays || "3"), 10)
      const ret = new Date(now.getTime() + days * 86400000)
      returnDateStr =
        ret.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + " 06:00 PM"
    }

    // Prevent counter dispatch of an already booked or rented vehicle
    const conflict = await findVehicleBookingConflict(
      carId,
      pickupDateStr,
      returnDateStr,
      undefined,
      tx,
    )
    if (conflict) {
      return {
        status: 409,
        body: {
          error:
            conflict?.conflictingBookingId &&
            conflict.conflictingBookingId !== "INVALID_DATES" &&
            conflict.conflictingBookingId !== "DB_FAILSAFE"
              ? `Conflict: ${car.name} (${car.plate_number}) is currently rented or assigned to another active reservation (${conflict.conflictingBookingId}).`
              : conflict?.reason ||
                `Conflict: ${car.name} (${car.plate_number}) is currently unavailable for dispatch.`,
        },
      }
    }

    const initialStatus = b.immediateCheckout ? "Checked Out" : "Assigned"

    await tx
      .prepare(
        `
      INSERT INTO bookings (
        id, customer_first_name, customer_last_name, customer_email, customer_phone,
        driver_dob, driver_license_num, driver_license_state, driver_license_expiry, driver_license_file, driver_license_back_file,
        pickup_location, return_location, pickup_date, return_date,
        requested_category, matched_car_id, status, total_amount, created_at,
        odometer_out, fuel_level_out, notes, approved_by_admin, approved_at,
        trip_reason, keys_handed_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 1, ?,
        ?, ?
      )
    `,
      )
      .run(
        id,
        b.firstName || "Walk-In",
        b.lastName || "Customer",
        b.email || "counter.guest@pitstopcarhire.com",
        b.phone || "+1 (555) 019-9922",
        b.dob || "01/01/1990",
        b.licenseNumber || `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
        b.licenseState || "Florida",
        b.licenseExpiry || "12/2029",
        b.licensePhotoFront || b.licenseFile || b.licenseFileName || "counter_scanned_id.jpg",
        b.licensePhotoBack || "",
        b.pickupLocation && !b.pickupLocation.includes("Miami")
          ? b.pickupLocation
          : car.location && !car.location.includes("Miami")
            ? car.location
            : cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta",
        b.returnLocation && !b.returnLocation.includes("Miami")
          ? b.returnLocation
          : car.location && !car.location.includes("Miami")
            ? car.location
            : cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta",
        pickupDateStr,
        returnDateStr,
        car.type,
        carId,
        initialStatus,
        Number(b.totalAmount) || car.price_per_day * 3,
        now.toISOString(),
        b.odometerOut || 15400,
        b.fuelLevelOut || "100%",
        b.notes || "Express counter walk-in reservation.",
        new Date().toISOString(),
        b.tripReason || "Walk-In Counter Dispatch",
        b.immediateCheckout ? now.toISOString() : null,
      )

    if (b.immediateCheckout) {
      await tx.run("UPDATE vehicles SET status = 'Rented' WHERE id = ?", carId)
    }

    const created = await tx.prepare("SELECT * FROM bookings WHERE id = ?").get(id)
    return {
      status: 201,
      body: {
        success: true,
        message: `Counter walk-in reservation ${id} issued for ${car.name}.`,
        booking: formatBookingRow(created),
      },
    }
  })
  return res.status(outcome.status).json(outcome.body)
})

// GET Customer CRM Directory - Lightweight projection avoiding massive image transfers
router.get("/admin/customers", requireAdmin, async (req, res) => {
  const users = (await db
    .prepare("SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC")
    .all()) as any[]
  const allBookings = (await db
    .prepare(
      `
      SELECT
        id, customer_email, total_amount, created_at, customer_first_name,
        customer_last_name, customer_phone, driver_license_num,
        driver_license_state, driver_license_expiry
      FROM bookings
      ORDER BY created_at DESC
    `,
    )
    .all()) as any[]

  // Group bookings by email in O(N)
  const bookingsByEmail = new Map<string, any[]>()
  for (const b of allBookings) {
    const email = (b.customer_email || "").toLowerCase().trim()
    if (!email) continue
    const list = bookingsByEmail.get(email) || []
    list.push(b)
    bookingsByEmail.set(email, list)
  }

  const customerMap = new Map<string, any>()

  for (const u of users) {
    const email = (u.email || "").toLowerCase().trim()
    const userBookings = bookingsByEmail.get(email) || []
    const totalSpent = userBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
    customerMap.set(email, {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      driverLicenseNum: u.driver_license_num,
      driverLicenseState: u.driver_license_state,
      driverLicenseExpiry: u.driver_license_expiry,
      vipTier: u.vip_tier || "Standard",
      totalBookings: userBookings.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      createdAt: u.created_at,
      hasAccount: true,
      latestBooking: userBookings[0] ? userBookings[0].created_at : "None",
    })
  }

  // Also include guest drivers who booked without creating an account
  for (const b of allBookings) {
    const email = (b.customer_email || "").toLowerCase().trim()
    if (!email || customerMap.has(email)) continue

    const guestBookings = bookingsByEmail.get(email) || []
    const totalSpent = guestBookings.reduce((sum, x) => sum + Number(x.total_amount || 0), 0)
    customerMap.set(email, {
      id: `guest_${email.replace(/[^a-z0-9]/g, "_")}`,
      email: b.customer_email,
      name: `${b.customer_first_name} ${b.customer_last_name}`,
      phone: b.customer_phone,
      driverLicenseNum: b.driver_license_num || "Pending Verification",
      driverLicenseState: b.driver_license_state || "N/A",
      driverLicenseExpiry: b.driver_license_expiry || "N/A",
      vipTier: totalSpent > 500 ? "Silver" : "Standard",
      totalBookings: guestBookings.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      createdAt: b.created_at,
      hasAccount: false,
      latestBooking: b.created_at,
    })
  }

  return res.json(Array.from(customerMap.values()))
})

router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [fleetStats, bookingStats] = await Promise.all([
      db.get(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Available' OR status IS NULL OR status = '' THEN 1 END) AS available,
          COUNT(CASE WHEN status = 'Rented' THEN 1 END) AS rented,
          COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) AS maintenance,
          COUNT(CASE WHEN status = 'Cleaning' THEN 1 END) AS cleaning,
          COALESCE(SUM(CASE WHEN status = 'Rented' THEN price_per_day ELSE 0 END), 0) AS active_revenue
        FROM vehicles
      `),
      db.get(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Pending Assignment' THEN 1 END) AS pending_mating,
          COUNT(CASE WHEN status = 'Assigned' THEN 1 END) AS assigned
        FROM bookings
      `),
    ])

    const totalFleet = Number(fleetStats?.total || 0)
    const available = Number(fleetStats?.available || 0)
    const rented = Number(fleetStats?.rented || 0)
    const maintenance = Number(fleetStats?.maintenance || 0)
    const cleaning = Number(fleetStats?.cleaning || 0)
    const activeRevenue = Number(fleetStats?.active_revenue || 0)
    const utilization = totalFleet > 0 ? Math.round((rented / totalFleet) * 100) : 0

    const totalBookings = Number(bookingStats?.total || 0)
    const pendingMating = Number(bookingStats?.pending_mating || 0)
    const assigned = Number(bookingStats?.assigned || 0)

    return res.json({
      fleet: {
        total: totalFleet,
        available,
        rented,
        maintenance,
        cleaning,
        utilization,
        activeRevenue,
      },
      bookings: {
        total: totalBookings,
        pendingMating,
        assigned,
      },
    })
  } catch (err: any) {
    console.error("[Admin Stats Aggregation Error]", err?.message)
    return res.status(500).json({ error: "Failed to aggregate admin telemetry statistics." })
  }
})

export default router
