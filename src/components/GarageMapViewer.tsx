import React, { useState, useEffect, useRef } from "react"
import { LocationIcon, ShieldIcon, CheckIcon } from "./Icons"

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
  garageName = "Pit Stop Central Garage (36 Triq Il-Kbira, Mgarr)",
  garageAddress = "4200 NW 21st St, Miami, FL 33142",
  garageBay = "Bay 14-B",
  lat = 25.7959,
  lng = -80.287,
  isEditable = false,
  onLocationChange,
  height = "320px",
}: GarageMapViewerProps) {
  const [copied, setCopied] = useState(false)
  const [currentLat, setCurrentLat] = useState(Number(lat) || 17.4646)
  const [currentLng, setCurrentLng] = useState(Number(lng) || 78.3582)
  const [pointerLat, setPointerLat] = useState(Number(lat) || 17.4646)
  const [pointerLng, setPointerLng] = useState(Number(lng) || 78.3582)
  const [currentAddress, setCurrentAddress] = useState(garageAddress)
  const [hasUnsavedPin, setHasUnsavedPin] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("")

  // Dynamic Smooth Zoom & Canvas Expansion state
  const [zoomLevel, setZoomLevel] = useState(15)
  const [isExpanded, setIsExpanded] = useState(false)

  const [isLocating, setIsLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [userDistanceMiles, setUserDistanceMiles] = useState<number | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)

  // Distance helper
  const computeDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8
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

  // Sync internal state when parent props change
  useEffect(() => {
    if (lat && !isNaN(lat)) {
      setCurrentLat(Number(lat))
      setPointerLat(Number(lat))
    }
    if (lng && !isNaN(lng)) {
      setCurrentLng(Number(lng))
      setPointerLng(Number(lng))
    }
    if (garageAddress) {
      setCurrentAddress(garageAddress)
    }
  }, [lat, lng, garageAddress])

  // Invalidate map size when expanded/collapsed for crisp rendering
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize()
        } catch {}
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  // Dynamically load Leaflet for real interactive drag & drop map
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadLeaflet = () => {
      if (!(window as any).L) {
        if (!document.getElementById("leaflet-css")) {
          const css = document.createElement("link")
          css.id = "leaflet-css"
          css.rel = "stylesheet"
          css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(css)
        }

        if (!document.getElementById("leaflet-js")) {
          const script = document.createElement("script")
          script.id = "leaflet-js"
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => {
            setLeafletReady(true)
          }
          document.body.appendChild(script)
        }
      } else {
        setLeafletReady(true)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize or update Leaflet Map with smooth dynamic zooming
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return
    const L = (window as any).L
    if (!L) return

    if (!mapInstanceRef.current) {
      // Dynamic Smooth Zooming options: scrollWheelZoom enabled, smooth animation, wheel debounce
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: zoomLevel,
        minZoom: 3,
        maxZoom: 19,
        scrollWheelZoom: true, // Dynamically zoom in/out with mousewheel & trackpad
        smoothWheelZoom: true,
        smoothSensitivity: 1.5,
        wheelPxPerZoomLevel: 60,
        zoomAnimation: true,
        zoomAnimationThreshold: 8,
        fadeAnimation: true,
        markerZoomAnimation: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Listen to zoom changes reactively to update the slider and badge
      map.on("zoom", () => {
        setZoomLevel(Math.round(map.getZoom()))
      })
      map.on("zoomend", () => {
        setZoomLevel(Math.round(map.getZoom()))
      })

      const pinIcon = L.divIcon({
        className: "pit-stop-custom-pin",
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: ${
            isEditable ? "grab" : "default"
          };">
            <div style="background: #17191C; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap; margin-bottom: 2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #F97316;"></span>
              <span>${garageBay || "Staged Bay"}</span>
            </div>
            <div style="width: 30px; height: 30px; background: #F97316; border: 3px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(249,115,22,0.6); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="width: 14px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([currentLat, currentLng], {
        draggable: isEditable,
        icon: pinIcon,
      }).addTo(map)

      if (isEditable) {
        marker.on("drag", (e: any) => {
          const pos = e.target.getLatLng()
          setPointerLat(Number(pos.lat.toFixed(5)))
          setPointerLng(Number(pos.lng.toFixed(5)))
          setHasUnsavedPin(true)
        })

        marker.on("dragend", (e: any) => {
          const pos = e.target.getLatLng()
          setPointerLat(Number(pos.lat.toFixed(5)))
          setPointerLng(Number(pos.lng.toFixed(5)))
          setHasUnsavedPin(true)
        })

        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng)
          setPointerLat(Number(e.latlng.lat.toFixed(5)))
          setPointerLng(Number(e.latlng.lng.toFixed(5)))
          setHasUnsavedPin(true)
        })
      }

      mapInstanceRef.current = map
      markerInstanceRef.current = marker
    } else {
      // Update existing marker and smooth flyTo center
      mapInstanceRef.current.flyTo([currentLat, currentLng], mapInstanceRef.current.getZoom(), {
        duration: 0.7,
        easeLinearity: 0.25,
      })
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([currentLat, currentLng])
      }
    }
  }, [leafletReady, isEditable, garageBay])

  // Dynamic Smooth Zoom In / Zoom Out Handlers
  const handleSmoothZoom = (delta: number) => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const target = Math.min(19, Math.max(3, Math.round(map.getZoom()) + delta))
    map.flyTo([pointerLat, pointerLng], target, {
      duration: 0.45,
      easeLinearity: 0.25,
    })
    setZoomLevel(target)
  }

  const handleSetZoomLevel = (target: number) => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const clamped = Math.min(19, Math.max(3, target))
    map.flyTo([pointerLat, pointerLng], clamped, {
      duration: 0.6,
      easeLinearity: 0.25,
    })
    setZoomLevel(clamped)
  }

  // Recenter smooth animation on current pin
  const handleRecenterPin = () => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([pointerLat, pointerLng], Math.max(15, zoomLevel), {
      duration: 0.7,
      easeLinearity: 0.25,
    })
  }

  // Zoom out to broad overview to easily inspect long points across distances
  const handleOverviewLongPoints = () => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([pointerLat, pointerLng], 9, {
      duration: 0.9,
      easeLinearity: 0.25,
    })
    setZoomLevel(9)
  }

  // Explicit Save Pointer Location Button Action
  const handleSavePointerLocation = async () => {
    setIsSavingLocation(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pointerLat}&lon=${pointerLng}`,
      )
      const data = await res.json()
      let resolvedAddress = ""

      if (data && data.display_name) {
        const addr = data.address || {}
        const road = addr.road || addr.street || addr.pedestrian || ""
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || ""
        const city = addr.city || addr.town || addr.municipality || addr.county || ""
        const state = addr.state || ""
        const postcode = addr.postcode || ""

        const cleanParts = [road, suburb, city, state, postcode].filter(Boolean)
        resolvedAddress =
          cleanParts.length >= 2
            ? cleanParts.join(", ")
            : data.display_name.split(",").slice(0, 4).join(", ").trim()
      } else {
        resolvedAddress = `Garage Facility Hub (${pointerLat.toFixed(4)}, ${pointerLng.toFixed(4)})`
      }

      setCurrentLat(pointerLat)
      setCurrentLng(pointerLng)
      setCurrentAddress(resolvedAddress)
      setHasUnsavedPin(false)

      if (onLocationChange) {
        onLocationChange(pointerLat, pointerLng, resolvedAddress)
      }

      setSaveSuccessMsg(`✓ Saved! Address set to: ${resolvedAddress}`)
      setTimeout(() => setSaveSuccessMsg(""), 4500)
    } catch {
      const fallback = `Garage Facility (${pointerLat.toFixed(4)}, ${pointerLng.toFixed(4)})`
      setCurrentLat(pointerLat)
      setCurrentLng(pointerLng)
      setCurrentAddress(fallback)
      setHasUnsavedPin(false)

      if (onLocationChange) {
        onLocationChange(pointerLat, pointerLng, fallback)
      }

      setSaveSuccessMsg(`✓ Saved GPS: ${pointerLat.toFixed(4)}, ${pointerLng.toFixed(4)}`)
      setTimeout(() => setSaveSuccessMsg(""), 4500)
    } finally {
      setIsSavingLocation(false)
    }
  }

  // Pre-configured garage bay selector
  const PRESET_HUBS = [
    {
      name: "Main Garage Facility - Bay 1",
      address: "100 Industrial Parkway, Bay 1",
      lat: 17.4646,
      lng: 78.3582,
      bay: "Bay 1",
    },
    {
      name: "Main Garage Facility - Bay 2",
      address: "100 Industrial Parkway, Bay 2",
      lat: 17.465,
      lng: 78.3588,
      bay: "Bay 2",
    },
    {
      name: "Vehicle Inspection & Prep Bay",
      address: "100 Industrial Parkway, Bay 3",
      lat: 17.464,
      lng: 78.3575,
      bay: "Prep Bay",
    },
    {
      name: "Customer Handoff Stall",
      address: "100 Industrial Parkway, Front Lot",
      lat: 17.4635,
      lng: 78.359,
      bay: "Stall A",
    },
  ]

  const handleSelectPreset = (hub: (typeof PRESET_HUBS)[0]) => {
    setCurrentLat(hub.lat)
    setCurrentLng(hub.lng)
    setPointerLat(hub.lat)
    setPointerLng(hub.lng)
    setCurrentAddress(hub.address)
    setHasUnsavedPin(false)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 16, {
        duration: 0.85,
        easeLinearity: 0.25,
      })
      setZoomLevel(16)
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([hub.lat, hub.lng])
    }
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
          setCurrentLat(userLat)
          setCurrentLng(userLng)
          setPointerLat(userLat)
          setPointerLng(userLng)
          setHasUnsavedPin(true)

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([userLat, userLng], 16, {
              duration: 0.85,
              easeLinearity: 0.25,
            })
            setZoomLevel(16)
          }
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([userLat, userLng])
          }

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`,
            )
            const data = await res.json()
            if (data && data.display_name) {
              const addr = data.address || {}
              const road = addr.road || addr.street || addr.pedestrian || ""
              const suburb = addr.suburb || addr.neighbourhood || addr.residential || ""
              const city = addr.city || addr.town || addr.municipality || addr.county || ""
              const state = addr.state || ""
              const postcode = addr.postcode || ""
              const cleanParts = [road, suburb, city, state, postcode].filter(Boolean)
              const resolved =
                cleanParts.length >= 2
                  ? cleanParts.join(", ")
                  : data.display_name.split(",").slice(0, 4).join(", ").trim()
              setCurrentAddress(resolved)
              if (onLocationChange) onLocationChange(userLat, userLng, resolved)
              setHasUnsavedPin(false)
            }
          } catch {}
        } else {
          const dist = computeDistanceMiles(userLat, userLng, currentLat, currentLng)
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

  // Search Address on Map with smooth flyTo
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
        const formatted = first.display_name.split(",").slice(0, 4).join(", ").trim()

        setCurrentLat(searchedLat)
        setCurrentLng(searchedLng)
        setPointerLat(searchedLat)
        setPointerLng(searchedLng)
        setCurrentAddress(formatted)
        setHasUnsavedPin(false)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([searchedLat, searchedLng], 16, {
            duration: 0.9,
            easeLinearity: 0.25,
          })
          setZoomLevel(16)
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([searchedLat, searchedLng])
        }

        if (onLocationChange) onLocationChange(searchedLat, searchedLng, formatted)
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
    pointerLng - 0.008
  }%2C${pointerLat - 0.006}%2C${pointerLng + 0.008}%2C${
    pointerLat + 0.006
  }&layer=mapnik&marker=${pointerLat}%2C${pointerLng}`

  const effectiveHeight = isExpanded ? "480px" : height

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200/90 bg-white shadow-xs flex flex-col font-sans transition-all">
      {/* Map Header with Address & Action Controls */}
      <div className="p-3.5 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0 border border-orange-500/20">
            <LocationIcon size={16} />
          </div>
          <div className="truncate">
            <h4 className="font-bold text-stone-900 truncate text-xs">{garageName}</h4>
            <p className="text-[11px] text-stone-500 truncate font-mono">{currentAddress}</p>
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
        <div className="px-3.5 py-2.5 bg-stone-100/90 border-b border-stone-200 space-y-2">
          <form onSubmit={handleSearchAddress} className="flex items-center gap-2">
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

          {/* CRITICAL: Explicit "OK, Save This Pointer Location & Address" Action Card */}
          <div
            data-testid="save-pointer-banner"
            className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 transition-all ${
              hasUnsavedPin
                ? "bg-amber-50 border-amber-300 shadow-xs ring-2 ring-amber-400/30"
                : "bg-white border-stone-200"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  hasUnsavedPin ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                }`}
              />
              <div className="truncate">
                <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>📍 Pointer GPS:</span>
                  <span className="font-mono text-[#F97316]">
                    {pointerLat.toFixed(5)}, {pointerLng.toFixed(5)}
                  </span>
                  {hasUnsavedPin && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white">
                      New Pin Position
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  Drag the map pointer or click anywhere on the map, then click the button to save
                  this address.
                </p>
              </div>
            </div>

            <button
              id="save-pointer-address-btn"
              type="button"
              onClick={handleSavePointerLocation}
              disabled={isSavingLocation}
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                hasUnsavedPin
                  ? "bg-[#F97316] hover:bg-orange-600 text-white ring-2 ring-orange-400 animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <CheckIcon size={14} />
              <span>
                {isSavingLocation ? "Saving Address..." : "OK, Save This Pointer Address & GPS"}
              </span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckIcon size={14} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC SMOOTH ZOOM & LONG-POINTS NAVIGATION TOOLBAR */}
      <div className="px-3.5 py-2 bg-stone-50/95 border-b border-stone-200/90 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
        {/* Left: Dynamic Smooth Zoom Controls & Slider */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center bg-white rounded-lg border border-stone-200 shadow-2xs p-0.5">
            <button
              id="smooth-zoom-out-btn"
              type="button"
              onClick={() => handleSmoothZoom(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-100 text-stone-700 font-black text-sm transition cursor-pointer"
              title="Smooth Zoom Out (-1x)"
            >
              −
            </button>
            <span className="px-2 font-mono text-xs font-bold text-stone-800 min-w-[34px] text-center">
              {zoomLevel}x
            </span>
            <button
              id="smooth-zoom-in-btn"
              type="button"
              onClick={() => handleSmoothZoom(1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-100 text-stone-700 font-black text-sm transition cursor-pointer"
              title="Smooth Zoom In (+1x)"
            >
              +
            </button>
          </div>

          {/* Smooth Slider */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400">3x</span>
            <input
              id="map-zoom-slider"
              type="range"
              min="4"
              max="19"
              step="1"
              value={zoomLevel}
              onChange={(e) => handleSetZoomLevel(Number(e.target.value))}
              className="w-20 md:w-28 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#F97316]"
              title={`Drag to dynamically zoom between 4x and 19x (Current: ${zoomLevel}x)`}
            />
            <span className="text-[10px] font-bold text-stone-400">19x</span>
          </div>

          {/* Strategic Quick Zoom Presets for Long Points & Distances */}
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="text-stone-400 uppercase tracking-wider text-[9px] mr-0.5">
              Jump:
            </span>
            <button
              type="button"
              onClick={() => handleSetZoomLevel(8)}
              className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                zoomLevel === 8
                  ? "bg-[#F97316] text-white border-[#F97316]"
                  : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200"
              }`}
              title="Zoom out to region to view long point distances"
            >
              🌍 Region (8x)
            </button>
            <button
              type="button"
              onClick={() => handleSetZoomLevel(12)}
              className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                zoomLevel === 12
                  ? "bg-[#F97316] text-white border-[#F97316]"
                  : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200"
              }`}
              title="Zoom to metropolitan city layout"
            >
              🏙️ City (12x)
            </button>
            <button
              type="button"
              onClick={() => handleSetZoomLevel(15)}
              className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                zoomLevel === 15
                  ? "bg-[#F97316] text-white border-[#F97316]"
                  : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200"
              }`}
              title="Neighborhood sector view"
            >
              📍 Area (15x)
            </button>
            <button
              type="button"
              onClick={() => handleSetZoomLevel(18)}
              className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                zoomLevel === 18
                  ? "bg-[#F97316] text-white border-[#F97316]"
                  : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200"
              }`}
              title="Detailed parking bay / garage stall view"
            >
              🏢 Stall (18x)
            </button>
          </div>
        </div>

        {/* Right: Recenter on Pin, Long Points Overview & Height Expand Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            id="recenter-pin-btn"
            type="button"
            onClick={handleRecenterPin}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 hover:text-[#F97316] text-stone-700 border border-stone-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Smoothly center map back onto garage pointer pin"
          >
            <span>🎯 Center Pin</span>
          </button>
          <button
            id="overview-long-points-btn"
            type="button"
            onClick={handleOverviewLongPoints}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-600 text-stone-700 border border-stone-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Zoom out smoothly to see all distant long points and routes"
          >
            <span>🌐 Overview</span>
          </button>
          <button
            id="toggle-map-expand-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 shadow-2xs cursor-pointer ${
              isExpanded
                ? "bg-[#17191C] text-white border-black"
                : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
            }`}
            title={isExpanded ? "Collapse map height back to default" : "Expand map canvas to 480px for wide area navigation"}
          >
            <span>{isExpanded ? "⤡ Compact" : "⤢ Expand Map"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Visual */}
      <div className="relative w-full bg-stone-100 transition-all duration-300" style={{ height: effectiveHeight }}>
        {/* Leaflet map container div with enabled scroll wheel */}
        <div ref={mapContainerRef} className="w-full h-full relative z-10" />

        {/* Fallback iframe container if Leaflet is loading */}
        {!leafletReady && (
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
        )}

        {/* Floating Quick Action Overlay on Map (Always Accessible) */}
        {isEditable && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#17191C]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-white/20 text-xs pointer-events-auto">
            <span className="text-amber-400 font-bold">📍 Pointer:</span>
            <span className="font-mono text-[11px]">
              {pointerLat.toFixed(4)}, {pointerLng.toFixed(4)}
            </span>
            <button
              type="button"
              onClick={handleSavePointerLocation}
              disabled={isSavingLocation}
              className="ml-1 px-2.5 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[10px] shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <CheckIcon size={11} />
              <span>{isSavingLocation ? "Saving..." : "Save Address"}</span>
            </button>
          </div>
        )}

        {/* Dynamic Zoom & Gesture Badge Tooltip */}
        <div className="absolute top-2 right-2 z-20 bg-[#17191C]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono border border-white/10 pointer-events-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Mouse Wheel &amp; Smooth Zoom Active ({zoomLevel}x)</span>
        </div>

        {/* Coordinates Overlay */}
        <div className="absolute bottom-2 left-2 z-20 bg-[#17191C]/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono border border-white/10 pointer-events-none flex items-center gap-2">
          <span>
            GPS: {pointerLat.toFixed(4)}, {pointerLng.toFixed(4)}
          </span>
          <span className="text-orange-400 font-bold">• STAGED</span>
        </div>
      </div>
    </div>
  )
}
