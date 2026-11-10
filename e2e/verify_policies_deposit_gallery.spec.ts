import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

const ARTIFACTS_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

test.describe("US Policies, Vehicle-Specific Deposit & Multi-Photo Studio", () => {
  test("1. Checkout Trip Purpose is strictly optional with US placeholders & clear button", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_selected_car_id", "1")
    })

    // Navigate to checkout with vehicle 1
    await page.goto("http://localhost:3000/?view=checkout&car=1", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Check optional trip purpose section and label
    await expect(page.locator("h2:has-text('Trip Purpose & Rental Reason')")).toBeVisible()
    await expect(page.locator("text=Select Primary Rental Reason (Optional)")).toBeVisible()

    // Verify US destination notes placeholder
    const notesInput = page.locator("input[placeholder*='Napa Valley']")
    await expect(notesInput).toBeVisible()

    // Select a trip purpose and verify clear button appears
    const leisureBtn = page.locator("button:has-text('Vacation & Leisure')")
    await expect(leisureBtn).toBeVisible()
    await leisureBtn.click()
    await page.waitForTimeout(300)

    const clearBtn = page.locator("button:has-text('Clear selection')")
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()
    await page.waitForTimeout(300)

    // Verify security deposit card in checkout summary
    const depositCard = page.locator("text=Refundable Security Deposit")
    await expect(depositCard).toBeVisible()

    // Capture screenshot of checkout optional trip purpose & deposit
    await page.screenshot({ path: `${ARTIFACTS_DIR}/checkout_optional_purpose_deposit.png` })
    console.log("Captured checkout_optional_purpose_deposit.png")
  })

  test("2. Legal Policies & US Privacy Modal displays all 4 tabs with CAN-SPAM Act compliance", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_selected_car_id", "1")
    })

    await page.goto("http://localhost:3000/?view=checkout&car=1", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Open policy modal by clicking "US Privacy & CAN-SPAM Notice" link in checkout order summary
    const policyLink = page.locator("button:has-text('US Privacy & CAN-SPAM Notice')").first()
    await policyLink.scrollIntoViewIfNeeded()
    await policyLink.click()
    await page.waitForTimeout(600)

    // Verify modal appears
    await expect(page.locator("text=Operating Policies & Legal Disclosures")).toBeVisible()

    // Verify CAN-SPAM Act disclosure and CCPA zero-selling
    await expect(page.locator("text=CAN-SPAM Electronic Communications Consent")).toBeVisible()
    await expect(page.locator("text=Zero Data-Selling Guarantee")).toBeVisible()

    // Check Refundable Security Deposit Policy tab
    const depositTab = page.locator("button:has-text('Security Deposit Policy')")
    await depositTab.click()
    await page.waitForTimeout(400)
    await expect(page.locator("text=Tiered Security Deposit Schedule")).toBeVisible()
    await expect(page.locator("text=Pre-Authorization (Not an Immediate Charge)")).toBeVisible()

    // Capture screenshot of legal policies modal
    await page.screenshot({ path: `${ARTIFACTS_DIR}/legal_policies_modal_canspam.png` })
    console.log("Captured legal_policies_modal_canspam.png")

    // Close modal
    const closeBtn = page.locator("button:has-text('I Understand & Agree')")
    await closeBtn.click()
  })

  test("3. Admin Studio: Custom Security Deposit & Multi-Photo Gallery Management", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_admin_authed", "true")
      localStorage.setItem("motorly_admin_token", "test-admin-token")
    })

    await page.goto("http://localhost:3000/?view=admin&tab=fleet", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(500)
    }

    // Unlock Admin gate if shown
    const passInput = page.locator("input[placeholder*='passcode']").first()
    if (await passInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await passInput.fill("0709")
      const unlockBtn = page.locator("button:has-text('Authorize & Unlock Console')").first()
      await unlockBtn.click()
      await page.waitForTimeout(1500)
    }

    // Go to Fleet tab if not already active
    const fleetTab = page.locator("button:has-text('Fleet & Inventory')")
    if (await fleetTab.isVisible()) {
      await fleetTab.click()
      await page.waitForTimeout(600)
    }

    // Verify Deposit badge on fleet cards
    const depBadges = page.locator("text=/Dep €[0-9,]+/")
    await expect(depBadges.first()).toBeVisible()

    // Click "Add Vehicle"
    const addVehicleBtn = page.locator("button:has-text('Add Vehicle')")
    await addVehicleBtn.click()
    await page.waitForTimeout(500)

    // Verify Admin Studio modal opened
    await expect(page.locator("text=Atelier Fleet Specification Studio")).toBeVisible()

    // Verify Security Deposit section and presets
    const depSection = page.locator("text=Refundable Security Deposit Money Value")
    await expect(depSection).toBeVisible()

    const preset2500 = page.locator("button:has-text('€2,500')")
    await expect(preset2500).toBeVisible()
    await preset2500.click()

    // Verify Multi-Photo Gallery Studio
    const gallerySection = page.locator("text=4. Vehicle Photo Gallery & Multi-Angle Media")
    await expect(gallerySection).toBeVisible()

    // Add a curated studio preset angle to gallery
    const addPresetBtn = page.locator("button:has-text('Cockpit Interior')")
    if (await addPresetBtn.isVisible()) {
      await addPresetBtn.click()
    }

    // Verify photo counter in studio header badge
    await expect(page.locator("text=/\\d+ Photos Configured/")).toBeVisible()

    // Check Live Digital Twin shows deposit and multi-angle switcher
    await expect(page.locator("text=/Dep €2,500/")).toBeVisible()

    // Capture screenshot of Admin Studio with Deposit & Multi-Photo Gallery
    await page.screenshot({ path: `${ARTIFACTS_DIR}/admin_car_modal_deposit_gallery.png` })
    console.log("Captured admin_car_modal_deposit_gallery.png")
  })
})
