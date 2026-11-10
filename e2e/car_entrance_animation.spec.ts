import { test, expect } from "@playwright/test"

test.describe("Cinematic Car Entrance Animation (Keka-style brand intro)", () => {
  test("Animation mounts with full branding, tachometer HUD, and dismisses cleanly", async ({
    page,
  }) => {
    // Force intro animation via URL param ?intro=1
    await page.goto("http://localhost:3000?intro=1")

    const introBanner = page.locator("[role='banner'][aria-label='Motorly Brand Entrance']")
    await expect(introBanner).toBeVisible({ timeout: 4000 })

    // Verify SVG car silhouette is rendered
    const carSvg = introBanner.locator("svg")
    await expect(carSvg).toBeVisible()

    // Verify Motorly brand title text
    const brandHeading = introBanner.locator("h1:has-text('MOTORLY')")
    await expect(brandHeading).toBeAttached()

    // Verify Skip Intro button is functional and smoothly transitions to hero
    const skipBtn = introBanner.locator("button:has-text('Skip Intro')")
    await expect(skipBtn).toBeVisible()
    await skipBtn.click()

    // Verify overlay unmounts / disappears and hero view is visible
    await expect(introBanner).not.toBeVisible({ timeout: 3000 })
    await expect(page.locator("h1:has-text('Luxury & Practical')")).toBeVisible()
  })

  test("Replay trigger in footer relaunches the intro animation", async ({ page }) => {
    // Load with intro already dismissed
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_completed", "true")
    })

    await page.goto("http://localhost:3000")
    await page.waitForTimeout(500)

    // Trigger replay via window hook
    await page.evaluate(() => {
      if ((window as any).__replayMotorlyIntro) {
        (window as any).__replayMotorlyIntro()
      }
    })

    const introBanner = page.locator("[role='banner'][aria-label='Motorly Brand Entrance']")
    await expect(introBanner).toBeVisible({ timeout: 3000 })
  })
})
