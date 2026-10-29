import React, { useState } from "react"
import type { ViewMode, VehicleType, CustomerUser } from "../types"
import {
  CarIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  ClockIcon,
  LocationIcon,
  ArrowRightIcon,
} from "./Icons"

interface CustomerSidebarProps {
  currentView: ViewMode
  onNavigate: (view: ViewMode) => void
  onSelectCategory?: (category: VehicleType | "All") => void
  onSelectDuration?: (duration: "Hourly" | "Daily" | "Weekly" | "Monthly") => void
  selectedDuration?: "Hourly" | "Daily" | "Weekly" | "Monthly"
  selectedCategory?: string
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
  onSelectCategory,
  onSelectDuration,
  selectedDuration = "Daily",
  selectedCategory = "All",
  currentUser,
  onLogoutCustomer,
  compareCount = 0,
  activeBookingsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: CustomerSidebarProps) {
  const categories: { label: string; type: VehicleType | "All"; icon: string }[] = [
    { label: "All Vehicles", type: "All", icon: "🏎️" },
    { label: "Sedans", type: "Sedan", icon: "🚗" },
    { label: "SUVs", type: "SUV", icon: "🚙" },
    { label: "Luxury", type: "Luxury", icon: "✨" },
    { label: "Electric", type: "Electric", icon: "⚡" },
    { label: "Economy", type: "Economy", icon: "🌱" },
  ]

  const rentalPlans = [
    {
      label: "Hourly Sprint",
      value: "Hourly" as const,
      badge: "Quick",
      desc: "3h - 8h errands",
    },
    {
      label: "Daily Standard",
      value: "Daily" as const,
      badge: "Popular",
      desc: "Flexible 24-hr",
    },
    {
      label: "Weekly Pass",
      value: "Weekly" as const,
      badge: "-15% Off",
      desc: "7+ days discount",
    },
    {
      label: "Monthly Flex",
      value: "Monthly" as const,
      badge: "Save 35%",
      desc: "30-day lease-free",
    },
  ]

  const navItems = [
    { id: "home" as ViewMode, label: "Home Overview", icon: "🏠" },
    { id: "listing" as ViewMode, label: "Fleet Catalog", icon: "🚗" },
    {
      id: "compare" as ViewMode,
      label: "Compare Vehicles",
      icon: "⚖️",
      badge: compareCount > 0 ? compareCount : undefined,
    },
    {
      id: "my-bookings" as ViewMode,
      label: "My Reservations",
      icon: "📋",
      badge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
    },
    { id: "about" as ViewMode, label: "About the Garage", icon: "👤" },
    { id: "contact" as ViewMode, label: "Direct Contact", icon: "📞" },
  ]

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view)
    if (onCloseMobile) onCloseMobile()
  }

  const handleCategoryClick = (cat: VehicleType | "All") => {
    if (onSelectCategory) {
      onSelectCategory(cat)
    }
    onNavigate("listing")
    if (onCloseMobile) onCloseMobile()
  }

  const handleDurationClick = (dur: "Hourly" | "Daily" | "Weekly" | "Monthly") => {
    if (onSelectDuration) {
      onSelectDuration(dur)
    }
    if (onCloseMobile) onCloseMobile()
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 overflow-y-auto selection:bg-orange-500 selection:text-white">
      {/* Top Header & Branding */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
          <div
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-7 relative flex items-end">
              <svg viewBox="0 0 28 24" fill="none" className="w-full h-full">
                <path
                  d="M2 22L7.5 3L11.5 13L15.5 3L21 22H16.5L14 11L11.5 17.5L9 11L6.5 22H2Z"
                  fill="#F97316"
                />
                <path d="M21 22L26 5L24 22H21Z" fill="#EA580C" opacity="0.8" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#17191C] font-heading block leading-none">
                MOTORLY
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400">
                Garage Fleet &bull; Bay 1
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl hover:bg-stone-200 text-stone-500 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick CTA */}
        <button
          type="button"
          onClick={() => handleNavClick("listing")}
          className="w-full py-2.5 px-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-extrabold flex items-center justify-between shadow-xs transition group cursor-pointer"
        >
          <span>Reserve a Car</span>
          <ArrowRightIcon size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Primary Navigation Links */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2 mb-1.5">
            Main Portal
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-[#17191C] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Vehicle Category Shortcuts */}
        <div className="space-y-1 pt-2 border-t border-stone-200/80">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Fleet Categories
            </span>
            <span className="text-[9px] text-stone-400 font-medium">Quick Filter</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleCategoryClick(cat.type)}
                className="flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold hover:bg-stone-100 text-stone-700 transition cursor-pointer border border-transparent hover:border-stone-200"
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rental Plans / Durations */}
        <div className="space-y-1.5 pt-2 border-t border-stone-200/80">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2 mb-1.5">
            Rental Tiers
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {rentalPlans.map((plan) => {
              const isSelected = selectedDuration === plan.value
              return (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => handleDurationClick(plan.value)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer border ${
                    isSelected
                      ? "bg-orange-50/80 border-orange-300 text-stone-900 font-bold shadow-2xs"
                      : "bg-white/60 border-stone-200/70 hover:bg-white text-stone-600"
                  }`}
                >
                  <div className="text-left">
                    <span className="block font-bold">{plan.label}</span>
                    <span className="text-[10px] text-stone-400 block">{plan.desc}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                      isSelected
                        ? "bg-[#F97316] text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom User Profile Card & Footer Info */}
      <div className="pt-4 border-t border-stone-200/80 space-y-3">
        {currentUser ? (
          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                {(currentUser.name || "U").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-stone-500 font-mono truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                {currentUser.vipTier || "Member"}
              </span>
              <button
                type="button"
                onClick={onLogoutCustomer}
                className="text-stone-400 hover:text-red-600 transition cursor-pointer font-semibold text-[10px]"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleNavClick("auth")}
            className="w-full py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserIcon size={14} className="text-stone-600" />
            <span>Customer Sign In</span>
          </button>
        )}

        {/* Discreet Staff Portal Entry */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => handleNavClick("admin")}
            className="text-[10px] font-mono text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            Manager Passcode Access &rarr;
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar (fixed on left for desktop viewport) */}
      <aside className="hidden lg:block w-64 bg-white/90 backdrop-blur-md border-r border-stone-200/80 fixed inset-y-0 left-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#FAF7F2] shadow-2xl relative animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
