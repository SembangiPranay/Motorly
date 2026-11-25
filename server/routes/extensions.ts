import { Router } from "express"
import type express from "express"
import { db } from "../db.ts"
import { type JwtUserPayload, requireAuth, requireAdmin, canAccessBooking } from "../auth.ts"
import { findVehicleBookingConflict, parseDateRangeStrict } from "../booking-rules.ts"
import { formatBookingRow } from "../serializers.ts"
import {
  notifyExtensionOutcome,
  notifyExtensionQuoted,
  notifyExtensionRequested,
} from "../notifications.ts"

const router = Router()

// POST Step F1: Customer Requests Trip Extension
router.post(
  "/bookings/:id/request-extension",
  requireAuth,
  async (req: express.Request<{ id: string }> & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id
    const { extraDuration, unit, customerNotes } = req.body

    const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({ error: "Access denied to this booking." })
    }

    const durationNum = Number(extraDuration)
    const unitStr = unit || "days"
    if (
      !Number.isFinite(durationNum) ||
      durationNum <= 0 ||
      !["hours", "days", "months"].includes(unitStr)
    ) {
      return res
        .status(400)
        .json({ error: "A positive extension duration and valid unit are required." })
    }
    const nowIso = new Date().toISOString()

    const extRequest = {
      extraDuration: durationNum,
      unit: unitStr,
      customerNotes: customerNotes || "Customer requested rental extension via app.",
      requestedAt: nowIso,
    }

    const requested = await db
      .prepare(
        `
    UPDATE bookings SET
      extension_status = 'Requested',
      extension_request = ?, extension_quote = NULL
    WHERE id = ? AND status NOT IN ('Completed', 'Returned', 'Cancelled')
      AND COALESCE(extension_status, 'None') NOT IN ('Requested', 'Quoted')
  `,
      )
      .run(JSON.stringify(extRequest), bookingId)
    if (!requested.changes)
      return res
        .status(409)
        .json({ error: "The booking cannot request another extension right now." })

    const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
    try {
      await notifyExtensionRequested(db, updatedBooking, extRequest)
    } catch (mailErr: any) {
      console.warn("[Extension Request Email Non-Fatal]", mailErr?.message)
    }
    return res.json({
      success: true,
      message: `Extension request for +${durationNum} ${unitStr} submitted. Awaiting manager quotation.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step F2: Admin Quotes Extension (Per Day / Per Hour / Per Month)
router.post("/bookings/:id/quote-extension", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { rateType, rateAmount, totalQuotedAmount, adminNotes } = req.body

  const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  let extReq: any = {}
  try {
    if (booking.extension_request) extReq = JSON.parse(booking.extension_request)
  } catch {}

  const total = Number(totalQuotedAmount)
  const rate = Number(rateAmount)
  if (
    !["hour", "day", "month"].includes(rateType) ||
    !Number.isFinite(total) ||
    total < 0 ||
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    return res.status(400).json({ error: "A valid extension rate and total are required." })
  }
  const quoteObj = {
    rateType,
    rateAmount: rate,
    totalQuotedAmount: total,
    durationValue: extReq.extraDuration ?? extReq.durationValue ?? 1,
    durationUnit: extReq.unit ?? extReq.durationUnit ?? "days",
    adminNotes: adminNotes || "Standard fleet rate extension quotation.",
    quotedAt: new Date().toISOString(),
  }

  const quoted = await db
    .prepare(
      `
    UPDATE bookings SET
      extension_status = 'Quoted',
      extension_quote = ?
    WHERE id = ? AND status NOT IN ('Completed', 'Returned', 'Cancelled')
      AND extension_status IN ('Pending', 'Requested', 'Quoted')
  `,
    )
    .run(JSON.stringify(quoteObj), bookingId)
  if (!quoted.changes)
    return res.status(409).json({ error: "The booking has no outstanding extension request." })

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
  try {
    await notifyExtensionQuoted(db, updatedBooking, quoteObj)
  } catch (mailErr: any) {
    console.warn("[Extension Quote Email Non-Fatal]", mailErr?.message)
  }
  return res.json({
    success: true,
    message: `Quotation of ?${quoteObj.totalQuotedAmount} sent to customer for approval.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F3: Customer or Admin Approves Extension Quotation (Added to Bill & Return Date Extended)
router.post(
  "/bookings/:id/approve-extension",
  requireAuth,
  async (req: express.Request<{ id: string }> & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id

    const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({ error: "Access denied to this booking." })
    }

    if (booking.extension_status !== "Quoted") {
      return res.status(409).json({ error: "The booking has no outstanding quote." })
    }

    const outcome = await db.withVehicleBookingLock(booking.matched_car_id, async (tx) => {
      const current = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
      if (
        !current ||
        current.extension_status !== "Quoted" ||
        current.matched_car_id !== booking.matched_car_id ||
        ["Cancelled", "Completed", "Returned"].includes(current.status)
      ) {
        return { ok: false as const, error: "The extension quote has already been resolved." }
      }
      let quote
      let request
      try {
        quote = JSON.parse(current.extension_quote)
        request = JSON.parse(current.extension_request)
      } catch {
        return { ok: false as const, error: "The extension quote is incomplete." }
      }

      const unitsInHours = { hours: 1, days: 24, months: 720 }
      const unit = (request?.unit ?? request?.durationUnit) as keyof typeof unitsInHours
      const extensionHours =
        Number(request?.extraDuration ?? request?.durationValue) * unitsInHours[unit]
      const additionalCost = Number(quote?.totalQuotedAmount)
      const bookedDates = parseDateRangeStrict(current.pickup_date, current.return_date)
      if (
        !Number.isFinite(extensionHours) ||
        extensionHours <= 0 ||
        extensionHours > 8760 ||
        !Number.isFinite(additionalCost) ||
        additionalCost < 0 ||
        !bookedDates.valid
      ) {
        return { ok: false as const, error: "The extension quote is invalid." }
      }

      const newReturnDateStr = new Date(bookedDates.end + extensionHours * 3600000).toISOString()
      if (
        current.matched_car_id &&
        (await findVehicleBookingConflict(
          current.matched_car_id,
          current.pickup_date,
          newReturnDateStr,
          bookingId,
          tx,
        ))
      ) {
        return {
          ok: false as const,
          error: "The vehicle is unavailable for the extended rental dates.",
        }
      }

      const newTotal = Number((Number(current.total_amount) + additionalCost).toFixed(2))
      const notes = `${current.notes ? current.notes + " | " : ""}Extended by ${extensionHours} hours (+?${additionalCost.toFixed(2)})`
      const approval = await tx.run(
        `
        UPDATE bookings SET extension_status = 'Approved', return_date = ?, total_amount = ?, notes = ?
        WHERE id = ? AND extension_status = 'Quoted' AND extension_quote = ?
          AND status NOT IN ('Completed', 'Returned', 'Cancelled')
      `,
        newReturnDateStr,
        newTotal,
        notes,
        bookingId,
        current.extension_quote,
      )
      if (!approval.changes)
        return { ok: false as const, error: "The extension quote has already been resolved." }
      const updatedBooking = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
      return { ok: true as const, updatedBooking, additionalCost, newTotal, newReturnDateStr }
    })
    if (!outcome.ok) return res.status(409).json({ error: outcome.error })
    const { updatedBooking, additionalCost, newTotal, newReturnDateStr } = outcome
    try {
      await notifyExtensionOutcome(db, updatedBooking, "Approved", {
        additionalCost,
        newReturnDate: newReturnDateStr,
        newTotal,
      })
    } catch (mailErr: any) {
      console.warn("[Extension Approved Email Non-Fatal]", mailErr?.message)
    }
    return res.json({
      success: true,
      message: `Extension approved! €${additionalCost.toFixed(2)} added to rental bill. New return date: ${newReturnDateStr}. New total: €${newTotal.toFixed(2)}.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step F4: Decline Extension
router.post(
  "/bookings/:id/decline-extension",
  requireAuth,
  async (req: express.Request<{ id: string }> & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id

    const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({ error: "Access denied to this booking." })
    }

    const user = req.user

    const declineActor = user?.role === "admin" ? "manager" : "customer"
    const declineNote = `Extension quotation declined by ${declineActor}.`
    const updatedNotes = `${booking.notes ? booking.notes + " | " : ""}${declineNote}`

    const decline = await db
      .prepare(
        `
    UPDATE bookings SET
      extension_status = 'Declined',
      notes = ?
    WHERE id = ? AND extension_status IN ('Requested', 'Pending', 'Quoted')
  `,
      )
      .run(updatedNotes, bookingId)
    if (!decline.changes) {
      return res.status(409).json({ error: "The booking has no outstanding extension." })
    }

    const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
    try {
      await notifyExtensionOutcome(db, updatedBooking, "Declined", {
        actor: declineActor,
      })
    } catch (mailErr: any) {
      console.warn("[Extension Declined Email Non-Fatal]", mailErr?.message)
    }
    return res.json({
      success: true,
      message: "Extension declined.",
      booking: formatBookingRow(updatedBooking),
    })
  },
)

export default router
