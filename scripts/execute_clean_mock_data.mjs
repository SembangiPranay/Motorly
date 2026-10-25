import pg from "pg"
import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

const pool = new pg.Pool({
  connectionString: "postgresql://postgres.mrbymhhcjvebpxcfmnhy:Koushik.git1@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
})

async function runCleanup() {
  console.log("=== STEP 1: BACKUP FULL BOOKINGS DATA ===")
  const backupDir = path.join(process.cwd(), "scripts", "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const allBookingsRes = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC")
  const backupFile = path.join(backupDir, `bookings_full_backup_${Date.now()}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(allBookingsRes.rows, null, 2), "utf8")
  console.log(`Backed up all ${allBookingsRes.rows.length} Supabase bookings to: ${backupFile}`)

  console.log("\n=== STEP 2: DELETE MOCK & TEST BOOKINGS FROM SUPABASE ===")
  const deleteQuery = `
    DELETE FROM bookings
    WHERE id LIKE 'BK-2026-%'
       OR id LIKE 'TEST-%'
       OR id LIKE 'E2E-%'
       OR id LIKE 'ADV-%'
       OR id LIKE 'LEGIT-%'
       OR id LIKE 'CWK-%'
       OR id LIKE 'BK-FIX-%'
       OR id LIKE 'FSM-%'
       OR id LIKE 'MTR-TEST-%'
       OR customer_email LIKE '%@motorly-test.io'
       OR customer_email LIKE '%@stress-test.org'
       OR customer_email LIKE '%@test.org'
       OR customer_email LIKE '%@amazon.com'
       OR customer_email LIKE '%@adversarial.com'
       OR customer_email LIKE '%@testdrive.com'
       OR customer_email LIKE '%customer@example.com'
       OR customer_email LIKE 'renter_%'
       OR customer_email LIKE 'bob.%'
       OR customer_email LIKE 'alice.%'
       OR customer_email LIKE 'qa.driver.%'
       OR customer_email LIKE '%victoria.chase.%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%concurrent runner%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%state tester%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%fsmuser%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%mainttest%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%illegaltest%'
       OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%declinetest%'
    RETURNING id, customer_first_name, customer_last_name, customer_email, created_at;
  `

  const deleteRes = await pool.query(deleteQuery)
  console.log(`Successfully deleted ${deleteRes.rowCount} test/mock booking records from Supabase PostgreSQL.`)

  const remainingRes = await pool.query("SELECT id, customer_first_name, customer_last_name, customer_email, status, created_at FROM bookings ORDER BY created_at DESC")
  console.log(`\nRemaining ${remainingRes.rows.length} real bookings in Supabase PostgreSQL:`)
  for (const b of remainingRes.rows) {
    console.log(`- ID: ${b.id.padEnd(14)} | Name: ${(b.customer_first_name + " " + b.customer_last_name).padEnd(20)} | Status: ${(b.status || "").padEnd(14)} | Created: ${b.created_at}`)
  }

  console.log("\n=== STEP 3: DELETE MOCK & TEST BOOKINGS FROM SQLITE MIRRORS ===")
  const sqlitePaths = [
    path.join(process.cwd(), "server", "data", "drive_rent.db"),
    path.join(process.cwd(), "api", "data", "drive_rent.db"),
  ]

  for (const p of sqlitePaths) {
    if (fs.existsSync(p)) {
      try {
        const db = new DatabaseSync(p)
        const sqlDel = `
          DELETE FROM bookings
          WHERE id LIKE 'BK-2026-%'
             OR id LIKE 'TEST-%'
             OR id LIKE 'E2E-%'
             OR id LIKE 'ADV-%'
             OR id LIKE 'LEGIT-%'
             OR id LIKE 'CWK-%'
             OR id LIKE 'BK-FIX-%'
             OR id LIKE 'FSM-%'
             OR id LIKE 'MTR-TEST-%'
             OR customer_email LIKE '%@motorly-test.io'
             OR customer_email LIKE '%@stress-test.org'
             OR customer_email LIKE '%@test.org'
             OR customer_email LIKE '%@amazon.com'
             OR customer_email LIKE '%@adversarial.com'
             OR customer_email LIKE '%@testdrive.com'
             OR customer_email LIKE '%customer@example.com'
             OR customer_email LIKE 'renter_%'
             OR customer_email LIKE 'bob.%'
             OR customer_email LIKE 'alice.%'
             OR customer_email LIKE 'qa.driver.%'
             OR customer_email LIKE '%victoria.chase.%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%concurrent runner%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%state tester%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%fsmuser%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%mainttest%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%illegaltest%'
             OR LOWER(customer_first_name || ' ' || customer_last_name) LIKE '%declinetest%'
        `
        const delInfo = db.prepare(sqlDel).run()
        const remaining = db.prepare("SELECT count(*) as count FROM bookings").get()
        console.log(`Cleaned SQLite [${p}]: Deleted ${delInfo.changes} rows, Remaining: ${remaining.count}`)
      } catch (err) {
        console.warn(`Could not clean SQLite at ${p}:`, err.message)
      }
    }
  }

  await pool.end()
  console.log("\nCleanup execution completed successfully.")
}

runCleanup().catch(err => {
  console.error("Cleanup error:", err)
  process.exit(1)
})
