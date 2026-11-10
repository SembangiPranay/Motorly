import { test, expect } from "@playwright/test"

test.use({ channel: "msedge" })

test("verify and capture live production booking details redirect", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  console.log("Navigating to production Admin Orders & Dispatch...")
  await page.goto("https://motorly-ten.vercel.app/?view=admin&tab=manifest", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)

  // Skip intro if visible
  const skipBtn = page.locator("button:has-text('Skip Intro')")
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click()
    await page.waitForTimeout(1000)
  }

  // If AdminLoginGate is present, enter passcode 0709
  const passInput = page.locator("input[placeholder*='passcode']").first()
  if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("Entering admin passcode 0709 on production...")
    await passInput.fill("0709")
    const unlockBtn = page.locator("button:has-text('Authorize & Unlock Console')").first()
    await unlockBtn.click()
    await page.waitForTimeout(2500)
  }

  // Find Details button in table
  const detailsButtons = page.locator("button:has-text('Details')")
  const count = await detailsButtons.count()
  console.log(`Live production has ${count} Details buttons.`)

  if (count > 0) {
    // Capture production orders table
    await page.screenshot({
      path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_admin_orders_table.png",
      fullPage: false,
    })
    console.log("Captured prod_admin_orders_table.png")

    // Click Details button
    await detailsButtons.first().click()
    await page.waitForTimeout(1500)

    // Verify redirected URL contains bookingId
    console.log("Production URL after Details click:", page.url())
    expect(page.url()).toContain("bookingId=")

    // Verify header and sections
    await expect(page.locator("button:has-text('Back to Orders & Dispatch')").first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Client & Verified Driver Dossier").first()).toBeVisible()
    await expect(page.locator("text=Pricing & VAT Architecture").first()).toBeVisible()

    // Capture production booking detail view!
    await page.screenshot({
      path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/prod_admin_booking_detail_page.png",
      fullPage: false,
    })
    console.log("Captured prod_admin_booking_detail_page.png")
  }
})
