import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"
import pg from "pg"
import bcrypt from "bcryptjs"

const { Pool } = pg

// Load local .env if available
try {
  if (typeof (process as any).loadEnvFile === "function") {
    ;(process as any).loadEnvFile()
  }
} catch {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProduction = process.env.NODE_ENV === "production"

// Ensure data directory exists for local SQLite fallback (only in non-production local development)
let sqliteInstance: any = null
export let dbPath = ""
if (!isProduction) {
  try {
    // Dynamic import: Node runtimes without node:sqlite (e.g. Node 18/20 on Vercel) never crash on boot
    const sqliteMod = await import("node:sqlite").catch(() => null)
    if (sqliteMod && sqliteMod.DatabaseSync) {
      let dataDir = path.join(__dirname, "data")
      if (process.env.VERCEL === "1" || process.env.NOW_REGION) {
        dataDir = path.join(os.tmpdir(), "drive_rent_data")
      }
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      dbPath = path.join(dataDir, "drive_rent.db")
      sqliteInstance = new sqliteMod.DatabaseSync(dbPath)
    }
  } catch (e: any) {
    console.warn("[DB] Local SQLite initialization skipped/disabled:", e?.message)
  }
}

export const sqlite = sqliteInstance

// Supabase PostgreSQL Configuration
// Credentials must come strictly from environment variables
const SUPABASE_POOLER_URL = process.env.DATABASE_URL || ""
const SUPABASE_DIRECT_URL = process.env.SUPABASE_DIRECT_URL || ""

if (isProduction && !SUPABASE_POOLER_URL && !SUPABASE_DIRECT_URL) {
  throw new Error(
    "[SECURITY CRITICAL] DATABASE_URL environment variable is required in production.",
  )
}

let supabasePool: pg.Pool | null = null
let isSupabaseActive = false
let activeConnStr = SUPABASE_POOLER_URL

export function createSupabasePool(connectionString: string): pg.Pool {
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true"

  const sslConfig: any = {
    rejectUnauthorized,
  }

  if (process.env.DATABASE_CA_CERT) {
    sslConfig.ca = process.env.DATABASE_CA_CERT
  }

  if (!rejectUnauthorized && isProduction) {
    console.warn(
      "[SECURITY WARNING] Database TLS certificate validation is disabled in production! Set DATABASE_SSL_REJECT_UNAUTHORIZED=true or provide DATABASE_CA_CERT.",
    )
  }

  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 25,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })

  // Mandatory pg.Pool error handler to catch background connection drops on idle clients
  pool.on("error", (err: any) => {
    console.warn(
      "[Supabase Pool Warning] Background connection dropped/reset:",
      err?.message || err,
    )
  })

  return pool
}

function translateSql(sql: string): string {
  let paramIndex = 1
  let translated = sql.replace(/\?/g, () => `$${paramIndex++}`)
  translated = translated.replace(/\browid\b/gi, "created_at")
  return translated
}

async function querySupabaseWithRetry<T = any>(
  sql: string,
  params: any[] = [],
): Promise<pg.QueryResult<T>> {
  if (!supabasePool) {
    throw new Error("Supabase pool not initialized")
  }

  const translated = translateSql(sql)
  try {
    return await supabasePool.query(translated, params)
  } catch (firstErr: any) {
    const isConnErr =
      /terminated|timeout|ECONNRESET|ETIMEDOUT|closed|Connection/i.test(
        firstErr?.message || "",
      )

    if (isConnErr && activeConnStr) {
      console.warn(
        `[DB Auto-Recovery] Transient connection issue (${firstErr?.message}). Refreshing pool & retrying...`,
      )
      try {
        try {
          supabasePool.end().catch(() => {})
        } catch {}
        supabasePool = createSupabasePool(activeConnStr)
        return await supabasePool.query(translated, params)
      } catch (retryErr: any) {
        console.error(
          "[DB Auto-Recovery] Retry also failed:",
          retryErr?.message || retryErr,
        )
        throw retryErr
      }
    }
    throw firstErr
  }
}

export interface DbExecutor {
  all(sql: string, ...params: any[]): Promise<any[]>
  get(sql: string, ...params: any[]): Promise<any>
  run(sql: string, ...params: any[]): Promise<{
    changes: number
    rowCount: number
  }>
  prepare(sql: string): {
    all: (...params: any[]) => Promise<any[]>
    get: (...params: any[]) => Promise<any>
    run: (...params: any[]) => Promise<{
      changes: number
      rowCount: number
    }>
  }
}

