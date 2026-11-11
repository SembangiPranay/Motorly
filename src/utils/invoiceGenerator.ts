/**
 * PIT STOP CAR HIRE - Official Rental Agreement & Invoice Generator
 * Replicates the authentic physical rental contract from 36 Triq Il-Kbira, Mgarr, Malta
 * with 5-view vehicle schematic, client signature, and official 21 clauses.
 */

import type { BookingRecord, Car } from "../types"
import jsPDF from "jspdf"

export interface InvoiceSettings {
  admin_name?: string
  contact_phone?: string
  contact_email?: string
  hub_address?: string
  google_maps_url?: string
}

function drawCarSchematic(ctx: CanvasRenderingContext2D, baseX: number, baseY: number) {
  ctx.save()
  ctx.strokeStyle = "#27272A"
  ctx.lineWidth = 1.8
  ctx.fillStyle = "#FFFFFF"

  // 1. FRONT VIEW (top left of schematic block)
  // Windshield & Roof
  ctx.beginPath()
  ctx.moveTo(baseX + 15, baseY + 35)
  ctx.lineTo(baseX + 28, baseY + 12)
  ctx.lineTo(baseX + 82, baseY + 12)
  ctx.lineTo(baseX + 95, baseY + 35)
  ctx.closePath()
  ctx.fillStyle = "#F4F4F5"
  ctx.fill()
  ctx.stroke()

  // Body & Grille
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(baseX + 5, baseY + 35, 100, 40, 6)
  ctx.fill()
  ctx.stroke()

  // Headlights
  ctx.fillStyle = "#FEF08A"
  ctx.beginPath()
  ctx.roundRect(baseX + 10, baseY + 40, 18, 10, 2)
  ctx.roundRect(baseX + 82, baseY + 40, 18, 10, 2)
  ctx.fill()
  ctx.stroke()

  // Grille
  ctx.fillStyle = "#E4E4E7"
  ctx.fillRect(baseX + 35, baseY + 42, 40, 14)
  ctx.strokeRect(baseX + 35, baseY + 42, 40, 14)

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.fillRect(baseX + 8, baseY + 72, 14, 12)
  ctx.fillRect(baseX + 88, baseY + 72, 14, 12)

  // Front View Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 9px monospace"
  ctx.textAlign = "center"
  ctx.fillText("FRONT", baseX + 55, baseY + 94)

  // 2. REAR VIEW (bottom left of schematic block)
  const rearY = baseY + 105
  ctx.beginPath()
  ctx.moveTo(baseX + 16, rearY + 35)
  ctx.lineTo(baseX + 28, rearY + 12)
  ctx.lineTo(baseX + 82, rearY + 12)
  ctx.lineTo(baseX + 94, rearY + 35)
  ctx.closePath()
  ctx.fillStyle = "#F4F4F5"
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(baseX + 5, rearY + 35, 100, 40, 6)
  ctx.fill()
  ctx.stroke()

  // Tail lights
  ctx.fillStyle = "#EF4444"
  ctx.beginPath()
  ctx.roundRect(baseX + 8, rearY + 40, 16, 12, 2)
  ctx.roundRect(baseX + 86, rearY + 40, 16, 12, 2)
  ctx.fill()
  ctx.stroke()

  // Number Plate
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(baseX + 35, rearY + 48, 40, 12)
  ctx.strokeRect(baseX + 35, rearY + 48, 40, 12)
  ctx.fillStyle = "#18181B"
  ctx.font = "bold 8px monospace"
  ctx.fillText("MALTA", baseX + 55, rearY + 57)

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.fillRect(baseX + 8, rearY + 72, 14, 12)
  ctx.fillRect(baseX + 88, rearY + 72, 14, 12)

  // Rear View Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 9px monospace"
  ctx.fillText("REAR", baseX + 55, rearY + 94)

  // 3. DRIVER SIDE PROFILE (top right of schematic block)
  const sideX = baseX + 130
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.moveTo(sideX + 10, baseY + 60)
  ctx.lineTo(sideX + 25, baseY + 60)
  ctx.arc(sideX + 42, baseY + 60, 14, Math.PI, 0, false)
  ctx.lineTo(sideX + 155, baseY + 60)
  ctx.arc(sideX + 172, baseY + 60, 14, Math.PI, 0, false)
  ctx.lineTo(sideX + 205, baseY + 60)
  ctx.lineTo(sideX + 208, baseY + 45)
  ctx.lineTo(sideX + 175, baseY + 32)
  ctx.lineTo(sideX + 140, baseY + 14)
  ctx.lineTo(sideX + 75, baseY + 14)
  ctx.lineTo(sideX + 40, baseY + 35)
  ctx.lineTo(sideX + 10, baseY + 40)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Windows
  ctx.fillStyle = "#F4F4F5"
  ctx.beginPath()
  ctx.moveTo(sideX + 78, baseY + 18)
  ctx.lineTo(sideX + 135, baseY + 18)
  ctx.lineTo(sideX + 165, baseY + 33)
  ctx.lineTo(sideX + 46, baseY + 33)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sideX + 105, baseY + 18)
  ctx.lineTo(sideX + 105, baseY + 55)
  ctx.stroke()

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.beginPath()
  ctx.arc(sideX + 42, baseY + 60, 13, 0, Math.PI * 2)
  ctx.arc(sideX + 172, baseY + 60, 13, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = "#E4E4E7"
  ctx.beginPath()
  ctx.arc(sideX + 42, baseY + 60, 6, 0, Math.PI * 2)
  ctx.arc(sideX + 172, baseY + 60, 6, 0, Math.PI * 2)
  ctx.fill()

  // Side Profile Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 9px monospace"
  ctx.fillText("DRIVER SIDE PROFILE", sideX + 105, baseY + 86)

  // 4. TOP AERIAL VIEW (bottom right of schematic block)
  const aerialY = baseY + 105
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(sideX + 10, aerialY + 15, 195, 62, 14)
  ctx.fill()
  ctx.stroke()

  // Windshield & Rear glass
  ctx.fillStyle = "#F4F4F5"
  ctx.beginPath()
  ctx.roundRect(sideX + 50, aerialY + 20, 20, 52, 4)
  ctx.roundRect(sideX + 145, aerialY + 20, 18, 52, 4)
  ctx.fill()
  ctx.stroke()

  // Roof
  ctx.fillStyle = "#FAFAFA"
  ctx.fillRect(sideX + 75, aerialY + 20, 65, 52)
  ctx.strokeRect(sideX + 75, aerialY + 20, 65, 52)

  // Mirrors
  ctx.fillStyle = "#71717A"
  ctx.fillRect(sideX + 52, aerialY + 7, 10, 8)
  ctx.fillRect(sideX + 52, aerialY + 77, 10, 8)

  // Aerial Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 9px monospace"
  ctx.fillText("TOP AERIAL VIEW", sideX + 105, aerialY + 98)

  ctx.restore()
}

