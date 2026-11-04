import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import type { BookingRecord, Car, CustomerUser } from "../types"
import { api } from "../services/api"
import {
  HomeIcon,
  CarIcon,
  CalendarIcon,
  LocationIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon,
  UserIcon,
  QrCodeIcon,
  ClockIcon,
  SparklesIcon,
  FileTextIcon,
  SearchIcon,
  StarIcon,
  ZapIcon,
  CameraIcon,
} from "../components/Icons"
import InvoiceModal from "../components/InvoiceModal"
import GarageMapViewer from "../components/GarageMapViewer"

interface MyBookingsViewProps {
  cars: Car[]
  currentUser: CustomerUser | null
  setCurrentUser: (user: CustomerUser | null) => void
  allBookings?: BookingRecord[]
  onBookingsChange?: (bookings: BookingRecord[]) => void
  onNavigateHome: () => void
  onNavigateListing: () => void
}

// Helper to detect if scheduled rental period has concluded (accounts for extensions)
function isBookingRentalPeriodConcluded(b: BookingRecord): boolean {
  if (b.status !== "Checked Out" && !b.keysHandedAt) return false
  let dateStr = b.returnDate || ""
  let returnTs = Date.parse(dateStr)
  if (isNaN(returnTs) && dateStr) {
    const cleaned = dateStr.replace(/([0-9]+)(st|nd|rd|th)/gi, "$1")
    returnTs = Date.parse(cleaned)
  }
  return !isNaN(returnTs) && returnTs > 0 && Date.now() >= returnTs
}

