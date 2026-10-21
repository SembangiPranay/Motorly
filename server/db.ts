import { DatabaseSync } from "node:sqlite"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure data directory exists
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "drive_rent.db")
export const db = new DatabaseSync(dbPath)

// Initialize Tables
export function initDatabase() {
  // 1. Vehicles Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      type TEXT NOT NULL,
      price_per_day REAL NOT NULL,
      price_per_hour REAL NOT NULL,
      image TEXT NOT NULL,
      gallery TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 1,
      seats INTEGER NOT NULL,
      transmission TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      mileage TEXT NOT NULL,
      luggage TEXT NOT NULL,
      features TEXT NOT NULL,
      description TEXT,
      is_popular INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Available',
      plate_number TEXT,
      location TEXT,
      health_score INTEGER DEFAULT 95,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 2. Bookings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      driver_dob TEXT,
      driver_license_num TEXT,
      driver_license_state TEXT,
      driver_license_expiry TEXT,
      driver_license_file TEXT,
      pickup_location TEXT NOT NULL,
      return_location TEXT NOT NULL,
      pickup_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      requested_category TEXT,
      matched_car_id TEXT,
      status TEXT DEFAULT 'Pending Assignment',
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      user_id TEXT,
      odometer_out INTEGER,
      odometer_in INTEGER,
      fuel_level_out TEXT,
      fuel_level_in TEXT,
      notes TEXT,
      promo_code TEXT
    );
  `)

  // Safely ensure new columns exist in existing vehicles table
  const vehicleColumns = (db
    .prepare("PRAGMA table_info(vehicles)")
    .all() as any[]).map((c) => c.name)
  const requiredVehicleCols = [
    { name: "insurance_policy", type: "TEXT" },
    { name: "insurance_provider", type: "TEXT" },
    { name: "insurance_expiry", type: "TEXT" },
    { name: "purchase_date", type: "TEXT" },
    { name: "purchase_cost", type: "REAL" },
    { name: "current_odometer", type: "INTEGER" },
    { name: "garage_name", type: "TEXT" },
    { name: "garage_address", type: "TEXT" },
    { name: "garage_lat", type: "REAL" },
    { name: "garage_lng", type: "REAL" },
    { name: "garage_bay", type: "TEXT" },
  ]
  for (const col of requiredVehicleCols) {
    if (!vehicleColumns.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type};`)
      } catch (e) {
        // Ignored
      }
    }
  }

  // Safely ensure new columns exist in existing bookings table
  const bookingColumns = (db
    .prepare("PRAGMA table_info(bookings)")
    .all() as any[]).map((c) => c.name)
  const requiredBookingCols = [
    { name: "user_id", type: "TEXT" },
    { name: "odometer_out", type: "INTEGER" },
    { name: "odometer_in", type: "INTEGER" },
    { name: "fuel_level_out", type: "TEXT" },
    { name: "fuel_level_in", type: "TEXT" },
    { name: "notes", type: "TEXT" },
    { name: "promo_code", type: "TEXT" },
    { name: "driver_license_back_file", type: "TEXT" },
    { name: "driver_selfie_file", type: "TEXT" },
    { name: "approved_by_admin", type: "INTEGER DEFAULT 0" },
    { name: "approved_at", type: "TEXT" },
    { name: "keys_handed_at", type: "TEXT" },
    { name: "checklist_out", type: "TEXT" },
    { name: "checklist_in", type: "TEXT" },
    { name: "extension_status", type: "TEXT DEFAULT 'None'" },
    { name: "extension_request", type: "TEXT" },
    { name: "extension_quote", type: "TEXT" },
    { name: "inspection_notes", type: "TEXT" },
    { name: "inspection_passed", type: "INTEGER DEFAULT 0" },
  ]
  for (const col of requiredBookingCols) {
    if (!bookingColumns.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type};`)
      } catch (e) {
        // Ignored if already present
      }
    }
  }

  // 3. Admin Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 4. Customer / User Accounts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      driver_license_num TEXT,
      driver_license_state TEXT,
      driver_license_expiry TEXT,
      role TEXT DEFAULT 'customer',
      vip_tier TEXT DEFAULT 'Standard',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 5. Customer Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 6. Promo Codes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_percent REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      expiry_date TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 7. Maintenance Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      car_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      cost REAL NOT NULL,
      odometer INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Completed',
      technician_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed Vehicles if empty
  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM vehicles")
    .get() as { count: number }
  if (countRow.count === 0) {
    seedVehicles()
  }

  // Seed Bookings if empty
  const bookingCountRow = db
    .prepare("SELECT COUNT(*) as count FROM bookings")
    .get() as { count: number }
  if (bookingCountRow.count === 0) {
    seedBookings()
  }

  // Seed Users if empty
  const userCountRow = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number }
  if (userCountRow.count === 0) {
    seedUsers()
  }

  // Seed Promos if empty
  const promoCountRow = db
    .prepare("SELECT COUNT(*) as count FROM promo_codes")
    .get() as { count: number }
  if (promoCountRow.count === 0) {
    seedPromos()
  }

  // Seed Maintenance if empty
  const mntCountRow = db
    .prepare("SELECT COUNT(*) as count FROM maintenance_logs")
    .get() as { count: number }
  if (mntCountRow.count === 0) {
    seedMaintenance()
  }

  console.log(`[DB] Database initialized successfully at ${dbPath}`)
}

function seedVehicles() {
  const insertStmt = db.prepare(`
    INSERT INTO vehicles (
      id, name, brand, model, year, type, price_per_day, price_per_hour,
      image, gallery, rating, reviews_count, seats, transmission, fuel_type,
      mileage, luggage, features, description, is_popular, status, plate_number, location, health_score
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `)

  const initialCars = [
    {
      id: "toyota-camry",
      name: "Toyota Camry",
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      type: "Sedan",
      price_per_day: 45,
      price_per_hour: 6,
      image: "/images/car-white.jpg",
      gallery: JSON.stringify([
        "/images/car-white.jpg",
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1590362891988-f77804703080?auto=format&fit=crop&w=1200&q=80",
      ]),
      rating: 4.8,
      reviews_count: 124,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "32 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "Bluetooth",
        "Backup Camera",
        "Apple CarPlay",
        "Android Auto",
        "GPS Navigation",
      ]),
      description:
        "The Toyota Camry offers a perfect blend of comfort, reliability and efficiency. Ideal for both city driving and longer trips.",
      is_popular: 1,
      status: "Rented",
      plate_number: "FL-882-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 98,
    },
    {
      id: "honda-crv",
      name: "Honda CR-V",
      brand: "Honda",
      model: "CR-V",
      year: 2024,
      type: "SUV",
      price_per_day: 65,
      price_per_hour: 9,
      image:
        "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80",
        "/images/car-dark.jpg",
      ]),
      rating: 4.9,
      reviews_count: 98,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "30 MPG",
      luggage: "4 Large Bags",
      features: JSON.stringify([
        "Bluetooth",
        "Backup Camera",
        "Apple CarPlay",
        "All-Wheel Drive",
        "Sunroof",
      ]),
      description:
        "A versatile SUV with generous cargo space, high safety ratings, and an elevated driving posture designed for family adventures.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-319-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 95,
    },
    {
      id: "tesla-model-3",
      name: "Tesla Model 3",
      brand: "Tesla",
      model: "Model 3",
      year: 2024,
      type: "Sedan",
      price_per_day: 90,
      price_per_hour: 12,
      image:
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
        "/images/car-white.jpg",
      ]),
      rating: 4.9,
      reviews_count: 156,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Electric",
      mileage: "333 mi Range",
      luggage: "2 Large Bags",
      features: JSON.stringify([
        "Autopilot",
        "Bluetooth",
        "Backup Camera",
        "GPS Navigation",
        "Heated Seats",
      ]),
      description:
        "All-electric exhilaration with instant torque, cutting-edge minimalist interior, and Tesla autopilot safety assists.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-904-EV",
      location: "Downtown Miami",
      health_score: 99,
    },
    {
      id: "jeep-wrangler",
      name: "Jeep Wrangler",
      brand: "Jeep",
      model: "Wrangler 4x4",
      year: 2024,
      type: "SUV",
      price_per_day: 85,
      price_per_hour: 11,
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      ]),
      rating: 4.7,
      reviews_count: 82,
      seats: 4,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "22 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "4x4 Off-Road",
        "Removable Roof",
        "Bluetooth",
        "Backup Camera",
      ]),
      description:
        "The quintessential adventure vehicle. Tackle coastal highways or rugged terrain with open-air freedom.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-511-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 91,
    },
    {
      id: "bmw-3-series",
      name: "BMW 3 Series",
      brand: "BMW",
      model: "330i M Sport",
      year: 2024,
      type: "Luxury",
      price_per_day: 120,
      price_per_hour: 16,
      image: "/images/car-black.jpg",
      gallery: JSON.stringify(["/images/car-black.jpg"]),
      rating: 4.9,
      reviews_count: 142,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "28 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "M Sport Package",
        "Leather Seats",
        "Harman Kardon",
        "Apple CarPlay",
        "Sunroof",
      ]),
      description:
        "Precision German engineering meets executive luxury. Dynamic handling, exquisite interior craftsmanship.",
      is_popular: 1,
      status: "Rented",
      plate_number: "CA-782-LUX",
      location: "Los Angeles International (LAX)",
      health_score: 97,
    },
    {
      id: "honda-accord",
      name: "Honda Accord",
      brand: "Honda",
      model: "Accord EX",
      year: 2024,
      type: "Sedan",
      price_per_day: 50,
      price_per_hour: 7,
      image: "/images/car-dark.jpg",
      gallery: JSON.stringify(["/images/car-dark.jpg"]),
      rating: 4.8,
      reviews_count: 76,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "33 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "Bluetooth",
        "Backup Camera",
        "Apple CarPlay",
        "Lane Assist",
      ]),
      description:
        "Sleek fastback styling with class-leading legroom, refined interior appointments, and responsive turbo performance.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-403-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 96,
    },
    {
      id: "nissan-altima",
      name: "Nissan Altima",
      brand: "Nissan",
      model: "Altima SV",
      year: 2024,
      type: "Sedan",
      price_per_day: 42,
      price_per_hour: 6,
      image: "/images/car-white.jpg",
      gallery: JSON.stringify(["/images/car-white.jpg"]),
      rating: 4.6,
      reviews_count: 65,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "32 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "Bluetooth",
        "Backup Camera",
        "Keyless Entry",
        "Apple CarPlay",
      ]),
      description:
        "Comfort-first commuter with Nissan zero gravity seats, intelligent all-wheel drive, and easy city maneuvering.",
      is_popular: 0,
      status: "Cleaning",
      plate_number: "FL-772-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 89,
    },
    {
      id: "hyundai-sonata",
      name: "Hyundai Sonata",
      brand: "Hyundai",
      model: "Sonata SEL",
      year: 2024,
      type: "Sedan",
      price_per_day: 40,
      price_per_hour: 5,
      image: "/images/car-dark.jpg",
      gallery: JSON.stringify(["/images/car-dark.jpg"]),
      rating: 4.7,
      reviews_count: 58,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Hybrid",
      mileage: "47 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "Hybrid Economy",
        "Bluetooth",
        "Backup Camera",
        "Apple CarPlay",
      ]),
      description:
        "Futuristic horizontal LED styling, phenomenal hybrid fuel efficiency, and serene highway cruising comfort.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-621-MTR",
      location: "Downtown Miami",
      health_score: 94,
    },
    {
      id: "toyota-rav4",
      name: "Toyota RAV4",
      brand: "Toyota",
      model: "RAV4 XLE",
      year: 2024,
      type: "SUV",
      price_per_day: 60,
      price_per_hour: 8,
      image:
        "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1200&q=80",
      ]),
      rating: 4.8,
      reviews_count: 110,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "30 MPG",
      luggage: "4 Large Bags",
      features: JSON.stringify([
        "AWD",
        "Bluetooth",
        "Backup Camera",
        "Adaptive Cruise",
        "Roof Rails",
      ]),
      description:
        "America's favorite compact SUV. Robust reliability, expansive cargo floor, and confident grip.",
      is_popular: 0,
      status: "Available",
      plate_number: "NY-102-MTR",
      location: "New York JFK Airport",
      health_score: 93,
    },
    {
      id: "mercedes-c-class",
      name: "Mercedes-Benz C-Class",
      brand: "Mercedes-Benz",
      model: "C 300",
      year: 2024,
      type: "Luxury",
      price_per_day: 130,
      price_per_hour: 18,
      image: "/images/car-black.jpg",
      gallery: JSON.stringify(["/images/car-black.jpg"]),
      rating: 4.9,
      reviews_count: 94,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "26 MPG",
      luggage: "3 Large Bags",
      features: JSON.stringify([
        "Burmester 3D Sound",
        "Ambient Lighting 64-color",
        "Panoramic Sunroof",
        "Heated Seats",
      ]),
      description:
        "A mini S-Class experience with sweeping portrait touchscreen, 64-color ambient lighting, and silky mild-hybrid power.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-991-LUX",
      location: "Miami International Airport (MIA)",
      health_score: 98,
    },
    {
      id: "ford-mustang",
      name: "Ford Mustang GT",
      brand: "Ford",
      model: "Mustang GT",
      year: 2024,
      type: "Luxury",
      price_per_day: 110,
      price_per_hour: 15,
      image:
        "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
      ]),
      rating: 4.9,
      reviews_count: 88,
      seats: 4,
      transmission: "Manual",
      fuel_type: "Gasoline",
      mileage: "24 MPG",
      luggage: "2 Large Bags",
      features: JSON.stringify([
        "V8 Power",
        "Manual 6-Speed",
        "Brembo Brakes",
        "Active Exhaust",
        "Track Apps",
      ]),
      description:
        "Pure American muscle with rumbling exhaust, 6-speed manual transmission, and head-turning aerodynamic design.",
      is_popular: 0,
      status: "Maintenance",
      plate_number: "FL-500-V8",
      location: "Downtown Miami",
      health_score: 78,
    },
    {
      id: "chevrolet-suburban",
      name: "Chevrolet Suburban",
      brand: "Chevrolet",
      model: "Suburban LT",
      year: 2024,
      type: "SUV",
      price_per_day: 95,
      price_per_hour: 13,
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      ]),
      rating: 4.7,
      reviews_count: 51,
      seats: 7,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "20 MPG",
      luggage: "6 Large Bags",
      features: JSON.stringify([
        "7 Seats",
        "Rear Entertainment",
        "Towing Package",
        "Tri-Zone Climate",
      ]),
      description:
        "Full-sized luxury transport with three full rows of seating and cavernous cargo room for larger groups.",
      is_popular: 0,
      status: "Rented",
      plate_number: "FL-228-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 92,
    },
    {
      id: "toyota-corolla",
      name: "Toyota Corolla",
      brand: "Toyota",
      model: "Corolla LE",
      year: 2024,
      type: "Economy",
      price_per_day: 35,
      price_per_hour: 5,
      image: "/images/car-white.jpg",
      gallery: JSON.stringify(["/images/car-white.jpg"]),
      rating: 4.7,
      reviews_count: 140,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "35 MPG",
      luggage: "2 Large Bags",
      features: JSON.stringify([
        "Bluetooth",
        "Backup Camera",
        "Safety Sense 3.0",
        "Apple CarPlay",
      ]),
      description:
        "Reliable, ultra-efficient, and easy to park anywhere. The smart choice for budget-conscious urban exploring.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-109-MTR",
      location: "Downtown Miami",
      health_score: 95,
    },
    {
      id: "honda-civic",
      name: "Honda Civic",
      brand: "Honda",
      model: "Civic Sport",
      year: 2024,
      type: "Economy",
      price_per_day: 36,
      price_per_hour: 5,
      image: "/images/car-dark.jpg",
      gallery: JSON.stringify(["/images/car-dark.jpg"]),
      rating: 4.8,
      reviews_count: 104,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "36 MPG",
      luggage: "2 Large Bags",
      features: JSON.stringify([
        "Sport Wheels",
        "Apple CarPlay",
        "Paddle Shifters",
        "Backup Camera",
      ]),
      description:
        "Fun-to-drive dynamic chassis, modern cockpit ergonomics, and stellar reliability that punches well above its class.",
      is_popular: 0,
      status: "Available",
      plate_number: "CA-818-MTR",
      location: "Los Angeles International (LAX)",
      health_score: 97,
    },
    {
      id: "hyundai-elantra",
      name: "Hyundai Elantra",
      brand: "Hyundai",
      model: "Elantra Hybrid",
      year: 2024,
      type: "Economy",
      price_per_day: 34,
      price_per_hour: 4,
      image: "/images/car-white.jpg",
      gallery: JSON.stringify(["/images/car-white.jpg"]),
      rating: 4.6,
      reviews_count: 49,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Hybrid",
      mileage: "50 MPG",
      luggage: "2 Large Bags",
      features: JSON.stringify([
        "50 MPG Hybrid",
        "Bluetooth",
        "Backup Camera",
        "Wireless CarPlay",
      ]),
      description:
        "Geometric styling with astounding 50 MPG fuel efficiency. Perfect for long stretches of coastal highway.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-908-HYB",
      location: "Miami International Airport (MIA)",
      health_score: 94,
    },
    {
      id: "chrysler-pacifica",
      name: "Chrysler Pacifica",
      brand: "Chrysler",
      model: "Pacifica Touring",
      year: 2024,
      type: "Van",
      price_per_day: 85,
      price_per_hour: 11,
      image: "/images/car-dark.jpg",
      gallery: JSON.stringify(["/images/car-dark.jpg"]),
      rating: 4.8,
      reviews_count: 42,
      seats: 7,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "24 MPG",
      luggage: "5 Large Bags",
      features: JSON.stringify([
        "Stow 'n Go Seats",
        "Dual Power Sliding Doors",
        "Blind Spot Monitor",
        "Apple CarPlay",
      ]),
      description:
        "The undisputed king of family minivans. Stow 'n Go fold-into-floor seating and power sliding doors make group travel effortless.",
      is_popular: 0,
      status: "Maintenance",
      plate_number: "FL-440-VAN",
      location: "Orlando International (MCO)",
      health_score: 82,
    },
    {
      id: "kia-carnival",
      name: "Kia Carnival",
      brand: "Kia",
      model: "Carnival MPV",
      year: 2024,
      type: "Van",
      price_per_day: 80,
      price_per_hour: 10,
      image: "/images/car-white.jpg",
      gallery: JSON.stringify(["/images/car-white.jpg"]),
      rating: 4.8,
      reviews_count: 38,
      seats: 7,
      transmission: "Automatic",
      fuel_type: "Gasoline",
      mileage: "26 MPG",
      luggage: "5 Large Bags",
      features: JSON.stringify([
        "VIP Lounge Seating",
        "Dual Sunroofs",
        "Highway Driving Assist",
        "Smart Power Tailgate",
      ]),
      description:
        "A Multi-Purpose Vehicle that blends SUV styling with executive van comfort. Reclining VIP captain chairs for premier luxury.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-330-VAN",
      location: "Orlando International (MCO)",
      health_score: 96,
    },
  ]

  for (const car of initialCars) {
    insertStmt.run(
      car.id,
      car.name,
      car.brand,
      car.model,
      car.year,
      car.type,
      car.price_per_day,
      car.price_per_hour,
      car.image,
      car.gallery,
      car.rating,
      car.reviews_count,
      car.seats,
      car.transmission,
      car.fuel_type,
      car.mileage,
      car.luggage,
      car.features,
      car.description,
      car.is_popular,
      car.status,
      car.plate_number,
      car.location,
      car.health_score,
    )
  }
  console.log(`[DB] Seeded ${initialCars.length} vehicles into database.`)
}

function seedBookings() {
  const insertStmt = db.prepare(`
    INSERT INTO bookings (
      id, customer_first_name, customer_last_name, customer_email, customer_phone,
      driver_dob, driver_license_num, driver_license_state, driver_license_expiry, driver_license_file,
      pickup_location, return_location, pickup_date, return_date,
      requested_category, matched_car_id, status, total_amount, created_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `)

  const initialBookings = [
    {
      id: "BK-2026-9041",
      customer_first_name: "Alexander",
      customer_last_name: "Wright",
      customer_email: "a.wright@corp.com",
      customer_phone: "+1 (305) 892-1200",
      driver_dob: "10/12/1988",
      driver_license_num: "FL-9938120",
      driver_license_state: "Florida",
      driver_license_expiry: "11/2029",
      driver_license_file: "license_alex_wright.jpg",
      pickup_location: "Miami International Airport (MIA)",
      return_location: "Miami International Airport (MIA)",
      pickup_date: "Mar 20, 2026",
      return_date: "Mar 24, 2026",
      requested_category: "Sedan",
      matched_car_id: null,
      status: "Pending Assignment",
      total_amount: 180.0,
      created_at: "Today, 10:14 AM",
    },
    {
      id: "BK-2026-9042",
      customer_first_name: "Sophia",
      customer_last_name: "Martinez",
      customer_email: "sophia.m@gmail.com",
      customer_phone: "+1 (305) 441-8932",
      driver_dob: "04/05/1992",
      driver_license_num: "CA-4820199",
      driver_license_state: "California",
      driver_license_expiry: "08/2028",
      driver_license_file: "license_sophia_m.png",
      pickup_location: "Downtown Miami",
      return_location: "Miami International Airport (MIA)",
      pickup_date: "Mar 21, 2026",
      return_date: "Mar 26, 2026",
      requested_category: "SUV",
      matched_car_id: null,
      status: "Pending Assignment",
      total_amount: 325.0,
      created_at: "Today, 11:30 AM",
    },
    {
      id: "BK-2026-9038",
      customer_first_name: "John",
      customer_last_name: "Doe",
      customer_email: "john.doe@email.com",
      customer_phone: "+1 (305) 123-4567",
      driver_dob: "05/15/1990",
      driver_license_num: "D12345678",
      driver_license_state: "Florida",
      driver_license_expiry: "05/15/2030",
      driver_license_file: "driver_license_front.jpg",
      pickup_location: "Miami International Airport (MIA)",
      return_location: "Miami International Airport (MIA)",
      pickup_date: "Mar 15, 2026",
      return_date: "Mar 18, 2026",
      requested_category: "Sedan",
      matched_car_id: "toyota-camry",
      status: "Assigned",
      total_amount: 171.3,
      created_at: "Yesterday, 04:15 PM",
    },
    {
      id: "BK-2026-9035",
      customer_first_name: "David",
      customer_last_name: "Chen",
      customer_email: "david.c@techventure.io",
      customer_phone: "+1 (415) 880-9921",
      driver_dob: "09/22/1985",
      driver_license_num: "NY-8401928",
      driver_license_state: "New York",
      driver_license_expiry: "03/2027",
      driver_license_file: null,
      pickup_location: "Los Angeles International (LAX)",
      return_location: "Los Angeles International (LAX)",
      pickup_date: "Mar 22, 2026",
      return_date: "Mar 25, 2026",
      requested_category: "Luxury",
      matched_car_id: "bmw-3-series",
      status: "Assigned",
      total_amount: 360.0,
      created_at: "2 days ago",
    },
    {
      id: "BK-2026-9031",
      customer_first_name: "Emma",
      customer_last_name: "Watson",
      customer_email: "emma.w@traveler.co.uk",
      customer_phone: "+44 7911 123456",
      driver_dob: null,
      driver_license_num: null,
      driver_license_state: null,
      driver_license_expiry: null,
      driver_license_file: null,
      pickup_location: "Orlando International (MCO)",
      return_location: "Orlando International (MCO)",
      pickup_date: "Mar 25, 2026",
      return_date: "Mar 30, 2026",
      requested_category: "Van",
      matched_car_id: null,
      status: "Pending Assignment",
      total_amount: 425.0,
      created_at: "3 days ago",
    },
  ]

  for (const b of initialBookings) {
    insertStmt.run(
      b.id,
      b.customer_first_name,
      b.customer_last_name,
      b.customer_email,
      b.customer_phone,
      b.driver_dob,
      b.driver_license_num,
      b.driver_license_state,
      b.driver_license_expiry,
      b.driver_license_file,
      b.pickup_location,
      b.return_location,
      b.pickup_date,
      b.return_date,
      b.requested_category,
      b.matched_car_id,
      b.status,
      b.total_amount,
      b.created_at,
    )
  }
  console.log(`[DB] Seeded ${initialBookings.length} bookings into database.`)
}

function seedUsers() {
  const insertStmt = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const initialUsers = [
    {
      id: "usr_101",
      email: "john.doe@email.com",
      password_hash: "pass123",
      name: "John Doe",
      phone: "+1 (305) 123-4567",
      driver_license_num: "D12345678",
      driver_license_state: "Florida",
      driver_license_expiry: "05/15/2030",
      role: "customer",
      vip_tier: "Gold",
    },
    {
      id: "usr_102",
      email: "david.c@techventure.io",
      password_hash: "pass123",
      name: "David Chen",
      phone: "+1 (415) 880-9921",
      driver_license_num: "NY-8401928",
      driver_license_state: "New York",
      driver_license_expiry: "03/2027",
      role: "customer",
      vip_tier: "VIP",
    },
    {
      id: "usr_103",
      email: "sarah.m@vipclient.com",
      password_hash: "pass123",
      name: "Sarah Miller",
      phone: "+1 (312) 555-8901",
      driver_license_num: "IL-9912041",
      driver_license_state: "Illinois",
      driver_license_expiry: "11/2028",
      role: "customer",
      vip_tier: "VIP",
    },
    {
      id: "usr_admin",
      email: "admin@motorly.com",
      password_hash: "0709",
      name: "Fleet Operations Admin",
      phone: "+1 (800) 555-0709",
      driver_license_num: "ADM-0709-FL",
      driver_license_state: "Florida",
      driver_license_expiry: "12/2035",
      role: "admin",
      vip_tier: "VIP",
    },
  ]

  for (const u of initialUsers) {
    insertStmt.run(
      u.id,
      u.email,
      u.password_hash,
      u.name,
      u.phone,
      u.driver_license_num,
      u.driver_license_state,
      u.driver_license_expiry,
      u.role,
      u.vip_tier,
    )
  }
  console.log(`[DB] Seeded ${initialUsers.length} users into database.`)
}

function seedPromos() {
  const insertStmt = db.prepare(`
    INSERT INTO promo_codes (
      code, discount_percent, description, is_active, expiry_date, usage_count
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const initialPromos = [
    {
      code: "DRIVE15",
      discount_percent: 15,
      description: "Spring Fleet Explorer - 15% discount on all rentals",
      is_active: 1,
      expiry_date: "2026-12-31",
      usage_count: 38,
    },
    {
      code: "SUMMER20",
      discount_percent: 20,
      description: "Summer Roadtrip Deal - 20% off for 3+ day trips",
      is_active: 1,
      expiry_date: "2026-08-31",
      usage_count: 14,
    },
    {
      code: "VIP25",
      discount_percent: 25,
      description: "Executive Corporate Preferred Rate - 25% discount",
      is_active: 1,
      expiry_date: "2026-12-31",
      usage_count: 7,
    },
    {
      code: "FIRST10",
      discount_percent: 10,
      description: "Welcome New Driver - 10% discount on initial rental",
      is_active: 1,
      expiry_date: "2027-01-01",
      usage_count: 52,
    },
  ]

  for (const p of initialPromos) {
    insertStmt.run(
      p.code,
      p.discount_percent,
      p.description,
      p.is_active,
      p.expiry_date,
      p.usage_count,
    )
  }
  console.log(`[DB] Seeded ${initialPromos.length} promo codes into database.`)
}

function seedMaintenance() {
  const insertStmt = db.prepare(`
    INSERT INTO maintenance_logs (
      id, car_id, service_type, cost, odometer, date, status, technician_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const initialLogs = [
    {
      id: "MNT-1001",
      car_id: "toyota-camry",
      service_type: "Synthetic Oil Change & Filter",
      cost: 89.5,
      odometer: 14200,
      date: "2026-03-01",
      status: "Completed",
      technician_notes:
        "5W-30 Mobil 1 full synthetic, OEM oil filter replaced, 4-point tire rotation completed.",
    },
    {
      id: "MNT-1002",
      car_id: "jeep-wrangler",
      service_type: "Ceramic Brake Service & Rotors",
      cost: 340.0,
      odometer: 22150,
      date: "2026-03-05",
      status: "Completed",
      technician_notes:
        "Front and rear ceramic pads installed. Rotors micrometer inspected and surfaced.",
    },
    {
      id: "MNT-1003",
      car_id: "tesla-model-3",
      service_type: "Cabin Air Filter & Tire Balancing",
      cost: 120.0,
      odometer: 18400,
      date: "2026-03-10",
      status: "Completed",
      technician_notes:
        "HEPA air intake filtration replaced, 4 wheels laser road-force balanced.",
    },
    {
      id: "MNT-1004",
      car_id: "bmw-3-series",
      service_type: "Scheduled 30K Multi-Point Inspection",
      cost: 280.0,
      odometer: 29800,
      date: "2026-03-14",
      status: "In Progress",
      technician_notes:
        "Diagnostic scan performed. Brake pads at 70%. Sensor recalibration in queue.",
    },
  ]

  for (const m of initialLogs) {
    insertStmt.run(
      m.id,
      m.car_id,
      m.service_type,
      m.cost,
      m.odometer,
      m.date,
      m.status,
      m.technician_notes,
    )
  }
  console.log(
    `[DB] Seeded ${initialLogs.length} maintenance logs into database.`,
  )
}
