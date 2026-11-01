import React, { useState, useEffect } from "react"
import { WhatsAppIcon } from "./Icons"
import { openWhatsAppDirect } from "../utils/whatsapp"
import { api } from "../services/api"
import type { Car } from "../types"

interface WhatsAppSupportFABProps {
  activeCar?: Car | null
}

export default function WhatsAppSupportFAB({
  activeCar,
}: WhatsAppSupportFABProps) {
  const [adminPhone, setAdminPhone] = useState<string>("+91 77807 40223")
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    let isMounted = true
    api
      .getSettings()
      .then((res) => {
        if (isMounted && res?.contact_phone) {
          setAdminPhone(res.contact_phone)
        }
      })
      .catch(() => {
        // Fallback default retained
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const greeting = activeCar
      ? `Hello MOTORLY Studio Concierge, I am inquiring about reserving the ${activeCar.name} (${activeCar.year || 2024} ${activeCar.type || "Vehicle"}). Could you assist me with priority availability and booking?`
      : "Hello MOTORLY Studio Concierge, I would like to inquire about fleet availability and reserving a vehicle."

    openWhatsAppDirect(adminPhone, greeting)
  }

  return (
    <aside
      aria-label="WhatsApp Direct Customer Support"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 group select-none pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanding Label Pill (Desktop Hover) */}
      <div
        className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 text-white border border-stone-800 shadow-xl backdrop-blur-md transition-all duration-300 transform ${
          isHovered
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-2 pointer-events-none"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <div className="text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#25D366] font-bold leading-none">
            Direct Concierge
          </p>
          <p className="text-xs font-semibold text-stone-100 leading-tight mt-0.5">
            Chat with Studio Admin
          </p>
        </div>
      </div>

      {/* Main WhatsApp Floating Action Button */}
      <button
        type="button"
        onClick={handleOpenWhatsApp}
        aria-label="Contact Studio Admin on WhatsApp"
        title="Chat directly with Studio Admin on WhatsApp"
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-108 active:scale-95 cursor-pointer ring-4 ring-emerald-500/25 hover:ring-emerald-500/40"
      >
        {/* Pulsing online status micro-indicator */}
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-200 border-2 border-white rounded-full flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-ping" />
        </span>

        {/* Crisp Official WhatsApp SVG Icon */}
        <WhatsAppIcon size={26} className="text-white drop-shadow-sm" />
      </button>
    </aside>
  )
}
