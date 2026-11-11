import React from "react"
import {
  CalendarIcon,
  CarIcon,
  TagIcon,
  UserIcon,
  WrenchIcon,
  SettingsIcon,
  ZapIcon,
  BellIcon,
  FileTextIcon,
  LogOutIcon,
  PhoneIcon,
  GlobeIcon,
} from "../../components/Icons"
import { PIT_STOP_F1_PATH } from "../../components/PitStopLogo"

export type AdminTab =
  | "manifest"
  | "notifications"
  | "completed"
  | "fleet"
  | "walkin"
  | "promos"
  | "crm"
  | "maintenance"
  | "settings"

interface AdminSidebarProps {
  activeTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  ordersCount: number
  notificationsCount: number
  fleetCount: number
  promosCount: number
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  ordersCount,
  notificationsCount,
  fleetCount,
  promosCount,
  onExitAdmin,
  onLogoutAdmin,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const navItems = [
    {
      id: "manifest" as AdminTab,
      label: "Orders & Dispatch",
      icon: CalendarIcon,
      badge: ordersCount > 0 ? ordersCount : null,
      badgeColor: "bg-emerald-600 text-white",
    },
    {
      id: "notifications" as AdminTab,
      label: "Notifications",
      icon: BellIcon,
      badge: notificationsCount > 0 ? notificationsCount : null,
      badgeColor: "bg-amber-600 text-white",
    },
    {
      id: "completed" as AdminTab,
      label: "Completed & Invoices",
      icon: FileTextIcon,
    },
    {
      id: "fleet" as AdminTab,
      label: "Fleet & Inventory",
      icon: CarIcon,
      badge: fleetCount > 0 ? fleetCount : null,
      badgeColor: "bg-stone-700 text-stone-200",
    },
    {
      id: "walkin" as AdminTab,
      label: "Walk-In Counter",
      icon: ZapIcon,
      chip: "Fast",
    },
    {
      id: "promos" as AdminTab,
      label: "Privileges & Coupons",
      icon: TagIcon,
      badge: promosCount > 0 ? promosCount : null,
      badgeColor: "bg-stone-700 text-stone-200",
    },
    {
      id: "crm" as AdminTab,
      label: "Customers & Drivers",
      icon: UserIcon,
    },
    {
      id: "maintenance" as AdminTab,
      label: "Vehicle Maintenance",
      icon: WrenchIcon,
    },
    {
      id: "settings" as AdminTab,
      label: "Studio Settings",
      icon: SettingsIcon,
    },
  ]

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab)
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20 h-screen bg-[#141619] text-stone-200 flex flex-col justify-between shrink-0 border-r border-stone-800 select-none transition-all duration-200 ease-in-out ${
          isCollapsed ? "w-16" : "w-60 lg:w-64"
        } ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 p-3 border-b border-stone-800/80 flex items-center justify-between shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-2.5 truncate"}`}>
            <div className="w-10 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-[#F97316] flex items-center justify-center p-1 shrink-0">
              <svg viewBox="5.8 13.7 174.5 51.0" fill="currentColor" fillRule="evenodd" className="w-full h-full">
                <path d={PIT_STOP_F1_PATH} />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-sm tracking-tight">PIT STOP CAR HIRE</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Mgarr</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">Studio Director</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition"
              title="Collapse Sidebar"
            >
              <span className="font-mono font-bold text-xs">«</span>
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            title="Close Menu"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Menu (Independent scroll with min-h-0) */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto min-h-0">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Console Pages
            </div>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full group relative flex items-center ${
                  isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                } rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/70"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} truncate`}>
                  <Icon
                    size={16}
                    className={`shrink-0 ${isActive ? "text-white" : "text-stone-400 group-hover:text-stone-200"}`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    {item.chip && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {item.chip}
                      </span>
                    )}
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? "bg-white text-orange-950 font-black" : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Floating Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl border border-stone-800 transition flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-2.5 border-t border-stone-800/80 bg-[#101214] shrink-0 space-y-1.5">
          {!isCollapsed ? (
            <>
              <a
                href="tel:+35699827192"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-stone-800/40 hover:bg-stone-800 text-stone-300 text-xs font-medium transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <PhoneIcon size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">+356 9982 7192</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-bold shrink-0">24/7</span>
              </a>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={onExitAdmin}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition"
                  title="View Public Storefront"
                >
                  <GlobeIcon size={12} />
                  <span>Storefront</span>
                </button>

                {onLogoutAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Do you want to log out of the admin console?")) {
                        onLogoutAdmin()
                      }
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium transition"
                    title="Sign Out"
                  >
                    <LogOutIcon size={12} />
                    <span>Exit</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              {/* Expand button when collapsed */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                title="Expand Sidebar"
              >
                <span className="font-mono font-bold text-sm">»</span>
              </button>

              <button
                type="button"
                onClick={onExitAdmin}
                className="w-10 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
                title="Public Storefront"
              >
                <GlobeIcon size={15} />
              </button>

              {onLogoutAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Do you want to log out of the admin console?")) {
                      onLogoutAdmin()
                    }
                  }}
                  className="w-10 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/40 transition"
                  title="Sign Out"
                >
                  <LogOutIcon size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
