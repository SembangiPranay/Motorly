import { chromium } from "playwright"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })

  console.log("Navigating to http://localhost:3000...")
  await page.goto("http://localhost:3000")

  // 1. At 2.5s: During tracing phase - verify continuous flow across roof
  await page.waitForTimeout(2500)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/verify_flow_continuous_roof.png" })
  console.log("Captured verify_flow_continuous_roof.png")

  // 2. At 3.8s: Outline phase - verify line completed all the way to rear taillight
  await page.waitForTimeout(1300)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/verify_flow_completed_tail.png" })
  console.log("Captured verify_flow_completed_tail.png")

  // 3. At 6.4s: Full reveal - verify ZERO rectangular border around the car photo
  await page.waitForTimeout(2600)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/verify_seamless_car_reveal.png" })
  console.log("Captured verify_seamless_car_reveal.png")

  // 4. At 8.6s: Hero reveal - verify pristine color mixing of car background and studio glow
  await page.waitForTimeout(2200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/verify_seamless_hero_reveal.png" })
  console.log("Captured verify_seamless_hero_reveal.png")

  // 5. Mobile viewport test
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.removeItem("motorly_intro_completed")
  })
  await mobilePage.goto("http://localhost:3000")
  await mobilePage.waitForTimeout(8600)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/verify_seamless_mobile_hero.png" })
  console.log("Captured verify_seamless_mobile_hero.png")

  await browser.close()
}

run().catch(console.error)
