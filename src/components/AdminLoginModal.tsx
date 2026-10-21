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
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

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
        setError(res.message || "Incorrect password. Backend password is 0709.")
      }
    } catch {
      setError("Network error connecting to backend.")
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative space-y-6 my-auto border border-stone-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto shadow-inner border border-orange-100">
            <ShieldIcon size={28} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-[#F97316] text-[10px] font-bold uppercase tracking-wider">
            Protected Area
          </span>
          <h3 className="text-2xl font-extrabold text-[#17191C] font-heading">
            Fleet Operations Login
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Enter the backend authorization password to access fleet inventory,
            vehicle mating, and telemetry.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">
                Backend Password
              </label>
              <span className="text-[11px] font-mono text-[#F97316] bg-orange-50 px-2 py-0.5 rounded font-bold">
                Pass: 0709
              </span>
            </div>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-200 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Unlock Admin Panel</span>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
