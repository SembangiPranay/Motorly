import React, { useState, useEffect } from "react"
import { api } from "../../services/api"
import GarageMapViewer from "../../components/GarageMapViewer"
import {
  PhoneIcon,
  MailIcon,
  LocationIcon,
  CheckIcon,
  GlobeIcon,
  LogOutIcon,
} from "../../components/Icons"

interface AdminSettingsViewProps {
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  onShowToast: (message: string) => void
}

export default function AdminSettingsView({
  onExitAdmin,
  onLogoutAdmin,
  onShowToast,
}: AdminSettingsViewProps) {
  const [companyName, setCompanyName] = useState("Pit Stop Central Garage (36 Triq Il-Kbira, Mgarr)")
  const [phone, setPhone] = useState("+1 (555) 019-9922")
  const [email, setEmail] = useState("rentals@pitstopcarhire.com")
  const [address, setAddress] = useState("4200 NW 21st St, Miami, FL 33142")
  const [lat, setLat] = useState(25.7959)
  const [lng, setLng] = useState(-80.287)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadSettings() {
      try {
        const data = await api.getSettings()
        if (mounted && data) {
          if (data.company_name) setCompanyName(data.company_name)
          if (data.company_phone) setPhone(data.company_phone)
          if (data.company_email) setEmail(data.company_email)
          if (data.hub_address) setAddress(data.hub_address)
          if (data.hub_lat) setLat(Number(data.hub_lat))
          if (data.hub_lng) setLng(Number(data.hub_lng))
        }
      } catch (err) {
        console.warn("[AdminSettingsView] Could not load backend settings:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadSettings()
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await api.updateSettingsBatch({
        company_name: companyName,
        company_phone: phone,
        company_email: email,
        hub_address: address,
        hub_lat: lat,
        hub_lng: lng,
      })
      await api.syncHubLocation(address, undefined, lat, lng).catch(() => {})
      onShowToast("Studio contact & hub settings updated successfully!")
    } catch (err: any) {
      alert("Failed to save settings: " + (err?.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Studio Contact & Operating Hub Settings
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure public dispatch phone lines, WhatsApp routing, and station coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:5550199922"
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition flex items-center gap-1.5"
          >
            <PhoneIcon size={13} className="text-emerald-600" />
            <span>Support Line: (555) 019-9922</span>
          </a>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Contact Information Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900">Contact & Communications</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              These details appear on generated customer invoices and WhatsApp templates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Studio / Hub Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Dispatch Phone (WhatsApp Enabled)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Operating Hub & GPS Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900">Garage Hub Location & Coordinates</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Physical address used for customer vehicle return routing and navigation.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-xs font-mono bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-xs font-mono bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Interactive Map Preview */}
          <div className="pt-2">
            <div className="h-56 rounded-xl overflow-hidden border border-stone-200">
              <GarageMapViewer
                garageAddress={address}
                lat={lat}
                lng={lng}
                isEditable={true}
                onLocationChange={(newLat, newLng, newAddress) => {
                  setLat(newLat)
                  setLng(newLng)
                  if (newAddress) setAddress(newAddress)
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <CheckIcon size={14} />
            <span>{isSaving ? "Saving Settings..." : "Save Settings Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
