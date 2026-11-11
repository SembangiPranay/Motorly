import { chromium } from "playwright"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" })
  const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
  const d = fs.readFileSync("scripts/smooth_roofline_path.txt", "utf8")
  await page.setContent(`<html><body><svg viewBox="0 0 1376 768"><path id="p" d="${d}" /></svg></body></html>`)
  const len = await page.evaluate(() => document.getElementById("p").getTotalLength())
  console.log("Path total length:", Math.round(len))
  await browser.close()
}

run().catch(console.error)
