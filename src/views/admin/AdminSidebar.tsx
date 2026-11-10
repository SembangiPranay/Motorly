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
  isMobileOpen?: boolean
  onCloseMobile?: () => void
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
  isMobileOpen = false,
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
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 w-64 bg-[#141619] text-stone-200 flex flex-col shrink-0 border-r border-stone-800 select-none h-screen transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-base shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-tight">MOTORLY</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Atelier</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Studio Director</span>
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Console Navigation
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon size={15} className={isActive ? "text-white" : "text-stone-400"} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
              </button>
            )
          })}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-3 border-t border-stone-800/80 space-y-1.5 bg-[#101214]">
          <a
            href="tel:5550199922"
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-stone-800/40 hover:bg-stone-800 text-stone-300 text-xs font-medium transition"
          >
            <div className="flex items-center gap-2">
              <PhoneIcon size={13} className="text-emerald-400" />
              <span>(555) 019-9922</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-bold">24/7</span>
          </a>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onExitAdmin}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition"
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
        </div>
      </aside>
    </>
  )
}
