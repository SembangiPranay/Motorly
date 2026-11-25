import { Router } from "express"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import { getSmtpConfig } from "../mailer.ts"

const router = Router()

router.get("/settings", async (_req, res) => {
  const defaultAdminEmail = getSmtpConfig().defaultAdminEmail
  try {
    const rows = ((await db.prepare("SELECT key, value FROM system_settings").all()) as any[]) || []
    const settings: Record<string, any> = {
      reviews_enabled: true,
      contact_phone: "+356 99827192 / +356 99804255",
      contact_email: defaultAdminEmail,
      admin_notification_emails: "",
      admin_name: "Pit Stop Operations Director",
      hub_address: "36 Triq Il-Kbira, Mgarr, Malta",
      google_maps_url: "https://maps.google.com/?q=36+Triq+Il-Kbira+Mgarr+Malta",
      support_phone: "+356 99827192",
    }
    for (const r of rows) {
      if (r.key === "reviews_enabled") {
        settings.reviews_enabled = r.value === "true" || r.value === true || r.value === "1"
      } else {
        settings[r.key] = r.value
      }
    }
    return res.json({ success: true, settings })
  } catch (err: any) {
    console.error("[Settings Fetch Error]", err?.message)
    return res.json({
      success: true,
      settings: {
        reviews_enabled: true,
        contact_phone: "+356 99827192 / +356 99804255",
        contact_email: defaultAdminEmail,
        admin_notification_emails: "",
        admin_name: "Pit Stop Operations Director",
        hub_address: "36 Triq Il-Kbira, Mgarr, Malta",
      },
    })
  }
})

router.patch("/settings", requireAdmin, async (req, res) => {
  try {
    const { key, value, settings: batchSettings } = req.body
    const toUpdate: [string, string][] = []

    if (batchSettings && typeof batchSettings === "object") {
      for (const [k, v] of Object.entries(batchSettings)) {
        if (k && v !== undefined && v !== null) {
          toUpdate.push([k, String(v)])
        }
      }
    } else if (key) {
      toUpdate.push([key, String(value ?? "")])
    } else {
      return res.status(400).json({
        success: false,
        error: "Setting key or settings object is required.",
      })
    }

    for (const [k, v] of toUpdate) {
      if (db.isSupabase && db.pool) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()",
          [k, v],
        )
      } else {
        await db
          .prepare(
            "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
          )
          .run(k, v)
      }
    }

    // Auto-propagate new Stationed Hub address to fleet cars if hub_address was modified
    const hubSetting = toUpdate.find(([k]) => k === "hub_address")
    if (hubSetting && hubSetting[1] && hubSetting[1].trim().length > 2) {
      const cleanHub = hubSetting[1].trim()
      if (db.isSupabase && db.pool) {
        await db.pool
          .query("UPDATE vehicles SET garage_name = $1, garage_address = $1, location = $1", [
            cleanHub,
          ])
          .catch(() => {})
      } else {
        await db
          .prepare("UPDATE vehicles SET garage_name = ?, garage_address = ?, location = ?")
          .run(cleanHub, cleanHub, cleanHub)
          .catch(() => {})
      }
    }

    return res.json({
      success: true,
      message: "Studio settings updated successfully.",
      updatedCount: toUpdate.length,
    })
  } catch (err: any) {
    console.error("[Settings Update Error]", err?.message)
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to update system setting.",
    })
  }
})

router.post("/settings/sync-hub", requireAdmin, async (req, res) => {
  try {
    const { hub_address, google_maps_url, hub_lat, hub_lng } = req.body
    if (!hub_address || typeof hub_address !== "string") {
      return res.status(400).json({ success: false, error: "hub_address is required." })
    }

    const latVal =
      hub_lat !== undefined && hub_lat !== null && !isNaN(Number(hub_lat)) ? Number(hub_lat) : null
    const lngVal =
      hub_lng !== undefined && hub_lng !== null && !isNaN(Number(hub_lng)) ? Number(hub_lng) : null

    if (db.isSupabase && db.pool) {
      try {
        if (latVal !== null && lngVal !== null) {
          await db.pool.query(
            "UPDATE vehicles SET garage_name = $1, garage_address = $1, location = $1, garage_lat = $2, garage_lng = $3",
            [hub_address, latVal, lngVal],
          )
        } else {
          await db.pool.query(
            "UPDATE vehicles SET garage_name = $1, garage_address = $1, location = $1",
            [hub_address],
          )
        }
      } catch (errVehicles) {
        try {
          if (latVal !== null && lngVal !== null) {
            await db.pool.query(
              "UPDATE cars SET garage_name = $1, garage_address = $1, location = $1, garage_lat = $2, garage_lng = $3",
              [hub_address, latVal, lngVal],
            )
          } else {
            await db.pool.query(
              "UPDATE cars SET garage_name = $1, garage_address = $1, location = $1",
              [hub_address],
            )
          }
        } catch {}
      }

      await db.pool.query(
        "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_address', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
        [hub_address],
      )
      if (google_maps_url !== undefined) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('google_maps_url', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
          [google_maps_url],
        )
      }
      if (latVal !== null) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_lat', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
          [String(latVal)],
        )
      }
      if (lngVal !== null) {
        await db.pool.query(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_lng', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
          [String(lngVal)],
        )
      }
    } else {
      try {
        if (latVal !== null && lngVal !== null) {
          await db
            .prepare(
              "UPDATE vehicles SET garage_name = ?, garage_address = ?, location = ?, garage_lat = ?, garage_lng = ?",
            )
            .run(hub_address, hub_address, hub_address, latVal, lngVal)
        } else {
          await db
            .prepare("UPDATE vehicles SET garage_name = ?, garage_address = ?, location = ?")
            .run(hub_address, hub_address, hub_address)
        }
      } catch (errVehicles) {
        try {
          if (latVal !== null && lngVal !== null) {
            await db
              .prepare(
                "UPDATE cars SET garage_name = ?, garage_address = ?, location = ?, garage_lat = ?, garage_lng = ?",
              )
              .run(hub_address, hub_address, hub_address, latVal, lngVal)
          } else {
            await db
              .prepare("UPDATE cars SET garage_name = ?, garage_address = ?, location = ?")
              .run(hub_address, hub_address, hub_address)
          }
        } catch {}
      }

      await db
        .prepare(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_address', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        )
        .run(hub_address)
      if (google_maps_url !== undefined) {
        await db
          .prepare(
            "INSERT INTO system_settings (key, value, updated_at) VALUES ('google_maps_url', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
          )
          .run(google_maps_url)
      }
      if (latVal !== null) {
        await db
          .prepare(
            "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_lat', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
          )
          .run(String(latVal))
      }
      if (lngVal !== null) {
        await db
          .prepare(
            "INSERT INTO system_settings (key, value, updated_at) VALUES ('hub_lng', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
          )
          .run(String(lngVal))
      }
    }

    return res.json({
      success: true,
      message: "Stationed hub location updated and synchronized to all active vehicles in fleet.",
    })
  } catch (err: any) {
    console.error("[Sync Hub Error]", err?.message)
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to sync hub location to fleet.",
    })
  }
})

export default router
