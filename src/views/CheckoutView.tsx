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
import { calculateRentalPrice } from "../utils/pricing"
import { ShieldIcon, CheckIcon } from "../components/Icons"
import CheckoutCustomerForm from "./customer/CheckoutCustomerForm"
import CheckoutDriverIdForm from "./customer/CheckoutDriverIdForm"
import CheckoutTripPurpose from "./customer/CheckoutTripPurpose"
import CheckoutDeliveryOptions from "./customer/CheckoutDeliveryOptions"
import CheckoutOptionalServices, { AVAILABLE_OPTIONAL_SERVICES } from "./customer/CheckoutOptionalServices"
import CheckoutRemarksAndExtension from "./customer/CheckoutRemarksAndExtension"
import CheckoutConditionAndSignature from "./customer/CheckoutConditionAndSignature"
import CheckoutOrderSummary from "./customer/CheckoutOrderSummary"
import LegalPoliciesModal from "../components/LegalPoliciesModal"

interface CheckoutViewProps {
  car?: Car
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
    promoCode?: string
    discountPercent?: number
    discountAmount?: number
    tripReason?: string
    notes?: string
    deliveryType?: "garage" | "custom"
    deliveryLocationCustom?: string
    deliveryFee?: number
    returnType?: "garage" | "custom"
    returnLocationCustom?: string
    returnFee?: number
    optionalServices?: string[]
    optionalServicesCost?: number
    securityDeposit?: number
    remarks?: string
    clientSignature?: string
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
  // Compress uploaded image before storing/sending
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

  // Form States
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

  const [payment] = useState<PaymentInfo>({
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
  const [, setIsUploading] = useState<boolean>(false)
  const [promoCode, setPromoCode] = useState<string>(
    bookingState.promoCode || "",
  )
  const [promoDiscount, setPromoDiscount] = useState<number>(
    (bookingState.discountPercent || 0) / 100,
  )
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false)
  const [promoStatus, setPromoStatus] = useState<string | null>(
    bookingState.promoCode && bookingState.discountPercent
      ? `${bookingState.discountPercent}% Atelier Privilege Applied (${bookingState.promoCode})`
      : null,
  )
  const [isPromoSuccess, setIsPromoSuccess] = useState<boolean>(
    Boolean(bookingState.promoCode && bookingState.discountPercent),
  )

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [tripReason, setTripReason] = useState<string>("")
  const [tripDestination, setTripDestination] = useState<string>("")
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false)
  const [legalModalTab, setLegalModalTab] = useState<"privacy" | "terms" | "deposit" | "insurance">("terms")

