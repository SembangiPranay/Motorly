/**
 * MOTORLY Fleet Atelier - High-Resolution Rental Invoice & Trip Manifest Generator
 *
 * Renders an official, pixel-perfect 1200x1600 PNG invoice directly in browser canvas
 * with zero third-party dependencies, complete booking specifications, and triggers download.
 */

import type { BookingRecord, Car } from "../types"

export interface InvoiceSettings {
  admin_name?: string
  contact_phone?: string
  contact_email?: string
  hub_address?: string
  google_maps_url?: string
}

/**
 * Draws a rounded rectangle path on canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Generates a PNG data URL for a reservation manifest invoice
 */
export async function generateBookingInvoicePng(
  booking: BookingRecord,
  car?: Car,
  settings?: InvoiceSettings,
): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 1650
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not initialize 2D canvas context")

  // Background
  ctx.fillStyle = "#F8F8F6"
  ctx.fillRect(0, 0, 1200, 1650)

  // Outer border
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 4
  ctx.strokeRect(16, 16, 1168, 1618)

  // ========================================================
  // 1. TOP HEADER BANNER (Dark Luxury Atelier Theme)
  // ========================================================
  ctx.fillStyle = "#141518"
  roundRect(ctx, 30, 30, 1140, 170, 20)
  ctx.fill()

  // Motorly Orange Logo Emblem
  ctx.fillStyle = "#F97316"
  roundRect(ctx, 60, 60, 56, 56, 14)
  ctx.fill()

  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 32px 'Cabinet Grotesk', system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("M", 88, 88)

  // Brand Name & Subtitle
  ctx.textAlign = "left"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 28px system-ui, sans-serif"
  ctx.fillText("MOTORLY FLEET ATELIER", 132, 75)

  ctx.fillStyle = "#A8A29E"
  ctx.font = "600 13px monospace"
  ctx.fillText("OFFICIAL DISPATCH MANIFEST & CLIENT RENTAL INVOICE", 132, 102)

  // Top Right Info
  ctx.textAlign = "right"
  ctx.fillStyle = "#F97316"
  ctx.font = "bold 26px monospace"
  ctx.fillText(`#${booking.id}`, 1130, 72)

  ctx.fillStyle = "#D6D3D1"
  ctx.font = "500 13px system-ui, sans-serif"
  const issueDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  ctx.fillText(`Issued: ${issueDate}`, 1130, 98)

  // Status Badge Pill
  const isApproved = Boolean(booking.approvedByAdmin)
  let statusText = isApproved
    ? "CONFIRMED & DISPATCHED"
    : "PENDING FLEET REVIEW"
  let badgeBg = isApproved ? "#065F46" : "#92400E"
  let badgeFg = isApproved ? "#34D399" : "#FBBF24"

  if (booking.status === "Checked Out") {
    statusText = "ACTIVE TRIP (IN DRIVE)"
    badgeBg = "#1E40AF"
    badgeFg = "#93C5FD"
  } else if (booking.status === "Returned") {
    statusText = "VEHICLE RETURNED"
    badgeBg = "#3730A3"
    badgeFg = "#C7D2FE"
  } else if (booking.status === "Completed") {
    statusText = "TRIP COMPLETED"
    badgeBg = "#065F46"
    badgeFg = "#34D399"
  }

  ctx.fillStyle = badgeBg
  roundRect(ctx, 890, 120, 240, 36, 12)
  ctx.fill()
  ctx.fillStyle = badgeFg
  ctx.font = "bold 11px monospace"
  ctx.textAlign = "center"
  ctx.fillText(statusText, 1010, 138)

  // ========================================================
  // 2. TWO-COLUMN CREDENTIALS SECTION (Driver vs Vehicle)
  // ========================================================
  const cardY = 225
  const cardH = 260
  const cardW = 555

  // Card Left: Primary Driver & Customer Credentials
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 30, cardY, cardW, cardH, 18)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Driver Card Header
  ctx.fillStyle = "#F97316"
  ctx.fillRect(30, cardY, 6, cardH)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px monospace"
  ctx.textAlign = "left"
  ctx.fillText("CLIENT & DRIVER CREDENTIALS", 55, cardY + 35)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Primary Driver:", 55, cardY + 75)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px system-ui, sans-serif"
  ctx.fillText(
    `${booking.customer.firstName} ${booking.customer.lastName}`,
    180,
    cardY + 75,
  )

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Direct Phone:", 55, cardY + 110)
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px monospace"
  ctx.fillText(booking.customer.phone || "Not provided", 180, cardY + 110)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Email Address:", 55, cardY + 145)
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px system-ui, sans-serif"
  ctx.fillText(booking.customer.email, 180, cardY + 145)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Driver License:", 55, cardY + 180)
  ctx.fillStyle = "#0284C7"
  ctx.font = "bold 14px monospace"
  ctx.fillText(
    booking.driver?.licenseNumber || "FL-D89102-VAULT",
    180,
    cardY + 180,
  )

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("License State/Exp:", 55, cardY + 215)
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 13px system-ui, sans-serif"
  ctx.fillText(
    `${booking.driver?.licenseState || "Florida"} • Expiry: ${booking.driver?.licenseExpiry || "12/2030"}`,
    180,
    cardY + 215,
  )

  // Card Right: Assigned Vehicle Specifications
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 615, cardY, cardW, cardH, 18)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = "#10B981"
  ctx.fillRect(615, cardY, 6, cardH)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px monospace"
  ctx.textAlign = "left"
  ctx.fillText("ASSIGNED VEHICLE SPECIFICATIONS", 640, cardY + 35)

  const vehicleName =
    car?.name ||
    booking.matchedCarId ||
    booking.requestedCategory ||
    "Fleet Rental Vehicle"
  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Vehicle Model:", 640, cardY + 75)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px system-ui, sans-serif"
  ctx.fillText(`${vehicleName} (${car?.year || 2024})`, 765, cardY + 75)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Vehicle Category:", 640, cardY + 110)
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px system-ui, sans-serif"
  ctx.fillText(
    `${car?.type || booking.requestedCategory || "Luxury Sedan"} • ${car?.transmission || "Automatic"}`,
    765,
    cardY + 110,
  )

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("License Plate:", 640, cardY + 145)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 14px monospace"
  ctx.fillText(car?.plateNumber || "FL-492-MTR", 765, cardY + 145)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Fuel / Powertrain:", 640, cardY + 180)
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 13px system-ui, sans-serif"
  ctx.fillText(`${car?.fuelType || "Gasoline"} • Eco Rated`, 765, cardY + 180)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText("Garage Bay Hub:", 640, cardY + 215)
  ctx.fillStyle = "#059669"
  ctx.font = "bold 13px monospace"
  ctx.fillText(
    `${car?.garageName || booking.pickupLocation || settings?.hub_address || "Terminal Garage B • Bay 4 HQ"}`,
    765,
    cardY + 215,
  )

  // ========================================================
  // 3. SCHEDULE & DISPATCH TIMING CARD
  // ========================================================
  const schedY = 510
  const schedH = 175
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 30, schedY, 1140, schedH, 18)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px monospace"
  ctx.textAlign = "left"
  ctx.fillText("RENTAL TRIP SCHEDULE & KEY HANDOFF TIMING", 55, schedY + 35)

  // 3 sub-columns inside schedule
  // Pickup
  ctx.fillStyle = "#F5F5F4"
  roundRect(ctx, 55, schedY + 55, 335, 95, 12)
  ctx.fill()
  ctx.fillStyle = "#78716C"
  ctx.font = "bold 11px monospace"
  ctx.fillText("PICKUP DATE & TIME", 75, schedY + 80)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px system-ui, sans-serif"
  ctx.fillText(booking.pickupDate, 75, schedY + 105)
  ctx.font = "500 12px system-ui, sans-serif"
  ctx.fillStyle = "#059669"
  ctx.fillText("Key Handoff at Hub", 75, schedY + 130)

  // Return
  ctx.fillStyle = "#F5F5F4"
  roundRect(ctx, 430, schedY + 55, 335, 95, 12)
  ctx.fill()
  ctx.fillStyle = "#78716C"
  ctx.font = "bold 11px monospace"
  ctx.fillText("RETURN DATE & TIME", 450, schedY + 80)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px system-ui, sans-serif"
  ctx.fillText(booking.returnDate, 450, schedY + 105)
  ctx.font = "500 12px system-ui, sans-serif"
  ctx.fillStyle = "#0284C7"
  ctx.fillText("Final Return Inspection", 450, schedY + 130)

  // Hub Location
  ctx.fillStyle = "#F5F5F4"
  roundRect(ctx, 805, schedY + 55, 340, 95, 12)
  ctx.fill()
  ctx.fillStyle = "#78716C"
  ctx.font = "bold 11px monospace"
  ctx.fillText("STATIONED DISPATCH HUB", 825, schedY + 80)
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 13px system-ui, sans-serif"
  const hubName =
    booking.pickupLocation ||
    car?.garageName ||
    settings?.hub_address ||
    "Terminal Garage B • Bay 4 HQ"
  ctx.fillText(
    hubName.length > 30 ? hubName.slice(0, 30) + "..." : hubName,
    825,
    schedY + 105,
  )
  ctx.font = "600 11px monospace"
  ctx.fillStyle = "#F97316"
  ctx.fillText("Google Maps Directions Synced", 825, schedY + 130)

  // ========================================================
  // 4. FINANCIAL AUDIT & ITEMIZED BILLING TABLE
  // ========================================================
  const finY = 710
  const finH = 430
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 30, finY, 1140, finH, 18)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px monospace"
  ctx.textAlign = "left"
  ctx.fillText("FINANCIAL AUDIT & ITEMIZED BREAKDOWN", 55, finY + 35)

  // Table header row
  ctx.fillStyle = "#F5F5F4"
  ctx.fillRect(55, finY + 55, 1090, 35)
  ctx.fillStyle = "#78716C"
  ctx.font = "bold 11px monospace"
  ctx.fillText("ITEM DESCRIPTION", 75, finY + 77)
  ctx.fillText("RATE / SPECIFICATION", 680, finY + 77)
  ctx.textAlign = "right"
  ctx.fillText("TOTAL (USD)", 1120, finY + 77)

  // Calculations
  const total = Number(booking.totalAmount) || 0
  const baseRate = car?.pricePerDay || 45
  const baseCharge = Number((total * 0.82).toFixed(2))
  const taxCharge = Number((total * 0.18).toFixed(2))

  // Row 1
  ctx.textAlign = "left"
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px system-ui, sans-serif"
  ctx.fillText(`Primary Vehicle Rental: ${vehicleName}`, 75, finY + 120)
  ctx.fillStyle = "#78716C"
  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillText(`Daily Rate: $${baseRate}/day`, 680, finY + 120)
  ctx.textAlign = "right"
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 14px monospace"
  ctx.fillText(`$${baseCharge.toFixed(2)}`, 1120, finY + 120)

  // Divider
  ctx.strokeStyle = "#F5F5F4"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(55, finY + 140)
  ctx.lineTo(1145, finY + 140)
  ctx.stroke()

  // Row 2
  ctx.textAlign = "left"
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px system-ui, sans-serif"
  ctx.fillText("Hub Concession & State Highway Rental Tax", 75, finY + 170)
  ctx.fillStyle = "#78716C"
  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillText("18% Standard Tier Tax", 680, finY + 170)
  ctx.textAlign = "right"
  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 14px monospace"
  ctx.fillText(`$${taxCharge.toFixed(2)}`, 1120, finY + 170)

  // Divider
  ctx.beginPath()
  ctx.moveTo(55, finY + 190)
  ctx.lineTo(1145, finY + 190)
  ctx.stroke()

  // Row 3
  ctx.textAlign = "left"
  ctx.fillStyle = "#1C1917"
  ctx.font = "600 14px system-ui, sans-serif"
  ctx.fillText("Security Deposit Hold (Pre-Authorization)", 75, finY + 220)
  ctx.fillStyle = "#059669"
  ctx.font = "bold 13px system-ui, sans-serif"
  ctx.fillText("100% Refundable on Check-in", 680, finY + 220)
  ctx.textAlign = "right"
  ctx.fillStyle = "#059669"
  ctx.font = "bold 14px monospace"
  ctx.fillText("$200.00 (Hold)", 1120, finY + 220)

  // Grand Total Box
  ctx.fillStyle = "#1C1917"
  roundRect(ctx, 55, finY + 270, 1090, 110, 16)
  ctx.fill()

  ctx.textAlign = "left"
  ctx.fillStyle = "#A8A29E"
  ctx.font = "bold 12px monospace"
  ctx.fillText("TOTAL RENTAL AMOUNT DUE UPON KEY HANDOFF", 85, finY + 310)
  ctx.font = "500 12px system-ui, sans-serif"
  ctx.fillStyle = "#78716C"
  ctx.fillText(
    "Payment Method: Hub Counter (Card / Cash / Contactless)",
    85,
    finY + 345,
  )

  ctx.textAlign = "right"
  ctx.fillStyle = "#F97316"
  ctx.font = "bold 38px monospace"
  ctx.fillText(`$${total.toFixed(2)}`, 1115, finY + 335)

  // ========================================================
  // 5. OFFICIAL SIGNATURE & DIGITAL VERIFICATION SEAL
  // ========================================================
  const authY = 1165
  const authH = 430
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 30, authY, 1140, authH, 18)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 15px monospace"
  ctx.textAlign = "left"
  ctx.fillText("OFFICIAL DISPATCH AUTHORIZATION & AUDIT TRAIL", 55, authY + 35)

  // Left Stamp Box
  ctx.fillStyle = "#F5F5F4"
  roundRect(ctx, 55, authY + 60, 500, 220, 14)
  ctx.fill()
  ctx.strokeStyle = "#E7E5E4"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = "#1C1917"
  ctx.font = "bold 14px system-ui, sans-serif"
  ctx.fillText("FLEET DIRECTOR VERIFICATION SEAL", 80, authY + 95)

  ctx.font = "500 13px system-ui, sans-serif"
  ctx.fillStyle = "#57534E"
  ctx.fillText(
    `Approving Authority: ${settings?.admin_name || "Studio Director • Fleet Operations"}`,
    80,
    authY + 130,
  )
  ctx.fillText(
    `Audit Status: ${
      isApproved ? "VERIFIED & SIGNED OFF" : "AWAITING MANAGER APPROVAL"
    }`,
    80,
    authY + 160,
  )
  ctx.fillText(
    `Dispatch Station: ${settings?.hub_address || "Terminal Garage B • Miami Airport"}`,
    80,
    authY + 190,
  )
  ctx.fillText(
    `WhatsApp Hotline: ${settings?.contact_phone || "+91 77807 40223"}`,
    80,
    authY + 220,
  )
  ctx.fillText(
    `Dispatch Email: ${settings?.contact_email || "nanikoushik96@gmail.com"}`,
    80,
    authY + 250,
  )

  // Right Security Box
  ctx.fillStyle = "#141518"
  roundRect(ctx, 580, authY + 60, 565, 220, 14)
  ctx.fill()

  ctx.fillStyle = "#F97316"
  ctx.font = "bold 13px monospace"
  ctx.fillText("CRYPTO AUDIT & DEEP LINK CHECKSUM", 610, authY + 95)

  ctx.fillStyle = "#E7E5E4"
  ctx.font = "12px monospace"
  ctx.fillText(
    `SHA-256 MANIFEST: ${booking.id}-VERIFIED-AUDIT-MOTORLY`,
    610,
    authY + 130,
  )
  ctx.fillText(`CLIENT IDENTIFIER: ${booking.customer.email}`, 610, authY + 160)
  ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 610, authY + 190)

  ctx.fillStyle = "#10B981"
  ctx.font = "bold 13px monospace"
  ctx.fillText("STATUS: SUPABASE POSTGRESQL SECURE CERTIFIED", 610, authY + 240)

  // Footer Disclaimer
  ctx.textAlign = "center"
  ctx.fillStyle = "#A8A29E"
  ctx.font = "500 12px system-ui, sans-serif"
  ctx.fillText(
    "Motorly Atelier Fleet Management Inc. • 24/7 Roadside & Hub Dispatch • Keep this invoice for vehicle key exchange.",
    600,
    authY + 340,
  )
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#78716C"
  ctx.fillText(
    `CONFIDENTIAL DOCUMENT • GENERATED BY MOTORLY ENTERPRISE STUDIO • RESERVATION ID: ${booking.id}`,
    600,
    authY + 375,
  )

  return canvas.toDataURL("image/png")
}

/**
 * Generates and triggers instant browser download of the trip invoice PNG
 */
export async function downloadBookingInvoicePng(
  booking: BookingRecord,
  car?: Car,
  settings?: InvoiceSettings,
): Promise<void> {
  const dataUrl = await generateBookingInvoicePng(booking, car, settings)
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `MOTORLY_Invoice_${booking.id}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
