import express from "express"
import cors from "cors"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { db, initDatabase } from "./db.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize SQLite DB
await initDatabase()

const app = express()
const PORT = process.env.PORT_BACKEND || 3001
const ADMIN_PASSWORD = "0709"

app.use(cors())
app.use(express.json({ limit: "20mb" }))

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
    pricePerDay: row.price_per_day,
    pricePerHour: row.price_per_hour,
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
      licenseFileName: row.driver_license_file || undefined,
      licenseBackFileName: row.driver_license_back_file || undefined,
      licensePhotoFront:
        row.driver_license_file && row.driver_license_file.startsWith("data:")
          ? row.driver_license_file
          : undefined,
      licensePhotoBack:
        row.driver_license_back_file &&
        row.driver_license_back_file.startsWith("data:")
          ? row.driver_license_back_file
          : undefined,
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
   AUTHENTICATION ROUTES (Password: 0709)
   ========================================== */

app.post("/api/auth/login", async (req, res) => {
  const { password } = req.body
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid administrator password. Use password 0709.",
    })
  }

  const token = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  await db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token)

  return res.json({
    success: true,
    token,
    role: "admin",
    message: "Admin authenticated successfully.",
  })
})

app.post("/api/auth/verify", async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(401).json({ authenticated: false })

  const session = await db.prepare("SELECT token FROM admin_sessions WHERE token = ?")
    .get(token)
  if (!session) {
    return res
      .status(401)
      .json({ authenticated: false, message: "Session expired or invalid." })
  }

  return res.json({ authenticated: true, role: "admin" })
})

