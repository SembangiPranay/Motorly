import React, { useState } from "react"
import { api } from "../services/api"
import { ShieldIcon, LockIcon, ArrowRightIcon } from "./Icons"

interface AdminLoginGateProps {
  onSuccess: () => void
  onNavigateHome: () => void
}

export default function AdminLoginGate({
  onSuccess,
  onNavigateHome,
}: AdminLoginGateProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FDFBF7]">
      <div className="w-full max-w-md bg-stone-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-stone-800 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-stone-800 border border-stone-700 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldIcon size={32} />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-400 text-[10px] font-extrabold uppercase tracking-wider font-mono">
            Restricted Operational Area
          </div>
          <h2 className="text-2xl font-black tracking-tight font-heading">
            Fleet Operations Console
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
            Authorized fleet managers only. Enter the master security credential
            to decrypt telemetry and booking dispatch.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin passcode"
              className="w-full px-4 py-3 rounded-xl bg-stone-800/90 border border-stone-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-wider placeholder:text-stone-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
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
