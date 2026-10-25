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
            resolve(e.target?.result as string || "")
          }
        }
        img.onerror = () => resolve(e.target?.result as string || "")
        img.src = e.target?.result as string || ""
      }
      reader.onerror = () => resolve("")
      reader.readAsDataURL(file)
    })
  }

  // Form States - Initialize from authenticated customer
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    const parts = (currentUser?.name || "").trim().split(" ")
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    }
  })

  const [driver, setDriver] = useState<DriverInfo>({
    dateOfBirth: "",
    licenseNumber: "",
    licenseState: "",
    licenseExpiry: "",
    licenseFileName: "",
    licenseBackFileName: "",
  })

  const [payment, setPayment] = useState<PaymentInfo>({
    method: "pickup",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "Pay at Hub",
  })

  const [uploadedFile, setUploadedFile] = useState<string>("")
  const [uploadedBackFile, setUploadedBackFile] = useState<string>("")
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

  useEffect(() => {
    ;(window as any).__setIsScheduleModalOpen = setIsScheduleModalOpen
    return () => {
      delete (window as any).__setIsScheduleModalOpen
    }
  }, [])

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
        setPromoStatus(
          `Success: ${res.discountPercent}% discount applied (${res.code})!`,
        )
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
  const maxDobStr = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 21)
    return d.toISOString().split("T")[0]
  }, [])

  const minExpiryStr = useMemo(() => {
    try {
      const parsed = Date.parse(bookingState.returnDate)
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split("T")[0]
      }
    } catch {}
    return new Date().toISOString().split("T")[0]
  }, [bookingState.returnDate])

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
  const totalAmount = Number((discountedRentalTotal + taxesAndFees).toFixed(2))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      onNavigateAuth?.("checkout")
      return
    }

    // Validation 1: Past pickup date
    const pickupParsed = Date.parse(bookingState.pickupDate)
    if (!isNaN(pickupParsed) && pickupParsed < Date.now() - 15 * 60 * 1000) {
      alert("Pickup date cannot be in the past. Please select a future date.")
      return
    }

    // Validation 2: Driver Minimum Age (21+)
    if (driver.dateOfBirth) {
      const dobParsed = Date.parse(driver.dateOfBirth)
      if (isNaN(dobParsed)) {
        alert("Please enter a valid date of birth.")
        return
      }
      const refDate = !isNaN(pickupParsed) ? new Date(pickupParsed) : new Date()
      const bDate = new Date(dobParsed)
      let age = refDate.getFullYear() - bDate.getFullYear()
      const m = refDate.getMonth() - bDate.getMonth()
      if (m < 0 || (m === 0 && refDate.getDate() < bDate.getDate())) age--
      if (age < 21) {
        alert(
          `Driver must be at least 21 years old to rent a vehicle. (Calculated age: ${age} years old)`,
        )
        return
      }
    }

    // Validation 3: Driver License Expiry
    if (driver.licenseExpiry) {
      const expiryParsed = Date.parse(driver.licenseExpiry)
      if (isNaN(expiryParsed)) {
        alert("Please enter a valid driver's license expiration date.")
        return
      }
      if (expiryParsed <= Date.now()) {
        alert("Driver's license is expired. Please provide a valid, unexpired license.")
        return
      }
      const returnParsed = Date.parse(bookingState.returnDate)
      if (!isNaN(returnParsed) && expiryParsed < returnParsed) {
        alert(
          "Driver's license expires before the rental return date. A license valid for the full trip duration is required.",
        )
        return
      }
    }

    if (!availabilityCheck.isAvailable) {
      alert(
        `Double Booking Conflict: ${car.name} is reserved from ${availabilityCheck.conflict?.pickupDate} to ${availabilityCheck.conflict?.returnDate}. Please choose different dates or select another vehicle.`,
      )
      return
    }
    setIsSubmitting(true)
    const randomId = "MTR-" + Math.floor(100000 + Math.random() * 900000)

    const cleanEmail = (currentUser?.email || customer.email || "")
      .trim()
      .toLowerCase()
    const nameParts = (
      currentUser?.name || `${customer.firstName} ${customer.lastName}`
    )
      .trim()
      .split(" ")
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

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#17191C] font-heading">
          Complete Your Reservation Request
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your dates, provide your contact &amp; driver info, and submit
          your request directly to the Fleet Manager.
        </p>
      </div>

      {/* Customer Account Verification Status Banner */}
      {currentUser ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 font-medium shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              ✓
            </span>
            <span>
              Signed in as <strong>{currentUser.name}</strong> (
              {currentUser.email}) · Driver Account Active
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
                You must be logged in with a verified customer account to
                confirm your rental reservation, authorize insurance, and
                receive garage dispatch signals.
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Date of Birth (21+ Only) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal">Must be 21+</span>
                </label>
                <input
                  type="date"
                  required
                  max={maxDobStr}
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
                  placeholder="e.g. D123-456-789-0"
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
                  placeholder="e.g. FL (Florida) or USA"
                  value={driver.licenseState}
                  onChange={(e) =>
                    setDriver({ ...driver, licenseState: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-gray-50/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>License Expiration Date <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal">Valid through trip</span>
                </label>
                <input
                  type="date"
                  required
                  min={minExpiryStr}
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

          {/* Section 3: Simple & Clean Payment Policy - Pay on Pickup */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                ✓
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17191C] font-heading">
                  No Online Payment Required — Pay Upon Vehicle Pickup
                </h2>
                <p className="text-[11px] text-gray-500">
                  Zero advance charges • Pay directly at the garage when you
                  inspect the vehicle and collect the keys.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckIcon size={20} />
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-emerald-950 text-sm">
                  100% Free Reservation Request
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Once you submit your details and dates, your request is sent
                  directly to our <strong>Fleet Operations Manager</strong>.
                  When the manager accepts your request, your vehicle is prepped
                  and held at the hub. You will pay{" "}
                  <strong>${totalAmount.toFixed(2)}</strong> at vehicle pickup.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-emerald-700 font-semibold">
                  <span>✓ No credit card required</span>
                  <span>✓ Manager reviews &amp; accepts request</span>
                  <span>✓ Free cancellation anytime</span>
                </div>
              </div>
            </div>
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
                  data-testid="edit-dates-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsScheduleModalOpen(true)
                  }}
                  className="text-[11px] font-bold text-[#F97316] hover:underline shrink-0 cursor-pointer"
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
                  {car.garageAddress ||
                    car.location ||
                    "4200 NW 21st St, Miami, FL 33142"}
                </p>
              </div>

              <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 text-[10px]">
                  Configured by vehicle garage owner
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    car.garageAddress ||
                      car.garageName ||
                      car.location ||
                      "4200 NW 21st St, Miami, FL 33142",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 text-[11px]"
                >
                  Google Maps ↗
                </a>
              </div>
            </div>

            {/* Schedule Conflict Alert Banner if Double Booking Detected */}
            {!availabilityCheck.isAvailable && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-stone-900 text-xs space-y-3 shadow-xs animate-fade-in">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <line x1="10" y1="14" x2="14" y2="18" />
                        <line x1="14" y1="14" x2="10" y2="18" />
                      </svg>
                    </span>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm tracking-tight">
                        Schedule Conflict
                      </h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Vehicle already reserved for requested dates
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full shrink-0">
                    Booked Slot
                  </span>
                </div>

                {/* Overlapping Range Visual Block */}
                <div className="p-3 bg-white/95 rounded-xl border border-amber-200/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-600 font-semibold">
                      {car.name} is reserved:
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      Existing Booking
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-900 font-mono text-xs font-bold bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100">
                    <CalendarIcon
                      size={14}
                      className="text-amber-700 shrink-0"
                    />
                    <span>
                      {availabilityCheck.conflict?.pickupDate ||
                        bookingState.pickupDate}
                    </span>
                    <span className="text-stone-400">→</span>
                    <span>
                      {availabilityCheck.conflict?.returnDate ||
                        bookingState.returnDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Another customer has an approved reservation during these
                    dates. You can modify your rental dates or select another
                    car from our available fleet.
                  </p>
                </div>

                {/* Smart Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 rounded-xl font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 hover:border-stone-400 cursor-pointer"
                  >
                    <CalendarIcon size={14} className="text-[#F97316]" />
                    <span>Change Dates</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateListing}
                    className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>←</span>
                    <span>Choose Another Car</span>
                  </button>
                </div>
              </div>
            )}

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
                <span>Estimated Taxes &amp; Fees (10%)</span>
                <span className="font-semibold text-gray-900">
                  ${taxesAndFees.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-200 text-sm font-extrabold text-[#17191C] font-heading">
                <span>Total Due on Pickup</span>
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
                <span>
                  Sign In to Request Car (${totalAmount.toFixed(2)} on Pickup)
                </span>
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
                    <ZapIcon size={16} />
                    <span>
                      Submit Request to Manager (${totalAmount.toFixed(2)} on
                      Pickup)
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Reassurance */}
            <p className="text-[10px] text-gray-500 text-center leading-tight">
              🔒 No online payment charged. Fleet Manager will review dates and
              accept your request. Pay upon pickup.
            </p>
          </div>
        </div>
      </form>

      {/* Mobile-Only Sticky Floating Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between lg:hidden shadow-2xl">
        <div>
          <span className="text-[10px] text-stone-500 font-bold block uppercase tracking-wider">
            Total Due on Pickup
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
            <span>Sign In to Request</span>
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
            <ZapIcon size={14} />
            <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
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