/* ==========================================
   CUSTOMER AUTHENTICATION & PROFILE
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

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail)
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    })
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  await db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'customer', 'Standard')
  `).run(
    userId,
    normalizedEmail,
    password, // For lightweight demo/portfolio app
    name.trim(),
    phone || "",
    driverLicenseNum || "",
    driverLicenseState || "",
    driverLicenseExpiry || "",
  )

  const token = `usr_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  await db.prepare(
    "INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)",
  ).run(token, userId)

  const newUser = await db.prepare("SELECT * FROM users WHERE id = ?").get(userId)
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
  const user = await db.prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizedEmail) as any
  if (!user || user.password_hash !== password) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." })
  }

  const token = `usr_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  await db.prepare(
    "INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)",
  ).run(token, user.id)

  return res.json({
    success: true,
    token,
    user: formatUserRow(user),
    message: "Logged in successfully.",
  })
})

// Get Current Customer Profile
app.get("/api/auth/customer-me", async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null
  if (!token) {
    return res
      .status(401)
      .json({ authenticated: false, message: "No token provided." })
  }

  const session = await db.prepare("SELECT user_id FROM customer_sessions WHERE token = ?")
    .get(token) as any
  if (!session) {
    return res
      .status(401)
      .json({ authenticated: false, message: "Session invalid or expired." })
  }

  const user = await db.prepare("SELECT * FROM users WHERE id = ?")
    .get(session.user_id)
  if (!user) {
    return res
      .status(404)
      .json({ authenticated: false, message: "User not found." })
  }

  return res.json({ authenticated: true, user: formatUserRow(user) })
})

// Customer Logout
app.post("/api/auth/customer-logout", async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null
  if (token) {
    await db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token)
  }
  return res.json({ success: true, message: "Logged out." })
})

// Get Customer Bookings (Self-service portal)
app.get("/api/users/bookings", async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null
  let userEmail = req.query.email as string | undefined

  if (token) {
    const session = await db.prepare("SELECT user_id FROM customer_sessions WHERE token = ?")
      .get(token) as any
    if (session) {
      const user = await db.prepare("SELECT email FROM users WHERE id = ?")
        .get(session.user_id) as any
      if (user) {
        userEmail = user.email
      }
    }
  }

  if (!userEmail) {
    return res
      .status(400)
      .json({ error: "Authentication or email required to view reservations." })
  }

  const rows = await db.prepare(`
    SELECT * FROM bookings 
    WHERE customer_email = ? 
    ORDER BY created_at DESC
  `)
    .all(userEmail.trim().toLowerCase())

  return res.json(rows.map(formatBookingRow))
})

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

  if (maxPrice) {
    query += " AND price_per_day <= ?"
    params.push(Number(maxPrice))
  }

  if (search) {
    query += " AND (name LIKE ? OR brand LIKE ? OR plate_number LIKE ?)"
    const wildcard = `%${search}%`
    params.push(wildcard, wildcard, wildcard)
  }

  query += " ORDER BY is_popular DESC, price_per_day ASC"

  const rows = await db.prepare(query).all(...params)
  const cars = rows.map(formatCarRow)

  // Dynamically evaluate conflict/availability against requested dates
  if (pickupDate && returnDate) {
    for (const car of cars) {
      const conflict = await findVehicleBookingConflict(
        car.id,
        String(pickupDate),
        String(returnDate),
      )
      car.isAvailableForDates = !conflict && car.status !== "Maintenance"
      car.conflict = conflict || null
      if (conflict) {
        car.statusForDates = "Reserved"
      } else {
        car.statusForDates = car.status
      }
    }
  }

  return res.json(cars)
})

// GET single car
app.get("/api/cars/:id", async (req, res) => {
  const row = await db.prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(req.params.id)
  if (!row) {
    return res.status(404).json({ error: "Vehicle not found." })
  }
  return res.json(formatCarRow(row))
})

// POST add new vehicle
app.post("/api/cars", async (req, res) => {
  const car = req.body
  const newId =
    car.id ||
    (car.name || "vehicle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`

  const galleryJson = JSON.stringify(
    car.gallery && car.gallery.length
      ? car.gallery
      : [car.image || "/images/car-white.jpg"],
  )
  const featuresJson = JSON.stringify(
    car.features || ["Bluetooth", "Apple CarPlay"],
  )

  await db.prepare(`
    INSERT INTO vehicles (
      id, name, brand, model, year, type, price_per_day, price_per_hour,
      image, gallery, rating, reviews_count, seats, transmission, fuel_type,
      mileage, luggage, features, description, is_popular, status, plate_number, location, health_score,
      insurance_policy, insurance_provider, insurance_expiry, purchase_date, purchase_cost, current_odometer,
      garage_name, garage_address, garage_lat, garage_lng, garage_bay
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(
    newId,
    car.name || "Custom Vehicle",
    car.brand || "Toyota",
    car.model || "Camry",
    Number(car.year) || 2024,
    car.type || "Sedan",
    Number(car.pricePerDay) || 50,
    Number(car.pricePerHour) || 7,
    car.image || "/images/car-white.jpg",
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

  const created = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(newId)
  return res.status(201).json(formatCarRow(created))
})

// PUT update vehicle
app.put("/api/cars/:id", async (req, res) => {
  const car = req.body
  const carId = req.params.id

  const existing = await db.prepare("SELECT id FROM vehicles WHERE id = ?").get(carId)
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  const galleryJson = JSON.stringify(car.gallery || [car.image])
  const featuresJson = JSON.stringify(car.features || [])

  await db.prepare(`
    UPDATE vehicles SET
      name = ?, brand = ?, model = ?, year = ?, type = ?, price_per_day = ?, price_per_hour = ?,
      image = ?, gallery = ?, seats = ?, transmission = ?, fuel_type = ?,
      mileage = ?, luggage = ?, features = ?, description = ?, status = ?,
      plate_number = ?, location = ?, health_score = ?,
      insurance_policy = ?, insurance_provider = ?, insurance_expiry = ?,
      purchase_date = ?, purchase_cost = ?, current_odometer = ?,
      garage_name = ?, garage_address = ?, garage_lat = ?, garage_lng = ?, garage_bay = ?
    WHERE id = ?
  `).run(
    car.name,
    car.brand,
    car.model,
    Number(car.year) || 2024,
    car.type,
    Number(car.pricePerDay),
    Number(car.pricePerHour),
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

  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  return res.json(formatCarRow(updated))
})

// PATCH car status
app.patch("/api/cars/:id/status", async (req, res) => {
  const { status } = req.body
  const carId = req.params.id

  if (!status) return res.status(400).json({ error: "Status is required." })

  await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(status, carId)
  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  return res.json(formatCarRow(updated))
})

// DELETE car
app.delete("/api/cars/:id", async (req, res) => {
  await db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id)
  return res.json({
    success: true,
    message: "Vehicle decommissioned and removed.",
  })
})

/* ==========================================
   BOOKINGS & VEHICLE MATING ROUTES
   ========================================== */

