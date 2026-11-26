import React, { useState } from "react"
import { api } from "../services/api"
import AdminGoogleSignIn, { googleSignInEnabled } from "./AdminGoogleSignIn"
import { ShieldIcon, LockIcon, ArrowRightIcon } from "./Icons"
import PitStopLogo from "./PitStopLogo"

interface AdminLoginGateProps {
  onSuccess: () => void
  onNavigateHome: () => void
}

export default function AdminLoginGate({
  onSuccess,
  onNavigateHome,
}: AdminLoginGateProps) {
  const [authMethod, setAuthMethod] = useState<"gmail" | "passcode">(googleSignInEnabled ? "gmail" : "passcode")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.adminLogin(password)
      if (res.success) {
        setPassword("")
        onSuccess()
      } else {
        setError(
          res.message || "Invalid administrator credentials. Access denied.",
        )
      }
    } catch {
      setError("Network error connecting to fleet authorization server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#FAF7F2]">
      <div className="w-full max-w-md bg-[#141619] rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-stone-800 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center pb-1">
            <PitStopLogo size="lg" showText={false} variant="badge" theme="light" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-400 text-[10px] font-extrabold uppercase tracking-wider font-mono">
            Restricted Operational Console
          </div>
          <h2 className="text-2xl font-black tracking-tight font-heading">
            Admin Authentication
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
            Authorized fleet managers only. Authenticate with your administrator
            credentials to access live fleet telemetry and dispatch.
          </p>
        </div>

        {/* Tab Selection */}
        <div className={`grid ${googleSignInEnabled ? "grid-cols-2" : "grid-cols-1"} p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold`}>
          {googleSignInEnabled && (
          <button
            type="button"
            onClick={() => {
              setAuthMethod("gmail")
              setError(null)
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "gmail"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Gmail Auth</span>
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              setAuthMethod("passcode")
              setError(null)
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "passcode"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <LockIcon size={14} />
            <span>Master Passcode</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        {authMethod === "gmail" && (
          <AdminGoogleSignIn onSuccess={onSuccess} />
        )}

        {/* Method 2: Master Security Passcode */}
        {authMethod === "passcode" && (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-300">
                  Master Security Passcode
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Salted Bcrypt / HMAC-SHA256
                </span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator passcode"
                className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-wider placeholder:text-stone-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LockIcon size={16} />
                  <span>Authorize &amp; Unlock Console</span>
                  <ArrowRightIcon size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
          >
            &larr; Return to Customer Storefront
          </button>
        </div>
      </div>
    </div>
  )
}
