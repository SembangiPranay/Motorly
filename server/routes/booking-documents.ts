import { Router } from "express"
import type express from "express"
import { escapeHtml } from "../mailer.ts"
import { db } from "../db.ts"
import { type JwtUserPayload, canAccessBooking, requireAuth } from "../auth.ts"
import { formatBookingRow } from "../serializers.ts"

const router = Router()

// GET Download Specific Booking Customer Driver License (Original Uploaded Image or Certificate)
router.get(
  "/bookings/:id/download-license",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id
    const side = req.query.side || "front"
    if (side !== "front" && side !== "back" && side !== "certificate") {
      return res.status(400).json({ error: "Invalid license document side." })
    }
    const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({ error: "Access denied to this identification record." })
    }

    const fullName = `${booking.customer_first_name} ${booking.customer_last_name}`.trim()
    const cleanName = fullName.replace(/[^a-zA-Z0-9]+/g, "_")
    const safeId = String(booking.id).replace(/[^a-zA-Z0-9_-]/g, "")
    res.setHeader("X-Content-Type-Options", "nosniff")

    // Check if user uploaded a real image (Data URL)
    const targetPhoto =
      side === "back" ? booking.driver_license_back_file : booking.driver_license_file

    if (side !== "certificate" && targetPhoto && targetPhoto.startsWith("data:image/")) {
      const match = targetPhoto.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
      if (match) {
        const mimeType = match[1]
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg"
        const buffer = Buffer.from(match[2], "base64")
        const filename = `DL_${side.toUpperCase()}_${cleanName}_${safeId}.${ext}`

        const isDownload = req.query.download === "1"
        res.setHeader("Content-Type", mimeType)
        res.setHeader(
          "Content-Disposition",
          `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
        )
        return res.send(buffer)
      }
    }

    const filePrefix = side === "certificate" ? "DL_CERTIFICATE" : `DL_${side.toUpperCase()}`
    const fileName = `${filePrefix}_${cleanName}_${safeId}.svg`

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="380" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <!-- Card Background -->
  <rect width="600" height="380" rx="24" fill="#0D0E11" stroke="#F97316" stroke-width="2"/>
  <rect x="20" y="20" width="560" height="340" rx="16" fill="#17191C" stroke="#2B2D31" stroke-width="1"/>

  <!-- Header Bar -->
  <rect x="20" y="20" width="560" height="60" rx="16" fill="#1F2126"/>
  <text x="45" y="55" fill="#F97316" font-size="12" font-weight="900" letter-spacing="2">OFFICIAL PIT STOP DRIVER IDENTIFICATION RECORD</text>
  <text x="450" y="55" fill="#10B981" font-size="11" font-weight="700">${booking.approved_by_admin ? "APPROVED BY OPS" : "PENDING REVIEW"}</text>

  <!-- Photo Mock Box -->
  <rect x="45" y="105" width="130" height="170" rx="12" fill="#262930" stroke="#3A3E47" stroke-width="1.5"/>
  <circle cx="110" cy="165" r="32" fill="#4B5563"/>
  <path d="M70 245 C70 205, 150 205, 150 245 Z" fill="#4B5563"/>
  <text x="110" y="265" text-anchor="middle" fill="#9CA3AF" font-size="10" font-weight="600">PHOTO ID</text>

  <!-- Driver Information Fields -->
  <text x="200" y="125" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">FULL LEGAL NAME</text>
  <text x="200" y="148" fill="#FFFFFF" font-size="18" font-weight="800">${escapeHtml(fullName)}</text>

  <text x="200" y="180" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">DRIVER LICENSE NUMBER</text>
  <text x="200" y="202" fill="#FBBF24" font-size="16" font-weight="800" font-family="monospace">${escapeHtml(booking.driver_license_num || "Not provided")}</text>

  <text x="200" y="235" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">STATE / EXPIRY</text>
  <text x="200" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${escapeHtml(booking.driver_license_state || "Not provided")} • Exp: ${escapeHtml(booking.driver_license_expiry || "Not provided")}</text>

  <text x="380" y="235" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">DATE OF BIRTH</text>
  <text x="380" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${escapeHtml(booking.driver_dob || "Not provided")}</text>

  <!-- Footer Bar with Security Fingerprint -->
  <line x1="45" y1="295" x2="555" y2="295" stroke="#2B2D31" stroke-width="1"/>
  <text x="45" y="325" fill="#6B7280" font-size="10" font-family="monospace">BOOKING TICKET: ${escapeHtml(booking.id)}</text>
  <text x="45" y="342" fill="#6B7280" font-size="10">ATTACHMENT: ${
    booking.driver_license_file
      ? booking.driver_license_file.startsWith("data:")
        ? "Original Photo (Front)"
        : escapeHtml(booking.driver_license_file)
      : "Unavailable"
  } + ${
    booking.driver_license_back_file
      ? booking.driver_license_back_file.startsWith("data:")
        ? "Original Photo (Back)"
        : escapeHtml(booking.driver_license_back_file)
      : "Unavailable"
  }</text>
  <text x="410" y="335" fill="#F97316" font-size="11" font-weight="800">PIT STOP SECURE ID</text>
</svg>`

    const isDownload = req.query.download === "1"
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox")
    res.setHeader("Content-Type", "image/svg+xml")
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${fileName}"`,
    )
    return res.send(svgContent)
  },
)

// POST Admin/Customer Upload / Update Driver License for a Booking
router.post(
  "/bookings/:id/upload-license",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id
    const { licensePhotoFront, licensePhotoBack, licenseNumber, licenseState } = req.body || {}

    const booking = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({ error: "Access denied to this identification record." })
    }

    await db.run(
      `
        UPDATE bookings SET
          driver_license_file = COALESCE(?, driver_license_file),
          driver_license_back_file = COALESCE(?, driver_license_back_file),
          driver_license_num = COALESCE(?, driver_license_num),
          driver_license_state = COALESCE(?, driver_license_state)
        WHERE id = ?
      `,
      licensePhotoFront || null,
      licensePhotoBack || null,
      licenseNumber || null,
      licenseState || null,
      bookingId,
    )

    const updated = (await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)) as any
    return res.json({ success: true, booking: formatBookingRow(updated) })
  },
)

export default router
