import { chromium } from "playwright"

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to http://localhost:3000 ...")
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" })

  // 1. Stage 2: Specular Silhouette Tracing (1700ms)
  await page.waitForTimeout(1700)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_photorealistic_trace.png" })
  console.log("Saved local_photorealistic_trace.png")

  // 2. Stage 4: Full Brand Hero with 8K Liquid Platinum GT (3400ms more -> 5100ms total)
  await page.waitForTimeout(3400)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_photorealistic_hero.png" })
  console.log("Saved local_photorealistic_hero.png")

  // 3. Mobile Viewport (390 x 844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.clear()
  })
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(5000)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_photorealistic_mobile.png" })
  console.log("Saved local_photorealistic_mobile.png")

  await browser.close()
  console.log("Local photorealistic verification finished successfully!")
}

verify().catch(console.error)
