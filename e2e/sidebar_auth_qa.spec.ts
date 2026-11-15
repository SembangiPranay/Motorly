import { test, expect } from "@playwright/test"

test.describe("Professional QA End-to-End Test Suite: Clean Customer Navbar (No Sidebar), Admin Logo Expansion, Gmail Admin Auth & Zero Hardcoded Data", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss entrance animation to jump straight to interface
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_completed", "true")
      localStorage.setItem("motorly_current_view", "home")
    })
  })

  test("1. Customer Storefront: Full-width layout with top Navbar info and zero customer sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("http://localhost:3000")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Verify top navbar is visible with brand logo and navigation portals
    const header = page.locator("header").first()
    await expect(header).toBeVisible()
    await expect(header.locator("text=Pit Stop").first()).toBeVisible()
    await expect(header.locator("button:has-text('Home')").first()).toBeVisible()
    await expect(header.locator("button:has-text('Fleet & Cars')").first()).toBeVisible()
    await expect(header.locator("button:has-text('Compare')").first()).toBeVisible()
    await expect(header.locator("button:has-text('My Trips')").first()).toBeVisible()
    await expect(header.locator("button:has-text('Sign In')").first()).toBeVisible()

    // Verify Customer Sidebar is completely removed from the page
    const customerSidebar = page.locator("aside:has-text('Portals')")
    await expect(customerSidebar).toHaveCount(0)

    // Verify main content is full-width (no leftover pl-60 or pl-16 margin)
    const mainWrapper = page.locator("div.w-full.max-w-full.min-h-screen").first()
    const classList = (await mainWrapper.getAttribute("class")) || ""
    expect(classList).not.toContain("lg:pl-60")
    expect(classList).not.toContain("lg:pl-16")
  })

  test("2. Admin Gmail Authentication: Proper Google/Gmail login verifies and unlocks console", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.addInitScript(() => {
      localStorage.removeItem("motorly_admin_token")
      localStorage.removeItem("motorly_admin_user")
    })

    await page.goto("http://localhost:3000/?view=admin")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Verify Admin Login Gate is displayed with Google Auth
    const googleAuthBtn = page.locator("button:has-text('Authorize with Google')")
    await expect(googleAuthBtn).toBeVisible()

    // Test unauthorized email first
    const emailInput = page.locator("input[type='email']")
    await emailInput.fill("intruder.unauthorized@gmail.com")
    await googleAuthBtn.click()

    // Verify rejection message
    const errorBanner = page.locator("div.animate-shake")
    await expect(errorBanner).toBeVisible({ timeout: 5000 })
    await expect(errorBanner).toContainText("Access denied")

    // Now test authorized admin Gmail
    await emailInput.fill("nanikoushik96@gmail.com")
    await googleAuthBtn.click()

    // Verify successful authentication and unlock of Admin Console
    await expect(page.locator("text=Fleet Operations Admin").or(page.locator("text=Studio Director"))).toBeVisible({
      timeout: 10000,
    })

    const token = await page.evaluate(() => localStorage.getItem("motorly_admin_token"))
    expect(token).toBeTruthy()

    // Verify Admin Sidebar: Tapping Motorly logo expands when collapsed
    const adminSidebar = page.locator("aside").first()
    await expect(adminSidebar).toBeVisible()

    const adminCollapseBtn = adminSidebar.locator("button[title='Collapse Sidebar']")
    if (await adminCollapseBtn.isVisible()) {
      await adminCollapseBtn.click()
      await page.waitForTimeout(400)
    }

    let adminClasses = await adminSidebar.getAttribute("class")
    expect(adminClasses).toContain("w-16")

    const adminLogo = adminSidebar.locator("button[aria-label='Expand sidebar']").first()
    await expect(adminLogo).toBeVisible()
    await adminLogo.click()
    await page.waitForTimeout(400)

    adminClasses = await adminSidebar.getAttribute("class")
    expect(adminClasses).not.toContain("w-16")
  })

  test("3. Zero Hardcoded User Data: No demo user chips in Customer Sign-In or Reservations", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("http://localhost:3000")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Open Sign-In modal in Header
    const signInBtn = page.locator("header button:has-text('Sign In')").first()
    if (await signInBtn.isVisible()) {
      await signInBtn.click()
      await page.waitForTimeout(500)

      // Ensure NO demo autofill chips exist
      await expect(page.locator("text=1-Click Demo Logins:")).toHaveCount(0)
      await expect(page.locator("text=john.doe@email.com")).toHaveCount(0)
      await expect(page.locator("text=david.c@techventure.io")).toHaveCount(0)
      await expect(page.locator("text=sarah.m@vipclient.com")).toHaveCount(0)

      await page.keyboard.press("Escape")
      await page.waitForTimeout(300)
    }

    // Navigate to My Reservations
    await page.goto("http://localhost:3000/?view=my-bookings")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Verify NO Demo Quick-Fill Accounts card exists
    await expect(page.locator("text=Demo Quick-Fill Accounts:")).toHaveCount(0)
    await expect(page.locator("text=test@gmail.com (MTR-852655 Completed Trip)")).toHaveCount(0)
    await expect(page.locator("text=John Doe (Active Sedan)")).toHaveCount(0)
  })
})
