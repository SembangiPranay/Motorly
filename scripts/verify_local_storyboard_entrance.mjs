import { chromium } from "playwright"

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log("Navigating to http://localhost:3000 ...")
  await page.addInitScript(() => {
    sessionStorage.clear()
  })

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" })

  // Stage 3: Specular Silhouette Tracing (around 2200ms)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_storyboard_trace.png" })
  console.log("Saved local_storyboard_trace.png")

  // Stage 5: Hero Brand Reveal with BMW wheels & clean typography (around 4800ms)
  await page.waitForTimeout(2600)
  await page.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_storyboard_hero.png" })
  console.log("Saved local_storyboard_hero.png")

  // Mobile viewport
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobilePage.addInitScript(() => {
    sessionStorage.clear()
  })
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(4800)
  await mobilePage.screenshot({ path: "C:/Users/TO-00105/.gemini/antigravity/brain/eddb663b-82b6-4681-930e-50de771ea587/local_storyboard_mobile.png" })
  console.log("Saved local_storyboard_mobile.png")

  await browser.close()
  console.log("Local storyboard verification completed!")
}

verify().catch(console.error)
