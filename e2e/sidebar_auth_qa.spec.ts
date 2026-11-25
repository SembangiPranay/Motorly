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

  test("2. Admin rejects email-only authentication and allows passcode sign-in", async ({ page, request }) => {
    const response = await request.post("/api/auth/google-admin-login", {
      data: { email: "qa@example.org" },
    })
    expect([400, 503]).toContain(response.status())
    expect((await response.json()).token).toBeUndefined()

    await page.goto("/?view=admin")
    await page.getByPlaceholder("Enter administrator passcode").fill(process.env.ADMIN_PASSWORD || "0709")
    await page.getByRole("button", { name: "Authorize & Unlock Console" }).click()
    await expect(page.getByRole("button", { name: /Orders & Dispatch/ })).toBeVisible()

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
