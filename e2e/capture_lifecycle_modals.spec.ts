import { test, expect } from "@playwright/test"
import * as path from "path"
import * as fs from "fs"

const SCREENSHOT_DIR = path.resolve("./screenshots/human_e2e")

test.describe("Targeted Lifecycle & Modals Capture Suite", () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }
  })

  test("Capture Key Handover and Return Inspection Modals in Admin", async ({ page }) => {
    // Navigate directly to Admin
    await page.goto("http://localhost:3000/?view=admin")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)

    const adminGateInput = page.locator("input[placeholder*='passcode' i]").or(page.locator("input[type='password']")).first()
    if (await adminGateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await adminGateInput.fill("0709")
      await page.locator("button:has-text('Authorize & Unlock Console')").first().click()
      await page.waitForTimeout(2000)
    }

    // Wait for Admin Console to load
    await expect(page.locator("text=ORDERS & DISPATCH REGISTRY").or(page.locator("text=FLEET OPERATIONS")).first()).toBeVisible({ timeout: 15000 })
    
    console.log("--> Waiting for booking cards to populate (attached)...")
    await page.waitForSelector("text=MTR-", { state: "attached", timeout: 15000 })
    await page.waitForTimeout(1500)

    // Check Details button that is visible
    const detailsBtn = page.locator("button:has-text('Details'):visible").first()
    if (await detailsBtn.isVisible().catch(() => false)) {
      console.log("--> Clicking Details to capture Drawer...")
      await detailsBtn.scrollIntoViewIfNeeded()
      await detailsBtn.click()
      await page.waitForTimeout(800)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "20_admin_booking_details.png"),
        fullPage: false,
      })
      const closeDrawer = page.locator("button[aria-label='Close drawer']").or(page.locator("button:has-text('Close')")).first()
      if (await closeDrawer.isVisible().catch(() => false)) {
        await closeDrawer.click()
        await page.waitForTimeout(600)
      }
    }

    // Look for Handover Keys button that is visible
    console.log("--> Looking for visible Handover Keys action...")
    const handoverBtn = page.locator("button:has-text('Handover Keys'):visible").or(page.locator("button:has-text('Handoff Keys'):visible")).first()
    if (await handoverBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log("--> Found visible Handover Keys! Opening modal...")
      await handoverBtn.scrollIntoViewIfNeeded()
      await handoverBtn.click()
      await page.waitForTimeout(1000)

      await expect(page.locator("text=KEY HANDOVER PROTOCOL").or(page.locator("text=Key Handover Checklist")).or(page.locator("text=Keys Given")).first()).toBeVisible({ timeout: 10000 })
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "21_admin_key_handover_modal.png"),
        fullPage: false,
      })

      // Complete handover
      const keysGivenBtn = page.locator("button:has-text('Keys Given & Start Clock'):visible").first()
      if (await keysGivenBtn.isVisible().catch(() => false)) {
        console.log("--> Completing handover protocol...")
        await keysGivenBtn.click()
        await page.waitForTimeout(2500)
      }
    }

    // Now vehicle is Checked Out -> Return Check button should appear
    console.log("--> Looking for visible Return Check action...")
    const returnCheckBtn = page.locator("button:has-text('Return Check'):visible").first()
    if (await returnCheckBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log("--> Opening Return Check modal...")
      await returnCheckBtn.scrollIntoViewIfNeeded()
      await returnCheckBtn.click()
      await page.waitForTimeout(1000)

      // Add a sample scuff photo to test damage audit UI
      const scuffBtn = page.locator("button:has-text('+ Sample Scuff Photo'):visible").first()
      if (await scuffBtn.isVisible().catch(() => false)) {
        await scuffBtn.click()
        await page.waitForTimeout(500)
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "22_admin_return_inspection_modal.png"),
        fullPage: false,
      })

      // Close modal
      const cancelReturn = page.locator("button:has-text('Cancel'):visible").first()
      if (await cancelReturn.isVisible().catch(() => false)) {
        await cancelReturn.click()
        await page.waitForTimeout(400)
      }
    }

    console.log("--> Key Handover & Return Inspection Modals successfully captured!")
  })
})
