import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("Generating Pit Stop Agreement document test...")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" })

  // Trigger invoice generation in page context
  const pngDataUrl = await page.evaluate(async () => {
    // Dynamically import or invoke invoice generator
    const { generateBookingInvoicePng } = await import("/src/utils/invoiceGenerator.ts")
    const sampleBooking = {
      id: "MTR-884210",
      customer: {
        firstName: "Paul",
        lastName: "Vella",
        email: "paul.vella@gmail.com",
        phone: "+356 99827192",
        idNumber: "0123456M",
      },
      driver: {
        licenseNumber: "0123456M",
        licenseState: "Malta",
        licenseExpiry: "2029-12-31",
        dateOfBirth: "1992-05-14",
      },
      pickupLocation: "Malta International Airport (MLA)",
      returnLocation: "Malta International Airport (MLA)",
      pickupDate: "Nov 15, 2026 10:00 AM",
      returnDate: "Nov 18, 2026 10:00 AM",
      totalAmount: 295.0,
      deliveryFee: 20.0,
      returnFee: 20.0,
      optionalServices: ["Baby Stroller", "Child Booster Seat"],
      optionalServicesCost: 30.0,
      securityDeposit: 700,
      remarks: "Flight KM613 arriving 14:30. Stroller in back trunk.",
      clientSignature: "Paul Vella",
      status: "Assigned",
      createdAt: new Date().toISOString(),
      carPlateNumber: "MTR-9021",
    }
    const sampleCar = {
      id: "car_1",
      name: "Peugeot 208 Allure Automatic",
      pricePerDay: 75,
      plateNumber: "MTR-9021",
    }
    return await generateBookingInvoicePng(sampleBooking, sampleCar, {
      hub_address: "36 Triq Il-Kbira, Mgarr",
      contact_phone: "99827192 / 99804255",
    })
  })

  // Save the PNG directly
  const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, "")
  const fs = await import("fs")
  const outPath = path.join(ARTIFACT_DIR, "pit_stop_official_agreement_generated.png")
  fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"))
  console.log("Saved generated agreement document to:", outPath)

  await browser.close()
}

run().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
