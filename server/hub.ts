import { db } from "./db.ts"

export let cachedHubAddress: string = "36 Triq Il-Kbira, Mgarr, Malta"

// Helper to retrieve active operating hub from settings
export async function getActiveOperatingHub(): Promise<{
  address: string
  lat: number | null
  lng: number | null
}> {
  try {
    const rows: any = await db
      .prepare(
        "SELECT key, value FROM system_settings WHERE key IN ('hub_address', 'hub_lat', 'hub_lng')",
      )
      .all()
    let address = cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta"
    let lat: number | null = null
    let lng: number | null = null
    const list = Array.isArray(rows) ? rows : []
    for (const r of list) {
      if (r.key === "hub_address" && r.value) {
        address = String(r.value).trim()
        cachedHubAddress = address
      }
      if (r.key === "hub_lat" && r.value && !isNaN(Number(r.value))) lat = Number(r.value)
      if (r.key === "hub_lng" && r.value && !isNaN(Number(r.value))) lng = Number(r.value)
    }
    return { address, lat, lng }
  } catch {
    return { address: cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta", lat: null, lng: null }
  }
}
