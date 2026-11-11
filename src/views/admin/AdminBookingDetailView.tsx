import React, { useState, useMemo, useEffect } from "react"
import type { BookingRecord, BookingStatus, Car, CarStatus } from "../../types"
import {
  ArrowRightIcon,
  CarIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  PhoneIcon,
  FileTextIcon,
  ShieldIcon,
  UserIcon,
  LocationIcon,
  AlertTriangleIcon,
  DownloadIcon,
  KeyIcon,
  SparklesIcon,
  StarIcon,
  CameraIcon,
} from "../../components/Icons"
import { getWhatsAppUrls, formatInternationalPhoneDisplay } from "../../utils/whatsapp"
import { downloadBookingInvoicePng, downloadBookingInvoicePdf } from "../../utils/invoiceGenerator"
import { calculateRentalPrice } from "../../utils/pricing"
import { api } from "../../services/api"

export interface AdminBookingDetailViewProps {
  booking: BookingRecord
  cars: Car[]
  onBack: () => void
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onOpenGiveKeys: (booking: BookingRecord) => void
  onOpenReturn: (booking: BookingRecord) => void
  onOpenInvoice: (booking: BookingRecord) => void
  onUpdateBooking?: (updated: BookingRecord) => void
  onReassignCar?: (bookingId: string, carId: string) => Promise<void>
  onShowToast?: (msg: string) => void
}

