import { test, expect } from "@playwright/test"

test.describe("Professional QA End-to-End Test Suite: Sidebar Logo Expansion, Executive Theme, Gmail Admin Auth & Zero Hardcoded Data", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss entrance animation to jump straight to interface
    await page.addInitScript(() => {
      sessionStorage.setItem("motorly_intro_completed", "true")
      localStorage.setItem("motorly_current_view", "home")
    })
  })

  test("1. Customer Sidebar: Color combination matches admin sidebar dark palette", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("http://localhost:3000")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    // Locate desktop customer sidebar
    const sidebar = page.locator("aside").first()
    await expect(sidebar).toBeVisible()

    // Verify dark palette matching admin sidebar (#141619, border-stone-800)
    const classList = await sidebar.getAttribute("class")
    expect(classList).toContain("bg-[#141619]")
    expect(classList).toContain("border-stone-800")

    // Verify active portal item has bg-orange-600 styling
    const activeItem = sidebar.locator("button.bg-orange-600").first()
    await expect(activeItem).toBeVisible()
    await expect(activeItem).toContainText("Home Overview")
  })

  test("2. Customer Sidebar: Tapping Motorly logo expands sidebar when collapsed", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("http://localhost:3000")
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(1000)

    const sidebar = page.locator("aside").first()
    await expect(sidebar).toBeVisible()

    // 1. Collapse sidebar using desktop collapse button «
    const collapseBtn = sidebar.locator("button[title='Collapse Sidebar']")
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click()
      await page.waitForTimeout(400)
    }

    // Verify sidebar is collapsed to w-16 rail
    let currentClasses = await sidebar.getAttribute("class")
    expect(currentClasses).toContain("w-16")

    // 2. Tap on the Motorly 'M' logo button in the header
    const motorlyLogo = sidebar.locator("button[aria-label='Expand sidebar']").first()
    await expect(motorlyLogo).toBeVisible()
    await motorlyLogo.click()
    await page.waitForTimeout(400)

    // Verify sidebar is now fully expanded
    currentClasses = await sidebar.getAttribute("class")
    expect(currentClasses).not.toContain("w-16")
    expect(currentClasses).toMatch(/w-60|w-64/)
  })

  test("3. Admin Gmail Authentication: Proper Google/Gmail login verifies and unlocks console", async ({ page }) => {
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

  test("4. Zero Hardcoded User Data: No demo user chips in Customer Sign-In or Reservations", async ({ page }) => {
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
