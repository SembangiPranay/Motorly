import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  const skipBtn = await page.$("button:has-text('Skip Intro')")
  if (skipBtn) await skipBtn.click()

  await page.click("button:has-text('Compare Vehicles')")
  await page.waitForTimeout(800)

  // Click Swap on the first car
  const swapBtn = await page.$("button:has-text('Swap ▾')")
  console.log("Clicking Swap ▾ button...")
  await swapBtn.click()
  await page.waitForTimeout(500)

  // In modal, pick a car
  const modalCars = await page.$$("div.fixed.inset-0.z-50 div.overflow-y-auto > div")
  const chosenCar = await modalCars[0].$eval("p.font-bold", e => e.textContent.trim())
  console.log("Swapping with:", chosenCar)
  await modalCars[0].click()
  await page.waitForTimeout(800)

  const cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after swap:", cars)

  if (!cars.includes(chosenCar)) {
    throw new Error(`Expected cars to include ${chosenCar}, but got ${JSON.stringify(cars)}`)
  }

  await browser.close()
  console.log("=== Swap Test Passed Flawlessly! ===")
}

run().catch((err) => {
  console.error("Swap test failed:", err)
  process.exit(1)
})
