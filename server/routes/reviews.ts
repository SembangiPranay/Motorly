import { Router } from "express"
import { db } from "../db.ts"
import type express from "express"
import { randomUUID } from "node:crypto"
import { type JwtUserPayload, canAccessBooking, requireAuth } from "../auth.ts"

const router = Router()

router.get("/reviews", async (req, res) => {
  try {
    const carId = req.query.carId as string | undefined
    const bookingId = req.query.bookingId as string | undefined
    let rows: any[] = []

    if (carId) {
      rows = (await db
        .prepare("SELECT * FROM reviews WHERE car_id = ? ORDER BY created_at DESC")
        .all(carId)) as any[]
    } else if (bookingId) {
      rows = (await db
        .prepare("SELECT * FROM reviews WHERE booking_id = ? ORDER BY created_at DESC")
        .all(bookingId)) as any[]
    } else {
      rows = (await db
        .prepare("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50")
        .all()) as any[]
    }

    const reviews = (rows || []).map((r) => ({
      id: r.id,
      carId: r.car_id,
      bookingId: r.booking_id,
      customerName: r.customer_name,
      rating: Number(r.rating) || 5,
      comment: r.comment || "",
      createdAt: r.created_at,
    }))

    return res.json({ success: true, reviews })
  } catch (err: any) {
    console.error("[Reviews Fetch Error]", err?.message)
    return res.json({ success: true, reviews: [] })
  }
})

router.post(
  "/reviews",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const { carId, bookingId, rating, comment } = req.body || {}
    const numRating = Number(rating)
    if (typeof carId !== "string" || typeof bookingId !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "A completed booking is required to submit a review." })
    }
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5 stars." })
    }

    const outcome = await db.withVehicleBookingLock(carId, async (tx) => {
      const setting = await tx.get(
        "SELECT value FROM system_settings WHERE key = 'reviews_enabled'",
      )
      if (setting && !["true", "1"].includes(String(setting.value))) {
        return { error: "Customer reviews are currently disabled.", status: 403 }
      }

      const booking = await tx.get("SELECT * FROM bookings WHERE id = ?", bookingId)
      if (!booking || !canAccessBooking(req.user, booking)) {
        return { error: "Access denied to this booking.", status: 403 }
      }
      if (booking.matched_car_id !== carId || booking.status !== "Completed") {
        return { error: "This review requires a completed rental for this vehicle.", status: 409 }
      }
      if (await tx.get("SELECT 1 FROM reviews WHERE booking_id = ?", bookingId)) {
        return { error: "A review already exists for this rental.", status: 409 }
      }

      const review = {
        id: `REV-${randomUUID()}`,
        carId,
        bookingId,
        customerName: booking.customer_first_name || "Verified Driver",
        rating: numRating,
        comment: String(comment || "")
          .trim()
          .slice(0, 2000),
        createdAt: new Date().toISOString(),
      }
      await tx.run(
        `
      INSERT INTO reviews (id, car_id, booking_id, customer_name, customer_email, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        review.id,
        carId,
        bookingId,
        review.customerName,
        req.user?.email,
        numRating,
        review.comment,
        review.createdAt,
      )
      const stats = await tx.get(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE car_id = ?",
        carId,
      )
      const car = {
        id: carId,
        rating: Math.round(Number(stats.avg_rating) * 10) / 10,
        reviewsCount: Number(stats.count),
      }
      await tx.run(
        "UPDATE vehicles SET rating = ?, reviews_count = ? WHERE id = ?",
        car.rating,
        car.reviewsCount,
        carId,
      )
      return { review, car }
    })

    if (outcome.error) {
      return res.status(outcome.status).json({ success: false, error: outcome.error })
    }
    return res.json({ success: true, message: "Review submitted successfully.", ...outcome })
  },
)

export default router
