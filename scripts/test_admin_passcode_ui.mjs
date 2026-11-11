import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // 1. Visit /admin without auth to see AdminLoginGate
  await page.goto("http://localhost:3000/admin", { waitUntil: "domcontentloaded" })
  await page.evaluate(() => {
    localStorage.removeItem("motorly_admin_token")
    localStorage.removeItem("motorly_admin_user")
    window.location.reload()
  })
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "admin_login_gate_passcode_proof.png"),
    fullPage: false
  })
  console.log("Captured AdminLoginGate proof")

  // 2. Log in using 0709 into Admin Console -> Studio Settings
  await page.fill('input[type="password"]', "0709")
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)

  // Navigate to Studio Settings tab
  const settingsBtn = await page.$('button:has-text("Studio Settings")')
  if (settingsBtn) {
    await settingsBtn.click()
    await page.waitForTimeout(1500)
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "admin_settings_passcode_management_proof.png"),
    fullPage: true
  })
  console.log("Captured Admin Settings Passcode Management proof")

  await browser.close()
}

run().catch(console.error)