export const db = {
  get isSupabase() {
    return isSupabaseActive
  },
  get activeHost() {
    if (activeConnStr) {
      try {
        return new URL(activeConnStr).host
      } catch {}
    }
    return null
  },
  get activeDbName() {
    if (activeConnStr) {
      try {
        return new URL(activeConnStr).pathname.replace(/^\//, "")
      } catch {}
    }
    return null
  },
  get pool() {
    return supabasePool
  },
  get sync() {
    return sqlite
  },

  async all(sql: string, ...params: any[]): Promise<any[]> {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase()
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const res = await querySupabaseWithRetry(sql, params)
        return res.rows
      } catch (err: any) {
        console.warn("[Supabase Query Warning]", err?.message)
        if (!isProduction && sqlite) {
          console.log(
            "[DB Fallback] Serving query from SQLite mirror:",
            sql.slice(0, 45),
          )
          try {
            return sqlite.prepare(sql).all(...params) as any[]
          } catch (sqliteErr: any) {
            console.error("[SQLite Fallback Error]", sqliteErr)
          }
        }
        throw err
      }
    }
    if (sqlite) {
      return sqlite.prepare(sql).all(...params) as any[]
    }
    throw new Error(
      "No database connection available (Supabase offline and SQLite unavailable).",
    )
  },

  async get(sql: string, ...params: any[]): Promise<any> {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase()
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const res = await querySupabaseWithRetry(sql, params)
        return res.rows[0] || null
      } catch (err: any) {
        console.warn("[Supabase Query Warning]", err?.message)
        if (!isProduction && sqlite) {
          console.log(
            "[DB Fallback] Serving query from SQLite mirror:",
            sql.slice(0, 45),
          )
          try {
            return sqlite.prepare(sql).get(...params) as any
          } catch (sqliteErr: any) {
            console.error("[SQLite Fallback Error]", sqliteErr)
          }
        }
        throw err
      }
    }
    if (sqlite) {
      return sqlite.prepare(sql).get(...params) as any
    }
    throw new Error(
      "No database connection available (Supabase offline and SQLite unavailable).",
    )
  },

  async run(sql: string, ...params: any[]): Promise<{
    changes: number
    rowCount: number
  }> {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase()
    }
    if (isSupabaseActive && supabasePool) {
      try {
        const res = await querySupabaseWithRetry(sql, params)
        if (sqlite) {
          try {
            sqlite.prepare(sql).run(...params)
          } catch {}
        }
        return {
          changes: res.rowCount || 0,
          rowCount: res.rowCount || 0,
        }
      } catch (err: any) {
        console.warn("[Supabase Exec Warning]", err?.message)
        if (!isProduction && sqlite) {
          console.log(
            "[DB Fallback] Executing write in SQLite mirror:",
            sql.slice(0, 45),
          )
          try {
            const res = sqlite.prepare(sql).run(...params) as any
            return {
              changes: res?.changes || 1,
              rowCount: res?.changes || 1,
            }
          } catch (sqliteErr: any) {
            console.error("[SQLite Fallback Error]", sqliteErr)
          }
        }
        throw err
      }
    }
    if (sqlite) {
      const res = sqlite.prepare(sql).run(...params) as any
      return {
        changes: res?.changes || 1,
        rowCount: res?.changes || 1,
      }
    }
    throw new Error(
      "No database connection available (Supabase offline and SQLite unavailable).",
    )
  },

  prepare(sql: string) {
    return {
      all: (...params: any[]) => db.all(sql, ...params),
      get: (...params: any[]) => db.get(sql, ...params),
      run: (...params: any[]) => db.run(sql, ...params),
    }
  },

  async transaction<T,>(task: (tx: DbExecutor) => Promise<T>): Promise<T> {
    if (!isSupabaseActive && !sqlite) {
      await ensureDatabase()
    }
    if (isSupabaseActive && supabasePool) {
      const client = await supabasePool.connect()
      try {
        await client.query("BEGIN")
        const tx: DbExecutor = {
          async all(sql: string, ...params: any[]): Promise<any[]> {
            const translated = translateSql(sql)
            const res = await client.query(translated, params)
            return res.rows
          },
          async get(sql: string, ...params: any[]): Promise<any> {
            const translated = translateSql(sql)
            const res = await client.query(translated, params)
            return res.rows[0] || null
          },
          async run(sql: string, ...params: any[]): Promise<{
            changes: number
            rowCount: number
          }> {
            const translated = translateSql(sql)
            const res = await client.query(translated, params)
            if (sqlite) {
              try {
                sqlite.prepare(sql).run(...params)
              } catch {}
            }
            return {
              changes: res.rowCount || 0,
              rowCount: res.rowCount || 0,
            }
          },
          prepare(sql: string) {
            return {
              all: (...params: any[]) => tx.all(sql, ...params),
              get: (...params: any[]) => tx.get(sql, ...params),
              run: (...params: any[]) => tx.run(sql, ...params),
            }
          },
        }

        const result = await task(tx)
        await client.query("COMMIT")
        return result
      } catch (err) {
        try {
          await client.query("ROLLBACK")
        } catch {}
        throw err
      } finally {
        client.release()
      }
    }

    if (sqlite) {
      sqlite.exec("BEGIN IMMEDIATE")
      try {
        const tx: DbExecutor = {
          async all(sql: string, ...params: any[]): Promise<any[]> {
            return sqlite.prepare(sql).all(...params) as any[]
          },
          async get(sql: string, ...params: any[]): Promise<any> {
            return sqlite.prepare(sql).get(...params) as any
          },
          async run(sql: string, ...params: any[]): Promise<{
            changes: number
            rowCount: number
          }> {
            const res = sqlite.prepare(sql).run(...params) as any
            return {
              changes: res?.changes || 1,
              rowCount: res?.changes || 1,
            }
          },
          prepare(sql: string) {
            return {
              all: (...params: any[]) => tx.all(sql, ...params),
              get: (...params: any[]) => tx.get(sql, ...params),
              run: (...params: any[]) => tx.run(sql, ...params),
            }
          },
        }

        const result = await task(tx)
        sqlite.exec("COMMIT")
        return result
      } catch (err) {
        try {
          sqlite.exec("ROLLBACK")
        } catch {}
        throw err
      }
    }

    throw new Error(
      "No database connection available (Supabase offline and SQLite unavailable).",
    )
  },

  async withVehicleBookingLock<T,>(
    carId: string | null | undefined,
    task: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return await this.transaction(async (tx) => {
      if (carId && isSupabaseActive && supabasePool) {
        // 1. Cluster-wide PostgreSQL transaction-level advisory lock on vehicle hash
        await tx.get(
          "SELECT pg_advisory_xact_lock(hashtext(?))",
          `vehicle_booking_${carId}`,
        )
        // 2. Row-level lock on the vehicle row
        await tx.get(
          "SELECT id, status FROM vehicles WHERE id = ? FOR UPDATE",
          carId,
        )
      }
      return await task(tx)
    })
  },
}

