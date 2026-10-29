import React from "react"
import type { ViewMode, CustomerUser } from "../types"
import { UserIcon } from "./Icons"

interface CustomerSidebarProps {
  currentView: ViewMode
  onNavigate: (view: ViewMode) => void
  currentUser?: CustomerUser | null
  onLogoutCustomer?: () => void
  compareCount?: number
  activeBookingsCount?: number
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export default function CustomerSidebar({
  currentView,
  onNavigate,
  currentUser,
  onLogoutCustomer,
  compareCount = 0,
  activeBookingsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: CustomerSidebarProps) {
  const navPortals = [
    {
      id: "home" as ViewMode,
      label: "Home Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "listing" as ViewMode,
      label: "Fleet Catalog",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 19H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2zM9 9h6M9 13h6" />
        </svg>
      ),
    },
    {
      id: "compare" as ViewMode,
      label: "Compare Vehicles",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 12h12l3-12H3zM9 10h6" />
        </svg>
      ),
      badge: compareCount > 0 ? compareCount : undefined,
    },
    {
      id: "my-bookings" as ViewMode,
      label: "My Reservations",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
    },
    {
      id: "about" as ViewMode,
      label: "About MOTORLY",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "contact" as ViewMode,
      label: "Direct Contact",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
  ]

  const handleItemClick = (view: ViewMode) => {
    onNavigate(view)
    if (onCloseMobile) onCloseMobile()
  }

  const sidebarBody = (
    <div className="h-full flex flex-col justify-between p-5 bg-white/95 backdrop-blur-md">
      {/* Top Branding */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60">
          <div
            onClick={() => handleItemClick("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-7 h-6 relative flex items-end">
              <svg viewBox="0 0 28 24" fill="none" className="w-full h-full">
                <path
                  d="M2 22L7.5 3L11.5 13L15.5 3L21 22H16.5L14 11L11.5 17.5L9 11L6.5 22H2Z"
                  fill="#F97316"
                />
                <path d="M21 22L26 5L24 22H21Z" fill="#EA580C" opacity="0.8" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#17191C] font-heading block leading-none">
                MOTORLY
              </span>
              <span className="text-[9px] font-light tracking-[0.22em] uppercase text-stone-400 block mt-1">
                Direct Garage
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Portals Navigation Only */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 px-3 mb-2">
            Portals
          </p>
          {navPortals.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#17191C] text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? "text-[#F97316]" : "text-stone-400"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? "bg-[#F97316] text-white" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Super-Clean Bottom Area */}
      <div className="pt-4 border-t border-stone-200/60 space-y-3">
        {currentUser ? (
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {(currentUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-stone-800 text-xs truncate">
                  {(currentUser.name || "User").split(" ")[0]}
                </p>
                <p className="text-[10px] font-light text-stone-400 truncate">
                  {currentUser.vipTier || "Member"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogoutCustomer}
              className="text-[11px] text-stone-400 hover:text-red-600 transition cursor-pointer font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleItemClick("auth")}
            className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center justify-center gap-2 border border-stone-200/70 transition cursor-pointer"
          >
            <UserIcon size={14} className="text-stone-400" />
            <span>Sign In</span>
          </button>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "/admin")
              }
              onNavigate("admin")
              if (onCloseMobile) onCloseMobile()
            }}
            className="text-[10px] text-stone-400 hover:text-stone-700 transition cursor-pointer font-light tracking-wide inline-flex items-center gap-1"
          >
            <span>Manager Portal</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Minimal Sidebar */}
      <aside className="hidden lg:block w-60 bg-white border-r border-stone-200/60 fixed inset-y-0 left-0 z-30">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-fade-in flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-64 max-w-[80vw] h-full bg-white shadow-2xl relative animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  )
}
