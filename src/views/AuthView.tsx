import React, { useState, useEffect } from "react"
import type { CustomerUser } from "../types"
import { api } from "../services/api"
import {
  ShieldIcon,
  UserIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  CarIcon,
  LockIcon,
} from "../components/Icons"

interface AuthViewProps {
  initialTab?: "customer" | "admin"
  initialMode?: "signin" | "register"
  onSuccess: (role: "customer" | "admin", user?: CustomerUser) => void
  onNavigateHome: () => void
  onNavigateListing?: () => void
}

export default function AuthView({
  initialTab = "customer",
  initialMode = "signin",
  onSuccess,
  onNavigateHome,
  onNavigateListing,
}: AuthViewProps) {
  // Active primary tab: "customer" vs "admin"
  const [activeTab, setActiveTab] = useState<"customer" | "admin">(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Customer mode: "signin" vs "register"
  const [customerMode, setCustomerMode] = useState<"signin" | "register">(
    initialMode,
  )

  // Form Fields - Customer
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [licenseNum, setLicenseNum] = useState("")
  const [licenseState, setLicenseState] = useState("FL")
  const [licenseExpiry, setLicenseExpiry] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Form Fields - Admin
  const [adminAuthType, setAdminAuthType] =
    useState<"passcode" | "credentials">("passcode")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminEmail, setAdminEmail] = useState("admin@motorly.com")

  // States
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)

  // Calculate Password Strength for Registration
  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }

  const passStrength = getPasswordStrength(password)

  // 1-Click Quick Demo Login Helper
  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("pass123")
    setErrorMessage(null)
    setIsLoading(true)
    try {
      const res = await api.loginCustomer({
        email: demoEmail,
        password: "pass123",
      })
      if (res.success && res.user) {
        setSuccessMessage(
          `Welcome back, ${res.user.name}! Authenticating JWT...`,
        )
        setTimeout(() => onSuccess("customer", res.user), 600)
      } else {
        setErrorMessage(res.message || "Failed to log in with demo account.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Customer Submit (Login or Register)
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (customerMode === "register") {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name.")
        return
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.")
        return
      }
      if (!agreeTerms) {
        setErrorMessage("Please accept the terms of service to continue.")
        return
      }
    }

    setIsLoading(true)

    try {
      if (customerMode === "signin") {
        const res = await api.loginCustomer({ email, password })
        if (res.success && res.user) {
          setSuccessMessage("Authentication successful! Redirecting...")
          setTimeout(() => onSuccess("customer", res.user), 500)
        } else {
          setErrorMessage(res.message || "Invalid email or password.")
        }
      } else {
        const res = await api.registerCustomer({
          email,
          password,
          name,
          phone,
          driverLicenseNum: licenseNum,
          driverLicenseState: licenseState,
          driverLicenseExpiry: licenseExpiry,
        })
        if (res.success && res.user) {
          setSuccessMessage("Account created successfully! Redirecting...")
          setTimeout(() => onSuccess("customer", res.user), 600)
        } else {
          setErrorMessage(res.message || "Registration failed.")
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Admin Submit
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const emailToPass =
        adminAuthType === "credentials" ? adminEmail : undefined
      const res = await api.adminLogin(adminPassword, emailToPass)
      if (res.success) {
        setSuccessMessage(
          "Administrator privileges verified! Loading fleet console...",
        )
        setTimeout(() => onSuccess("admin"), 500)
      } else {
        setErrorMessage(res.message || "Invalid administrator credentials.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate administrator.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full border-b border-stone-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div
          onClick={onNavigateHome}
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
          <span className="text-xl font-extrabold tracking-tight text-[#17191C] font-heading">
            MOTORLY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>256-Bit SSL &bull; Supabase Live</span>
          </div>
          <button
            onClick={onNavigateHome}
            className="text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Hero & Benefits Showcase (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-700 text-xs font-extrabold uppercase tracking-wider">
                <SparklesIcon size={14} className="text-orange-600" />
                <span>Garage Fleet Portal</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-stone-900 tracking-tight font-heading leading-tight">
                Simple, Honest Vehicle Rentals.
              </h1>
              <p className="text-stone-600 text-base leading-relaxed">
                Sign in to manage your bookings, track request status, and
                arrange direct vehicle pickups with the garage manager.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <CarIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Guaranteed Exact Models
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Drive the exact vehicle you reserved. No downgrade
                    substitutions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    High-Security Cryptographic JWT
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    State-of-the-art bcrypt password encryption & role
                    separation for customers and admins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Direct Garage Pickup
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Vehicle inspection and personal key handoff directly at the
                    garage bay.
                  </p>
                </div>
              </div>
            </div>

            {/* VIP Testimonial */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white space-y-2 shadow-lg">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                {"★".repeat(5)}
              </div>
              <p className="text-xs text-stone-200 italic leading-relaxed">
                "MOTORLY makes luxury car rental effortless. I stepped off my
                flight at MIA, walked to Bay 14, and drove off in my Porsche in
                3 minutes."
              </p>
              <div className="text-[11px] font-semibold text-stone-400">
                &mdash; Marcus Vance, Executive Member
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="w-full lg:col-span-7 max-w-xl mx-auto">
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
              {/* Primary Role Switcher (Customer vs Admin) */}
              <div className="p-2 bg-stone-100 border-b border-stone-200/80 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("customer")
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "customer"
                      ? "bg-white text-stone-900 shadow-sm border border-stone-200/60"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <UserIcon
                    size={16}
                    className={
                      activeTab === "customer" ? "text-orange-500" : ""
                    }
                  />
                  <span>Customer Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin")
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "admin"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <ShieldIcon
                    size={16}
                    className={activeTab === "admin" ? "text-orange-400" : ""}
                  />
                  <span>Fleet Operations</span>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-9 space-y-6">
                {/* Status Messages */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-shake">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 flex items-center justify-center font-bold text-xs shrink-0">
                      !
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                    <CheckIcon
                      size={18}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* =========================================================
                    CUSTOMER TAB (Sign In vs Create Account)
                   ========================================================= */}
                {activeTab === "customer" && (
                  <div className="space-y-6">
                    {/* Customer Mode Segment (Sign In / Register) */}
                    <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-heading">
                          {customerMode === "signin"
                            ? "Welcome Back"
                            : "Create Customer Account"}
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {customerMode === "signin"
                            ? "Sign in with your email and password to access bookings."
                            : "Register in 30 seconds for preferred rates and instant reservations."}
                        </p>
                      </div>

                      <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode("signin")
                            setErrorMessage(null)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            customerMode === "signin"
                              ? "bg-white text-stone-900 shadow-xs"
                              : "text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode("register")
                            setErrorMessage(null)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            customerMode === "register"
                              ? "bg-white text-stone-900 shadow-xs"
                              : "text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          Register
                        </button>
                      </div>
                    </div>

                    {/* Customer Form */}
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      {/* Name & Phone for Registration */}
                      {customerMode === "register" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Alex Mercer"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 (305) 555-0199"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                            />
                          </div>
                        </div>
                      )}

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                        />
                      </div>

                      {/* Password with Show/Hide toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-stone-700">
                            Password *
                          </label>
                          {customerMode === "signin" && (
                            <button
                              type="button"
                              onClick={() => setShowForgotModal(true)}
                              className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={
                              customerMode === "signin"
                                ? "••••••••"
                                : "At least 6 characters"
                            }
                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold select-none"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>

                        {/* Interactive Password Strength Indicator for Registration */}
                        {customerMode === "register" && password.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1.5 h-1.5">
                              <div
                                className={`flex-1 h-full rounded-full transition-all ${
                                  passStrength >= 1
                                    ? "bg-red-500"
                                    : "bg-stone-200"
                                }`}
                              />
                              <div
                                className={`flex-1 h-full rounded-full transition-all ${
                                  passStrength >= 2
                                    ? "bg-amber-500"
                                    : "bg-stone-200"
                                }`}
                              />
                              <div
                                className={`flex-1 h-full rounded-full transition-all ${
                                  passStrength >= 3
                                    ? "bg-emerald-500"
                                    : "bg-stone-200"
                                }`}
                              />
                              <div
                                className={`flex-1 h-full rounded-full transition-all ${
                                  passStrength >= 4
                                    ? "bg-emerald-600"
                                    : "bg-stone-200"
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-stone-500 font-medium">
                              {passStrength <= 1
                                ? "Too short or simple"
                                : passStrength === 2
                                  ? "Fair strength"
                                  : passStrength === 3
                                    ? "Good security"
                                    : "Strong password"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Optional Driver License Section for Registration */}
                      {customerMode === "register" && (
                        <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900">
                              Driver's License (Optional)
                            </span>
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                              Faster Pickup
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={licenseNum}
                              onChange={(e) => setLicenseNum(e.target.value)}
                              placeholder="License # (e.g. F9021884)"
                              className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="text"
                              value={licenseState}
                              onChange={(e) => setLicenseState(e.target.value)}
                              placeholder="State (e.g. FL)"
                              className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      )}

                      {/* Remember Me / Terms Checkboxes */}
                      <div className="flex items-center justify-between pt-1">
                        {customerMode === "signin" ? (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="text-xs text-stone-600 font-medium">
                              Keep me signed in
                            </span>
                          </label>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={agreeTerms}
                              onChange={(e) => setAgreeTerms(e.target.checked)}
                              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="text-xs text-stone-600 font-medium">
                              I agree to the rental terms &amp; conditions
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Primary Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-sm"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>
                              {customerMode === "signin"
                                ? "Sign In with JWT"
                                : "Create Account & Sign In"}
                            </span>
                            <ArrowRightIcon size={16} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* 1-Click Demo Accounts Pill Bar */}
                    {customerMode === "signin" && (
                      <div className="pt-4 border-t border-stone-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase tracking-wider">
                          <span>⚡ 1-Click Demo Logins</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            Preloaded Profiles
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickDemoLogin("john.doe@email.com")
                            }
                            className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-500 bg-stone-50 hover:bg-orange-50/50 text-left transition flex flex-col justify-center"
                          >
                            <span className="text-xs font-bold text-stone-900">
                              John Doe
                            </span>
                            <span className="text-[10px] text-amber-600 font-mono">
                              Gold Member
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuickDemoLogin("david.c@techventure.io")
                            }
                            className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-500 bg-stone-50 hover:bg-orange-50/50 text-left transition flex flex-col justify-center"
                          >
                            <span className="text-xs font-bold text-stone-900">
                              David Chen
                            </span>
                            <span className="text-[10px] text-purple-600 font-mono">
                              VIP Executive
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuickDemoLogin("sarah.m@vipclient.com")
                            }
                            className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-500 bg-stone-50 hover:bg-orange-50/50 text-left transition flex flex-col justify-center"
                          >
                            <span className="text-xs font-bold text-stone-900">
                              Sarah Miller
                            </span>
                            <span className="text-[10px] text-blue-600 font-mono">
                              VIP Client
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    ADMINISTRATOR TAB (Fleet Operations Console)
                   ========================================================= */}
                {activeTab === "admin" && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-2 border border-stone-800 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldIcon size={18} className="text-orange-400" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                            Operational Authority
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                          Role: Administrator
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black tracking-tight font-heading">
                        Garage Manager Command Center
                      </h3>
                      <p className="text-xs text-stone-400 leading-relaxed">
                        Access is restricted to authorized garage managers.
                        Cryptographic JWT token will be generated for your
                        authenticated administrative session.
                      </p>
                    </div>

                    {/* Mode Toggle for Admin (Passcode vs Credentials) */}
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setAdminAuthType("passcode")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          adminAuthType === "passcode"
                            ? "bg-white text-stone-900 shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        Fleet Passcode
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminAuthType("credentials")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          adminAuthType === "credentials"
                            ? "bg-white text-stone-900 shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        Enterprise Admin Login
                      </button>
                    </div>

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                      {adminAuthType === "credentials" && (
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            Administrator Email
                          </label>
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@motorly.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-stone-700">
                            {adminAuthType === "passcode"
                              ? "Master Security Passcode *"
                              : "Admin Password *"}
                          </label>
                          <span className="text-[11px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-bold">
                            Default: 0709
                          </span>
                        </div>
                        <input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter 0709 or admin password"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50 font-mono tracking-wider"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-stone-900 hover:bg-black text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer text-sm"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <LockIcon size={16} className="text-orange-400" />
                            <span>Authorize &amp; Launch Fleet Console</span>
                            <ArrowRightIcon size={16} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                      Looking for customer bookings? Switch to the{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("customer")}
                        className="text-orange-600 font-bold hover:underline"
                      >
                        Customer Access
                      </button>{" "}
                      tab.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative border border-stone-200">
            <button
              onClick={() => {
                setShowForgotModal(false)
                setForgotSent(false)
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <LockIcon size={24} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-stone-900 font-heading">
                Reset Account Password
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Enter your account email to receive a secure password reset link
                and verification code.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-1">
                <div>
                  ✓ Password reset instructions sent to{" "}
                  <strong>{forgotEmail}</strong>.
                </div>
                <div className="text-[11px] text-emerald-600 font-normal">
                  For portfolio demo accounts, default password is{" "}
                  <code>pass123</code>.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (forgotEmail) setForgotSent(true)
                }}
                className="space-y-4"
              >
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer minimal info */}
      <footer className="w-full border-t border-stone-200/60 py-6 px-4 text-center text-xs text-stone-400">
        &copy; 2026 MOTORLY Car Rental Systems. All rights reserved. Encrypted
        with HMAC-SHA256 &amp; Supabase PostgreSQL.
      </footer>
    </div>
  )
}
