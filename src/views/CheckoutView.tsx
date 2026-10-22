import React, { useState, useRef, useEffect, useMemo } from "react"
import type {
  Car,
  BookingState,
  CustomerInfo,
  DriverInfo,
  PaymentInfo,
  CustomerUser,
  ViewMode,
} from "../types"
import { api } from "../services/api"
import DateSchedulingModal from "../components/DateSchedulingModal"
import {
  ShieldIcon,
  CardIcon,
  UploadIcon,
  CheckIcon,
  ClockIcon,
  ZapIcon,
  TagIcon,
  LockIcon,
  CalendarIcon,
  LocationIcon,
} from "../components/Icons"

interface CheckoutViewProps {
  car: Car
  bookingState: BookingState
  setBookingState: React.Dispatch<React.SetStateAction<BookingState>>
  currentUser?: CustomerUser | null
  onNavigateAuth?: (returnView: ViewMode) => void
  onConfirmBooking: (bookingDetails: {
    customer: CustomerInfo
    driver: DriverInfo
    payment: PaymentInfo
    totalAmount: number
    bookingId: string
  }) => void
  onNavigateHome: () => void
  onNavigateListing: () => void
}

export default function CheckoutView({
  car,
  bookingState,
  setBookingState,
  currentUser,
  onNavigateAuth,
  onConfirmBooking,
  onNavigateHome,
  onNavigateListing,
}: CheckoutViewProps) {
  // Helper to compress uploaded image before storing/sending
  const compressImage = (
    file: File,
    maxDim = 1200,
    quality = 0.8,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL("image/jpeg", quality))
          } else {
            resolve((e.target?.result as string) || "")
          }
        }
        img.onerror = () => resolve((e.target?.result as string) || "")
        img.src = (e.target?.result as string) || ""
      }
      reader.onerror = () => resolve("")
      reader.readAsDataURL(file)
    })
  }

  // Form States - Initialize from authenticated customer
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    const parts = (currentUser?.name || "").trim().split(" ")
    const first = parts[0] || "Customer"
    const last = parts.slice(1).join(" ") || "Renter"
    return {
      firstName: first,
      lastName: last,
      email: currentUser?.email || "customer@example.com",
      phone: currentUser?.phone || "+1 (305) 555-0199",
    }
  })

  const [driver, setDriver] = useState<DriverInfo>({
    dateOfBirth: "05/15/1990",
    licenseNumber: "D12345678",
    licenseState: "Florida",
    licenseExpiry: "05/15/2030",
    licenseFileName: "driver_license_front.jpg",
  })

  const [payment, setPayment] = useState<PaymentInfo>({
    method: "card",
    cardNumber: "1234 5678 9012 3456",
    expiryDate: "03/28",
    cvv: "345",
    cardHolderName: "John Doe",
  })

  const [uploadedFile, setUploadedFile] = useState<string>(
    "driver_license_front.jpg",
  )
  const [uploadedBackFile, setUploadedBackFile] = useState<string>(
    "driver_license_back.jpg",
  )
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [uploadedFrontDataUrl, setUploadedFrontDataUrl] =
    useState<string | null>(null)
  const [uploadedBackDataUrl, setUploadedBackDataUrl] = useState<string | null>(
    null,
  )
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [promoCode, setPromoCode] = useState<string>("")
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [promoStatus, setPromoStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    isAvailable: boolean
    conflict: any
    loading: boolean
  }>({
    isAvailable: true,
    conflict: null,
    loading: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileBackInputRef = useRef<HTMLInputElement>(null)

  // Populate form from authenticated customer user profile
  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || "").trim().split(" ")
      const first = parts[0] || ""
      const last = parts.slice(1).join(" ") || ""
      setCustomer((prev) => ({
        ...prev,
        firstName: first || prev.firstName,
        lastName: last || prev.lastName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
      }))
      if (currentUser.driverLicenseNum) {
        setDriver((prev) => ({
          ...prev,
          licenseNumber: currentUser.driverLicenseNum || prev.licenseNumber,
          licenseState: currentUser.driverLicenseState || prev.licenseState,
          licenseExpiry: currentUser.driverLicenseExpiry || prev.licenseExpiry,
        }))
      }
      setPayment((prev) => ({
        ...prev,
        cardHolderName: currentUser.name || prev.cardHolderName,
      }))
    }
  }, [currentUser])

  // Double Booking Prevention: Check vehicle availability for active dates
  useEffect(() => {
    let isCancelled = false
    async function verifyAvailability() {
      if (!car?.id) return
      setAvailabilityCheck((prev) => ({ ...prev, loading: true }))
      try {
        const res = await api.checkCarAvailability(
          car.id,
          bookingState.pickupDate,
          bookingState.returnDate,
        )
        if (!isCancelled) {
          setAvailabilityCheck({
            isAvailable: Boolean(res.isAvailable),
            conflict: res.conflict,
            loading: false,
          })
        }
      } catch {
        if (!isCancelled) {
          setAvailabilityCheck({
            isAvailable: true,
            conflict: null,
            loading: false,
          })
        }
      }
    }
    verifyAvailability()
    return () => {
      isCancelled = true
    }
  }, [car?.id, bookingState.pickupDate, bookingState.returnDate])

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isBack = false,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploading(true)
      try {
        const compressedDataUrl = await compressImage(file, 1200, 0.8)
        if (isBack) {
          setUploadedBackFile(file.name)
          setUploadedBackDataUrl(compressedDataUrl)
        } else {
          setUploadedFile(file.name)
          setUploadedFrontDataUrl(compressedDataUrl)
        }
      } catch (err) {
        console.warn("Image compression failed, using fallback", err)
        if (isBack) {
          setUploadedBackFile(file.name)
        } else {
          setUploadedFile(file.name)
        }
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleAutofillDemo = () => {
    const demoFront = `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="#1e293b"/><rect x="15" y="15" width="370" height="40" rx="8" fill="#f97316"/><text x="30" y="40" fill="#ffffff" font-size="16" font-family="sans-serif" font-weight="bold">FLORIDA DRIVER LICENSE (FRONT)</text><rect x="25" y="75" width="90" height="110" rx="8" fill="#334155"/><circle cx="70" cy="115" r="24" fill="#94a3b8"/><path d="M45 170 C45 140, 95 140, 95 170 Z" fill="#94a3b8"/><text x="135" y="95" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="bold">ALEX MERCER</text><text x="135" y="120" fill="#f59e0b" font-size="12" font-family="monospace" font-weight="bold">LIC #FL-9284-91823</text><text x="135" y="145" fill="#cbd5e1" font-size="11" font-family="sans-serif">DOB: 04/12/1992 • EXP: 05/15/2030</text><text x="135" y="170" fill="#cbd5e1" font-size="11" font-family="sans-serif">CLASS E • SAFE DRIVER</text><rect x="25" y="200" width="350" height="25" rx="4" fill="#0f172a"/><text x="35" y="217" fill="#64748b" font-size="10" font-family="monospace">MOTORLY SECURE ID VERIFICATION</text></svg>`,
    )}`

    const demoBack = `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="#0f172a"/><rect x="20" y="20" width="360" height="50" rx="4" fill="#334155"/><line x1="20" y1="45" x2="380" y2="45" stroke="#000000" stroke-width="20"/><rect x="40" y="90" width="320" height="80" rx="6" fill="#1e293b"/><text x="55" y="125" fill="#f8fafc" font-size="12" font-family="monospace">BARCODE / 2D PDF417 STRIP</text><text x="55" y="145" fill="#94a3b8" font-size="10" font-family="monospace">||||| | |||| || ||||| ||| |||| ||||||</text><rect x="20" y="190" width="360" height="40" rx="4" fill="#1e293b"/><text x="35" y="215" fill="#64748b" font-size="9" font-family="sans-serif">RESTRICTIONS: NONE • ENDORSEMENTS: NONE</text></svg>`,
    )}`

    setCustomer({
      firstName: "Alex",
      lastName: "Mercer",
      email: "alex.mercer@gmail.com",
      phone: "(305) 555-8392",
    })
    setDriver({
      dateOfBirth: "04/12/1992",
      licenseNumber: "FL-9284-91823",
      licenseState: "Florida",
      licenseExpiry: "05/15/2030",
      licenseFileName: "driver_license_front.jpg",
      licenseBackFileName: "driver_license_back.jpg",
    })
    setUploadedFile("driver_license_front.jpg")
    setUploadedBackFile("driver_license_back.jpg")
    setUploadedFrontDataUrl(demoFront)
    setUploadedBackDataUrl(demoBack)
    setPayment({
      method: "card",
      cardNumber: "4532 8921 4410 8821",
      expiryDate: "08/28",
      cvv: "712",
      cardHolderName: "Alex Mercer",
    })
  }

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code) {
      setPromoDiscount(0)
      setPromoStatus("Please enter a promo code.")
      return
    }

    try {
      const res = await api.validatePromo(code)
      if (res && res.valid) {
        const discountFraction = (res.discountPercent || 15) / 100
        setPromoDiscount(discountFraction)
        setPromoStatus(`Success: ${res.discountPercent}% discount applied (${res.code})!`)
      } else if (code === "DRIVE15") {
        setPromoDiscount(0.15)
        setPromoStatus("Success: 15% discount applied!")
      } else {
        setPromoDiscount(0)
        setPromoStatus(res?.message || "Invalid coupon code. Try: DRIVE15")
      }
    } catch {
      if (code === "DRIVE15") {
        setPromoDiscount(0.15)
        setPromoStatus("Success: 15% discount applied!")
      } else {
        setPromoDiscount(0)
        setPromoStatus("Invalid coupon code. Try: DRIVE15")
      }
    }
    setTimeout(() => setPromoStatus(null), 4500)
  }

  // Calculations matching reference design with promo support and live date math
  const days = useMemo(() => {
    try {
      const start = Date.parse(bookingState.pickupDate)
      const end = Date.parse(bookingState.returnDate)
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
      }
    } catch {}
    return bookingState.rentalDurationDays || 3
  }, [
    bookingState.pickupDate,
    bookingState.returnDate,
    bookingState.rentalDurationDays,
  ])
  const rawRentalTotal = car.pricePerDay * days
  const discountedRentalTotal = rawRentalTotal * (1 - promoDiscount)
  const taxesAndFees = Number((discountedRentalTotal * 0.18).toFixed(2))
  const protectionFee = bookingState.protectionPlan
    ? Number((12.0 * days).toFixed(2))
    : 0.0
  const totalAmount = Number(
    (discountedRentalTotal + taxesAndFees + protectionFee).toFixed(2),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      onNavigateAuth?.("checkout")
      return
    }
    if (!availabilityCheck.isAvailable) {
      alert(
        `Double Booking Conflict: ${car.name} is reserved from ${availabilityCheck.conflict?.pickupDate} to ${availabilityCheck.conflict?.returnDate}. Please choose different dates or select another vehicle.`,
      )
      return
    }
    setIsSubmitting(true)
    const randomId = "MTR-" + Math.floor(100000 + Math.random() * 900000)

    const cleanEmail = (currentUser?.email || customer.email || "").trim().toLowerCase()
    const nameParts = (currentUser?.name || `${customer.firstName} ${customer.lastName}`).trim().split(" ")
    const finalCustomer: CustomerInfo = {
      firstName: customer.firstName || nameParts[0] || "Customer",
      lastName: customer.lastName || nameParts.slice(1).join(" ") || "Renter",
      email: cleanEmail,
      phone: customer.phone || currentUser?.phone || "+1 (555) 019-9000",
    }

    setTimeout(() => {
      onConfirmBooking({
        customer: finalCustomer,
        driver: {
          ...driver,
          licenseFileName: uploadedFile,
          licenseBackFileName: uploadedBackFile,
          licensePhotoFront: uploadedFrontDataUrl || undefined,
          licensePhotoBack: uploadedBackDataUrl || undefined,
        },
        payment,
        totalAmount,
        bookingId: randomId,
      })
      setIsSubmitting(false)
    }, 300)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 pb-28">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-[#F97316] transition-colors"
        >
          Home
        </button>
        <span>&gt;</span>
        <button
          onClick={onNavigateListing}
          className="hover:text-[#F97316] transition-colors"
        >
          Fleet Inventory
        </button>
        <span>&gt;</span>
        <span className="text-gray-900 font-bold">
          Checkout &amp; Verification
        </span>
      </nav>

      {/* Page Title & Fast Autofill Demo Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#17191C] font-heading">
            Complete Your Reservation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your rental schedule, verify driver identity, and finalize
            your booking.
          </p>
        </div>

        {/* 1-Click Fast Autofill Button */}
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs group"
          title="Instantly populate verified test profile"
        >
          <ZapIcon
            size={14}
            className="text-[#F97316] group-hover:scale-110 transition-transform"
          />
          <span>⚡ Express Demo Autofill (1-Click)</span>
        </button>
      </div>

      {/* Customer Account Verification Status Banner */}
      {currentUser ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 font-medium shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              ✓
            </span>
            <span>
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.email}) · Driver Account Active
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
            {currentUser.vipTier || "Standard"} Member
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
              <LockIcon size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">
                Customer Account Required to Reserve
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                You must be logged in with a verified customer account to confirm your rental reservation, authorize insurance, and receive garage dispatch signals.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateAuth?.("checkout")}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
          >
            Sign In / Register Now →
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer Information */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17191C] font-heading">
                  Primary Customer Information
                </h2>
                <p className="text-[11px] text-gray-400">
                  Confirmation vouchers are delivered to this address.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customer.firstName}
                  onChange={(e) =>
                    setCustomer({ ...customer, firstName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customer.lastName}
                  onChange={(e) =>
                    setCustomer({ ...customer, lastName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer({ ...customer, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Driver Information */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17191C] font-heading">
                  Driver's License &amp; Identity Verification
                </h2>
                <p className="text-[11px] text-gray-400">
                  Required by Florida Department of Highway Safety.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={driver.dateOfBirth}
                  onChange={(e) =>
                    setDriver({ ...driver, dateOfBirth: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Driver's License Number{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={driver.licenseNumber}
                  onChange={(e) =>
                    setDriver({ ...driver, licenseNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Issuing State / Country{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={driver.licenseState}
                  onChange={(e) =>
                    setDriver({ ...driver, licenseState: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  License Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={driver.licenseExpiry}
                  onChange={(e) =>
                    setDriver({ ...driver, licenseExpiry: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
            </div>

            {/* Upload License Dual Drag & Drop Zone */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Driver Identification Photos (Front &amp; Back){" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Front License */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, false)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E7EB] hover:border-[#F97316] rounded-2xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center space-y-1.5 group"
                  >
                    {uploadedFrontDataUrl ? (
                      <div className="w-full flex items-center gap-3">
                        <img
                          src={uploadedFrontDataUrl}
                          alt="Driver License Front"
                          className="w-20 h-14 object-cover rounded-xl border border-emerald-300 shadow-xs"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckIcon size={12} /> Front Photo Captured
                          </p>
                          <p className="text-[10px] text-gray-500 truncate font-mono">
                            {uploadedFile}
                          </p>
                          <span className="text-[10px] text-orange-600 font-semibold hover:underline">
                            Click to replace photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-gray-400 group-hover:text-[#F97316] transition-colors">
                          <UploadIcon size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {uploadedFile ? (
                              <span className="text-emerald-600 flex items-center gap-1 justify-center">
                                <CheckIcon size={12} /> Front: {uploadedFile}
                              </span>
                            ) : (
                              "Upload License Front"
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Driver License Front Side
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Back License */}
                <div>
                  <input
                    ref={fileBackInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, true)}
                  />
                  <div
                    onClick={() => fileBackInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E7EB] hover:border-[#F97316] rounded-2xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center space-y-1.5 group"
                  >
                    {uploadedBackDataUrl ? (
                      <div className="w-full flex items-center gap-3">
                        <img
                          src={uploadedBackDataUrl}
                          alt="Driver License Back"
                          className="w-20 h-14 object-cover rounded-xl border border-emerald-300 shadow-xs"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckIcon size={12} /> Back Photo Captured
                          </p>
                          <p className="text-[10px] text-gray-500 truncate font-mono">
                            {uploadedBackFile}
                          </p>
                          <span className="text-[10px] text-orange-600 font-semibold hover:underline">
                            Click to replace photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-gray-400 group-hover:text-[#F97316] transition-colors">
                          <UploadIcon size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {uploadedBackFile ? (
                              <span className="text-emerald-600 flex items-center gap-1 justify-center">
                                <CheckIcon size={12} /> Back: {uploadedBackFile}
                              </span>
                            ) : (
                              "Upload License Back"
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Driver License Back Barcode
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                🔒 Stored securely. Operations Admin will review and provide the
                green signal for garage pickup.
              </p>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17191C] font-heading">
                  Secure Payment Details
                </h2>
                <p className="text-[11px] text-gray-400">
                  256-bit encrypted SSL checkout. Zero fees if cancelled 24h
                  prior.
                </p>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPayment({ ...payment, method: "card" })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  payment.method === "card"
                    ? "border-[#F97316] bg-orange-50/50 text-[#F97316] shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CardIcon size={18} />
                <span>Credit / Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPayment({ ...payment, method: "pickup" })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  payment.method === "pickup"
                    ? "border-[#F97316] bg-orange-50/50 text-[#F97316] shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ClockIcon size={18} />
                <span>Pay at Terminal Hub</span>
              </button>
            </div>

            {payment.method === "card" ? (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payment.cardNumber}
                    onChange={(e) =>
                      setPayment({ ...payment, cardNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payment.expiryDate}
                      onChange={(e) =>
                        setPayment({ ...payment, expiryDate: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Security Code (CVV){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payment.cvv}
                      onChange={(e) =>
                        setPayment({ ...payment, cvv: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Name on Card <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payment.cardHolderName}
                    onChange={(e) =>
                      setPayment({ ...payment, cardHolderName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-gray-700 space-y-1">
                <p className="font-bold text-[#F97316]">
                  Pay at Terminal Hub Selected
                </p>
                <p className="text-[11px] text-gray-600">
                  You will pay upon vehicle pickup at{" "}
                  {car.garageName || car.garageAddress || "the garage facility"}. We hold your vehicle
                  reservation without charging your card today.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Confirmation */}
        <div className="lg:col-span-4 sticky top-28 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-xl space-y-5">
            <h3 className="font-heading font-extrabold text-base text-[#17191C] border-b border-gray-100 pb-3">
              Rental Summary
            </h3>

            {/* Vehicle Mini Card */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="w-16 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-gray-200">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-900 truncate font-heading">
                  {car.name}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {car.type} • {car.transmission} • {car.fuelType}
                </p>
              </div>
            </div>

            {/* Itinerary */}
            <div className="space-y-3 text-xs border-b border-gray-100 pb-4">
              <div
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-start justify-between p-2.5 rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <CalendarIcon
                    size={14}
                    className="text-[#F97316] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      Dates ({days} {days === 1 ? "Day" : "Days"} Duration)
                    </span>
                    <span className="text-gray-500 text-xs">
                      {bookingState.pickupDate} ({bookingState.pickupTime}) →{" "}
                      {bookingState.returnDate} ({bookingState.returnTime})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsScheduleModalOpen(true)
                  }}
                  className="text-[11px] font-bold text-[#F97316] hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Garage Location (Assigned by Garage Owner) */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <LocationIcon size={14} className="text-[#F97316]" />
                  Garage Location (Pickup &amp; Return)
                </span>
                {car.garageBay && (
                  <span className="bg-white border border-amber-300 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-2xs">
                    {car.garageBay}
                  </span>
                )}
              </div>

              <div>
                <h5 className="font-bold text-xs sm:text-sm text-stone-900">
                  {car.garageName || "MOTORLY Central Hub & Garage"}
                </h5>
                <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                  {car.garageAddress || car.location || "4200 NW 21st St, Miami, FL 33142"}
                </p>
              </div>

              <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 text-[10px]">
                  Configured by vehicle garage owner
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    car.garageAddress || car.garageName || car.location || "4200 NW 21st St, Miami, FL 33142"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 text-[11px]"
                >
                  Google Maps ↗
                </a>
              </div>
            </div>

            {/* Conflict Alert Banner if Double Booking Detected */}
            {!availabilityCheck.isAvailable && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <span className="text-sm">⚠️</span>
                  <span>Double Booking Conflict</span>
                </div>
                <p className="leading-tight">
                  <strong>{car.name}</strong> is already booked for overlapping
                  dates (
                  <span className="font-mono font-bold">
                    {availabilityCheck.conflict?.pickupDate} →{" "}
                    {availabilityCheck.conflict?.returnDate}
                  </span>
                  ).
                </p>
                <p className="text-[10px] text-rose-600">
                  Please pick another available car or adjust your reservation
                  dates.
                </p>
                <button
                  type="button"
                  onClick={onNavigateListing}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition"
                >
                  ← Select Available Vehicle
                </button>
              </div>
            )}

            {/* Protection Plan Toggle */}
            <label className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50/30 border border-gray-200 rounded-2xl cursor-pointer text-xs">
              <div className="flex items-center gap-2">
                <ShieldIcon size={16} className="text-[#F97316]" />
                <div>
                  <span className="font-bold text-gray-800 block">
                    Collision Protection
                  </span>
                  <span className="text-[10px] text-gray-400">$12/day</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={bookingState.protectionPlan}
                onChange={(e) =>
                  setBookingState((prev) => ({
                    ...prev,
                    protectionPlan: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-[#F97316] accent-[#F97316]"
              />
            </label>

            {/* Promo Code Box */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Promo Code (DRIVE15)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>

            {promoStatus && (
              <div
                className={`p-2 rounded-xl text-xs font-semibold text-center ${
                  promoDiscount > 0
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-[#F97316]"
                }`}
              >
                {promoStatus}
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>
                  Vehicle Rental (${car.pricePerDay} × {days} days)
                </span>
                <span className="font-semibold text-gray-900">
                  ${rawRentalTotal.toFixed(2)}
                </span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>15% Discount Applied</span>
                  <span>-${(rawRentalTotal * promoDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>State &amp; Airport Taxes (18%)</span>
                <span className="font-semibold text-gray-900">
                  ${taxesAndFees.toFixed(2)}
                </span>
              </div>
              {bookingState.protectionPlan && (
                <div className="flex justify-between">
                  <span>Collision Damage Coverage</span>
                  <span className="font-semibold text-gray-900">
                    ${protectionFee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200 text-sm font-extrabold text-[#17191C] font-heading">
                <span>Grand Total Due</span>
                <span className="text-[#F97316] text-xl font-black">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            {!currentUser ? (
              <button
                type="button"
                onClick={() => onNavigateAuth?.("checkout")}
                className="w-full py-4 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm bg-[#F97316] hover:bg-[#EA580C] cursor-pointer"
              >
                <LockIcon size={16} />
                <span>Sign In with Account to Confirm (${totalAmount.toFixed(2)})</span>
              </button>
            ) : (
              <button
                id="confirm-booking-btn"
                type="submit"
                disabled={isSubmitting || !availabilityCheck.isAvailable}
                className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  !availabilityCheck.isAvailable
                    ? "bg-stone-400 cursor-not-allowed opacity-75"
                    : "bg-[#F97316] hover:bg-[#EA580C] hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : !availabilityCheck.isAvailable ? (
                  <span>🚫 Unavailable for Selected Dates</span>
                ) : (
                  <>
                    <LockIcon size={16} />
                    <span>
                      Authorize &amp; Confirm (${totalAmount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Reassurance */}
            <p className="text-[10px] text-gray-400 text-center leading-tight">
              By confirming, your reservation is instantly mated to an active
              fleet vehicle in the database.
            </p>
          </div>
        </div>
      </form>

      {/* Mobile-Only Sticky Floating Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between lg:hidden shadow-2xl">
        <div>
          <span className="text-[10px] text-stone-500 font-bold block uppercase tracking-wider">
            Total Due
          </span>
          <span className="text-xl font-black text-[#F97316] font-heading">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
        {!currentUser ? (
          <button
            type="button"
            onClick={() => onNavigateAuth?.("checkout")}
            className="h-11 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer bg-[#F97316] hover:bg-[#EA580C] active:scale-95"
          >
            <LockIcon size={14} />
            <span>Sign In to Book</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const btn = document.getElementById("confirm-booking-btn")
              if (btn) btn.click()
            }}
            disabled={isSubmitting || !availabilityCheck.isAvailable}
            className={`h-11 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
              !availabilityCheck.isAvailable
                ? "bg-stone-400 cursor-not-allowed"
                : "bg-[#F97316] hover:bg-[#EA580C] active:scale-95"
            }`}
          >
            <LockIcon size={14} />
            <span>{isSubmitting ? "Processing..." : "Confirm & Pay"}</span>
          </button>
        )}
      </div>

      {/* Interactive Date & Scheduling Calendar Modal */}
      <DateSchedulingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        pickupDate={bookingState.pickupDate}
        pickupTime={bookingState.pickupTime}
        returnDate={bookingState.returnDate}
        returnTime={bookingState.returnTime}
        pickupLocation={bookingState.pickupLocation}
        onApply={(data) => {
          setBookingState((prev) => ({
            ...prev,
            ...data,
          }))
        }}
      />
    </div>
  )
}
