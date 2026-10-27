import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import type { Car, BookingState, CustomerInfo } from "../types"
import { api } from "../services/api"
import { getWhatsAppUrls } from "../utils/whatsapp"
import {
  CheckIcon,
  CalendarIcon,
  LocationIcon,
  QrCodeIcon,
  ClockIcon,
  UserIcon,
  ShieldIcon,
  ArrowRightIcon,
  CarIcon,
} from "../components/Icons"

interface ConfirmationModalProps {
  bookingId: string
  car: Car
  bookingState: BookingState
  customer: CustomerInfo
  totalAmount: number
  onClose: () => void
  onNavigateHome: () => void
  onNavigateListing: () => void
  onNavigateAdmin?: () => void
  onNavigateMyBookings?: () => void
}

export default function ConfirmationModal({
  bookingId,
  car,
  bookingState,
  customer,
  totalAmount,
  onClose,
  onNavigateHome,
  onNavigateListing,
  onNavigateAdmin,
  onNavigateMyBookings,
}: ConfirmationModalProps) {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false)
  const [studioSettings, setStudioSettings] = useState<{
    contact_phone?: string
    contact_email?: string
    admin_name?: string
  }>({
    contact_phone: "7780740223",
    contact_email: "nanikoushik96@gmail.com",
    admin_name: "Studio Director",
  })

  useEffect(() => {
    let isMounted = true
    api
      .getSettings()
      .then((s) => {
        if (isMounted && s && s.contact_phone) {
          setStudioSettings((prev) => ({ ...prev, ...s }))
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  // Direct Admin link for rapid verification & approval
  const adminApprovalLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?view=admin&bookingId=${bookingId}`
      : `https://motorly-ten.vercel.app/?view=admin&bookingId=${bookingId}`

  // Standardized Template-Based Dispatch Message for WhatsApp & Email
  const templateMessageText = `*🚗 MOTORLY FLEET DISPATCH - NEW RESERVATION ALERT*
----------------------------------------
*Reservation ID:* ${bookingId}
*Status:* 🟡 Pending Fleet Manager Approval

*VEHICLE SPECIFICATIONS*
• Vehicle: ${car.name} (${car.year || 2024})
• Category: ${car.type || "Sedan"} • ${car.transmission || "Automatic"} • ${car.fuelType || "Gasoline"}
• License Plate: ${car.plateNumber || "FL-492-MTR"}
• Daily Rental Rate: $${car.pricePerDay || 45}/day
• Assigned Hub: ${car.garageName || car.location || bookingState.pickupLocation}

*RENTAL SCHEDULE & TIMING*
• Pickup Date & Time: ${bookingState.pickupDate} at ${bookingState.pickupTime || "10:00 AM"}
• Return Date & Time: ${bookingState.returnDate} at ${bookingState.returnTime || "10:00 AM"}
• Duration: ${bookingState.pickupDate === bookingState.returnDate ? "Same-Day Rental" : `${bookingState.pickupDate} → ${bookingState.returnDate}`}

*CLIENT & DRIVER CREDENTIALS*
• Primary Driver: ${customer.firstName} ${customer.lastName}
• Phone: ${customer.phone || "Not provided"}
• Email: ${customer.email}
• Driver License: ${customer.driverLicenseNum || "On file in verification vault"}

*FINANCIAL SUMMARY*
• Total Rental Amount: $${totalAmount.toFixed(2)} (Payable at hub upon key handoff)
• Security Deposit: $200.00 (Standard pre-authorization hold)

----------------------------------------
*⚡ DIRECT ADMIN APPROVAL LINK:*
${adminApprovalLink}
(Click to review driver credentials and accept reservation instantly)`

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(templateMessageText)
    setCopiedWhatsApp(true)
    setTimeout(() => setCopiedWhatsApp(false), 3000)
  }

  const whatsAppUrls = getWhatsAppUrls(studioSettings.contact_phone, templateMessageText)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#141518] text-[#17191C] dark:text-stone-100 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto border border-stone-200 dark:border-stone-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          data-testid="close-confirmation-modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800/60">
            <CheckIcon size={28} />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            Request Dispatched • Awaiting Manager Approval
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Booking Request Submitted!
          </h2>
          <p className="text-xs text-gray-500 dark:text-stone-400 max-w-md mx-auto">
            Zero online payment charged. A formal notification has been
            dispatched via Email & WhatsApp with direct access for the fleet
            manager to review and approve your reservation.
          </p>
        </div>

        {/* Boarding Pass Style Voucher */}
        <div className="rounded-2xl bg-gray-50 dark:bg-stone-900/60 border border-gray-200 dark:border-stone-800 p-4 sm:p-5 space-y-3.5 text-xs relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-stone-800 pb-3">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                Reservation Reference
              </p>
              <p className="font-extrabold text-[#F97316] text-base font-mono">
                {bookingId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                Primary Driver
              </p>
              <p className="font-bold text-gray-800 dark:text-stone-200 text-sm">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 shrink-0">
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white font-heading text-sm truncate">
                {car.name}
              </h4>
              <p className="text-gray-500 dark:text-stone-400 text-[11px]">
                {car.type} • {car.transmission} •{" "}
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                  {car.plateNumber || "FL-492-MTR"}
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                Pay on Pickup
              </p>
              <p className="font-extrabold text-base text-gray-900 dark:text-white font-mono">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Timing & Location */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-1 text-gray-400 dark:text-stone-500 font-semibold mb-0.5">
                <LocationIcon size={12} className="text-[#F97316]" />
                <span>Station Hub</span>
              </div>
              <p className="font-bold text-gray-800 dark:text-stone-200 text-[11px] leading-tight truncate">
                {car.garageName ||
                  car.garageAddress ||
                  car.location ||
                  bookingState.pickupLocation}
              </p>
              {car.garageBay && (
                <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1 rounded">
                  {car.garageBay}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1 text-gray-400 dark:text-stone-500 font-semibold mb-0.5">
                <CalendarIcon size={12} className="text-[#F97316]" />
                <span>Schedule & Time</span>
              </div>
              <p className="font-bold text-gray-800 dark:text-stone-200 text-[11px] leading-tight">
                {bookingState.pickupDate === bookingState.returnDate ? (
                  <>
                    {bookingState.pickupDate}{" "}
                    <span className="text-[#F97316] font-bold text-[10px]">
                      (⚡ Same-Day)
                    </span>
                  </>
                ) : (
                  `${bookingState.pickupDate} → ${bookingState.returnDate}`
                )}
              </p>
              <p className="text-gray-500 dark:text-stone-400 text-[10px] mt-0.5 font-mono font-medium">
                {bookingState.pickupTime || "10:00 AM"} →{" "}
                {bookingState.returnTime || "10:00 AM"}
              </p>
            </div>
          </div>
        </div>

        {/* Automated Dispatch Notification Box (Direct WhatsApp Web & App) */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 space-y-3 bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Direct WhatsApp Dispatch</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Direct Redirect Active
            </span>
          </div>

          {/* Recipient Details & Landing Page Bypass Notice */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] bg-white/80 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500">📲</span>
              <span className="text-stone-500 dark:text-stone-400">Dispatch Recipient:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {whatsAppUrls.displayPhone}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              ⚡ Direct to Chat
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Primary: Direct WhatsApp Web link */}
            <a
              href={whatsAppUrls.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="direct-whatsapp-web-btn"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              title="Bypasses landing screen and opens directly in WhatsApp Web"
            >
              <span className="text-sm">🌐</span>
              <span>Open in WhatsApp Web</span>
            </a>

            {/* Direct WhatsApp App protocol link */}
            <a
              href={whatsAppUrls.appUrl}
              data-testid="direct-whatsapp-app-btn"
              className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-stone-800 dark:border-stone-700"
              title="Directly opens WhatsApp Desktop on PC/Mac or WhatsApp App on Phone"
            >
              <span className="text-sm">💻</span>
              <span>Open WhatsApp App</span>
            </a>
          </div>

          <div className="flex items-center justify-between pt-0.5 gap-2">
            {/* Copy Template Text */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              data-testid="copy-whatsapp-template-btn"
              className={`py-1.5 px-3 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                copiedWhatsApp
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300"
                  : "bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
              }`}
            >
              <span>{copiedWhatsApp ? "✓" : "📋"}</span>
              <span>{copiedWhatsApp ? "Template Copied!" : "Copy Template Text"}</span>
            </button>

            {/* Email Preview Trigger */}
            <button
              type="button"
              onClick={() => setIsEmailPreviewOpen(true)}
              className="text-[#F97316] hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <span>View Dispatch Email</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Direct Admin Review & Approval Button */}
          {onNavigateAdmin && (
            <button
              onClick={() => {
                onClose()
                onNavigateAdmin()
              }}
              className="w-full py-3 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Open Request in Admin Console & Approve</span>
              <ArrowRightIcon size={14} />
            </button>
          )}

          {onNavigateMyBookings && (
            <button
              onClick={() => {
                onClose()
                onNavigateMyBookings()
              }}
              className="w-full py-2.5 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎟️ View Digital Boarding Pass in My Trips</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose()
                onNavigateListing()
              }}
              className="py-2.5 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Browse Fleet
            </button>
            <button
              onClick={() => {
                onClose()
                onNavigateHome()
              }}
              className="py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Email Dispatch Preview Modal */}
      {isEmailPreviewOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
          onClick={() => setIsEmailPreviewOpen(false)}
        >
          <div
            className="bg-white text-stone-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-stone-200 animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-black text-sm">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    MOTORLY Dispatch Email Template
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">
                    To: {studioSettings.contact_email || "concierge@motorly.com"} &amp; {customer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated HTML Email Body */}
            <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50 space-y-4 text-xs">
              <div className="text-center pb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                  ACTION REQUIRED • MANAGER APPROVAL
                </span>
                <h4 className="text-lg font-black mt-2 text-stone-900">
                  New Reservation Request: {bookingId}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  A client has submitted a reservation and is awaiting clearance.
                </p>
              </div>

              {/* Vehicle & Customer Table */}
              <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-16 h-12 rounded-lg object-cover border"
                  />
                  <div>
                    <span className="font-bold text-sm block">{car.name}</span>
                    <span className="text-[11px] text-stone-500">
                      Plate: {car.plateNumber || "FL-492-MTR"} • {car.type}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">
                      Driver
                    </span>
                    <span className="font-semibold">
                      {customer.firstName} {customer.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">
                      Phone / Email
                    </span>
                    <span className="font-mono text-stone-600 truncate block">
                      {customer.phone || customer.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">
                      Schedule
                    </span>
                    <span className="font-semibold">
                      {bookingState.pickupDate} ({bookingState.pickupTime || "10:00 AM"})
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-mono text-[9px] uppercase">
                      Total Due
                    </span>
                    <span className="font-bold text-emerald-600 font-mono">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call to action in email */}
              <div className="pt-2 text-center space-y-2">
                <a
                  href={adminApprovalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
                >
                  Review &amp; Approve Reservation in Admin Console →
                </a>
                <p className="text-[10px] text-stone-400">
                  Direct deep link: {adminApprovalLink}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEmailPreviewOpen(false)}
              className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Close Email Preview
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
