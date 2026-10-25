import pg from "pg"
const pool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})
const res = await pool.query(
  "SELECT id, matched_car_id, pickup_date, return_date, status FROM bookings WHERE matched_car_id = 'toyota-camry'",
)
console.log("Bookings for toyota-camry:", res.rows)
await pool.end()
