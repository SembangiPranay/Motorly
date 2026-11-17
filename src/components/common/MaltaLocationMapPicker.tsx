import React, { useState, useEffect, useRef, useCallback } from "react"
import { LocationIcon, CheckIcon } from "../Icons"
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

export const MALTA_PRESETS: { name: string; lat: number; lng: number; desc: string }[] = [
  {
    name: "Malta International Airport (MLA) Terminal",
    desc: "Luqa Departures / Arrivals VIP drop-off",
    lat: 35.8575,
    lng: 14.4775,
  },
  {
    name: "Sliema / St. Julian's Hotel Delivery",
    desc: "Seafront Promenade & Hotel Lobbies",
    lat: 35.9122,
    lng: 14.5042,
  },
  {
    name: "Valletta Cruise Port / Waterfront",
    desc: "Grand Harbour Maritime Pier & Capital Gate",
    lat: 35.892,
    lng: 14.5126,
  },
  {
    name: "St. Paul's Bay / Bugibba Accommodation",
    desc: "Northern Coast Resort & Hotel District",
    lat: 35.95,
    lng: 14.415,
  },
  {
    name: "Cirkewwa Ferry Terminal (Gozo Link)",
    desc: "North Pier for Gozo Channel ferry dispatch",
    lat: 35.988,
    lng: 14.3275,
  },
  {
    name: "Mdina & Rabat Historic City Gate",
    desc: "Silent City main entrance & plaza",
    lat: 35.8858,
    lng: 14.403,
  },
  {
    name: "Pit Stop Central Garage (Mgarr)",
    desc: "36 Triq Il-Kbira, Mgarr HQ",
    lat: 35.9197,
    lng: 14.3664,
  },
]

type MapStyle = "roadmap" | "satellite" | "terrain"

function getGoogleTileUrl(style: MapStyle): string {
  switch (style) {
    case "satellite":
      // Google Hybrid: High-res satellite imagery with roads, cities and label overlays
      return "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    case "terrain":
      // Google Terrain with shaded elevation
      return "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
    case "roadmap":
    default:
      // Canonical Google Maps Roadmap
      return "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
  }
}

// Custom Leaflet DivIcon for crisp, modern Pit Stop orange pin marker
function createCustomPinIcon() {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="position: relative; width: 36px; height: 44px; transform: translate(-18px, -44px);">
        <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; background: rgba(249, 115, 22, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: rgba(0, 0, 0, 0.35); border-radius: 50%; filter: blur(1px);"></div>
        <svg viewBox="0 0 36 44" width="36" height="44" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); position: relative; z-index: 2;">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26c0-9.94-8.06-18-18-18z" fill="#F97316" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="18" cy="17" r="6" fill="#FFFFFF"/>
          <circle cx="18" cy="17" r="3" fill="#EA580C"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  })
}

