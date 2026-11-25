import { Router } from "express"
import bcrypt from "bcryptjs"
import { OAuth2Client } from "google-auth-library"
import { db } from "../db.ts"
import {
  type JwtUserPayload,
  generateJwtToken,
  parseAuthHeader,
  verifySession,
  requireAdmin,
} from "../auth.ts"
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "../login-rate-limit.ts"
import { formatUserRow } from "../serializers.ts"
import { ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, isProduction } from "../config.ts"

const router = Router()

async function verifyAdminPasscode(password: string, email?: string) {
  if (password === "google-oauth-managed") return null
  const saved = await db.get("SELECT password_hash FROM admin_credentials WHERE id = 'master'")
  const admin = await db.get(
    `SELECT * FROM users WHERE role = 'admin'${email ? " AND LOWER(email) = ?" : " ORDER BY id LIMIT 1"}`,
    ...(email ? [email.trim().toLowerCase()] : []),
  )
  if (saved) {
    return (await bcrypt.compare(password, saved.password_hash)) ? { admin } : null
  }

  if (ADMIN_PASSWORD_HASH && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH))) return { admin }
  if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) return { admin }

  const hash = admin?.password_hash
  if (
    typeof hash === "string" &&
    /^\$2[aby]\$/.test(hash) &&
    (await bcrypt.compare(password, hash))
  ) {
    return { admin }
  }
  return null
}

router.post("/auth/login", async (req, res) => {
  const clientIp =
    (process.env.VERCEL === "1"
      ? req.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      : undefined) ||
    req.socket.remoteAddress ||
    "127.0.0.1"

  const rateCheck = checkLoginRateLimit(clientIp)
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts from this network. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
    })
  }

  const { password, email } = req.body || {}

  if (!password || typeof password !== "string" || Buffer.byteLength(password) > 72) {
    return res.status(400).json({
      success: false,
      message: "Password is required.",
    })
  }

  const credentials = await verifyAdminPasscode(
    password,
    typeof email === "string" ? email : undefined,
  )
  if (!credentials) {
    recordFailedLoginAttempt(clientIp)
    return res.status(401).json({
      success: false,
      message: "Invalid administrator credentials.",
    })
  }

  // Clear rate limit lock on success
  clearLoginAttempts(clientIp)

  const authenticatedAdmin = credentials.admin
  const adminPayload: JwtUserPayload = {
    userId: authenticatedAdmin?.id || "usr_admin",
    email: authenticatedAdmin?.email || process.env.ADMIN_EMAIL || "admin@pitstopcarhire.com",
    name: authenticatedAdmin?.name || "Fleet Operations Admin",
    role: "admin",
    vipTier: "VIP",
  }

  // Cryptographically signed JWT token with 24-hour expiration
  const token = generateJwtToken(adminPayload, "24h")
  await db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token)

  return res.json({
    success: true,
    token,
    role: "admin",
    user: adminPayload,
    message: "Admin authenticated successfully with JWT.",
  })
})

const googleAuth = new OAuth2Client()

router.post("/auth/google-admin-login", async (req, res) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  if (!clientId) {
    return res.status(503).json({ success: false, message: "Google sign-in is unavailable." })
  }
  const { credential } = req.body || {}
  if (typeof credential !== "string" || !credential || credential.length > 8192) {
    return res
      .status(400)
      .json({ success: false, message: "A Google sign-in credential is required." })
  }

  const identity = await googleAuth
    .verifyIdToken({ idToken: credential, audience: clientId })
    .then((ticket) => ticket.getPayload())
    .catch(() => undefined)
  const email = identity?.email?.toLowerCase()
  if (!email || !identity?.email_verified || (!email.endsWith("@gmail.com") && !identity.hd)) {
    return res
      .status(401)
      .json({ success: false, message: "Google could not verify this account." })
  }

  const admin = await db
    .prepare("SELECT id, name FROM users WHERE LOWER(email) = ? AND role = 'admin'")
    .get(email)
  const allowedEmails = [process.env.ADMIN_GMAIL, process.env.ADMIN_EMAIL].map((value) =>
    value?.trim().toLowerCase(),
  )
  if (!admin && !allowedEmails.includes(email)) {
    return res
      .status(403)
      .json({ success: false, message: "This account is not authorized for fleet administration." })
  }

  const user: JwtUserPayload = {
    userId: admin?.id || `google:${identity.sub}`,
    email,
    name: admin?.name || identity.name || "Fleet Operations Admin",
    role: "admin",
    vipTier: "VIP",
  }
  const token = generateJwtToken(user, "24h")
  await db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token)
  return res.json({ success: true, token, role: "admin", user })
})

