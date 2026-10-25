import pg from "pg"
const pool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})
const res = await pool.query(`
  SELECT v.id, v.name, count(b.id) as booking_count 
  FROM vehicles v 
  LEFT JOIN bookings b ON v.id = b.matched_car_id AND b.status != 'Completed' AND b.status != 'Cancelled'
  GROUP BY v.id, v.name 
  HAVING count(b.id) = 0 
  ORDER BY v.name
`)
console.log(
  "Vehicles with 0 active bookings:",
  res.rows.map((r) => `${r.id} (${r.name})`),
)
await pool.end()
