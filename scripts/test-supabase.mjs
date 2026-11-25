import pg from "pg"
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL explicitly before running this script.")


const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  console.log("Checking Supabase...")
  const res = await pool.query(
    "SELECT id, customer_first_name, customer_last_name, status, created_at FROM bookings WHERE id = $1",
    ["TEST-BOOKING-001"],
  )
  console.log("Direct Supabase result:", res.rows)
  await pool.end()
}

main().catch((err) => {
  console.error("Test error:", err)
  process.exit(1)
})
