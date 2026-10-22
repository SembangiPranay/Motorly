import pg from "pg"

const pool = new pg.Pool({
  connectionString:
    "postgresql://postgres.mrbymhhcjvebpxcfmnhy:Koushik.git1@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
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
