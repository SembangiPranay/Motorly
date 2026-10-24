import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, "..", "server", "data", "drive_rent.db")
const sqlite = new DatabaseSync(dbPath)

const { Pool } = pg

// Supabase configuration
const pool = new Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  console.log("[Supabase] Starting schema creation & migration...")
  const client = await pool.connect()

  try {
    // 1. Create vehicles table
    await client.query(`
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
    `)

    // 2. Create bookings table
    await client.query(`
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

    // 3. Create admin_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 4. Create users table
    await client.query(`
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

    // 5. Create customer_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 6. Create promo_codes table
    await client.query(`
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

    // 7. Create maintenance_logs table
    await client.query(`
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

    console.log("[Supabase] All tables created successfully.")

    // Helper to sync table data from SQLite to Supabase
    async function syncTable(tableName, pkey = "id") {
      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all()
      console.log(`[Supabase] Syncing ${rows.length} rows for ${tableName}...`)
      if (rows.length === 0) return

      for (const row of rows) {
        const keys = Object.keys(row)
        const values = Object.values(row)
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
        const updateSets = keys
          .filter((k) => k !== pkey)
          .map((k) => `"${k}" = EXCLUDED."${k}"`)
          .join(", ")

        const query = `
          INSERT INTO "${tableName}" (${keys.map((k) => `"${k}"`).join(", ")})
          VALUES (${placeholders})
          ON CONFLICT ("${pkey}") DO UPDATE SET ${updateSets};
        `

        await client.query(query, values)
      }
      console.log(`[Supabase] Finished syncing ${tableName}.`)
    }

    await syncTable("vehicles", "id")
    await syncTable("bookings", "id")
    await syncTable("users", "id")
    await syncTable("promo_codes", "code")
    await syncTable("maintenance_logs", "id")
    await syncTable("admin_sessions", "token")
    await syncTable("customer_sessions", "token")

    // Verify row counts in Supabase
    for (const tbl of [
      "vehicles",
      "bookings",
      "users",
      "promo_codes",
      "maintenance_logs",
    ]) {
      const res = await client.query(`SELECT COUNT(*) as count FROM "${tbl}"`)
      console.log(`[Supabase] Table "${tbl}" row count:`, res.rows[0].count)
    }

    console.log("🎉 Migration to Supabase PostgreSQL completed successfully!")
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error("[Supabase Migration Error]", err)
  process.exit(1)
})
