import { Router } from "express"
import type express from "express"
import { cachedHubAddress } from "../hub.ts"
import { db } from "../db.ts"
import {
  type JwtUserPayload,
  requireAuth,
  requireAdmin,
  optionalAuth,
  canAccessBooking,
} from "../auth.ts"
import { parseBookingDateSort, formatBookingRow, formatCarRow } from "../serializers.ts"
import { calculateRentalPrice, checkoutCharges } from "../../src/utils/pricing.ts"
import {
  parseDateRangeStrict,
  validateCustomerContact,
  validateDriverInfo,
  findVehicleBookingConflict,
} from "../booking-rules.ts"
import { notifyBookingCreated } from "../notifications.ts"

const router = Router()

// Get Customer Bookings (Self-service portal) - Strictly Authenticated
router.get(
  "/users/bookings",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const user = req.user!
    let cleanEmail = ""
    let targetUserId = ""

    if (user.role === "admin") {
      // Admin can query a specific customer's email or view all
      const requestedEmail = req.query.email as string | undefined
      if (requestedEmail) {
        cleanEmail = requestedEmail.trim().toLowerCase()
      } else {
        const allRows = (await db
          .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
          .all()) as any[]
        allRows.sort(
          (a, b) => parseBookingDateSort(b.created_at) - parseBookingDateSort(a.created_at),
        )
        return res.json(allRows.map(formatBookingRow))
      }
    } else {
      // Regular customer can strictly only access THEIR OWN reservations
      cleanEmail = user.email.toLowerCase()
      targetUserId = user.userId
    }

    let rows: any[] = []
    if (cleanEmail && targetUserId) {
      rows = (await db
        .prepare(`SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC`)
        .all(targetUserId)) as any[]
    } else if (cleanEmail) {
      rows = (await db
        .prepare(`SELECT * FROM bookings WHERE LOWER(customer_email) = ? ORDER BY created_at DESC`)
        .all(cleanEmail)) as any[]
    } else if (targetUserId) {
      rows = (await db
        .prepare(`SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC`)
        .all(targetUserId)) as any[]
    }

    rows.sort((a, b) => parseBookingDateSort(b.created_at) - parseBookingDateSort(a.created_at))

    return res.json(rows.map(formatBookingRow))
  },
)

// Direct Booking Lookup (Public / Self-service by confirmation code)
router.get(
  "/bookings/lookup/:id",
  optionalAuth,
  async (req: express.Request<{ id: string }> & { user?: JwtUserPayload }, res) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: "Booking ID is required" })
    const row = (await db
      .prepare("SELECT * FROM bookings WHERE LOWER(id) = LOWER(?)")
      .get(id.trim())) as any
    if (!row) return res.status(404).json({ error: "Reservation not found" })
    if (canAccessBooking(req.user, row)) return res.json(formatBookingRow(row))
    const isCustomDelivery = row.delivery_type === "custom"
    const isCustomReturn = row.return_type === "custom"
    const publicHub = cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta"
    return res.json({
      id: row.id,
      status: row.status,
      approvedByAdmin: Boolean(row.approved_by_admin),
      approvedAt: row.approved_at || undefined,
      keysHandedAt: row.keys_handed_at || undefined,
      matchedCarId: row.matched_car_id,
      requestedCategory: row.requested_category,
      pickupDate: row.pickup_date,
      returnDate: row.return_date,
      deliveryType: isCustomDelivery ? "custom" : "garage",
      returnType: isCustomReturn ? "custom" : "garage",
      pickupLocation: isCustomDelivery
        ? "Custom delivery (see confirmation email)"
        : row.pickup_location && !String(row.pickup_location).includes("Miami")
          ? row.pickup_location
          : publicHub,
      returnLocation: isCustomReturn
        ? "Custom return (see confirmation email)"
        : row.return_location && !String(row.return_location).includes("Miami")
          ? row.return_location
          : publicHub,
      customer: { firstName: "Guest", lastName: "", email: "", phone: "" },
      totalAmount: row.total_amount,
      securityDeposit: Number(row.security_deposit) || 700,
    })
  },
)

