import React, { useState, useEffect } from "react"
import { LocationIcon, ShieldIcon } from "./Icons"

interface GarageMapViewerProps {
  garageName?: string
  garageAddress?: string
  garageBay?: string
  lat?: number
  lng?: number
  isEditable?: boolean
  onLocationChange?: (lat: number, lng: number, address: string) => void
  height?: string
}

export default function GarageMapViewer({
  garageName = "MOTORLY Central Hub & Garage Bay 4",
  garageAddress = "4200 NW 21st St, Miami, FL 33142",
  garageBay = "Bay 14-B",
  lat = 25.7959,
  lng = -80.287,
  isEditable = false,
  onLocationChange,
  height = "260px",
}: GarageMapViewerProps) {
  const [copied, setCopied] = useState(false)
  const [currentLat, setCurrentLat] = useState(lat)
  const [currentLng, setCurrentLng] = useState(lng)
  const [currentAddress, setCurrentAddress] = useState(garageAddress)
  const [isLocating, setIsLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [userDistanceMiles, setUserDistanceMiles] = useState<number | null>(
    null,
  )

  // Haversine distance helper (miles)
  const computeDistanceMiles = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 3958.8 // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Number((R * c).toFixed(1))
  }

  // Sync internal state whenever props change from parent form
  useEffect(() => {
    if (lat && !isNaN(lat)) setCurrentLat(lat)
    if (lng && !isNaN(lng)) setCurrentLng(lng)
    if (garageAddress) setCurrentAddress(garageAddress)
  }, [lat, lng, garageAddress])

  // Pre-configured garage bay selector
  const PRESET_HUBS = [
    {
      name: "Main Garage Facility - Bay 1",
      address: "100 Industrial Parkway, Bay 1",
      lat: 25.7725,
      lng: -80.1878,
      bay: "Bay 1",
    },
    {
      name: "Main Garage Facility - Bay 2",
      address: "100 Industrial Parkway, Bay 2",
      lat: 25.7728,
      lng: -80.1875,
      bay: "Bay 2",
    },
    {
      name: "Vehicle Inspection & Prep Bay",
      address: "100 Industrial Parkway, Bay 3",
      lat: 25.7722,
      lng: -80.188,
      bay: "Prep Bay",
    },
    {
      name: "Customer Handoff Stall",
      address: "100 Industrial Parkway, Front Lot",
      lat: 25.772,
      lng: -80.1882,
      bay: "Stall A",
    },
  ]

  const handleSelectPreset = (hub: typeof PRESET_HUBS[0]) => {
    setCurrentLat(hub.lat)
    setCurrentLng(hub.lng)
    setCurrentAddress(hub.address)
    if (onLocationChange) {
      onLocationChange(hub.lat, hub.lng, hub.address)
    }
  }

  // Locate Me: Browser GPS Geolocation + Reverse Geocode
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(5))
        const userLng = Number(pos.coords.longitude.toFixed(5))

        if (isEditable) {
          // Admin mode: Set garage to current location
          setCurrentLat(userLat)
          setCurrentLng(userLng)

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`,
            )
            const data = await res.json()
            if (data && data.display_name) {
              // Extract clean, intelligible location string preserving city and region
              const addr = data.address || {}
              const road = addr.road || addr.street || addr.pedestrian || ""
              const suburb = addr.suburb || addr.neighbourhood || addr.residential || ""
              const city = addr.city || addr.town || addr.municipality || addr.county || ""
              const state = addr.state || ""
              const postcode = addr.postcode || ""

              const cleanParts = [road, suburb, city, state, postcode].filter(Boolean)
              const resolvedAddress = cleanParts.length >= 2 
                ? cleanParts.join(", ") 
                : data.display_name

              setCurrentAddress(resolvedAddress)
              if (onLocationChange)
                onLocationChange(userLat, userLng, resolvedAddress)
            } else {
              const gpsStr = `GPS Facility (${userLat}, ${userLng})`
              setCurrentAddress(gpsStr)
              if (onLocationChange) onLocationChange(userLat, userLng, gpsStr)
            }
          } catch {
            const gpsStr = `GPS Facility (${userLat}, ${userLng})`
            setCurrentAddress(gpsStr)
            if (onLocationChange) onLocationChange(userLat, userLng, gpsStr)
          }
        } else {
          // Customer mode: Compute distance from user to this garage
          const dist = computeDistanceMiles(
            userLat,
            userLng,
            currentLat,
            currentLng,
          )
          setUserDistanceMiles(dist)
        }
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        alert("Location access failed or denied: " + err.message)
      },
      { enableHighAccuracy: true, timeout: 9000 },
    )
  }

  // Search Address on Map
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}`,
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0]
        const searchedLat = Number(Number(first.lat).toFixed(5))
        const searchedLng = Number(Number(first.lon).toFixed(5))
        const formatted = first.display_name
          .split(",")
          .slice(0, 4)
          .join(",")
          .trim()
        setCurrentLat(searchedLat)
        setCurrentLng(searchedLng)
        setCurrentAddress(formatted)
        if (onLocationChange)
          onLocationChange(searchedLat, searchedLng, formatted)
        setSearchQuery("")
      } else {
        alert("Address not found. Please try another street or city name.")
      }
    } catch {
      alert("Address search failed. Please check network connection.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${currentAddress} (${garageBay})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`
  const openStreetMapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    currentLng - 0.008
  }%2C${currentLat - 0.006}%2C${currentLng + 0.008}%2C${
    currentLat + 0.006
  }&layer=mapnik&marker=${currentLat}%2C${currentLng}`

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200/90 bg-white shadow-xs flex flex-col font-sans">
      {/* Map Header with Address & Action Controls */}
      <div className="p-3.5 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0 border border-orange-500/20">
            <LocationIcon size={16} />
          </div>
          <div className="truncate">
            <h4 className="font-bold text-stone-900 truncate text-xs">
              {garageName}
            </h4>
            <p className="text-[11px] text-stone-500 truncate font-mono">
              {currentAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {garageBay && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {garageBay}
            </span>
          )}

          {userDistanceMiles !== null && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in flex items-center gap-1">
              {userDistanceMiles} mi from you
            </span>
          )}

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
            title={
              isEditable
                ? "Pin garage to current device GPS coordinates"
                : "Calculate distance from my current GPS location to this garage"
            }
          >
            <span>{isLocating ? "Locating..." : "Locate Me"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-semibold transition cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Address"}
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            Google Maps ↗
          </a>
        </div>
      </div>

      {/* Admin Map Controls: Address Search & Quick Hub Presets */}
      {isEditable && (
        <div className="px-3.5 py-2.5 bg-stone-100/80 border-b border-stone-200 space-y-2">
          <form
            onSubmit={handleSearchAddress}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address or landmark to move map pin..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#F97316]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition cursor-pointer"
            >
              {isSearching ? "Searching..." : "Pin Address"}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">
              Preset Hubs:
            </span>
            {PRESET_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:border-[#F97316] text-stone-700 font-medium transition cursor-pointer"
              >
                {hub.name.split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Map Visual */}
      <div className="relative w-full bg-stone-100" style={{ height }}>
        <iframe
          title="Garage Hub Map Location"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={openStreetMapEmbedUrl}
          className="w-full h-full border-0 filter contrast-[1.02]"
        />

        {/* Central Vehicle Garage Marker Beacon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="px-2.5 py-1 rounded-full bg-[#17191C] text-white text-[10px] font-bold shadow-lg border border-white/20 whitespace-nowrap mb-1 flex items-center gap-1.5 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            <span>{garageBay || "Garage Stall"}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-[#F97316] border-2 border-white shadow-md flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <div className="w-8 h-2 bg-black/30 rounded-full blur-[2px] mt-0.5" />
        </div>

        {/* Coordinates Overlay */}
        <div className="absolute bottom-2 left-2 bg-[#17191C]/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono border border-white/10 pointer-events-none flex items-center gap-2">
          <span>
            GPS: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </span>
          <span className="text-orange-400 font-bold">• STAGED</span>
        </div>
      </div>
    </div>
  )
}