// Lazy/Safe DB ensure
export async function ensureDatabase(): Promise<boolean> {
  if (isSupabaseActive && supabasePool) return true
  await initDatabase()
  return isSupabaseActive || Boolean(sqlite)
}

// Initialize Tables
export async function initDatabase() {
  // First, attempt direct connection to Supabase PostgreSQL (Universal AWS pooler port 6543)
  console.log("[DB] Connecting to Supabase PostgreSQL...")
  try {
    const candidateUrls = [SUPABASE_POOLER_URL, SUPABASE_DIRECT_URL].filter(Boolean)
    let connected = false

    for (const connStr of candidateUrls) {
      try {
        const pool = createSupabasePool(connStr)

        const testRes = await pool.query(
          "SELECT NOW() as now, current_database() as db",
        )
        if (testRes.rows && testRes.rows.length > 0) {
          supabasePool = pool
          activeConnStr = connStr
          isSupabaseActive = true
          connected = true
          console.log(
            `[DB] Connected directly to Supabase PostgreSQL (db: ${testRes.rows[0].db})`,
          )
          break
        }
      } catch (e: any) {
        console.warn(
          `[DB] Supabase candidate connection failed (${e.message}), trying next...`,
        )
      }
    }

    if (connected && supabasePool) {
      // Ensure Supabase tables exist
      await initSupabaseTables(supabasePool)
      console.log("[DB] Supabase PostgreSQL tables verified and active!")
    } else {
      if (isProduction) {
        throw new Error(
          "[SECURITY CRITICAL] Failed to connect to primary PostgreSQL database in production. Aborting to prevent split-brain SQLite degradation.",
        )
      }
      console.warn(
        `[DB] Could not connect to Supabase. Falling back to local SQLite at ${dbPath}`,
      )
    }
  } catch (err: any) {
    if (isProduction) {
      throw err
    }
    console.warn(
      `[DB] Error initializing Supabase (${err?.message}). Running in local SQLite mode.`,
    )
  }

  // Second, in non-production local development only, initialize local fallback mirror if supported
  if (!isProduction && sqlite) {
    try {
      initSqliteTables()
    } catch (e: any) {
      console.warn("[DB] Local SQLite mirror setup skipped:", e?.message)
    }
  } else {
    console.log("[DB] Running in pure Supabase PostgreSQL serverless mode.")
  }
}