// GET all bookings (Admin only) - Lightweight projection avoids transferring megabytes of base64 photos over WAN
router.get("/bookings", requireAdmin, async (req, res) => {
  const rows = (await db
    .prepare(
      `
      SELECT
        id, customer_first_name, customer_last_name, customer_email, customer_phone,
        driver_dob, driver_license_num, driver_license_state, driver_license_expiry,
        pickup_location, return_location, pickup_date, return_date,
        requested_category, matched_car_id, status, total_amount, created_at,
        user_id, notes, trip_reason, promo_code, approved_by_admin, approved_at, keys_handed_at,
        extension_status, extension_request, extension_quote,
        checklist_out, checklist_in, inspection_notes, inspection_passed,
        odometer_out, odometer_in, fuel_level_out, fuel_level_in,
        delivery_type, delivery_location_custom, delivery_fee,
        return_type, return_location_custom, return_fee,
        optional_services, optional_services_cost, security_deposit,
        remarks, client_signature, condition_pins, condition_photos,
        delivery_coordinates, return_coordinates,
        CASE WHEN driver_license_file LIKE 'data:%' THEN 'data:base64' ELSE driver_license_file END as driver_license_file,
        CASE WHEN driver_license_back_file LIKE 'data:%' THEN 'data:base64' ELSE driver_license_back_file END as driver_license_back_file,
        CASE WHEN driver_selfie_file LIKE 'data:%' THEN 'data:base64' ELSE driver_selfie_file END as driver_selfie_file
      FROM bookings
      ORDER BY created_at DESC
    `,
    )
    .all()) as any[]
  rows.sort((a, b) => parseBookingDateSort(b.created_at) - parseBookingDateSort(a.created_at))
  return res.json(rows.map(formatBookingRow))
})

