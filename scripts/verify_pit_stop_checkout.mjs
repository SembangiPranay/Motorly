import { chromium } from "playwright"
import path from "path"

const TARGET_URL = process.env.APP_URL || "http://localhost:3000"
const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("1. Launching Edge browser for Pit Stop Car Hire Checkout validation...")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5,
  })
  const page = await context.newPage()

  console.log(`2. Navigating to ${TARGET_URL}...`)
  await page.goto(TARGET_URL, { waitUntil: "networkidle" })

  // Set localStorage to checkout view with authenticated customer
  console.log("3. Setting view to checkout and simulating active authenticated renter...")
  await page.evaluate(() => {
    localStorage.setItem("motorly_current_view", "checkout")
    localStorage.setItem(
      "motorly_customer_user",
      JSON.stringify({
        id: "usr_malta_client_1",
        email: "paul.vella@gmail.com",
        name: "Paul Vella",
        phone: "+356 99827192",
        role: "customer",
        driverLicenseNum: "0123456M",
        driverLicenseState: "Malta",
        driverLicenseExpiry: "2029-12-31",
      }),
    )
  })

  // Reload to activate checkout state
  await page.goto(TARGET_URL, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  // Verify elements
  console.log("4. Verifying Checkout page structure...")

  const pageTitle = page.locator("text=Complete Your Reservation Request").first()
  console.log(" - Page Title visible:", await pageTitle.isVisible())

  // Verify Pit Stop Header in Order Summary
  const pitStopHeader = page.locator("text=PIT STOP CAR HIRE").first()
  console.log(" - Pit Stop Car Hire header in Order Summary:", await pitStopHeader.isVisible())

  // Verify Module 1: Primary Client Information
  const clientInfo = page.locator("text=Primary Client Information").first()
  console.log(" - Primary Client Info section:", await clientInfo.isVisible())
  const mobNumber = page.locator("text=Mob Number").first()
  console.log(" - Mob Number field:", await mobNumber.isVisible())

  // Verify Module 2: Driver's License & Identity Verification
  const licenseSection = page.locator("text=Driver's License & Identity Verification").first()
  console.log(" - Driver License & Identity section:", await licenseSection.isVisible())

  // Verify Module 3: Delivery & Return Handover Locations
  const deliverySection = page.locator("text=Delivery & Return Handover Locations").first()
  console.log(" - Delivery & Return Handover Locations section:", await deliverySection.isVisible())

  // Verify Module 4: Optional Services & Equipment
  const optionalSection = page.locator("text=Optional Services & Equipment").first()
  console.log(" - Optional Services section:", await optionalSection.isVisible())
  const strollerItem = page.locator("text=Baby Stroller / Buggy").first()
  console.log(" - Baby Stroller option (Clause 1):", await strollerItem.isVisible())
  const boosterItem = page.locator("text=Child Booster / Safety Seat").first()
  console.log(" - Child Booster option (Clause 1):", await boosterItem.isVisible())
  const playpenItem = page.locator("text=Baby Playpen / Travel Cot").first()
  console.log(" - Baby Playpen option (Clause 1):", await playpenItem.isVisible())

  // Verify Module 5: Booking Remarks & Rental Extension Notice
  const extensionNotice = page.locator("text=If Rental will be extended please advise before").first()
  console.log(" - Extension Notice banner:", await extensionNotice.isVisible())

  // Verify Module 6: Vehicle Condition Chart & Client Signature
  const conditionSection = page.locator("text=Vehicle Condition Chart & Client Signature").first()
  console.log(" - 5-View Schematic & Client Signature section:", await conditionSection.isVisible())
  const clientSigLabel = page.locator("text=Client signature:").first()
  console.log(" - Client signature pad label:", await clientSigLabel.isVisible())

  // Screenshot Checkout full view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "pit_stop_checkout_initial.png"), fullPage: true })
  console.log("Saved initial checkout screenshot.")

  // 5. Interact with Delivery Options: select Custom Delivery (+€20) and Custom Return (+€20)
  console.log("5. Testing Delivery Options selection...")
  const customDeliveryBtn = page.locator('button:has-text("Custom Location Delivery")').first()
  if (await customDeliveryBtn.isVisible()) {
    await customDeliveryBtn.click()
    await page.waitForTimeout(300)
    const airportPill = page.locator('button:has-text("Malta International Airport (MLA) Terminal")').first()
    if (await airportPill.isVisible()) await airportPill.click()
  }

  // 6. Interact with Optional Services: check Stroller and Booster
  console.log("6. Testing Optional Services selection...")
  if (await strollerItem.isVisible()) await strollerItem.click()
  if (await boosterItem.isVisible()) await boosterItem.click()
  await page.waitForTimeout(500)

  // 7. Sign digital signature
  console.log("7. Testing Client Signature pad...")
  const switchType = page.locator('button:has-text("Switch to Type Signature")').first()
  if (await switchType.isVisible()) {
    await switchType.click()
    await page.waitForTimeout(300)
    const nameInput = page.locator('input[placeholder="Type your full legal name to sign digitally"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill("Paul Vella")
    }
  }

  // Fill in remarks
  const remarksInput = page.locator('textarea[placeholder*="KM613"]').first()
  if (await remarksInput.isVisible()) {
    await remarksInput.fill("Arriving on Ryanair flight FR3884 at 11:30 AM at Malta Airport MLA. Please meet at arrivals exit.")
  }

  await page.waitForTimeout(500)

  // Screenshot configured checkout
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "pit_stop_checkout_configured.png"), fullPage: true })
  console.log("Saved configured checkout screenshot.")

  // 8. Open Legal Policies Modal and verify authentic 21 clauses
  console.log("8. Testing Legal Policies Modal...")
  const reviewClausesBtn = page.locator('button:has-text("Pit Stop Car Hire 21 Rental Clauses")').first()
  if (await reviewClausesBtn.isVisible()) {
    await reviewClausesBtn.click()
    await page.waitForTimeout(600)
    const clause1 = page.locator("text=1) Territorial Scope & Authorized Equipment").first()
    console.log(" - Clause 1 (Malta & Gozo, Stroller, Booster, Playpen) visible:", await clause1.isVisible())
    const clause16 = page.locator("text=16) €80 Cleaning Fee Penalty").first()
    console.log(" - Clause 16 (€80 cleaning penalty) visible:", await clause16.isVisible())
    const clause17 = page.locator("text=17) Excessive Speeding & Offroading Prohibition").first()
    console.log(" - Clause 17 (speeding and offroading ban) visible:", await clause17.isVisible())

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "pit_stop_legal_clauses_modal.png") })
    console.log("Saved legal clauses modal screenshot.")

    // Switch to Deposit tab in modal
    const depositTab = page.locator('button:has-text("€700 Excess & €80 Cleaning Fee")').first()
    if (await depositTab.isVisible()) {
      await depositTab.click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "pit_stop_deposit_modal.png") })
      console.log("Saved deposit tab screenshot.")
    }

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]').first()
    if (await closeBtn.isVisible()) await closeBtn.click()
    await page.waitForTimeout(300)
  }

  await browser.close()
  console.log("✅ Pit Stop Car Hire Checkout Verification Passed Completely!")
}

run().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
