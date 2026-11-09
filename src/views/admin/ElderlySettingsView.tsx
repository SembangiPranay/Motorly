import React, { useState, useEffect } from "react"
import { api } from "../../services/api"
import GarageMapViewer from "../../components/GarageMapViewer"
import {
  PhoneIcon,
  MailIcon,
  LocationIcon,
  CheckIcon,
  LogOutIcon,
  WhatsAppIcon,
  ShieldIcon,
} from "../../components/Icons"
import { openWhatsAppDirect } from "../../utils/whatsapp"

interface ElderlySettingsViewProps {
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  onShowToast: (message: string) => void
}

export default function ElderlySettingsView({
  onExitAdmin,
  onLogoutAdmin,
  onShowToast,
}: ElderlySettingsViewProps) {
  const [garageName, setGarageName] = useState("MOTORLY Central Garage")
  const [phone, setPhone] = useState("+1 (555) 019-9922")
  const [email, setEmail] = useState("support@motorly.com")
  const [address, setAddress] = useState("4200 NW 21st St, Miami, FL 33142")
  const [lat, setLat] = useState(25.7959)
  const [lng, setLng] = useState(-80.287)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadSettings() {
      try {
        const data = await api.getSettings()
        if (mounted && data) {
          if (data.company_name) setGarageName(data.company_name)
          if (data.company_phone) setPhone(data.company_phone)
          if (data.company_email) setEmail(data.company_email)
          if (data.hub_address) setAddress(data.hub_address)
          if (data.hub_lat) setLat(Number(data.hub_lat))
          if (data.hub_lng) setLng(Number(data.hub_lng))
        }
      } catch (err) {
        console.warn("[ElderlySettingsView] Could not load backend settings:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadSettings()
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.updateSettingsBatch({
        company_name: garageName,
        company_phone: phone,
        company_email: email,
        hub_address: address,
        hub_lat: lat,
        hub_lng: lng,
      })
      await api.syncHubLocation(address, undefined, lat, lng)
      onShowToast("Garage details saved successfully!")
    } catch (err: any) {
      alert("Failed to save settings: " + (err?.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const handleSignOutClick = () => {
    const confirmed = window.confirm("Are you sure you want to sign out of the Admin Console?")
    if (confirmed && onLogoutAdmin) {
      onLogoutAdmin()
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-800 text-sm font-bold tracking-wide uppercase mb-2">
          Settings & Assistance
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Garage Settings & Phone Support
        </h1>
        <p className="text-stone-500 font-medium text-lg mt-1">
          Update your garage contact information or get immediate phone assistance.
        </p>
      </div>

      {/* Support Card for Senior Managers */}
      <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-black uppercase tracking-wider">
              24/7 Human Phone Support
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
              Need Help With Any Booking?
            </h2>
            <p className="text-emerald-800 text-base font-medium">
              Motorly support agents are available around the clock to assist garage owners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:5550199922"
              className="px-6 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg transition flex items-center gap-3 shadow-md min-h-[56px]"
            >
              <PhoneIcon size={22} />
              <span>Call (555) 019-9922</span>
            </a>

            <button
              type="button"
              onClick={() =>
                openWhatsAppDirect(
                  "15550199922",
                  "Hello Motorly Support, I need assistance with my garage console."
                )
              }
              className="px-6 py-4 rounded-2xl bg-white hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 font-bold text-lg transition flex items-center gap-3 min-h-[56px]"
            >
              <WhatsAppIcon size={22} className="text-emerald-600" />
              <span>WhatsApp Us</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <h2 className="text-2xl font-black text-stone-900 border-b-2 border-stone-100 pb-4">
          Garage Details
        </h2>

        {/* Garage Name */}
        <div>
          <label
            htmlFor="setting-garage-name"
            className="block text-stone-900 font-bold text-lg mb-1"
          >
            Garage or Hub Name
          </label>
          <input
            id="setting-garage-name"
            type="text"
            required
            value={garageName}
            onChange={(e) => setGarageName(e.target.value)}
            className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-600"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="setting-phone"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Garage Phone / WhatsApp
            </label>
            <input
              id="setting-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-email"
              className="block text-stone-900 font-bold text-lg mb-1"
            >
              Contact Email
            </label>
            <input
              id="setting-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-600"
            />
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <label
            htmlFor="setting-address"
            className="block text-stone-900 font-bold text-lg mb-1"
          >
            Street Address
          </label>
          <input
            id="setting-address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xl font-bold px-5 py-4 bg-stone-50 rounded-2xl border-2 border-stone-300 text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-600"
          />
        </div>

        {/* Interactive Map */}
        <div className="pt-2">
          <label className="block text-stone-900 font-bold text-lg mb-2">
            Garage Map Location
          </label>
          <div className="rounded-2xl overflow-hidden border-2 border-stone-200">
            <GarageMapViewer
              garageName={garageName}
              garageAddress={address}
              lat={lat}
              lng={lng}
              isEditable={true}
              onLocationChange={(newLat, newLng, newAddr) => {
                setLat(newLat)
                setLng(newLng)
                if (newAddr) setAddress(newAddr)
              }}
              height="280px"
            />
          </div>
          <p className="text-sm text-stone-500 font-medium mt-2">
            Tip: You can drag the pin on the map to accurately place your garage building.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 min-h-[56px] disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Details...</span>
            ) : (
              <>
                <CheckIcon size={24} />
                <span>Save Garage Details</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Account Navigation / Sign Out */}
      <div className="bg-stone-100 rounded-3xl p-6 sm:p-8 border-2 border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-stone-900">
            Exit or Switch Account
          </h3>
          <p className="text-stone-500 text-base font-medium">
            You can return to the customer car catalog or log out completely.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onExitAdmin}
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white hover:bg-stone-200 text-stone-800 font-bold text-base transition border border-stone-300 min-h-[52px]"
          >
            Back to Website
          </button>

          {onLogoutAdmin && (
            <button
              type="button"
              onClick={handleSignOutClick}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-base transition shadow min-h-[52px] flex items-center justify-center gap-2"
            >
              <LogOutIcon size={20} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
