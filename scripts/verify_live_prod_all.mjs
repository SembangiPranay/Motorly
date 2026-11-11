import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  console.log("Navigating to production https://motorly-ten.vercel.app ...")
  
  // Clear sessionStorage so entrance animation triggers cleanly
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("https://motorly-ten.vercel.app", { waitUntil: "domcontentloaded" })

  // Wait 1.2s to capture F1 ignition / revving phase in production
  await page.waitForTimeout(1200)
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_f1_entrance_verified.png",
  })
  console.log("Saved live_prod_f1_entrance_verified.png")

  // Wait for entrance to complete (around 3.5s total)
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_home_after_f1.png",
  })
  console.log("Saved live_prod_home_after_f1.png")

  // Check admin portal
  console.log("Navigating to /admin ...")
  await page.goto("https://motorly-ten.vercel.app/?view=admin", { waitUntil: "networkidle" })
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/live_prod_admin_gate_verified.png",
  })
  console.log("Saved live_prod_admin_gate_verified.png")

  await browser.close()
  console.log("All screenshots captured successfully!")
}

run().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
