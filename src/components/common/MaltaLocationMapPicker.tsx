import React, { useState, useEffect, useRef, useCallback } from "react"
import { LocationIcon, CheckIcon } from "../Icons"
import type { DeliveryCoordinates } from "../../types"

interface MaltaLocationMapPickerProps {
  value?: DeliveryCoordinates
  onChange: (coords: DeliveryCoordinates) => void
  addressText: string
  onAddressChange: (address: string) => void
  label?: string
  placeholder?: string
}

// Bounding box for the Maltese Archipelago (Gozo + Comino + Malta)
// Approx: Lat 35.79 to 36.08, Lng 14.18 to 14.58
const MALTA_BOUNDS = {
  minLat: 35.79,
  maxLat: 36.08,
  minLng: 14.18,
  maxLng: 14.58,
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

// Convert geographic GPS coordinates into SVG viewBox (0,0 to 1000, 600)
function coordsToSvg(lat: number, lng: number) {
  const x =
    ((lng - MALTA_BOUNDS.minLng) / (MALTA_BOUNDS.maxLng - MALTA_BOUNDS.minLng)) * 1000
  // Invert Y because SVG coordinates increase downwards
  const y =
    ((MALTA_BOUNDS.maxLat - lat) / (MALTA_BOUNDS.maxLat - MALTA_BOUNDS.minLat)) * 600
  return {
    x: Math.max(20, Math.min(980, x)),
    y: Math.max(20, Math.min(580, y)),
  }
}

// Convert SVG viewBox (0,0 to 1000, 600) into geographic GPS coordinates
function svgToCoords(x: number, y: number) {
  const lng =
    MALTA_BOUNDS.minLng + (x / 1000) * (MALTA_BOUNDS.maxLng - MALTA_BOUNDS.minLng)
  const lat =
    MALTA_BOUNDS.maxLat - (y / 600) * (MALTA_BOUNDS.maxLat - MALTA_BOUNDS.minLat)
  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
  }
}