  // Pit Stop Physical Agreement Fields
  const [deliveryType, setDeliveryType] = useState<"garage" | "custom">("garage")
  const [deliveryLocationCustom, setDeliveryLocationCustom] = useState<string>("")
  const [returnType, setReturnType] = useState<"garage" | "custom">("garage")
  const [returnLocationCustom, setReturnLocationCustom] = useState<string>("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [remarks, setRemarks] = useState<string>("")
  const [clientSignature, setClientSignature] = useState<string>("")
  const [conditionNotes, setConditionNotes] = useState<string>("")

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
    }
  }, [currentUser])

  // Double Booking Prevention
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
      setIsPromoSuccess(false)
      setPromoStatus("Please enter a privilege voucher code.")
      return
    }

    setIsValidatingPromo(true)
    try {
      const res = await api.validatePromo(code)
      if (res && res.valid) {
        const discountFraction = (res.discountPercent || 0) / 100
        setPromoDiscount(discountFraction)
        setPromoCode(res.code)
        setIsPromoSuccess(true)
        setPromoStatus(
          `${res.discountPercent}% Atelier Privilege Applied (${res.code})`,
        )
      } else {
        setPromoDiscount(0)
        setIsPromoSuccess(false)
        setPromoStatus(
          res?.message || "Invalid or unrecognized privilege code.",
        )
      }
    } catch {
      setPromoDiscount(0)
      setIsPromoSuccess(false)
      setPromoStatus("Unable to validate privilege code.")
    } finally {
      setIsValidatingPromo(false)
      setTimeout(() => setPromoStatus(null), 5000)
    }
  }

  const handleRemovePromo = () => {
    setPromoCode("")
    setPromoDiscount(0)
    setIsPromoSuccess(false)
    setPromoStatus(null)
  }

  const maxDobStr = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
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

  const isSameDayBooking = useMemo(() => {
    if (!bookingState.pickupDate || !bookingState.returnDate) return false
    const p = new Date(bookingState.pickupDate)
    const r = new Date(bookingState.returnDate)
    if (isNaN(p.getTime()) || isNaN(r.getTime())) {
      return bookingState.pickupDate.trim() === bookingState.returnDate.trim()
    }
    return (
      p.getFullYear() === r.getFullYear() &&
      p.getMonth() === r.getMonth() &&
      p.getDate() === r.getDate()
    )
  }, [bookingState.pickupDate, bookingState.returnDate])

  const sameDayHours = useMemo(() => {
    if (!isSameDayBooking) return 0
    const parseHour = (t?: string): number => {
      if (!t) return 10
      const parts = t.split(" ")
      const time = parts[0] || "10:00"
      const modifier = parts[1] || "AM"
      let [h] = time.split(":").map(Number)
      if (modifier === "PM" && h < 12) h += 12
      if (modifier === "AM" && h === 12) h = 0
      return h
    }
    const pHour = parseHour(bookingState.pickupTime)
    const rHour = parseHour(bookingState.returnTime)
    return Math.max(0, rHour - pHour)
  }, [isSameDayBooking, bookingState.pickupTime, bookingState.returnTime])

  const pricingResult = useMemo(() => {
    if (!car) {
      return {
        tier: "daily" as const,
        basePrice: 0,
        rateApplied: 0,
        rateLabel: "€0/day",
        durationText: "0 Days",
      }
    }
    return calculateRentalPrice({
      car,
      isSameDay: isSameDayBooking,
      sameDayHours,
      days,
    })
  }, [car, isSameDayBooking, sameDayHours, days])

  const deliveryFee = deliveryType === "custom" ? 20 : 0
  const returnFee = returnType === "custom" ? 20 : 0
  const effectiveDays = Math.max(1, days)
  const optionalServicesCost = useMemo(() => {
    const dailyTotal = AVAILABLE_OPTIONAL_SERVICES.filter((s) =>
      selectedServices.includes(s.id),
    ).reduce((acc, curr) => acc + curr.pricePerDay, 0)
    return dailyTotal * effectiveDays
  }, [selectedServices, effectiveDays])

  const securityDeposit = car?.securityDeposit != null ? car.securityDeposit : 700

  const rawRentalTotal = pricingResult.basePrice
  const discountedRentalTotal = rawRentalTotal * (1 - promoDiscount)
  const promoDiscountAmount = Number(
    (rawRentalTotal - discountedRentalTotal).toFixed(2),
  )
  const vatPercent =
    car?.vatRate != null && !isNaN(Number(car.vatRate))
      ? Number(car.vatRate)
      : 18

  const subtotalBeforeVat =
    discountedRentalTotal + deliveryFee + returnFee + optionalServicesCost
  const taxesAndFees = Number(
    (subtotalBeforeVat * (vatPercent / 100)).toFixed(2),
  )
  const totalAmount = Number((subtotalBeforeVat + taxesAndFees).toFixed(2))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      onNavigateAuth?.("checkout")
      return
    }
    if (!car) {
      alert(
        "No vehicle selected. Please choose a vehicle from the fleet catalog.",
      )
      return
    }

    const pickupParsed = Date.parse(bookingState.pickupDate)
    if (!isNaN(pickupParsed) && pickupParsed < Date.now() - 15 * 60 * 1000) {
      alert("Pickup date cannot be in the past. Please select a future date.")
      return
    }

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
      if (age < 18) {
        alert(
          `Driver must be at least 18 years old to rent a vehicle. (Calculated age: ${age} years old)`,
        )
        return
      }
    }

    if (driver.licenseExpiry) {
      const expiryParsed = Date.parse(driver.licenseExpiry)
      if (isNaN(expiryParsed)) {
        alert("Please enter a valid driver's license expiration date.")
        return
      }
      if (expiryParsed <= Date.now()) {
        alert(
          "Driver's license is expired. Please provide a valid, unexpired license.",
        )
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
      phone: customer.phone || currentUser?.phone || "+356 99827192",
      idNumber: customer.idNumber || driver.licenseNumber || undefined,
    }

    const effectiveSignature =
      clientSignature || `${finalCustomer.firstName} ${finalCustomer.lastName}`

    const combinedNotes = [
      tripDestination ? `${tripReason}: ${tripDestination}` : tripReason,
      remarks ? `Remarks: ${remarks}` : null,
      conditionNotes ? `Condition: ${conditionNotes}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

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
        promoCode:
          promoDiscount > 0 ? promoCode.trim().toUpperCase() : undefined,
        discountPercent:
          promoDiscount > 0 ? Math.round(promoDiscount * 100) : undefined,
        discountAmount:
          promoDiscount > 0
            ? Number((rawRentalTotal * promoDiscount).toFixed(2))
            : undefined,
        tripReason,
        notes: combinedNotes,
        deliveryType,
        deliveryLocationCustom:
          deliveryType === "custom" ? deliveryLocationCustom : undefined,
        deliveryFee,
        returnType,
        returnLocationCustom:
          returnType === "custom" ? returnLocationCustom : undefined,
        returnFee,
        optionalServices: selectedServices,
        optionalServicesCost,
        securityDeposit,
        remarks,
        clientSignature: effectiveSignature,
      })
      setIsSubmitting(false)
    }, 300)
  }

  if (!car) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900 font-heading">
          No Vehicle Selected
        </h2>
        <p className="text-stone-500 text-sm">
          Please choose a vehicle from our fleet catalog to proceed with
          reservation checkout.
        </p>
        <button
          type="button"
          onClick={onNavigateListing}
          className="px-6 py-2.5 bg-[#F97316] text-white font-bold rounded-xl hover:bg-[#EA580C] transition cursor-pointer text-sm shadow-xs"
        >
          Browse Fleet Vehicles
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 pb-28">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-[#F97316] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span>&gt;</span>
        <button
          type="button"
          onClick={onNavigateListing}
          className="hover:text-[#F97316] transition-colors cursor-pointer"
        >
          Fleet Inventory
        </button>
        <span>&gt;</span>
        <span className="text-stone-900 font-bold">
          Checkout &amp; Verification
        </span>
      </nav>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#17191C] font-heading">
          Complete Your Reservation Request
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Review your dates, provide your contact &amp; driver info, and submit
          your request directly to the Fleet Operations Manager.
        </p>
      </div>

      {/* Renter Authentication Banner */}
      {!currentUser && (
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Have an existing client profile with Pit Stop Car Hire?
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Sign in to auto-fill your saved credentials, verified driver
                license, and active privilege tiers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateAuth?.("checkout")}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
          >
            Sign In / Register Now →
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Column: Form Modules */}
        <div className="lg:col-span-8 space-y-6">
          <CheckoutCustomerForm
            customer={customer}
            setCustomer={setCustomer}
          />

          <CheckoutDriverIdForm
            driver={driver}
            setDriver={setDriver}
            maxDobStr={maxDobStr}
            minExpiryStr={minExpiryStr}
            uploadedFrontDataUrl={uploadedFrontDataUrl}
            uploadedFile={uploadedFile}
            uploadedBackDataUrl={uploadedBackDataUrl}
            uploadedBackFile={uploadedBackFile}
            fileInputRef={fileInputRef}
            fileBackInputRef={fileBackInputRef}
            onFileChange={handleFileChange}
          />

          <CheckoutDeliveryOptions
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            deliveryLocationCustom={deliveryLocationCustom}
            setDeliveryLocationCustom={setDeliveryLocationCustom}
            deliveryFee={deliveryFee}
            returnType={returnType}
            setReturnType={setReturnType}
            returnLocationCustom={returnLocationCustom}
            setReturnLocationCustom={setReturnLocationCustom}
            returnFee={returnFee}
          />

          <CheckoutOptionalServices
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            days={days}
          />

          <CheckoutRemarksAndExtension
            remarks={remarks}
            setRemarks={setRemarks}
          />

          <CheckoutConditionAndSignature
            clientSignature={clientSignature}
            setClientSignature={setClientSignature}
            conditionNotes={conditionNotes}
            setConditionNotes={setConditionNotes}
            onOpenLegalModal={(tab) => {
              setLegalModalTab(tab)
              setIsLegalModalOpen(true)
            }}
          />

          <CheckoutTripPurpose
            tripReason={tripReason}
            setTripReason={setTripReason}
            tripDestination={tripDestination}
            setTripDestination={setTripDestination}
          />

          {/* Pay on Pickup Guarantee Card */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                ✓
              </span>
              <div>
                <h2 className="text-base font-bold text-[#17191C] font-heading">
                  No Online Payment Required — Pay Upon Vehicle Pickup
                </h2>
                <p className="text-[11px] text-stone-500">
                  Zero advance charges • Pay directly at the garage when you
                  inspect the vehicle and collect the keys.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
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
                  <strong>€{totalAmount.toFixed(2)}</strong> at vehicle pickup.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-emerald-700 font-semibold">
                  <span>• No credit card required upfront</span>
                  <span>• Manager reviews &amp; confirms</span>
                  <span>• Free cancellation anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <CheckoutOrderSummary
          car={car}
          bookingState={bookingState}
          pricingResult={pricingResult}
          days={days}
          isSameDayBooking={isSameDayBooking}
          sameDayHours={sameDayHours}
          baseRental={rawRentalTotal}
          promoApplied={promoDiscount > 0}
          discountPercent={Math.round(promoDiscount * 100)}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoDiscountAmount={promoDiscountAmount}
          vatPercent={vatPercent}
          taxes={taxesAndFees}
          grandTotal={totalAmount}
          quoteMessage={promoStatus}
          isQuoteSuccess={isPromoSuccess}
          isValidatingPromo={isValidatingPromo}
          conflict={availabilityCheck.conflict}
          submitting={isSubmitting}
          deliveryFee={deliveryFee}
          returnFee={returnFee}
          optionalServicesCost={optionalServicesCost}
          selectedOptionalServices={selectedServices}
          securityDeposit={securityDeposit}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onOpenLegalModal={(tab) => {
            setLegalModalTab(tab)
            setIsLegalModalOpen(true)
          }}
        />
      </form>

      {/* Interactive US Regulatory & Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

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
