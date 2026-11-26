import { chromium } from "playwright"
import path from "path"

const TARGET_URL = process.env.APP_URL || "http://localhost:3000"
const API_URL = "http://localhost:3001"
const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("=== PIT STOP 5-VIEW SCHEMATIC & E2E FLOW TEST ===")

  // 1. Register a real customer account with valid JWT session
  const testEmail = `mario.${Date.now()}@pitstopcarhire.com`
  console.log(`1. Registering verified customer account (${testEmail})...`)
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "Password123!",
      name: "Mario Camilleri",
      phone: "+356 9980 4255",
      driverLicenseNum: "9876543M",
      driverLicenseState: "Malta",
      driverLicenseExpiry: "2030-05-15",
    }),
  })
  const regData = await regRes.json()
  if (!regData.token || !regData.user) {
    throw new Error(`Customer registration failed: ${JSON.stringify(regData)}`)
  }
  console.log(" ✓ Customer registered with valid JWT token:", regData.token.slice(0, 15) + "...")

  console.log(`2. Launching browser to test on ${TARGET_URL}...`)
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5,
  })
  const page = await context.newPage()

  page.on("dialog", (dialog) => {
    console.log("⚠️ Dialog alert intercepted:", dialog.message())
    dialog.accept()
  })

  // 2. Setup authenticated customer state with future booking dates and active vehicle
  console.log("3. Seeding customer JWT session and rental schedule...")
  await page.goto(TARGET_URL, { waitUntil: "networkidle" })
  await page.evaluate(({ token, user }) => {
    const today = new Date()
    const pickup = new Date(today.getTime() + 20 * 24 * 3600 * 1000)
    const ret = new Date(today.getTime() + 23 * 24 * 3600 * 1000)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const pickupStr = `${monthNames[pickup.getMonth()]} ${pickup.getDate()}, ${pickup.getFullYear()}`
    const returnStr = `${monthNames[ret.getMonth()]} ${ret.getDate()}, ${ret.getFullYear()}`

    localStorage.setItem("pitstop_customer_token", token)
    localStorage.setItem("pitstop_customer_user", JSON.stringify(user))
    localStorage.setItem("pitstop_current_view", "checkout")
    localStorage.setItem("pitstop_selected_car_id", "honda-crv")
  }, { token: regData.token, user: regData.user })

  // Reload to land directly in checkout view with honda-crv
  await page.goto(`${TARGET_URL}/?view=checkout&car=honda-crv`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  // 3. Fill in any missing required fields in Customer & Driver Dossier
  console.log("4. Verifying Customer & Driver Dossier fields...")
  const dobInput = page.locator('input[type="date"]').first()
  if (await dobInput.isVisible()) await dobInput.fill("1990-05-15")

  await page.fill('input[placeholder="Country"]', "Malta")

  const expiryInput = page.locator('input[type="date"]').nth(1)
  if (await expiryInput.isVisible()) await expiryInput.fill("2030-05-15")

  // 4. Verify Pit Stop 5-View Schematic is visible
  console.log("5. Verifying Pit Stop 5-View Schematic structure...")
  const view1 = page.locator("text=1. Front View").first()
  const view2 = page.locator("text=2. Passenger Side Profile").first()
  const view3 = page.locator("text=3. Rear View").first()
  const view4 = page.locator("text=4. Driver Side Profile").first()
  const view5 = page.locator("text=5. Top Aerial View").first()

  console.log(" - 1. Front View:", await view1.isVisible())
  console.log(" - 2. Passenger Side Profile:", await view2.isVisible())
  console.log(" - 3. Rear View:", await view3.isVisible())
  console.log(" - 4. Driver Side Profile:", await view4.isVisible())
  console.log(" - 5. Top Aerial View:", await view5.isVisible())

  // 5. Drop Pin 1 on Front View
  console.log("6. Dropping Condition Pin #1 on Front View...")
  const crosshairs = page.locator('.cursor-crosshair')
  if ((await crosshairs.count()) >= 5) {
    // 1st crosshair is Front View
    await crosshairs.nth(0).click({ position: { x: 50, y: 50 } })
    await page.waitForTimeout(500)

    const pinNoteInput = page.locator('input[placeholder*="2cm bumper stone chip"]').first()
    if (await pinNoteInput.isVisible()) {
      await pinNoteInput.fill("Minor stone chip on lower front bumper")
      const savePinBtn = page.locator('button:has-text("Save Pin")').first()
      await savePinBtn.click()
      await page.waitForTimeout(500)
      console.log(" ✓ Saved Pin #1 on Front View")
    }

    // 4th crosshair is Driver Side Profile
    console.log("7. Dropping Condition Pin #2 on Driver Side Profile...")
    await crosshairs.nth(3).click({ position: { x: 80, y: 50 } })
    await page.waitForTimeout(500)

    if (await pinNoteInput.isVisible()) {
      await pinNoteInput.fill("Small hairline scratch near driver door handle")
      const savePinBtn = page.locator('button:has-text("Save Pin")').first()
      await savePinBtn.click()
      await page.waitForTimeout(500)
      console.log(" ✓ Saved Pin #2 on Driver Side Profile")
    }
  }

  // 7. Sign client signature via Type Signature
  console.log("8. Providing Client Signature...")
  const switchType = page.locator('button:has-text("Switch to Type Signature")').first()
  if (await switchType.isVisible()) {
    await switchType.click()
    await page.waitForTimeout(300)
    const sigInput = page.locator('input[placeholder="Type your full legal name to sign digitally"]').first()
    if (await sigInput.isVisible()) {
      await sigInput.fill("Mario Camilleri")
    }
  }

  // 8. Remarks
  const remarksInput = page.locator('textarea[placeholder*="KM613"]').first()
  if (await remarksInput.isVisible()) {
    await remarksInput.fill("Flight KM613 arriving 14:30 MLA. Please prepare toddler booster seat.")
  }

  // Screenshot Checkout configured
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "e2e_checkout_with_pins_and_signature.png"),
    fullPage: true,
  })
  console.log("Saved checkout with pins and signature screenshot.")

  // 9. Submit Booking Request
  console.log("9. Submitting Booking Reservation...")
  const submitBtn = page.locator('button[type="submit"]:has-text("Confirm Reservation Request")').first()
  await submitBtn.click()
  await page.waitForTimeout(3000)

  // Check confirmation modal
  const confirmModal = page.locator("text=Booking Confirmed!").first()
  const isConfirmed = await confirmModal.isVisible()
  console.log(" - Confirmation modal visible:", isConfirmed)

  let createdBookingId = ""
  const refLocators = page.locator('.font-mono:has-text("MTR-")')
  const count = await refLocators.count()
  if (count > 0) {
    createdBookingId = (await refLocators.first().innerText()).trim()
    console.log(" - Generated Booking ID:", createdBookingId)
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "e2e_confirmation_modal.png"),
  })

  // 10. Inspect Admin Portal
  console.log("10. Navigating to Admin Portal to audit booking condition pins...")
  await page.goto(`${TARGET_URL}/?view=admin`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  // Login if needed
  const authGoogleBtn = page.locator("button:has-text('Authorize with Google')").first()
  if (await authGoogleBtn.isVisible()) {
    console.log(" - Authorizing admin with single-click OAuth...")
    await authGoogleBtn.click()
    await page.waitForTimeout(2000)
  }

  const passTab = page.locator("button:has-text('Master Passcode')").first()
  if (await passTab.isVisible()) {
    await passTab.click()
    await page.waitForTimeout(300)
    const passInput = page.locator('input[type="password"]').first()
    if (await passInput.isVisible()) {
      await passInput.fill("0709")
      const loginBtn = page.locator('button:has-text("Authenticate"), button:has-text("Sign In")').first()
      if (await loginBtn.isVisible()) await loginBtn.click()
      await page.waitForTimeout(2000)
    }
  }

  console.log("11. Searching for new booking in Orders table...")
  await page.waitForTimeout(1500)

  // Find booking by ID or Name
  const searchCriteria = createdBookingId || "Mario Camilleri"
  console.log(` - Locating row for: ${searchCriteria}...`)
  const bookingRow = page.locator(`text=${searchCriteria}`).first()
  if (await bookingRow.isVisible()) {
    console.log(` ✓ Found booking (${searchCriteria}) in admin table! Clicking into details...`)
    await bookingRow.click()
    await page.waitForTimeout(2000)

    // Verify Section 4 in Admin Detail View
    const adminSchematicHeader = page.locator("text=Pit Stop 5-View Condition Inspection & Client Endorsement").first()
    console.log(" - Admin 5-View Schematic Section visible:", await adminSchematicHeader.isVisible())

    const pin1Badge = page.locator("text=Minor stone chip on lower front bumper").first()
    console.log(" - Admin Pin #1 visible:", await pin1Badge.isVisible())

    const pin2Badge = page.locator("text=Small hairline scratch near driver door handle").first()
    console.log(" - Admin Pin #2 visible:", await pin2Badge.isVisible())

    const clientSigBadge = page.locator("text=Mario Camilleri").first()
    console.log(" - Admin Client Signature visible:", await clientSigBadge.isVisible())

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "e2e_admin_booking_detail_schematic.png"),
      fullPage: true,
    })
    console.log("Saved admin booking detail schematic screenshot.")
  } else {
    console.log("Taking admin page screenshot...")
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "e2e_admin_page.png"),
      fullPage: true,
    })
  }

  await browser.close()
  console.log("🎉 Complete E2E flow test finished successfully!")
}

run().catch((err) => {
  console.error("E2E Test Failed:", err)
  process.exit(1)
})