async function initSupabaseTables(pool: pg.Pool) {
  // 1. Vehicles
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
      price_per_month REAL,
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
  `)

  // 2. Bookings
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
  `)

  // 3. Admin Sessions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 4. Users
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
  `)

  // 5. Customer Sessions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 6. Promo Codes
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
  `)

  // 7. Maintenance Logs
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
  `)

  // Foreign Key Relationships (connecting the schema visualizer)
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
  `)

  // High-performance secondary indexes for high-frequency search and relational filters
  await pool.query(`
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_per_month REAL;
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(LOWER(customer_email));
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_matched_car ON bookings(matched_car_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_maintenance_car_id ON maintenance_logs(car_id);
  `)

  // Ensure price_per_month exists on vehicles in SQLite
  const vCols = sqlite.prepare("PRAGMA table_info(vehicles)").all() as any[]
  if (!vCols.some((c: any) => c.name === "price_per_month")) {
    try {
      sqlite.exec("ALTER TABLE vehicles ADD COLUMN price_per_month REAL;")
    } catch {}
  }
}

function initSqliteTables() {
  if (!sqlite) return
  // 1. Vehicles Table
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
      price_per_month REAL,
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
  `)

  // Safely ensure new columns exist in existing vehicles table
  const vehicleColumns = (sqlite
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
        sqlite.exec(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type};`)
      } catch (e) {
        // Ignored
      }
    }
  }

  // Safely ensure new columns exist in existing bookings table
  const bookingColumns = (sqlite
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
        sqlite.exec(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type};`)
      } catch (e) {
        // Ignored if already present
      }
    }
  }

  // 3. Admin Sessions Table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 4. Customer / User Accounts Table
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
  `)

  // 5. Customer Sessions Table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 6. Promo Codes Table
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
  `)

  // 7. Maintenance Logs Table
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

    CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_matched_car ON bookings(matched_car_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_maintenance_car_id ON maintenance_logs(car_id);
  `)

  // Ensure price_per_month exists on vehicles in SQLite
  const vCols = sqlite.prepare("PRAGMA table_info(vehicles)").all() as any[]
  if (!vCols.some((c: any) => c.name === "price_per_month")) {
    try {
      sqlite.exec("ALTER TABLE vehicles ADD COLUMN price_per_month REAL;")
    } catch {}
  }

  // Seed Vehicles if empty
  const countRow = sqlite
    .prepare("SELECT COUNT(*) as count FROM vehicles")
    .get() as { count: number }
  if (countRow.count === 0) {
    seedVehicles()
  }

  // Seed Bookings if empty
  const bookingCountRow = sqlite
    .prepare("SELECT COUNT(*) as count FROM bookings")
    .get() as { count: number }
  if (bookingCountRow.count === 0) {
    seedBookings()
  }

  // Seed Users if empty
  const userCountRow = sqlite
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number }
  if (userCountRow.count === 0) {
    seedUsers()
  }

  // Seed Promos if empty
  const promoCountRow = sqlite
    .prepare("SELECT COUNT(*) as count FROM promo_codes")
    .get() as { count: number }
  if (promoCountRow.count === 0) {
    seedPromos()
  }

  // Seed Maintenance if empty
  const mntCountRow = sqlite
    .prepare("SELECT COUNT(*) as count FROM maintenance_logs")
    .get() as { count: number }
  if (mntCountRow.count === 0) {
    seedMaintenance()
  }

  console.log(`[DB] Local SQLite mirror initialized successfully at ${dbPath}`)
}

function seedVehicles() {
  if (!sqlite) return
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
      image:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
        "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
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
      image:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
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
  // Mock bookings seeding permanently disabled to prevent polluting real user data
  return
}

function seedUsers() {
  if (!sqlite) return
  const insertStmt = sqlite.prepare(`
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
      password_hash: bcrypt.hashSync(
        process.env.ADMIN_PASSWORD || "Admin#Enterprise2026",
        10,
      ),
      name: "Fleet Operations Admin",
      phone: "+1 (800) 555-0199",
      driver_license_num: "ADM-9901-FL",
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
  if (!sqlite) return
  const insertStmt = sqlite.prepare(`
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
  if (!sqlite) return
  const insertStmt = sqlite.prepare(`
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
