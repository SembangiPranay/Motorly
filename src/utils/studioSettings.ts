import { useEffect, useState } from "react"
import { api } from "../services/api"
import type { Car } from "../types"
import { getGoogleMapsUrl } from "./maps"
import { extractPhoneNumbers, formatInternationalPhoneDisplay } from "./whatsapp"

export interface StudioSettingsData {
  reviews_enabled?: boolean
  contact_phone?: string
  support_phone?: string
  whatsapp_phone?: string
  whatsapp_phone_secondary?: string
  contact_email?: string
  admin_notification_emails?: string
  admin_name?: string
  company_name?: string
  company_phone?: string
  hub_address?: string
  hub_lat?: string | number
  hub_lng?: string | number
  google_maps_url?: string
  [key: string]: any
}

const DEFAULT_SETTINGS: StudioSettingsData = {
  reviews_enabled: true,
  contact_phone: "+356 9982 7192",
  support_phone: "+356 9982 7192",
  whatsapp_phone: "",
  whatsapp_phone_secondary: "",
  contact_email: "pitstopcarhire@gmail.com",
  admin_notification_emails: "",
  admin_name: "Pit Stop Operations Director",
  hub_address: "36 Triq Il-Kbira, Mgarr, Malta",
  hub_lat: "35.9197",
  hub_lng: "14.3664",
  google_maps_url: "https://maps.google.com/?q=36+Triq+Il-Kbira+Mgarr+Malta",
}

const SETTINGS_EVENT = "pitstop:studio-settings-updated"
let cachedSettings: StudioSettingsData | null = null

export function notifyStudioSettingsUpdated(next?: Partial<StudioSettingsData>) {
  if (next) {
    cachedSettings = { ...(cachedSettings || DEFAULT_SETTINGS), ...next }
  } else {
    cachedSettings = null
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: cachedSettings }))
  }
}

export function getSupportPhone(settings?: StudioSettingsData | null): string {
  const raw = String(
    settings?.support_phone || settings?.contact_phone || settings?.company_phone || DEFAULT_SETTINGS.support_phone,
  ).trim()
  if (/[A-Za-z]/.test(raw)) return raw
  const parsed = extractPhoneNumbers(raw)
  return parsed.length > 0 ? formatInternationalPhoneDisplay(`+${parsed[0]}`) : raw
}

export function getDispatchPhone(settings?: StudioSettingsData | null): string {
  const raw = String(
    settings?.whatsapp_phone || settings?.contact_phone || settings?.company_phone || settings?.support_phone || DEFAULT_SETTINGS.contact_phone,
  ).trim()
  const parsed = extractPhoneNumbers(raw)
  return parsed.length > 0 ? formatInternationalPhoneDisplay(`+${parsed[0]}`) : raw
}

/**
 * Returns the clean ordered list of Admin-configured WhatsApp E.164 phone numbers (formatted as "+...").
 * Uses dedicated whatsapp_phone / whatsapp_phone_secondary first, falling back to dispatch/support lines.
 */
export function getWhatsAppPhoneList(settings?: StudioSettingsData | null): string[] {
  const explicitPrimary = extractPhoneNumbers(settings?.whatsapp_phone)
  const explicitSecondary = extractPhoneNumbers(settings?.whatsapp_phone_secondary)
  const explicitCombined = Array.from(new Set([...explicitPrimary, ...explicitSecondary]))

  if (explicitCombined.length > 0) {
    return explicitCombined.map((d) => formatInternationalPhoneDisplay(`+${d}`))
  }

  const fallback = extractPhoneNumbers(
    settings?.contact_phone ||
      settings?.company_phone ||
      settings?.support_phone ||
      DEFAULT_SETTINGS.contact_phone,
  )
  return fallback.map((d) => formatInternationalPhoneDisplay(`+${d}`))
}

export function getPrimaryWhatsAppPhone(settings?: StudioSettingsData | null): string {
  return getWhatsAppPhoneList(settings)[0] || getDispatchPhone(settings)
}

export function getSecondaryWhatsAppPhone(settings?: StudioSettingsData | null): string | null {
  const list = getWhatsAppPhoneList(settings)
  return list.length > 1 ? list[1] : null
}

export function getHubCoordinates(settings?: StudioSettingsData | null): {
  address: string
  lat: number | null
  lng: number | null
  mapsUrl: string
  hubName: string
} {
  const address = String(settings?.hub_address || DEFAULT_SETTINGS.hub_address).trim()
  const rawLat = settings?.hub_lat !== undefined && settings?.hub_lat !== "" ? Number(settings.hub_lat) : NaN
  const rawLng = settings?.hub_lng !== undefined && settings?.hub_lng !== "" ? Number(settings.hub_lng) : NaN
  const lat = Number.isFinite(rawLat) && rawLat !== 0 ? rawLat : null
  const lng = Number.isFinite(rawLng) && rawLng !== 0 ? rawLng : null
  const mapsUrl = getGoogleMapsUrl(address, settings?.google_maps_url, lat, lng)
  return {
    address,
    lat,
    lng,
    mapsUrl,
    hubName: String(settings?.company_name || "Pit Stop Operations Hub").trim(),
  }
}

export function getDynamicCarMapLocation(
  car?: Partial<Car> | null,
  settings?: StudioSettingsData | null,
): { address: string; lat: number | null; lng: number | null; mapsUrl: string } {
  const hub = getHubCoordinates(settings)
  // Prefer active Admin Hub map settings when configured cleanly, falling back to car coordinates if custom
  const address = car?.garageAddress || car?.garageName || car?.location || hub.address
  const hasHubCoords = hub.lat !== null && hub.lng !== null
  const lat = hasHubCoords ? hub.lat : typeof car?.garageLat === "number" ? car.garageLat : null
  const lng = hasHubCoords ? hub.lng : typeof car?.garageLng === "number" ? car.garageLng : null
  const mapsUrl = getGoogleMapsUrl(
    address,
    hasHubCoords ? settings?.google_maps_url : undefined,
    lat,
    lng,
  )
  return { address, lat, lng, mapsUrl }
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettingsData>(cachedSettings || DEFAULT_SETTINGS)

  useEffect(() => {
    let active = true
    const load = () => {
      api
        .getSettings()
        .then((res) => {
          if (!active || !res) return
          const merged = { ...DEFAULT_SETTINGS, ...res }
          cachedSettings = merged
          setSettings(merged)
        })
        .catch(() => {})
    }
    load()

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StudioSettingsData | null>).detail
      if (detail) {
        setSettings((prev) => ({ ...prev, ...detail }))
      } else {
        load()
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener(SETTINGS_EVENT, handler)
    }
    return () => {
      active = false
      if (typeof window !== "undefined") {
        window.removeEventListener(SETTINGS_EVENT, handler)
      }
    }
  }, [])

  return settings
}
