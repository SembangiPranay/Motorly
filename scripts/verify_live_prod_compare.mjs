import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"
const PROD_URL = "https://motorly-ten.vercel.app"

async function verifyProd() {
  console.log("=== Testing Compare on Live Production URL ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  const skipBtn = await page.$("button:has-text('Skip Intro')")
  if (skipBtn) await skipBtn.click()
  await page.waitForTimeout(600)

  console.log("Navigating to Compare Vehicles on production...")
  await page.click("button:has-text('Compare Vehicles')")
  await page.waitForTimeout(1000)

  let cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Production initial cars count:", cars.length, cars)

  console.log("Clicking '+ Pick Vehicle' to add 3rd car on production...")
  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(600)

  const modalCars = await page.$$eval(
    "div.fixed.inset-0.z-50 div.overflow-y-auto > div p.font-bold",
    (els) => els.map((e) => e.textContent.trim())
  )
  console.log("Production modal available cars count:", modalCars.length)
  const carToAdd1 = modalCars[0]
  console.log("Adding car on production:", carToAdd1)
  await page.click(`div.fixed.inset-0.z-50 div.overflow-y-auto > div:has-text('${carToAdd1}')`)
  await page.waitForTimeout(1000)

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Production cars after adding 3rd (should be 3):", cars.length, cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_compare_3cars.png") })

  if (cars.length !== 3) {
    throw new Error(`Expected 3 cars on production, got ${cars.length}`)
  }

  console.log("Clicking '+ Pick Vehicle' to add 4th car on production...")
  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(600)

  const modalCars2 = await page.$$eval(
    "div.fixed.inset-0.z-50 div.overflow-y-auto > div p.font-bold",
    (els) => els.map((e) => e.textContent.trim())
  )
  const carToAdd2 = modalCars2[0]
  console.log("Adding 4th car on production:", carToAdd2)
  await page.click(`div.fixed.inset-0.z-50 div.overflow-y-auto > div:has-text('${carToAdd2}')`)
  await page.waitForTimeout(1000)

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Production cars after adding 4th (should be 4):", cars.length, cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_compare_4cars.png") })

  if (cars.length !== 4) {
    throw new Error(`Expected 4 cars on production, got ${cars.length}`)
  }

  await browser.close()
  console.log("=== Production Compare Test Succeeded 100%! ===")
}

verifyProd().catch((err) => {
  console.error("Production verification failed:", err)
  process.exit(1)
})