router.post("/auth/verify", async (req, res) => {
  const token = parseAuthHeader(req) || req.body?.token
  if (!token) return res.status(401).json({ authenticated: false })

  const decoded = await verifySession(token)
  if (!decoded || decoded.role !== "admin") {
    return res.status(401).json({
      authenticated: false,
      message: "Session expired or invalid.",
    })
  }

  return res.json({ authenticated: true, role: "admin", user: decoded })
})

router.post("/auth/admin-logout", requireAdmin, async (req, res) => {
  await db.run("DELETE FROM admin_sessions WHERE token = ?", parseAuthHeader(req))
  return res.json({ success: true })
})

// Change Admin Passcode / Password
router.post("/auth/change-admin-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const minimumLength = isProduction ? 12 : 4
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < minimumLength ||
    Buffer.byteLength(newPassword) > 72
  ) {
    return res.status(400).json({
      success: false,
      message: `Enter your current passcode and a new passcode of at least ${minimumLength} characters (maximum 72 bytes).`,
    })
  }
  if (!(await verifyAdminPasscode(currentPassword))) {
    return res.status(400).json({ success: false, message: "Current passcode does not match." })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  const currentToken = parseAuthHeader(req)
  await db.transaction(async (tx) => {
    await tx.run(
      `
      INSERT INTO admin_credentials (id, password_hash) VALUES ('master', ?)
      ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash
    `,
      hash,
    )
    await tx.run("DELETE FROM admin_sessions WHERE token <> ?", currentToken)
  })
  return res.json({ success: true, message: "Admin passcode updated." })
})

// Customer Registration
router.post("/auth/register", async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    driverLicenseNum,
    driverLicenseState,
    driverLicenseExpiry,
  } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and full name are required.",
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail)
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    })
  }

  // Cryptographically hash password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10)
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  await db
    .prepare(
      `
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'customer', 'Standard')
  `,
    )
    .run(
      userId,
      normalizedEmail,
      passwordHash,
      name.trim(),
      phone || "",
      driverLicenseNum || "",
      driverLicenseState || "",
      driverLicenseExpiry || "",
    )

  const userPayload: JwtUserPayload = {
    userId,
    email: normalizedEmail,
    name: name.trim(),
    role: "customer",
    vipTier: "Standard",
  }

  // Cryptographically signed JWT token with 7-day expiration
  const token = generateJwtToken(userPayload, "7d")
  await db
    .prepare("INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)")
    .run(token, userId)

  const newUser = await db.prepare("SELECT * FROM users WHERE id = ?").get(userId)

  return res.status(201).json({
    success: true,
    token,
    user: formatUserRow(newUser),
    message: "Customer account created successfully.",
  })
})

// Customer Login
router.post("/auth/customer-login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = (await db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail)) as any

  if (!user || user.role !== "customer") {
    return res.status(401).json({ success: false, message: "Invalid email or password." })
  }

  // Verify password with bcrypt (with auto-upgrade for any legacy plaintext)
  let isPasswordValid = false
  if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
    isPasswordValid = await bcrypt.compare(password, user.password_hash)
  } else {
    if (user.password_hash === password) {
      isPasswordValid = true
      const upgradedHash = await bcrypt.hash(password, 10)
      await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(upgradedHash, user.id)
    }
  }

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: "Invalid email or password." })
  }

  const userPayload: JwtUserPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "customer",
    vipTier: user.vip_tier || "Standard",
  }

  // Cryptographically signed JWT token with 7-day expiration
  const token = generateJwtToken(userPayload, "7d")
  await db
    .prepare("INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)")
    .run(token, user.id)

  return res.json({
    success: true,
    token,
    user: formatUserRow(user),
    message: "Logged in successfully.",
  })
})

// Get Current Customer Profile
router.get("/auth/customer-me", async (req, res) => {
  const token = parseAuthHeader(req)
  if (!token) {
    return res.status(401).json({ authenticated: false, message: "No token provided." })
  }

  // Verify cryptographic JWT signature
  const decoded = await verifySession(token)
  if (!decoded) {
    return res.status(401).json({ authenticated: false, message: "Session invalid or expired." })
  }

  if (decoded.role === "admin") {
    return res.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: "admin",
        vipTier: "VIP",
        phone: "+1 (305) 555-0199",
      },
    })
  }

  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId)
  if (!user) {
    return res.status(404).json({ authenticated: false, message: "User not found." })
  }

  return res.json({ authenticated: true, user: formatUserRow(user) })
})

// Customer Logout
router.post("/auth/customer-logout", async (req, res) => {
  const token = parseAuthHeader(req)
  if (token) {
    await db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token)
  }
  return res.json({ success: true, message: "Logged out." })
})

export default router