export default function MaltaLocationMapPicker({
  value,
  onChange,
  addressText,
  onAddressChange,
  label = "Custom Delivery Location",
  placeholder = "e.g. Malta Airport (MLA) Terminal / Sliema Hotel",
}: MaltaLocationMapPickerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Current active coordinates (default to Malta Airport MLA if empty)
  const currentCoords = value || {
    lat: 35.8575,
    lng: 14.4775,
    address: addressText || "Malta International Airport (MLA) Terminal",
    placeName: "Malta International Airport (MLA)",
  }

  const pinSvgPos = coordsToSvg(currentCoords.lat, currentCoords.lng)

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.display_name) {
            const shortName =
              data.address?.road ||
              data.address?.suburb ||
              data.address?.village ||
              data.address?.town ||
              data.address?.city ||
              data.display_name.split(",")[0]
            const fullReadable = shortName
              ? `${shortName}, ${data.address?.state || data.address?.country || "Malta"}`
              : data.display_name
            onAddressChange(fullReadable)
            onChange({
              lat,
              lng,
              address: fullReadable,
              placeName: shortName || "Custom Location Pin",
            })
            return
          }
        }
      } catch (e) {
        // Fallback gracefully without throwing
      }

      // If geocoding fails or offline, provide a clean GPS label
      const fallback = `Malta Custom Pin (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`
      if (!addressText) {
        onAddressChange(fallback)
      }
      onChange({
        lat,
        lng,
        address: addressText || fallback,
        placeName: "Custom Location Pin",
      })
    },
    [addressText, onAddressChange, onChange]
  )

  // Handle clicking or tapping on the SVG map to place pin
  const handleMapPointerEvent = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const relX = ((clientX - rect.left) / rect.width) * 1000
    const relY = ((clientY - rect.top) / rect.height) * 600

    const { lat, lng } = svgToCoords(
      Math.max(10, Math.min(990, relX)),
      Math.max(10, Math.min(590, relY))
    )

    setSelectedPreset(null)
    setGeoError(null)

    // Check if close to any preset
    const closePreset = MALTA_PRESETS.find(
      (p) => Math.abs(p.lat - lat) < 0.015 && Math.abs(p.lng - lng) < 0.015
    )

    if (closePreset) {
      setSelectedPreset(closePreset.name)
      onAddressChange(closePreset.name)
      onChange({
        lat: closePreset.lat,
        lng: closePreset.lng,
        address: closePreset.name,
        placeName: closePreset.name,
      })
    } else {
      reverseGeocode(lat, lng)
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

        // If user is currently located in Malta bounds, use real GPS
        const isWithinMalta =
          lat >= 35.75 && lat <= 36.15 && lng >= 14.15 && lng <= 14.65

        if (!isWithinMalta) {
          // If testing overseas (e.g. developer laptop outside Malta), gently snap to Malta Central / Airport
          // while noting that live GPS was received
          setGeoError(
            `Live GPS detected (${lat.toFixed(3)}, ${lng.toFixed(3)}). Pinned to Malta gateway hub for Island delivery dispatch.`
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
          return
        }

        setSelectedPreset(null)
        reverseGeocode(lat, lng)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission was denied. Tap anywhere on the map to pin your location.")
        } else {
          setGeoError("Unable to retrieve GPS location. Tap anywhere on the map to place a pin.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

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
  }

  return (
    <div className="space-y-3 pt-2 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
      {/* Header bar with Live GPS trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <LocationIcon size={14} className="text-[#F97316]" />
          <span>{label}</span>
          <span className="text-[10px] font-mono text-stone-500 font-normal">
            (Malta &amp; Gozo GPS Pin)
          </span>
        </label>

        {/* Live GPS button */}
        <button
          type="button"
          onClick={handleUseLiveLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-orange-50 text-[#F97316] hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
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

      {/* Address Text Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={addressText}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] text-stone-900 shadow-2xs"
        />
        {currentCoords && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 px-1">
            <span className="font-mono text-stone-700 font-semibold flex items-center gap-1">
              <span className="text-orange-600">📍</span>
              <span>
                {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° E
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
        <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg">
          {geoError}
        </div>
      )}

      {/* Interactive Map of Malta & Gozo */}
      <div className="relative bg-[#0F172A] rounded-xl overflow-hidden border border-slate-700 shadow-inner group">
        <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-orange-400 border border-orange-500/30 backdrop-blur-xs">
            MALTA ARCHIPELAGO NAVIGATOR
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Tap or click anywhere to drop dispatch pin
          </span>
        </div>

        {/* Map SVG canvas */}
        <svg
          ref={svgRef}
          viewBox="0 0 1000 600"
          className="w-full h-52 sm:h-64 cursor-crosshair select-none touch-none"
          onClick={handleMapPointerEvent}
        >
          {/* Subtle grid lines */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#1E293B"
                strokeWidth="0.8"
              />
            </pattern>
            <radialGradient id="waterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="islandFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* Background water */}
          <rect width="1000" height="600" fill="url(#waterGlow)" />
          <rect width="1000" height="600" fill="url(#grid)" opacity="0.6" />

          {/* Island 1: GOZO (Northwest) */}
          <g id="gozo-island" className="transition-opacity">
            <path
              d="M 120 110 C 145 90, 210 80, 260 105 C 310 130, 325 170, 305 195 C 285 220, 240 235, 185 220 C 130 205, 100 170, 105 140 Z"
              fill="url(#islandFill)"
              stroke="#64748B"
              strokeWidth="2.5"
            />
            {/* Gozo secondary contour */}
            <path
              d="M 140 120 C 170 100, 240 100, 280 125 C 295 155, 275 190, 235 195 C 190 200, 140 170, 135 140 Z"
              fill="#293548"
              opacity="0.8"
            />
            <text x="200" y="155" fill="#94A3B8" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="2">
              GOZO
            </text>
            <text x="200" y="172" fill="#64748B" fontSize="10" textAnchor="middle">
              (Victoria / Mgarr Harbour)
            </text>
          </g>

          {/* Island 2: COMINO (Middle) */}
          <g id="comino-island">
            <ellipse
              cx="355"
              cy="235"
              rx="28"
              ry="18"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="2"
            />
            <text x="355" y="240" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">
              COMINO
            </text>
          </g>

          {/* Island 3: MAIN ISLAND OF MALTA (Southeast) */}
          <g id="malta-main-island">
            {/* Detailed coastal geometry of mainland Malta */}
            <path
              d="M 390 260 
                 C 425 240, 480 250, 520 280 
                 C 560 300, 610 305, 660 325 
                 C 715 345, 770 380, 810 420 
                 C 840 450, 850 490, 830 520 
                 C 800 555, 740 550, 690 535 
                 C 630 515, 570 480, 510 450 
                 C 450 420, 410 380, 395 340 
                 C 380 305, 370 280, 390 260 Z"
              fill="url(#islandFill)"
              stroke="#64748B"
              strokeWidth="2.8"
            />

            {/* Inner terrain contour & ridge */}
            <path
              d="M 430 280 
                 C 480 280, 570 320, 640 345 
                 C 710 375, 770 420, 780 460 
                 C 760 500, 700 500, 640 470 
                 C 580 440, 500 390, 450 350 
                 C 420 325, 410 295, 430 280 Z"
              fill="#243042"
              opacity="0.9"
            />

            {/* Major Arterial Highway lines across Malta */}
            <path
              d="M 395 265 Q 460 310 520 340 T 630 380 T 730 450 T 800 480"
              stroke="#475569"
              strokeWidth="2"
              strokeDasharray="4,4"
              fill="none"
            />
            <path
              d="M 520 340 Q 560 400 600 440 T 680 490"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              fill="none"
            />

            <text x="610" y="420" fill="#94A3B8" fontSize="18" fontWeight="black" textAnchor="middle" letterSpacing="3">
              MALTA
            </text>
          </g>

          {/* Landmark Guide Dots on Map */}
          {MALTA_PRESETS.map((preset) => {
            const p = coordsToSvg(preset.lat, preset.lng)
            const isCurrent =
              Math.abs(preset.lat - currentCoords.lat) < 0.008 &&
              Math.abs(preset.lng - currentCoords.lng) < 0.008
            return (
              <g
                key={preset.name}
                className="cursor-pointer group/dot"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectPreset(preset)
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isCurrent ? "6" : "3.5"}
                  fill={isCurrent ? "#F97316" : "#94A3B8"}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-all"
                />
                <text
                  x={p.x}
                  y={p.y - 8}
                  fill={isCurrent ? "#FB923C" : "#CBD5E1"}
                  fontSize="9"
                  fontWeight={isCurrent ? "bold" : "normal"}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {preset.name.split("/")[0].replace("Malta International Airport (MLA) Terminal", "MLA Airport").replace("Pit Stop Central Garage (Mgarr)", "Mgarr Garage")}
                </text>
              </g>
            )
          })}

          {/* ACTIVE DROPPED PIN (Radar pulse + Glowing Pin Marker) */}
          <g
            id="active-delivery-pin"
            transform={`translate(${pinSvgPos.x}, ${pinSvgPos.y})`}
            className="transition-all duration-300 ease-out pointer-events-none"
          >
            {/* Radar wave 1 */}
            <circle
              r="22"
              fill="#F97316"
              opacity="0.25"
              className="animate-ping"
            />
            {/* Radar wave 2 */}
            <circle
              r="14"
              fill="#F97316"
              opacity="0.35"
            />
            {/* Center Anchor Point */}
            <circle
              r="3.5"
              fill="#FFFFFF"
              stroke="#EA580C"
              strokeWidth="2"
            />

            {/* Teardrop Pin Marker */}
            <g transform="translate(0, -22)">
              <path
                d="M 0 0 C -8 -8, -12 -16, -12 -22 C -12 -28.6, -6.6 -34, 0 -34 C 6.6 -34, 12 -28.6, 12 -22 C 12 -16, 8 -8, 0 0 Z"
                fill="#F97316"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.6))"
              />
              <circle cx="0" cy="-22" r="4.5" fill="#FFFFFF" />
            </g>
          </g>
        </svg>

        {/* Floating coordinates chip at bottom right of map */}
        <div className="absolute bottom-2.5 right-3 z-10 bg-slate-900/90 text-white border border-slate-700/80 px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-md backdrop-blur-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Pin: {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° E</span>
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
              (Math.abs(preset.lat - currentCoords.lat) < 0.005 &&
                Math.abs(preset.lng - currentCoords.lng) < 0.005)
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
