import { chromium } from "playwright"
import path from "path"

const ARTIFACT_DIR = "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)

  const skipBtn = await page.$("button:has-text('Skip Intro')")
  if (skipBtn) await skipBtn.click()

  await page.click("button:has-text('Compare Vehicles')")
  await page.waitForTimeout(800)

  const initialCars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent))
  console.log("Initial compared cars:", initialCars)

  await page.click("button:has-text('+ Pick Vehicle')")
  await page.waitForTimeout(500)

  // Pick the 3rd car in the modal list (idx = 2)
  const modalCarOptions = await page.$$("div.fixed.inset-0.z-50 div.overflow-y-auto > div")
  const carName = await modalCarOptions[2].$eval("p.font-bold", (e) => e.textContent)
  console.log("Selecting 3rd car from modal:", carName)
  await modalCarOptions[2].click()
  await page.waitForTimeout(800)

  const afterCars = await page.$$eval("thead th h3", (els) => els.map((e) => e.textContent))
  console.log("Cars after adding 3rd car from modal:", afterCars)

  await browser.close()
}

run().catch(console.error)
