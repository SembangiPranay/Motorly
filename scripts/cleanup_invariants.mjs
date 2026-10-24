import pg from "pg"

const pool = new pg.Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.mrbymhhcjvebpxcfmnhy",
  password: "Koushik.git1",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

async function run() {
  console.log("--- 1. Orphan Rented Vehicles ---")
  const rented = await pool.query("SELECT id, name, status FROM vehicles WHERE status = 'Rented'")
  console.log("Current rented count:", rented.rows.length)
  for (const r of rented.rows) {
    const active = await pool.query(
      "SELECT id, status, customer_email FROM bookings WHERE matched_car_id = $1 AND status = 'Checked Out'",
      [r.id]
    )
    console.log(`Car ${r.id} (${r.name}): ${active.rows.length} checked out bookings`)
  }

  // Reset orphan rented vehicles to Available
  const updateRes = await pool.query(`
    UPDATE vehicles
    SET status = 'Available'
    WHERE status = 'Rented'
      AND id NOT IN (
        SELECT matched_car_id
        FROM bookings
        WHERE status = 'Checked Out' AND matched_car_id IS NOT NULL
      )
  `)
  console.log(`Reset ${updateRes.rowCount} orphan vehicles to Available`)

  console.log("\n--- 2. Booking Status Fixes ---")
  const returnedRes = await pool.query(`
    UPDATE bookings
    SET status = 'Completed'
    WHERE status = 'Returned'
  `)
  console.log(`Updated ${returnedRes.rowCount} bookings with status 'Returned' to 'Completed'`)

  console.log("\n--- 3. Clean up Prior Concurrency Test Bookings ---")
  const delRes = await pool.query(`
    DELETE FROM bookings
    WHERE customer_email LIKE '%@stress-test.org'
       OR customer_email LIKE '%@adversarial.com'
       OR (pickup_date = 'May 10, 2028' AND return_date = 'May 15, 2028')
       OR (pickup_date = 'May 12, 2028' AND return_date = 'May 14, 2028')
       OR (pickup_date = 'Dec 15, 2026' AND return_date = 'Dec 18, 2026')
       OR id LIKE 'ADV-TEST-%'
       OR id LIKE 'LEGIT-%'
  `)
  console.log("\n--- 4. Update toyota-camry Gallery ---")
  const newGallery = JSON.stringify([
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  ])
  const galRes = await pool.query("UPDATE vehicles SET gallery = $1 WHERE id = $2", [
    newGallery,
    "toyota-camry",
  ])
  console.log(`Updated gallery for ${galRes.rowCount} vehicles`)

  await pool.end()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