// Helper to parse date strings (e.g. "Mar 15, 2026", "2026-03-15", "Mar 15, 2026 10:00 AM") into timestamp ms
function parseDateRange(pickupStr: string, returnStr: string) {
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

// Function to find any conflicting active booking for a given vehicle
async function findVehicleBookingConflict(
  carId: string,
  pickupStr: string,
  returnStr: string,
  excludeBookingId?: string,
) {
  const { start: reqStart, end: reqEnd } = parseDateRange(pickupStr, returnStr)

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

  const activeBookings = await db.prepare(query).all(...params) as any[]

  for (const b of activeBookings) {
    const { start: bStart, end: bEnd } = parseDateRange(
      b.pickup_date,
      b.return_date,
    )
    if (datesOverlap(reqStart, reqEnd, bStart, bEnd)) {
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
}

// GET vehicle date availability check
app.get("/api/cars/:id/availability", async (req, res) => {
  const carId = req.params.id
  const pickupDate = req.query.pickupDate as string || "Mar 15, 2026"
  const returnDate = req.query.returnDate as string || "Mar 18, 2026"

  const car = (await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)) as any
  if (!car) return res.status(404).json({ error: "Vehicle not found." })

  const conflict = await findVehicleBookingConflict(carId, pickupDate, returnDate)
  const isAvailable = !conflict && car.status !== "Maintenance"

  return res.json({
    carId,
    isAvailable,
    carStatus: car.status,
    conflict: conflict || null,
  })
})

// GET all bookings
app.get("/api/bookings", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all()
  return res.json(rows.map(formatBookingRow))
})

// POST create booking
app.post("/api/bookings", async (req, res) => {
  const b = req.body
  const id = b.id || `MTR-${Math.floor(100000 + Math.random() * 900000)}`
  const nowText = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const matchedCarId = b.matchedCarId || b.carId || null
  const pickupDate = b.pickupDate || "Mar 15, 2026"
  const returnDate = b.returnDate || "Mar 18, 2026"

  // CRITICAL: Prevent Double Booking of the same car for overlapping dates
  if (matchedCarId) {
    const conflict = await findVehicleBookingConflict(
      matchedCarId,
      pickupDate,
      returnDate,
    )
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Double Booking Conflict: This vehicle is already reserved for overlapping dates (${conflict.pickupDate} – ${conflict.returnDate}) under reservation ${conflict.conflictingBookingId}. Please select another car or change your rental dates.`,
      })
    }
  }

  const status = matchedCarId ? "Assigned" : "Pending Assignment"

  await db.prepare(`
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
  `).run(
    id,
    b.customer?.firstName || "Guest",
    b.customer?.lastName || "Customer",
    b.customer?.email || "customer@example.com",
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
    b.createdAt || nowText,
    b.userId || null,
    b.notes || null,
    b.promoCode || null,
  )

  // If matched right away, mark vehicle as Rented
  if (matchedCarId) {
    await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
      matchedCarId,
    )
  }

  const created = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(id)
  return res.status(201).json(formatBookingRow(created))
})

// GET Download Specific Booking Customer Driver License (Original Uploaded Image or Certificate)
app.get("/api/bookings/:id/download-license", async (req, res) => {
  const bookingId = req.params.id
  const side = req.query.side as string || "front" // "front" | "back" | "certificate"
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
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

      res.setHeader("Content-Type", mimeType)
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
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

  res.setHeader("Content-Type", "image/svg+xml")
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
  return res.send(svgContent)
})

// POST Step D: Admin Approves Request ("Green Signal")
app.post("/api/bookings/:id/approve", async (req, res) => {
  const bookingId = req.params.id
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const nowIso = new Date().toISOString()
  await db.prepare(`
    UPDATE bookings SET
      approved_by_admin = 1,
      approved_at = ?
    WHERE id = ?
  `).run(nowIso, bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Reservation ${bookingId} approved. Green signal given to customer for garage pickup!`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step E: Admin Hands Over Keys (Handover Checklist & Clock Starts)
app.post("/api/bookings/:id/handover-keys", async (req, res) => {
  const bookingId = req.params.id
  const { odometerOut, fuelOut, exteriorClean, tiresInspected, staffSign } =
    req.body

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
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
  await db.prepare(`
    UPDATE bookings SET
      status = 'Checked Out',
      keys_handed_at = ?,
      checklist_out = ?,
      odometer_out = ?,
      fuel_level_out = ?
    WHERE id = ?
  `).run(
    nowIso,
    JSON.stringify(checklistObj),
    checklistObj.odometerOut,
    checklistObj.fuelOut,
    bookingId,
  )

  // Ensure vehicle status is Rented
  if (booking.matched_car_id) {
    await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
      booking.matched_car_id,
    )
  }

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Keys handed over for ${bookingId}! Official rental clock started at ${nowIso}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F1: Customer Requests Trip Extension
app.post("/api/bookings/:id/request-extension", async (req, res) => {
  const bookingId = req.params.id
  const { extraDuration, unit, customerNotes } = req.body

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
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

  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Requested',
      extension_request = ?
    WHERE id = ?
  `).run(JSON.stringify(extRequest), bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Extension request for +${durationNum} ${unitStr} submitted. Awaiting manager quotation.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F2: Admin Quotes Extension (Per Day / Per Hour / Per Month)
app.post("/api/bookings/:id/quote-extension", async (req, res) => {
  const bookingId = req.params.id
  const { rateType, rateAmount, totalQuotedAmount, adminNotes } = req.body

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
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

  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Quoted',
      extension_quote = ?
    WHERE id = ?
  `).run(JSON.stringify(quoteObj), bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Quotation of $${quoteObj.totalQuotedAmount} sent to customer for approval.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F3: Customer Approves Extension Quotation (Added to Bill & Return Date Extended)
app.post("/api/bookings/:id/approve-extension", async (req, res) => {
  const bookingId = req.params.id

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  let quote: any = {}
  try {
    if (booking.extension_quote) quote = JSON.parse(booking.extension_quote)
  } catch {}

  const additionalCost = Number(quote.totalQuotedAmount) || 0
  const newTotal = Number(booking.total_amount) + additionalCost

  // Append note to return date or notes
  const updatedNotes = `${
    booking.notes ? booking.notes + " | " : ""
  }Extended (+${quote.rateType || "period"}: +$${additionalCost})`

  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Approved',
      total_amount = ?,
      notes = ?
    WHERE id = ?
  `).run(newTotal, updatedNotes, bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Extension approved! $${additionalCost.toFixed(2)} added to rental bill. New total: $${newTotal.toFixed(2)}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step F4: Decline Extension
app.post("/api/bookings/:id/decline-extension", async (req, res) => {
  const bookingId = req.params.id

  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Declined'
    WHERE id = ?
  `).run(bookingId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: "Extension declined.",
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Step G: Return Vehicle & Post-Trip Inspection Checklist
app.post("/api/bookings/:id/return-inspection", async (req, res) => {
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

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
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
  await db.prepare(`
    UPDATE bookings SET
      status = 'Completed',
      checklist_in = ?,
      odometer_in = ?,
      fuel_level_in = ?,
      inspection_notes = ?,
      inspection_passed = 1
    WHERE id = ?
  `).run(
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
    await db.prepare(
      "UPDATE vehicles SET status = ?, current_odometer = ? WHERE id = ?",
    ).run(nextCarStatus, checklistInObj.odometerIn, booking.matched_car_id)
  }

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Inspection passed! Ride completed and booking ${bookingId} finalized.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Mate / Assign a car to a booking
app.post("/api/bookings/:id/mate", async (req, res) => {
  const bookingId = req.params.id
  const { carId } = req.body

  if (!carId) {
    return res.status(400).json({ error: "carId is required to mate vehicle." })
  }

  const booking = (await db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const car = (await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)) as any
  if (!car) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  // Prevent double booking conflict during manual mating
  const conflict = await findVehicleBookingConflict(
    carId,
    booking.pickup_date,
    booking.return_date,
    bookingId,
  )
  if (conflict) {
    return res.status(409).json({
      error: `Conflict: Vehicle is already mated to reservation ${conflict.conflictingBookingId} (${conflict.customerName}) for overlapping dates (${conflict.pickupDate} – ${conflict.returnDate}).`,
    })
  }

  // Update booking
  await db.prepare(
    "UPDATE bookings SET matched_car_id = ?, status = 'Assigned' WHERE id = ?",
  ).run(carId, bookingId)

  // Update vehicle to Rented
  await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId)

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  const updatedCar = await db.prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)

  return res.json({
    success: true,
    message: `Vehicle ${car.name} (${car.plate_number}) successfully mated to booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking),
    car: formatCarRow(updatedCar),
  })
})

// POST Unmate / Release a car from a booking
app.post("/api/bookings/:id/unmate", async (req, res) => {
  const bookingId = req.params.id

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." })
  }

  const prevCarId = booking.matched_car_id

  // Reset booking
  await db.prepare(
    "UPDATE bookings SET matched_car_id = NULL, status = 'Pending Assignment' WHERE id = ?",
  ).run(bookingId)

  // Release vehicle back to Available
  if (prevCarId) {
    await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
      prevCarId,
    )
  }

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Vehicle released from booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// PATCH Update Booking Status (Advance Lifecycle)
app.patch("/api/bookings/:id/status", async (req, res) => {
  const bookingId = req.params.id
  const { status, odometerOut, odometerIn, fuelLevelOut, fuelLevelIn, notes } =
    req.body

  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as any
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
      await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
        carId,
      )
    } else if (newStatus === "Returned") {
      await db.prepare("UPDATE vehicles SET status = 'Cleaning' WHERE id = ?").run(
        carId,
      )
    } else if (newStatus === "Completed") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
        carId,
      )
    } else if (newStatus === "Cancelled") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
        carId,
      )
    }
  }

  await db.prepare(`
    UPDATE bookings SET
      status = ?,
      odometer_out = COALESCE(?, odometer_out),
      odometer_in = COALESCE(?, odometer_in),
      fuel_level_out = COALESCE(?, fuel_level_out),
      fuel_level_in = COALESCE(?, fuel_level_in),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(
    newStatus,
    odometerOut ?? null,
    odometerIn ?? null,
    fuelLevelOut ?? null,
    fuelLevelIn ?? null,
    notes ?? null,
    bookingId,
  )

  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId)
  return res.json({
    success: true,
    message: `Booking ${bookingId} transitioned to ${newStatus}.`,
    booking: formatBookingRow(updatedBooking),
  })
})

// POST Admin Walk-In / Counter Reservation (< 60s)
app.post("/api/admin/counter-booking", async (req, res) => {
  const b = req.body
  const id = b.id || `CWK-${Math.floor(100000 + Math.random() * 900000)}`
  const nowText = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const carId = b.carId
  if (!carId) {
    return res
      .status(400)
      .json({ error: "A vehicle must be selected for counter dispatch." })
  }

  const car = (await db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(carId)) as any
  if (!car) {
    return res.status(404).json({ error: "Selected vehicle not found." })
  }

  // Prevent counter dispatch of an already booked or rented vehicle
  const conflict = await findVehicleBookingConflict(
    carId,
    b.pickupDate || "Today, Right Now",
    b.returnDate || "In 3 Days",
  )
  if (conflict || car.status === "Rented") {
    return res.status(409).json({
      error: `Conflict: ${car.name} (${car.plate_number}) is currently rented or assigned to another active reservation.`,
    })
  }

  const initialStatus = b.immediateCheckout ? "Checked Out" : "Assigned"

  await db.prepare(`
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
  `).run(
    id,
    b.firstName || "Walk-In",
    b.lastName || "Customer",
    b.email || "counter.guest@motorly.com",
    b.phone || "+1 (555) 019-9922",
    b.dob || "01/01/1990",
    b.licenseNumber || `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
    b.licenseState || "Florida",
    b.licenseExpiry || "12/2029",
    b.licenseFileName || "counter_scanned_id.jpg",
    b.pickupLocation || car.location || "Miami International Airport (MIA)",
    b.returnLocation || car.location || "Miami International Airport (MIA)",
    b.pickupDate || "Today, Right Now",
    b.returnDate || "In 3 Days",
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
  await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId)

  const created = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(id)
  return res.status(201).json({
    success: true,
    message: `Counter walk-in reservation ${id} issued for ${car.name}.`,
    booking: formatBookingRow(created),
  })
})

// GET Customer CRM Directory
app.get("/api/admin/customers", async (req, res) => {
  const users = await db.prepare(
      "SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC",
    )
    .all() as any[]
  const allBookings = await db.prepare("SELECT * FROM bookings").all() as any[]

  const customerMap = new Map<string, any>()

  for (const u of users) {
    const userBookings = allBookings.filter(
      (b) => b.customer_email.toLowerCase() === u.email.toLowerCase(),
    )
    const totalSpent = userBookings.reduce(
      (sum, b) => sum + Number(b.total_amount),
      0,
    )
    customerMap.set(u.email.toLowerCase(), {
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
    const email = b.customer_email.toLowerCase()
    if (!customerMap.has(email)) {
      const guestBookings = allBookings.filter(
        (x) => x.customer_email.toLowerCase() === email,
      )
      const totalSpent = guestBookings.reduce(
        (sum, x) => sum + Number(x.total_amount),
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
  }

  return res.json(Array.from(customerMap.values()))
})

/* ==========================================
   PROMO CODES & PRICING RULES
   ========================================== */

// GET all promo codes
app.get("/api/promos", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC")
    .all()
  return res.json(rows.map(formatPromoRow))
})

// POST create promo code
app.post("/api/promos", async (req, res) => {
  const { code, discountPercent, description, expiryDate } = req.body
  if (!code || !discountPercent) {
    return res
      .status(400)
      .json({ error: "Promo code and discount percent are required." })
  }

  const normalizedCode = code.trim().toUpperCase()
  const existing = await db.prepare("SELECT code FROM promo_codes WHERE code = ?")
    .get(normalizedCode)
  if (existing) {
    return res.status(409).json({ error: "Promo code already exists." })
  }

  await db.prepare(`
    INSERT INTO promo_codes (code, discount_percent, description, is_active, expiry_date, usage_count)
    VALUES (?, ?, ?, 1, ?, 0)
  `).run(
    normalizedCode,
    Number(discountPercent),
    description || "Promotional discount rule",
    expiryDate || "2026-12-31",
  )

  const created = await db.prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(normalizedCode)
  return res.status(201).json(formatPromoRow(created))
})

// PATCH toggle promo active status
app.patch("/api/promos/:code/toggle", async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  const promo = await db.prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode) as any
  if (!promo) {
    return res.status(404).json({ error: "Promo code not found." })
  }

  const newActive = promo.is_active ? 0 : 1
  await db.prepare("UPDATE promo_codes SET is_active = ? WHERE code = ?").run(
    newActive,
    promoCode,
  )

  const updated = await db.prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode)
  return res.json(formatPromoRow(updated))
})

// DELETE promo code
app.delete("/api/promos/:code", async (req, res) => {
  const promoCode = req.params.code.toUpperCase()
  await db.prepare("DELETE FROM promo_codes WHERE code = ?").run(promoCode)
  return res.json({
    success: true,
    message: `Promo code ${promoCode} deleted.`,
  })
})

// POST Validate Promo Code (Customer Checkout)
app.post("/api/promos/validate", async (req, res) => {
  const { code } = req.body
  if (!code) {
    return res.status(400).json({ valid: false, message: "Code is required." })
  }

  const promoCode = code.trim().toUpperCase()
  const promo = await db.prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(promoCode) as any

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

  // Increment usage count
  await db.prepare(
    "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = ?",
  ).run(promoCode)

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

// GET all maintenance logs
app.get("/api/maintenance", async (req, res) => {
  const rows = await db.prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    ORDER BY m.created_at DESC
  `)
    .all()
  return res.json(rows.map(formatMaintenanceRow))
})

// POST create maintenance log
app.post("/api/maintenance", async (req, res) => {
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
  await db.prepare(`
    INSERT INTO maintenance_logs (id, car_id, service_type, cost, odometer, date, status, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
      setVehicleStatus,
      carId,
    )
  }

  const created = await db.prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `)
    .get(logId)

  return res.status(201).json(formatMaintenanceRow(created))
})

// PATCH update maintenance status
app.patch("/api/maintenance/:id/status", async (req, res) => {
  const logId = req.params.id
  const { status } = req.body
  if (!status) return res.status(400).json({ error: "Status is required." })

  await db.prepare("UPDATE maintenance_logs SET status = ? WHERE id = ?").run(
    status,
    logId,
  )
  const updated = await db.prepare(`
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

app.get("/api/admin/stats", async (req, res) => {
  const allCars = await db.prepare("SELECT * FROM vehicles").all()
  const allBookings = await db.prepare("SELECT * FROM bookings").all()

  const total = allCars.length
  const available = allCars.filter(
    (c: any) => c.status === "Available" || !c.status,
  ).length
  const rented = allCars.filter((c: any) => c.status === "Rented").length
  const maintenance = allCars.filter(
    (c: any) => c.status === "Maintenance",
  ).length
  const cleaning = allCars.filter((c: any) => c.status === "Cleaning").length
  const utilization = total > 0 ? Math.round((rented / total) * 100) : 0
  const activeRevenue = allCars
    .filter((c: any) => c.status === "Rented")
    .reduce((sum: number, c: any) => sum + Number(c.price_per_day), 0)

  const pendingMating = allBookings.filter(
    (b: any) => b.status === "Pending Assignment",
  ).length
  const assigned = allBookings.filter(
    (b: any) => b.status === "Assigned",
  ).length

  return res.json({
    fleet: {
      total,
      available,
      rented,
      maintenance,
      cleaning,
      utilization,
      activeRevenue,
    },
    bookings: {
      total: allBookings.length,
      pendingMating,
      assigned,
    },
  })
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

// Start Express Server (standalone / local mode)
if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`[Backend] MOTORLY Server running on port ${PORT}`)
    console.log(`[Backend] Admin Password verified: ${ADMIN_PASSWORD}`)
    console.log(`[Backend] API Endpoints ready at http://localhost:${PORT}/api/`)
  })
}


export default app;
