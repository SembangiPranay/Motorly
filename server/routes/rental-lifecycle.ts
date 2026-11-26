import { Router } from "express"
import type express from "express"
import { db } from "../db.ts"
import { type JwtUserPayload, requireAdmin, requireAuth, canAccessBooking } from "../auth.ts"
import { formatCarRow, formatBookingRow } from "../serializers.ts"
import { findVehicleBookingConflict } from "../booking-rules.ts"
import {
  notifyBookingApproved,
  notifyBookingDeclined,
  notifyKeysHandedOver,
  notifyReturnInspectionCompleted,
} from "../notifications.ts"

const router = Router()

// POST Step D: Admin Approves / Accepts Request
const handleManagerApproval = async (req: express.Request, res: express.Response) => {
  const bookingId = req.params.id
  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  if (booking.status === "Completed") {
    return res.status(400).json({
      error: "Cannot accept a trip that has already been returned and completed.",
    })
  }
  if (booking.status === "Checked Out") {
    return res.status(400).json({
      error: "Cannot decline an active trip that is currently on the road.",
    })
  }

  if (booking.status === "Cancelled") {
    return res.status(400).json({ error: "Cannot accept a cancelled or declined reservation." })
  }

  const nowIso = new Date().toISOString()
  let newStatus = booking.status || "Pending Assignment"
  let matchedCarId = booking.matched_car_id || null

  if (matchedCarId) {
    newStatus = "Assigned"
  } else {
    // Attempt auto-mating if an available car exists in the requested category
    const category = booking.requested_category
    if (category) {
      try {
        const candidates = (await db
          .prepare(
            "SELECT id, status FROM vehicles WHERE (LOWER(type) = LOWER(?) OR LOWER(name) LIKE ?) AND status = 'Available'",
          )
          .all(category, `%${category.toLowerCase()}%`)) as any[]

        for (const cand of candidates) {
          const conflict = await findVehicleBookingConflict(
            cand.id,
            booking.pickup_date,
            booking.return_date,
            booking.id,
            db,
          )
          if (!conflict) {
            matchedCarId = cand.id
            newStatus = "Assigned"
            break
          }
        }
      } catch (err: any) {
        console.warn("[Auto-Mate During Approval Non-Fatal]", err?.message)
      }
    }
  }

  await db
    .prepare(
      `
    UPDATE bookings SET
      approved_by_admin = 1,
      approved_at = ?,
      status = ?,
      matched_car_id = ?
    WHERE id = ?
  `,
    )
    .run(nowIso, newStatus, matchedCarId, bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)

  try {
    await notifyBookingApproved(db, updatedBooking)
  } catch (mailErr: any) {
    console.warn("[Booking Approved Email Non-Fatal]", mailErr?.message)
  }

  return res.json({
    success: true,
    message: `Reservation ${bookingId} accepted by fleet manager.${
      matchedCarId ? " Vehicle assigned and ready for pickup!" : " Please assign a vehicle."
    }`,
    booking: formatBookingRow(updatedBooking),
  })
}

router.post("/bookings/:id/approve", requireAdmin, handleManagerApproval)
router.post("/bookings/:id/accept", requireAdmin, handleManagerApproval)

