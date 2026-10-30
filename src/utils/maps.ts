/**
 * Google Maps Integration & Hub Location Navigation Utilities
 */

export function getGoogleMapsUrl(
  location?: string | null,
  customUrl?: string | null,
  lat?: number | null,
  lng?: number | null,
): string {
  if (
    customUrl &&
    typeof customUrl === "string" &&
    customUrl.trim().startsWith("http")
  ) {
    return customUrl.trim()
  }

  // If exact coordinates are provided, prioritize an exact GPS pinpoint marker
  if (
    typeof lat === "number" &&
    !isNaN(lat) &&
    typeof lng === "number" &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }

  const query =
    (location || "").trim() || "Terminal Garage B • Bay 4 HQ, Miami Airport"
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function openGoogleMaps(
  location?: string | null,
  customUrl?: string | null,
  lat?: number | null,
  lng?: number | null,
): void {
  const url = getGoogleMapsUrl(location, customUrl, lat, lng)
  window.open(url, "_blank", "noopener,noreferrer")
}
