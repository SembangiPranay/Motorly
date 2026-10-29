import React, { useState } from "react"
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
  initialMode = "signin",
  onSuccess,
  onNavigateHome,
  onNavigateListing,
}: AuthViewProps) {
  // Customer mode: "signin" vs "register"
  const [customerMode, setCustomerMode] = useState<"signin" | "register">(initialMode)

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
            <span>256-Bit SSL Encrypted</span>
          </div>
          <button
            onClick={onNavigateHome}
            className="text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
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
                <span>Customer Portal</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-stone-900 tracking-tight font-heading leading-tight">
                Simple, Honest Vehicle Rentals.
              </h1>
              <p className="text-stone-600 text-base leading-relaxed">
                Sign in to manage your reservations, track request status, and
                arrange direct vehicle pickups with your local garage.
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
                    Drive the exact vehicle you reserved. No downgrade substitutions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Secure JWT Authentication
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Cryptographic tokens and salted bcrypt password encryption.
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
                    Vehicle inspection and personal key handoff directly at the garage bay.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Testimonial */}
            <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-2 shadow-lg">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                {"★".repeat(5)}
              </div>
              <p className="text-xs text-stone-200 italic leading-relaxed">
                "MOTORLY makes car rental effortless. Reserved my vehicle online, walked to the garage, and drove off in minutes with zero paperwork delays."
              </p>
              <div className="text-[11px] font-semibold text-stone-400">
                &mdash; Verified Customer Review
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="w-full lg:col-span-7 max-w-xl mx-auto">
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
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
                    <CheckIcon size={18} className="text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Customer Mode Switcher (Sign In vs Register) */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-heading">
                      {customerMode === "signin" ? "Welcome Back" : "Create Account"}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold select-none cursor-pointer"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {/* Password Strength Indicator for Registration */}
                    {customerMode === "register" && password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 h-1.5">
                          <div
                            className={`flex-1 h-full rounded-full transition-all ${
                              passStrength >= 1 ? "bg-red-500" : "bg-stone-200"
                            }`}
                          />
                          <div
                            className={`flex-1 h-full rounded-full transition-all ${
                              passStrength >= 2 ? "bg-amber-500" : "bg-stone-200"
                            }`}
                          />
                          <div
                            className={`flex-1 h-full rounded-full transition-all ${
                              passStrength >= 3 ? "bg-emerald-500" : "bg-stone-200"
                            }`}
                          />
                          <div
                            className={`flex-1 h-full rounded-full transition-all ${
                              passStrength >= 4 ? "bg-emerald-600" : "bg-stone-200"
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
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
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
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
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
                            ? "Sign In"
                            : "Create Account & Sign In"}
                        </span>
                        <ArrowRightIcon size={16} />
                      </>
                    )}
                  </button>
                </form>
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
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition cursor-pointer"
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
                Enter your account email to receive password reset instructions.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-1">
                <div>
                  ✓ Password reset instructions sent to <strong>{forgotEmail}</strong>.
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
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
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
        &copy; 2026 MOTORLY Car Rental Systems. All rights reserved.
      </footer>
    </div>
  )
}
