import React, { useState } from "react"
import { createPortal } from "react-dom"
import { api } from "../services/api"
import { ShieldIcon, LockIcon } from "./Icons"

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [authMethod, setAuthMethod] = useState<"gmail" | "passcode">("gmail")
  const [gmailInput, setGmailInput] = useState("nanikoushik96@gmail.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.adminGoogleLogin(gmailInput.trim())
      if (res.success) {
        onSuccess()
      } else {
        setError(res.message || "Unauthorized Gmail account. Access denied.")
      }
    } catch {
      setError("Network error connecting to fleet authorization server.")
    } finally {
      setLoading(false)
    }
  }

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
        setError(res.message || "Invalid administrator passcode. Access denied.")
      }
    } catch {
      setError("Network error connecting to backend.")
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#141619] text-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-6 my-auto border border-stone-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-white p-1.5 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldIcon size={24} />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            Fleet Operations Console
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
            Admin Authentication
          </h3>
          <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            Verify administrator identity to access fleet telemetry, reservations, and dispatch.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
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

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Method 1: Google / Gmail Authentication Form */}
        {authMethod === "gmail" && (
          <form onSubmit={handleGmailSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-300">
                  Authorized Admin Gmail
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Google Verified
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !gmailInput.trim()}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
                  </svg>
                  <span>Authenticate with Google</span>
                </>
              )}
            </button>
          </form>
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
                  Bcrypt Salted
                </span>
              </div>
              <input
                type="password"
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator passcode"
                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LockIcon size={16} />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
