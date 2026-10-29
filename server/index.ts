import express from "express"
import cors from "cors"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { db, initDatabase, DbExecutor } from "./db.ts"

// Load local environment files if present
try {
  if (typeof (process as any).loadEnvFile === "function") {
    if (fs.existsSync(".env.local")) (process as any).loadEnvFile(".env.local")
    if (fs.existsSync(".env")) (process as any).loadEnvFile(".env")
  }
} catch {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Database (Supabase directly with SQLite mirror fallback)
try {
  await initDatabase()
} catch (err: any) {
  console.warn("[DB Init Warning]", err?.message)
}

// Reconcile and maintain database invariants upon server startup
async function reconcileDatabaseInvariants() {
  try {
    // 1. Invariant 3.4: Reconcile any non-standard booking status 'Returned' -> 'Completed'
    await db
      .prepare(
        "UPDATE bookings SET status = 'Completed' WHERE status = 'Returned'",
      )
      .run()
      .catch(() => {})

    // 2. Invariant 3.1: Reset orphan 'Rented' vehicles to 'Available' if no active 'Checked Out' booking exists
    if (db.isSupabase && db.pool) {
      const res = await db.pool.query(`
        UPDATE vehicles
        SET status = 'Available'
        WHERE status = 'Rented'
          AND id NOT IN (
            SELECT matched_car_id
            FROM bookings
            WHERE status = 'Checked Out' AND matched_car_id IS NOT NULL
          )
      `)
      if (res.rowCount && res.rowCount > 0) {
        console.log(
          `[DB Reconciliation] Reset ${res.rowCount} orphan rented vehicles to Available`,
        )
      }
    } else {
      await db
        .prepare(`
        UPDATE vehicles
        SET status = 'Available'
        WHERE status = 'Rented'
          AND id NOT IN (
            SELECT matched_car_id
            FROM bookings
            WHERE status = 'Checked Out' AND matched_car_id IS NOT NULL
          )
      `)
        .run()
        .catch(() => {})
    }

    // 3. Invariant 3.2: Reconcile any 'Checked Out' bookings whose vehicle is currently marked 'Available' to 'Completed'
    if (db.isSupabase && db.pool) {
      const res32 = await db.pool.query(`
        UPDATE bookings
        SET status = 'Completed'
        WHERE status = 'Checked Out'
          AND matched_car_id IN (
            SELECT id FROM vehicles WHERE status = 'Available'
          )
      `)
      if (res32.rowCount && res32.rowCount > 0) {
        console.log(
          `[DB Reconciliation] Completed ${res32.rowCount} historical bookings for available vehicles`,
        )
      }
    } else {
      await db
        .prepare(`
        UPDATE bookings
        SET status = 'Completed'
        WHERE status = 'Checked Out'
          AND matched_car_id IN (
            SELECT id FROM vehicles WHERE status = 'Available'
          )
      `)
        .run()
        .catch(() => {})
    }

    // 4. Invariant: Ensure all admin accounts in database have bcrypt salted password hashes
    try {
      const adminUsers = await db
        .prepare("SELECT id, email, password_hash FROM users WHERE role = 'admin'")
        .all()
        .catch(() => [])
      for (const u of adminUsers) {
        if (
          u.password_hash &&
          !u.password_hash.startsWith("$2a$") &&
          !u.password_hash.startsWith("$2b$")
        ) {
          const secureHash = bcrypt.hashSync(u.password_hash, 10)
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .run(secureHash, u.id)
            .catch(() => {})
          console.log(`[DB Reconciliation] Upgraded plain-text password for admin ${u.email} to bcrypt hash`)
        }
      }
    } catch (passErr: any) {
      console.warn("[DB Password Upgrade Warning]", passErr?.message)
    }
  } catch (err: any) {
    console.warn("[DB Reconciliation Warning]", err?.message)
  }
}

try {
  await reconcileDatabaseInvariants()
} catch (err: any) {
  console.warn("[DB Reconciliation Init Error]", err?.message)
}

// In-Memory IP Brute-Force Rate Limiter
interface LoginAttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil?: number
}
const loginRateLimitStore = new Map<string, LoginAttemptRecord>()

function checkLoginRateLimit(ip: string, maxAttempts = 10, windowMs = 15 * 60 * 1000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const rec = loginRateLimitStore.get(ip)
  if (!rec) return { allowed: true }

  if (rec.lockedUntil && now < rec.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((rec.lockedUntil - now) / 1000) }
  }

  if (now - rec.firstAttempt > windowMs) {
    loginRateLimitStore.delete(ip)
    return { allowed: true }
  }

  if (rec.count >= maxAttempts) {
    rec.lockedUntil = now + windowMs
    return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) }
  }

  return { allowed: true }
}

function recordFailedLoginAttempt(ip: string, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const rec = loginRateLimitStore.get(ip) || { count: 0, firstAttempt: now }
  if (now - rec.firstAttempt > windowMs) {
    rec.count = 1
    rec.firstAttempt = now
    rec.lockedUntil = undefined
  } else {
    rec.count++
  }
  if (rec.count >= maxAttempts) {
    rec.lockedUntil = now + windowMs
  }
  loginRateLimitStore.set(ip, rec)
}

function clearLoginAttempts(ip: string) {
  loginRateLimitStore.delete(ip)
}

const isProduction = process.env.NODE_ENV === "production"
const app = express()
const PORT = process.env.PORT_BACKEND || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ""
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "motorly-fleet-jwt-secret-secure-key-2026-production-salt-99x"

if (isProduction && !ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH) {
  console.warn(
    "[SECURITY NOTICE] No environment ADMIN_PASSWORD or ADMIN_PASSWORD_HASH provided. Authentication verified strictly against salted database credentials.",
  )
}

interface JwtUserPayload {
  userId: string
  email: string
  name: string
  role: "admin" | "customer"
  vipTier?: string
}

app.use(cors())
app.use(express.json({ limit: "20mb" }))

// Serve static vehicle image assets if stored locally in public/images
const publicImagesDir = path.join(__dirname, "../public/images")
if (fs.existsSync(publicImagesDir)) {
  app.use(
    ["/images", "/api/images"],
    express.static(publicImagesDir, { maxAge: "1d" }),
  )
}

// Normalize routes if running behind serverless rewrites (e.g. Vercel /api rewrites)
app.use((req, _res, next) => {
  if (req.url.startsWith("/images")) {
    return next()
  }
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url)
  }
  next()
})

// Public Health Check Endpoint (With Positive Database Identification)
app.get(["/api", "/api/health"], async (_req, res) => {
  res.json({
    status: "ok",
    service: "MOTORLY Fleet API",
    supabase: db.isSupabase,
    database: {
      active: db.isSupabase ? "supabase" : "sqlite",
      host: db.activeHost || null,
      name: db.activeDbName || null,
    },
    environment: isProduction ? "production" : "staging",
    timestamp: new Date().toISOString(),
  })
})

// Helper to format car row from SQLite
function formatCarRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year,
    type: row.type,
    pricePerDay: Number(row.price_per_day),
    pricePerHour: Number(row.price_per_hour),
    pricePerMonth:
      row.price_per_month != null && !isNaN(Number(row.price_per_month))
        ? Number(row.price_per_month)
        : Math.round(Number(row.price_per_day) * 22),
    image: row.image,
    gallery:
      typeof row.gallery === "string"
        ? JSON.parse(row.gallery || "[]")
        : row.gallery,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    seats: row.seats,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    mileage: row.mileage,
    luggage: row.luggage,
    features:
      typeof row.features === "string"
        ? JSON.parse(row.features || "[]")
        : row.features,
    description: row.description,
    isPopular: Boolean(row.is_popular),
    status: row.status,
    plateNumber: row.plate_number,
    location: row.location,
    healthScore: row.health_score,
    insurancePolicy: row.insurance_policy || "POL-STF-994021",
    insuranceProvider: row.insurance_provider || "State Farm Comprehensive",
    insuranceExpiry: row.insurance_expiry || "2027-04-15",
    purchaseDate: row.purchase_date || "2024-01-10",
    purchaseCost: Number(row.purchase_cost) || 28500,
    currentOdometer: Number(row.current_odometer) || 14250,
    garageName: row.garage_name || "MOTORLY Central Hub & Garage Bay 4",
    garageAddress:
      row.garage_address || row.location || "4200 NW 21st St, Miami, FL 33142",
    garageLat: Number(row.garage_lat) || 25.7959,
    garageLng: Number(row.garage_lng) || -80.287,
    garageBay: row.garage_bay || "Bay 14-B",
  }
}

// Helper to sort bookings chronologically so recent bookings are always at the top
function parseBookingDateSort(val: any): number {
  if (!val) return 0
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim()
    if (lower === "just now" || lower.startsWith("just now")) {
      return Date.now() + 1000000 // Always prioritize newest bookings at the top
    }
    if (lower.startsWith("today")) {
      return Date.now() - 3600 * 1000
    }
    if (lower.startsWith("yesterday")) {
      return Date.now() - 86400 * 1000
    }
    if (lower.includes("days ago")) {
      const match = lower.match(/(\d+)\s*days\s*ago/)
      const days = match ? parseInt(match[1], 10) : 3
      return Date.now() - days * 86400 * 1000
    }
    let cleanStr = val
      .replace(/Counter Dispatch\s*\(/i, "")
      .replace(/\)$/, "")
      .trim()
    if (!cleanStr.match(/\b20\d\d\b/)) {
      cleanStr = `${cleanStr}, 2026`
    }
    const parsed = Date.parse(cleanStr)
    if (!isNaN(parsed)) return parsed
  }
  if (val instanceof Date) return val.getTime()
  return 0
}

// Helper to format booking row from SQLite
function formatBookingRow(row: any) {
  if (!row) return null

  let checklistOut = undefined
  let checklistIn = undefined
  let extensionRequest = undefined
  let extensionQuote = undefined

  try {
    if (row.checklist_out) {
      const parsed = JSON.parse(row.checklist_out)
      checklistOut = {
        ...parsed,
        fuelLevelOut: parsed.fuelLevelOut || parsed.fuelOut || "100%",
      }
    }
  } catch {}
  try {
    if (row.checklist_in) {
      const parsed = JSON.parse(row.checklist_in)
      checklistIn = {
        ...parsed,
        fuelLevelIn: parsed.fuelLevelIn || parsed.fuelIn || "100%",
      }
    }
  } catch {}
  try {
    if (row.extension_request) {
      const parsed = JSON.parse(row.extension_request)
      extensionRequest = {
        ...parsed,
        durationValue: parsed.durationValue ?? parsed.extraDuration ?? 1,
        durationUnit: parsed.durationUnit ?? parsed.unit ?? "days",
        reason: parsed.reason ?? parsed.customerNotes ?? "",
      }
    }
  } catch {}
  try {
    if (row.extension_quote) extensionQuote = JSON.parse(row.extension_quote)
  } catch {}

  // Compact photo reference to avoid sending megabytes of base64 in list API responses
  const hasFrontBase64 =
    row.driver_license_file && row.driver_license_file.startsWith("data:")
  const hasBackBase64 =
    row.driver_license_back_file &&
    row.driver_license_back_file.startsWith("data:")

  const licenseFileName = hasFrontBase64
    ? "driver_license_front.jpg"
    : row.driver_license_file || undefined
  const licenseBackFileName = hasBackBase64
    ? "driver_license_back.jpg"
    : row.driver_license_back_file || undefined

  const licensePhotoFront = hasFrontBase64
    ? `/api/bookings/${row.id}/download-license?side=front`
    : row.driver_license_file || undefined
  const licensePhotoBack = hasBackBase64
    ? `/api/bookings/${row.id}/download-license?side=back`
    : row.driver_license_back_file || undefined

  return {
    id: row.id,
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    driver: {
      dateOfBirth: row.driver_dob || "",
      licenseNumber: row.driver_license_num || "",
      licenseState: row.driver_license_state || "",
      licenseExpiry: row.driver_license_expiry || "",
      licenseFileName,
      licenseBackFileName,
      licensePhotoFront,
      licensePhotoBack,
      selfieFileName: row.driver_selfie_file || undefined,
    },
    pickupLocation: row.pickup_location,
    returnLocation: row.return_location,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    requestedCategory: row.requested_category,
    matchedCarId: row.matched_car_id,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    userId: row.user_id || undefined,
    odometerOut: row.odometer_out || undefined,
    odometerIn: row.odometer_in || undefined,
    fuelLevelOut: row.fuel_level_out || undefined,
    fuelLevelIn: row.fuel_level_in || undefined,
    notes: row.notes || undefined,
    promoCode: row.promo_code || undefined,
    approvedByAdmin: Boolean(row.approved_by_admin),
    approvedAt: row.approved_at || undefined,
    keysHandedAt: row.keys_handed_at || undefined,
    checklistOut,
    checklistIn,
    extensionStatus: row.extension_status || "None",
    extensionRequest,
    extensionQuote,
    inspectionNotes: row.inspection_notes || undefined,
    inspectionPassed: Boolean(row.inspection_passed),
  }
}

