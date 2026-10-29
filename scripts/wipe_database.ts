import { db, ensureDatabase } from "../server/db.js"
import bcrypt from "bcryptjs"

/**
 * Database Wipe Protocol
 * Clears all mock/seed data from Supabase PostgreSQL and local SQLite mirror.
 */
export async function wipeDatabase(preserveAdmin = true) {
  await ensureDatabase()

  console.log("\n=======================================================")
  console.log("   MOTORLY DATABASE WIPE & CLEAN STATE PROTOCOL")
  console.log("=======================================================\n")

  const tables = [
    "maintenance_logs",
    "bookings",
    "customer_sessions",
    "admin_sessions",
    "promo_codes",
    "vehicles",
  ]

  for (const table of tables) {
    try {
      const del = await db.prepare(`DELETE FROM ${table}`).run()
      console.log(`[CLEARED] Table '${table}' wiped successfully.`)
    } catch (err: any) {
      console.error(`[ERROR] Failed to wipe table '${table}':`, err.message)
    }
  }

  if (preserveAdmin) {
    // Delete all customer users, preserve or re-create root admin
    try {
      await db.prepare("DELETE FROM users WHERE role != 'admin'").run()
      const existingAdmin = (await db
        .prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1")
        .get()) as any
      if (!existingAdmin) {
        const hash = await bcrypt.hash("0709", 10)
        await db
          .prepare(`
          INSERT INTO users (id, email, password_hash, name, phone, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
          .run(
            "usr_admin",
            "admin@motorly.com",
            hash,
            "Fleet Operations Admin",
            "+1 (555) 019-9000",
            "admin",
            new Date().toISOString(),
          )
        console.log(
          "[ADMIN] Root admin account initialized (admin@motorly.com / pass: 0709).",
        )
      } else {
        console.log("[ADMIN] Existing root admin account preserved.")
      }
      console.log("[CLEARED] All non-admin customer user accounts removed.")
    } catch (err: any) {
      console.error("[ERROR] Failed cleaning users table:", err.message)
    }
  } else {
    try {
      await db.prepare("DELETE FROM users").run()
      console.log(
        "[CLEARED] Table 'users' wiped completely (0 users remaining).",
      )
    } catch (err: any) {
      console.error("[ERROR] Failed wiping users table:", err.message)
    }
  }

  console.log("\n--- VERIFYING CLEAN STATE ---")
  const allTables = [
    "vehicles",
    "bookings",
    "users",
    "customer_sessions",
    "admin_sessions",
    "promo_codes",
    "maintenance_logs",
  ]
  for (const t of allTables) {
    try {
      const res = (await db
        .prepare(`SELECT COUNT(*) as count FROM ${t}`)
        .get()) as any
      console.log(
        `  • ${t.padEnd(20)}: ${res.count ?? res[0]?.count ?? 0} rows`,
      )
    } catch (err: any) {
      console.log(`  • ${t.padEnd(20)}: Error reading count (${err.message})`)
    }
  }
  console.log("\n=======================================================\n")
}

// Check CLI argument
const preserve = !process.argv.includes("--wipe-all-users")
wipeDatabase(preserve)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error("Wipe failed:", e)
    process.exit(1)
  })
