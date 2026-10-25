/**
 * DriveRent — Playwright Visual Screenshot Runner & Validator
 *
 * Executes the Playwright automation suite, captures all Requirement R1 visual assets,
 * verifies image integrity (file size, non-empty, PNG dimensions), and outputs an audit log.
 */

import { execSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const SCREENSHOTS_DIR = path.resolve("./screenshots")

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)
    if (buffer.length < 24) return null
    // Check PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return null
    }
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  } catch {
    return null
  }
}

async function verifyServers() {
  console.log("Checking server health...")
  try {
    const backendRes = await fetch("http://localhost:3001/api/cars")
    if (!backendRes.ok)
      throw new Error(`Backend returned HTTP ${backendRes.status}`)
    console.log(" Backend API healthy on port 3001")
  } catch (err) {
    throw new Error(`Backend API unreachable on port 3001: ${err.message}`)
  }

  const frontendPort = process.env.PORT || "3000"
  try {
    const viteRes = await fetch(`http://localhost:${frontendPort}`)
    if (!viteRes.ok) throw new Error(`Vite returned HTTP ${viteRes.status}`)
    console.log(` Frontend Vite server healthy on port ${frontendPort}`)
  } catch (err) {
    throw new Error(
      `Frontend Vite server unreachable on port ${frontendPort}: ${err.message}`,
    )
  }
}

async function run() {
  console.log("\n" + "=".repeat(80))
  console.log("  DRIVERENT PLAYWRIGHT VISUAL CAPTURE & VALIDATION RUNNER")
  console.log("=".repeat(80) + "\n")

  await verifyServers()

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  }

  console.log(
    "\nExecuting Playwright E2E Visual Suite via npx playwright test...",
  )
  const startTime = Date.now()

  try {
    execSync("npx playwright test e2e/visual_capture.spec.ts --reporter=list", {
      stdio: "inherit",
      env: {
        ...process.env,
      },
    })
    console.log(
      `\nPlaywright test suite completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    )
  } catch (err) {
    console.error("\nPlaywright execution encountered an error:", err.message)
    // Continue to audit screenshots captured
  }

  // Audit captured screenshots
  console.log("\n" + "-".repeat(80))
  console.log("  SCREENSHOT ARTIFACT AUDIT & INTEGRITY VERIFICATION")
  console.log("-".repeat(80))

  const files = fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort()

  console.log(`Total PNG Screenshots Found: ${files.length}\n`)

  let validCount = 0
  const auditReport = []

  for (const file of files) {
    const fullPath = path.join(SCREENSHOTS_DIR, file)
    const stats = fs.statSync(fullPath)
    const sizeKb = (stats.size / 1024).toFixed(1)
    const dims = getPngDimensions(fullPath)
    const isValid =
      stats.size > 20000 && dims && dims.width >= 1280 && dims.height >= 800

    if (isValid) validCount++

    const status = isValid ? "[PASS]" : "[WARN]"
    const dimStr = dims ? `${dims.width}x${dims.height}` : "Unknown"
    console.log(
      `${status} ${file.padEnd(46)} | ${sizeKb.padStart(7)} KB | ${dimStr.padStart(11)}`,
    )

    auditReport.push({
      file,
      sizeBytes: stats.size,
      sizeKb: `${sizeKb} KB`,
      dimensions: dimStr,
      valid: isValid,
    })
  }

  console.log("-".repeat(80))
  console.log(
    `Verification Summary: ${validCount} of ${files.length} screenshots fully validated (>= 1280x800, non-empty)\n`,
  )

  return auditReport
}

run().catch((err) => {
  console.error("Runner Fatal Error:", err)
  process.exit(1)
})