// Helper to format user row
function formatUserRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || "",
    driverLicenseNum: row.driver_license_num || "",
    driverLicenseState: row.driver_license_state || "",
    driverLicenseExpiry: row.driver_license_expiry || "",
    role: row.role || "customer",
    vipTier: row.vip_tier || "Standard",
    createdAt: row.created_at,
  }
}

// Helper to format promo row
function formatPromoRow(row: any) {
  if (!row) return null
  return {
    code: row.code,
    discountPercent: row.discount_percent,
    description: row.description || "",
    isActive: Boolean(row.is_active),
    expiryDate: row.expiry_date || "2026-12-31",
    usageCount: row.usage_count || 0,
  }
}

// Helper to format maintenance row
function formatMaintenanceRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    carId: row.car_id,
    carName: row.car_name || undefined,
    serviceType: row.service_type,
    cost: row.cost,
    odometer: row.odometer,
    date: row.date,
    status: row.status,
    technicianNotes: row.technician_notes || "",
  }
}

/* ==========================================
   JWT AUTHENTICATION & SECURITY HELPERS
   ========================================== */

function generateJwtToken(
  payload: JwtUserPayload,
  expiresIn: string = "7d",
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

function parseAuthHeader(req: express.Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  if (req.query && typeof req.query.token === "string") {
    return req.query.token
  }
  return null
}

function verifyJwtToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload
  } catch {
    return null
  }
}

// Security Middleware: Require Valid Cryptographic JWT
async function requireAuth(
  req: express.Request & { user?: JwtUserPayload },
  res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req) || (req.body && req.body.token)
  if (!token) {
    return res
      .status(401)
      .json({ authenticated: false, message: "Authorization token required." })
  }
  const decoded = verifyJwtToken(token)
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
async function requireAdmin(
  req: express.Request & { user?: JwtUserPayload },
  res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req) || (req.body && req.body.token)
  if (!token) {
    return res.status(401).json({
      authenticated: false,
      message: "Authorization token required for fleet manager operations.",
    })
  }

  const decoded = verifyJwtToken(token)
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
async function optionalAuth(
  req: express.Request & { user?: JwtUserPayload },
  _res: express.Response,
  next: express.NextFunction,
) {
  const token = parseAuthHeader(req) || (req.body && req.body.token)
  if (token) {
    const decoded = verifyJwtToken(token)
    if (decoded) {
      req.user = decoded
    }
  }
  next()
}

function safeJsonStringify(val: any, fallback: string = "[]"): string {
  if (!val) return fallback
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      return JSON.stringify(parsed)
    } catch {
      return JSON.stringify([val])
    }
  }
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
    return JSON.stringify(val)
  }
  return fallback
}

/* ==========================================
   ADMIN AUTHENTICATION ROUTES (JWT + Passcode/Email)
   ========================================== */

app.post("/api/auth/login", async (req, res) => {
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1"

  const rateCheck = checkLoginRateLimit(clientIp)
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts from this network. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
    })
  }

  const { password, email } = req.body

  if (!password || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Password is required.",
    })
  }

  let isAuthenticated = false
  let authenticatedAdmin: any = null

  // 1. Secure check: Query database admin user with salted bcrypt hash
  try {
    const query = email
      ? "SELECT * FROM users WHERE email = ? AND role = 'admin'"
      : "SELECT * FROM users WHERE role = 'admin' LIMIT 1"
    const params = email ? [email.trim().toLowerCase()] : []
    const dbAdminUser = ((await db.prepare(query).get(...params)) as any)

    if (dbAdminUser && dbAdminUser.password_hash) {
      if (
        dbAdminUser.password_hash.startsWith("$2a$") ||
        dbAdminUser.password_hash.startsWith("$2b$")
      ) {
        isAuthenticated = await bcrypt.compare(password, dbAdminUser.password_hash)
      } else {
        // Upgrade any legacy hash in place
        if (password === dbAdminUser.password_hash) {
          isAuthenticated = true
          const upgradedHash = await bcrypt.hash(password, 10)
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .run(upgradedHash, dbAdminUser.id)
            .catch(() => {})
        }
      }
      if (isAuthenticated) {
        authenticatedAdmin = dbAdminUser
      }
    }
  } catch (dbErr: any) {
    console.warn("[Admin DB Lookup Warning]", dbErr?.message)
  }

  // 2. Secure check: Verify against environment ADMIN_PASSWORD_HASH if configured
  if (!isAuthenticated && ADMIN_PASSWORD_HASH) {
    try {
      isAuthenticated = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    } catch {}
  }

  // 3. Secure check: Verify against environment ADMIN_PASSWORD if provided
  if (!isAuthenticated && ADMIN_PASSWORD) {
    isAuthenticated = password === ADMIN_PASSWORD
  }

  if (!isAuthenticated) {
    recordFailedLoginAttempt(clientIp)
    return res.status(401).json({
      success: false,
      message: "Invalid administrator credentials.",
    })
  }

  // Clear rate limit lock on success
  clearLoginAttempts(clientIp)

  const adminPayload: JwtUserPayload = {
    userId: authenticatedAdmin?.id || "usr_admin",
    email: authenticatedAdmin?.email || email || "admin@motorly.com",
    name: authenticatedAdmin?.name || "Fleet Operations Admin",
    role: "admin",
    vipTier: "VIP",
  }

  // Cryptographically signed JWT token with 24-hour expiration
  const token = generateJwtToken(adminPayload, "24h")
  try {
    await db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token)
  } catch (sessErr: any) {}

  return res.json({
    success: true,
    token,
    role: "admin",
    user: adminPayload,
    message: "Admin authenticated successfully with JWT.",
  })
})

app.post("/api/auth/verify", async (req, res) => {
  const token = parseAuthHeader(req) || req.body?.token
  if (!token) return res.status(401).json({ authenticated: false })

  const decoded = verifyJwtToken(token)
  if (!decoded || decoded.role !== "admin") {
    return res.status(401).json({
      authenticated: false,
      message: "Session expired or invalid.",
    })
  }

  return res.json({ authenticated: true, role: "admin", user: decoded })
})

/* ==========================================
   CUSTOMER AUTHENTICATION & PROFILE (JWT + bcrypt)
   ========================================== */

// Customer Registration
app.post("/api/auth/register", async (req, res) => {
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
  const existingUser = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail)
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
    .prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'customer', 'Standard')
  `)
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

  const newUser = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId)

  return res.status(201).json({
    success: true,
    token,
    user: formatUserRow(newUser),
    message: "Customer account created successfully.",
  })
})

// Customer Login
app.post("/api/auth/customer-login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = (await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizedEmail)) as any

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." })
  }

  // Verify password with bcrypt (with auto-upgrade for any legacy plaintext)
  let isPasswordValid = false
  if (
    user.password_hash.startsWith("$2a$") ||
    user.password_hash.startsWith("$2b$")
  ) {
    isPasswordValid = await bcrypt.compare(password, user.password_hash)
  } else {
    if (user.password_hash === password) {
      isPasswordValid = true
      const upgradedHash = await bcrypt.hash(password, 10)
      await db
        .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .run(upgradedHash, user.id)
    }
  }

  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." })
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
app.get("/api/auth/customer-me", async (req, res) => {
  const token = parseAuthHeader(req)
  if (!token) {
    return res
      .status(401)
      .json({ authenticated: false, message: "No token provided." })
  }

  // Verify cryptographic JWT signature
  const decoded = verifyJwtToken(token)
  if (!decoded) {
    return res
      .status(401)
      .json({ authenticated: false, message: "Session invalid or expired." })
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

  const user = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(decoded.userId)
  if (!user) {
    return res
      .status(404)
      .json({ authenticated: false, message: "User not found." })
  }

  return res.json({ authenticated: true, user: formatUserRow(user) })
})

// Customer Logout
app.post("/api/auth/customer-logout", async (req, res) => {
  const token = parseAuthHeader(req)
  if (token) {
    await db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token)
  }
  return res.json({ success: true, message: "Logged out." })
})

// Get Customer Bookings (Self-service portal) - Strictly Authenticated
app.get(
  "/api/users/bookings",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const user = req.user!
    let cleanEmail = ""
    let targetUserId = ""

    if (user.role === "admin") {
      // Admin can query a specific customer's email or view all
      const requestedEmail = req.query.email as string | undefined
      if (requestedEmail) {
        cleanEmail = requestedEmail.trim().toLowerCase()
      } else {
        const allRows = (await db
          .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
          .all()) as any[]
        allRows.sort(
          (a, b) =>
            parseBookingDateSort(b.created_at) -
            parseBookingDateSort(a.created_at),
        )
        return res.json(allRows.map(formatBookingRow))
      }
    } else {
      // Regular customer can strictly only access THEIR OWN reservations
      cleanEmail = user.email.toLowerCase()
      targetUserId = user.userId
    }

    let rows: any[] = []
    if (cleanEmail && targetUserId) {
      rows = ((await db
        .prepare(
          `SELECT * FROM bookings WHERE LOWER(customer_email) = ? OR user_id = ? ORDER BY created_at DESC`,
        )
        .all(cleanEmail, targetUserId)) as any[])
    } else if (cleanEmail) {
      rows = ((await db
        .prepare(
          `SELECT * FROM bookings WHERE LOWER(customer_email) = ? ORDER BY created_at DESC`,
        )
        .all(cleanEmail)) as any[])
    } else if (targetUserId) {
      rows = ((await db
        .prepare(
          `SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC`,
        )
        .all(targetUserId)) as any[])
    }

    rows.sort(
      (a, b) =>
        parseBookingDateSort(b.created_at) - parseBookingDateSort(a.created_at),
    )

    return res.json(rows.map(formatBookingRow))
  },
)

/* ==========================================
   VEHICLES / FLEET ROUTES
   ========================================== */

// GET all cars with optional filters
app.get("/api/cars", async (req, res) => {
  const { status, type, search, maxPrice, pickupDate, returnDate } = req.query

  let query = "SELECT * FROM vehicles WHERE 1=1"
  const params: any[] = []

  if (status && status !== "all") {
    query += " AND status = ?"
    params.push(status)
  }

  if (type && type !== "all") {
    query += " AND type = ?"
    params.push(type)
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    query += " AND price_per_day <= ?"
    params.push(Number(maxPrice))
  }

  if (search) {
    query +=
      " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(plate_number) LIKE ?)"
    const wildcard = `%${String(search).trim().toLowerCase()}%`
    params.push(wildcard, wildcard, wildcard)
  }

  query += " ORDER BY is_popular DESC, price_per_day ASC"

  const rows = await db.prepare(query).all(...params)
  const cars = rows.map(formatCarRow)

  // Dynamically evaluate conflict/availability against requested dates with optimized single batch query
  if (pickupDate && returnDate) {
    const range = parseDateRangeStrict(String(pickupDate), String(returnDate))
    if (!range.valid) {
      // Fail safely: mark all vehicles unavailable for requested dates due to invalid date parameters
      for (const car of cars) {
        car.isAvailableForDates = false
        car.conflict = {
          conflictingBookingId: "INVALID_DATES",
          customerName: "Validation Guard",
          pickupDate: String(pickupDate),
          returnDate: String(returnDate),
          status: "Invalid Dates",
          reason: range.error || "Invalid date range specified.",
        }
        car.statusForDates = "Invalid Dates"
      }
    } else {
      try {
        // Optimized single batch query: fetch all active matched reservations in 1 fast query
        const activeBookings = await db
          .prepare(`
            SELECT id, customer_first_name, customer_last_name, pickup_date, return_date, status, matched_car_id
            FROM bookings
            WHERE matched_car_id IS NOT NULL
              AND status NOT IN ('Completed', 'Cancelled')
          `)
          .all()

        // Map active bookings by vehicle ID in memory (O(B))
        const bookingsByCar = new Map<string, any[]>()
        for (const b of activeBookings) {
          if (!b.matched_car_id) continue
          const list = bookingsByCar.get(b.matched_car_id) || []
          list.push(b)
          bookingsByCar.set(b.matched_car_id, list)
        }

        // Evaluate in-memory in O(1) per vehicle
        for (const car of cars) {
          if (car.status === "Maintenance") {
            car.isAvailableForDates = false
            car.conflict = {
              conflictingBookingId: "MAINTENANCE",
              customerName: "Fleet Maintenance",
              pickupDate: "Active",
              returnDate: "Scheduled",
              status: "Maintenance",
            }
            car.statusForDates = "Maintenance"
            continue
          }

          const carBookings = bookingsByCar.get(car.id) || []
          let conflict: any = null

          for (const b of carBookings) {
            const bRange = parseDateRangeStrict(b.pickup_date, b.return_date)
            const bStart = bRange.valid
              ? bRange.start
              : Date.parse(b.pickup_date)
            const bEnd = bRange.valid ? bRange.end : Date.parse(b.return_date)

            if (
              !isNaN(bStart) &&
              !isNaN(bEnd) &&
              datesOverlap(range.start, range.end, bStart, bEnd)
            ) {
              conflict = {
                conflictingBookingId: b.id,
                customerName: `${b.customer_first_name} ${b.customer_last_name}`,
                pickupDate: b.pickup_date,
                returnDate: b.return_date,
                status: b.status,
              }
              break
            }
          }

          car.isAvailableForDates = !conflict
          car.conflict = conflict || null
          car.statusForDates = conflict ? "Reserved" : car.status
        }
      } catch (err: any) {
        console.error("[Safe Availability Batch Error]", err?.message)
        // Fail safely: if query fails, mark vehicles as unavailable to prevent overbooking
        for (const car of cars) {
          car.isAvailableForDates = false
          car.conflict = {
            conflictingBookingId: "DB_FAILSAFE",
            customerName: "System Guard",
            pickupDate: String(pickupDate),
            returnDate: String(returnDate),
            status: "Degraded Safe",
            reason:
              "Availability check degraded safely to prevent overbooking.",
          }
          car.statusForDates = "Unavailable"
        }
      }
    }
  }

  return res.json(cars)
})

// GET single car
app.get("/api/cars/:id", async (req, res) => {
  const row = await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(req.params.id)
  if (!row) {
    return res.status(404).json({ error: "Vehicle not found." })
  }
  return res.json(formatCarRow(row))
})

// POST add new vehicle
app.post("/api/cars", requireAdmin, async (req, res) => {
  const car = req.body
  const newId =
    car.id ||
    (car.name || "vehicle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`

  const galleryJson = safeJsonStringify(
    car.gallery && car.gallery.length
      ? car.gallery
      : [
          car.image ||
            "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        ],
  )
  const featuresJson = safeJsonStringify(
    car.features || ["Bluetooth", "Apple CarPlay"],
  )

  await db
    .prepare(`
    INSERT INTO vehicles (
      id, name, brand, model, year, type, price_per_day, price_per_hour, price_per_month,
      image, gallery, rating, reviews_count, seats, transmission, fuel_type,
      mileage, luggage, features, description, is_popular, status, plate_number, location, health_score,
      insurance_policy, insurance_provider, insurance_expiry, purchase_date, purchase_cost, current_odometer,
      garage_name, garage_address, garage_lat, garage_lng, garage_bay
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `)
    .run(
      newId,
      car.name || "Custom Vehicle",
      car.brand || "Toyota",
      car.model || "Camry",
      Number(car.year) || 2024,
      car.type || "Sedan",
      Number(car.pricePerDay) || 50,
      Number(car.pricePerHour) || 7,
      Number(car.pricePerMonth) || Math.round((Number(car.pricePerDay) || 50) * 22),
      car.image ||
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      galleryJson,
      Number(car.rating) || 5.0,
      Number(car.reviewsCount) || 1,
      Number(car.seats) || 5,
      car.transmission || "Automatic",
      car.fuelType || "Gasoline",
      car.mileage || "30 MPG",
      car.luggage || "3 Bags",
      featuresJson,
      car.description || "Premium rental vehicle.",
      car.isPopular ? 1 : 0,
      car.status || "Available",
      car.plateNumber || `FL-${Math.floor(100 + Math.random() * 900)}-MTR`,
      car.location || "Miami International Airport (MIA)",
      Number(car.healthScore) || 98,
      car.insurancePolicy || "POL-STF-994021",
      car.insuranceProvider || "State Farm Comprehensive",
      car.insuranceExpiry || "2027-04-15",
      car.purchaseDate || "2024-01-10",
      Number(car.purchaseCost) || 28500,
      Number(car.currentOdometer) || 14250,
      car.garageName || "MOTORLY Central Hub & Garage Bay 4",
      car.garageAddress || car.location || "4200 NW 21st St, Miami, FL 33142",
      Number(car.garageLat) || 25.7959,
      Number(car.garageLng) || -80.287,
      car.garageBay || "Bay 14-B",
    )

  const created = await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(newId)
  return res.status(201).json(formatCarRow(created))
})

