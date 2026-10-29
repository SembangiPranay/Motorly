import React, { useState } from "react"
import type { ViewMode, CustomerUser } from "../types"
import { api } from "../services/api"
import {
  ArrowRightIcon,
  UserIcon,
  ShieldIcon,
  LocationIcon,
  HeadsetIcon,
  SparklesIcon,
} from "./Icons"

interface HeaderProps {
  currentView: ViewMode
  onNavigate: (view: ViewMode) => void
  currentUser?: CustomerUser | null
  setCurrentUser?: (user: CustomerUser | null) => void
  compareCount?: number
  onLogoutCustomer?: () => void
  isAdminAuthenticated?: boolean
  onToggleSidebar?: () => void
}

export default function Header({
  currentView,
  onNavigate,
  currentUser,
  setCurrentUser,
  compareCount = 0,
  onLogoutCustomer,
  isAdminAuthenticated = false,
  onToggleSidebar,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authName, setAuthName] = useState("")
  const [authPhone, setAuthPhone] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsSubmittingAuth(true)
    try {
      if (authTab === "signin") {
        const res = await api.loginCustomer({
          email: authEmail,
          password: authPassword,
        })
        if (res.success && res.user) {
          if (setCurrentUser) setCurrentUser(res.user)
          setShowSignInModal(false)
          onNavigate("my-bookings")
        } else {
          setAuthError(res.message || "Invalid credentials.")
        }
      } else {
        const res = await api.registerCustomer({
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
        })
        if (res.success && res.user) {
          if (setCurrentUser) setCurrentUser(res.user)
          setShowSignInModal(false)
          onNavigate("my-bookings")
        } else {
          setAuthError(res.message || "Registration failed.")
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Network error.")
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  return (
    <>
      <header className="w-full bg-[#FAF7F2] transition-colors border-b border-gray-200/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <div
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0 mr-2 sm:mr-4 lg:mr-6"
          >
            {/* Ribbon M Logo */}
            <div className="w-7 h-6 relative flex items-end">
              <svg viewBox="0 0 28 24" fill="none" className="w-full h-full">
                <path
                  d="M2 22L7.5 3L11.5 13L15.5 3L21 22H16.5L14 11L11.5 17.5L9 11L6.5 22H2Z"
                  fill="#F97316"
                />
                <path d="M21 22L26 5L24 22H21Z" fill="#EA580C" opacity="0.8" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#17191C] font-heading">
              MOTORLY
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-7 text-sm font-medium">
            <button
              onClick={() => onNavigate("home")}
              className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
                currentView === "home"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("listing")}
              className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
                currentView === "listing"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              Fleet &amp; Cars
            </button>
            <button
              onClick={() => onNavigate("compare")}
              className={`transition-colors pb-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentView === "compare"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              <span>Compare</span>
              {compareCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-mono text-[10px] font-bold">
                  {compareCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate("my-bookings")}
              className={`transition-colors pb-1 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentView === "my-bookings"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              <span>My Trips</span>
              {currentUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => {
                onNavigate("home")
                setTimeout(() => {
                  const el = document.getElementById("how-it-works")
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }, 100)
              }}
              className="hidden xl:inline-block text-gray-700 hover:text-[#F97316] transition-colors pb-1 cursor-pointer whitespace-nowrap"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate("about")}
              className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
                currentView === "about"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              About
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
                currentView === "contact"
                  ? "text-[#F97316] font-semibold border-b-2 border-[#F97316]"
                  : "text-gray-700 hover:text-[#F97316]"
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action Elements */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {isAdminAuthenticated && (
              <button
                onClick={() => onNavigate("admin")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  currentView === "admin"
                    ? "bg-[#17191C] text-white border-[#17191C]"
                    : "bg-stone-900 hover:bg-black text-white border-stone-800 shadow-xs"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Admin Console</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("my-bookings")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:border-orange-500 shadow-xs transition cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                    {(currentUser.name || "U").charAt(0)}
                  </div>
                  <span>{(currentUser.name || "User").split(" ")[0]}</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                    {currentUser.vipTier || "Member"}
                  </span>
                </button>
                <button
                  onClick={onLogoutCustomer}
                  className="text-xs text-stone-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="flex items-center gap-2 text-sm font-semibold text-[#17191C] hover:text-[#F97316] transition-colors cursor-pointer"
              >
                <UserIcon size={18} className="text-gray-700" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onNavigate("listing")}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 group cursor-pointer whitespace-nowrap"
            >
              <span>Book a Car</span>
              <ArrowRightIcon
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-[#FAF7F2] px-4 pt-3 pb-5 space-y-3 animate-fade-in">
            <button
              onClick={() => {
                onNavigate("home")
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left py-2 font-medium text-gray-700"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate("listing")
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left py-2 font-medium text-gray-700"
            >
              Fleet &amp; Cars
            </button>
            <button
              onClick={() => {
                onNavigate("compare")
                setMobileMenuOpen(false)
              }}
              className="w-full text-left py-2 font-medium text-gray-700 flex items-center justify-between"
            >
              <span>Compare Vehicles</span>
              {compareCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-mono text-xs font-bold">
                  {compareCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                onNavigate("my-bookings")
                setMobileMenuOpen(false)
              }}
              className="w-full text-left py-2 font-medium text-gray-700 flex items-center justify-between"
            >
              <span>My Trips &amp; Reservations</span>
              {currentUser && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => {
                onNavigate("about")
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left py-2 font-medium text-gray-700"
            >
              About MOTORLY
            </button>
            <button
              onClick={() => {
                onNavigate("contact")
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left py-2 font-medium text-gray-700"
            >
              Contact Owner
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  onNavigate("admin")
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left py-2 font-bold text-[#F97316]"
              >
                ⚙️ Fleet Admin Portal
              </button>
            )}
            <div className="pt-2 flex flex-col gap-2">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900 leading-tight">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-100 font-mono font-bold px-2 py-0.5 rounded">
                      {currentUser.vipTier || "Member"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onLogoutCustomer) onLogoutCustomer()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full h-11 text-center font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onNavigate("auth")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full h-11 text-center font-bold text-xs border border-gray-300 rounded-xl bg-white text-stone-800 hover:bg-stone-50 transition shadow-xs"
                >
                  Sign In / Customer Portal
                </button>
              )}
              <button
                onClick={() => {
                  onNavigate("listing")
                  setMobileMenuOpen(false)
                }}
                className="w-full h-11 text-center font-bold text-xs text-white bg-[#F97316] hover:bg-[#EA580C] rounded-xl shadow-md transition"
              >
                Book a Car Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Sign In / Account Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-gray-100">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-extrabold text-base">
                M
              </div>
              <span className="font-heading font-extrabold text-xl">
                MOTORLY Account
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setAuthTab("signin")}
                className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                  authTab === "signin"
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-gray-400"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthTab("register")}
                className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                  authTab === "register"
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-gray-400"
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {authError}
              </div>
            )}

            {/* Quick Demo Autofill chips */}
            {authTab === "signin" && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  ⚡ 1-Click Demo Logins:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail("john.doe@email.com")
                      setAuthPassword("pass123")
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-stone-200 text-[11px] font-medium text-stone-700 hover:border-orange-500 transition"
                  >
                    John Doe (Gold)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail("david.c@techventure.io")
                      setAuthPassword("pass123")
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-stone-200 text-[11px] font-medium text-stone-700 hover:border-orange-500 transition"
                  >
                    David Chen (VIP)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authTab === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl shadow-md transition-all text-xs disabled:opacity-60"
              >
                {isSubmittingAuth
                  ? "Verifying Account..."
                  : authTab === "signin"
                    ? "Sign In & Access Bookings"
                    : "Register & Get 15% Off"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* About Garage Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-gray-100">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                ABOUT OUR GARAGE
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#17191C] font-heading">
              Local Garage Fleet &amp; Vehicle Rentals
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We maintain an inspected, clean fleet of vehicles directly from
              our garage. We believe in transparent rates, honest vehicle
              maintenance, and a simple reservation process without hidden fees
              or corporate gimmicks.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-[#F97316]">Direct Garage Pickup</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Personal vehicle inspection and key handoff upon arrival.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-[#F97316]">Transparent Rates</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Clear daily rates and pay-on-pickup with zero online surprise
                  fees.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAboutModal(false)
                onNavigate("listing")
              }}
              className="w-full py-3 bg-[#17191C] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow"
            >
              Explore Garage Fleet
            </button>
          </div>
        </div>
      )}

      {/* Contact Garage Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-gray-100">
            <button
              onClick={() => {
                setShowContactModal(false)
                setContactSuccess(false)
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                GARAGE CONTACT
              </span>
              <h3 className="text-2xl font-extrabold text-[#17191C] font-heading mt-1">
                Contact Garage Manager
              </h3>
            </div>

            {contactSuccess ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-2 animate-fade-in">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                  ✓
                </div>
                <h4 className="font-bold text-sm text-green-800">
                  Message Received
                </h4>
                <p className="text-xs text-green-700">
                  The garage manager will respond to your inquiry shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setContactSuccess(true)
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(555) 123-4567 or email@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    How can we assist you?
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Questions about vehicle availability, specific dates, or pickup times..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-xs shadow-md transition-all"
                  >
                    Send Message to Manager
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                <HeadsetIcon size={14} className="text-[#F97316]" /> Direct
                Line: (555) 123-4567
              </span>
              <span>Garage Service &amp; Maintenance Bay</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
