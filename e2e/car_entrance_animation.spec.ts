import { test, expect } from "@playwright/test"

test.describe("Cinematic welcome", () => {
  const welcome = "Pit Stop Car Hire cinematic welcome"

  test("shows the welcome video and returns to the storefront when skipped", async ({ page }) => {
    await page.goto("/?intro=1", { waitUntil: "domcontentloaded" })
    const intro = page.getByRole("banner", { name: welcome })
    await expect(intro.locator("video")).toHaveAttribute("src", "/videos/motorly-entrance.mp4")
    await intro.getByRole("button", { name: "Skip" }).click()
    await expect(intro).toHaveCount(0)
    await expect(page.getByRole("heading", { name: /New Luxury Mobility/i })).toBeVisible()
  })

  test("replays the welcome from the footer", async ({ page }) => {
    await page.goto("/?intro=0", { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: /Replay Intro/ }).click()
    await expect(page.getByRole("banner", { name: welcome })).toBeVisible()
  })
})