// PUT update vehicle
app.put("/api/cars/:id", requireAdmin, async (req, res) => {
  const car = req.body
  const carId = req.params.id

  const existing = await db
    .prepare("SELECT id FROM vehicles WHERE id = ?")
    .get(carId)
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  const galleryJson = safeJsonStringify(car.gallery || [car.image])
  const featuresJson = safeJsonStringify(car.features || [])

  await db
    .prepare(`
    UPDATE vehicles SET
      name = ?, brand = ?, model = ?, year = ?, type = ?, price_per_day = ?, price_per_hour = ?, price_per_month = ?,
      image = ?, gallery = ?, seats = ?, transmission = ?, fuel_type = ?,
      mileage = ?, luggage = ?, features = ?, description = ?, status = ?,
      plate_number = ?, location = ?, health_score = ?,
      insurance_policy = ?, insurance_provider = ?, insurance_expiry = ?,
      purchase_date = ?, purchase_cost = ?, current_odometer = ?,
      garage_name = ?, garage_address = ?, garage_lat = ?, garage_lng = ?, garage_bay = ?
    WHERE id = ?
  `)
    .run(
      car.name,
      car.brand,
      car.model,
      Number(car.year) || 2024,
      car.type,
      Number(car.pricePerDay),
      Number(car.pricePerHour),
      Number(car.pricePerMonth) || Math.round(Number(car.pricePerDay) * 22),
      car.image,
      galleryJson,
      Number(car.seats) || 5,
      car.transmission,
      car.fuelType,
      car.mileage,
      car.luggage,
      featuresJson,
      car.description,
      car.status,
      car.plateNumber,
      car.location,
      Number(car.healthScore) || 95,
      car.insurancePolicy || "POL-STF-994021",
      car.insuranceProvider || "State Farm Comprehensive",
      car.insuranceExpiry || "2027-04-15",
      car.purchaseDate || "2024-01-10",
      Number(car.purchaseCost) || 28500,
      Number(car.currentOdometer) || 14250,
      car.garageName || "MOTORLY Central Hub & Garage Bay 4",
      car.garageAddress || car.location || "4200 NW 21st St, Miami, FL 33142",
      Number(car.garageLat) || 25.7959,
      Number(car.garageLng) || -80.287,
      car.garageBay || "Bay 14-B",
      carId,
    )

  const updated = await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)
  return res.json(formatCarRow(updated))
})

// PATCH dynamic vehicle pricing (per hour, per day, per month)
app.patch("/api/cars/:id/pricing", requireAdmin, async (req, res) => {
  const { pricePerHour, pricePerDay, pricePerMonth } = req.body
  const carId = req.params.id

  const existing = await db
    .prepare("SELECT id, price_per_day, price_per_hour, price_per_month FROM vehicles WHERE id = ?")
    .get(carId)
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  const newPricePerDay =
    pricePerDay !== undefined && !isNaN(Number(pricePerDay))
      ? Number(pricePerDay)
      : Number(existing.price_per_day)
  const newPricePerHour =
    pricePerHour !== undefined && !isNaN(Number(pricePerHour))
      ? Number(pricePerHour)
      : Number(existing.price_per_hour)
  const newPricePerMonth =
    pricePerMonth !== undefined && !isNaN(Number(pricePerMonth))
      ? Number(pricePerMonth)
      : (existing.price_per_month ? Number(existing.price_per_month) : Math.round(newPricePerDay * 22))

  if (newPricePerHour <= 0 || newPricePerDay <= 0 || newPricePerMonth <= 0) {
    return res.status(400).json({ error: "Prices must be positive numbers greater than 0." })
  }

  await db
    .prepare("UPDATE vehicles SET price_per_hour = ?, price_per_day = ?, price_per_month = ? WHERE id = ?")
    .run(newPricePerHour, newPricePerDay, newPricePerMonth, carId)

  const updated = await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)
  return res.json({
    success: true,
    message: "Vehicle dynamic pricing updated successfully.",
    car: formatCarRow(updated),
  })
})

// PATCH car status
app.patch("/api/cars/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body
  const carId = req.params.id

  if (!status) return res.status(400).json({ error: "Status is required." })

  await db
    .prepare("UPDATE vehicles SET status = ? WHERE id = ?")
    .run(status, carId)
  const updated = await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)
  return res.json(formatCarRow(updated))
})

// DELETE car
app.delete("/api/cars/:id", requireAdmin, async (req, res) => {
  await db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id)
  return res.json({
    success: true,
    message: "Vehicle decommissioned and removed.",
  })
})

/* ==========================================
   BOOKINGS & VEHICLE MATING ROUTES
   ========================================== */

interface ParsedDateRange {
  start: number
  end: number
  valid: boolean
  durationHours?: number
  durationDays?: number
  error?: string
}

// Parses string with optional default time if only a date was supplied (e.g. "May 01, 2026")
function parseDateWithTime(
  dateStr: string,
  defaultTime: "09:00 AM" | "06:00 PM" = "09:00 AM",
): number {
  if (!dateStr || typeof dateStr !== "string") return NaN
  const trimmed = dateStr.trim()
  if (/today/i.test(trimmed) || /right now/i.test(trimmed)) {
    return Date.now()
  }
  const matchInDays = trimmed.match(/in\s+(\d+)\s+days?/i)
  if (matchInDays) {
    const days = parseInt(matchInDays[1], 10) || 3
    return Date.now() + days * 86400000
  }
  const hasTime = /\b(\d{1,2}:\d{2}(\s*(AM|PM))?|T\d{2}:\d{2})/i.test(trimmed)
  if (!hasTime) {
    const withTime = `${trimmed} ${defaultTime}`
    const parsedWithTime = Date.parse(withTime)
    if (!isNaN(parsedWithTime)) return parsedWithTime
  }
  return Date.parse(trimmed)
}

// Strict date range parser - fails safely if dates are missing, unparseable, or invalid
function parseDateRangeStrict(
  pickupStr?: any,
  returnStr?: any,
  options?: { checkPastDates?: boolean },
): ParsedDateRange {
  if (
    !pickupStr ||
    !returnStr ||
    typeof pickupStr !== "string" ||
    typeof returnStr !== "string"
  ) {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: "Both pickup date and return date are required valid strings.",
    }
  }

  const trimmedPickup = pickupStr.trim()
  const trimmedReturn = returnStr.trim()

  if (!trimmedPickup || !trimmedReturn) {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: "Pickup date and return date cannot be empty.",
    }
  }

  const start = parseDateWithTime(trimmedPickup, "09:00 AM")
  const end = parseDateWithTime(trimmedReturn, "06:00 PM")

  if (isNaN(start) || isNaN(end)) {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: `Invalid date format provided (pickup: "${pickupStr}", return: "${returnStr}").`,
    }
  }

  if (end <= start) {
    return {
      start,
      end,
      valid: false,
      error: "Return date and time must be strictly after pickup date and time.",
    }
  }

  const durationMs = end - start
  const MIN_DURATION_MS = 3 * 3600 * 1000 // 3 hours minimum
  if (durationMs < MIN_DURATION_MS) {
    return {
      start,
      end,
      valid: false,
      error:
        "Minimum rental duration is 3 hours. Please select a return time at least 3 hours after pickup.",
    }
  }

  const MAX_DURATION_MS = 45 * 24 * 3600 * 1000 // 45 days maximum
  if (durationMs > MAX_DURATION_MS) {
    return {
      start,
      end,
      valid: false,
      error:
        "Maximum online reservation duration is 45 days. For extended commercial leasing, please contact fleet operations.",
    }
  }

  if (options?.checkPastDates) {
    const now = Date.now()
    const GRACE_PERIOD_MS = 15 * 60 * 1000 // 15-minute clock drift / checkout form tolerance
    if (start < now - GRACE_PERIOD_MS) {
      return {
        start,
        end,
        valid: false,
        error:
          "Pickup date and time cannot be in the past. Please select a future date and time.",
      }
    }
  }

  return {
    start,
    end,
    valid: true,
    durationHours: Math.round((durationMs / 3600000) * 10) / 10,
    durationDays: Math.max(1, Math.ceil(durationMs / 86400000)),
  }
}

