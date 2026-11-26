import bcrypt from "bcryptjs"
import { getActiveOperatingHub } from "./hub.ts"
import { db } from "./db.ts"

// Reconcile and maintain database invariants upon server startup
export async function reconcileDatabaseInvariants() {
  try {
    // 1. Invariant 3.4: Reconcile any non-standard booking status 'Returned' -> 'Completed'
    await db
      .prepare("UPDATE bookings SET status = 'Completed' WHERE status = 'Returned'")
      .run()
      .catch(() => {})

    // 2. Invariant 3.1: Reset orphan 'Rented' and unmanaged 'Maintenance' vehicles to 'Available'
    if (db.isSupabase && db.pool) {
      const res = await db.pool.query(`
        UPDATE vehicles
        SET status = 'Available'
        WHERE (status = 'Rented'
          AND id NOT IN (
            SELECT matched_car_id
            FROM bookings
            WHERE status = 'Checked Out' AND matched_car_id IS NOT NULL
          ))
          OR (status = 'Maintenance'
          AND id NOT IN (
            SELECT car_id FROM maintenance_logs WHERE status IN ('In Progress', 'Scheduled')
          ))
      `)
      if (res.rowCount && res.rowCount > 0) {
        console.log(
          `[DB Reconciliation] Reset ${res.rowCount} orphan rented/maintenance vehicles to Available`,
        )
      }
    } else {
      await db
        .prepare(
          `
        UPDATE vehicles
        SET status = 'Available'
        WHERE (status = 'Rented'
          AND id NOT IN (
            SELECT matched_car_id
            FROM bookings
            WHERE status = 'Checked Out' AND matched_car_id IS NOT NULL
          ))
          OR (status = 'Maintenance'
          AND id NOT IN (
            SELECT car_id FROM maintenance_logs WHERE status IN ('In Progress', 'Scheduled')
          ))
      `,
        )
        .run()
        .catch(() => {})
    }

    // 4. Invariant: Reconcile any settled bookings accidentally cancelled or declined
    if (db.isSupabase && db.pool) {
      await db.pool
        .query(
          `
        UPDATE bookings
        SET status = 'Completed', approved_by_admin = 1
        WHERE (status = 'Cancelled' AND (notes LIKE '%Settled%' OR notes LIKE '%Completed%' OR notes LIKE '%Return Check%' OR extension_status = 'Approved'))
      `,
        )
        .catch(() => {})

      await db.pool
        .query(
          `
        UPDATE bookings
        SET approved_by_admin = 1
        WHERE status IN ('Checked Out', 'Completed') AND approved_by_admin != 1
      `,
        )
        .catch(() => {})
    } else {
      await db
        .prepare(
          `
        UPDATE bookings
        SET status = 'Completed', approved_by_admin = 1
        WHERE (status = 'Cancelled' AND (notes LIKE '%Settled%' OR notes LIKE '%Completed%' OR notes LIKE '%Return Check%' OR extension_status = 'Approved'))
      `,
        )
        .run()
        .catch(() => {})

      await db
        .prepare(
          `
        UPDATE bookings
        SET approved_by_admin = 1
        WHERE status IN ('Checked Out', 'Completed') AND approved_by_admin != 1
      `,
        )
        .run()
        .catch(() => {})
    }

    // 3. Invariant 3.2: Reconcile any 'Checked Out' bookings whose vehicle is currently marked 'Available' to 'Completed'
    if (db.isSupabase && db.pool) {
      const res32 = await db.pool.query(`
        UPDATE bookings
        SET status = 'Completed'
        WHERE status = 'Checked Out'
          AND matched_car_id IN (
            SELECT id FROM vehicles WHERE status = 'Available'
          )
      `)
      if (res32.rowCount && res32.rowCount > 0) {
        console.log(
          `[DB Reconciliation] Completed ${res32.rowCount} historical bookings for available vehicles`,
        )
      }
    } else {
      await db
        .prepare(
          `
        UPDATE bookings
        SET status = 'Completed'
        WHERE status = 'Checked Out'
          AND matched_car_id IN (
            SELECT id FROM vehicles WHERE status = 'Available'
          )
      `,
        )
        .run()
        .catch(() => {})
    }

    // 4. Invariant: Ensure all admin accounts in database have bcrypt salted password hashes
    try {
      const adminUsers = await db
        .prepare("SELECT id, email, password_hash FROM users WHERE role = 'admin'")
        .all()
        .catch(() => [])
      for (const u of adminUsers) {
        if (
          u.password_hash &&
          u.password_hash !== "google-oauth-managed" &&
          !u.password_hash.startsWith("$2a$") &&
          !u.password_hash.startsWith("$2b$")
        ) {
          const secureHash = bcrypt.hashSync(u.password_hash, 10)
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .run(secureHash, u.id)
            .catch(() => {})
          console.log(
            `[DB Reconciliation] Upgraded plain-text password for admin ${u.email} to bcrypt hash`,
          )
        }
      }
    } catch (passErr: any) {
      console.warn("[DB Password Upgrade Warning]", passErr?.message)
    }

    // 5. Invariant: Synchronize Stationed Hub and purge stale placeholder garage locations
    try {
      const activeHub = await getActiveOperatingHub()
      if (
        activeHub.address &&
        activeHub.address.length > 2 &&
        !activeHub.address.includes("Miami")
      ) {
        if (db.isSupabase && db.pool) {
          await db.pool
            .query(
              `
            UPDATE vehicles
            SET
              garage_name = $1,
              garage_address = $1,
              location = $1
            WHERE garage_name ILIKE '%Miami%'
               OR garage_address ILIKE '%Miami%'
               OR location ILIKE '%Miami%'
               OR garage_name IS NULL
               OR garage_name = ''
               OR garage_name ILIKE '%Central Hub & Garage Bay 4%'
          `,
              [activeHub.address],
            )
            .catch(() => {})
        } else {
          await db
            .prepare(
              `
            UPDATE vehicles
            SET
              garage_name = ?,
              garage_address = ?,
              location = ?
            WHERE garage_name LIKE '%Miami%'
               OR garage_address LIKE '%Miami%'
               OR location LIKE '%Miami%'
               OR garage_name IS NULL
               OR garage_name = ''
               OR garage_name LIKE '%Central Hub & Garage Bay 4%'
          `,
            )
            .run(activeHub.address, activeHub.address, activeHub.address)
            .catch(() => {})
        }

        // Purge Miami placeholder from existing bookings and synchronize to Operating Hub
        if (db.isSupabase && db.pool) {
          await db.pool
            .query(
              `
            UPDATE bookings
            SET
              pickup_location = $1,
              return_location = $1
            WHERE pickup_location ILIKE '%Miami%'
               OR return_location ILIKE '%Miami%'
               OR pickup_location ILIKE '%Main Garage%'
               OR return_location ILIKE '%Main Garage%'
          `,
              [activeHub.address],
            )
            .catch(() => {})
        } else {
          await db
            .prepare(
              `
            UPDATE bookings
            SET
              pickup_location = ?,
              return_location = ?
            WHERE pickup_location LIKE '%Miami%'
               OR return_location LIKE '%Miami%'
               OR pickup_location LIKE '%Main Garage%'
               OR return_location LIKE '%Main Garage%'
          `,
            )
            .run(activeHub.address, activeHub.address)
            .catch(() => {})
        }
      }
    } catch (hubErr: any) {
      console.warn("[DB Hub Sync Warning]", hubErr?.message)
    }
  } catch (err: any) {
    console.warn("[DB Reconciliation Warning]", err?.message)
  }
}
