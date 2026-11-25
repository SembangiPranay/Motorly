import type express from "express"
import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.ts"
import { db } from "./db.ts"

export interface JwtUserPayload {
  userId: string
  email: string
  name: string
  role: "admin" | "customer"
  vipTier?: string
}

export function generateJwtToken(
  payload: JwtUserPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d",
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn, jwtid: randomUUID(), algorithm: "HS256" })
}

export function parseAuthHeader(req: express.Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}

export async function verifySession(token: string): Promise<JwtUserPayload | null> {
  let user: JwtUserPayload
  try {
    user = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtUserPayload
  } catch {
    return null
  }
  if (!user.userId || !user.email) return null

  if (user.role === "admin") {
    return (await db.get("SELECT 1 FROM admin_sessions WHERE token = ?", token)) ? user : null
  }
  if (user.role === "customer") {
    return (await db.get(
      "SELECT 1 FROM customer_sessions WHERE token = ? AND user_id = ?",
      token,
      user.userId,
    ))
      ? user
      : null
  }
  return null
}

export function canAccessBooking(
  user: JwtUserPayload | undefined,
  booking: { user_id?: string | null },
): boolean {
  return Boolean(user && (user.role === "admin" || booking.user_id === user.userId))
}

// Security Middleware: Require Valid Cryptographic JWT
export async function requireAuth(
  req: express.Request & { user?: JwtUserPayload },
  res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req)
  if (!token) {
    return res.status(401).json({ authenticated: false, message: "Authorization token required." })
  }
  const decoded = await verifySession(token)
  if (!decoded) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired authorization token.",
    })
  }
  req.user = decoded
  return next()
}

// Security Middleware: Require Admin (Fleet Manager) Role
export async function requireAdmin(
  req: express.Request & { user?: JwtUserPayload },
  res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req)
  if (!token) {
    return res.status(401).json({
      authenticated: false,
      message: "Authorization token required for fleet manager operations.",
    })
  }

  const decoded = await verifySession(token)
  if (!decoded) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired authorization token.",
    })
  }

  if (decoded.role !== "admin") {
    return res.status(403).json({
      authenticated: true,
      error: "Access denied. Fleet Manager (admin) privileges required.",
    })
  }

  req.user = decoded
  return next()
}

// Security Middleware: Optional User Attachment
export async function optionalAuth(
  req: express.Request & { user?: JwtUserPayload },
  res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req)
  if (token) {
    const decoded = await verifySession(token)
    if (!decoded) return res.status(401).json({ error: "Invalid or expired authorization token." })
    req.user = decoded
  }
  next()
}