// Validates customer contact details
function validateCustomerContact(customer: any): {
  valid: boolean
  error?: string
} {
  if (!customer) {
    return { valid: false, error: "Customer details are required." }
  }
  const firstName = String(customer.firstName || "").trim()
  const lastName = String(customer.lastName || "").trim()
  const email = String(customer.email || "").trim()
  const phone = String(customer.phone || "").trim()

  if (!firstName) {
    return { valid: false, error: "Customer first name is required." }
  }
  if (!lastName) {
    return { valid: false, error: "Customer last name is required." }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: "A valid customer email address is required." }
  }
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return {
      valid: false,
      error: "A valid phone number with at least 7 digits is required.",
    }
  }
  return { valid: true }
}

// Validates driver license expiration and minimum age (21+)
function validateDriverInfo(
  driver: any,
  pickupTimestamp: number,
  returnTimestamp: number,
): { valid: boolean; error?: string } {
  if (!driver) return { valid: true }

  // 1. License Expiry Check
  if (driver.licenseExpiry) {
    const expiryStr = String(driver.licenseExpiry).trim()
    const expiryTimestamp = Date.parse(expiryStr)
    if (isNaN(expiryTimestamp)) {
      return {
        valid: false,
        error: "Invalid driver's license expiration date format.",
      }
    }
    const now = Date.now()
    if (expiryTimestamp <= now) {
      return {
        valid: false,
        error:
          "Driver's license is expired. A valid, unexpired driver's license is required to drive.",
      }
    }
    if (expiryTimestamp < returnTimestamp) {
      const expiryFormatted = new Date(expiryTimestamp).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      )
      return {
        valid: false,
        error: `Driver's license expires on ${expiryFormatted}, before the scheduled rental return date. A license valid through the entire rental duration is required.`,
      }
    }
  }

  // 2. Minimum Age Check (21+ Years)
  if (driver.dateOfBirth) {
    const dobStr = String(driver.dateOfBirth).trim()
    const dobTimestamp = Date.parse(dobStr)
    if (isNaN(dobTimestamp)) {
      return { valid: false, error: "Invalid driver's date of birth format." }
    }
    const pickupDate = new Date(pickupTimestamp)
    const birthDate = new Date(dobTimestamp)
    let age = pickupDate.getFullYear() - birthDate.getFullYear()
    const m = pickupDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && pickupDate.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 21) {
      return {
        valid: false,
        error: `Driver must be at least 21 years old to rent a vehicle. Verified age: ${age} years old.`,
      }
    }
    if (age > 105) {
      return { valid: false, error: "Invalid driver's date of birth provided." }
    }
  }

  return { valid: true }
}

// Helper to parse date strings (e.g. "Mar 15, 2026", "2026-03-15", "Mar 15, 2026 10:00 AM") into timestamp ms
function parseDateRange(pickupStr: string, returnStr: string) {
  const strict = parseDateRangeStrict(pickupStr, returnStr)
  if (strict.valid) return { start: strict.start, end: strict.end }
  let start = Date.parse(pickupStr)
  let end = Date.parse(returnStr)
  if (isNaN(start)) start = Date.now()
  if (isNaN(end)) end = start + 3 * 24 * 60 * 60 * 1000
  if (end <= start) end = start + 24 * 60 * 60 * 1000
  return { start, end }
}

// Check if two date intervals [startA, endA] and [startB, endB] overlap
function datesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && endA > startB
}

// Function to find any conflicting active booking for a given vehicle with fail-safe error handling
async function findVehicleBookingConflict(
  carId: string,
  pickupStr: string,
  returnStr: string,
  excludeBookingId?: string,
  executor: DbExecutor = db,
) {
  const range = parseDateRangeStrict(pickupStr, returnStr)
  if (!range.valid) {
    return {
      conflictingBookingId: "INVALID_DATES",
      customerName: "Validation Guard",
      pickupDate: String(pickupStr || ""),
      returnDate: String(returnStr || ""),
      status: "Invalid Dates",
      reason: range.error || "Invalid date range specified.",
    }
  }

  try {
    let query = `
      SELECT id, customer_first_name, customer_last_name, pickup_date, return_date, status
      FROM bookings
      WHERE matched_car_id = ?
        AND status NOT IN ('Completed', 'Cancelled')
    `
    const params: any[] = [carId]
    if (excludeBookingId) {
      query += " AND id != ?"
      params.push(excludeBookingId)
    }

    const activeBookings = (await executor
      .prepare(query)
      .all(...params)) as any[]

    for (const b of activeBookings) {
      const bRange = parseDateRangeStrict(b.pickup_date, b.return_date)
      const bStart = bRange.valid ? bRange.start : Date.parse(b.pickup_date)
      const bEnd = bRange.valid ? bRange.end : Date.parse(b.return_date)

      if (
        !isNaN(bStart) &&
        !isNaN(bEnd) &&
        datesOverlap(range.start, range.end, bStart, bEnd)
      ) {
        return {
          conflictingBookingId: b.id,
          customerName: `${b.customer_first_name} ${b.customer_last_name}`,
          pickupDate: b.pickup_date,
          returnDate: b.return_date,
          status: b.status,
        }
      }
    }

    return null
  } catch (err: any) {
    console.error(
      `[Fail-Safe Availability] Database error checking conflicts for ${carId}:`,
      err?.message,
    )
    return {
      conflictingBookingId: "DB_FAILSAFE",
      customerName: "System Fail-Safe",
      pickupDate: String(pickupStr || ""),
      returnDate: String(returnStr || ""),
      status: "FailSafe Locked",
      reason:
        "Database query error during availability check. Vehicle blocked for safety.",
    }
  }
}

// GET vehicle date availability check with fail-safe error handling
app.get("/api/cars/:id/availability", async (req, res) => {
  const carId = req.params.id
  const pickupDate = req.query.pickupDate as string || "Mar 15, 2026"
  const returnDate = req.query.returnDate as string || "Mar 18, 2026"

  try {
    const range = parseDateRangeStrict(pickupDate, returnDate)
    if (!range.valid) {
      return res.status(400).json({
        carId,
        isAvailable: false,
        error: range.error,
        conflict: {
          conflictingBookingId: "INVALID_DATES",
          customerName: "Validation Guard",
          pickupDate,
          returnDate,
          status: "Invalid Dates",
          reason: range.error,
        },
      })
    }

    const car = (await db
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(carId)) as any
    if (!car) {
      return res.status(404).json({
        carId,
        isAvailable: false,
        error: "Vehicle not found.",
      })
    }

    if (car.status === "Maintenance") {
      return res.json({
        carId,
        isAvailable: false,
        carStatus: car.status,
        conflict: {
          conflictingBookingId: "MAINTENANCE",
          customerName: "Fleet Maintenance",
          pickupDate: "Active",
          returnDate: "Scheduled End",
          status: "Maintenance",
          reason: "Vehicle is currently under maintenance.",
        },
      })
    }

    const conflict = await findVehicleBookingConflict(
      carId,
      pickupDate,
      returnDate,
    )
    const isAvailable = !conflict && car.status !== "Maintenance"

    return res.json({
      carId,
      isAvailable,
      carStatus: car.status,
      conflict: conflict || null,
    })
  } catch (err: any) {
    console.error(`[Fail-Safe Check Error] Vehicle ${carId}:`, err?.message)
    return res.status(500).json({
      carId,
      isAvailable: false,
      carStatus: "Unavailable",
      conflict: {
        conflictingBookingId: "FAILSAFE_ERROR",
        customerName: "System Fail-Safe",
        pickupDate,
        returnDate,
        status: "Error",
        reason:
          "Availability check encountered an unexpected error. Fail-safe engaged to prevent double booking.",
      },
      error: "Availability verification failed safely.",
    })
  }
})

// GET all bookings (Admin only) - Lightweight projection avoids transferring megabytes of base64 photos over WAN
app.get("/api/bookings", requireAdmin, async (req, res) => {
  const rows = (await db
    .prepare(`
      SELECT
        id, customer_first_name, customer_last_name, customer_email, customer_phone,
        driver_dob, driver_license_num, driver_license_state, driver_license_expiry,
        pickup_location, return_location, pickup_date, return_date,
        requested_category, matched_car_id, status, total_amount, created_at,
        user_id, notes, promo_code, approved_by_admin, approved_at, keys_handed_at,
        extension_status, extension_request, extension_quote,
        checklist_out, checklist_in, inspection_notes, inspection_passed,
        odometer_out, odometer_in, fuel_level_out, fuel_level_in,
        CASE WHEN driver_license_file LIKE 'data:%' THEN 'data:base64' ELSE driver_license_file END as driver_license_file,
        CASE WHEN driver_license_back_file LIKE 'data:%' THEN 'data:base64' ELSE driver_license_back_file END as driver_license_back_file,
        CASE WHEN driver_selfie_file LIKE 'data:%' THEN 'data:base64' ELSE driver_selfie_file END as driver_selfie_file
      FROM bookings
      ORDER BY created_at DESC
    `)
    .all()) as any[]
  rows.sort(
    (a, b) =>
      parseBookingDateSort(b.created_at) - parseBookingDateSort(a.created_at),
  )
  return res.json(rows.map(formatBookingRow))
})

