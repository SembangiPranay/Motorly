import { test } from "@playwright/test"

test.use({ channel: "msedge" })

test("verify driver license and country inputs in registration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  console.log("Navigating to production...")
  await page.goto("https://motorly-ten.vercel.app", { waitUntil: "networkidle" })
  await page.waitForTimeout(2000)

  // Skip intro if visible
  const skipBtn = page.locator("button:has-text('Skip Intro')")
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click()
    await page.waitForTimeout(500)
  }

  // Click Sign In in navigation
  const signInBtn = page.locator("button:has-text('Sign In'), a:has-text('Sign In')").first()
  if (await signInBtn.isVisible()) {
    await signInBtn.click()
    await page.waitForTimeout(1000)
  }

  // Click Register tab
  const registerTab = page.locator("button:has-text('Register'), button:has-text('Create Account')").first()
  if (await registerTab.isVisible()) {
    await registerTab.click()
    await page.waitForTimeout(1000)
  }

  // Take screenshot of the form
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/updated_license_country_field.png",
    fullPage: false,
  })
  console.log("Captured updated_license_country_field.png")
})
