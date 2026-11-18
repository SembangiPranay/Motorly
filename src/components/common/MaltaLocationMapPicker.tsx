import React, { useState, useEffect, useRef, useCallback } from "react"
import { LocationIcon } from "../Icons"
import type { DeliveryCoordinates } from "../../types"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MaltaLocationMapPickerProps {
  value?: DeliveryCoordinates
  onChange: (coords: DeliveryCoordinates) => void
  addressText: string
  onAddressChange: (address: string) => void
  label?: string
  placeholder?: string
}

export const QUICK_HUBS: { name: string; lat: number; lng: number }[] = [
  { name: "Malta Airport (MLA)", lat: 35.8575, lng: 14.4775 },
  { name: "Sliema / St. Julian's", lat: 35.9122, lng: 14.5042 },
  { name: "Valletta Waterfront", lat: 35.892, lng: 14.5126 },
  { name: "Central Garage (Mgarr)", lat: 35.9197, lng: 14.3664 },
  { name: "London Heathrow", lat: 51.470, lng: -0.4543 },
]

type MapStyle = "roadmap" | "satellite"

function getGoogleTileUrl(style: MapStyle): string {
  if (style === "satellite") {
    // Google Hybrid: Satellite imagery with roads, cities and label overlays
    return "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
  }
  // Canonical Google Maps Roadmap
  return "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
}

// Custom Leaflet DivIcon for crisp, modern Pit Stop orange pin marker
function createCustomPinIcon() {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="position: relative; width: 32px; height: 38px; transform: translate(-16px, -38px);">
        <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; background: rgba(249, 115, 22, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 50%;"></div>
        <svg viewBox="0 0 36 44" width="32" height="38" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3)); position: relative; z-index: 2;">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26c0-9.94-8.06-18-18-18z" fill="#F97316" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="18" cy="17" r="6" fill="#FFFFFF"/>
          <circle cx="18" cy="17" r="3" fill="#EA580C"/>
        </svg>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  })
}

