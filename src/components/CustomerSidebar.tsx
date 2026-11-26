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
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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
  isCollapsed = false,
  onToggleCollapse,
}: CustomerSidebarProps) {
  const navPortals = [
    {
      id: "home" as ViewMode,
      label: "Home Overview",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "listing" as ViewMode,
      label: "Fleet Catalog",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 19H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2zM9 9h6M9 13h6"
          />
        </svg>
      ),
    },
    {
      id: "compare" as ViewMode,
      label: "Compare Vehicles",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6l3 12h12l3-12H3zM9 10h6"
          />
        </svg>
      ),
      badge: compareCount > 0 ? compareCount : undefined,
    },
    {
      id: "my-bookings" as ViewMode,
      label: "My Reservations",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      badge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
    },
    {
      id: "about" as ViewMode,
      label: "About Pit Stop Car Hire",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "contact" as ViewMode,
      label: "Direct Contact",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
    },
  ]

  const handleItemClick = (view: ViewMode) => {
    onNavigate(view)
    if (onCloseMobile) onCloseMobile()
  }

  const renderContent = (collapsed: boolean) => (
    <div className="h-full flex flex-col justify-between bg-[#141619] text-stone-200 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-14 p-3 border-b border-stone-800/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              if (collapsed && onToggleCollapse) {
                onToggleCollapse()
              } else {
                handleItemClick("home")
              }
            }}
            className={`flex items-center text-left ${
              collapsed
                ? "justify-center w-full cursor-pointer hover:opacity-90 group focus:outline-hidden"
                : "gap-2.5 truncate cursor-pointer group"
            }`}
            title={collapsed ? "Tap to fully expand sidebar" : "Pit Stop Car Hire Home Overview"}
            aria-label={collapsed ? "Expand sidebar" : "Pit Stop Car Hire"}
          >
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
              PS
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-sm tracking-tight">PIT STOP</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Mgarr</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">Fleet Customer Portal</span>
                </div>
              </div>
            )}
          </button>

          {/* Desktop Collapse Button */}
          {!collapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <span className="font-mono font-bold text-xs">«</span>
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer transition"
              title="Close Menu"
              aria-label="Close Menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Portals Navigation Section */}
        <div className="p-3 space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 px-3 mb-2 font-mono">
              Portals
            </p>
          )}
          {navPortals.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  collapsed
                    ? "justify-center px-0 py-2.5 relative group"
                    : "justify-between px-3.5 py-2.5 font-medium"
                } ${
                  isActive
                    ? "bg-orange-600 text-white font-semibold shadow-xs"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/80"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <span
                    className={`${
                      isActive ? "text-white" : "text-stone-400 group-hover:text-white"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-orange-500" />
                )}

                {/* Floating tooltip on hover when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                    {item.label}
                    {item.badge !== undefined ? ` (${item.badge})` : ""}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Super-Clean Bottom Profile / Sign In Area */}
      <div className="p-3 border-t border-stone-800/80">
        {currentUser ? (
          collapsed ? (
            <div
              className="flex justify-center group relative cursor-pointer"
              onClick={() => handleItemClick("my-bookings")}
              title={`${currentUser.name || "User"} (${currentUser.vipTier || "Member"})`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs hover:border-orange-500 transition-colors">
                {(currentUser.name || currentUser.firstName || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {currentUser.name || "User"} &bull; {currentUser.vipTier || "Member"}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60 border border-stone-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                  {(currentUser.name || currentUser.firstName || currentUser.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-200 text-xs truncate">
                    {(currentUser.name || "User").split(" ")[0]}
                  </p>
                  <p className="text-[10px] font-mono text-stone-400 truncate">
                    {currentUser.vipTier || "Member"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogoutCustomer}
                className="text-[11px] text-stone-400 hover:text-red-400 transition cursor-pointer font-medium"
              >
                Logout
              </button>
            </div>
          )
        ) : collapsed ? (
          <button
            type="button"
            onClick={() => handleItemClick("auth")}
            className="w-full py-2.5 flex items-center justify-center rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition cursor-pointer group relative"
            title="Sign In"
          >
            <UserIcon size={16} />
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-stone-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Sign In
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleItemClick("auth")}
            className="w-full py-2 px-3 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 border border-stone-700 transition cursor-pointer"
          >
            <UserIcon size={14} className="text-stone-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar with Collapsible Rail */}
      <aside
        className={`hidden lg:block bg-[#141619] border-r border-stone-800 fixed inset-y-0 left-0 z-30 transition-all duration-200 ease-in-out ${
          isCollapsed ? "w-16" : "w-60 lg:w-64"
        }`}
      >
        {renderContent(isCollapsed)}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-64 max-w-[80vw] h-full bg-[#141619] border-r border-stone-800 shadow-2xl relative animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  )
}