export default function MaltaLocationMapPicker({
  value,
  onChange,
  addressText,
  onAddressChange,
  label = "Custom Delivery Location & Dispatch Pin",
  placeholder = "e.g. Malta Airport (MLA) Terminal / Sliema Hotel",
}: MaltaLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [activeMapStyle, setActiveMapStyle] = useState<MapStyle>("roadmap")
  const [isLocating, setIsLocating] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Current active coordinates (default to Malta Airport MLA if empty)
  const currentCoords = value || {
    lat: 35.8575,
    lng: 14.4775,
    address: addressText || "Malta International Airport (MLA) Terminal",
    placeName: "Malta Airport",
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

  // Reverse geocoding helper via OpenStreetMap Nominatim with Google Maps fallback formatting
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, flyTo = false) => {
      setIsGeocoding(true)
      setGeoError(null)

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.display_name) {
            const addr = data.address || {}
            const roadOrPlace =
              addr.road ||
              addr.hotel ||
              addr.building ||
              addr.suburb ||
              addr.village ||
              addr.town ||
              addr.city ||
              data.display_name.split(",")[0]
            const town = addr.village || addr.town || addr.city || addr.suburb || ""
            const formatted = town && roadOrPlace !== town
              ? `${roadOrPlace}, ${town}, Malta`
              : `${roadOrPlace}, Malta`

            onAddressChange(formatted)
            onChange({
              lat,
              lng,
              address: formatted,
              placeName: roadOrPlace || "Google Maps Custom Pin",
            })

            // Update marker popup with Google Maps styling
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng])
              markerRef.current
                .bindPopup(
                  `<div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;min-width:160px;">
                    <div style="font-weight:700;font-size:12px;color:#111827;">${roadOrPlace}</div>
                    <div style="font-size:11px;color:#4B5563;margin-top:2px;">${town ? town + ", Malta" : "Malta"}</div>
                    <div style="font-size:10px;font-family:monospace;color:#EA580C;margin-top:4px;">📍 ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
                    <div style="font-size:9px;color:#2563EB;margin-top:4px;font-weight:600;">Google Maps Precision Pin</div>
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
      } catch (e) {
        // Fallback gracefully without breaking
      }

      // Fallback coordinate label
      const fallback = `Malta Pin (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`
      if (!addressText) {
        onAddressChange(fallback)
      }
      onChange({
        lat,
        lng,
        address: addressText || fallback,
        placeName: "Google Maps Pin",
      })

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
        markerRef.current
          .bindPopup(
            `<div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;">
              <div style="font-weight:700;font-size:12px;color:#111827;">Custom Selected Location</div>
              <div style="font-size:10px;font-family:monospace;color:#EA580C;margin-top:4px;">📍 ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
              <div style="font-size:9px;color:#2563EB;margin-top:4px;font-weight:600;">Google Maps Precision Pin</div>
            </div>`
          )
          .openPopup()
      }
      setIsGeocoding(false)
    },
    [addressText, onAddressChange, onChange]
  )

  // Initialize the Leaflet Map with Google Maps
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialLat = currentCoords.lat || 35.8575
    const initialLng = currentCoords.lng || 14.4775

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      maxBounds: [
        [35.6, 14.0],
        [36.3, 14.8],
      ],
      minZoom: 10,
      maxZoom: 20,
    })

    // Official Google Maps Tile Layer
    const tileLayer = L.tileLayer(getGoogleTileUrl(activeMapStyle), {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
      subdomains: ["0", "1", "2", "3"],
    }).addTo(map)
    tileLayerRef.current = tileLayer

    // Create Draggable Marker
    const icon = createCustomPinIcon()
    const marker = L.marker([initialLat, initialLng], {
      icon,
      draggable: true,
      autoPan: true,
    }).addTo(map)

    marker.bindPopup(
      `<div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;min-width:160px;">
        <div style="font-weight:700;font-size:12px;color:#111827;">${currentCoords.placeName || "Malta Delivery Location"}</div>
        <div style="font-size:11px;color:#4B5563;margin-top:2px;">${addressText || "Selected Dispatch Point"}</div>
        <div style="font-size:10px;font-family:monospace;color:#EA580C;margin-top:4px;">📍 ${initialLat.toFixed(5)}° N, ${initialLng.toFixed(5)}° E</div>
        <div style="font-size:9px;color:#2563EB;margin-top:4px;font-weight:600;">Google Maps Precision Pin</div>
      </div>`
    )

    // Handle marker dragend
    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      setSelectedPreset(null)
      reverseGeocode(pos.lat, pos.lng)
    })

    // Handle map click: move marker to clicked spot and geocode
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setSelectedPreset(null)
      reverseGeocode(lat, lng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    // Invalidate map size shortly after rendering to ensure proper tile coverage
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

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
    if (markerRef.current && currentCoords.lat && currentCoords.lng) {
      const currentPos = markerRef.current.getLatLng()
      if (
        Math.abs(currentPos.lat - currentCoords.lat) > 0.0001 ||
        Math.abs(currentPos.lng - currentCoords.lng) > 0.0001
      ) {
        markerRef.current.setLatLng([currentCoords.lat, currentCoords.lng])
      }
    }
  }, [currentCoords.lat, currentCoords.lng])

  // Handle Preset Selection
  const handleSelectPreset = (preset: (typeof MALTA_PRESETS)[0]) => {
    setSelectedPreset(preset.name)
    setGeoError(null)
    onAddressChange(preset.name)
    onChange({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.name,
      placeName: preset.name,
    })

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng])
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 15, {
        animate: true,
        duration: 1,
      })
      markerRef.current
        .bindPopup(
          `<div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;min-width:160px;">
            <div style="font-weight:700;font-size:12px;color:#111827;">${preset.name}</div>
            <div style="font-size:11px;color:#4B5563;margin-top:2px;">${preset.desc}</div>
            <div style="font-size:10px;font-family:monospace;color:#EA580C;margin-top:4px;">📍 ${preset.lat.toFixed(5)}° N, ${preset.lng.toFixed(5)}° E</div>
            <div style="font-size:9px;color:#2563EB;margin-top:4px;font-weight:600;">Google Maps Precision Pin</div>
          </div>`
        )
        .openPopup()
    }
  }

  // Handle "Use My Live Location" button
  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        let lat = Number(pos.coords.latitude.toFixed(5))
        let lng = Number(pos.coords.longitude.toFixed(5))

        // Check if inside Malta bounds
        const isWithinMalta =
          lat >= 35.75 && lat <= 36.15 && lng >= 14.15 && lng <= 14.65

        if (!isWithinMalta) {
          setGeoError(
            `Live GPS detected (${lat.toFixed(3)}, ${lng.toFixed(3)}). Map centered on Malta Airport gateway for island dispatch.`
          )
          lat = 35.8575
          lng = 14.4775
          setSelectedPreset("Malta International Airport (MLA) Terminal")
          onAddressChange("Malta International Airport (MLA) Terminal")
          onChange({
            lat,
            lng,
            address: "Malta International Airport (MLA) Terminal",
            placeName: "Live GPS (Malta Airport Dispatch)",
          })
          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
            mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 })
          }
          return
        }

        setSelectedPreset(null)
        reverseGeocode(lat, lng, true)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Click or drag anywhere on the map to pin your location.")
        } else {
          setGeoError("Unable to retrieve GPS location. Click anywhere on the map to drop a pin.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Search Malta addresses / landmarks
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setGeoError(null)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery.trim() + ", Malta"
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
          const roadOrPlace =
            addr.road ||
            addr.hotel ||
            addr.building ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            first.display_name.split(",")[0]
          const town = addr.village || addr.town || addr.city || addr.suburb || ""
          const formatted = town && roadOrPlace !== town
            ? `${roadOrPlace}, ${town}, Malta`
            : `${roadOrPlace}, Malta`

          onAddressChange(formatted)
          onChange({
            lat,
            lng,
            address: formatted,
            placeName: roadOrPlace || searchQuery,
          })

          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
            mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1 })
            markerRef.current
              .bindPopup(
                `<div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;min-width:160px;">
                  <div style="font-weight:700;font-size:12px;color:#111827;">${roadOrPlace}</div>
                  <div style="font-size:11px;color:#4B5563;margin-top:2px;">${town ? town + ", Malta" : "Malta"}</div>
                  <div style="font-size:10px;font-family:monospace;color:#EA580C;margin-top:4px;">📍 ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
                  <div style="font-size:9px;color:#2563EB;margin-top:4px;font-weight:600;">Google Maps Precision Pin</div>
                </div>`
              )
              .openPopup()
          }
          setIsSearching(false)
          setSearchQuery("")
          return
        }
      }
      setGeoError(`No results found in Malta for "${searchQuery}". Tap on the map to drop a pin.`)
    } catch {
      setGeoError("Search request failed. Please tap directly on the map.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-3 pt-2 bg-stone-50/90 p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs">
      {/* Header bar with Google Maps badge and Live GPS trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <LocationIcon size={14} className="text-[#F97316]" />
            <span>{label}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>GOOGLE MAPS MALTA</span>
            </span>
          </label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Click anywhere on the map or drag the pin to pinpoint the exact delivery address.
          </p>
        </div>

        {/* Live GPS button */}
        <button
          type="button"
          onClick={handleUseLiveLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-orange-50 text-[#F97316] hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isLocating ? (
            <>
              <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Locating GPS...</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span>Use My Live Location</span>
            </>
          )}
        </button>
      </div>

      {/* Address Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search hotel, street, or landmark in Malta (e.g. Hilton St. Julian's, Golden Bay)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] text-stone-900 shadow-2xs"
          />
          <span className="absolute left-2.5 top-2.5 text-stone-400">
            <LocationIcon size={13} />
          </span>
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isSearching ? "Searching..." : "Find on Map"}
        </button>
      </form>

      {/* Selected Address Display Field */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-stone-700">
          <span>Pinned Delivery Address:</span>
          {isGeocoding && (
            <span className="text-orange-600 font-bold flex items-center gap-1">
              <span className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Detecting street address...
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={addressText}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316] text-stone-900 shadow-2xs"
        />

        {currentCoords && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 px-1">
            <span className="font-mono text-stone-700 font-semibold flex items-center gap-1">
              <span className="text-orange-600">📍</span>
              <span>
                {currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E
              </span>
            </span>
            <a
              href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F97316] hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>View in Google Maps ↗</span>
            </a>
          </div>
        )}
      </div>

      {geoError && (
        <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 p-2 rounded-lg font-medium">
          {geoError}
        </div>
      )}

      {/* OFFICIAL GOOGLE MAPS INTERACTIVE STREET MAP CONTAINER */}
      <div className="relative rounded-xl overflow-hidden border border-stone-300 shadow-md">
        {/* Map Header Overlay Bar: Click hint + Google Map Style Switcher */}
        <div className="absolute top-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          {/* Hint badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200 shadow-xs text-[11px] font-semibold text-stone-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Click anywhere or drag pin</span>
          </div>

          {/* Google Maps Layer Style Switcher */}
          <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200 shadow-xs">
            <button
              type="button"
              onClick={() => handleSwitchMapStyle("roadmap")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeMapStyle === "roadmap"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              🗺️ Roadmap
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMapStyle("satellite")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeMapStyle === "satellite"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMapStyle("terrain")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeMapStyle === "terrain"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              ⛰️ Terrain
            </button>
          </div>
        </div>

        {/* Leaflet DOM container */}
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-0 bg-[#e5e3df]"
        />

        {/* Floating coordinates badge */}
        <div className="absolute bottom-2 right-2 z-[400] bg-stone-900/90 text-white border border-stone-700 px-2.5 py-1 rounded-md text-[10px] font-mono shadow-md backdrop-blur-xs flex items-center gap-1.5">
          <span className="text-orange-400">📍</span>
          <span>{currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E</span>
        </div>
      </div>

      {/* Quick Landmark Preset Buttons */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
          Frequent Island Delivery &amp; Ferry Hubs:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MALTA_PRESETS.map((preset) => {
            const isSelected =
              selectedPreset === preset.name ||
              addressText.includes(preset.name) ||
              (Math.abs(preset.lat - currentCoords.lat) < 0.003 &&
                Math.abs(preset.lng - currentCoords.lng) < 0.003)
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer border flex items-center gap-1 ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-600 shadow-2xs font-semibold"
                    : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                <span>{preset.name}</span>
                {isSelected && <CheckIcon size={11} className="text-white" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
