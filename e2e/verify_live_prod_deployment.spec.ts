import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

const ARTIFACTS_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"
const PROD_URL = "https://motorly-ten.vercel.app"

test.describe("Live Production Deployment Verification", () => {
  test("1. Production Checkout: Optional Trip Purpose, US Placeholders & Refundable Security Deposit", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_selected_car_id", "1")
    })

    console.log("Navigating to production checkout:", `${PROD_URL}/?view=checkout&car=1`)
    await page.goto(`${PROD_URL}/?view=checkout&car=1`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Verify Optional Trip Purpose heading & label
    await expect(page.locator("h2:has-text('Trip Purpose & Rental Reason')")).toBeVisible()
    await expect(page.locator("text=Select Primary Rental Reason (Optional)")).toBeVisible()

    // Verify US destination notes placeholder
    const notesInput = page.locator("input[placeholder*='Napa Valley']")
    await expect(notesInput).toBeVisible()

    // Verify security deposit card in checkout summary
    const depositCard = page.locator("text=Refundable Security Deposit")
    await expect(depositCard).toBeVisible()

    // Capture live production checkout screenshot
    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_checkout_deposit.png` })
    console.log("Captured live_prod_checkout_deposit.png")
  })

  test("2. Production Legal Suite: CAN-SPAM Act, US Privacy & Deposit Policies Modal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_selected_car_id", "1")
    })

    await page.goto(`${PROD_URL}/?view=checkout&car=1`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Click "US Privacy & CAN-SPAM Notice" button in order summary
    const policyBtn = page.locator("button:has-text('US Privacy & CAN-SPAM Notice')").first()
    await policyBtn.scrollIntoViewIfNeeded()
    await policyBtn.click()
    await page.waitForTimeout(800)

    // Verify modal appeared with title
    await expect(page.locator("text=Operating Policies & Legal Disclosures")).toBeVisible()

    // Verify CAN-SPAM electronic communications notice & zero data-selling guarantee
    await expect(page.locator("text=CAN-SPAM Electronic Communications Consent")).toBeVisible()
    await expect(page.locator("text=Zero Data-Selling Guarantee")).toBeVisible()

    // Switch to Security Deposit Policy tab
    const depositTab = page.locator("button:has-text('Security Deposit Policy')")
    await depositTab.click()
    await page.waitForTimeout(400)
    await expect(page.locator("text=Tiered Security Deposit Schedule")).toBeVisible()
    await expect(page.locator("text=Pre-Authorization (Not an Immediate Charge)")).toBeVisible()

    // Capture live production modal screenshot
    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_legal_modal.png` })
    console.log("Captured live_prod_legal_modal.png")

    // Close modal
    const closeBtn = page.locator("button:has-text('I Understand & Agree')")
    await closeBtn.click()
  })

  test("3. Production Admin Console: Orders Dispatch, Vehicle Security Deposits & Studio Modal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_seen", "true")
      localStorage.setItem("motorly_admin_authed", "true")
      localStorage.setItem("motorly_admin_token", "test-admin-token")
    })

    console.log("Navigating to production Admin Console:", `${PROD_URL}/?view=admin&tab=manifest`)
    await page.goto(`${PROD_URL}/?view=admin&tab=manifest`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const skipBtn = page.locator("button:has-text('Skip Intro')")
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
      await page.waitForTimeout(600)
    }

    // Unlock Admin console if gate presented
    const passInput = page.locator("input[placeholder*='passcode']").first()
    if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passInput.fill("0709")
      const unlockBtn = page.locator("button:has-text('Authorize & Unlock Console')").first()
      await unlockBtn.click()
      await page.waitForTimeout(2000)
    }

    // Verify Orders table
    await expect(page.locator("text=Orders & Dispatch")).toBeVisible()

    // Switch to Fleet tab
    const fleetTab = page.locator("button:has-text('Fleet & Inventory')")
    await fleetTab.click()
    await page.waitForTimeout(1000)

    // Verify vehicle security deposit badges on fleet cards
    const depBadges = page.locator("text=/Dep €[0-9,]+/")
    await expect(depBadges.first()).toBeVisible()

    // Open Admin Add Vehicle modal
    const addVehicleBtn = page.locator("button:has-text('Add Vehicle')")
    await addVehicleBtn.click()
    await page.waitForTimeout(800)

    // Verify Studio modal features
    await expect(page.locator("text=Atelier Fleet Specification Studio")).toBeVisible()
    await expect(page.locator("text=Refundable Security Deposit Money Value")).toBeVisible()
    await expect(page.locator("text=4. Vehicle Photo Gallery & Multi-Angle Media")).toBeVisible()

    // Select preset deposit €2,500
    const preset2500 = page.locator("button:has-text('€2,500')")
    await preset2500.click()
    await expect(page.locator("text=/Dep €2,500/")).toBeVisible()

    // Capture live production admin studio screenshot
    await page.screenshot({ path: `${ARTIFACTS_DIR}/live_prod_admin_studio.png` })
    console.log("Captured live_prod_admin_studio.png")
  })
})
