/**
 * PIT STOP CAR HIRE - Official Rental Agreement & Invoice Generator
 * Replicates the authentic physical rental contract from 36 Triq Il-Kbira, Mgarr, Malta
 * with 5-view vehicle schematic, client signature, and official 21 clauses.
 */

import type { BookingRecord, Car, ConditionPin } from "../types"
import jsPDF from "jspdf"

export interface InvoiceSettings {
  admin_name?: string
  contact_phone?: string
  contact_email?: string
  hub_address?: string
  google_maps_url?: string
}

function drawCarSchematic(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  pins?: ConditionPin[],
) {
  ctx.save()
  ctx.strokeStyle = "#27272A"
  ctx.lineWidth = 1.6
  ctx.fillStyle = "#FFFFFF"

  // ------------------------------------------
  // 1. FRONT VIEW (left column, top)
  // ------------------------------------------
  const frontX = baseX
  const frontY = baseY

  // Windshield & Roof
  ctx.beginPath()
  ctx.moveTo(frontX + 18, frontY + 30)
  ctx.lineTo(frontX + 30, frontY + 10)
  ctx.lineTo(frontX + 80, frontY + 10)
  ctx.lineTo(frontX + 92, frontY + 30)
  ctx.closePath()
  ctx.fillStyle = "#F4F4F5"
  ctx.fill()
  ctx.stroke()

  // Body & Grille
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(frontX + 8, frontY + 30, 94, 34, 4)
  ctx.fill()
  ctx.stroke()

  // Headlights
  ctx.fillStyle = "#FEF08A"
  ctx.beginPath()
  ctx.roundRect(frontX + 12, frontY + 34, 16, 8, 2)
  ctx.roundRect(frontX + 82, frontY + 34, 16, 8, 2)
  ctx.fill()
  ctx.stroke()

  // Grille
  ctx.fillStyle = "#E4E4E7"
  ctx.fillRect(frontX + 36, frontY + 36, 38, 12)
  ctx.strokeRect(frontX + 36, frontY + 36, 38, 12)

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.fillRect(frontX + 10, frontY + 62, 12, 10)
  ctx.fillRect(frontX + 88, frontY + 62, 12, 10)

  // Front View Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 8px monospace"
  ctx.textAlign = "center"
  ctx.fillText("FRONT", frontX + 55, frontY + 80)

  // ------------------------------------------
  // 2. REAR VIEW (left column, bottom)
  // ------------------------------------------
  const rearX = baseX
  const rearY = baseY + 110

  ctx.beginPath()
  ctx.moveTo(rearX + 18, rearY + 30)
  ctx.lineTo(rearX + 30, rearY + 10)
  ctx.lineTo(rearX + 80, rearY + 10)
  ctx.lineTo(rearX + 92, rearY + 30)
  ctx.closePath()
  ctx.fillStyle = "#F4F4F5"
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(rearX + 8, rearY + 30, 94, 34, 4)
  ctx.fill()
  ctx.stroke()

  // Tail lights
  ctx.fillStyle = "#EF4444"
  ctx.beginPath()
  ctx.roundRect(rearX + 12, rearY + 34, 14, 10, 2)
  ctx.roundRect(rearX + 84, rearY + 34, 14, 10, 2)
  ctx.fill()
  ctx.stroke()

  // Number Plate
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(rearX + 36, rearY + 42, 38, 10)
  ctx.strokeRect(rearX + 36, rearY + 42, 38, 10)
  ctx.fillStyle = "#18181B"
  ctx.font = "bold 7px monospace"
  ctx.fillText("MALTA", rearX + 55, rearY + 50)

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.fillRect(rearX + 10, rearY + 62, 12, 10)
  ctx.fillRect(rearX + 88, rearY + 62, 12, 10)

  // Rear View Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 8px monospace"
  ctx.fillText("REAR", rearX + 55, rearY + 80)

  // ------------------------------------------
  // 3. PASSENGER PROFILE (right column, top - facing left)
  // ------------------------------------------
  const passX = baseX + 130
  const passY = baseY - 5

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  // Facing left: nose on left (passX + 5), rear hatch on right (passX + 195)
  ctx.moveTo(passX + 5, passY + 34)
  ctx.lineTo(passX + 30, passY + 30)
  ctx.lineTo(passX + 60, passY + 12)
  ctx.lineTo(passX + 130, passY + 12)
  ctx.lineTo(passX + 160, passY + 26)
  ctx.lineTo(passX + 195, passY + 36)
  ctx.lineTo(passX + 195, passY + 48)
  ctx.lineTo(passX + 175, passY + 48)
  ctx.arc(passX + 155, passY + 48, 12, 0, Math.PI, true)
  ctx.lineTo(passX + 55, passY + 48)
  ctx.arc(passX + 35, passY + 48, 12, 0, Math.PI, true)
  ctx.lineTo(passX + 5, passY + 48)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Windows
  ctx.fillStyle = "#F4F4F5"
  ctx.beginPath()
  ctx.moveTo(passX + 62, passY + 15)
  ctx.lineTo(passX + 128, passY + 15)
  ctx.lineTo(passX + 155, passY + 28)
  ctx.lineTo(passX + 38, passY + 28)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.beginPath()
  ctx.arc(passX + 35, passY + 48, 11, 0, Math.PI * 2)
  ctx.arc(passX + 155, passY + 48, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = "#E4E4E7"
  ctx.beginPath()
  ctx.arc(passX + 35, passY + 48, 5, 0, Math.PI * 2)
  ctx.arc(passX + 155, passY + 48, 5, 0, Math.PI * 2)
  ctx.fill()

  // Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 8px monospace"
  ctx.fillText("PASSENGER PROFILE (LEFT)", passX + 100, passY + 68)

  // ------------------------------------------
  // 4. TOP AERIAL VIEW (right column, middle)
  // ------------------------------------------
  const aerialX = baseX + 130
  const aerialY = baseY + 75

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(aerialX + 10, aerialY + 8, 185, 48, 10)
  ctx.fill()
  ctx.stroke()

  // Windshield & Rear glass
  ctx.fillStyle = "#F4F4F5"
  ctx.beginPath()
  ctx.roundRect(aerialX + 45, aerialY + 12, 16, 40, 3)
  ctx.roundRect(aerialX + 135, aerialY + 12, 14, 40, 3)
  ctx.fill()
  ctx.stroke()

  // Roof
  ctx.fillStyle = "#FAFAFA"
  ctx.fillRect(aerialX + 66, aerialY + 12, 64, 40)
  ctx.strokeRect(aerialX + 66, aerialY + 12, 64, 40)

  // Mirrors
  ctx.fillStyle = "#71717A"
  ctx.fillRect(aerialX + 48, aerialY + 2, 8, 6)
  ctx.fillRect(aerialX + 48, aerialY + 56, 8, 6)

  // Aerial Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 8px monospace"
  ctx.fillText("AERIAL TOP VIEW", aerialX + 100, aerialY + 70)

  // ------------------------------------------
  // 5. DRIVER PROFILE (right column, bottom - facing right)
  // ------------------------------------------
  const driverX = baseX + 130
  const driverY = baseY + 150

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  // Facing right: rear on left (driverX + 5), front nose on right (driverX + 195)
  ctx.moveTo(driverX + 195, driverY + 34)
  ctx.lineTo(driverX + 170, driverY + 30)
  ctx.lineTo(driverX + 140, driverY + 12)
  ctx.lineTo(driverX + 70, driverY + 12)
  ctx.lineTo(driverX + 40, driverY + 26)
  ctx.lineTo(driverX + 5, driverY + 36)
  ctx.lineTo(driverX + 5, driverY + 48)
  ctx.lineTo(driverX + 25, driverY + 48)
  ctx.arc(driverX + 45, driverY + 48, 12, 0, Math.PI, true)
  ctx.lineTo(driverX + 145, driverY + 48)
  ctx.arc(driverX + 165, driverY + 48, 12, 0, Math.PI, true)
  ctx.lineTo(driverX + 195, driverY + 48)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Windows
  ctx.fillStyle = "#F4F4F5"
  ctx.beginPath()
  ctx.moveTo(driverX + 138, driverY + 15)
  ctx.lineTo(driverX + 72, driverY + 15)
  ctx.lineTo(driverX + 45, driverY + 28)
  ctx.lineTo(driverX + 162, driverY + 28)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Wheels
  ctx.fillStyle = "#27272A"
  ctx.beginPath()
  ctx.arc(driverX + 45, driverY + 48, 11, 0, Math.PI * 2)
  ctx.arc(driverX + 165, driverY + 48, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = "#E4E4E7"
  ctx.beginPath()
  ctx.arc(driverX + 45, driverY + 48, 5, 0, Math.PI * 2)
  ctx.arc(driverX + 165, driverY + 48, 5, 0, Math.PI * 2)
  ctx.fill()

  // Driver Profile Label
  ctx.fillStyle = "#71717A"
  ctx.font = "bold 8px monospace"
  ctx.fillText("DRIVER PROFILE (RIGHT)", driverX + 100, driverY + 68)

  // ------------------------------------------
  // RENDER PINS ONTO THE SCHEMATIC
  // ------------------------------------------
  if (pins && pins.length > 0) {
    pins.forEach((pin, idx) => {
      let box = { x: 0, y: 0, w: 0, h: 0 }
      if (pin.view === "front") {
        box = { x: frontX + 8, y: frontY + 8, w: 94, h: 65 }
      } else if (pin.view === "rear") {
        box = { x: rearX + 8, y: rearY + 8, w: 94, h: 65 }
      } else if (pin.view === "passenger") {
        box = { x: passX + 5, y: passY + 10, w: 190, h: 50 }
      } else if (pin.view === "aerial" || (pin.view as string) === "top") {
        box = { x: aerialX + 10, y: aerialY + 8, w: 185, h: 50 }
      } else if (pin.view === "driver") {
        box = { x: driverX + 5, y: driverY + 10, w: 190, h: 50 }
      }

      if (box.w > 0) {
        const pinX = box.x + (pin.x / 100) * box.w
        const pinY = box.y + (pin.y / 100) * box.h

        ctx.save()
        ctx.fillStyle = "#E11D48"
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(pinX, pinY, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 8px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(String(idx + 1), pinX, pinY)
        ctx.restore()
      }
    })
  }

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
  const rawPhones = String(settings?.contact_phone || "+356 9982 7192")
  const splitPhones = rawPhones
    .split(/[,;/|\r\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const address = settings?.hub_address || "36 Triq Il-Kbira, Mgarr"
  ctx.textAlign = "right"
  ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif"
  ctx.fillStyle = "#18181B"
  ctx.fillText(address, 1110, 85)
  ctx.font = "bold 18px monospace"
  ctx.fillText(splitPhones[0] || "+356 9982 7192", 1110, 112)
  if (splitPhones[1]) {
    ctx.fillText(splitPhones[1], 1110, 136)
  }

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

  // Draw the 5-View Vehicle Schematic Diagram with pins
  drawCarSchematic(ctx, rightBoxX + 30, financeY + 25, booking.conditionPins)

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
    `PIT STOP CAR HIRE • ${address.toUpperCase()} • PHONE: ${splitPhones.join(" / ") || "+356 9982 7192"} • AGREEMENT ID: ${booking.id}`,
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
