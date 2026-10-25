import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const TARGET_URL = process.env.APP_URL || "http://localhost:3000"
const OUTPUT_DIR = path.resolve("screenshots")

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function capture() {
  console.log("📸 Capturing High-Resolution Screenshots for Simplified Flow...")
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // 1. Capture Car Detail view with clean price & availability check
  console.log("1. Navigating to Car Detail View...")
  await page.goto(`${TARGET_URL}`, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    localStorage.setItem("motorly_current_view", "detail")
  })
  await page.goto(`${TARGET_URL}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "09_car_detail_clean_price_check.png"),
    fullPage: false,
  })
  console.log("   Saved: 09_car_detail_clean_price_check.png")

  // 2. Capture Simplified Checkout view (NO ONLINE PAYMENT!)
  console.log("2. Navigating to Checkout View...")
  await page.evaluate(() => {
    localStorage.setItem("motorly_current_view", "checkout")
    localStorage.setItem(
      "motorly_customer_user",
      JSON.stringify({
        id: "usr_marcus_test",
        name: "Marcus Aurelius",
        email: "marcus@example.com",
        phone: "+1 (555) 345-6789",
        role: "customer",
      }),
    )
  })
  await page.goto(`${TARGET_URL}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1200)

  // Autofill driver info for clean visual presentation
  const autofillBtn = page.locator("text=Autofill Customer & Verification")
  if (await autofillBtn.isVisible()) {
    await autofillBtn.click()
    await page.waitForTimeout(500)
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "10_simplified_checkout_no_online_pay.png"),
    fullPage: true,
  })
  console.log("   Saved: 10_simplified_checkout_no_online_pay.png")

  // 3. Navigate to Admin / Manager Portal
  console.log("3. Navigating to Manager Command Center...")
  await page.evaluate(() => {
    localStorage.setItem(
      "motorly_admin_token",
      "admin_secret_session_token_2026",
    )
    localStorage.setItem("motorly_current_view", "admin")
  })
  await page.goto(`${TARGET_URL}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "12_manager_command_center_accept_request.png"),
    fullPage: false,
  })
  console.log("   Saved: 12_manager_command_center_accept_request.png")

  await browser.close()
  console.log("🎉 All simplified flow screenshots captured successfully!")
}

capture().catch((err) => {
  console.error("Screenshot error:", err)
  process.exit(1)
})
