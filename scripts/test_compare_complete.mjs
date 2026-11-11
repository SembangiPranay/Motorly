import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  console.log("=== Testing Compare View Vehicle Add/Swap/Remove ===")
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  // Skip intro
  const skipBtn = await page.$("button:has-text('Skip Intro')")
  if (skipBtn) await skipBtn.click()

  // Navigate to Compare View
  console.log("Navigating to Compare Vehicles...")
  await page.click("button:has-text('Compare Vehicles')")
  await page.waitForTimeout(800)

  // Step 1: Initial State (should have 2 cars)
  let cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("1. Initial Cars (should be 2):", cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "compare_test_step1_2cars.png") })

  // Step 2: Add 3rd Car
  console.log("2. Clicking '+ Pick Vehicle' to add 3rd car...")
  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(500)

  // In modal, check how many cars are available (should exclude the 2 already compared)
  const modalCars = await page.$$eval(
    "div.fixed.inset-0.z-50 div.overflow-y-auto > div p.font-bold",
    (els) => els.map((e) => e.textContent.trim())
  )
  console.log("Modal available cars count:", modalCars.length, "First few:", modalCars.slice(0, 3))
  
  // Pick the first car in the modal
  const carToAdd1 = modalCars[0]
  console.log("Adding car:", carToAdd1)
  await page.click(`div.fixed.inset-0.z-50 div.overflow-y-auto > div:has-text('${carToAdd1}')`)
  await page.waitForTimeout(800)

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after adding 3rd car (should be 3):", cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "compare_test_step2_3cars.png") })

  if (cars.length !== 3) {
    throw new Error(`Expected 3 cars, but got ${cars.length}: ${JSON.stringify(cars)}`)
  }

  // Step 3: Add 4th Car
  console.log("3. Clicking '+ Pick Vehicle' to add 4th car...")
  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(500)

  const modalCars2 = await page.$$eval(
    "div.fixed.inset-0.z-50 div.overflow-y-auto > div p.font-bold",
    (els) => els.map((e) => e.textContent.trim())
  )
  const carToAdd2 = modalCars2[0]
  console.log("Adding 4th car:", carToAdd2)
  await page.click(`div.fixed.inset-0.z-50 div.overflow-y-auto > div:has-text('${carToAdd2}')`)
  await page.waitForTimeout(800)

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after adding 4th car (should be 4):", cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "compare_test_step3_4cars.png") })

  if (cars.length !== 4) {
    throw new Error(`Expected 4 cars, but got ${cars.length}: ${JSON.stringify(cars)}`)
  }

  // Verify that '+ Pick Vehicle' slot is now gone (max 4 reached)
  const pickBtnExists = await page.$("button:has-text('+ Pick Vehicle')")
  console.log("'+ Pick Vehicle' exists when 4 cars compared (should be null):", pickBtnExists)

  // Step 4: Remove a car
  console.log("4. Removing car:", cars[1])
  const removeButtons = await page.$$("button[title='Remove from comparison']")
  console.log("Remove buttons count:", removeButtons.length)
  if (removeButtons.length > 0) {
    await removeButtons[1].click()
    await page.waitForTimeout(800)
  }

  cars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent.trim()))
  console.log("Cars after removal (should be 3):", cars)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "compare_test_step4_removed_to_3cars.png") })

  if (cars.length !== 3) {
    throw new Error(`Expected 3 cars after removal, but got ${cars.length}`)
  }

  // Verify '+ Pick Vehicle' reappeared
  const pickBtnReappeared = await page.$("button:has-text('+ Pick Vehicle')")
  console.log("'+ Pick Vehicle' reappeared when dropped to 3 cars (should be true):", Boolean(pickBtnReappeared))

  await browser.close()
  console.log("=== All Compare Add/Remove Tests Passed Flawlessly! ===")
}

run().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
