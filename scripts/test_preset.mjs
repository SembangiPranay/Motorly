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

  console.log("Clicking 'Executive & Electric' preset...")
  await page.click("button:has-text('Executive & Electric')")
  await page.waitForTimeout(800)

  let cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after Executive & Electric preset:", cars)

  console.log("Clicking 'Add Vehicle' button to add a 3rd car to preset...")
  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(500)

  const modalCars = await page.$$("div.fixed.inset-0.z-50 div.overflow-y-auto > div")
  const chosenCar = await modalCars[0].$eval("p.font-bold", e => e.textContent.trim())
  console.log("Adding 3rd car:", chosenCar)
  await modalCars[0].click()
  await page.waitForTimeout(800)

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after adding to preset:", cars)

  if (cars.length !== 3) {
    throw new Error(`Expected 3 cars after adding to preset, got ${cars.length}`)
  }

  await browser.close()
  console.log("=== Preset Test Passed Flawlessly! ===")
}

run().catch((err) => {
  console.error("Preset test failed:", err)
  process.exit(1)
})