export default function MaltaLocationMapPicker({
  value,
  onChange,
  addressText,
  onAddressChange,
  label = "Delivery Location & Pinpoint",
  placeholder = "Search address or click on map...",
}: MaltaLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [activeMapStyle, setActiveMapStyle] = useState<MapStyle>("roadmap")
  const [isLocating, setIsLocating] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Current active coordinates
  const currentCoords = value || {
    lat: 35.8575,
    lng: 14.4775,
    address: addressText || "",
    placeName: "Selected Location",
  }

  // Switch Google Maps Layer Style smoothly
  const handleSwitchMapStyle = (newStyle: MapStyle) => {
    setActiveMapStyle(newStyle)
    if (!mapInstanceRef.current) return

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }

    const newLayer = L.tileLayer(getGoogleTileUrl(newStyle), {
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps",
    })

    newLayer.addTo(mapInstanceRef.current)
    tileLayerRef.current = newLayer
  }

  // Reset to full world view
  const handleResetWorldView = () => {
    setActivePreset(null)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2, { animate: true, duration: 1 })
    }
  }

  // Global reverse geocoding helper - clean and concise
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, flyTo = false) => {
      setIsGeocoding(true)

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.display_name) {
            const addr = data.address || {}
            const parts: string[] = []

            const primary =
              addr.road ||
              addr.pedestrian ||
              addr.hotel ||
              addr.building ||
              addr.aeroway ||
              addr.amenity ||
              data.display_name.split(",")[0]
            if (primary) parts.push(primary.trim())

            const locality =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.municipality ||
              addr.county
            if (locality && !parts.includes(locality.trim())) {
              parts.push(locality.trim())
            }

            const stateOrRegion = addr.state || addr.region
            if (stateOrRegion && !parts.includes(stateOrRegion.trim())) {
              parts.push(stateOrRegion.trim())
            }

            const country = addr.country
            if (country && !parts.includes(country.trim())) {
              parts.push(country.trim())
            }

            const formatted = parts.length > 0 ? parts.join(", ") : data.display_name

            onAddressChange(formatted)
            onChange({
              lat,
              lng,
              address: formatted,
              placeName: primary || "Custom Location",
            })

            // Clean, minimal marker popup
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng])
              markerRef.current
                .bindPopup(
                  `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;min-width:140px;">
                    <div style="font-weight:700;font-size:12px;color:#18181b;">${primary || "Pinned Location"}</div>
                    <div style="font-size:11px;color:#71717a;margin-top:2px;">${locality ? locality + (country ? ", " + country : "") : (country || "")}</div>
                  </div>`
                )
                .openPopup()
            }

            if (flyTo && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 })
            }
            setIsGeocoding(false)
            return
          }
        }
      } catch {
        // Silent catch for resilience
      }

      const fallback = `Pinned Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
      if (!addressText) {
        onAddressChange(fallback)
      }
      onChange({
        lat,
        lng,
        address: addressText || fallback,
        placeName: "Custom Location",
      })

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
        markerRef.current
          .bindPopup(
            `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;">
              <div style="font-weight:700;font-size:12px;color:#18181b;">Pinned Location</div>
            </div>`
          )
          .openPopup()
      }
      setIsGeocoding(false)
    },
    [addressText, onAddressChange, onChange]
  )

  // Initialize the Global Leaflet Map with Google Maps
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialLat = currentCoords.lat ?? 35.8575
    const initialLng = currentCoords.lng ?? 14.4775
    const initialZoom = value?.lat ? 14 : 12

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 20,
      worldCopyJump: true,
    })

    const tileLayer = L.tileLayer(getGoogleTileUrl(activeMapStyle), {
      attribution: "&copy; Google Maps",
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
    }).addTo(map)
    tileLayerRef.current = tileLayer

    const icon = createCustomPinIcon()
    const marker = L.marker([initialLat, initialLng], {
      icon,
      draggable: true,
      autoPan: true,
    }).addTo(map)

    if (addressText) {
      marker.bindPopup(
        `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;min-width:140px;">
          <div style="font-weight:700;font-size:12px;color:#18181b;">${addressText}</div>
        </div>`
      )
    }

    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      setActivePreset(null)
      reverseGeocode(pos.lat, pos.lng)
    })

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setActivePreset(null)
      reverseGeocode(lat, lng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      tileLayerRef.current = null
    }
  }, [])

  // Sync external coordinate changes with map marker
  useEffect(() => {
    if (markerRef.current && currentCoords.lat !== undefined && currentCoords.lng !== undefined) {
      const currentPos = markerRef.current.getLatLng()
      if (
        Math.abs(currentPos.lat - currentCoords.lat) > 0.0001 ||
        Math.abs(currentPos.lng - currentCoords.lng) > 0.0001
      ) {
        markerRef.current.setLatLng([currentCoords.lat, currentCoords.lng])
      }
    }
  }, [currentCoords.lat, currentCoords.lng])

  // Handle Preset Quick Selection
  const handleSelectPreset = (hub: (typeof QUICK_HUBS)[0]) => {
    setActivePreset(hub.name)
    onAddressChange(hub.name)
    onChange({
      lat: hub.lat,
      lng: hub.lng,
      address: hub.name,
      placeName: hub.name,
    })

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([hub.lat, hub.lng])
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 14, {
        animate: true,
        duration: 1,
      })
      markerRef.current
        .bindPopup(
          `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;min-width:140px;">
            <div style="font-weight:700;font-size:12px;color:#18181b;">${hub.name}</div>
          </div>`
        )
        .openPopup()
    }
  }

  // Handle "Use My Live Location" button
  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = Number(pos.coords.latitude.toFixed(5))
        const lng = Number(pos.coords.longitude.toFixed(5))
        setActivePreset(null)
        reverseGeocode(lat, lng, true)
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  // Global Worldwide Search (non-form container to prevent React nested-form warnings)
  const handleSearchSubmit = async () => {
    const query = addressText.trim()
    if (!query) return

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      )
      if (res.ok) {
        const results = await res.json()
        if (results && results.length > 0) {
          const first = results[0]
          const lat = Number(parseFloat(first.lat).toFixed(5))
          const lng = Number(parseFloat(first.lon).toFixed(5))
          const addr = first.address || {}
          const parts: string[] = []

          const primary =
            addr.road ||
            addr.pedestrian ||
            addr.hotel ||
            addr.building ||
            addr.aeroway ||
            addr.amenity ||
            first.display_name.split(",")[0]
          if (primary) parts.push(primary.trim())

          const locality =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.municipality ||
            addr.county
          if (locality && !parts.includes(locality.trim())) {
            parts.push(locality.trim())
          }

          const country = addr.country
          if (country && !parts.includes(country.trim())) {
            parts.push(country.trim())
          }

          const formatted = parts.length > 0 ? parts.join(", ") : first.display_name

          onAddressChange(formatted)
          onChange({
            lat,
            lng,
            address: formatted,
            placeName: primary || query,
          })

          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
            mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 })
            markerRef.current
              .bindPopup(
                `<div style="font-family:system-ui,-apple-system,sans-serif;padding:2px 4px;min-width:140px;">
                  <div style="font-weight:700;font-size:12px;color:#18181b;">${primary || "Found Location"}</div>
                  <div style="font-size:11px;color:#71717a;margin-top:2px;">${locality || country || ""}</div>
                </div>`
              )
              .openPopup()
          }
        }
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-2.5 p-3.5 sm:p-4 bg-white rounded-2xl border border-stone-200/90 shadow-xs">
      {/* Clean Header: Label + Subdued Status */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
          <LocationIcon size={14} className="text-[#F97316]" />
          <span>{label}</span>
        </label>
        {isGeocoding && (
          <span className="text-[11px] font-medium text-orange-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            Updating address...
          </span>
        )}
      </div>

      {/* Unified Single Input Bar: Search, Type, & Geocode in One Sleek Field */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-stone-400 pointer-events-none flex items-center">
          <LocationIcon size={14} />
        </span>
        <input
          type="text"
          value={addressText}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearchSubmit()
            }
          }}
          placeholder={placeholder}
          className="w-full pl-8 pr-20 py-2 bg-stone-50/80 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#F97316] rounded-xl text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-stone-400"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Live GPS button */}
          <button
            type="button"
            onClick={handleUseLiveLocation}
            disabled={isLocating}
            title="Use my live location"
            className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLocating ? (
              <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin block" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            )}
          </button>

          {/* Search Action Button */}
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={isSearching || !addressText.trim()}
            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Clean Quick Location Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider shrink-0 mr-0.5">
          Quick:
        </span>
        {QUICK_HUBS.map((hub) => {
          const isSelected = activePreset === hub.name || addressText.includes(hub.name)
          return (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectPreset(hub)}
              className={`px-2 py-0.5 text-[11px] rounded-lg transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? "bg-orange-500 text-white border-orange-600 font-semibold shadow-2xs"
                  : "bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 border-stone-200/80"
              }`}
            >
              {hub.name}
            </button>
          )
        })}
      </div>

      {/* Modern Interactive Google Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-stone-200/90 shadow-xs">
        {/* Sleek Minimalist Controls in Map Header */}
        <div className="absolute top-2 right-2 z-[400] flex items-center gap-1.5">
          {/* Reset World View */}
          <button
            type="button"
            onClick={handleResetWorldView}
            title="Reset to whole world map"
            className="px-2 py-1 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-stone-700 hover:text-stone-900 rounded-lg border border-stone-200/90 shadow-2xs transition cursor-pointer"
          >
            🌍 World
          </button>

          {/* Clean Segmented Map Style Toggle: Map | Satellite */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchMapStyle("roadmap")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                activeMapStyle === "roadmap"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMapStyle("satellite")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                activeMapStyle === "satellite"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Leaflet DOM container */}
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-72 z-0 bg-[#e5e3df]"
        />
      </div>
    </div>
  )
}