export default function AdminBookingDetailView({
  booking,
  cars,
  onBack,
  onApprove,
  onDecline,
  onOpenGiveKeys,
  onOpenReturn,
  onOpenInvoice,
  onUpdateBooking,
  onReassignCar,
  onShowToast,
}: AdminBookingDetailViewProps) {
  // Local state for interactive actions
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null)
  const [isReassigning, setIsReassigning] = useState(false)
  const [selectedNewCarId, setSelectedNewCarId] = useState<string>(booking.matchedCarId || "")
  const [isSavingCarMatch, setIsSavingCarMatch] = useState(false)
  const [adminNotes, setAdminNotes] = useState<string>(booking.notes || "")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Esc key listener to return back to orders list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxImage) {
          setLightboxImage(null)
        } else {
          onBack()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxImage, onBack])

  // Lookup matched vehicle
  const matchedCar = useMemo(() => {
    return cars.find((c) => c.id === booking.matchedCarId)
  }, [cars, booking.matchedCarId])

  // Available cars for assignment / reassignment
  const availableFleetCars = useMemo(() => {
    return cars.filter(
      (c) =>
        c.id === booking.matchedCarId ||
        !c.status ||
        c.status.toLowerCase() === "available"
    )
  }, [cars, booking.matchedCarId])

  // Customer display details
  const customerName = useMemo(() => {
    const first = booking.customer?.firstName || ""
    const last = booking.customer?.lastName || ""
    return `${first} ${last}`.trim() || "Valued Customer"
  }, [booking.customer])

  const customerPhone = booking.customer?.phone || ""
  const customerEmail = booking.customer?.email || ""

  // WhatsApp quick trigger
  const { webUrl: whatsAppUrl } = useMemo(() => {
    return getWhatsAppUrls(
      customerPhone,
      `Hello ${customerName}, this is Motorly Atelier Dispatch regarding your reservation ${booking.id}...`
    )
  }, [customerPhone, customerName, booking.id])

  // Duration & Pricing calculation
  const durationDays = useMemo(() => {
    try {
      const p = new Date(booking.pickupDate).getTime()
      const r = new Date(booking.returnDate).getTime()
      if (isNaN(p) || isNaN(r)) return 1
      const diff = Math.round((r - p) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 1
    } catch {
      return 1
    }
  }, [booking.pickupDate, booking.returnDate])

  const pricingBreakdown = useMemo(() => {
    if (!matchedCar) {
      return {
        tier: "daily" as const,
        basePrice: booking.totalAmount,
        rateApplied: Math.round(booking.totalAmount / durationDays),
        rateLabel: `€${Math.round(booking.totalAmount / durationDays)}/day`,
        durationText: `${durationDays} Days`,
      }
    }
    return calculateRentalPrice({
      car: matchedCar,
      isSameDay: durationDays <= 1 && booking.pickupDate === booking.returnDate,
      days: durationDays,
    })
  }, [matchedCar, durationDays, booking.pickupDate, booking.returnDate, booking.totalAmount])

  // Dynamic VAT computation based on vehicle configuration
  const vatRate = matchedCar?.vatRate ?? 20
  const grossTotal = booking.totalAmount || pricingBreakdown.basePrice || 0
  const netAmount = Math.round((grossTotal / (1 + vatRate / 100)) * 100) / 100
  const vatAmount = Math.round((grossTotal - netAmount) * 100) / 100

  // Lifecycle status badge determination
  const statusLower = (booking.status || "").toLowerCase()
  const isPending = statusLower.includes("pending") || statusLower.includes("advance")
  const isAssigned =
    statusLower.includes("assigned") ||
    statusLower.includes("approved") ||
    statusLower.includes("confirmed")
  const isActiveRental =
    statusLower.includes("checked out") ||
    statusLower.includes("checked_out") ||
    statusLower.includes("active")
  const isCompleted = statusLower.includes("completed")
  const isCancelled = statusLower.includes("cancelled") || statusLower.includes("declined")

  // Copy Booking ID to clipboard
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(booking.id)
      setIsCopied(true)
      if (onShowToast) onShowToast(`Booking Reference ${booking.id} copied to clipboard!`)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {}
  }

  // Handle Download Invoice PNG
  const handleDownloadPng = async () => {
    setIsDownloading(true)
    try {
      await downloadBookingInvoicePng(booking, matchedCar)
      if (onShowToast) onShowToast("Reservation manifest PNG invoice downloaded.")
    } catch (err: any) {
      alert("Failed to download PNG invoice: " + (err?.message || "Unknown error"))
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle Download Invoice PDF
  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      await downloadBookingInvoicePdf(booking, matchedCar)
      if (onShowToast) onShowToast("Official PDF invoice tax receipt downloaded.")
    } catch (err: any) {
      alert("Failed to download PDF invoice: " + (err?.message || "Unknown error"))
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle Car Reassignment / Mating
  const handleSaveCarReassignment = async () => {
    if (!selectedNewCarId || selectedNewCarId === booking.matchedCarId) {
      setIsReassigning(false)
      return
    }
    setIsSavingCarMatch(true)
    try {
      if (onReassignCar) {
        await onReassignCar(booking.id, selectedNewCarId)
      } else {
        const res = await api.mateCar(booking.id, selectedNewCarId)
        if (res.booking && onUpdateBooking) {
          onUpdateBooking(res.booking)
        }
      }
      setIsReassigning(false)
      if (onShowToast) onShowToast(`Vehicle successfully assigned to booking ${booking.id}!`)
    } catch (err: any) {
      alert("Failed to reassign vehicle: " + (err?.message || "Unknown error"))
    } finally {
      setIsSavingCarMatch(false)
    }
  }

  // Handle Saving Internal Admin Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      const res = await api.updateBookingStatus(booking.id, {
        status: booking.status,
        notes: adminNotes,
      })
      if (res.booking && onUpdateBooking) {
        onUpdateBooking(res.booking)
      }
      if (onShowToast) onShowToast("Internal dispatcher notes updated successfully.")
    } catch (err: any) {
      alert("Failed to save notes: " + (err?.message || "Unknown error"))
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Handle Accept Action
  const handleAcceptClick = async () => {
    setIsProcessingAction(true)
    try {
      await onApprove(booking.id)
      if (onShowToast) onShowToast(`Booking ${booking.id} cleared & approved!`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Handle Decline Action
  const handleDeclineClick = async () => {
    if (!window.confirm("Are you sure you want to decline this reservation request?")) return
    setIsProcessingAction(true)
    try {
      await onDecline(booking.id)
      if (onShowToast) onShowToast(`Booking ${booking.id} has been declined.`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Driver license images & country details
  const driverLicenseCountry = booking.driver?.licenseState || "Not Specified"
  const driverLicenseNumber = booking.driver?.licenseNumber || "Pending Verification"
  const driverLicenseExpiry = booking.driver?.licenseExpiry || "On Pickup Check"
  const driverDob = booking.driver?.dateOfBirth || "On File"
  const licensePhotoFront = booking.driver?.licensePhotoFront
  const licensePhotoBack = booking.driver?.licensePhotoBack

  return (
    <div className="space-y-6 pb-12 animate-fadeIn font-sans">
      {/* 1. Header Command Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 shadow-xs">
        {/* Breadcrumb & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold border border-stone-200 transition"
              title="Return to Orders & Dispatch table (Esc)"
            >
              <span className="text-sm">←</span>
              <span>Back to Orders & Dispatch</span>
              <span className="hidden sm:inline-block text-[10px] text-stone-400 font-mono ml-1 px-1.5 py-0.5 rounded bg-stone-200/60">
                ESC
              </span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="font-medium text-stone-500">Orders & Dispatch</span>
            <span className="text-stone-300">/</span>
            <span className="font-mono font-bold text-stone-900">{booking.id}</span>
          </div>

          {/* Quick External Actions */}
          <div className="flex items-center gap-2">
            {customerPhone && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
              >
                <PhoneIcon size={12} />
                <span>WhatsApp Client</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 transition disabled:opacity-50"
              title="Download official PDF Tax Invoice"
            >
              <DownloadIcon size={12} />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 transition disabled:opacity-50"
              title="Download high-res PNG manifest"
            >
              <FileTextIcon size={12} />
              <span>PNG</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 transition"
              title="Print Booking Manifest"
            >
              <span>🖨</span>
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Title, Status, and Primary Dispatch Trigger */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight flex items-center gap-2">
                <span>{booking.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded text-stone-400 hover:text-stone-700 transition"
                  title="Copy Booking ID"
                >
                  {isCopied ? (
                    <span className="text-[10px] text-emerald-600 font-sans font-bold">✓ Copied</span>
                  ) : (
                    <span className="text-xs">📋</span>
                  )}
                </button>
              </h1>

              {/* Lifecycle Stage Badge */}
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Needs Clearance / Approval</span>
                </span>
              )}
              {isAssigned && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">
                  <KeyIcon size={12} />
                  <span>Ready for Pickup • Key Handover</span>
                </span>
              )}
              {isActiveRental && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Active On Road • Dispatched</span>
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
                  <CheckIcon size={12} />
                  <span>Completed & Audited</span>
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300">
                  <span>✕</span>
                  <span>Cancelled / Declined</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-2">
              <span className="flex items-center gap-1">
                <CalendarIcon size={13} className="text-stone-400" />
                <span>Reserved: {new Date(booking.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <LocationIcon size={13} className="text-stone-400" />
                <span>Station: {booking.pickupLocation || "Motorly Atelier Flagship Facility"}</span>
              </span>
            </div>
          </div>

          {/* Contextual Primary Action Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleAcceptClick}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <CheckIcon size={14} />
                  <span>Accept & Clear Booking</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleDeclineClick}
                  className="h-10 px-3.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition disabled:opacity-50"
                >
                  Decline Request
                </button>
              </>
            )}

            {isAssigned && (
              <button
                type="button"
                onClick={() => onOpenGiveKeys(booking)}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <KeyIcon size={14} />
                <span>Handover Keys & Dispatch</span>
              </button>
            )}

            {isActiveRental && (
              <button
                type="button"
                onClick={() => onOpenReturn(booking)}
                className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <CheckIcon size={14} />
                <span>Audit Return Inspection</span>
              </button>
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={() => onOpenInvoice(booking)}
                className="h-10 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <FileTextIcon size={14} />
                <span>View Official Invoice</span>
              </button>
            )}

            {/* Quick Invoice Trigger for any status */}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => onOpenInvoice(booking)}
                className="h-10 px-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <FileTextIcon size={13} />
                <span>Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Overview KPI Ribbon (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Contract Value */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Total Billed Contract
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            €{grossTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Incl. {vatRate}% VAT (€{vatAmount})</span>
          </div>
        </div>

        {/* KPI 2: Rental Duration */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Scheduled Duration
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {durationDays} {durationDays === 1 ? "Day" : "Days"}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {durationDays * 24} Hours Total Rental
          </div>
        </div>

        {/* KPI 3: Fleet Asset */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Assigned Vehicle
          </div>
          <div className="text-base font-bold text-stone-900 mt-1 truncate">
            {matchedCar ? matchedCar.name : "Unassigned Vehicle"}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate font-mono">
            {matchedCar?.plateNumber || "Needs Vehicle Match"}
          </div>
        </div>

        {/* KPI 4: Driver License Country */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Driver License Country
          </div>
          <div className="text-base font-bold text-stone-900 mt-1 truncate">
            {driverLicenseCountry}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Lic: {driverLicenseNumber}
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer & Driver Dossier, Vehicle & Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Profile & Primary Driver Verification Dossier */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Client & Verified Driver Dossier
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Identity authentication, primary contact channels, and driver credentials.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                Primary Lessee
              </span>
            </div>

            {/* Client Bio Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/70 rounded-xl p-4 border border-stone-100">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Full Customer Name
                </div>
                <div className="text-sm font-black text-stone-900 mt-0.5">
                  {customerName}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-800">
                    Verified Customer Profile
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Direct Phone & WhatsApp
                </div>
                <div className="text-xs font-mono font-bold text-stone-900 mt-0.5 flex items-center gap-2">
                  <span>{formatInternationalPhoneDisplay(customerPhone) || "—"}</span>
                  {customerPhone && (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-sans font-bold hover:bg-emerald-200 transition"
                    >
                      <PhoneIcon size={9} />
                      WhatsApp
                    </a>
                  )}
                </div>
                {customerEmail && (
                  <div className="text-[11px] text-stone-500 mt-1 truncate">
                    <a href={`mailto:${customerEmail}`} className="hover:text-stone-900 hover:underline">
                      {customerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Driver License Specifics (Explicit Country & ID) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldIcon size={13} className="text-stone-400" />
                  Driver's License Specifications
                </span>
                <span className="text-[11px] font-semibold text-stone-500">
                  Age Clearance: 18+ Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] font-bold uppercase text-stone-400">License Number</span>
                  <p className="font-mono font-bold text-stone-900 mt-0.5 truncate">
                    {driverLicenseNumber}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Country</span>
                  <p className="font-bold text-stone-900 mt-0.5 truncate">
                    {driverLicenseCountry}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Expiry Date</span>
                  <p className="font-bold text-stone-900 mt-0.5 truncate">
                    {driverLicenseExpiry}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Date of Birth</span>
                  <p className="font-bold text-stone-900 mt-0.5 truncate">
                    {driverDob}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver License Photo Documents Lightbox Cards */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Uploaded Driver's License Document Scans
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Front of License */}
                <div className="relative group rounded-xl border border-stone-200 overflow-hidden bg-stone-50 p-3">
                  <div className="text-[10px] font-bold uppercase text-stone-400 mb-1.5 flex items-center justify-between">
                    <span>Front Photo of License</span>
                    <span className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1 rounded">
                      {licensePhotoFront ? "Uploaded" : "Pending In-Person"}
                    </span>
                  </div>
                  {licensePhotoFront ? (
                    <div
                      onClick={() => setLightboxImage({ url: licensePhotoFront, title: `Driver License Front (${customerName})` })}
                      className="cursor-pointer relative aspect-16/10 rounded-lg overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center group"
                    >
                      <img
                        src={licensePhotoFront}
                        alt="Driver License Front"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <span>🔍 Click to Zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-16/10 rounded-lg border border-dashed border-stone-300 bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
                      <CameraIcon size={24} className="text-stone-400 mb-1" />
                      <span className="text-xs font-semibold text-stone-600">Physical Check Required</span>
                      <span className="text-[10px] text-stone-400 mt-0.5">Inspect physical ID card at garage key handover</span>
                    </div>
                  )}
                </div>

                {/* Back of License */}
                <div className="relative group rounded-xl border border-stone-200 overflow-hidden bg-stone-50 p-3">
                  <div className="text-[10px] font-bold uppercase text-stone-400 mb-1.5 flex items-center justify-between">
                    <span>Back Photo of License</span>
                    <span className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1 rounded">
                      {licensePhotoBack ? "Uploaded" : "Pending In-Person"}
                    </span>
                  </div>
                  {licensePhotoBack ? (
                    <div
                      onClick={() => setLightboxImage({ url: licensePhotoBack, title: `Driver License Back (${customerName})` })}
                      className="cursor-pointer relative aspect-16/10 rounded-lg overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center group"
                    >
                      <img
                        src={licensePhotoBack}
                        alt="Driver License Back"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <span>🔍 Click to Zoom</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-16/10 rounded-lg border border-dashed border-stone-300 bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
                      <CameraIcon size={24} className="text-stone-400 mb-1" />
                      <span className="text-xs font-semibold text-stone-600">Physical Check Required</span>
                      <span className="text-[10px] text-stone-400 mt-0.5">Driver license reverse barcode verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fleet Asset, Garage Bay & Reassignment Tool */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CarIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Allocated Vehicle & Garage Bay Logistics
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Assigned fleet asset, license plate, garage bay stall, and re-allocation controls.
                  </p>
                </div>
              </div>

              {!isActiveRental && !isCompleted && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setIsReassigning((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
                >
                  {isReassigning ? "Cancel Swap" : "Swap Vehicle"}
                </button>
              )}
            </div>

            {/* Vehicle Reassignment Dropdown Panel */}
            {isReassigning && (
              <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950">
                    Select Replacement Fleet Vehicle:
                  </span>
                  <span className="text-[10px] font-semibold text-orange-800">
                    {availableFleetCars.length} available
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedNewCarId}
                    onChange={(e) => setSelectedNewCarId(e.target.value)}
                    className="flex-1 h-9 px-3 text-xs bg-white border border-stone-300 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">-- Choose fleet car --</option>
                    {availableFleetCars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} • {c.plateNumber || "No Plate"} • €{c.pricePerDay}/day ({c.type})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isSavingCarMatch || !selectedNewCarId}
                    onClick={handleSaveCarReassignment}
                    className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition disabled:opacity-50 shrink-0"
                  >
                    {isSavingCarMatch ? "Saving..." : "Confirm Vehicle Mating"}
                  </button>
                </div>
              </div>
            )}

            {/* Matched Car Presentation Card */}
            {matchedCar ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-stone-50/70 rounded-xl p-4 border border-stone-200/70">
                <img
                  src={matchedCar.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"}
                  alt={matchedCar.name}
                  onClick={() => setLightboxImage({ url: matchedCar.image, title: matchedCar.name })}
                  className="w-full sm:w-36 h-24 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0 cursor-pointer hover:opacity-95 transition"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-black text-stone-900 truncate">
                      {matchedCar.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                      {matchedCar.type || "Luxury"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-900 text-white border border-stone-800">
                      {matchedCar.plateNumber || "M-LUX-777"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-stone-600">
                    <div>
                      <span className="text-stone-400">Year:</span>{" "}
                      <span className="font-semibold text-stone-800">{matchedCar.year || 2024}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Transmission:</span>{" "}
                      <span className="font-semibold text-stone-800">{matchedCar.transmission || "Automatic"}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Fuel:</span>{" "}
                      <span className="font-semibold text-stone-800">{matchedCar.fuelType || "Petrol"}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Seats:</span>{" "}
                      <span className="font-semibold text-stone-800">{matchedCar.seats || 5}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Daily Rate:</span>{" "}
                      <span className="font-bold text-stone-900">€{matchedCar.pricePerDay}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">VAT Rate:</span>{" "}
                      <span className="font-semibold text-stone-800">{matchedCar.vatRate || 20}%</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Deposit:</span>{" "}
                      <span className="font-bold text-stone-900">
                        €{(matchedCar.securityDeposit != null ? matchedCar.securityDeposit : 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Garage Bay Location */}
                  <div className="pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <LocationIcon size={12} className="text-orange-500" />
                      <span className="font-bold text-stone-900">
                        {matchedCar.garageBay ? `Garage Stall: ${matchedCar.garageBay}` : "Garage Bay: Stall 14-A"}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500">
                        {matchedCar.garageName || "Atelier Central Hub"}
                      </span>
                    </div>
                    {matchedCar.garageAddress && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(matchedCar.garageAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 text-center space-y-2">
                <AlertTriangleIcon size={24} className="text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-amber-900">No Vehicle Mated Yet</h4>
                <p className="text-xs text-amber-700 max-w-md mx-auto">
                  This reservation has not been assigned a specific fleet vehicle. Select an available car below to allocate keys and prepare the bay.
                </p>
                <button
                  type="button"
                  onClick={() => setIsReassigning(true)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition"
                >
                  Allocate Fleet Vehicle Now
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Schedule, Route & Purpose */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center font-bold">
                <CalendarIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Rental Schedule, Logistics & Purpose
                </h3>
                <p className="text-[11px] text-stone-500">
                  Station pickup/return schedule and stated customer travel itinerary.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup schedule */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Scheduled Pickup
                </span>
                <p className="text-sm font-black text-stone-900 mt-1">
                  {booking.pickupDate}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Location: {booking.pickupLocation || "Motorly Atelier Flagship Facility"}
                </p>
              </div>

              {/* Return schedule */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Scheduled Return
                </span>
                <p className="text-sm font-black text-stone-900 mt-1">
                  {booking.returnDate}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Location: {booking.returnLocation || booking.pickupLocation || "Motorly Atelier Flagship Facility"}
                </p>
              </div>
            </div>

            {/* Trip Reason / Customer Notes */}
            <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Trip Purpose & Customer Notes
                </span>
                <span className="text-[11px] font-semibold text-stone-600">
                  {booking.tripReason || "Executive / Vacation Travel"}
                </span>
              </div>
              <p className="text-stone-700 italic">
                {booking.notes ? `"${booking.notes}"` : "No special logistics requested by customer."}
              </p>
            </div>

            {/* Pit Stop Car Hire Paper Agreement Parameters */}
            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                <span className="font-bold text-orange-950 font-heading text-xs flex items-center gap-1.5">
                  <span>PIT STOP RENTAL AGREEMENT SPECIFICATIONS</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                  36 Triq Il-Kbira, Mgarr
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-stone-500 block">Delivery to Location:</span>
                  <span className="font-bold text-stone-900">
                    {booking.deliveryType === "custom"
                      ? `${booking.deliveryLocationCustom || "Custom Location"} (+€${booking.deliveryFee || 20})`
                      : "Central Garage Mgarr (€0 Free)"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Return to Location:</span>
                  <span className="font-bold text-stone-900">
                    {booking.returnType === "custom"
                      ? `${booking.returnLocationCustom || "Custom Location"} (+€${booking.returnFee || 20})`
                      : "Central Garage Mgarr (€0 Free)"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Optional Services Hired:</span>
                  <span className="font-bold text-stone-900">
                    {booking.optionalServices && booking.optionalServices.length > 0
                      ? `${booking.optionalServices.join(", ")} (+€${booking.optionalServicesCost || 0})`
                      : "None (Standard hire)"}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Insurance Excess Deposit (Clause 4):</span>
                  <span className="font-bold text-stone-900">
                    €{booking.securityDeposit != null ? booking.securityDeposit : 700} (Pre-authorized hold)
                  </span>
                </div>
              </div>

              {booking.remarks && (
                <div className="pt-2 border-t border-orange-100 text-[11px]">
                  <span className="text-stone-500 font-semibold">Remarks on Manifest: </span>
                  <span className="text-stone-900">{booking.remarks}</span>
                </div>
              )}

              {/* Client signature badge */}
              <div className="flex items-center justify-between pt-2 border-t border-orange-100 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${booking.clientSignature ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="font-semibold text-stone-800">
                    Client Signature: {booking.clientSignature ? "Endorsed & Attached" : "Pending Handover Verification"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadBookingInvoicePdf(booking, matchedCar)}
                  className="px-2.5 py-1 rounded bg-stone-900 hover:bg-black text-white font-bold text-[10px] transition cursor-pointer"
                >
                  Download Pit Stop Agreement PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown, Telemetry & Operations Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 4: 4-Tier Pricing Breakdown & VAT Audit */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileTextIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Pricing & VAT Architecture
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    4-tier rental rate, insurance protection, and VAT invoice calculation.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                {pricingBreakdown.tier} Rate
              </span>
            </div>

            {/* Pricing Line Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Base Rental ({durationDays} days @ {pricingBreakdown.rateLabel})</span>
                <span className="font-mono font-semibold text-stone-900">€{netAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1">
                  <ShieldIcon size={11} className="text-emerald-600" />
                  <span>Comprehensive Premium Shield</span>
                </span>
                <span className="text-emerald-700 font-semibold font-mono">€0.00 (Included)</span>
              </div>

              {booking.promoCode && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Privilege Code ({booking.promoCode})</span>
                  <span className="font-mono font-bold">-€10.00</span>
                </div>
              )}

              <div className="flex items-center justify-between text-stone-600">
                <span>Dynamic Vehicle VAT ({vatRate}%)</span>
                <span className="font-mono font-semibold text-stone-900">€{vatAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-stone-900">Total Gross Contract</div>
                  <div className="text-[10px] text-stone-500">Pay at Garage Counter Pickup</div>
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono">
                  €{grossTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Security Deposit Terms */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-[11px] text-stone-600 flex items-start gap-2">
              <ShieldIcon size={14} className="text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-800">Refundable Security Deposit:</span>{" "}
                <span>
                  €{(matchedCar?.securityDeposit != null ? matchedCar.securityDeposit : 1000).toLocaleString()}.00 pre-authorization held at key handover, automatically released upon undamaged return audit.
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Telemetry & Handover Inspection Audit */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
                <KeyIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Dispatch & Inspection Audit Log
                </h3>
                <p className="text-[11px] text-stone-500">
                  Key handoff odometer, fuel levels, and return verification.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Handover Telemetry */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <KeyIcon size={12} className="text-blue-500" />
                    Key Handover Outbound
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    {booking.keysHandedAt ? "Completed" : "Pending Handover"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-600 text-[11px]">
                  <div>Odometer Out: <span className="font-bold text-stone-900">{booking.odometerOut ? `${booking.odometerOut} km` : "At Handover"}</span></div>
                  <div>Fuel Out: <span className="font-bold text-stone-900">{booking.fuelLevelOut || "Full 100%"}</span></div>
                </div>
              </div>

              {/* Return Telemetry */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <CheckIcon size={12} className="text-emerald-500" />
                    Inbound Return Inspection
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    {isCompleted ? "Audited & Passed" : "Pending Return"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-600 text-[11px]">
                  <div>Odometer In: <span className="font-bold text-stone-900">{booking.odometerIn ? `${booking.odometerIn} km` : "Pending Return"}</span></div>
                  <div>Cleanliness: <span className="font-bold text-stone-900">{isCompleted ? "Verified Clean" : "Pending Check"}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Internal Dispatcher Operations Notes */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Station Dispatcher Notes
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">Internal Record</span>
            </div>

            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal station notes, driver instructions, or handover checklist remarks..."
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {isSavingNotes ? "Saving..." : "Save Station Notes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Lightbox Modal for License & Car Images */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-stone-900 rounded-2xl max-w-3xl w-full p-4 border border-stone-700 shadow-2xl space-y-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-bold tracking-wide">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-hidden rounded-xl bg-black flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <span>Press ESC or click anywhere outside to close</span>
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline font-semibold"
              >
                Open Original in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