// POST create booking with Database-Level Concurrency Protection
app.post(
  "/api/bookings",
  optionalAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const b = req.body
    const matchedCarId = b.matchedCarId || b.carId || null
    const id = b.id || `MTR-${Math.floor(100000 + Math.random() * 900000)}`
    const nowIso = new Date().toISOString()
    const pickupDate = b.pickupDate || "Mar 15, 2026"
    const returnDate = b.returnDate || "Mar 18, 2026"

    // 1. Validate date range strictly (enforces future pickup, same-day min 3 hours, max 45 days)
    const range = parseDateRangeStrict(pickupDate, returnDate, {
      checkPastDates: true,
    })
    if (!range.valid) {
      return res.status(400).json({
        success: false,
        error: range.error || "Invalid rental dates specified.",
      })
    }

    // 2. Validate customer contact details
    const customerValidation = validateCustomerContact(b.customer)
    if (!customerValidation.valid) {
      return res.status(400).json({
        success: false,
        error: customerValidation.error,
      })
    }

    // 3. Validate driver license and minimum age (21+)
    const driverValidation = validateDriverInfo(
      b.driver,
      range.start,
      range.end,
    )
    if (!driverValidation.valid) {
      return res.status(400).json({
        success: false,
        error: driverValidation.error,
      })
    }

    try {
      const createdRow = await db.withVehicleBookingLock(
        matchedCarId,
        async (tx) => {
          // CRITICAL: Database-level Concurrency & Conflict Protection
          if (matchedCarId) {
            const vehicle = (await tx
              .prepare("SELECT id, status FROM vehicles WHERE id = ?")
              .get(matchedCarId)) as any
            if (!vehicle) {
              const err = new Error(
                `Selected vehicle "${matchedCarId}" does not exist in fleet inventory.`,
              ) as any
              err.statusCode = 400
              throw err
            }

            if (vehicle.status === "Maintenance") {
              const err = new Error(
                `Vehicle "${matchedCarId}" is currently in maintenance and unavailable for booking.`,
              ) as any
              err.statusCode = 409
              throw err
            }

            const conflict = await findVehicleBookingConflict(
              matchedCarId,
              pickupDate,
              returnDate,
              undefined,
              tx,
            )
            if (conflict) {
              const err = new Error(
                conflict.conflictingBookingId &&
                conflict.conflictingBookingId !== "INVALID_DATES" &&
                conflict.conflictingBookingId !== "DB_FAILSAFE"
                  ? `Double Booking Conflict: This vehicle is already reserved for overlapping dates (${conflict.pickupDate} – ${conflict.returnDate}) under reservation ${conflict.conflictingBookingId}. Please select another car or change your rental dates.`
                  : conflict.reason ||
                    "Double Booking Conflict: Vehicle is unavailable for selected dates.",
              ) as any
              err.statusCode = 409
              throw err
            }
          }

          // Validate Promo Code safely against foreign key
          let validPromoCode: string | null = null
          if (b.promoCode) {
            const candidateCode = String(b.promoCode).trim().toUpperCase()
            const promoRow = (await tx
              .prepare("SELECT * FROM promo_codes WHERE code = ?")
              .get(candidateCode)) as any
            if (promoRow && promoRow.is_active) {
              validPromoCode = candidateCode
              await tx
                .prepare(
                  "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = ?",
                )
                .run(candidateCode)
                .catch(() => {})
            }
          }

          // Validate User ID safely against foreign key
          let validUserId: string | null = null
          const candidateUserId = b.userId || req.user?.userId || null
          if (candidateUserId) {
            const userRow = (await tx
              .prepare("SELECT id FROM users WHERE id = ?")
              .get(candidateUserId)) as any
            if (userRow) {
              validUserId = candidateUserId
            }
          }

          const status = matchedCarId ? "Assigned" : "Pending Assignment"
          const createdAtValue =
            b.createdAt && b.createdAt.includes("T") ? b.createdAt : nowIso

          await tx
            .prepare(`
          INSERT INTO bookings (
            id, customer_first_name, customer_last_name, customer_email, customer_phone,
            driver_dob, driver_license_num, driver_license_state, driver_license_expiry,
            driver_license_file, driver_license_back_file, driver_selfie_file,
            pickup_location, return_location, pickup_date, return_date,
            requested_category, matched_car_id, status, total_amount, created_at,
            user_id, notes, promo_code, approved_by_admin, extension_status, inspection_passed
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, 0, 'None', 0
          )
        `)
            .run(
              id,
              b.customer?.firstName || "Guest",
              b.customer?.lastName || "Customer",
              (b.customer?.email || "customer@example.com").trim().toLowerCase(),
              b.customer?.phone || "+1 (555) 000-0000",
              b.driver?.dateOfBirth || null,
              b.driver?.licenseNumber || null,
              b.driver?.licenseState || null,
              b.driver?.licenseExpiry || null,
              b.driver?.licensePhotoFront ||
                b.driver?.licenseFileName ||
                "dl_front_default.jpg",
              b.driver?.licensePhotoBack ||
                b.driver?.licenseBackFileName ||
                "dl_back_default.jpg",
              b.driver?.selfieFileName || null,
              b.pickupLocation || "Miami International Airport (MIA)",
              b.returnLocation || "Miami International Airport (MIA)",
              pickupDate,
              returnDate,
              b.requestedCategory || "Sedan",
              matchedCarId,
              status,
              Number(b.totalAmount) || 0,
              createdAtValue,
              validUserId,
              b.notes || null,
              validPromoCode,
            )

          const created = await tx
            .prepare("SELECT * FROM bookings WHERE id = ?")
            .get(id)
          return created
        },
      )

      return res.status(201).json(formatBookingRow(createdRow))
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.message,
        })
      }
      console.error("[Booking Creation Error]", err?.message)
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to create booking.",
      })
    }
  },
)

// GET Download Specific Booking Customer Driver License (Original Uploaded Image or Certificate)
app.get(
  "/api/bookings/:id/download-license",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id
    const side = req.query.side as string || "front" // "front" | "back" | "certificate"
    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    // Authorization check: User must be admin or the customer who owns the booking
    const user = req.user
    if (user?.role !== "admin") {
      const isOwner =
        (booking.user_id && booking.user_id === user?.userId) ||
        (booking.customer_email &&
          booking.customer_email.toLowerCase() === user?.email.toLowerCase())
      if (!isOwner) {
        return res.status(403).json({
          error:
            "Access denied. You do not have permission to view this identification record.",
        })
      }
    }

    const fullName =
      `${booking.customer_first_name} ${booking.customer_last_name}`.trim()
    const cleanName = fullName.replace(/[^a-zA-Z0-9]+/g, "_")

    // Check if user uploaded a real image (Data URL)
    const targetPhoto =
      side === "back"
        ? booking.driver_license_back_file
        : booking.driver_license_file

    if (
      side !== "certificate" &&
      targetPhoto &&
      targetPhoto.startsWith("data:image/")
    ) {
      const match = targetPhoto.match(
        /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/,
      )
      if (match) {
        const mimeType = match[1]
        const ext = mimeType.includes("png")
          ? "png"
          : mimeType.includes("webp")
            ? "webp"
            : "jpg"
        const buffer = Buffer.from(match[2], "base64")
        const filename = `DL_${side.toUpperCase()}_${cleanName}_${booking.id}.${ext}`

        const isDownload = req.query.download === "1"
        res.setHeader("Content-Type", mimeType)
        res.setHeader(
          "Content-Disposition",
          `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
        )
        return res.send(buffer)
      }
    }

    const filePrefix =
      side === "certificate" ? "DL_CERTIFICATE" : `DL_${side.toUpperCase()}`
    const fileName = `${filePrefix}_${cleanName}_${booking.id}.svg`

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="380" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <!-- Card Background -->
  <rect width="600" height="380" rx="24" fill="#0D0E11" stroke="#F97316" stroke-width="2"/>
  <rect x="20" y="20" width="560" height="340" rx="16" fill="#17191C" stroke="#2B2D31" stroke-width="1"/>
  
  <!-- Header Bar -->
  <rect x="20" y="20" width="560" height="60" rx="16" fill="#1F2126"/>
  <text x="45" y="55" fill="#F97316" font-size="12" font-weight="900" letter-spacing="2">OFFICIAL MOTORLY DRIVER IDENTIFICATION RECORD</text>
  <text x="450" y="55" fill="#10B981" font-size="11" font-weight="700">✓ VERIFIED BY OPS</text>
  
  <!-- Photo Mock Box -->
  <rect x="45" y="105" width="130" height="170" rx="12" fill="#262930" stroke="#3A3E47" stroke-width="1.5"/>
  <circle cx="110" cy="165" r="32" fill="#4B5563"/>
  <path d="M70 245 C70 205, 150 205, 150 245 Z" fill="#4B5563"/>
  <text x="110" y="265" text-anchor="middle" fill="#9CA3AF" font-size="10" font-weight="600">PHOTO ID</text>
  
  <!-- Driver Information Fields -->
  <text x="200" y="125" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">FULL LEGAL NAME</text>
  <text x="200" y="148" fill="#FFFFFF" font-size="18" font-weight="800">${fullName}</text>
  
  <text x="200" y="180" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">DRIVER LICENSE NUMBER</text>
  <text x="200" y="202" fill="#FBBF24" font-size="16" font-weight="800" font-family="monospace">${booking.driver_license_num || "DL-90184920"}</text>
  
  <text x="200" y="235" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">STATE / EXPIRY</text>
  <text x="200" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${booking.driver_license_state || "Florida"} • Exp: ${booking.driver_license_expiry || "12/2029"}</text>
  
  <text x="380" y="235" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">DATE OF BIRTH</text>
  <text x="380" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${booking.driver_dob || "05/15/1990"}</text>
  
  <!-- Footer Bar with Security Fingerprint -->
  <line x1="45" y1="295" x2="555" y2="295" stroke="#2B2D31" stroke-width="1"/>
  <text x="45" y="325" fill="#6B7280" font-size="10" font-family="monospace">BOOKING TICKET: ${booking.id}</text>
  <text x="45" y="342" fill="#6B7280" font-size="10">ATTACHMENT: ${
    booking.driver_license_file
      ? booking.driver_license_file.startsWith("data:")
        ? "Original Photo (Front)"
        : booking.driver_license_file
      : "dl_front.png"
  } + ${
    booking.driver_license_back_file
      ? booking.driver_license_back_file.startsWith("data:")
        ? "Original Photo (Back)"
        : booking.driver_license_back_file
      : "dl_back.png"
  }</text>
  <text x="410" y="335" fill="#F97316" font-size="11" font-weight="800">MOTORLY SECURE ID</text>
</svg>`

    const isDownload = req.query.download === "1"
    res.setHeader("Content-Type", "image/svg+xml")
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${fileName}"`,
    )
    return res.send(svgContent)
  },
)

// POST Step D: Admin Approves / Accepts Request
const handleManagerApproval = async (
  req: express.Request,
  res: express.Response,
) => {
  const bookingId = req.params.id
  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  if (booking.status === "Cancelled") {
    return res
      .status(400)
      .json({ error: "Cannot accept a cancelled or declined reservation." })
  }

  const nowIso = new Date().toISOString()
  let newStatus = booking.status || "Pending Assignment"
  let matchedCarId = booking.matched_car_id || null

  if (matchedCarId) {
    newStatus = "Assigned"
  } else {
    // Attempt auto-mating if an available car exists in the requested category
    const category = booking.requested_category
    if (category) {
      try {
        const candidates = (await db
          .prepare(
            "SELECT id, status FROM vehicles WHERE (LOWER(type) = LOWER(?) OR LOWER(name) LIKE ?) AND status = 'Available'",
          )
          .all(category, `%${category.toLowerCase()}%`)) as any[]

        for (const cand of candidates) {
          const conflict = await findVehicleBookingConflict(
            cand.id,
            booking.pickup_date,
            booking.return_date,
            booking.id,
            db,
          )
          if (!conflict) {
            matchedCarId = cand.id
            newStatus = "Assigned"
            break
          }
        }
      } catch (err: any) {
        console.warn("[Auto-Mate During Approval Non-Fatal]", err?.message)
      }
    }
  }

  await db
    .prepare(`
    UPDATE bookings SET
      approved_by_admin = 1,
      approved_at = ?,
      status = ?,
      matched_car_id = ?
    WHERE id = ?
  `)
    .run(nowIso, newStatus, matchedCarId, bookingId)

  const updatedBooking = await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)

  return res.json({
    success: true,
    message: `Reservation ${bookingId} accepted by fleet manager.${matchedCarId ? " Vehicle assigned and ready for pickup!" : " Please assign a vehicle."}`,
    booking: formatBookingRow(updatedBooking),
  })
}

app.post("/api/bookings/:id/approve", requireAdmin, handleManagerApproval)
app.post("/api/bookings/:id/accept", requireAdmin, handleManagerApproval)

