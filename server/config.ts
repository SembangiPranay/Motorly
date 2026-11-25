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