export default function MyBookingsView({
  cars,
  currentUser,
  setCurrentUser,
  allBookings,
  onBookingsChange,
  onNavigateHome,
  onNavigateListing,
}: MyBookingsViewProps) {
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<{
    booking: BookingRecord
    car: Car | undefined
  } | null>(null)

  // Flow F: Customer Extension Request Modal State
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)
  const [selectedBookingForExtension, setSelectedBookingForExtension] =
    useState<BookingRecord | null>(null)
  const [selectedGarageMapCar, setSelectedGarageMapCar] = useState<Car | null>(null)
  const [selectedCustomerInvoice, setSelectedCustomerInvoice] = useState<{
    booking: BookingRecord
    car?: Car
  } | null>(null)
  const [selectedInspectionBooking, setSelectedInspectionBooking] = useState<{
    booking: BookingRecord
    car?: Car
  } | null>(null)
  const [zoomedInspectionPhoto, setZoomedInspectionPhoto] = useState<{
    url: string
    title: string
  } | null>(null)
  const [extensionDuration, setExtensionDuration] = useState(1)
  const [extensionUnit, setExtensionUnit] =
    useState<"hours" | "days" | "months">("days")
  const [extensionReason, setExtensionReason] = useState("")
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false)

  // Auth toggle modal for guests
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [emailInput, setEmailInput] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  // Guest / Direct Booking Lookup State
  const [lookupIdInput, setLookupIdInput] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null)

  const handleLookupBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanId = lookupIdInput.trim()
    if (!cleanId) return
    setIsLookingUp(true)
    setLookupFeedback(null)
    try {
      const found = await api.lookupBooking(cleanId)
      if (found) {
        setBookings((prev) => {
          const exists = prev.some((b) => b.id === found.id)
          return exists ? prev : [found, ...prev]
        })
        showActionSuccess(`Reservation ${found.id} located successfully!`)
      } else {
        setLookupFeedback(
          `No reservation found for confirmation ID "${cleanId}".`,
        )
      }
    } catch {
      setLookupFeedback(
        "Error locating reservation. Please check confirmation code.",
      )
    } finally {
      setIsLookingUp(false)
    }
  }

  // Reviews & Feedback System State
  const [reviewsEnabled, setReviewsEnabled] = useState(true)
  const [myReviews, setMyReviews] = useState<any[]>([])
  const [reviewModalBooking, setReviewModalBooking] = useState<{
    booking: BookingRecord
    car?: Car
  } | null>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        if (typeof s?.reviews_enabled === "boolean") {
          setReviewsEnabled(s.reviews_enabled)
        }
      })
      .catch(() => {})

    api
      .getReviews()
      .then((revs) => {
        setMyReviews(revs || [])
      })
      .catch(() => {})
  }, [])

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewModalBooking) return
    const carId =
      reviewModalBooking.booking.matchedCarId ||
      reviewModalBooking.car?.id ||
      ""
    if (!carId) {
      alert("No vehicle paired with this booking to rate.")
      return
    }
    setIsSubmittingReview(true)
    try {
      const res = await api.submitReview({
        carId,
        bookingId: reviewModalBooking.booking.id,
        customerName:
          currentUser?.name ||
          `${reviewModalBooking.booking.customer.firstName} ${reviewModalBooking.booking.customer.lastName}`,
        customerEmail:
          currentUser?.email || reviewModalBooking.booking.customer.email,
        rating: ratingScore,
        comment: reviewComment,
      })
      if (res.success) {
        showActionSuccess(
          "Thank you! Your verified rating and review has been submitted.",
        )
        if (res.review) {
          setMyReviews((prev) => [res.review, ...prev])
        }
        setReviewModalBooking(null)
        setReviewComment("")
        setRatingScore(5)
      } else {
        alert(res.message || "Failed to submit review.")
      }
    } catch (err: any) {
      alert(err.message || "Error submitting review.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  useEffect(() => {
    ;(window as any).__setSelectedVoucher = setSelectedVoucher
    return () => {
      delete (window as any).__setSelectedVoucher
    }
  }, [])

  // Extension notification
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const showActionSuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 4500)
  }

  // Open Extension Modal
  const handleOpenExtensionModal = (b: BookingRecord) => {
    setSelectedBookingForExtension(b)
    setExtensionDuration(1)
    setExtensionUnit("days")
    setExtensionReason("")
    setIsExtensionModalOpen(true)
  }

  // Submit Extension Request to Admin
  const handleSubmitExtensionRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBookingForExtension) return
    setIsSubmittingExtension(true)
    try {
      const res = await api.requestExtension(selectedBookingForExtension.id, {
        extraDuration: Number(extensionDuration),
        unit: extensionUnit,
        customerNotes: extensionReason,
      })
      if (res.success) {
        setBookings((prev) => {
          const updated = prev.map((b) =>
            b.id === selectedBookingForExtension.id ? res.booking : b,
          )
          onBookingsChange?.(updated)
          return updated
        })
        setIsExtensionModalOpen(false)
        showActionSuccess(
          `Extension request (+${extensionDuration} ${extensionUnit}) submitted to garage manager! You will receive a quotation shortly.`,
        )
      }
    } catch (err: any) {
      alert("Failed to submit extension request: " + err.message)
    } finally {
      setIsSubmittingExtension(false)
    }
  }

  // Approve Admin Extension Quotation (Flow F)
  const handleApproveExtension = async (bookingId: string) => {
    try {
      const res = await api.approveExtension(bookingId)
      if (res.success) {
        setBookings((prev) => {
          const updated = prev.map((b) =>
            b.id === bookingId ? res.booking : b,
          )
          onBookingsChange?.(updated)
          return updated
        })
        showActionSuccess(
          "Extension approved! Quotation amount added to your bill and return date extended.",
        )
      }
    } catch (err: any) {
      alert("Failed to approve quotation: " + err.message)
    }
  }

  // Decline Admin Extension Quotation (Flow F)
  const handleDeclineExtension = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to decline this quotation?"))
      return
    try {
      const res = await api.declineExtension(bookingId, currentUser?.email)
      if (res.success) {
        setBookings((prev) => {
          const updated = prev.map((b) =>
            b.id === bookingId ? res.booking : b,
          )
          onBookingsChange?.(updated)
          return updated
        })
        showActionSuccess("Extension quotation declined.")
      }
    } catch (err: any) {
      alert("Failed to decline quotation: " + err.message)
    }
  }

  // Real-time polling to ensure customer immediately receives manager quotations without screen refresh
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible" && currentUser?.email) {
        api
          .getCustomerBookings(currentUser.email)
          .then((fresh) => {
            if (Array.isArray(fresh) && fresh.length > 0) {
              setBookings((prev) => {
                const prevSig = prev.map(b => `${b.id}-${b.status}-${b.extensionStatus}-${b.approvedByAdmin}-${b.totalAmount}`).join("|")
                const freshSig = fresh.map(b => `${b.id}-${b.status}-${b.extensionStatus}-${b.approvedByAdmin}-${b.totalAmount}`).join("|")
                if (prevSig !== freshSig) {
                  onBookingsChange?.(fresh)
                  return fresh
                }
                return prev
              })
            }
          })
          .catch(() => {})
      }
    }, 10000)
    return () => clearInterval(pollInterval)
  }, [currentUser?.email])

  // Fetch bookings when user changes, on mount, or when allBookings updates
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setErrorMsg(null)

      const getFallbackBookings = (userEmail: string, userId?: string) => {
        if (!allBookings || allBookings.length === 0) return []
        const clean = userEmail.trim().toLowerCase()
        return allBookings.filter(
          (b) =>
            (b.customer?.email &&
              b.customer.email.trim().toLowerCase() === clean) ||
            (userId && b.userId === userId),
        )
      }

      try {
        if (currentUser) {
          const userBookings = await api
            .getCustomerBookings(currentUser.email)
            .catch(() => [])
          if (userBookings && userBookings.length > 0) {
            setBookings(userBookings)
          } else {
            const fallback = getFallbackBookings(
              currentUser.email,
              currentUser.id,
            )
            setBookings(fallback)
          }
        } else {
          // If guest, try to read stored user
          const profile = await api.getCustomerProfile()
          if (profile) {
            setCurrentUser(profile)
            const userBookings = await api
              .getCustomerBookings(profile.email)
              .catch(() => [])
            if (userBookings && userBookings.length > 0) {
              setBookings(userBookings)
            } else {
              const fallback = getFallbackBookings(profile.email, profile.id)
              setBookings(fallback)
            }
          } else {
            setBookings([])
          }
        }
      } catch (err: any) {
        console.warn("My Bookings fetch:", err)
        if (currentUser) {
          const fallback = getFallbackBookings(
            currentUser.email,
            currentUser.id,
          )
          if (fallback.length > 0) {
            setBookings(fallback)
          } else {
            setErrorMsg(err.message || "Failed to load reservations.")
          }
        } else {
          setErrorMsg(err.message || "Failed to load reservations.")
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [currentUser?.email, currentUser?.id])

  // Customer Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsSubmittingAuth(true)
    try {
      const res = await api.loginCustomer({
        email: emailInput,
        password: passwordInput,
      })
      if (res.success && res.user) {
        setCurrentUser(res.user)
        const userBookings = await api.getCustomerBookings(res.user.email)
        setBookings(userBookings)
        showActionSuccess(`Welcome back, ${res.user.name}!`)
      } else {
        setAuthError(res.message || "Invalid credentials.")
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.")
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  // Customer Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsSubmittingAuth(true)
    try {
      const res = await api.registerCustomer({
        email: emailInput,
        password: passwordInput,
        name: nameInput,
        phone: phoneInput,
      })
      if (res.success && res.user) {
        setCurrentUser(res.user)
        setBookings([])
        showActionSuccess(
          `Account created! Welcome to MOTORLY, ${res.user.name}.`,
        )
      } else {
        setAuthError(res.message || "Registration failed.")
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to register.")
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  // Demo 1-Click Login
  const handleQuickDemoLogin = (email: string) => {
    setEmailInput(email)
    setPasswordInput("pass123")
  }

  // Logout Handler
  const handleLogout = () => {
    api.logoutCustomer()
    setCurrentUser(null)
    setBookings([])
    showActionSuccess("Logged out of customer portal.")
  }

  // Request 24hr extension
  const handleRequestExtension = async (bookingId: string) => {
    try {
      await api.updateBookingStatus(bookingId, {
        status: "Checked Out",
        notes: "Customer requested 24-hour extension. Approved by manager.",
      })
      showActionSuccess("Your 24-hour extension request was approved!")
      if (currentUser) {
        const fresh = await api.getCustomerBookings(currentUser.email)
        setBookings(fresh)
      }
    } catch (err: any) {
      alert("Failed to extend rental: " + err.message)
    }
  }

  // Cancel reservation
  const handleCancelReservation = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?"))
      return
    try {
      await api.updateBookingStatus(bookingId, {
        status: "Cancelled",
        notes: "Cancelled by customer self-service portal.",
      })
      showActionSuccess("Reservation cancelled successfully.")
      if (currentUser) {
        const fresh = await api.getCustomerBookings(currentUser.email)
        setBookings(fresh)
      }
    } catch (err: any) {
      alert("Failed to cancel: " + err.message)
    }
  }

  // Active bookings (Assigned or Checked Out or Pending)
  const activeBookings = bookings.filter(
    (b) =>
      b.status === "Pending Assignment" ||
      b.status === "Assigned" ||
      b.status === "Checked Out",
  )
  const pastBookings = bookings.filter(
    (b) =>
      b.status === "Returned" ||
      b.status === "Completed" ||
      b.status === "Cancelled",
  )

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Bar with Back to Home */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200/80">
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer group"
          >
            <HomeIcon
              size={16}
              className="text-orange-500 group-hover:scale-110 transition-transform"
            />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateListing}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold transition cursor-pointer"
            >
              <CarIcon size={14} />
              <span>Explore Fleet</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckIcon size={18} className="text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Customer Profile Banner */}
        {currentUser ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#17191C] to-stone-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {(currentUser.name || currentUser.firstName || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight">
                    {currentUser.name || `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.email}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <SparklesIcon size={12} className="text-amber-500" />
                    {currentUser.vipTier || "Standard"} Member
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-1 font-mono">
                  <span>{currentUser.email}</span>
                  {currentUser.phone && <span>• {currentUser.phone}</span>}
                  {currentUser.driverLicenseNum && (
                    <span>
                      • DL: {currentUser.driverLicenseNum} (
                      {currentUser.driverLicenseState || "USA"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={onNavigateHome}
                type="button"
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-sm font-semibold border border-stone-200 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <HomeIcon size={16} className="text-orange-500" />
                Home
              </button>
              <button
                onClick={onNavigateListing}
                className="px-4 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-orange-600 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CarIcon size={16} />
                Reserve Another Vehicle
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Guest Sign In / Lookup State */
          <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8 shadow-sm max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto mb-3">
                <UserIcon size={24} />
              </div>
              <h2 className="text-2xl font-black">
                Customer Self-Service Portal
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Sign in to manage live vehicle assignments, boarding vouchers,
                and extensions.
              </p>
            </div>

            {/* Direct Reservation Lookup Bar */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-2">
                Fast Reservation Lookup:
              </span>
              <form
                onSubmit={handleLookupBooking}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <SearchIcon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    value={lookupIdInput}
                    onChange={(e) => setLookupIdInput(e.target.value)}
                    placeholder="Enter Booking ID (e.g. MTR-852655)"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isLookingUp ? "Searching..." : "Find Trip"}
                </button>
              </form>
              {lookupFeedback && (
                <p className="text-xs text-rose-600 font-medium mt-2">
                  {lookupFeedback}
                </p>
              )}
            </div>

            {/* Quick Demo Autofill Chips */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-6">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Demo Quick-Fill Accounts:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("test@gmail.com")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                >
                  <CheckIcon size={12} className="text-emerald-600" />
                  <span>test@gmail.com (MTR-852655 Completed Trip)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("john.doe@email.com")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700 hover:border-orange-500 transition"
                >
                  John Doe (Active Sedan)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("david.c@techventure.io")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700 hover:border-orange-500 transition"
                >
                  David Chen (Luxury BMW)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("sarah.m@vipclient.com")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700 hover:border-orange-500 transition"
                >
                  Sarah Miller (VIP Client)
                </button>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {authError}
              </div>
            )}

            {/* Form Tabs */}
            <div className="flex border-b border-stone-200 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 text-center transition ${
                  authMode === "login"
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                Sign In to Account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 text-center transition ${
                  authMode === "register"
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                Create New Account
              </button>
            </div>

            <form
              onSubmit={authMode === "login" ? handleLogin : handleRegister}
              className="space-y-4"
            >
              {authMode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 rounded-xl bg-[#17191C] hover:bg-stone-800 text-white font-semibold text-sm transition shadow-sm disabled:opacity-60"
              >
                {isSubmittingAuth
                  ? "Verifying..."
                  : authMode === "login"
                    ? "Access Reservations"
                    : "Register & Access"}
              </button>
            </form>
          </div>
        )}

        {/* Active Reservations Section */}
        {currentUser && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>Active & Upcoming Trips</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#F97316]">
                    {activeBookings.length}
                  </span>
                </h2>
                <button
                  onClick={async () => {
                    if (currentUser) {
                      setIsLoading(true)
                      const fresh = await api.getCustomerBookings(
                        currentUser.email,
                      )
                      setBookings(fresh)
                      setIsLoading(false)
                    }
                  }}
                  className="text-xs font-semibold text-stone-500 hover:text-[#F97316] transition flex items-center gap-1"
                >
                  ↻ Refresh Status
                </button>
              </div>

              {isLoading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400">
                  Loading your reservations...
                </div>
              ) : activeBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                    <CarIcon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">
                    No Active Reservations
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    You do not currently have any active vehicle rentals. Select
                    from our pristine fleet to hit the road.
                  </p>
                  <button
                    onClick={onNavigateListing}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-bold hover:bg-orange-600 transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    Browse Available Fleet <ArrowRightIcon size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* On-Screen Ride Completion Notice for Customers */}
                  {activeBookings.some((b) => isBookingRentalPeriodConcluded(b)) && (
                    <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 shadow-sm space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                          🏁
                        </span>
                        <div>
                          <h4 className="font-heading font-black text-sm sm:text-base text-emerald-950 uppercase tracking-tight">
                            Rental Duration Concluded • Return Check-In Active
                          </h4>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            Your scheduled booking duration (including approved extensions) has ended. Please drive to the assigned garage bay to complete vehicle check-in and security deposit release.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                  {activeBookings.map((b) => {
                    const matedCar = cars.find((c) => c.id === b.matchedCarId)
                    const isMated = Boolean(b.matchedCarId && matedCar)

                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:border-stone-300 transition"
                      >
                        {/* Status bar */}
                        <div className="bg-stone-50 px-6 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-stone-900">
                              {b.id}
                            </span>
                            <span className="text-stone-400">•</span>
                            <span className="text-stone-500">
                              Booked {b.createdAt}
                            </span>
                          </div>

                          {/* Lifecycle Status Pill */}
                          <div className="flex items-center gap-2">
                            {b.status === "Pending Assignment" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Preparing Vehicle at Garage
                              </span>
                            )}
                            {b.status === "Assigned" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
                                <CheckIcon size={12} className="text-sky-600" />
                                Vehicle Assigned & Staged
                              </span>
                            )}
                            {b.status === "Checked Out" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                In Drive / Active Rental
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Flow D: Green Signal Confirmation & Active Trip Status Card */}
                        {b.approvedByAdmin ? (
                          <div className="mx-6 mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                                <h4 className="font-black text-xs sm:text-sm text-emerald-900 tracking-tight">
                                  {b.status === "Checked Out" || b.keysHandedAt
                                    ? "TRIP IS ACTIVE & IN PROGRESS"
                                    : "REQUEST ACCEPTED BY FLEET MANAGER!"}
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded border border-emerald-300">
                                {b.status === "Checked Out" || b.keysHandedAt
                                  ? "Active Rental"
                                  : "Accepted • Ready for Pickup"}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 mb-3">
                              {b.status === "Checked Out" || b.keysHandedAt
                                ? "Your rental trip is currently active. Drive safely! When ready to conclude your trip, return the vehicle to the assigned garage bay below."
                                : "Your reservation request was reviewed and accepted by the manager. Please proceed to the garage bay below to pay and collect your keys:"}
                            </p>

                            {/* Clean Garage Hub & Bay Location Card */}
                            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase text-stone-400 block">
                                    Pickup Garage & Facility
                                  </span>
                                  <h5 className="font-bold text-stone-900 text-sm">
                                    {matedCar?.garageName ||
                                      "MOTORLY Central Hub & Garage Bay 4"}
                                  </h5>
                                  <p className="text-xs text-stone-500">
                                    {matedCar?.garageAddress ||
                                      "4200 NW 21st St, Miami, FL 33142"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                    <a
                                      href={
                                        matedCar?.garageLat && matedCar?.garageLng
                                          ? `https://www.google.com/maps/search/?api=1&query=${matedCar.garageLat},${matedCar.garageLng}`
                                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                              matedCar?.garageAddress ||
                                                matedCar?.garageName ||
                                                b.pickupLocation ||
                                                "MOTORLY Operations Hub"
                                            )}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#F97316] hover:bg-orange-50 border border-orange-200 shadow-2xs transition"
                                      title="Open exact coordinates in Google Maps"
                                    >
                                      <LocationIcon size={13} className="text-[#F97316]" />
                                      <span>Open in Google Maps ↗</span>
                                    </a>
                                    {matedCar && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedGarageMapCar(matedCar)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition cursor-pointer"
                                        title="View interactive garage layout and bay map"
                                      >
                                        <span>🗺️ View Staged Bay Map</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0 text-left sm:text-right">
                                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                                    Assigned Stall / Bay
                                  </span>
                                  <span className="text-sm font-black font-mono text-amber-900">
                                    {matedCar?.garageBay || "Bay 14-B"}
                                  </span>
                                </div>
                              </div>
                              {(b.status === "Checked Out" ||
                                b.keysHandedAt) && (
                                <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-medium text-emerald-800">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    Vehicle is in your possession
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {isBookingRentalPeriodConcluded(b) && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        🏁 Rental Period Concluded
                                      </span>
                                    )}
                                    <span className="font-mono text-[11px] text-stone-500">
                                      Scheduled Return: {b.returnDate}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mx-4 sm:mx-6 mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50/50 to-amber-50 border-2 border-emerald-500/40 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping mt-1 shrink-0" />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-amber-950 text-sm">
                                    Awaiting Fleet Manager Acceptance
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                                    Review Pending
                                  </span>
                                </div>
                                <p className="text-stone-700 text-xs leading-relaxed">
                                  <strong>⚡ Use WhatsApp for faster response:</strong> This is our Fleet Admin (Marcus Vance • +1 778-074-0223) who takes care of the cars at the garage. Send him a WhatsApp message to accelerate your vehicle clearance and staging!
                                </p>
                              </div>
                            </div>
                            <a
                              href={getWhatsAppUrls("7780740223", `🚗 MOTORLY RESERVATION #${b.id} APPROVAL REQUEST\n\nHello Fleet Admin Marcus,\nI have booked ${b.carType || "a vehicle"} for ${b.pickupDate} to ${b.returnDate}. Please review and approve my reservation request.\n\nThank you!\nCustomer: ${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`).smartUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer self-stretch md:self-auto justify-center"
                            >
                              <PhoneIcon size={14} />
                              <span>WhatsApp Admin for Faster Response</span>
                            </a>
                          </div>
                        )}

                        {/* Flow E: Key Handoff & Active Rental Clock Status */}
                        {b.keysHandedAt && (
                          <div className="mx-6 mt-3 p-3.5 rounded-xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              <div>
                                <span className="font-bold text-emerald-400 block text-sm">
                                  Keys Handed Over — Official Rental Clock
                                  Active!
                                </span>
                                <p className="text-[11px] text-stone-300 font-mono mt-0.5">
                                  Handoff: {b.keysHandedAt} • Departure Odo:{" "}
                                  {b.checklistOut?.odometerOut || 15200} mi •
                                  Fuel:{" "}
                                  {b.checklistOut?.fuelLevelOut ||
                                    "Full (100%)"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
                              Vehicle Locked In-Drive
                            </span>
                          </div>
                        )}

                        {/* Flow F: Extension Request Card & Quotation Notification */}
                        {(b.extensionStatus === "Pending" ||
                          b.extensionStatus === "Requested") && (
                          <div className="mx-3 sm:mx-6 mt-3 p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs flex items-center justify-between gap-2.5">
                            <div>
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <ClockIcon
                                  size={14}
                                  className="text-amber-600 shrink-0"
                                />
                                Extension Request Submitted (+
                                {b.extensionRequest?.durationValue ??
                                  b.extensionRequest?.extraDuration ??
                                  1}{" "}
                                {b.extensionRequest?.durationUnit ??
                                  b.extensionRequest?.unit ??
                                  "days"}
                                )
                              </span>
                              <p className="text-stone-600 text-[11px] mt-0.5">
                                The garage manager has received your request and
                                is computing a quotation for your requested
                                period.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase shrink-0">
                              Quotation Pending
                            </span>
                          </div>
                        )}

                        {b.extensionStatus === "Quoted" && b.extensionQuote && (
                          <div className="mx-3 sm:mx-6 mt-3 p-3.5 sm:p-4 rounded-xl bg-sky-50 border-2 border-sky-300 text-xs shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-sky-950 uppercase tracking-wide text-xs flex items-center gap-1.5">
                                <SparklesIcon
                                  size={14}
                                  className="text-sky-600 shrink-0"
                                />
                                Extension Quotation Received!
                              </span>
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                                Awaiting Approval
                              </span>
                            </div>
                            <p className="text-stone-700 mb-2">
                              You requested an extension of{" "}
                              <strong>
                                +
                                {b.extensionQuote.durationValue ??
                                  b.extensionRequest?.durationValue ??
                                  b.extensionRequest?.extraDuration ??
                                  1}{" "}
                                {b.extensionQuote.durationUnit ??
                                  b.extensionRequest?.durationUnit ??
                                  b.extensionRequest?.unit ??
                                  "days"}
                              </strong>
                              . The manager has provided this official quote:
                            </p>
                            <div className="bg-white p-3 rounded-xl border border-sky-200 mb-3 space-y-1 font-mono">
                              <div className="flex justify-between text-stone-600">
                                <span>Quoted Rate:</span>
                                <span className="font-bold text-stone-900">
                                  €
                                  {(b.extensionQuote.rateAmount ?? 0).toFixed(
                                    2,
                                  )}{" "}
                                  / {b.extensionQuote.rateType}
                                </span>
                              </div>
                              <div className="flex justify-between text-stone-900 font-bold pt-1 border-t border-stone-100">
                                <span>Total Quoted Amount to Add:</span>
                                <span className="text-emerald-600 text-base font-black">
                                  +€
                                  {b.extensionQuote.totalQuotedAmount.toFixed(
                                    2,
                                  )}
                                </span>
                              </div>
                              {b.extensionQuote.notes && (
                                <p className="text-[11px] text-stone-500 italic pt-1 font-sans">
                                  Note from Hub: &quot;{b.extensionQuote.notes}
                                  &quot;
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveExtension(b.id)}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckIcon size={14} /> Approve & Extend Trip
                              </button>
                              <button
                                onClick={() => handleDeclineExtension(b.id)}
                                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        )}

                        {b.extensionStatus === "Approved" && (
                          <div className="mx-3 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckIcon
                              size={14}
                              className="text-emerald-600 shrink-0"
                            />
                            <span>
                              Rental extension confirmed and appended to your
                              active bill.
                            </span>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                          {/* Car Preview / Mated Details */}
                          <div className="lg:col-span-5 flex gap-5 items-center">
                            <div className="w-32 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              <img
                                src={
                                  matedCar
                                    ? matedCar.image
                                    : "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"
                                }
                                alt="Vehicle"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-stone-900">
                                  {matedCar
                                    ? matedCar.name
                                    : `${b.requestedCategory || "Standard"} Category`}
                                </h3>
                                {matedCar && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                                    {matedCar.plateNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-500 mt-1">
                                {matedCar
                                  ? `${matedCar.type} • ${matedCar.transmission} • ${matedCar.fuelType}`
                                  : "Fleet dispatch will pair your exact vehicle prior to arrival."}
                              </p>
                              {matedCar && (
                                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex border border-emerald-100">
                                  <ShieldIcon
                                    size={12}
                                    className="text-emerald-600"
                                  />
                                  {matedCar.healthScore || 98}% Certified
                                  Sanitized
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Trip Route & Dates */}
                          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <LocationIcon
                                size={16}
                                className="text-[#F97316] shrink-0 mt-0.5"
                              />
                              <div className="text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-stone-800">
                                    Pickup Hub
                                  </p>
                                  <a
                                    href={
                                      matedCar?.garageLat && matedCar?.garageLng
                                        ? `https://www.google.com/maps/search/?api=1&query=${matedCar.garageLat},${matedCar.garageLng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            b.pickupLocation ||
                                              matedCar?.garageAddress ||
                                              "MOTORLY Central Hub"
                                          )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-[#F97316] hover:underline inline-flex items-center gap-0.5"
                                    title="View location on Google Maps"
                                  >
                                    Maps ↗
                                  </a>
                                </div>
                                <p className="text-stone-500">
                                  {b.pickupLocation}
                                </p>
                                <p className="text-stone-700 font-mono font-medium mt-0.5">
                                  {b.pickupDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <CalendarIcon
                                size={16}
                                className="text-stone-400 shrink-0 mt-0.5"
                              />
                              <div className="text-xs">
                                <p className="font-semibold text-stone-800">
                                  Return Location
                                </p>
                                <p className="text-stone-500">
                                  {b.returnLocation}
                                </p>
                                <p className="text-stone-700 font-mono font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>{b.returnDate}</span>
                                  {b.pickupDate?.split(" ")[0] ===
                                    b.returnDate?.split(" ")[0] && (
                                    <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded">
                                      Same Day
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {(b.tripReason || b.notes) && (
                              <div className="flex items-center gap-1.5 pt-1 text-xs">
                                <span className="font-semibold text-stone-500 text-[11px]">Trip Purpose:</span>
                                <span className="font-bold text-[#F97316] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[220px]">
                                  {b.tripReason || b.notes}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Pricing & Actions */}
                          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                            <div>
                              <p className="text-xs text-stone-400">
                                Total Rental Cost
                              </p>
                              <p className="text-2xl font-black font-mono text-stone-900 mt-0.5">
                                €{b.totalAmount.toFixed(2)}
                              </p>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Taxes & Standard Protection Included
                              </span>
                            </div>

                            <div className="space-y-2 mt-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedVoucher({
                                      booking: b,
                                      car: matedCar,
                                    })
                                  }
                                  className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <QrCodeIcon size={14} />
                                  <span>Digital Boarding Voucher</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedCustomerInvoice({
                                      booking: b,
                                      car: matedCar,
                                    })
                                  }
                                  className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                  title="View full tax invoice document on-screen without downloading"
                                >
                                  <FileTextIcon size={14} />
                                  <span>View Invoice Document</span>
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenExtensionModal(b)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F97316] text-xs font-bold transition border border-orange-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <ClockIcon size={14} />
                                  <span>Need an Extension</span>
                                </button>
                                {b.status !== "Checked Out" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCancelReservation(b.id)
                                    }
                                    className="py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-600 text-xs font-bold transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}
            </div>

            {/* Past Trips Archive */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>Past Rental History</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-200 text-stone-700">
                    {pastBookings.length}
                  </span>
                </h2>

                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  {/* Mobile View: High-density responsive card list for past reservations */}
                  <div className="md:hidden divide-y divide-stone-100 p-3 space-y-3">
                    {pastBookings.map((b) => {
                      const car = cars.find((c) => c.id === b.matchedCarId)
                      const existingReview = myReviews.find(
                        (r) => r.bookingId === b.id,
                      )
                      return (
                        <div key={b.id} className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-xs text-stone-900 block">{b.id}</span>
                              <span className="text-xs font-bold text-stone-800 block mt-0.5">{car ? car.name : b.requestedCategory || "Standard Vehicle"}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-sm text-[#F97316] block leading-tight">€{b.totalAmount.toFixed(2)}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                                b.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-stone-100 text-stone-600"
                              }`}>
                                {b.status === "Completed" ? "✓ Completed" : b.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] space-y-1 text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                            <div className="flex items-center gap-1.5 font-mono text-stone-700 flex-wrap">
                              <CalendarIcon size={12} className="text-[#F97316]" />
                              <span>{b.pickupDate} → {b.returnDate}</span>
                              {b.pickupDate?.split(" ")[0] === b.returnDate?.split(" ")[0] && (
                                <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1 rounded">Same Day</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-500 truncate">
                              <LocationIcon size={11} className="text-stone-400 shrink-0" />
                              <span className="truncate">{b.pickupLocation}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerInvoice({ booking: b, car })}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F97316] font-bold text-xs border border-orange-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <FileTextIcon size={12} />
                              <span>Invoice</span>
                            </button>
                            {b.checklistIn && (
                              <button
                                type="button"
                                onClick={() => setSelectedInspectionBooking({ booking: b, car })}
                                className="py-1.5 px-3 rounded-lg font-bold text-xs transition border bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 cursor-pointer"
                              >
                                Inspection
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedVoucher({ booking: b, car })}
                              className="py-1.5 px-2.5 rounded-lg font-bold text-xs text-stone-600 hover:text-stone-900 border border-stone-200 bg-white cursor-pointer"
                            >
                              Voucher
                            </button>
                            {reviewsEnabled && (
                              existingReview ? (
                                <span className="py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                                  ★ {existingReview.rating}.0
                                </span>
                              ) : b.status === "Completed" ? (
                                <button
                                  type="button"
                                  onClick={() => setReviewModalBooking({ booking: b, car })}
                                  className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                                >
                                  ★ Rate Trip
                                </button>
                              ) : null
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop Spreadsheet Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                          <th className="px-5 py-3">Reservation ID</th>
                          <th className="px-5 py-3">Dates</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Vehicle</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Total</th>
                          <th className="px-5 py-3 text-center">Receipt</th>
                          {reviewsEnabled && (
                            <th className="px-5 py-3 text-center">Feedback</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {pastBookings.map((b) => {
                          const car = cars.find((c) => c.id === b.matchedCarId)
                          const existingReview = myReviews.find(
                            (r) => r.bookingId === b.id,
                          )
                          return (
                            <tr
                              key={b.id}
                              className="hover:bg-stone-50/60 transition"
                            >
                              <td className="px-5 py-3 font-mono font-bold text-stone-900">
                                {b.id}
                              </td>
                              <td className="px-5 py-3 text-stone-600 font-mono">
                                {b.pickupDate?.split(" ")[0] ===
                                b.returnDate?.split(" ")[0] ? (
                                  <span className="flex items-center gap-1.5 flex-wrap">
                                    <span>
                                      {b.pickupDate} → {b.returnDate}
                                    </span>
                                    <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                      <ZapIcon size={10} /> Same Day
                                    </span>
                                  </span>
                                ) : (
                                  `${b.pickupDate} → ${b.returnDate}`
                                )}
                              </td>
                              <td className="px-5 py-3 text-stone-600 truncate max-w-[180px]">
                                {b.pickupLocation}
                              </td>
                              <td className="px-5 py-3 font-medium text-stone-900">
                                {car
                                  ? car.name
                                  : b.requestedCategory || "Standard"}
                              </td>
                              <td className="px-5 py-3">
                                {b.status === "Completed" ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-600">
                                    {b.status}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono font-bold text-stone-900 text-right">
                                €{b.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedCustomerInvoice({
                                        booking: b,
                                        car,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-[#F97316] hover:bg-[#F97316] hover:text-white font-bold text-[11px] transition cursor-pointer border border-orange-200"
                                    title="View official printable trip invoice"
                                  >
                                    <FileTextIcon size={12} />
                                    <span>Invoice</span>
                                  </button>
                                  {b.checklistIn && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedInspectionBooking({
                                          booking: b,
                                          car,
                                        })
                                      }
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                                        b.checklistIn.damageFound
                                          ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200"
                                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                                      }`}
                                      title="View certified vehicle return inspection & photo report"
                                    >
                                      <ShieldIcon size={12} />
                                      <span>
                                        {b.checklistIn.damageFound
                                          ? "Damage Report"
                                          : "Inspection Sheet"}
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      setSelectedVoucher({ booking: b, car })
                                    }
                                    className="text-stone-500 hover:text-stone-900 font-semibold underline decoration-stone-300 text-[11px]"
                                  >
                                    Voucher
                                  </button>
                                </div>
                              </td>
                              {reviewsEnabled && (
                                <td className="px-5 py-3 text-center">
                                  {existingReview ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <StarIcon
                                        size={12}
                                        filled
                                        className="text-amber-500"
                                      />
                                      <span>{existingReview.rating}.0</span>
                                    </span>
                                  ) : b.status === "Completed" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReviewModalBooking({
                                          booking: b,
                                          car,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                                    >
                                      <StarIcon
                                        size={12}
                                        filled
                                        className="text-white"
                                      />
                                      <span>Rate Car</span>
                                    </button>
                                  ) : (
                                    <span className="text-stone-400 text-[10px]">
                                      —
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Digital Boarding Voucher Modal */}
      {selectedVoucher &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
            onClick={() => setSelectedVoucher(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 my-auto animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Boarding Pass Style */}
              <div className="bg-[#17191C] text-white p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#F97316]">
                      MOTORLY EXPRESS BOARDING PASS
                    </span>
                    <h3 className="text-xl font-black mt-0.5">
                      Rental Agreement #{selectedVoucher.booking.id}
                    </h3>
                  </div>
                  <button
                    data-testid="close-voucher-modal"
                    onClick={() => setSelectedVoucher(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
                  <div>
                    <p className="text-[10px] text-stone-400">RENTER</p>
                    <p className="font-bold text-white">
                      {selectedVoucher.booking.customer.firstName}{" "}
                      {selectedVoucher.booking.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400">TELEPHONE</p>
                    <p className="font-mono text-white">
                      {selectedVoucher.booking.customer.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-stone-400">STATUS</p>
                    <p className="font-bold text-emerald-400">
                      {selectedVoucher.booking.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Voucher Details Body */}
              <div className="p-6 space-y-5">
                {/* Vehicle & Plate Highlight */}
                <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                    <img
                      src={
                        selectedVoucher.car
                          ? selectedVoucher.car.image
                          : "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"
                      }
                      alt="Car"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-stone-900">
                      {selectedVoucher.car
                        ? selectedVoucher.car.name
                        : "Assigned Category Vehicle"}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedVoucher.car?.plateNumber && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white border border-stone-300 text-stone-800">
                          {selectedVoucher.car.plateNumber}
                        </span>
                      )}
                      <span className="text-xs text-stone-500">
                        Garage Bay 1
                      </span>
                    </div>
                  </div>
                </div>

                {/* Itinerary */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400">
                      PICKUP DISPATCH
                    </p>
                    <p className="font-bold text-stone-800 mt-1">
                      {selectedVoucher.booking.pickupDate}
                    </p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      {selectedVoucher.booking.pickupLocation}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    <p className="text-[10px] uppercase font-bold text-stone-400">
                      RETURN INSPECTION
                    </p>
                    <p className="font-bold text-stone-800 mt-1">
                      {selectedVoucher.booking.returnDate}
                    </p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      {selectedVoucher.booking.returnLocation}
                    </p>
                  </div>
                </div>

                {/* QR Code Garage Pass */}
                <div className="border border-dashed border-stone-300 rounded-2xl p-4 text-center bg-stone-50 relative z-10">
                  <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex items-center justify-center relative z-20">
                    <QrCodeIcon size={88} className="text-stone-800" />
                  </div>
                  <p className="text-[11px] font-mono text-stone-500 mt-2 relative z-20">
                    SHOW UPON ARRIVAL AT GARAGE
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5 relative z-20">
                    Present this voucher to the manager to inspect the vehicle
                    and collect the keys.
                  </p>
                </div>

                {/* Print / Close */}
                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                  >
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setSelectedVoucher(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#17191C] hover:bg-stone-800 text-white text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Customer Extension Request Modal (Flow F) */}
      {isExtensionModalOpen &&
        selectedBookingForExtension &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
            onClick={() => setIsExtensionModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-stone-200 text-[#17191C] my-auto animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <ClockIcon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900">
                      Request Rental Extension
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Booking #{selectedBookingForExtension.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExtensionModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleSubmitExtensionRequest}
                className="space-y-4 my-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Extension Duration
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={extensionDuration}
                      onChange={(e) =>
                        setExtensionDuration(
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Duration Unit
                    </label>
                    <select
                      value={extensionUnit}
                      onChange={(e) =>
                        setExtensionUnit(
                          e.target.value as "hours" | "days" | "months",
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Reason for Extension (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flight delay, extra business meetings, road trip continuation..."
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600">
                  <strong>Quotation Flow:</strong> Once you submit, the garage
                  manager will receive your request and reply with an official
                  quotation rate per day / hour / month. You can review and
                  approve it before anything is added to your bill.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExtensionModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExtension}
                    className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingExtension
                      ? "Submitting..."
                      : "Send Request to Manager"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Flow F: Rating & Review Modal */}
      {reviewModalBooking &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-base">
                    ★
                  </span>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      Rate Your Rental Experience
                    </h3>
                    <p className="text-xs text-stone-500">
                      {reviewModalBooking.car?.name ||
                        reviewModalBooking.booking.requestedCategory}{" "}
                      • {reviewModalBooking.booking.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewModalBooking(null)}
                  type="button"
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    Overall Experience Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className={`text-2xl transition cursor-pointer ${
                          star <= ratingScore
                            ? "text-amber-400 hover:scale-110"
                            : "text-stone-300 hover:text-amber-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-stone-700 ml-2">
                      {ratingScore}.0 / 5.0
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Feedback / Vehicle Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share your driving experience, vehicle condition, cleanliness, or satisfaction..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalBooking(null)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {selectedCustomerInvoice && (
        <InvoiceModal
          booking={selectedCustomerInvoice.booking}
          car={selectedCustomerInvoice.car}
          onClose={() => setSelectedCustomerInvoice(null)}
        />
      )}

      {/* Certified Vehicle Return Inspection & Damage Audit Modal */}
      {selectedInspectionBooking &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
            onClick={() => setSelectedInspectionBooking(null)}
          >
            <div
              className="bg-white text-stone-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 my-auto animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#17191C] text-white p-5 sm:p-6 relative rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-[#F97316] flex items-center justify-center border border-orange-500/30">
                      <ShieldIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#F97316]">
                        Official Fleet Return Inspection Audit
                      </p>
                      <h3 className="text-lg sm:text-xl font-black mt-0.5 font-heading">
                        Ride #{selectedInspectionBooking.booking.id}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInspectionBooking(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-300">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Vehicle
                    </span>
                    <span className="font-bold text-white">
                      {selectedInspectionBooking.car?.name ||
                        selectedInspectionBooking.booking.requestedCategory ||
                        "Fleet Vehicle"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      License Plate
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedInspectionBooking.car?.plateNumber ||
                        "FL-908-MTR"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Rental Period
                    </span>
                    <span className="font-mono text-white text-[11px]">
                      {
                        selectedInspectionBooking.booking.pickupDate?.split(
                          " ",
                        )[0]
                      }{" "}
                      →{" "}
                      {
                        selectedInspectionBooking.booking.returnDate?.split(
                          " ",
                        )[0]
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Audit Verdict
                    </span>
                    <span
                      className={`font-bold ${
                        selectedInspectionBooking.booking.checklistIn
                          ?.damageFound
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedInspectionBooking.booking.checklistIn
                        ?.damageFound
                        ? "Damage Logged"
                        : "Passed Clean"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                      Departure Odo
                    </span>
                    <span className="font-bold text-stone-800 text-sm">
                      {(
                        selectedInspectionBooking.booking.checklistOut
                          ?.odometerOut || 15200
                      ).toLocaleString()}{" "}
                      mi
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                      Return Odo
                    </span>
                    <span className="font-bold text-stone-800 text-sm">
                      {(
                        selectedInspectionBooking.booking.checklistIn
                          ?.odometerIn || 15320
                      ).toLocaleString()}{" "}
                      mi
                    </span>
                    {selectedInspectionBooking.booking.checklistIn
                      ?.odometerIn &&
                      selectedInspectionBooking.booking.checklistOut
                        ?.odometerOut && (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                          +
                          {selectedInspectionBooking.booking.checklistIn
                            .odometerIn -
                            selectedInspectionBooking.booking.checklistOut
                              .odometerOut}{" "}
                          mi driven
                        </span>
                      )}
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                      Return Fuel
                    </span>
                    <span className="font-bold text-stone-800 text-sm">
                      {selectedInspectionBooking.booking.checklistIn
                        ?.fuelLevelIn || "Full (100%)"}
                    </span>
                  </div>
                </div>

                {/* Damage Report Section */}
                {selectedInspectionBooking.booking.checklistIn?.damageFound ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <h4 className="font-black text-xs text-rose-700 uppercase tracking-wider font-mono">
                          Damage Incident Documented
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white font-mono uppercase">
                        {selectedInspectionBooking.booking.checklistIn
                          .damageSeverity || "Damage Recorded"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-stone-500 font-semibold block">
                          Affected Area:
                        </span>
                        <span className="font-bold text-stone-900 font-mono">
                          {selectedInspectionBooking.booking.checklistIn
                            .damageLocation || "Exterior Panel"}
                        </span>
                      </div>
                      {Number(
                        selectedInspectionBooking.booking.checklistIn.damageFee,
                      ) > 0 && (
                        <div>
                          <span className="text-[11px] text-stone-500 font-semibold block">
                            Repair Assessment / Surcharge:
                          </span>
                          <span className="font-black text-rose-600 font-mono">
                            €
                            {Number(
                              selectedInspectionBooking.booking.checklistIn
                                .damageFee,
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedInspectionBooking.booking.checklistIn
                      .damageNotes && (
                      <div className="text-xs bg-white p-3 rounded-xl border border-rose-200 text-stone-800">
                        <span className="text-[10px] text-rose-600 uppercase font-mono font-bold block mb-1">
                          Inspector Observations:
                        </span>
                        <p className="leading-relaxed font-medium">
                          {
                            selectedInspectionBooking.booking.checklistIn
                              .damageNotes
                          }
                        </p>
                      </div>
                    )}

                    {/* Damage Photos Grid */}
                    {selectedInspectionBooking.booking.checklistIn
                      .damagePhotos &&
                      selectedInspectionBooking.booking.checklistIn.damagePhotos
                        .length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-800 uppercase font-mono flex items-center gap-1.5">
                              <CameraIcon size={14} className="text-rose-600" />
                              <span>
                                Photographic Evidence (
                                {
                                  selectedInspectionBooking.booking.checklistIn
                                    .damagePhotos.length
                                }{" "}
                                Photos)
                              </span>
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              Click to enlarge
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {selectedInspectionBooking.booking.checklistIn.damagePhotos.map(
                              (photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() =>
                                    setZoomedInspectionPhoto({
                                      url: photo,
                                      title: `Return Damage Audit Photo #${pIdx + 1} - ${selectedInspectionBooking.booking.id}`,
                                    })
                                  }
                                  className="group relative aspect-video rounded-xl overflow-hidden border border-rose-300 bg-black cursor-pointer shadow-xs hover:border-rose-500 transition"
                                >
                                  <img
                                    src={photo}
                                    alt={`Damage Evidence ${pIdx + 1}`}
                                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition pointer-events-none" />
                                  <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    #{pIdx + 1} View Full
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wide font-mono">
                        Clean Return Clearance Certified
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Vehicle was returned in verified baseline condition.
                      Interior cleanliness confirmed, 0 damages recorded, and
                      full security pre-authorization hold released.
                    </p>
                  </div>
                )}

                {/* Audit Signoff Footer */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      Certified Auditor:{" "}
                      <strong>
                        {selectedInspectionBooking.booking.checklistIn
                          ?.inspectorStaff || "Lead Fleet Auditor"}
                      </strong>
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-stone-400">
                    {selectedInspectionBooking.booking.checklistIn?.timestamp
                      ? new Date(
                          selectedInspectionBooking.booking.checklistIn
                            .timestamp,
                        ).toLocaleString()
                      : "Audit Certified"}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-stone-200 bg-stone-50 rounded-b-3xl flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInspectionBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Close Inspection Report
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Lightbox for Zoomed Inspection Photos in Customer View */}
      {zoomedInspectionPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setZoomedInspectionPhoto(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-5 shadow-2xl relative space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="font-bold text-xs tracking-tight text-stone-900 font-mono">
                  {zoomedInspectionPhoto.title}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomedInspectionPhoto(null)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-black max-h-[75vh] flex items-center justify-center">
                <img
                  src={zoomedInspectionPhoto.url}
                  alt={zoomedInspectionPhoto.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