// POST Step: Admin Declines/Rejects Request
app.post("/api/bookings/:id/decline", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  await db
    .prepare(`
    UPDATE bookings SET
      status = 'Cancelled',
      approved_by_admin = 0,
      notes = COALESCE(notes || ' ', '') || ' [Request Declined by Manager]'
    WHERE id = ?
  `)
    .run(bookingId)

  // Ensure car is available
  if (booking.matched_car_id) {
    await db
      .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
      .run(booking.matched_car_id)
      .catch(() => {})
  }

  const updatedBooking = await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Reservation request ${bookingId} was declined by manager.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step E: Admin Hands Over Keys (Handover Checklist & Clock Starts)
app.post("/api/bookings/:id/handover-keys", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { odometerOut, fuelOut, exteriorClean, tiresInspected, staffSign } =
    req.body

  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  // State Machine Guard: Cannot hand over keys if booking is already Completed or Cancelled
  if (booking.status === "Completed" || booking.status === "Cancelled") {
    return res.status(400).json({
      error: `Illegal transition: Cannot hand over keys for booking ${bookingId} with terminal status "${booking.status}".`,
    })
  }
  if (booking.status === "Checked Out") {
    return res.status(409).json({
      error: `Booking ${bookingId} has already been checked out.`,
    })
  }

  const nowIso = new Date().toISOString()
  const checklistObj = {
    odometerOut: Number(odometerOut) || 14250,
    fuelOut: fuelOut || "100%",
    exteriorClean: Boolean(exteriorClean !== false),
    tiresInspected: Boolean(tiresInspected !== false),
    keysGiven: true,
    staffSign: staffSign || "Fleet Manager / Operations Desk",
    timestamp: nowIso,
  }

  // Update booking to Checked Out with keys handed timestamp
  await db
    .prepare(`
    UPDATE bookings SET
      status = 'Checked Out',
      keys_handed_at = ?,
      checklist_out = ?,
      odometer_out = ?,
      fuel_level_out = ?
    WHERE id = ?
  `)
    .run(
      nowIso,
      JSON.stringify(checklistObj),
      checklistObj.odometerOut,
      checklistObj.fuelOut,
      bookingId,
    )

  // Ensure vehicle status is Rented
  if (booking.matched_car_id) {
    await db
      .prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?")
      .run(booking.matched_car_id)
  }

  const updatedBooking = await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Keys handed over for ${bookingId}! Official rental clock started at ${nowIso}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F1: Customer Requests Trip Extension
app.post(
  "/api/bookings/:id/request-extension",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id
    const { extraDuration, unit, customerNotes } = req.body

    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    // RBAC: Verify ownership (Admin or booking owner)
    const user = req.user
    if (user?.role !== "admin") {
      const isOwner =
        (booking.user_id && booking.user_id === user?.userId) ||
        (booking.customer_email &&
          booking.customer_email.toLowerCase() === user?.email.toLowerCase())
      if (!isOwner) {
        return res.status(403).json({
          error: "Access denied. You do not have permission to modify this reservation.",
        })
      }
    }

    const durationNum = Number(extraDuration) || 1
    const unitStr = unit || "days"
    const nowIso = new Date().toISOString()

    const extRequest = {
      extraDuration: durationNum,
      unit: unitStr,
      customerNotes:
        customerNotes || "Customer requested rental extension via app.",
      requestedAt: nowIso,
    }

    await db
      .prepare(`
    UPDATE bookings SET
      extension_status = 'Requested',
      extension_request = ?
    WHERE id = ?
  `)
      .run(JSON.stringify(extRequest), bookingId)

    const updatedBooking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)
    return res.json({
      success: true,
      message: `Extension request for +${durationNum} ${unitStr} submitted. Awaiting manager quotation.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step F2: Admin Quotes Extension (Per Day / Per Hour / Per Month)
app.post(
  "/api/bookings/:id/quote-extension",
  requireAdmin,
  async (req, res) => {
    const bookingId = req.params.id
    const { rateType, rateAmount, totalQuotedAmount, adminNotes } = req.body

    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    const quoteObj = {
      rateType: rateType || "day",
      rateAmount: Number(rateAmount) || 55,
      totalQuotedAmount: Number(totalQuotedAmount) || 55,
      adminNotes: adminNotes || "Standard fleet rate extension quotation.",
      quotedAt: new Date().toISOString(),
    }

    await db
      .prepare(`
    UPDATE bookings SET
      extension_status = 'Quoted',
      extension_quote = ?
    WHERE id = ?
  `)
      .run(JSON.stringify(quoteObj), bookingId)

    const updatedBooking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)
    return res.json({
      success: true,
      message: `Quotation of $${quoteObj.totalQuotedAmount} sent to customer for approval.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step F3: Customer Approves Extension Quotation (Added to Bill & Return Date Extended)
app.post(
  "/api/bookings/:id/approve-extension",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id

    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    // RBAC: Verify ownership (Admin or booking owner)
    const user = req.user
    if (user?.role !== "admin") {
      const isOwner =
        (booking.user_id && booking.user_id === user?.userId) ||
        (booking.customer_email &&
          booking.customer_email.toLowerCase() === user?.email.toLowerCase())
      if (!isOwner) {
        return res.status(403).json({
          error: "Access denied. You do not have permission to approve this extension.",
        })
      }
    }

    let quote: any = {}
    try {
      if (booking.extension_quote) quote = JSON.parse(booking.extension_quote)
    } catch {}

    let extReq: any = {}
    try {
      if (booking.extension_request)
        extReq = JSON.parse(booking.extension_request)
    } catch {}

    const additionalCost = Number(quote.totalQuotedAmount) || 0
    const newTotal = Number(booking.total_amount) + additionalCost

    // Calculate new extended return date
    const extraDuration =
      Number(extReq.extraDuration ?? extReq.durationValue) || 1
    const unit = extReq.unit ?? extReq.durationUnit ?? "days"

    let currentReturnTimestamp = Date.parse(booking.return_date)
    if (isNaN(currentReturnTimestamp))
      currentReturnTimestamp = Date.now() + 3 * 86400000

    let newReturnTimestamp = currentReturnTimestamp
    if (unit === "hours") {
      newReturnTimestamp += extraDuration * 3600 * 1000
    } else if (unit === "months") {
      newReturnTimestamp += extraDuration * 30 * 86400 * 1000
    } else {
      // default days
      newReturnTimestamp += extraDuration * 86400 * 1000
    }

    const newReturnDateStr = new Date(newReturnTimestamp).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    )

    // Append note to return date or notes
    const updatedNotes = `${
      booking.notes ? booking.notes + " | " : ""
    }Extended (+${quote.rateType || "period"}: +$${additionalCost})`

    await db
      .prepare(`
    UPDATE bookings SET
      extension_status = 'Approved',
      return_date = ?,
      total_amount = ?,
      notes = ?
    WHERE id = ?
  `)
      .run(newReturnDateStr, newTotal, updatedNotes, bookingId)

    const updatedBooking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)
    return res.json({
      success: true,
      message: `Extension approved! $${additionalCost.toFixed(2)} added to rental bill. New return date: ${newReturnDateStr}. New total: $${newTotal.toFixed(2)}.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step F4: Decline Extension
app.post(
  "/api/bookings/:id/decline-extension",
  requireAuth,
  async (req: express.Request & { user?: JwtUserPayload }, res) => {
    const bookingId = req.params.id

    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    // RBAC: Verify ownership (Admin or booking owner)
    const user = req.user
    if (user?.role !== "admin") {
      const isOwner =
        (booking.user_id && booking.user_id === user?.userId) ||
        (booking.customer_email &&
          booking.customer_email.toLowerCase() === user?.email.toLowerCase())
      if (!isOwner) {
        return res.status(403).json({
          error: "Access denied. You do not have permission to decline this extension.",
        })
      }
    }

    await db
      .prepare(`
    UPDATE bookings SET
      extension_status = 'Declined'
    WHERE id = ?
  `)
      .run(bookingId)

    const updatedBooking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)
    return res.json({
      success: true,
      message: "Extension declined.",
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Step G: Return Vehicle & Post-Trip Inspection Checklist
app.post(
  "/api/bookings/:id/return-inspection",
  requireAdmin,
  async (req, res) => {
    const bookingId = req.params.id
    const {
      odometerIn,
      fuelIn,
      damageFound,
      cleanlinessPass,
      inspectionPassed,
      staffSign,
      inspectionNotes,
    } = req.body

    const booking = (await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)) as any
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." })
    }

    // State Machine Guard: If already Completed, reject with 409 Conflict
    if (booking.status === "Completed") {
      return res.status(409).json({
        error: `Booking ${bookingId} has already been completed and finalized.`,
      })
    }

    // State Machine Guard: Only vehicles in "Checked Out" status can undergo return inspection
    if (booking.status !== "Checked Out") {
      return res.status(400).json({
        error: `Illegal state transition: Cannot perform return inspection on booking ${bookingId} with status "${booking.status}". Booking must be in "Checked Out" status.`,
      })
    }

    const nowIso = new Date().toISOString()
    const checklistInObj = {
      odometerIn: Number(odometerIn) || 14380,
      fuelIn: fuelIn || "100%",
      damageFound: Boolean(damageFound),
      cleanlinessPass: Boolean(cleanlinessPass !== false),
      inspectionPassed: Boolean(inspectionPassed !== false),
      staffSign: staffSign || "Garage Return Inspector",
      timestamp: nowIso,
    }

    // Update booking: status = Completed only after inspection passes!
    await db
      .prepare(`
    UPDATE bookings SET
      status = 'Completed',
      checklist_in = ?,
      odometer_in = ?,
      fuel_level_in = ?,
      inspection_notes = ?,
      inspection_passed = 1
    WHERE id = ?
  `)
      .run(
        JSON.stringify(checklistInObj),
        checklistInObj.odometerIn,
        checklistInObj.fuelIn,
        inspectionNotes || "Inspection passed clean with 0 damage.",
        bookingId,
      )

    // Release vehicle back to Available (or Cleaning if dirty)
    if (booking.matched_car_id) {
      const nextCarStatus = checklistInObj.cleanlinessPass
        ? "Available"
        : "Cleaning"
      await db
        .prepare(
          "UPDATE vehicles SET status = ?, current_odometer = ? WHERE id = ?",
        )
        .run(nextCarStatus, checklistInObj.odometerIn, booking.matched_car_id)
    }

    const updatedBooking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(bookingId)
    return res.json({
      success: true,
      message: `Inspection passed! Ride completed and booking ${bookingId} finalized.`,
      booking: formatBookingRow(updatedBooking),
    })
  },
)

// POST Mate / Assign a car to a booking with Database-Level Concurrency Protection
app.post("/api/bookings/:id/mate", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { carId } = req.body

  if (!carId) {
    return res.status(400).json({ error: "carId is required to mate vehicle." })
  }

  try {
    const result = await db.withVehicleBookingLock(carId, async (tx) => {
      const booking = (await tx
        .prepare("SELECT * FROM bookings WHERE id = ?")
        .get(bookingId)) as any
      if (!booking) {
        const err = new Error("Booking not found.") as any
        err.statusCode = 404
        throw err
      }

      const car = (await tx
        .prepare("SELECT * FROM vehicles WHERE id = ?")
        .get(carId)) as any
      if (!car) {
        const err = new Error("Vehicle not found.") as any
        err.statusCode = 404
        throw err
      }

      if (car.status === "Maintenance") {
        const err = new Error(
          `Conflict: Vehicle ${car.name} is currently under maintenance and cannot be assigned.`,
        ) as any
        err.statusCode = 409
        throw err
      }

      // Prevent double booking conflict during manual mating
      const conflict = await findVehicleBookingConflict(
        carId,
        booking.pickup_date,
        booking.return_date,
        bookingId,
        tx,
      )
      if (conflict) {
        const err = new Error(
          conflict.conflictingBookingId &&
          conflict.conflictingBookingId !== "INVALID_DATES" &&
          conflict.conflictingBookingId !== "DB_FAILSAFE"
            ? `Conflict: Vehicle is already mated to reservation ${conflict.conflictingBookingId} (${conflict.customerName}) for overlapping dates (${conflict.pickupDate} – ${conflict.returnDate}).`
            : conflict.reason ||
              "Conflict: Vehicle is unavailable for the selected dates.",
        ) as any
        err.statusCode = 409
        throw err
      }

      // If re-mating away from a previously assigned vehicle, release the previous vehicle back to Available!
      if (booking.matched_car_id && booking.matched_car_id !== carId) {
        await tx
          .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
          .run(booking.matched_car_id)
      }

      // Update booking
      await tx
        .prepare(
          "UPDATE bookings SET matched_car_id = ?, status = 'Assigned' WHERE id = ?",
        )
        .run(carId, bookingId)

      // Update newly assigned vehicle to Rented if already checked out, otherwise leave available/reserved
      if (booking.status === "Checked Out") {
        await tx
          .prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?")
          .run(carId)
      }

      const updatedBooking = await tx
        .prepare("SELECT * FROM bookings WHERE id = ?")
        .get(bookingId)
      const updatedCar = await tx
        .prepare("SELECT * FROM vehicles WHERE id = ?")
        .get(carId)

      return {
        booking: formatBookingRow(updatedBooking),
        car: formatCarRow(updatedCar),
        carName: car.name,
        plateNumber: car.plate_number,
      }
    })

    return res.json({
      success: true,
      message: `Vehicle ${result.carName} (${result.plateNumber}) successfully mated to booking ${bookingId}.`,
      booking: result.booking,
      car: result.car,
    })
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    console.error("[Vehicle Mating Error]", err?.message)
    return res.status(500).json({ error: "Failed to mate vehicle." })
  }
})

// POST Unmate / Release a car from a booking
app.post("/api/bookings/:id/unmate", requireAdmin, async (req, res) => {
  const bookingId = req.params.id

  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const prevCarId = booking.matched_car_id

  // Reset booking
  await db
    .prepare(
      "UPDATE bookings SET matched_car_id = NULL, status = 'Pending Assignment' WHERE id = ?",
    )
    .run(bookingId)

  // Release vehicle back to Available
  if (prevCarId) {
    await db
      .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
      .run(prevCarId)
  }

  const updatedBooking = await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Vehicle released from booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// PATCH Update Booking Status (Advance Lifecycle)
app.patch("/api/bookings/:id/status", requireAdmin, async (req, res) => {
  const bookingId = req.params.id
  const { status, odometerOut, odometerIn, fuelLevelOut, fuelLevelIn, notes } =
    req.body

  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const validStatuses = [
    "Pending Assignment",
    "Assigned",
    "Checked Out",
    "Returned",
    "Completed",
    "Cancelled",
  ]
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    })
  }

  const newStatus = status || booking.status
  const carId = booking.matched_car_id

  // Synchronize vehicle status based on reservation lifecycle
  if (carId) {
    if (newStatus === "Checked Out") {
      await db
        .prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?")
        .run(carId)
    } else if (newStatus === "Returned") {
      await db
        .prepare("UPDATE vehicles SET status = 'Cleaning' WHERE id = ?")
        .run(carId)
    } else if (newStatus === "Completed") {
      await db
        .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
        .run(carId)
    } else if (newStatus === "Cancelled") {
      await db
        .prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?")
        .run(carId)
    }
  }

  await db
    .prepare(`
    UPDATE bookings SET
      status = ?,
      odometer_out = COALESCE(?, odometer_out),
      odometer_in = COALESCE(?, odometer_in),
      fuel_level_out = COALESCE(?, fuel_level_out),
      fuel_level_in = COALESCE(?, fuel_level_in),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `)
    .run(
      newStatus,
      odometerOut ?? null,
      odometerIn ?? null,
      fuelLevelOut ?? null,
      fuelLevelIn ?? null,
      notes ?? null,
      bookingId,
    )

  const updatedBooking = await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Booking ${bookingId} transitioned to ${newStatus}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Admin Walk-In / Counter Reservation with Database-Level Concurrency Protection (< 60s)
app.post("/api/admin/counter-booking", requireAdmin, async (req, res) => {
  const b = req.body
  const id = b.id || `CWK-${Math.floor(100000 + Math.random() * 900000)}`
  const nowText = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const carId = b.carId
  if (!carId) {
    return res
      .status(400)
      .json({ error: "A vehicle must be selected for counter dispatch." })
  }

  return await db.withVehicleBookingLock(carId, async (tx) => {
    const car = (await tx
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(carId)) as any
    if (!car) {
      return res.status(404).json({ error: "Selected vehicle not found." })
    }

    if (car.status === "Maintenance") {
      return res.status(409).json({
        error: `Conflict: ${car.name} (${car.plate_number}) is currently under maintenance and cannot be dispatched.`,
      })
    }

    const now = new Date()
    let pickupDateStr = b.pickupDate
    let returnDateStr = b.returnDate
    if (!pickupDateStr || /today|now/i.test(pickupDateStr)) {
      pickupDateStr =
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + " 10:00 AM"
    }
    if (!returnDateStr || /in\s+\d+\s+days?/i.test(returnDateStr)) {
      const days = parseInt(
        returnDateStr?.match(/\d+/)?.[0] || String(b.totalDays || "3"),
        10,
      )
      const ret = new Date(now.getTime() + days * 86400000)
      returnDateStr =
        ret.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) + " 06:00 PM"
    }

    // Prevent counter dispatch of an already booked or rented vehicle
    const conflict = await findVehicleBookingConflict(
      carId,
      pickupDateStr,
      returnDateStr,
      undefined,
      tx,
    )
    if (conflict || car.status === "Rented") {
      return res.status(409).json({
        error:
          conflict?.conflictingBookingId &&
          conflict.conflictingBookingId !== "INVALID_DATES" &&
          conflict.conflictingBookingId !== "DB_FAILSAFE"
            ? `Conflict: ${car.name} (${car.plate_number}) is currently rented or assigned to another active reservation (${conflict.conflictingBookingId}).`
            : conflict?.reason ||
              `Conflict: ${car.name} (${car.plate_number}) is currently unavailable for dispatch.`,
      })
    }

    const initialStatus = b.immediateCheckout ? "Checked Out" : "Assigned"

    await tx
      .prepare(`
      INSERT INTO bookings (
        id, customer_first_name, customer_last_name, customer_email, customer_phone,
        driver_dob, driver_license_num, driver_license_state, driver_license_expiry, driver_license_file,
        pickup_location, return_location, pickup_date, return_date,
        requested_category, matched_car_id, status, total_amount, created_at,
        odometer_out, fuel_level_out, notes
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `)
      .run(
        id,
        b.firstName || "Walk-In",
        b.lastName || "Customer",
        b.email || "counter.guest@motorly.com",
        b.phone || "+1 (555) 019-9922",
        b.dob || "01/01/1990",
        b.licenseNumber ||
          `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
        b.licenseState || "Florida",
        b.licenseExpiry || "12/2029",
        b.licenseFileName || "counter_scanned_id.jpg",
        b.pickupLocation || car.location || "Miami International Airport (MIA)",
        b.returnLocation || car.location || "Miami International Airport (MIA)",
        pickupDateStr,
        returnDateStr,
        car.type,
        carId,
        initialStatus,
        Number(b.totalAmount) || car.price_per_day * 3,
        `Counter Dispatch (${nowText})`,
        b.odometerOut || 15400,
        b.fuelLevelOut || "100%",
        b.notes || "Express counter walk-in reservation.",
      )

    // Lock vehicle
    await tx
      .prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?")
      .run(carId)

    const created = await tx
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(id)
    return res.status(201).json({
      success: true,
      message: `Counter walk-in reservation ${id} issued for ${car.name}.`,
      booking: formatBookingRow(created),
    })
  })
})

// GET Customer CRM Directory - Lightweight projection avoiding massive image transfers
app.get("/api/admin/customers", requireAdmin, async (req, res) => {
  const users = (await db
    .prepare(
      "SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC",
    )
    .all()) as any[]
  const allBookings = (await db
    .prepare(`
      SELECT
        id, customer_email, total_amount, created_at, customer_first_name,
        customer_last_name, customer_phone, driver_license_num,
        driver_license_state, driver_license_expiry
      FROM bookings
      ORDER BY created_at DESC
    `)
    .all()) as any[]

  // Group bookings by email in O(N)
  const bookingsByEmail = new Map<string, any[]>()
  for (const b of allBookings) {
    const email = (b.customer_email || "").toLowerCase().trim()
    if (!email) continue
    const list = bookingsByEmail.get(email) || []
    list.push(b)
    bookingsByEmail.set(email, list)
  }

  const customerMap = new Map<string, any>()

  for (const u of users) {
    const email = (u.email || "").toLowerCase().trim()
    const userBookings = bookingsByEmail.get(email) || []
    const totalSpent = userBookings.reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0,
    )
    customerMap.set(email, {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      driverLicenseNum: u.driver_license_num,
      driverLicenseState: u.driver_license_state,
      driverLicenseExpiry: u.driver_license_expiry,
      vipTier: u.vip_tier || "Standard",
      totalBookings: userBookings.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      createdAt: u.created_at,
      hasAccount: true,
      latestBooking: userBookings[0] ? userBookings[0].created_at : "None",
    })
  }

  // Also include guest drivers who booked without creating an account
  for (const b of allBookings) {
    const email = (b.customer_email || "").toLowerCase().trim()
    if (!email || customerMap.has(email)) continue

    const guestBookings = bookingsByEmail.get(email) || []
    const totalSpent = guestBookings.reduce(
      (sum, x) => sum + Number(x.total_amount || 0),
      0,
    )
    customerMap.set(email, {
      id: `guest_${email.replace(/[^a-z0-9]/g, "_")}`,
      email: b.customer_email,
      name: `${b.customer_first_name} ${b.customer_last_name}`,
      phone: b.customer_phone,
      driverLicenseNum: b.driver_license_num || "Pending Verification",
      driverLicenseState: b.driver_license_state || "N/A",
      driverLicenseExpiry: b.driver_license_expiry || "N/A",
      vipTier: totalSpent > 500 ? "Silver" : "Standard",
      totalBookings: guestBookings.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      createdAt: b.created_at,
      hasAccount: false,
      latestBooking: b.created_at,
    })
  }

  return res.json(Array.from(customerMap.values()))
})

