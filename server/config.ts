import { randomBytes } from "node:crypto"
import { existsSync } from "node:fs"

if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file)
  }
}

export const isProduction = process.env.NODE_ENV === "production"
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ""

const configuredSecret = process.env.JWT_SECRET?.trim()
if (isProduction && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.")
}

export const JWT_SECRET = configuredSecret || randomBytes(32).toString("hex")

export function getAppOrigin(): string {
  const deploymentHost = process.env.VERCEL_ENV === "preview"
    ? process.env.VERCEL_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  for (const value of [process.env.APP_URL, deploymentHost && `https://${deploymentHost}`]) {
    if (!value) continue
    try {
      const url = new URL(value)
      if (url.protocol === "https:" || (!isProduction && url.protocol === "http:")) {
        return url.origin
      }
    } catch {
      // Use the next configured origin if a setting is malformed.
    }
  }
  return isProduction ? "https://motorly-ten.vercel.app" : "http://localhost:3000"
}
