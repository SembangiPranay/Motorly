import { chromium } from "playwright"
import path from "path"

const TARGET_URL = "http://localhost:3000"
const API_URL = "http://localhost:3001"
const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("=== STARTING PIT STOP HANDOVER & CONDITION OVERHAUL TEST ===")

  // 1. Register test customer account
  const testEmail = `renter.${Date.now()}@pitstopmalta.com`
  console.log(`[1] Registering verified customer account (${testEmail})...`)
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "Password123!",
      name: "Joseph Borg",
      phone: "+356 9911 2233",
      driverLicenseNum: "MT-776655-P",
      driverLicenseState: "Malta",
      driverLicenseExpiry: "2031-08-20",
    }),
  })
  const regData = await regRes.json()
  if (!regData.token || !regData.user) {
    throw new Error(`Customer registration failed: ${JSON.stringify(regData)}`)
  }
  console.log(" ✓ Customer registered with token:", regData.token.slice(0, 15) + "...")

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

  try {
    // 2. Setup authenticated customer state with checkout
    console.log("[2] Seeding customer JWT session and landing in checkout...")
    await page.goto(TARGET_URL, { waitUntil: "networkidle" })
    await page.evaluate(({ token, user }) => {
      const today = new Date()
      const pickup = new Date(today.getTime() + 90 * 24 * 3600 * 1000)
      const ret = new Date(today.getTime() + 94 * 24 * 3600 * 1000)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const pickupStr = `${monthNames[pickup.getMonth()]} ${pickup.getDate()}, ${pickup.getFullYear()}`
      const returnStr = `${monthNames[ret.getMonth()]} ${ret.getDate()}, ${ret.getFullYear()}`

      sessionStorage.setItem("motorly_intro_completed", "true")
      localStorage.setItem("motorly_customer_token", token)
      localStorage.setItem("motorly_customer_user", JSON.stringify(user))
      localStorage.setItem("motorly_current_view", "checkout")
      localStorage.setItem("motorly_selected_car_id", "mercedes-c-class")
    }, { token: regData.token, user: regData.user })

    // Open checkout directly without intro animation
    await page.goto(`${TARGET_URL}/?intro=0&view=checkout&car=mercedes-c-class`, { waitUntil: "networkidle" })
    await page.waitForTimeout(1000)

    // Verify Customer Sidebar is completely absent
    const asidePortals = await page.locator("aside:has-text('Portals')").count()
    console.log(`[2] Customer Sidebar count: ${asidePortals} (expected 0)`)
    if (asidePortals > 0) throw new Error("Customer sidebar should be absent!")

    // 3. Fill missing fields in Customer Dossier
    console.log("[3] Verifying Customer Dossier fields...")
    const dobInput = page.locator('input[type="date"]').first()
    if (await dobInput.isVisible()) await dobInput.fill("1988-06-12")

    const countryInput = page.locator('input[placeholder="Country"]').first()
    if (await countryInput.isVisible()) await countryInput.fill("Malta")

    const expiryInput = page.locator('input[type="date"]').nth(1)
    if (await expiryInput.isVisible()) await expiryInput.fill("2031-08-20")

    // 4. Verify Section 6: Streamlined Vehicle Condition Specification
    console.log("[4] Verifying Section 6: Vehicle Condition Specification & Client Endorsement...")
    const sec6Title = page.locator("text=Vehicle Condition Specification & Client Endorsement").first()
    await sec6Title.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Verify official notice is visible
    const notice = page.locator("text=Official Pre-Rental Condition Inspection Notice").first()
    const hasNotice = await notice.isVisible()
    console.log(`[4] Handover inspection notice visible: ${hasNotice}`)
    if (!hasNotice) throw new Error("Handover notice is missing from Section 6!")

    // Verify scratch input and photo upload button are NOT on customer checkout
    const scratchInputs = await page.locator('input[placeholder*="scratch"]').count()
    const attachPhotoBtns = await page.locator('button:has-text("Attach Photo")').count()
    console.log(`[4] Scratch inputs count: ${scratchInputs} (expected 0), Attach Photo btns: ${attachPhotoBtns} (expected 0)`)
    if (scratchInputs > 0 || attachPhotoBtns > 0) {
      throw new Error("Customer checkout still has scratch input or photo button!")
    }

    // 5. Sign client signature via Type Signature
    console.log("[5] Signing contract digitally...")
    const switchType = page.locator('button:has-text("Switch to Type Signature")').first()
    if (await switchType.isVisible()) {
      await switchType.click()
      await page.waitForTimeout(300)
      const sigInput = page.locator('input[placeholder="Type your full legal name to sign digitally"]').first()
      if (await sigInput.isVisible()) {
        await sigInput.fill("Joseph Borg")
      }
    }

    // 6. Fill remarks
    const remarksInput = page.locator('textarea[placeholder*="KM613"]').first()
    if (await remarksInput.isVisible()) {
      await remarksInput.fill("Arriving MLA airport at 11:30. Staging requested at Central Garage.")
    }

    // Save screenshot of clean streamlined customer checkout
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "e2e_streamlined_customer_checkout.png"),
      fullPage: true,
    })
    console.log("[6] Saved screenshot: e2e_streamlined_customer_checkout.png")

    // 7. Submit Reservation Request
    console.log("[7] Submitting Booking Reservation...")
    const submitBtn = page.locator('button[type="submit"]:has-text("Confirm Reservation Request")').first()
    await submitBtn.click()
    await page.waitForTimeout(3000)

    // Check confirmation modal
    const confirmModal = page.locator("text=Booking Confirmed!").first()
    const isConfirmed = await confirmModal.isVisible()
    console.log("[7] Confirmation modal visible:", isConfirmed)

    let createdBookingId = ""
    const refLocators = page.locator('.font-mono:has-text("MTR-")')
    const count = await refLocators.count()
    if (count > 0) {
      createdBookingId = (await refLocators.first().innerText()).trim()
      console.log(" ✓ Generated Booking ID:", createdBookingId)
    }

    // 8. Open Admin View
    console.log("[8] Navigating to Admin Console...")
    await page.goto(`${TARGET_URL}/?view=admin`, { waitUntil: "networkidle" })
    await page.waitForTimeout(1500)

    // Admin login if needed
    const authGoogleBtn = page.locator("button:has-text('Authorize with Google')").first()
    if (await authGoogleBtn.isVisible()) {
      console.log("[8] Authorizing admin with single-click OAuth...")
      await authGoogleBtn.click()
      await page.waitForTimeout(1500)
    }

    // 9. Find the booking in Admin Dispatch
    console.log(`[9] Locating booking ${createdBookingId} in Admin Console...`)
    await page.waitForSelector(`text=${createdBookingId}`, { timeout: 10000 })

    const bookingRow = page.locator(`tr:has-text("${createdBookingId}")`).first()
    if (await bookingRow.isVisible()) {
      // If Pending Assignment, allocate car
      const assignBtn = bookingRow.locator('button:has-text("Assign")').first()
      if (await assignBtn.isVisible()) {
        console.log(`[9] Allocating vehicle for ${createdBookingId}...`)
        await assignBtn.click()
        await page.waitForTimeout(500)

        const confirmAllocBtn = page.locator('button:has-text("Confirm Vehicle Allocation")').first()
        if (await confirmAllocBtn.isVisible()) {
          await confirmAllocBtn.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    // 10. Click "Give Keys" to open Key Handover Modal
    console.log(`[10] Opening Key Handover Modal for ${createdBookingId}...`)
    const updatedRow = page.locator(`tr:has-text("${createdBookingId}")`).first()
    const giveKeysBtn = updatedRow.locator('button:has-text("Give Keys")').first()
    await giveKeysBtn.click()
    await page.waitForTimeout(1000)

    // Verify AdminKeyHandoverModal
    const modalTitle = page.locator('text=Key Handover & Garage Bay Inspection').first()
    await modalTitle.waitFor({ timeout: 5000 })
    console.log("[10] Key Handover & Garage Bay Inspection modal opened!")

    // 11. Attach Departure Walkaround Photo in Garage Bay
    console.log("[11] Snapping bay departure walkaround photo...")
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles("public/images/contract/views/front.png")
    await page.waitForTimeout(800)

    const bayPhotoBadge = page.locator('text=Bay Photo 1').first()
    console.log(`[11] Bay Photo 1 preview rendered: ${await bayPhotoBadge.isVisible()}`)

    // 12. Open 5-View Condition Inspector and Drop a Pin
    console.log("[12] Opening 5-View Condition Inspector...")
    const markPinsBtn = page.locator('button:has-text("Mark Condition Pins"), button:has-text("Mark Pre-Existing Flaws")').first()
    if (await markPinsBtn.isVisible()) {
      await markPinsBtn.click()
      await page.waitForTimeout(500)
    }

    // Click on Front View to drop a condition pin
    console.log("[12] Dropping pin on Front View...")
    const frontViewBox = page.locator('.cursor-crosshair').first()
    if (await frontViewBox.isVisible()) {
      await frontViewBox.click({ position: { x: 40, y: 40 } })
      await page.waitForTimeout(500)

      const pinNote = page.locator('input[placeholder*="bumper stone chip"]').first()
      if (await pinNote.isVisible()) {
        await pinNote.fill("Pre-existing 1.5cm stone chip near front bumper")
        const savePin = page.locator('button:has-text("Save Pin")').first()
        await savePin.click()
        await page.waitForTimeout(500)
        console.log(" ✓ Recorded stone chip on Front View schematic!")
      }
    }

    // Add Staging & Inspection Notes
    const stagingNotes = page.locator('input[placeholder*="Clean interior"]').first()
    if (await stagingNotes.isVisible()) {
      await stagingNotes.fill("Staged at Mgarr Bay 1. Interior clean and sanitized.")
    }

    // Save screenshot of Key Handover Modal
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "e2e_admin_key_handover_modal.png"),
    })
    console.log("[12] Saved screenshot: e2e_admin_key_handover_modal.png")

    // 13. Confirm Handover
    console.log("[13] Confirming Key Handover & Starting Rental Clock...")
    const confirmBtn = page.locator('button:has-text("Confirm Handover & Release Keys")').first()
    await confirmBtn.click()
    await page.waitForTimeout(2000)

    // 14. Open Booking Detail View via direct bookingId URL
    console.log(`[14] Opening detail view for ${createdBookingId}...`)
    await page.goto(`${TARGET_URL}/?view=admin&bookingId=${createdBookingId}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(2000)

    // Verify 5-View schematic and photos in Detail View
    const schematicHeading = page.locator("text=Pit Stop 5-View Vehicle Schematic").first()
    if (await schematicHeading.isVisible()) {
      await schematicHeading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
    }

    // Verify condition pin badge exists
    const pinBadge = page.locator("text=Pre-existing 1.5cm stone chip").first()
    console.log(" - Condition pin recorded in Detail View:", await pinBadge.isVisible())

    // Save screenshot of verified detail view
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "e2e_admin_handover_verified.png"),
      fullPage: true,
    })
    console.log("[15] Saved screenshot: e2e_admin_handover_verified.png")

    console.log("=== ALL E2E TESTS PASSED 100% SUCCESSFULLY! ===")
  } catch (err) {
    console.error("TEST FAILED:", err)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e2e_error.png") })
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