// POST create booking with Database-Level Concurrency Protection
router.post(
  "/bookings",
  optionalAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const b = req.body || {}
    const matchedCarId = b.matchedCarId || b.carId || null
    const id = b.id || `MTR-${Math.floor(100000 + Math.random() * 900000)}`
    const nowIso = new Date().toISOString()
    const { pickupDate, returnDate } = b

    // 1. Validate date range strictly (enforces future pickup, same-day min 3 hours, max 45 days)
    const range = parseDateRangeStrict(pickupDate, returnDate, {
      checkPastDates: true,
    })
    if (!range.valid) {
      return res.status(400).json({
        success: false,
        error: range.error || "Invalid rental dates specified.",
      })
    }

    // 2. Validate customer contact details
    const customerValidation = validateCustomerContact(b.customer)
    if (!customerValidation.valid) {
      return res.status(400).json({
        success: false,
        error: customerValidation.error,
      })
    }

    // 3. Validate driver license and minimum age (21+)
    const driverValidation = validateDriverInfo(b.driver, range.start, range.end)
    if (!driverValidation.valid) {
      return res.status(400).json({
        success: false,
        error: driverValidation.error,
      })
    }

    try {
      const createdRow = await db.withVehicleBookingLock(matchedCarId, async (tx) => {
        // CRITICAL: Database-level Concurrency & Conflict Protection
        let vehicle = null
        if (matchedCarId) {
          vehicle = formatCarRow(
            await tx.prepare("SELECT * FROM vehicles WHERE id = ?").get(matchedCarId),
          )
          if (!vehicle) {
            const err = new Error(
              `Selected vehicle "${matchedCarId}" does not exist in fleet inventory.`,
            ) as any
            err.statusCode = 400
            throw err
          }

          if (vehicle.status === "Maintenance") {
            const err = new Error(
              `Vehicle "${matchedCarId}" is currently in maintenance and unavailable for booking.`,
            ) as any
            err.statusCode = 409
            throw err
          }

          if (vehicle.status === "Rented") {
            const activeRental = (await tx
              .prepare(
                "SELECT id, pickup_date, return_date FROM bookings WHERE matched_car_id = ? AND status = 'Checked Out' LIMIT 1",
              )
              .get(matchedCarId)) as any
            if (activeRental) {
              const err = new Error(
                `${vehicle.name} is currently out on an active rental (${activeRental.pickup_date} – ${activeRental.return_date}) and cannot be reserved until returned.`,
              ) as any
              err.statusCode = 409
              throw err
            }
          }

          const conflict = await findVehicleBookingConflict(
            matchedCarId,
            pickupDate,
            returnDate,
            undefined,
            tx,
          )
          if (conflict) {
            const err = new Error(
              conflict.conflictingBookingId &&
                conflict.conflictingBookingId !== "INVALID_DATES" &&
                conflict.conflictingBookingId !== "DB_FAILSAFE"
                ? `This vehicle is already reserved from ${conflict.pickupDate} to ${conflict.returnDate}. Please select another car or change your rental dates.`
                : conflict.reason ||
                    "Double Booking Conflict: Vehicle is unavailable for selected dates.",
            ) as any
            err.statusCode = 409
            throw err
          }
        }

        // Validate Promo Code safely against foreign key
        let validPromoCode: string | null = null
        let discountPercent = 0
        if (b.promoCode) {
          const candidateCode = String(b.promoCode).trim().toUpperCase()
          const promoRow = (await tx
            .prepare("SELECT * FROM promo_codes WHERE code = ?")
            .get(candidateCode)) as any
          const expiry = promoRow?.expiry_date ? Date.parse(promoRow.expiry_date) : Infinity
          if (!promoRow?.is_active || expiry < Date.now()) {
            throw Object.assign(new Error("The selected promo code is unavailable."), {
              statusCode: 400,
            })
          }
          validPromoCode = candidateCode
          discountPercent = Math.min(100, Math.max(0, Number(promoRow.discount_percent) || 0))
          await tx.run(
            "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = ?",
            candidateCode,
          )
        }

        const scheduled = parseDateRangeStrict(pickupDate, returnDate)
        const start = new Date(scheduled.start)
        const end = new Date(scheduled.end)
        const days = Math.max(1, Math.round((scheduled.end - scheduled.start) / 86400000))
        const deliveryType = b.deliveryType === "custom" ? "custom" : "garage"
        const returnType = b.returnType === "custom" ? "custom" : "garage"
        const rentalPrice = vehicle
          ? calculateRentalPrice({
              car: vehicle,
              isSameDay: start.toDateString() === end.toDateString(),
              sameDayHours: scheduled.durationHours,
              days,
            }).basePrice
          : 0
        const charges = checkoutCharges({
          rentalPrice,
          discountPercent,
          vatPercent: vehicle?.vatRate ?? 18,
          deliveryType,
          returnType,
          services: Array.isArray(b.optionalServices) ? b.optionalServices : [],
          days,
        })

        // Validate User ID safely against foreign key
        let validUserId: string | null = null
        const candidateUserId = req.user?.role === "customer" ? req.user.userId : null
        if (candidateUserId) {
          const userRow = (await tx
            .prepare("SELECT id FROM users WHERE id = ?")
            .get(candidateUserId)) as any
          if (userRow) {
            validUserId = candidateUserId
          }
        }

        // Enforce rigorous reservation lifecycle: All online customer bookings begin as 'Pending Assignment' awaiting fleet manager clearance
        const status = "Pending Assignment"
        const createdAtValue = b.createdAt && b.createdAt.includes("T") ? b.createdAt : nowIso

        await tx
          .prepare(
            `
          INSERT INTO bookings (
            id, customer_first_name, customer_last_name, customer_email, customer_phone,
            driver_dob, driver_license_num, driver_license_state, driver_license_expiry,
            driver_license_file, driver_license_back_file, driver_selfie_file,
            pickup_location, return_location, pickup_date, return_date,
            requested_category, matched_car_id, status, total_amount, created_at,
            user_id, notes, promo_code, approved_by_admin, extension_status, inspection_passed,
            trip_reason, delivery_type, delivery_location_custom, delivery_fee,
            return_type, return_location_custom, return_fee,
            optional_services, optional_services_cost, security_deposit, remarks, client_signature,
            condition_pins, condition_photos,
            delivery_coordinates, return_coordinates
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, 0, 'None', 0,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?
          )
        `,
          )
          .run(
            id,
            b.customer?.firstName || "Guest",
            b.customer?.lastName || "Customer",
            (b.customer?.email || "customer@example.com").trim().toLowerCase(),
            b.customer?.phone || "+356 99827192",
            b.driver?.dateOfBirth || null,
            b.driver?.licenseNumber || null,
            b.driver?.licenseState || null,
            b.driver?.licenseExpiry || null,
            b.driver?.licensePhotoFront || b.driver?.licenseFileName || "dl_front_default.jpg",
            b.driver?.licensePhotoBack || b.driver?.licenseBackFileName || "dl_back_default.jpg",
            b.driver?.selfieFileName || null,
            b.pickupLocation && !b.pickupLocation.includes("Miami")
              ? b.pickupLocation
              : cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta",
            b.returnLocation && !b.returnLocation.includes("Miami")
              ? b.returnLocation
              : cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta",
            pickupDate,
            returnDate,
            b.requestedCategory || "Sedan",
            matchedCarId,
            status,
            charges.totalAmount,
            createdAtValue,
            validUserId,
            b.notes || (b.tripReason ? `Trip Purpose: ${b.tripReason}` : null),
            validPromoCode,
            b.tripReason || b.trip_reason || "Travel & Leisure",
            deliveryType,
            b.deliveryLocationCustom || null,
            charges.deliveryFee,
            returnType,
            b.returnLocationCustom || null,
            charges.returnFee,
            JSON.stringify(charges.optionalServices),
            charges.optionalServicesCost,
            vehicle?.securityDeposit ?? 700,
            b.remarks || null,
            b.clientSignature || null,
            b.conditionPins && b.conditionPins.length > 0 ? JSON.stringify(b.conditionPins) : null,
            b.conditionPhotos && b.conditionPhotos.length > 0
              ? JSON.stringify(b.conditionPhotos)
              : null,
            b.deliveryCoordinates ? JSON.stringify(b.deliveryCoordinates) : null,
            b.returnCoordinates ? JSON.stringify(b.returnCoordinates) : null,
          )

        const created = await tx.prepare("SELECT * FROM bookings WHERE id = ?").get(id)
        return created
      })

      try {
        await notifyBookingCreated(db, createdRow)
      } catch (mailErr: any) {
        console.warn("[Booking Created Email Non-Fatal]", mailErr?.message)
      }

      return res.status(201).json(formatBookingRow(createdRow))
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.message,
        })
      }
      console.error("[Booking Creation Error]", err?.message)
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to create booking.",
      })
    }
  },
)

export default router
