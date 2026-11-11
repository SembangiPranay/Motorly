import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // 1. Visit live production /admin gate
  await page.goto("https://motorly-ten.vercel.app/admin", { waitUntil: "domcontentloaded" })
  await page.evaluate(() => {
    localStorage.removeItem("motorly_admin_token")
    localStorage.removeItem("motorly_admin_user")
    window.location.reload()
  })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_admin_gate.png"), fullPage: false })
  console.log("Captured live production gate")

  // 2. Log in with 0709 on live production
  await page.fill('input[type="password"]', "0709")
  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)

  // 3. Navigate to Studio Settings
  const settingsBtn = await page.$('button:has-text("Studio Settings")')
  if (settingsBtn) {
    await settingsBtn.click()
    await page.waitForTimeout(2000)
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_admin_settings_passcode.png"), fullPage: true })
  console.log("Captured live production admin settings")

  await browser.close()
}

run().catch(console.error)