// POST Step: Admin Declines/Rejects Request
router.post("/bookings/:id/decline", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  if (booking.status === "Completed") {
    return res.status(400).json({
      error: "Cannot decline a trip that has already been returned and completed.",
    })
  }
  if (booking.status === "Checked Out") {
    return res.status(400).json({
      error: "Cannot decline an active trip that is currently on the road.",
    })
  }

  await db
    .prepare(
      `
    UPDATE bookings SET
      status = 'Cancelled',
      approved_by_admin = 0,
      notes = COALESCE(notes || ' ', '') || ' [Request Declined by Manager]'
    WHERE id = ?
  `,
    )
    .run(bookingId)

  // Ensure car is available
  if (booking.matched_car_id) {
    await db
      .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
      .run(booking.matched_car_id)
      .catch(() => {})
  }

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
  try {
    await notifyBookingDeclined(db, updatedBooking)
  } catch (mailErr: any) {
    console.warn("[Booking Declined Email Non-Fatal]", mailErr?.message)
  }
  return res.json({
    success: true,
    message: `Reservation request ${bookingId} was declined by manager.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step E: Admin Hands Over Keys (Handover Checklist & Clock Starts)
router.post("/bookings/:id/handover-keys", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const {
    odometerOut,
    odometerUnit,
    odometerPhoto,
    odometerNotes,
    fuelOut,
    exteriorClean,
    tiresInspected,
    staffSign,
    conditionPhotos,
    conditionPins,
    conditionNotes,
  } = req.body

  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  // State Machine Guard: Cannot hand over keys if booking is already Completed or Cancelled
  if (booking.status === "Completed" || booking.status === "Cancelled") {
    return res.status(400).json({
      error: `Illegal transition: Cannot hand over keys for booking ${bookingId} with terminal status "${booking.status}".`,
    })
  }

  // Rigorous Fleet Security Shield: Keys can NEVER be handed over unless the fleet manager has formally accepted & approved the booking
  if (!booking.approved_by_admin) {
    return res.status(400).json({
      error: `Illegal dispatch: Reservation ${bookingId} must be accepted and approved by the fleet manager before keys can be handed over.`,
    })
  }
  // Idempotency guard: If already Checked Out, return success
  if (booking.status === "Checked Out") {
    return res.status(200).json({
      success: true,
      message: `Keys have already been handed over for booking ${bookingId}.`,
      booking: formatBookingRow(booking),
    })
  }

  const nowIso = new Date().toISOString()
  const checklistObj = {
    odometerOut: Number(odometerOut) || 14250,
    odometerUnit: odometerUnit || "mi",
    odometerPhoto: odometerPhoto || null,
    odometerNotes: odometerNotes || "",
    fuelOut: fuelOut || "100%",
    exteriorClean: Boolean(exteriorClean !== false),
    tiresInspected: Boolean(tiresInspected !== false),
    keysGiven: true,
    staffSign: staffSign || "Fleet Manager / Operations Desk",
    timestamp: nowIso,
  }

  const photosJson =
    Array.isArray(conditionPhotos) && conditionPhotos.length > 0
      ? JSON.stringify(conditionPhotos)
      : null

  const pinsJson =
    Array.isArray(conditionPins) && conditionPins.length > 0 ? JSON.stringify(conditionPins) : null

  const notesText = conditionNotes ? String(conditionNotes).trim() : null

  if (!booking.matched_car_id) {
    return res.status(409).json({ error: "Assign a vehicle before handing over the keys." })
  }

  const result = await db.withVehicleBookingLock(booking.matched_car_id, async (tx) => {
    const current = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
    if (current?.status === "Checked Out") return { ok: true as const, booking: current, alreadyDispatched: true }
    if (!current) {
      return { ok: false as const, error: "Booking not found." }
    }
    if (!current.approved_by_admin) {
      return {
        ok: false as const,
        error: `Reservation ${bookingId} must be accepted by the fleet manager before handing over keys.`,
      }
    }
    if (current.matched_car_id !== booking.matched_car_id) {
      return {
        ok: false as const,
        error: "Assigned vehicle changed while preparing handover. Refresh and try again.",
      }
    }
    const handoverEligibleStatuses = ["Assigned", "Approved", "Confirmed"]
    if (!handoverEligibleStatuses.includes(current.status)) {
      return {
        ok: false as const,
        error: `Booking ${bookingId} is currently "${current.status}" and is not ready for key handover.`,
      }
    }

    const car = await tx.get("SELECT id, name, status FROM vehicles WHERE id = ?", current.matched_car_id)
    if (!car) {
      return { ok: false as const, error: "Assigned vehicle could not be found in fleet inventory." }
    }
    if (car.status === "Maintenance") {
      return {
        ok: false as const,
        error: `${car.name} is currently in Maintenance. Complete service or swap to another vehicle before key handover.`,
      }
    }
    const blockingBooking = await tx.get(
      "SELECT id FROM bookings WHERE matched_car_id = ? AND status = 'Checked Out' AND id != ? LIMIT 1",
      current.matched_car_id,
      bookingId,
    )
    if (blockingBooking) {
      return {
        ok: false as const,
        conflictingBookingId: blockingBooking.id,
        error: `${car.name} is still checked out on reservation ${blockingBooking.id}. Complete its return inspection or assign another available vehicle.`,
      }
    }
    if (car.status && !["Available", "Cleaning", "Rented"].includes(car.status)) {
      return {
        ok: false as const,
        error: `${car.name} has status "${car.status}" and cannot be dispatched until set to Available.`,
      }
    }

    const dispatched = await tx.run(
      `
      UPDATE bookings SET status = 'Checked Out', keys_handed_at = ?, checklist_out = ?,
        odometer_out = ?, fuel_level_out = ?, condition_photos = COALESCE(?, condition_photos),
        condition_pins = COALESCE(?, condition_pins), inspection_notes = COALESCE(?, inspection_notes)
      WHERE id = ? AND status IN ('Assigned', 'Approved', 'Confirmed') AND matched_car_id = ?
    `,
      nowIso,
      JSON.stringify(checklistObj),
      checklistObj.odometerOut,
      checklistObj.fuelOut,
      photosJson,
      pinsJson,
      notesText,
      bookingId,
      current.matched_car_id,
    )
    if (!dispatched.changes) {
      return { ok: false as const, error: "The booking changed during key handover. Refresh and try again." }
    }

    await tx.run(
      "UPDATE vehicles SET status = 'Rented', current_odometer = ? WHERE id = ?",
      checklistObj.odometerOut,
      current.matched_car_id,
    )
    const updated = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
    return { ok: true as const, booking: updated, alreadyDispatched: false }
  })
  if (!result.ok) {
    return res.status(409).json({
      error: result.error,
      ...(result.conflictingBookingId ? { conflictingBookingId: result.conflictingBookingId } : {}),
    })
  }
  const updatedBooking = result.booking
  if (result.alreadyDispatched) {
    return res.json({ success: true, booking: formatBookingRow(updatedBooking) })
  }
  try {
    await notifyKeysHandedOver(db, updatedBooking, checklistObj)
  } catch (mailErr: any) {
    console.warn("[Handover Email Non-Fatal]", mailErr?.message)
  }
  return res.json({
    success: true,
    message: `Keys handed over for ${bookingId}! Official rental clock started at ${nowIso}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step G: Return Vehicle & Post-Trip Inspection Checklist
router.post("/bookings/:id/return-inspection", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const {
    odometerIn,
    fuelIn,
    damageFound,
    cleanlinessPass,
    inspectionPassed,
    staffSign,
    inspectionNotes,
    damageNotes,
    damageSeverity,
    damageLocation,
    damagePhotos,
    damageFee,
  } = req.body

  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  // State Machine Guard: If already Completed, return idempotent success with formatted row
  if (booking.status === "Completed") {
    return res.status(200).json({
      success: true,
      message: `Booking ${bookingId} has already been completed and finalized.`,
      booking: formatBookingRow(booking),
    })
  }

  // State Machine Guard: Only vehicles in "Checked Out" status can undergo return inspection
  if (booking.status !== "Checked Out") {
    return res.status(400).json({
      error: `Illegal state transition: Cannot perform return inspection on booking ${bookingId} with status "${booking.status}". Booking must be in "Checked Out" status.`,
    })
  }

  const nowIso = new Date().toISOString()
  const isDamage = Boolean(damageFound)
  const checklistInObj = {
    odometerIn: Number(odometerIn) || 14380,
    fuelIn: fuelIn || "100%",
    fuelLevelIn: fuelIn || "100%",
    damageFound: isDamage,
    damageNotes: damageNotes || inspectionNotes || "",
    damageSeverity: damageSeverity || (isDamage ? "Minor Cosmetic" : ""),
    damageLocation: damageLocation || (isDamage ? "Exterior Panel" : ""),
    damagePhotos: Array.isArray(damagePhotos) ? damagePhotos.filter(Boolean) : [],
    damageFee: Number(damageFee) || 0,
    cleanlinessPass: Boolean(cleanlinessPass !== false),
    cleanlinessPassed: Boolean(cleanlinessPass !== false),
    inspectionPassed: Boolean(inspectionPassed !== false),
    staffSign: staffSign || "Garage Return Inspector",
    inspectorStaff: staffSign || "Garage Return Inspector",
    timestamp: nowIso,
  }

  const finalNotes = isDamage
    ? `[DAMAGE REPORTED: ${checklistInObj.damageSeverity} - ${checklistInObj.damageLocation}] ${checklistInObj.damageNotes}`
    : inspectionNotes || "Inspection passed clean with 0 damage."

  const feeToAdd = Number(checklistInObj.damageFee) || 0
  if (!Number.isFinite(feeToAdd) || feeToAdd < 0) {
    return res.status(400).json({ error: "Damage fee must be a non-negative number." })
  }

  const result = await db.withVehicleBookingLock(booking.matched_car_id, async (tx) => {
    const current = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
    if (current?.status === "Completed") return { booking: current, alreadyCompleted: true }
    if (current?.status !== "Checked Out" || current.matched_car_id !== booking.matched_car_id)
      return null

    const newTotal = Number((Number(current.total_amount) + feeToAdd).toFixed(2))
    const closed = await tx.run(
      `
        UPDATE bookings SET status = 'Completed', checklist_in = ?, odometer_in = ?,
          fuel_level_in = ?, inspection_notes = ?, inspection_passed = ?, total_amount = ?
        WHERE id = ? AND status = 'Checked Out' AND total_amount = ?
      `,
      JSON.stringify(checklistInObj),
      checklistInObj.odometerIn,
      checklistInObj.fuelIn,
      finalNotes,
      checklistInObj.inspectionPassed ? 1 : 0,
      newTotal,
      bookingId,
      current.total_amount,
    )
    if (!closed.changes) return null

    if (current.matched_car_id) {
      const nextCarStatus = isDamage
        ? "Maintenance"
        : checklistInObj.cleanlinessPass
          ? "Available"
          : "Cleaning"
      await tx.run(
        "UPDATE vehicles SET status = ?, current_odometer = ? WHERE id = ?",
        nextCarStatus,
        checklistInObj.odometerIn,
        current.matched_car_id,
      )
    }

    const updated = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
    return { booking: updated, alreadyCompleted: false }
  })
  if (!result)
    return res
      .status(409)
      .json({ error: "The booking changed during inspection. Refresh and try again." })
  const updatedBooking = result.booking
  if (result.alreadyCompleted) {
    return res.json({ success: true, booking: formatBookingRow(updatedBooking) })
  }
  const newTotal = Number(updatedBooking.total_amount)
  try {
    await notifyReturnInspectionCompleted(db, updatedBooking, checklistInObj, newTotal)
  } catch (mailErr: any) {
    console.warn("[Return Inspection Email Non-Fatal]", mailErr?.message)
  }
  return res.json({
    success: true,
    message: `Inspection passed! Ride completed and booking ${bookingId} finalized.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Mate / Assign a car to a booking with Database-Level Concurrency Protection
router.post<{ id: string }>("/bookings/:id/mate", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { carId } = req.body

  if (!carId) {
    return res.status(400).json({ error: "carId is required to mate vehicle." })
  }

  try {
    const result = await db.withVehicleBookingLock(carId, async (tx) => {
      const booking = (await tx
        .prepare("SELECT * FROM bookings WHERE id = ?")
        .get(bookingId)) as any
      if (!booking) {
        const err = new Error("Booking not found.") as any
        err.statusCode = 404
        throw err
      }

      const car = (await tx.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)) as any
      if (!car) {
        const err = new Error("Vehicle not found.") as any
        err.statusCode = 404
        throw err
      }

      if (car.status === "Maintenance") {
        const err = new Error(
          `Conflict: Vehicle ${car.name} is currently under maintenance and cannot be assigned.`,
        ) as any
        err.statusCode = 409
        throw err
      }

      if (car.status === "Rented") {
        const activeRental = (await tx
          .prepare(
            "SELECT id, pickup_date, return_date FROM bookings WHERE matched_car_id = ? AND status = 'Checked Out' AND id != ? LIMIT 1",
          )
          .get(carId, bookingId)) as any
        if (activeRental) {
          const err = new Error(
            `Conflict: ${car.name} (${car.plate_number}) is currently checked out on reservation ${activeRental.id} (${activeRental.pickup_date} – ${activeRental.return_date}). Complete its return inspection first.`,
          ) as any
          err.statusCode = 409
          throw err
        }
      }

      // Prevent double booking conflict during manual mating
      const conflict = await findVehicleBookingConflict(
        carId,
        booking.pickup_date,
        booking.return_date,
        bookingId,
        tx,
      )
      if (conflict) {
        const err = new Error(
          conflict.conflictingBookingId &&
            conflict.conflictingBookingId !== "INVALID_DATES" &&
            conflict.conflictingBookingId !== "DB_FAILSAFE"
            ? `Conflict: Vehicle is already mated to reservation ${conflict.conflictingBookingId} (${conflict.customerName}) for overlapping dates (${conflict.pickupDate} – ${conflict.returnDate}).`
            : conflict.reason || "Conflict: Vehicle is unavailable for the selected dates.",
        ) as any
        err.statusCode = 409
        throw err
      }

      // If re-mating away from a previously assigned vehicle, release the previous vehicle back to Available!
      if (booking.matched_car_id && booking.matched_car_id !== carId) {
        await tx
          .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
          .run(booking.matched_car_id)
      }

      // Update booking
      await tx
        .prepare("UPDATE bookings SET matched_car_id = ?, status = 'Assigned' WHERE id = ?")
        .run(carId, bookingId)

      // Update newly assigned vehicle to Rented if already checked out, otherwise leave available/reserved
      if (booking.status === "Checked Out") {
        await tx.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId)
      }

      const updatedBooking = await tx.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
      const updatedCar = await tx.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)

      return {
        booking: formatBookingRow(updatedBooking),
        car: formatCarRow(updatedCar),
        carName: car.name,
        plateNumber: car.plate_number,
      }
    })

    return res.json({
      success: true,
      message: `Vehicle ${result.carName} (${result.plateNumber}) successfully mated to booking ${bookingId}.`,
      booking: result.booking,
      car: result.car,
    })
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    console.error("[Vehicle Mating Error]", err?.message)
    return res.status(500).json({ error: "Failed to mate vehicle." })
  }
})

// POST Unmate / Release a car from a booking
router.post("/bookings/:id/unmate", requireAdmin, async (req, res) => {
  const bookingId = req.params.id

  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const prevCarId = booking.matched_car_id

  // Reset booking
  await db
    .prepare(
      "UPDATE bookings SET matched_car_id = NULL, status = 'Pending Assignment' WHERE id = ?",
    )
    .run(bookingId)

  // Release vehicle back to Available
  if (prevCarId) {
    await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(prevCarId)
  }

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
  return res.json({
    success: true,
    message: `Vehicle released from booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// PATCH Update Booking Status (Advance Lifecycle)
router.patch("/bookings/:id/status", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { status, approvedByAdmin, odometerOut, odometerIn, fuelLevelOut, fuelLevelIn, notes } =
    req.body

  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const validStatuses = [
    "Pending Assignment",
    "Assigned",
    "Checked Out",
    "Returned",
    "Completed",
    "Cancelled",
  ]
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    })
  }

  const newStatus = status || booking.status
  const carId = booking.matched_car_id
  const newApprovedByAdmin =
    approvedByAdmin !== undefined
      ? approvedByAdmin
        ? 1
        : 0
      : newStatus === "Pending Assignment"
        ? 0
        : booking.approved_by_admin

  // Synchronize vehicle status based on reservation lifecycle
  if (carId) {
    if (newStatus === "Checked Out") {
      await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId)
    } else if (newStatus === "Returned") {
      await db.prepare("UPDATE vehicles SET status = 'Cleaning' WHERE id = ?").run(carId)
    } else if (newStatus === "Completed") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(carId)
    } else if (newStatus === "Cancelled") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(carId)
    }
  }

  await db
    .prepare(
      `
    UPDATE bookings SET
      status = ?,
      approved_by_admin = ?,
      odometer_out = COALESCE(?, odometer_out),
      odometer_in = COALESCE(?, odometer_in),
      fuel_level_out = COALESCE(?, fuel_level_out),
      fuel_level_in = COALESCE(?, fuel_level_in),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `,
    )
    .run(
      newStatus,
      newApprovedByAdmin,
      odometerOut ?? null,
      odometerIn ?? null,
      fuelLevelOut ?? null,
      fuelLevelIn ?? null,
      notes ?? null,
      bookingId,
    )

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
  return res.json({
    success: true,
    message: `Booking ${bookingId} transitioned to ${newStatus}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// PATCH Update Condition Inspection (5-View pins, per-side photos & client signature endorsement)
router.patch(
  "/bookings/:id/condition",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = String(req.params.id || "")
  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }
  if (!canAccessBooking(req.user, booking)) {
    return res.status(403).json({ error: "Forbidden." })
  }

  const { conditionPins, conditionPhotos, clientSignature } = req.body || {}
  const updates: string[] = []
  const params: any[] = []

  if (conditionPins !== undefined) {
    if (!Array.isArray(conditionPins) || conditionPins.length > 40) {
      return res.status(400).json({ error: "conditionPins must be an array of at most 40 entries." })
    }
    updates.push("condition_pins = ?")
    params.push(JSON.stringify(conditionPins))
  }

  if (conditionPhotos !== undefined) {
    if (!Array.isArray(conditionPhotos) || conditionPhotos.length > 16) {
      return res.status(400).json({ error: "conditionPhotos must be an array of at most 16 images." })
    }
    const cleanPhotos = conditionPhotos.filter((p) => typeof p === "string" && p.length > 0)
    updates.push("condition_photos = ?")
    params.push(JSON.stringify(cleanPhotos))
  }

  if (clientSignature !== undefined) {
    if (typeof clientSignature !== "string" || clientSignature.length > 500_000) {
      return res.status(400).json({ error: "Invalid client signature payload." })
    }
    updates.push("client_signature = ?")
    params.push(clientSignature.trim() || null)
  }

  if (updates.length === 0) {
    return res.json({ success: true, booking: formatBookingRow(booking) })
  }

  params.push(bookingId)
  await db.prepare(`UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`).run(...params)
  const updated = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
  return res.json({
    success: true,
    message: "Condition inspection and client endorsement saved.",
    booking: formatBookingRow(updated),
  })
})

// DELETE Booking (Admin / Cleanup)
router.delete("/bookings/:id", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  if (
    booking.matched_car_id &&
    (booking.status === "Checked Out" || booking.status === "Assigned")
  ) {
    await db
      .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
      .run(booking.matched_car_id)
  }

  await db.prepare("DELETE FROM bookings WHERE id = ?").run(bookingId)

  return res.json({ success: true, message: `Booking ${bookingId} deleted.` })
})

export default router
