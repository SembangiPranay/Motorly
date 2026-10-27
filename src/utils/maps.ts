/**
 * Google Maps Integration & Hub Location Navigation Utilities
 */

export function getGoogleMapsUrl(location?: string | null, customUrl?: string | null): string {
  if (customUrl && typeof customUrl === "string" && customUrl.trim().startsWith("http")) {
    return customUrl.trim()
  }

  const query = (location || "").trim() || "Terminal Garage B • Bay 4 HQ, Miami Airport"
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function openGoogleMaps(location?: string | null, customUrl?: string | null): void {
  const url = getGoogleMapsUrl(location, customUrl)
  window.open(url, "_blank", "noopener,noreferrer")
}
