import { test, expect } from "@playwright/test"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709"

test.describe("Auth Session Invalidation & Stale Token Recovery", () => {
  test("Stale or expired admin token is purged on init and user can re-authenticate", async ({
    page,
  }) => {
    // Inject a bad/expired token into localStorage before page load
    await page.addInitScript(() => {
      localStorage.setItem("motorly_admin_token", "invalid.jwt.signature.token")
      localStorage.setItem("motorly_current_view", "admin")
    })

    await page.goto("http://localhost:3000")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Verify stale token was automatically purged
    const tokenAfterInit = await page.evaluate(() =>
      localStorage.getItem("motorly_admin_token"),
    )
    expect(tokenAfterInit).toBeNull()

    // AuthView is rendered asking for passcode
    const passInput = page.locator("input[type='password']").first()
    await expect(passInput).toBeVisible({ timeout: 5000 })
    await passInput.fill(ADMIN_PASSWORD)

    const submitBtn = page.locator("button:has-text('Authorize & Launch Fleet Console')").first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })
    await submitBtn.click()

    // Verify Admin Portal loads showing Sync DB button and Active Bookings
    await expect(page.locator("button:has-text('Sync DB')").first()).toBeVisible({ timeout: 10000 })
    const validToken = await page.evaluate(() =>
      localStorage.getItem("motorly_admin_token"),
    )
    expect(validToken).toBeTruthy()
    expect(validToken).not.toBe("invalid.jwt.signature.token")
  })

  test("Mobile viewport (375px iPhone SE) does not suffer from horizontal body scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("http://localhost:3000")

    await page.waitForTimeout(1000)

    const bodyOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth,
      }
    })
    expect(bodyOverflow.scrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 1)
  })
})
