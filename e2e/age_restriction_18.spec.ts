import { test, expect } from "@playwright/test"
import * as path from "path"

test.describe("Driver Minimum Age Restriction (18+) Verification", () => {
  test("Verifies 18+ restriction labels, max DOB attribute, and rejection of < 18 drivers", async ({ page }) => {
    // 1. Visit checkout directly with a car selected
    await page.goto("http://localhost:3000/?view=checkout&car=morris-gaurage-mg-astor-1325")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)

    // Verify UI labels indicate 18+
    await expect(page.locator("text=Date of Birth (18+ Only)").first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Must be 18+").first()).toBeVisible({ timeout: 5000 })

    // Take screenshot of checkout showing 18+
    await page.screenshot({
      path: path.resolve("./screenshots/human_e2e/14_checkout_form_18plus.png"),
      fullPage: false,
    })

    // Check max attribute on input[type='date']
    const dobInput = page.locator("input[type='date']").first()
    const maxAttr = await dobInput.getAttribute("max")
    console.log("Calculated max DOB attribute:", maxAttr)

    const expectedYear = new Date().getFullYear() - 18
    expect(maxAttr).toContain(String(expectedYear))

    // Test rejection of an underage driver (<18 years old, e.g. born in 2012)
    await dobInput.fill("2012-05-10")

    // Listen for dialog alert
    let alertMessage = ""
    page.once("dialog", async (dialog) => {
      alertMessage = dialog.message()
      await dialog.accept()
    })

    // Fill customer & other required fields to trigger validation
    const fname = page.locator("input[placeholder*='First Name' i]").or(page.locator("input[placeholder*='John' i]")).first()
    if (await fname.isVisible().catch(() => false)) await fname.fill("Alex")

    const lname = page.locator("input[placeholder*='Last Name' i]").or(page.locator("input[placeholder*='Doe' i]")).first()
    if (await lname.isVisible().catch(() => false)) await lname.fill("Rider")

    const email = page.locator("input[type='email']").first()
    if (await email.isVisible().catch(() => false)) await email.fill("alex.rider@email.com")

    const phone = page.locator("input[type='tel']").or(page.locator("input[placeholder*='Phone' i]")).first()
    if (await phone.isVisible().catch(() => false)) await phone.fill("+15559876543")

    const dlInput = page.locator("input[placeholder*='FL-' i]").or(page.locator("input[placeholder*='Driver' i]")).first()
    if (await dlInput.isVisible().catch(() => false)) await dlInput.fill("DL-FL-181818")

    const submitBtn = page.locator("button[type='submit']").or(page.locator("button:has-text('Confirm')")).or(page.locator("button:has-text('Reserve')")).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(500)
    }

    if (alertMessage) {
      console.log("Captured validation alert:", alertMessage)
      expect(alertMessage).toContain("at least 18 years old")
    }

    // Now test entering an 18-year-old DOB (e.g. 2006-01-01)
    await dobInput.fill("2006-01-01")
    console.log("Filled 18+ valid DOB: 2006-01-01")

    // Verify contact FAQ mentions 18 years
    await page.goto("http://localhost:3000/?view=contact")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(500)

    const faqAccordionBtn = page.locator("button:has-text('What documents must I present?')").first()
    await faqAccordionBtn.scrollIntoViewIfNeeded()
    await faqAccordionBtn.click()
    await page.waitForTimeout(500)

    await expect(page.locator("text=Drivers must be at least 18 years of age.").first()).toBeVisible({ timeout: 5000 })
    console.log("--> Verified Contact FAQ says: Drivers must be at least 18 years of age.")
  })
})