/**
 * Generates an official PNG matching the physical Pit Stop Car Hire agreement
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

  // Paper Background (Clean warm white paper tone)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, 1200, 1650)

  // Outer border of sheet
  ctx.strokeStyle = "#D4D4D8"
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, 1120, 1570)

  // ==========================================
  // HEADER SECTION (PIT STOP CAR HIRE & ADDRESS)
  // ==========================================
  // Company Name
  ctx.textAlign = "left"
  ctx.fillStyle = "#18181B"
  ctx.font = "900 36px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("PIT STOP CAR HIRE", 70, 95)

  // Race car silhouette under name
  ctx.strokeStyle = "#18181B"
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(70, 125)
  ctx.lineTo(85, 125)
  ctx.arc(95, 125, 9, Math.PI, 0, false)
  ctx.lineTo(165, 125)
  ctx.arc(175, 125, 9, Math.PI, 0, false)
  ctx.lineTo(210, 125)
  ctx.lineTo(215, 115)
  ctx.lineTo(190, 110)
  ctx.lineTo(155, 103)
  ctx.lineTo(110, 103)
  ctx.lineTo(85, 115)
  ctx.closePath()
  ctx.stroke()

  // Right Header Address & Phones
  const phone = settings?.contact_phone || "+356 99827192 / 99804255"
  const address = settings?.hub_address || "36 Triq Il-Kbira, Mgarr"
  ctx.textAlign = "right"
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText(address, 1110, 85)
  ctx.font = "bold 18px monospace"
  ctx.fillText("99827192", 1110, 112)
  ctx.fillText("99804255", 1110, 136)

  // Dividing Line under Header
  ctx.strokeStyle = "#27272A"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(70, 155)
  ctx.lineTo(1110, 155)
  ctx.stroke()

  // ==========================================
  // RENTAL RECORD FORM FIELDS
  // ==========================================
  const issueDate = new Date(booking.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const customerName = `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || "Valued Client"
  const idNumber = booking.customer.idNumber || booking.driver?.licenseNumber || "Verified at Desk"
  const mobNumber = booking.customer.phone || "+356 99827192"
  const hiringCar = car?.name || booking.requestedCategory || "Economy Vehicle"
  const regNumber = booking.carPlateNumber || car?.plateNumber || "MTR-8842"
  const fromSchedule = booking.pickupDate
  const tillSchedule = booking.returnDate

  let currentY = 200
  const lineSpacing = 42

  // Date
  ctx.textAlign = "left"
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText("Date:", 70, currentY)
  ctx.font = "500 20px 'Courier New', monospace"
  ctx.fillText(issueDate, 140, currentY)
  ctx.strokeStyle = "#A1A1AA"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(135, currentY + 5)
  ctx.lineTo(350, currentY + 5)
  ctx.stroke()

  // Name & ID
  currentY += lineSpacing
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText("Name:", 70, currentY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(customerName, 145, currentY)
  ctx.beginPath()
  ctx.moveTo(140, currentY + 5)
  ctx.lineTo(550, currentY + 5)
  ctx.stroke()

  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("ID:", 600, currentY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(idNumber, 645, currentY)
  ctx.beginPath()
  ctx.moveTo(640, currentY + 5)
  ctx.lineTo(1110, currentY + 5)
  ctx.stroke()

  // Mob number
  currentY += lineSpacing
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Mob number:", 70, currentY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(mobNumber, 210, currentY)
  ctx.beginPath()
  ctx.moveTo(205, currentY + 5)
  ctx.lineTo(650, currentY + 5)
  ctx.stroke()

  // Hiring & REG
  currentY += lineSpacing
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Hiring:", 70, currentY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(hiringCar, 150, currentY)
  ctx.beginPath()
  ctx.moveTo(145, currentY + 5)
  ctx.lineTo(600, currentY + 5)
  ctx.stroke()

  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("REG:", 640, currentY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(regNumber, 700, currentY)
  ctx.beginPath()
  ctx.moveTo(695, currentY + 5)
  ctx.lineTo(1110, currentY + 5)
  ctx.stroke()

  // From: till:
  currentY += lineSpacing
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("From:", 70, currentY)
  ctx.font = "bold 18px 'Courier New', monospace"
  ctx.fillText(fromSchedule, 140, currentY)
  ctx.beginPath()
  ctx.moveTo(135, currentY + 5)
  ctx.lineTo(550, currentY + 5)
  ctx.stroke()

  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("till:", 600, currentY)
  ctx.font = "bold 18px 'Courier New', monospace"
  ctx.fillText(tillSchedule, 650, currentY)
  ctx.beginPath()
  ctx.moveTo(645, currentY + 5)
  ctx.lineTo(1110, currentY + 5)
  ctx.stroke()

  // Extension Notice banner from paper
  currentY += lineSpacing - 5
  ctx.font = "bold 18px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#9A3412"
  ctx.fillText("If Rental will be extended please advise before", 70, currentY)

  // ==========================================
  // FINANCIAL SECTION & 5-VIEW DIAGRAM
  // ==========================================
  const financeY = currentY + 50
  const dailyRate = car?.pricePerDay ? `€${car.pricePerDay}` : "€75"
  const depositVal = booking.securityDeposit != null ? `€${booking.securityDeposit}` : "€700"
  const deliveryFeeVal = booking.deliveryFee != null && booking.deliveryFee > 0 ? `€${booking.deliveryFee}` : "€0"
  const returnFeeVal = booking.returnFee != null && booking.returnFee > 0 ? `€${booking.returnFee}` : "€0"
  const totalSumVal = `€${Number(booking.totalAmount || 0).toFixed(2)}`

  // Financial Rows (Left Side)
  const fLeftX = 70
  let fRowY = financeY

  // The Sum of €___ Per Day
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText("The Sum of", fLeftX, fRowY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(dailyRate, fLeftX + 125, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 120, fRowY + 4)
  ctx.lineTo(fLeftX + 220, fRowY + 4)
  ctx.stroke()
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Per Day", fLeftX + 230, fRowY)

  // Deposit of €___
  fRowY += 50
  ctx.fillText("Deposit of", fLeftX, fRowY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(depositVal, fLeftX + 115, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 110, fRowY + 4)
  ctx.lineTo(fLeftX + 280, fRowY + 4)
  ctx.stroke()

  // Delivery to location Fee €___
  fRowY += 50
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Delivery to location Fee", fLeftX, fRowY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(deliveryFeeVal, fLeftX + 250, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 245, fRowY + 4)
  ctx.lineTo(fLeftX + 380, fRowY + 4)
  ctx.stroke()

  // Return to location Fee €___
  fRowY += 50
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Return to location Fee", fLeftX, fRowY)
  ctx.font = "bold 20px 'Courier New', monospace"
  ctx.fillText(returnFeeVal, fLeftX + 240, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 235, fRowY + 4)
  ctx.lineTo(fLeftX + 380, fRowY + 4)
  ctx.stroke()

  // Total Sum €___
  fRowY += 50
  ctx.font = "900 22px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Total Sum", fLeftX, fRowY)
  ctx.font = "bold 24px 'Courier New', monospace"
  ctx.fillStyle = "#C2410C"
  ctx.fillText(totalSumVal, fLeftX + 130, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 125, fRowY + 4)
  ctx.lineTo(fLeftX + 350, fRowY + 4)
  ctx.stroke()

  // Optional Services
  fRowY += 50
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText("Optional Services:", fLeftX, fRowY)
  const servicesList = Array.isArray(booking.optionalServices)
    ? booking.optionalServices.join(", ")
    : booking.optionalServices || "None"
  ctx.font = "500 18px 'Courier New', monospace"
  ctx.fillText(servicesList, fLeftX + 185, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 180, fRowY + 4)
  ctx.lineTo(fLeftX + 460, fRowY + 4)
  ctx.stroke()

  // Remarks
  fRowY += 50
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillText("Remarks:", fLeftX, fRowY)
  const remarksText = booking.remarks || booking.notes || "None"
  ctx.font = "500 17px 'Courier New', monospace"
  ctx.fillText(remarksText.slice(0, 36), fLeftX + 105, fRowY)
  ctx.beginPath()
  ctx.moveTo(fLeftX + 100, fRowY + 4)
  ctx.lineTo(fLeftX + 460, fRowY + 4)
  ctx.stroke()

  // Right Side: Client signature & 5-view car schematic
  const rightBoxX = 580
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText("Client signature:", rightBoxX, financeY)

  // Draw signature line
  ctx.beginPath()
  ctx.moveTo(rightBoxX + 165, financeY + 4)
  ctx.lineTo(rightBoxX + 530, financeY + 4)
  ctx.stroke()

  // If clientSignature is present as text or drawn, render it
  if (booking.clientSignature) {
    if (booking.clientSignature.startsWith("data:image")) {
      try {
        const sigImg = new Image()
        sigImg.src = booking.clientSignature
        ctx.drawImage(sigImg, rightBoxX + 180, financeY - 35, 200, 45)
      } catch {
        ctx.font = "italic 24px 'Brush Script MT', cursive, serif"
        ctx.fillText(customerName, rightBoxX + 185, financeY - 5)
      }
    } else {
      ctx.font = "italic 24px 'Brush Script MT', cursive, serif"
      ctx.fillText(booking.clientSignature, rightBoxX + 185, financeY - 5)
    }
  } else {
    ctx.font = "italic 22px 'Brush Script MT', cursive, serif"
    ctx.fillText(customerName, rightBoxX + 185, financeY - 5)
  }

  // Draw the 5-View Vehicle Schematic Diagram
  drawCarSchematic(ctx, rightBoxX + 40, financeY + 30)

  // ==========================================
  // BOTTOM 5 CLAUSES (FRONT PAGE REPLICATION)
  // ==========================================
  const clauseStartY = 880
  ctx.strokeStyle = "#E4E4E7"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(70, clauseStartY - 20)
  ctx.lineTo(1110, clauseStartY - 20)
  ctx.stroke()

  const clauses = [
    "1) The vehicle (Car, Van and Scooter) and •other rentals (Stroller, Booster and Playpen) shall be used exclusively for the purpose of social domestic and pleasure purposes or business purposes within Malta and Gozo.",
    "2) The vehicle is in good mechanical condition, and state of repair and must be returned in the same state and condition, wear and tear excepted at the termination of hire.",
    "3) The Person who is using our rental services must inform Pit Stop Car Hire of any loss of damage/s to, or fault/s in the vehicle or rental. Use of the vehicle or rental when damaged or faulty shall be at the person's responsibility/risk who is using our rental. Unauthorized repairs are not allowed, and if such repairs are done, the Person who is using our rental services shall be responsible for any faults/issues or damages caused as a result.",
    "4) The Person who is using our rental services shall be responsible for the normal insurance excess amount of €700 in respect to any claims that could rise. This amount may only be exempt in accordance with the option given overleaf at an extra cost.",
    "5) The vehicle is provided with fully comprehensive insurance. If the vehicle is used or driven against the terms of either this agreement or the insurance policy, the Person who is using our rental services shall be liable for the payment of all damages.",
    "16) A fee of €80 will be charged if necessary if the vehicle is returned excessively/unusually dirty (e.g. pet hair, spilled food/drink, excessive garbage, stickers on windows, bodily fluids). Offroading & speeding forbidden (Clause 17).",
  ]

  let clauseY = clauseStartY
  ctx.fillStyle = "#3F3F46"
  ctx.font = "500 13px/1.4 system-ui, -apple-system, sans-serif"

  for (const c of clauses) {
    const words = c.split(" ")
    let currentLine = ""
    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 1040) {
        ctx.fillText(currentLine, 70, clauseY)
        currentLine = w
        clauseY += 19
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, 70, clauseY)
      clauseY += 26
    }
  }

  // Footer Tagline
  ctx.textAlign = "center"
  ctx.font = "bold 12px monospace"
  ctx.fillStyle = "#71717A"
  ctx.fillText(
    `PIT STOP CAR HIRE • 36 TRIQ IL-KBIRA, MGARR, MALTA • PHONES: 99827192 / 99804255 • AGREEMENT ID: ${booking.id}`,
    600,
    1575,
  )

  return canvas.toDataURL("image/png")
}

/**
 * Downloads official PNG contract
 */
export async function downloadBookingInvoicePng(
  booking: BookingRecord,
  car?: Car,
  settings?: InvoiceSettings,
): Promise<void> {
  const dataUrl = await generateBookingInvoicePng(booking, car, settings)
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `PitStop_Agreement_${booking.id}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generates official A4 PDF document
 */
export async function generateBookingInvoicePdf(
  booking: BookingRecord,
  car?: Car,
  settings?: InvoiceSettings,
): Promise<Blob> {
  const pngDataUrl = await generateBookingInvoicePng(booking, car, settings)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(pngDataUrl, "PNG", 0, 0, pdfWidth, pdfHeight)
  return pdf.output("blob")
}

/**
 * Downloads official PDF contract
 */
export async function downloadBookingInvoicePdf(
  booking: BookingRecord,
  car?: Car,
  settings?: InvoiceSettings,
): Promise<void> {
  const blob = await generateBookingInvoicePdf(booking, car, settings)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `PitStop_Agreement_${booking.id}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