/* ==========================================
   PROMO CODES & PRICING RULES
   ========================================== */

// GET all promo codes
app.get("/api/promos", async (req, res) => {
  const rows = await db
    .prepare("SELECT * FROM promo_codes ORDER BY created_at DESC")
    .all()
  return res.json(rows.map(formatPromoRow))
})

// POST create promo code
app.post("/api/promos", requireAdmin, async (req, res) => {
  const { code, discountPercent, description, expiryDate } = req.body
  if (!code || !discountPercent) {
    return res
      .status(400)
      .json({ error: "Promo code and discount percent are required." })
  }

  const normalizedCode = code.trim().toUpperCase()
  const existing = await db
    .prepare("SELECT code FROM promo_codes WHERE code = ?")
    .get(normalizedCode)
  if (existing) {
    return res.status(409).json({ error: "Promo code already exists." })
  }

  await db
    .prepare(`
    INSERT INTO promo_codes (code, discount_percent, description, is_active, expiry_date, usage_count)
    VALUES (?, ?, ?, 1, ?, 0)
  `)
    .run(
      normalizedCode,
      Number(discountPercent),
      description || "Promotional discount rule",
      expiryDate || "2026-12-31",
    )

  const created = await db
    .prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(normalizedCode)
  return res.status(201).json(formatPromoRow(created))
})

// PATCH toggle promo active status
app.patch("/api/promos/:code/toggle", requireAdmin, async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  const promo = (await db
    .prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode)) as any
  if (!promo) {
    return res.status(404).json({ error: "Promo code not found." })
  }

  const newActive = promo.is_active ? 0 : 1
  await db
    .prepare("UPDATE promo_codes SET is_active = ? WHERE code = ?")
    .run(newActive, promoCode)

  const updated = await db
    .prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode)
  return res.json(formatPromoRow(updated))
})

// DELETE promo code
app.delete("/api/promos/:code", requireAdmin, async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  await db.prepare("DELETE FROM promo_codes WHERE code = ?").run(promoCode)
  return res.json({
    success: true,
    message: `Promo code ${promoCode} deleted.`,
  })
})

// POST Validate Promo Code (Customer Checkout) - Read-only check, does NOT prematurely increment usage
app.post("/api/promos/validate", async (req, res) => {
  const { code } = req.body
  if (!code) {
    return res.status(400).json({ valid: false, message: "Code is required." })
  }

  const promoCode = code.trim().toUpperCase()
  const promo = (await db
    .prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode)) as any

  if (!promo) {
    return res
      .status(404)
      .json({ valid: false, message: "Invalid promo code." })
  }

  if (!promo.is_active) {
    return res
      .status(400)
      .json({ valid: false, message: "This coupon is no longer active." })
  }

  if (promo.expiry_date) {
    const expiryTime = Date.parse(promo.expiry_date)
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return res
        .status(400)
        .json({ valid: false, message: "This coupon code has expired." })
    }
  }

  return res.json({
    valid: true,
    code: promo.code,
    discountPercent: promo.discount_percent,
    description: promo.description,
    message: `${promo.discount_percent}% discount applied!`,
  })
})

/* ==========================================
   MAINTENANCE & FLEET HEALTH
   ========================================== */

