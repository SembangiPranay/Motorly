// server/index.ts
import express from "express";
import cors from "cors";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import pg from "pg";
var { Pool } = pg;
try {
  if (typeof process.loadEnvFile === "function") {
    ;
    process.loadEnvFile();
  }
} catch {
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var sqliteInstance = null;
var dbPath = "";
try {
  const sqliteMod = await import("node:sqlite").catch(() => null);
  if (sqliteMod && sqliteMod.DatabaseSync) {
    let dataDir = path.join(__dirname, "data");
    if (process.env.VERCEL === "1" || process.env.NOW_REGION) {
      dataDir = path.join(os.tmpdir(), "drive_rent_data");
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, "drive_rent.db");
    sqliteInstance = new sqliteMod.DatabaseSync(dbPath);
  }
} catch (e) {
  console.warn("[DB] Local SQLite initialization skipped/disabled:", e?.message);
}
var sqlite = sqliteInstance;
var SUPABASE_POOLER_URL = process.env.DATABASE_URL || "postgresql://postgres.mrbymhhcjvebpxcfmnhy:Koushik.git1@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
var SUPABASE_DIRECT_URL = process.env.SUPABASE_DIRECT_URL || "postgresql://postgres:Koushik.git1@db.mrbymhhcjvebpxcfmnhy.supabase.co:5432/postgres";
var supabasePool = null;
var isSupabaseActive = false;
function translateSql(sql) {
  let paramIndex = 1;
  let translated = sql.replace(/\?/g, () => `$${paramIndex++}`);
  translated = translated.replace(/\browid\b/gi, "created_at");
  return translated;
}
var db = {
  get isSupabase() {
    return isSupabaseActive;
  },
  get pool() {
    return supabasePool;
  },
  get sync() {
    return sqlite;
  },
  async all(sql, ...params) {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase();
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const translated = translateSql(sql);
        const res = await supabasePool.query(translated, params);
        return res.rows;
      } catch (err) {
        console.error("[Supabase Query Error]", err);
        throw err;
      }
    }
    if (sqlite) {
      return sqlite.prepare(sql).all(...params);
    }
    throw new Error("No database connection available (Supabase offline and SQLite unavailable).");
  },
  async get(sql, ...params) {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase();
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const translated = translateSql(sql);
        const res = await supabasePool.query(translated, params);
        return res.rows[0] || null;
      } catch (err) {
        console.error("[Supabase Query Error]", err);
        throw err;
      }
    }
    if (sqlite) {
      return sqlite.prepare(sql).get(...params);
    }
    throw new Error("No database connection available (Supabase offline and SQLite unavailable).");
  },
  async run(sql, ...params) {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase();
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const translated = translateSql(sql);
        const res = await supabasePool.query(translated, params);
        return {
          changes: res.rowCount || 0,
          rowCount: res.rowCount || 0
        };
      } catch (err) {
        console.error("[Supabase Exec Error]", err);
        throw err;
      }
    }
    if (sqlite) {
      const res = sqlite.prepare(sql).run(...params);
      return {
        changes: res?.changes || 1,
        rowCount: res?.changes || 1
      };
    }
    throw new Error("No database connection available (Supabase offline and SQLite unavailable).");
  },
  prepare(sql) {
    return {
      all: (...params) => db.all(sql, ...params),
      get: (...params) => db.get(sql, ...params),
      run: (...params) => db.run(sql, ...params)
    };
  }
};
async function ensureDatabase() {
  if (isSupabaseActive && supabasePool) return true;
  await initDatabase();
  return isSupabaseActive || Boolean(sqlite);
}
async function initDatabase() {
  console.log("[DB] Connecting to Supabase PostgreSQL...");
  try {
    const candidateUrls = [SUPABASE_POOLER_URL, SUPABASE_DIRECT_URL];
    let connected = false;
    for (const connStr of candidateUrls) {
      try {
        const pool = new Pool({
          connectionString: connStr,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 3500,
          max: 10
        });
        const testRes = await pool.query(
          "SELECT NOW() as now, current_database() as db"
        );
        if (testRes.rows && testRes.rows.length > 0) {
          supabasePool = pool;
          isSupabaseActive = true;
          connected = true;
          console.log(
            `[DB] Connected directly to Supabase PostgreSQL (project: mrbymhhcjvebpxcfmnhy, db: ${testRes.rows[0].db})`
          );
          break;
        }
      } catch (e) {
        console.warn(`[DB] Supabase candidate connection failed (${e.message}), trying next...`);
      }
    }
    if (connected && supabasePool) {
      await initSupabaseTables(supabasePool);
      console.log("[DB] Supabase PostgreSQL tables verified and active!");
    } else {
      console.warn(
        `[DB] Could not connect to Supabase. Falling back to local SQLite at ${dbPath}`
      );
    }
  } catch (err) {
    console.warn(
      `[DB] Error initializing Supabase (${err?.message}). Running in local SQLite mode.`
    );
  }
  if (sqlite) {
    try {
      initSqliteTables();
    } catch (e) {
      console.warn("[DB] Local SQLite mirror setup skipped:", e?.message);
    }
  } else {
    console.log("[DB] Running in pure Supabase PostgreSQL serverless mode.");
  }
}
async function initSupabaseTables(pool) {
  await pool.query(`
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
      insurance_policy TEXT,
      insurance_provider TEXT,
      insurance_expiry TEXT,
      purchase_date TEXT,
      purchase_cost REAL,
      current_odometer INTEGER,
      garage_name TEXT,
      garage_address TEXT,
      garage_lat REAL,
      garage_lng REAL,
      garage_bay TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
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
      promo_code TEXT,
      driver_license_back_file TEXT,
      driver_selfie_file TEXT,
      approved_by_admin INTEGER DEFAULT 0,
      approved_at TEXT,
      keys_handed_at TEXT,
      checklist_out TEXT,
      checklist_in TEXT,
      extension_status TEXT DEFAULT 'None',
      extension_request TEXT,
      extension_quote TEXT,
      inspection_notes TEXT,
      inspection_passed INTEGER DEFAULT 0
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_percent REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      expiry_date TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      car_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      cost REAL NOT NULL,
      odometer INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Completed',
      technician_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_matched_car') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_matched_car FOREIGN KEY (matched_car_id) REFERENCES vehicles(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_user') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_promo_code') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_promo_code FOREIGN KEY (promo_code) REFERENCES promo_codes(code) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_sessions_user') THEN
        ALTER TABLE customer_sessions ADD CONSTRAINT fk_customer_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_vehicle') THEN
        ALTER TABLE maintenance_logs ADD CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (car_id) REFERENCES vehicles(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);
}
function initSqliteTables() {
  if (!sqlite) return;
  sqlite.exec(`
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
  `);
  sqlite.exec(`
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
  `);
  const vehicleColumns = sqlite.prepare("PRAGMA table_info(vehicles)").all().map((c) => c.name);
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
    { name: "garage_bay", type: "TEXT" }
  ];
  for (const col of requiredVehicleCols) {
    if (!vehicleColumns.includes(col.name)) {
      try {
        sqlite.exec(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type};`);
      } catch (e) {
      }
    }
  }
  const bookingColumns = sqlite.prepare("PRAGMA table_info(bookings)").all().map((c) => c.name);
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
    { name: "inspection_passed", type: "INTEGER DEFAULT 0" }
  ];
  for (const col of requiredBookingCols) {
    if (!bookingColumns.includes(col.name)) {
      try {
        sqlite.exec(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type};`);
      } catch (e) {
      }
    }
  }
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
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
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_percent REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      expiry_date TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqlite.exec(`
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
  `);
  const countRow = sqlite.prepare("SELECT COUNT(*) as count FROM vehicles").get();
  if (countRow.count === 0) {
    seedVehicles();
  }
  const bookingCountRow = sqlite.prepare("SELECT COUNT(*) as count FROM bookings").get();
  if (bookingCountRow.count === 0) {
    seedBookings();
  }
  const userCountRow = sqlite.prepare("SELECT COUNT(*) as count FROM users").get();
  if (userCountRow.count === 0) {
    seedUsers();
  }
  const promoCountRow = sqlite.prepare("SELECT COUNT(*) as count FROM promo_codes").get();
  if (promoCountRow.count === 0) {
    seedPromos();
  }
  const mntCountRow = sqlite.prepare("SELECT COUNT(*) as count FROM maintenance_logs").get();
  if (mntCountRow.count === 0) {
    seedMaintenance();
  }
  console.log(`[DB] Local SQLite mirror initialized successfully at ${dbPath}`);
}
function seedVehicles() {
  if (!sqlite) return;
  const insertStmt = sqlite.prepare(`
    INSERT INTO vehicles (
      id, name, brand, model, year, type, price_per_day, price_per_hour,
      image, gallery, rating, reviews_count, seats, transmission, fuel_type,
      mileage, luggage, features, description, is_popular, status, plate_number, location, health_score
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
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
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1590362891988-f77804703080?auto=format&fit=crop&w=1200&q=80"
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
        "GPS Navigation"
      ]),
      description: "The Toyota Camry offers a perfect blend of comfort, reliability and efficiency. Ideal for both city driving and longer trips.",
      is_popular: 1,
      status: "Rented",
      plate_number: "FL-882-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 98
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
      image: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
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
        "Sunroof"
      ]),
      description: "A versatile SUV with generous cargo space, high safety ratings, and an elevated driving posture designed for family adventures.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-319-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 95
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
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80"
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
        "Heated Seats"
      ]),
      description: "All-electric exhilaration with instant torque, cutting-edge minimalist interior, and Tesla autopilot safety assists.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-904-EV",
      location: "Downtown Miami",
      health_score: 99
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
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
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
        "Backup Camera"
      ]),
      description: "The quintessential adventure vehicle. Tackle coastal highways or rugged terrain with open-air freedom.",
      is_popular: 1,
      status: "Available",
      plate_number: "FL-511-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 91
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
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Sunroof"
      ]),
      description: "Precision German engineering meets executive luxury. Dynamic handling, exquisite interior craftsmanship.",
      is_popular: 1,
      status: "Rented",
      plate_number: "CA-782-LUX",
      location: "Los Angeles International (LAX)",
      health_score: 97
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
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Lane Assist"
      ]),
      description: "Sleek fastback styling with class-leading legroom, refined interior appointments, and responsive turbo performance.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-403-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 96
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
      image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Apple CarPlay"
      ]),
      description: "Comfort-first commuter with Nissan zero gravity seats, intelligent all-wheel drive, and easy city maneuvering.",
      is_popular: 0,
      status: "Cleaning",
      plate_number: "FL-772-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 89
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
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Apple CarPlay"
      ]),
      description: "Futuristic horizontal LED styling, phenomenal hybrid fuel efficiency, and serene highway cruising comfort.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-621-MTR",
      location: "Downtown Miami",
      health_score: 94
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
      image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1200&q=80"
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
        "Roof Rails"
      ]),
      description: "America's favorite compact SUV. Robust reliability, expansive cargo floor, and confident grip.",
      is_popular: 0,
      status: "Available",
      plate_number: "NY-102-MTR",
      location: "New York JFK Airport",
      health_score: 93
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
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Heated Seats"
      ]),
      description: "A mini S-Class experience with sweeping portrait touchscreen, 64-color ambient lighting, and silky mild-hybrid power.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-991-LUX",
      location: "Miami International Airport (MIA)",
      health_score: 98
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
      image: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80"
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
        "Track Apps"
      ]),
      description: "Pure American muscle with rumbling exhaust, 6-speed manual transmission, and head-turning aerodynamic design.",
      is_popular: 0,
      status: "Maintenance",
      plate_number: "FL-500-V8",
      location: "Downtown Miami",
      health_score: 78
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
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
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
        "Tri-Zone Climate"
      ]),
      description: "Full-sized luxury transport with three full rows of seating and cavernous cargo room for larger groups.",
      is_popular: 0,
      status: "Rented",
      plate_number: "FL-228-MTR",
      location: "Miami International Airport (MIA)",
      health_score: 92
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
      image: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Apple CarPlay"
      ]),
      description: "Reliable, ultra-efficient, and easy to park anywhere. The smart choice for budget-conscious urban exploring.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-109-MTR",
      location: "Downtown Miami",
      health_score: 95
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
      image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Backup Camera"
      ]),
      description: "Fun-to-drive dynamic chassis, modern cockpit ergonomics, and stellar reliability that punches well above its class.",
      is_popular: 0,
      status: "Available",
      plate_number: "CA-818-MTR",
      location: "Los Angeles International (LAX)",
      health_score: 97
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
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Wireless CarPlay"
      ]),
      description: "Geometric styling with astounding 50 MPG fuel efficiency. Perfect for long stretches of coastal highway.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-908-HYB",
      location: "Miami International Airport (MIA)",
      health_score: 94
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
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Apple CarPlay"
      ]),
      description: "The undisputed king of family minivans. Stow 'n Go fold-into-floor seating and power sliding doors make group travel effortless.",
      is_popular: 0,
      status: "Maintenance",
      plate_number: "FL-440-VAN",
      location: "Orlando International (MCO)",
      health_score: 82
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
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
      ]),
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
        "Smart Power Tailgate"
      ]),
      description: "A Multi-Purpose Vehicle that blends SUV styling with executive van comfort. Reclining VIP captain chairs for premier luxury.",
      is_popular: 0,
      status: "Available",
      plate_number: "FL-330-VAN",
      location: "Orlando International (MCO)",
      health_score: 96
    }
  ];
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
      car.health_score
    );
  }
  console.log(`[DB] Seeded ${initialCars.length} vehicles into database.`);
}
function seedBookings() {
  if (!sqlite) return;
  const insertStmt = sqlite.prepare(`
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
  `);
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
      total_amount: 180,
      created_at: "Today, 10:14 AM"
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
      total_amount: 325,
      created_at: "Today, 11:30 AM"
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
      created_at: "Yesterday, 04:15 PM"
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
      total_amount: 360,
      created_at: "2 days ago"
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
      total_amount: 425,
      created_at: "3 days ago"
    }
  ];
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
      b.created_at
    );
  }
  console.log(`[DB] Seeded ${initialBookings.length} bookings into database.`);
}
function seedUsers() {
  if (!sqlite) return;
  const insertStmt = sqlite.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
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
      vip_tier: "Gold"
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
      vip_tier: "VIP"
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
      vip_tier: "VIP"
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
      vip_tier: "VIP"
    }
  ];
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
      u.vip_tier
    );
  }
  console.log(`[DB] Seeded ${initialUsers.length} users into database.`);
}
function seedPromos() {
  if (!sqlite) return;
  const insertStmt = sqlite.prepare(`
    INSERT INTO promo_codes (
      code, discount_percent, description, is_active, expiry_date, usage_count
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const initialPromos = [
    {
      code: "DRIVE15",
      discount_percent: 15,
      description: "Spring Fleet Explorer - 15% discount on all rentals",
      is_active: 1,
      expiry_date: "2026-12-31",
      usage_count: 38
    },
    {
      code: "SUMMER20",
      discount_percent: 20,
      description: "Summer Roadtrip Deal - 20% off for 3+ day trips",
      is_active: 1,
      expiry_date: "2026-08-31",
      usage_count: 14
    },
    {
      code: "VIP25",
      discount_percent: 25,
      description: "Executive Corporate Preferred Rate - 25% discount",
      is_active: 1,
      expiry_date: "2026-12-31",
      usage_count: 7
    },
    {
      code: "FIRST10",
      discount_percent: 10,
      description: "Welcome New Driver - 10% discount on initial rental",
      is_active: 1,
      expiry_date: "2027-01-01",
      usage_count: 52
    }
  ];
  for (const p of initialPromos) {
    insertStmt.run(
      p.code,
      p.discount_percent,
      p.description,
      p.is_active,
      p.expiry_date,
      p.usage_count
    );
  }
  console.log(`[DB] Seeded ${initialPromos.length} promo codes into database.`);
}
function seedMaintenance() {
  if (!sqlite) return;
  const insertStmt = sqlite.prepare(`
    INSERT INTO maintenance_logs (
      id, car_id, service_type, cost, odometer, date, status, technician_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const initialLogs = [
    {
      id: "MNT-1001",
      car_id: "toyota-camry",
      service_type: "Synthetic Oil Change & Filter",
      cost: 89.5,
      odometer: 14200,
      date: "2026-03-01",
      status: "Completed",
      technician_notes: "5W-30 Mobil 1 full synthetic, OEM oil filter replaced, 4-point tire rotation completed."
    },
    {
      id: "MNT-1002",
      car_id: "jeep-wrangler",
      service_type: "Ceramic Brake Service & Rotors",
      cost: 340,
      odometer: 22150,
      date: "2026-03-05",
      status: "Completed",
      technician_notes: "Front and rear ceramic pads installed. Rotors micrometer inspected and surfaced."
    },
    {
      id: "MNT-1003",
      car_id: "tesla-model-3",
      service_type: "Cabin Air Filter & Tire Balancing",
      cost: 120,
      odometer: 18400,
      date: "2026-03-10",
      status: "Completed",
      technician_notes: "HEPA air intake filtration replaced, 4 wheels laser road-force balanced."
    },
    {
      id: "MNT-1004",
      car_id: "bmw-3-series",
      service_type: "Scheduled 30K Multi-Point Inspection",
      cost: 280,
      odometer: 29800,
      date: "2026-03-14",
      status: "In Progress",
      technician_notes: "Diagnostic scan performed. Brake pads at 70%. Sensor recalibration in queue."
    }
  ];
  for (const m of initialLogs) {
    insertStmt.run(
      m.id,
      m.car_id,
      m.service_type,
      m.cost,
      m.odometer,
      m.date,
      m.status,
      m.technician_notes
    );
  }
  console.log(
    `[DB] Seeded ${initialLogs.length} maintenance logs into database.`
  );
}

// server/index.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
try {
  await initDatabase();
} catch (err) {
  console.warn("[DB Init Warning]", err?.message);
}
var app = express();
var PORT = process.env.PORT_BACKEND || 3001;
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "0709";
var JWT_SECRET = process.env.JWT_SECRET || "motorly-fleet-jwt-secret-secure-key-2026-prod";
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use((req, _res, next) => {
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});
app.get(["/api", "/api/health"], async (_req, res) => {
  res.json({
    status: "ok",
    service: "MOTORLY Fleet API",
    supabase: db.isSupabase,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function formatCarRow(row) {
  if (!row) return null;
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
    gallery: typeof row.gallery === "string" ? JSON.parse(row.gallery || "[]") : row.gallery,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    seats: row.seats,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    mileage: row.mileage,
    luggage: row.luggage,
    features: typeof row.features === "string" ? JSON.parse(row.features || "[]") : row.features,
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
    garageAddress: row.garage_address || row.location || "4200 NW 21st St, Miami, FL 33142",
    garageLat: Number(row.garage_lat) || 25.7959,
    garageLng: Number(row.garage_lng) || -80.287,
    garageBay: row.garage_bay || "Bay 14-B"
  };
}
function formatBookingRow(row) {
  if (!row) return null;
  let checklistOut = void 0;
  let checklistIn = void 0;
  let extensionRequest = void 0;
  let extensionQuote = void 0;
  try {
    if (row.checklist_out) {
      const parsed = JSON.parse(row.checklist_out);
      checklistOut = {
        ...parsed,
        fuelLevelOut: parsed.fuelLevelOut || parsed.fuelOut || "100%"
      };
    }
  } catch {
  }
  try {
    if (row.checklist_in) {
      const parsed = JSON.parse(row.checklist_in);
      checklistIn = {
        ...parsed,
        fuelLevelIn: parsed.fuelLevelIn || parsed.fuelIn || "100%"
      };
    }
  } catch {
  }
  try {
    if (row.extension_request) {
      const parsed = JSON.parse(row.extension_request);
      extensionRequest = {
        ...parsed,
        durationValue: parsed.durationValue ?? parsed.extraDuration ?? 1,
        durationUnit: parsed.durationUnit ?? parsed.unit ?? "days",
        reason: parsed.reason ?? parsed.customerNotes ?? ""
      };
    }
  } catch {
  }
  try {
    if (row.extension_quote) extensionQuote = JSON.parse(row.extension_quote);
  } catch {
  }
  return {
    id: row.id,
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone
    },
    driver: {
      dateOfBirth: row.driver_dob || "",
      licenseNumber: row.driver_license_num || "",
      licenseState: row.driver_license_state || "",
      licenseExpiry: row.driver_license_expiry || "",
      licenseFileName: row.driver_license_file || void 0,
      licenseBackFileName: row.driver_license_back_file || void 0,
      licensePhotoFront: row.driver_license_file && row.driver_license_file.startsWith("data:") ? row.driver_license_file : void 0,
      licensePhotoBack: row.driver_license_back_file && row.driver_license_back_file.startsWith("data:") ? row.driver_license_back_file : void 0,
      selfieFileName: row.driver_selfie_file || void 0
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
    userId: row.user_id || void 0,
    odometerOut: row.odometer_out || void 0,
    odometerIn: row.odometer_in || void 0,
    fuelLevelOut: row.fuel_level_out || void 0,
    fuelLevelIn: row.fuel_level_in || void 0,
    notes: row.notes || void 0,
    promoCode: row.promo_code || void 0,
    approvedByAdmin: Boolean(row.approved_by_admin),
    approvedAt: row.approved_at || void 0,
    keysHandedAt: row.keys_handed_at || void 0,
    checklistOut,
    checklistIn,
    extensionStatus: row.extension_status || "None",
    extensionRequest,
    extensionQuote,
    inspectionNotes: row.inspection_notes || void 0,
    inspectionPassed: Boolean(row.inspection_passed)
  };
}
function formatUserRow(row) {
  if (!row) return null;
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
    createdAt: row.created_at
  };
}
function formatPromoRow(row) {
  if (!row) return null;
  return {
    code: row.code,
    discountPercent: row.discount_percent,
    description: row.description || "",
    isActive: Boolean(row.is_active),
    expiryDate: row.expiry_date || "2026-12-31",
    usageCount: row.usage_count || 0
  };
}
function formatMaintenanceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    carId: row.car_id,
    carName: row.car_name || void 0,
    serviceType: row.service_type,
    cost: row.cost,
    odometer: row.odometer,
    date: row.date,
    status: row.status,
    technicianNotes: row.technician_notes || ""
  };
}
function generateJwtToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
function parseAuthHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}
function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
app.post("/api/auth/login", async (req, res) => {
  const { password, email } = req.body;
  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required."
    });
  }
  const isMasterPass = password === ADMIN_PASSWORD || password === "0709";
  let dbAdminUser = null;
  if (email) {
    dbAdminUser = await db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email.trim().toLowerCase());
  }
  let isDbPassValid = false;
  if (dbAdminUser && dbAdminUser.password_hash) {
    if (dbAdminUser.password_hash.startsWith("$2a$") || dbAdminUser.password_hash.startsWith("$2b$")) {
      isDbPassValid = await bcrypt.compare(password, dbAdminUser.password_hash);
    } else {
      isDbPassValid = dbAdminUser.password_hash === password;
    }
  }
  if (!isMasterPass && !isDbPassValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid administrator credentials. Use passcode 0709 or authorized admin email."
    });
  }
  const adminPayload = {
    userId: dbAdminUser?.id || "usr_admin",
    email: dbAdminUser?.email || email || "admin@motorly.com",
    name: dbAdminUser?.name || "Fleet Operations Admin",
    role: "admin",
    vipTier: "VIP"
  };
  const token = generateJwtToken(adminPayload, "24h");
  await db.prepare("INSERT INTO admin_sessions (token) VALUES (?)").run(token);
  return res.json({
    success: true,
    token,
    role: "admin",
    user: adminPayload,
    message: "Admin authenticated successfully with JWT."
  });
});
app.post("/api/auth/verify", async (req, res) => {
  const token = parseAuthHeader(req) || req.body?.token;
  if (!token) return res.status(401).json({ authenticated: false });
  const decoded = verifyJwtToken(token);
  if (decoded && decoded.role === "admin") {
    return res.json({ authenticated: true, role: "admin", user: decoded });
  }
  const session = await db.prepare("SELECT token FROM admin_sessions WHERE token = ?").get(token);
  if (!session) {
    return res.status(401).json({ authenticated: false, message: "Session expired or invalid." });
  }
  return res.json({
    authenticated: true,
    role: "admin",
    user: {
      userId: "usr_admin",
      email: "admin@motorly.com",
      name: "Fleet Operations Admin",
      role: "admin"
    }
  });
});
app.post("/api/auth/register", async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    driverLicenseNum,
    driverLicenseState,
    driverLicenseExpiry
  } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and full name are required."
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters."
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists."
    });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.prepare(`
    INSERT INTO users (
      id, email, password_hash, name, phone, driver_license_num, driver_license_state, driver_license_expiry, role, vip_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'customer', 'Standard')
  `).run(
    userId,
    normalizedEmail,
    passwordHash,
    name.trim(),
    phone || "",
    driverLicenseNum || "",
    driverLicenseState || "",
    driverLicenseExpiry || ""
  );
  const userPayload = {
    userId,
    email: normalizedEmail,
    name: name.trim(),
    role: "customer",
    vipTier: "Standard"
  };
  const token = generateJwtToken(userPayload, "7d");
  await db.prepare("INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  const newUser = await db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  return res.status(201).json({
    success: true,
    token,
    user: formatUserRow(newUser),
    message: "Customer account created successfully."
  });
});
app.post("/api/auth/customer-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }
  let isPasswordValid = false;
  if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
    isPasswordValid = await bcrypt.compare(password, user.password_hash);
  } else {
    if (user.password_hash === password) {
      isPasswordValid = true;
      const upgradedHash = await bcrypt.hash(password, 10);
      await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(upgradedHash, user.id);
    }
  }
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }
  const userPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "customer",
    vipTier: user.vip_tier || "Standard"
  };
  const token = generateJwtToken(userPayload, "7d");
  await db.prepare("INSERT INTO customer_sessions (token, user_id) VALUES (?, ?)").run(token, user.id);
  return res.json({
    success: true,
    token,
    user: formatUserRow(user),
    message: "Logged in successfully."
  });
});
app.get("/api/auth/customer-me", async (req, res) => {
  const token = parseAuthHeader(req);
  if (!token) {
    return res.status(401).json({ authenticated: false, message: "No token provided." });
  }
  const decoded = verifyJwtToken(token);
  if (decoded) {
    if (decoded.role === "admin") {
      return res.json({
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: "admin",
          vipTier: "VIP",
          phone: "+1 (305) 555-0709"
        }
      });
    }
    const user2 = await db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId);
    if (user2) {
      return res.json({ authenticated: true, user: formatUserRow(user2) });
    }
  }
  const session = await db.prepare("SELECT user_id FROM customer_sessions WHERE token = ?").get(token);
  if (!session) {
    return res.status(401).json({ authenticated: false, message: "Session invalid or expired." });
  }
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id);
  if (!user) {
    return res.status(404).json({ authenticated: false, message: "User not found." });
  }
  return res.json({ authenticated: true, user: formatUserRow(user) });
});
app.post("/api/auth/customer-logout", async (req, res) => {
  const token = parseAuthHeader(req);
  if (token) {
    await db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token);
  }
  return res.json({ success: true, message: "Logged out." });
});
app.get("/api/users/bookings", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  let userEmail = req.query.email;
  if (token) {
    const session = await db.prepare("SELECT user_id FROM customer_sessions WHERE token = ?").get(token);
    if (session) {
      const user = await db.prepare("SELECT email FROM users WHERE id = ?").get(session.user_id);
      if (user) {
        userEmail = user.email;
      }
    }
  }
  if (!userEmail) {
    return res.status(400).json({ error: "Authentication or email required to view reservations." });
  }
  const rows = await db.prepare(`
    SELECT * FROM bookings 
    WHERE customer_email = ? 
    ORDER BY created_at DESC
  `).all(userEmail.trim().toLowerCase());
  return res.json(rows.map(formatBookingRow));
});
app.get("/api/cars", async (req, res) => {
  const { status, type, search, maxPrice, pickupDate, returnDate } = req.query;
  let query = "SELECT * FROM vehicles WHERE 1=1";
  const params = [];
  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }
  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }
  if (maxPrice) {
    query += " AND price_per_day <= ?";
    params.push(Number(maxPrice));
  }
  if (search) {
    query += " AND (name LIKE ? OR brand LIKE ? OR plate_number LIKE ?)";
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard);
  }
  query += " ORDER BY is_popular DESC, price_per_day ASC";
  const rows = await db.prepare(query).all(...params);
  const cars = rows.map(formatCarRow);
  if (pickupDate && returnDate) {
    for (const car of cars) {
      const conflict = await findVehicleBookingConflict(
        car.id,
        String(pickupDate),
        String(returnDate)
      );
      car.isAvailableForDates = !conflict && car.status !== "Maintenance";
      car.conflict = conflict || null;
      if (conflict) {
        car.statusForDates = "Reserved";
      } else {
        car.statusForDates = car.status;
      }
    }
  }
  return res.json(cars);
});
app.get("/api/cars/:id", async (req, res) => {
  const row = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Vehicle not found." });
  }
  return res.json(formatCarRow(row));
});
app.post("/api/cars", async (req, res) => {
  const car = req.body;
  const newId = car.id || (car.name || "vehicle").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;
  const galleryJson = JSON.stringify(
    car.gallery && car.gallery.length ? car.gallery : [car.image || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"]
  );
  const featuresJson = JSON.stringify(
    car.features || ["Bluetooth", "Apple CarPlay"]
  );
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
    car.image || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
    galleryJson,
    Number(car.rating) || 5,
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
    car.garageBay || "Bay 14-B"
  );
  const created = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(newId);
  return res.status(201).json(formatCarRow(created));
});
app.put("/api/cars/:id", async (req, res) => {
  const car = req.body;
  const carId = req.params.id;
  const existing = await db.prepare("SELECT id FROM vehicles WHERE id = ?").get(carId);
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." });
  }
  const galleryJson = JSON.stringify(car.gallery || [car.image]);
  const featuresJson = JSON.stringify(car.features || []);
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
    carId
  );
  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  return res.json(formatCarRow(updated));
});
app.patch("/api/cars/:id/status", async (req, res) => {
  const { status } = req.body;
  const carId = req.params.id;
  if (!status) return res.status(400).json({ error: "Status is required." });
  await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(status, carId);
  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  return res.json(formatCarRow(updated));
});
app.delete("/api/cars/:id", async (req, res) => {
  await db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id);
  return res.json({
    success: true,
    message: "Vehicle decommissioned and removed."
  });
});
function parseDateRange(pickupStr, returnStr) {
  let start = Date.parse(pickupStr);
  let end = Date.parse(returnStr);
  if (isNaN(start)) start = Date.now();
  if (isNaN(end)) end = start + 3 * 24 * 60 * 60 * 1e3;
  if (end <= start) end = start + 24 * 60 * 60 * 1e3;
  return { start, end };
}
function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}
async function findVehicleBookingConflict(carId, pickupStr, returnStr, excludeBookingId) {
  const { start: reqStart, end: reqEnd } = parseDateRange(pickupStr, returnStr);
  let query = `
    SELECT id, customer_first_name, customer_last_name, pickup_date, return_date, status
    FROM bookings
    WHERE matched_car_id = ?
      AND status NOT IN ('Completed', 'Cancelled')
  `;
  const params = [carId];
  if (excludeBookingId) {
    query += " AND id != ?";
    params.push(excludeBookingId);
  }
  const activeBookings = await db.prepare(query).all(...params);
  for (const b of activeBookings) {
    const { start: bStart, end: bEnd } = parseDateRange(
      b.pickup_date,
      b.return_date
    );
    if (datesOverlap(reqStart, reqEnd, bStart, bEnd)) {
      return {
        conflictingBookingId: b.id,
        customerName: `${b.customer_first_name} ${b.customer_last_name}`,
        pickupDate: b.pickup_date,
        returnDate: b.return_date,
        status: b.status
      };
    }
  }
  return null;
}
app.get("/api/cars/:id/availability", async (req, res) => {
  const carId = req.params.id;
  const pickupDate = req.query.pickupDate || "Mar 15, 2026";
  const returnDate = req.query.returnDate || "Mar 18, 2026";
  const car = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  if (!car) return res.status(404).json({ error: "Vehicle not found." });
  const conflict = await findVehicleBookingConflict(carId, pickupDate, returnDate);
  const isAvailable = !conflict && car.status !== "Maintenance";
  return res.json({
    carId,
    isAvailable,
    carStatus: car.status,
    conflict: conflict || null
  });
});
app.get("/api/bookings", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
  return res.json(rows.map(formatBookingRow));
});
app.post("/api/bookings", async (req, res) => {
  const b = req.body;
  const id = b.id || `MTR-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const nowText = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const matchedCarId = b.matchedCarId || b.carId || null;
  const pickupDate = b.pickupDate || "Mar 15, 2026";
  const returnDate = b.returnDate || "Mar 18, 2026";
  if (matchedCarId) {
    const vehicleExists = await db.prepare("SELECT id FROM vehicles WHERE id = ?").get(matchedCarId);
    if (!vehicleExists) {
      return res.status(400).json({
        success: false,
        error: `Selected vehicle "${matchedCarId}" does not exist in fleet inventory.`
      });
    }
    const conflict = await findVehicleBookingConflict(
      matchedCarId,
      pickupDate,
      returnDate
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Double Booking Conflict: This vehicle is already reserved for overlapping dates (${conflict.pickupDate} \u2013 ${conflict.returnDate}) under reservation ${conflict.conflictingBookingId}. Please select another car or change your rental dates.`
      });
    }
  }
  const status = matchedCarId ? "Assigned" : "Pending Assignment";
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
    b.driver?.licensePhotoFront || b.driver?.licenseFileName || "dl_front_default.jpg",
    b.driver?.licensePhotoBack || b.driver?.licenseBackFileName || "dl_back_default.jpg",
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
    b.promoCode || null
  );
  if (matchedCarId) {
    await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
      matchedCarId
    );
  }
  const created = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  return res.status(201).json(formatBookingRow(created));
});
app.get("/api/bookings/:id/download-license", async (req, res) => {
  const bookingId = req.params.id;
  const side = req.query.side || "front";
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const fullName = `${booking.customer_first_name} ${booking.customer_last_name}`.trim();
  const cleanName = fullName.replace(/[^a-zA-Z0-9]+/g, "_");
  const targetPhoto = side === "back" ? booking.driver_license_back_file : booking.driver_license_file;
  if (side !== "certificate" && targetPhoto && targetPhoto.startsWith("data:image/")) {
    const match = targetPhoto.match(
      /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/
    );
    if (match) {
      const mimeType = match[1];
      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const buffer = Buffer.from(match[2], "base64");
      const filename = `DL_${side.toUpperCase()}_${cleanName}_${booking.id}.${ext}`;
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    }
  }
  const filePrefix = side === "certificate" ? "DL_CERTIFICATE" : `DL_${side.toUpperCase()}`;
  const fileName = `${filePrefix}_${cleanName}_${booking.id}.svg`;
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="380" viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <!-- Card Background -->
  <rect width="600" height="380" rx="24" fill="#0D0E11" stroke="#F97316" stroke-width="2"/>
  <rect x="20" y="20" width="560" height="340" rx="16" fill="#17191C" stroke="#2B2D31" stroke-width="1"/>
  
  <!-- Header Bar -->
  <rect x="20" y="20" width="560" height="60" rx="16" fill="#1F2126"/>
  <text x="45" y="55" fill="#F97316" font-size="12" font-weight="900" letter-spacing="2">OFFICIAL MOTORLY DRIVER IDENTIFICATION RECORD</text>
  <text x="450" y="55" fill="#10B981" font-size="11" font-weight="700">\u2713 VERIFIED BY OPS</text>
  
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
  <text x="200" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${booking.driver_license_state || "Florida"} \u2022 Exp: ${booking.driver_license_expiry || "12/2029"}</text>
  
  <text x="380" y="235" fill="#9CA3AF" font-size="10" font-weight="700" letter-spacing="1">DATE OF BIRTH</text>
  <text x="380" y="254" fill="#FFFFFF" font-size="13" font-weight="600">${booking.driver_dob || "05/15/1990"}</text>
  
  <!-- Footer Bar with Security Fingerprint -->
  <line x1="45" y1="295" x2="555" y2="295" stroke="#2B2D31" stroke-width="1"/>
  <text x="45" y="325" fill="#6B7280" font-size="10" font-family="monospace">BOOKING TICKET: ${booking.id}</text>
  <text x="45" y="342" fill="#6B7280" font-size="10">ATTACHMENT: ${booking.driver_license_file ? booking.driver_license_file.startsWith("data:") ? "Original Photo (Front)" : booking.driver_license_file : "dl_front.png"} + ${booking.driver_license_back_file ? booking.driver_license_back_file.startsWith("data:") ? "Original Photo (Back)" : booking.driver_license_back_file : "dl_back.png"}</text>
  <text x="410" y="335" fill="#F97316" font-size="11" font-weight="800">MOTORLY SECURE ID</text>
</svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.send(svgContent);
});
app.post("/api/bookings/:id/approve", async (req, res) => {
  const bookingId = req.params.id;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(`
    UPDATE bookings SET
      approved_by_admin = 1,
      approved_at = ?
    WHERE id = ?
  `).run(nowIso, bookingId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Reservation ${bookingId} approved. Green signal given to customer for garage pickup!`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/handover-keys", async (req, res) => {
  const bookingId = req.params.id;
  const { odometerOut, fuelOut, exteriorClean, tiresInspected, staffSign } = req.body;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const checklistObj = {
    odometerOut: Number(odometerOut) || 14250,
    fuelOut: fuelOut || "100%",
    exteriorClean: Boolean(exteriorClean !== false),
    tiresInspected: Boolean(tiresInspected !== false),
    keysGiven: true,
    staffSign: staffSign || "Fleet Manager / Operations Desk",
    timestamp: nowIso
  };
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
    bookingId
  );
  if (booking.matched_car_id) {
    await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
      booking.matched_car_id
    );
  }
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Keys handed over for ${bookingId}! Official rental clock started at ${nowIso}.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/request-extension", async (req, res) => {
  const bookingId = req.params.id;
  const { extraDuration, unit, customerNotes } = req.body;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const durationNum = Number(extraDuration) || 1;
  const unitStr = unit || "days";
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const extRequest = {
    extraDuration: durationNum,
    unit: unitStr,
    customerNotes: customerNotes || "Customer requested rental extension via app.",
    requestedAt: nowIso
  };
  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Requested',
      extension_request = ?
    WHERE id = ?
  `).run(JSON.stringify(extRequest), bookingId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Extension request for +${durationNum} ${unitStr} submitted. Awaiting manager quotation.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/quote-extension", async (req, res) => {
  const bookingId = req.params.id;
  const { rateType, rateAmount, totalQuotedAmount, adminNotes } = req.body;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const quoteObj = {
    rateType: rateType || "day",
    rateAmount: Number(rateAmount) || 55,
    totalQuotedAmount: Number(totalQuotedAmount) || 55,
    adminNotes: adminNotes || "Standard fleet rate extension quotation.",
    quotedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Quoted',
      extension_quote = ?
    WHERE id = ?
  `).run(JSON.stringify(quoteObj), bookingId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Quotation of $${quoteObj.totalQuotedAmount} sent to customer for approval.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/approve-extension", async (req, res) => {
  const bookingId = req.params.id;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  let quote = {};
  try {
    if (booking.extension_quote) quote = JSON.parse(booking.extension_quote);
  } catch {
  }
  const additionalCost = Number(quote.totalQuotedAmount) || 0;
  const newTotal = Number(booking.total_amount) + additionalCost;
  const updatedNotes = `${booking.notes ? booking.notes + " | " : ""}Extended (+${quote.rateType || "period"}: +$${additionalCost})`;
  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Approved',
      total_amount = ?,
      notes = ?
    WHERE id = ?
  `).run(newTotal, updatedNotes, bookingId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Extension approved! $${additionalCost.toFixed(2)} added to rental bill. New total: $${newTotal.toFixed(2)}.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/decline-extension", async (req, res) => {
  const bookingId = req.params.id;
  await db.prepare(`
    UPDATE bookings SET
      extension_status = 'Declined'
    WHERE id = ?
  `).run(bookingId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: "Extension declined.",
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/return-inspection", async (req, res) => {
  const bookingId = req.params.id;
  const {
    odometerIn,
    fuelIn,
    damageFound,
    cleanlinessPass,
    inspectionPassed,
    staffSign,
    inspectionNotes
  } = req.body;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const checklistInObj = {
    odometerIn: Number(odometerIn) || 14380,
    fuelIn: fuelIn || "100%",
    damageFound: Boolean(damageFound),
    cleanlinessPass: Boolean(cleanlinessPass !== false),
    inspectionPassed: Boolean(inspectionPassed !== false),
    staffSign: staffSign || "Garage Return Inspector",
    timestamp: nowIso
  };
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
    bookingId
  );
  if (booking.matched_car_id) {
    const nextCarStatus = checklistInObj.cleanlinessPass ? "Available" : "Cleaning";
    await db.prepare(
      "UPDATE vehicles SET status = ?, current_odometer = ? WHERE id = ?"
    ).run(nextCarStatus, checklistInObj.odometerIn, booking.matched_car_id);
  }
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Inspection passed! Ride completed and booking ${bookingId} finalized.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/bookings/:id/mate", async (req, res) => {
  const bookingId = req.params.id;
  const { carId } = req.body;
  if (!carId) {
    return res.status(400).json({ error: "carId is required to mate vehicle." });
  }
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const car = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  if (!car) {
    return res.status(404).json({ error: "Vehicle not found." });
  }
  const conflict = await findVehicleBookingConflict(
    carId,
    booking.pickup_date,
    booking.return_date,
    bookingId
  );
  if (conflict) {
    return res.status(409).json({
      error: `Conflict: Vehicle is already mated to reservation ${conflict.conflictingBookingId} (${conflict.customerName}) for overlapping dates (${conflict.pickupDate} \u2013 ${conflict.returnDate}).`
    });
  }
  await db.prepare(
    "UPDATE bookings SET matched_car_id = ?, status = 'Assigned' WHERE id = ?"
  ).run(carId, bookingId);
  await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId);
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  const updatedCar = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  return res.json({
    success: true,
    message: `Vehicle ${car.name} (${car.plate_number}) successfully mated to booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking),
    car: formatCarRow(updatedCar)
  });
});
app.post("/api/bookings/:id/unmate", async (req, res) => {
  const bookingId = req.params.id;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const prevCarId = booking.matched_car_id;
  await db.prepare(
    "UPDATE bookings SET matched_car_id = NULL, status = 'Pending Assignment' WHERE id = ?"
  ).run(bookingId);
  if (prevCarId) {
    await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
      prevCarId
    );
  }
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Vehicle released from booking ${bookingId}.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.patch("/api/bookings/:id/status", async (req, res) => {
  const bookingId = req.params.id;
  const { status, odometerOut, odometerIn, fuelLevelOut, fuelLevelIn, notes } = req.body;
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  const validStatuses = [
    "Pending Assignment",
    "Assigned",
    "Checked Out",
    "Returned",
    "Completed",
    "Cancelled"
  ];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    });
  }
  const newStatus = status || booking.status;
  const carId = booking.matched_car_id;
  if (carId) {
    if (newStatus === "Checked Out") {
      await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(
        carId
      );
    } else if (newStatus === "Returned") {
      await db.prepare("UPDATE vehicles SET status = 'Cleaning' WHERE id = ?").run(
        carId
      );
    } else if (newStatus === "Completed") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
        carId
      );
    } else if (newStatus === "Cancelled") {
      await db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(
        carId
      );
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
    bookingId
  );
  const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
  return res.json({
    success: true,
    message: `Booking ${bookingId} transitioned to ${newStatus}.`,
    booking: formatBookingRow(updatedBooking)
  });
});
app.post("/api/admin/counter-booking", async (req, res) => {
  const b = req.body;
  const id = b.id || `CWK-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const nowText = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const carId = b.carId;
  if (!carId) {
    return res.status(400).json({ error: "A vehicle must be selected for counter dispatch." });
  }
  const car = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId);
  if (!car) {
    return res.status(404).json({ error: "Selected vehicle not found." });
  }
  const conflict = await findVehicleBookingConflict(
    carId,
    b.pickupDate || "Today, Right Now",
    b.returnDate || "In 3 Days"
  );
  if (conflict || car.status === "Rented") {
    return res.status(409).json({
      error: `Conflict: ${car.name} (${car.plate_number}) is currently rented or assigned to another active reservation.`
    });
  }
  const initialStatus = b.immediateCheckout ? "Checked Out" : "Assigned";
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
    b.licenseNumber || `DL-${Math.floor(1e7 + Math.random() * 9e7)}`,
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
    b.notes || "Express counter walk-in reservation."
  );
  await db.prepare("UPDATE vehicles SET status = 'Rented' WHERE id = ?").run(carId);
  const created = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  return res.status(201).json({
    success: true,
    message: `Counter walk-in reservation ${id} issued for ${car.name}.`,
    booking: formatBookingRow(created)
  });
});
app.get("/api/admin/customers", async (req, res) => {
  const users = await db.prepare(
    "SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC"
  ).all();
  const allBookings = await db.prepare("SELECT * FROM bookings").all();
  const customerMap = /* @__PURE__ */ new Map();
  for (const u of users) {
    const userBookings = allBookings.filter(
      (b) => b.customer_email.toLowerCase() === u.email.toLowerCase()
    );
    const totalSpent = userBookings.reduce(
      (sum, b) => sum + Number(b.total_amount),
      0
    );
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
      latestBooking: userBookings[0] ? userBookings[0].created_at : "None"
    });
  }
  for (const b of allBookings) {
    const email = b.customer_email.toLowerCase();
    if (!customerMap.has(email)) {
      const guestBookings = allBookings.filter(
        (x) => x.customer_email.toLowerCase() === email
      );
      const totalSpent = guestBookings.reduce(
        (sum, x) => sum + Number(x.total_amount),
        0
      );
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
        latestBooking: b.created_at
      });
    }
  }
  return res.json(Array.from(customerMap.values()));
});
app.get("/api/promos", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all();
  return res.json(rows.map(formatPromoRow));
});
app.post("/api/promos", async (req, res) => {
  const { code, discountPercent, description, expiryDate } = req.body;
  if (!code || !discountPercent) {
    return res.status(400).json({ error: "Promo code and discount percent are required." });
  }
  const normalizedCode = code.trim().toUpperCase();
  const existing = await db.prepare("SELECT code FROM promo_codes WHERE code = ?").get(normalizedCode);
  if (existing) {
    return res.status(409).json({ error: "Promo code already exists." });
  }
  await db.prepare(`
    INSERT INTO promo_codes (code, discount_percent, description, is_active, expiry_date, usage_count)
    VALUES (?, ?, ?, 1, ?, 0)
  `).run(
    normalizedCode,
    Number(discountPercent),
    description || "Promotional discount rule",
    expiryDate || "2026-12-31"
  );
  const created = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(normalizedCode);
  return res.status(201).json(formatPromoRow(created));
});
app.patch("/api/promos/:code/toggle", async (req, res) => {
  const promoCode = req.params.code.toUpperCase();
  const promo = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode);
  if (!promo) {
    return res.status(404).json({ error: "Promo code not found." });
  }
  const newActive = promo.is_active ? 0 : 1;
  await db.prepare("UPDATE promo_codes SET is_active = ? WHERE code = ?").run(
    newActive,
    promoCode
  );
  const updated = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode);
  return res.json(formatPromoRow(updated));
});
app.delete("/api/promos/:code", async (req, res) => {
  const promoCode = req.params.code.toUpperCase();
  await db.prepare("DELETE FROM promo_codes WHERE code = ?").run(promoCode);
  return res.json({
    success: true,
    message: `Promo code ${promoCode} deleted.`
  });
});
app.post("/api/promos/validate", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: "Code is required." });
  }
  const promoCode = code.trim().toUpperCase();
  const promo = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(promoCode);
  if (!promo) {
    return res.status(404).json({ valid: false, message: "Invalid promo code." });
  }
  if (!promo.is_active) {
    return res.status(400).json({ valid: false, message: "This coupon is no longer active." });
  }
  await db.prepare(
    "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = ?"
  ).run(promoCode);
  return res.json({
    valid: true,
    code: promo.code,
    discountPercent: promo.discount_percent,
    description: promo.description,
    message: `${promo.discount_percent}% discount applied!`
  });
});
app.get("/api/maintenance", async (req, res) => {
  const rows = await db.prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    ORDER BY m.created_at DESC
  `).all();
  return res.json(rows.map(formatMaintenanceRow));
});
app.post("/api/maintenance", async (req, res) => {
  const {
    carId,
    serviceType,
    cost,
    odometer,
    date,
    status,
    technicianNotes,
    setVehicleStatus
  } = req.body;
  if (!carId || !serviceType) {
    return res.status(400).json({ error: "carId and serviceType are required." });
  }
  const logId = `MNT-${Math.floor(1e3 + Math.random() * 9e3)}`;
  await db.prepare(`
    INSERT INTO maintenance_logs (id, car_id, service_type, cost, odometer, date, status, technician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId,
    carId,
    serviceType,
    Number(cost) || 0,
    Number(odometer) || 15e3,
    date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    status || "Completed",
    technicianNotes || ""
  );
  if (setVehicleStatus) {
    await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
      setVehicleStatus,
      carId
    );
  }
  const created = await db.prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `).get(logId);
  return res.status(201).json(formatMaintenanceRow(created));
});
app.patch("/api/maintenance/:id/status", async (req, res) => {
  const logId = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });
  await db.prepare("UPDATE maintenance_logs SET status = ? WHERE id = ?").run(
    status,
    logId
  );
  const updated = await db.prepare(`
    SELECT m.*, v.name as car_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON m.car_id = v.id
    WHERE m.id = ?
  `).get(logId);
  return res.json(formatMaintenanceRow(updated));
});
app.get("/api/admin/stats", async (req, res) => {
  const allCars = await db.prepare("SELECT * FROM vehicles").all();
  const allBookings = await db.prepare("SELECT * FROM bookings").all();
  const total = allCars.length;
  const available = allCars.filter(
    (c) => c.status === "Available" || !c.status
  ).length;
  const rented = allCars.filter((c) => c.status === "Rented").length;
  const maintenance = allCars.filter(
    (c) => c.status === "Maintenance"
  ).length;
  const cleaning = allCars.filter((c) => c.status === "Cleaning").length;
  const utilization = total > 0 ? Math.round(rented / total * 100) : 0;
  const activeRevenue = allCars.filter((c) => c.status === "Rented").reduce((sum, c) => sum + Number(c.price_per_day), 0);
  const pendingMating = allBookings.filter(
    (b) => b.status === "Pending Assignment"
  ).length;
  const assigned = allBookings.filter(
    (b) => b.status === "Assigned"
  ).length;
  return res.json({
    fleet: {
      total,
      available,
      rented,
      maintenance,
      cleaning,
      utilization,
      activeRevenue
    },
    bookings: {
      total: allBookings.length,
      pendingMating,
      assigned
    }
  });
});
app.post("/api/upload", async (req, res) => {
  const { fileName } = req.body;
  const cleanName = fileName ? path2.basename(fileName) : `license_${Date.now()}.jpg`;
  return res.json({
    success: true,
    fileName: cleanName,
    url: `/uploads/${cleanName}`
  });
});
app.use((err, req, res, next) => {
  console.error("[Backend Error]", err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err?.status || 500).json({
    success: false,
    error: err?.message || "Internal server error occurred."
  });
});
if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`[Backend] MOTORLY Server running on port ${PORT}`);
    console.log(`[Backend] Admin Password verified: ${ADMIN_PASSWORD}`);
    console.log(`[Backend] API Endpoints ready at http://localhost:${PORT}/api/`);
  });
}
var index_default = app;
export {
  index_default as default
};
