import React from "react"
import {
  BellIcon,
  SearchIcon,
  PhoneIcon,
  GlobeIcon,
  LogOutIcon,
} from "../../components/Icons"

interface AdminTopHeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  notificationsCount: number
  onOpenNotifications: () => void
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onOpenMobileMenu?: () => void
}

export default function AdminTopHeader({
  searchQuery,
  onSearchChange,
  notificationsCount,
  onOpenNotifications,
  onExitAdmin,
  onLogoutAdmin,
  isCollapsed = false,
  onToggleCollapse,
  onOpenMobileMenu,
}: AdminTopHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-stone-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shrink-0 shadow-2xs">
      {/* Left: Collapse toggle / Mobile Menu & Search Input */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        {/* Mobile Hamburger Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            aria-label="Open navigation sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Desktop Collapse / Expand Button in Header */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
        )}

        {/* Global Search Input */}
        <div className="relative flex-1">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookings, license plates, customers..."
            className="w-full h-8 pl-8 pr-7 text-xs font-medium bg-stone-50 hover:bg-stone-100/70 focus:bg-white rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative h-8 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition"
          title="Open Notifications"
        >
          <BellIcon size={14} className="text-stone-600" />
          <span className="hidden sm:inline">Alerts</span>
          {notificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-black">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Support Phone */}
        <a
          href="tel:5550199922"
          className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
          title="Call Direct Support"
        >
          <PhoneIcon size={13} className="text-emerald-600" />
          <span>(555) 019-9922</span>
        </a>

        {/* Storefront Link */}
        <button
          type="button"
          onClick={onExitAdmin}
          className="h-8 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center gap-1"
          title="Return to Public Site"
        >
          <GlobeIcon size={13} />
          <span className="hidden sm:inline">Storefront</span>
        </button>

        {/* Sign Out */}
        {onLogoutAdmin && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Do you want to log out of the admin console?")) {
                onLogoutAdmin()
              }
            }}
            className="h-8 px-2 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1"
            title="Log Out"
          >
            <LogOutIcon size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  )
}