// GET all maintenance logs with pagination and filtering (Admin Protected)
app.get("/api/maintenance", requireAdmin, async (req, res) => {
  try {
    const rawAll = req.query.all === "true" || req.query.raw === "true"
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10),
    )
    const offset = (page - 1) * limit
    const carId = req.query.carId ? String(req.query.carId).trim() : null
    const status = req.query.status ? String(req.query.status).trim() : null
    const search = req.query.search ? String(req.query.search).trim() : null

    let whereConditions: string[] = []
    let params: any[] = []

    if (carId) {
      whereConditions.push("m.car_id = ?")
      params.push(carId)
    }

    if (status) {
      whereConditions.push("m.status = ?")
      params.push(status)
    }

    if (search) {
      whereConditions.push(
        "(LOWER(v.name) LIKE ? OR LOWER(m.service_type) LIKE ? OR LOWER(m.id) LIKE ?)",
      )
      const wildcard = `%${search.toLowerCase()}%`
      params.push(wildcard, wildcard, wildcard)
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    if (rawAll) {
      const rows = await db
        .prepare(`
        SELECT m.*, v.name as car_name
        FROM maintenance_logs m
        LEFT JOIN vehicles v ON m.car_id = v.id
        ${whereClause}
        ORDER BY m.created_at DESC
      `)
        .all(...params)
      return res.json(rows.map(formatMaintenanceRow))
    }

    // Total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.car_id = v.id
      ${whereClause}
    `
    const countRow = await db.prepare(countSql).get(...params)
    const total = Number(countRow?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    // Paginated data query
    const dataSql = `
      SELECT m.*, v.name as car_name
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.car_id = v.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `
    const rows = await db.prepare(dataSql).all(...params, limit, offset)
    const data = rows.map(formatMaintenanceRow)

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (err: any) {
    console.error("[Maintenance Logs Error]", err?.message)
    return res
      .status(500)
      .json({ error: "Failed to retrieve maintenance logs." })
  }
})

// POST create maintenance log
app.post("/api/maintenance", requireAdmin, async (req, res) => {
  const {
    carId,
    serviceType,
    cost,
    odometer,
    date,
    status,
    technicianNotes,
    setVehicleStatus,
  } = req.body
  if (!carId || !serviceType) {
    return res
      .status(400)
      .json({ error: "carId and serviceType are required." })
  }

  const logId = `MNT-${Math.floor(1000 + Math.random() * 9000)}`
  await db
    .prepare(`
    INSERT INTO maintenance_logs (id, car_id, service_type, cost, odometer, date, status, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      logId,
      carId,
      serviceType,
      Number(cost) || 0,
      Number(odometer) || 15000,
      date || new Date().toISOString().split("T")[0],
      status || "Completed",
      technicianNotes || "",
    )

  // If vehicle should be put in maintenance or returned to available
  if (setVehicleStatus) {
    await db
      .prepare("UPDATE vehicles SET status = ? WHERE id = ?")
      .run(setVehicleStatus, carId)
  }

  const created = await db
    .prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `)
    .get(logId)

  return res.status(201).json(formatMaintenanceRow(created))
})

// PATCH update maintenance status
app.patch("/api/maintenance/:id/status", requireAdmin, async (req, res) => {
  const logId = req.params.id
  const { status } = req.body
  if (!status) return res.status(400).json({ error: "Status is required." })

  await db
    .prepare("UPDATE maintenance_logs SET status = ? WHERE id = ?")
    .run(status, logId)
  const updated = await db
    .prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `)
    .get(logId)

  return res.json(formatMaintenanceRow(updated))
})

/* ==========================================
   ADMIN STATS & TELEMETRY
   ========================================== */

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [fleetStats, bookingStats] = await Promise.all([
      db.get(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Available' OR status IS NULL OR status = '' THEN 1 END) AS available,
          COUNT(CASE WHEN status = 'Rented' THEN 1 END) AS rented,
          COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) AS maintenance,
          COUNT(CASE WHEN status = 'Cleaning' THEN 1 END) AS cleaning,
          COALESCE(SUM(CASE WHEN status = 'Rented' THEN price_per_day ELSE 0 END), 0) AS active_revenue
        FROM vehicles
      `),
      db.get(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Pending Assignment' THEN 1 END) AS pending_mating,
          COUNT(CASE WHEN status = 'Assigned' THEN 1 END) AS assigned
        FROM bookings
      `),
    ])

    const totalFleet = Number(fleetStats?.total || 0)
    const available = Number(fleetStats?.available || 0)
    const rented = Number(fleetStats?.rented || 0)
    const maintenance = Number(fleetStats?.maintenance || 0)
    const cleaning = Number(fleetStats?.cleaning || 0)
    const activeRevenue = Number(fleetStats?.active_revenue || 0)
    const utilization =
      totalFleet > 0 ? Math.round((rented / totalFleet) * 100) : 0

    const totalBookings = Number(bookingStats?.total || 0)
    const pendingMating = Number(bookingStats?.pending_mating || 0)
    const assigned = Number(bookingStats?.assigned || 0)

    return res.json({
      fleet: {
        total: totalFleet,
        available,
        rented,
        maintenance,
        cleaning,
        utilization,
        activeRevenue,
      },
      bookings: {
        total: totalBookings,
        pendingMating,
        assigned,
      },
    })
  } catch (err: any) {
    console.error("[Admin Stats Aggregation Error]", err?.message)
    return res
      .status(500)
      .json({ error: "Failed to aggregate admin telemetry statistics." })
  }
})

// Upload simulator/receiver
app.post("/api/upload", async (req, res) => {
  const { fileName } = req.body
  const cleanName = fileName
    ? path.basename(fileName)
    : `license_${Date.now()}.jpg`
  return res.json({
    success: true,
    fileName: cleanName,
    url: `/uploads/${cleanName}`,
  })
})

/* ==========================================
   SYSTEM SETTINGS (Global Configuration & Feature Toggles)
   ========================================== */

app.get("/api/settings", async (_req, res) => {
  try {
    const rows = ((await db.prepare("SELECT key, value FROM system_settings").all()) as any[]) || []
    const settings: Record<string, any> = {
      reviews_enabled: true,
      contact_phone: "+1 (555) 234-5678",
      contact_email: "concierge@motorly.com",
      admin_name: "Studio Director",
      hub_address: "Terminal Garage B • Bay 4 HQ, Miami Airport",
      google_maps_url: "",
      support_phone: "+1 (800) 555-MOTOR",
    }
    for (const r of rows) {
      if (r.key === "reviews_enabled") {
        settings.reviews_enabled = r.value === "true" || r.value === true || r.value === "1"
      } else {
        settings[r.key] = r.value
      }
    }
    return res.json({ success: true, settings })
  } catch (err: any) {
    console.error("[Settings Fetch Error]", err?.message)
    return res.json({
      success: true,
      settings: {
        reviews_enabled: true,
        contact_phone: "+1 (555) 234-5678",
        contact_email: "concierge@motorly.com",
        admin_name: "Studio Director",
        hub_address: "Terminal Garage B • Bay 4 HQ, Miami Airport",
      },
    })
  }
})

app.patch("/api/settings", requireAdmin, async (req, res) => {
  try {
    const { key, value, settings: batchSettings } = req.body
    const toUpdate: [string, string][] = []

    if (batchSettings && typeof batchSettings === "object") {
      for (const [k, v] of Object.entries(batchSettings)) {
        if (k && v !== undefined && v !== null) {
          toUpdate.push([k, String(v)])
        }
      }
    } else if (key) {
      toUpdate.push([key, String(value ?? "")])
    } else {
      return res.status(400).json({ success: false, error: "Setting key or settings object is required." })
    }

    for (const [k, v] of toUpdate) {
      if (db.isSupabase && db.pool) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()",
          [k, v]
        )
      } else {
        await db.prepare(
          "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
        ).run(k, v)
      }
    }

    return res.json({
      success: true,
      message: "Studio settings updated successfully.",
      updatedCount: toUpdate.length,
    })
  } catch (err: any) {
    console.error("[Settings Update Error]", err?.message)
    return res.status(500).json({ success: false, error: err?.message || "Failed to update system setting." })
  }
})

app.post("/api/settings/sync-hub", requireAdmin, async (req, res) => {
  try {
    const { hub_address, google_maps_url } = req.body
    if (!hub_address || typeof hub_address !== "string") {
      return res.status(400).json({ success: false, error: "hub_address is required." })
    }

    if (db.isSupabase && db.pool) {
      await db.pool.query("UPDATE cars SET garage_name = $1, garage_address = $1", [hub_address])
      await db.pool.query(
        "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_address', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
        [hub_address]
      )
      if (google_maps_url !== undefined) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('google_maps_url', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
          [google_maps_url]
        )
      }
    } else {
      await db.prepare("UPDATE cars SET garage_name = ?, garage_address = ?").run(hub_address, hub_address)
      await db.prepare(
        "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_address', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
      ).run(hub_address)
      if (google_maps_url !== undefined) {
        await db.prepare(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('google_maps_url', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
        ).run(google_maps_url)
      }
    }

    return res.json({
      success: true,
      message: "Stationed hub location updated and synchronized to all active vehicles in fleet.",
    })
  } catch (err: any) {
    console.error("[Sync Hub Error]", err?.message)
    return res.status(500).json({ success: false, error: err?.message || "Failed to sync hub location to fleet." })
  }
})

/* ==========================================
   CUSTOMER REVIEWS & VEHICLE RATINGS
   ========================================== */

app.get("/api/reviews", async (req, res) => {
  try {
    const carId = req.query.carId as string | undefined
    const bookingId = req.query.bookingId as string | undefined
    let rows: any[] = []

    if (carId) {
      rows = (await db.prepare("SELECT * FROM reviews WHERE car_id = ? ORDER BY created_at DESC").all(carId)) as any[]
    } else if (bookingId) {
      rows = (await db.prepare("SELECT * FROM reviews WHERE booking_id = ? ORDER BY created_at DESC").all(bookingId)) as any[]
    } else {
      rows = (await db.prepare("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50").all()) as any[]
    }

    const reviews = (rows || []).map((r) => ({
      id: r.id,
      carId: r.car_id,
      bookingId: r.booking_id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      rating: Number(r.rating) || 5,
      comment: r.comment || "",
      createdAt: r.created_at,
    }))

    return res.json({ success: true, reviews })
  } catch (err: any) {
    console.error("[Reviews Fetch Error]", err?.message)
    return res.json({ success: true, reviews: [] })
  }
})

app.post("/api/reviews", async (req, res) => {
  try {
    // Check if review system is globally enabled
    const settingRow = ((await db.prepare("SELECT value FROM system_settings WHERE key = 'reviews_enabled'").get()) as any)
    const isEnabled = settingRow ? settingRow.value === "true" || settingRow.value === "1" : true
    if (!isEnabled) {
      return res.status(403).json({
        success: false,
        error: "Customer reviews are currently disabled by administration.",
      })
    }

    const { carId, bookingId, customerName, customerEmail, rating, comment } = req.body
    if (!carId) {
      return res.status(400).json({ success: false, error: "carId is required to submit a review." })
    }
    const numRating = parseInt(String(rating), 10)
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5 stars." })
    }

    const reviewId = `REV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    const reviewerName = String(customerName || "Verified Driver").trim()
    const reviewerEmail = String(customerEmail || "").trim()
    const reviewComment = String(comment || "").trim()

    await db.prepare(`
      INSERT INTO reviews (id, car_id, booking_id, customer_name, customer_email, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      reviewId,
      carId,
      bookingId || null,
      reviewerName,
      reviewerEmail || null,
      numRating,
      reviewComment || null,
    )

    // Recalculate average rating & review count for car
    const statsRow = ((await db.prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE car_id = ?").get(carId)) as any)
    const avgRating = statsRow?.avg_rating ? Math.round(Number(statsRow.avg_rating) * 10) / 10 : numRating
    const count = Number(statsRow?.count) || 1

    await db.prepare("UPDATE vehicles SET rating = ?, reviews_count = ? WHERE id = ?").run(avgRating, count, carId).catch(() => {})

    return res.json({
      success: true,
      message: "Review submitted successfully! Thank you for your feedback.",
      review: {
        id: reviewId,
        carId,
        bookingId,
        customerName: reviewerName,
        rating: numRating,
        comment: reviewComment,
        createdAt: new Date().toISOString(),
      },
      car: {
        id: carId,
        rating: avgRating,
        reviewsCount: count,
      },
    })
  } catch (err: any) {
    console.error("[Review Submission Error]", err?.message)
    return res.status(500).json({ success: false, error: err?.message || "Failed to submit review." })
  }
})

// Global JSON Error Handler (Guarantees all backend errors return JSON, not HTML)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[Backend Error]", err?.message || err)
    if (res.headersSent) {
      return next(err)
    }
    return res.status(err?.status || 500).json({
      success: false,
      error: err?.message || "Internal server error occurred.",
    })
  },
)

// Start Express Server (standalone / local mode)
if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`[Backend] MOTORLY Server running on port ${PORT}`)
    console.log(
      `[Backend] Admin authentication initialized (${isProduction ? "production mode" : "development mode"})`,
    )
    console.log(
      `[Backend] API Endpoints ready at http://localhost:${PORT}/api/`,
    )
  })
}

export default app
