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
  LockIcon,
  ShieldIcon,
  KeyIcon,
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

  // Security & Password Management State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.trim().length < 4) {
      setPasswordError("New passcode must be at least 4 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passcode and confirmation do not match.")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword)
      if (res.success) {
        setPasswordSuccess(res.message || "Admin master passcode updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        onShowToast("Admin master passcode updated successfully!")
      } else {
        setPasswordError(res.message || "Failed to update admin passcode.")
      }
    } catch (err: any) {
      setPasswordError(err.message || "Network error updating admin passcode.")
    } finally {
      setIsUpdatingPassword(false)
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

      {/* Console Security & Master Admin Passcode Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <LockIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Console Security &amp; Master Admin Passcode</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage authorization credentials to unlock the Fleet Operations Dispatch Console.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-flex items-center gap-1.5 self-start sm:self-center">
            <ShieldIcon size={12} className="text-emerald-600" />
            Salted Bcrypt (10 rounds) + JWT
          </span>
        </div>

        {/* Active Account Overview */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Active Administrator Identity
            </span>
            <span className="font-bold text-stone-900 font-mono">admin@pitstopcarhire.com</span>
            <span className="text-stone-500 ml-2">(Master Fleet Director)</span>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Active Access Method
            </span>
            <span className="text-stone-700 font-mono text-[11px]">Passcode Entry / JWT 24h Session</span>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckIcon size={14} className="text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Passcode */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Current Passcode *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="e.g. 0709"
                  className="w-full h-9 pl-3 pr-12 text-xs font-mono bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-[11px] font-semibold cursor-pointer"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Passcode */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                New Passcode *
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 4 characters"
                  className="w-full h-9 pl-3 pr-12 text-xs font-mono bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-[11px] font-semibold cursor-pointer"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Passcode */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Confirm Passcode *
              </label>
              <input
                type={showNew ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new passcode"
                className="w-full h-9 px-3 text-xs font-mono bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-stone-400 font-mono">
              Default factory passcode: <strong className="text-stone-600">0709</strong>
            </span>
            <button
              type="submit"
              disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              <KeyIcon size={14} className="text-orange-400" />
              <span>{isUpdatingPassword ? "Updating Passcode..." : "Update Master Passcode"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
