import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()))
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message, err.stack))

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  const skipBtn = await page.$("button:has-text('Skip Intro')")
  if (skipBtn) await skipBtn.click()
  await page.waitForTimeout(500)

  console.log("Clicking Compare Vehicles...")
  await page.click("button:has-text('Compare Vehicles')")
  await page.waitForTimeout(1000)

  await browser.close()
}

run().catch(console.error)
