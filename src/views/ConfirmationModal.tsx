import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import type { Car, BookingState, CustomerInfo } from "../types"
import { api } from "../services/api"
import { getWhatsAppUrls, isMobileDevice } from "../utils/whatsapp"
import { getEmailUrls } from "../utils/email"
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

  // Standardized Template-Based Dispatch Message for WhatsApp
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
• Pickup Station: ${bookingState.pickupLocation}

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

  // Standardized Template-Based Dispatch Message for Email (Gmail / Mailto)
  const emailSubject = `🚗 [MOTORLY FLEET DISPATCH] New Booking Request: ${bookingId} (${car.name})`
  const emailBodyText = `MOTORLY FLEET DISPATCH - NEW RESERVATION ALERT
========================================
Reservation Reference: ${bookingId}
Lifecycle Status: Pending Fleet Manager Clearance

VEHICLE SPECIFICATIONS:
• Model: ${car.name} (${car.year || 2024})
• Category: ${car.type || "Sedan"} • ${car.transmission || "Automatic"}
• License Plate: ${car.plateNumber || "FL-492-MTR"}
• Daily Rental Rate: $${car.pricePerDay || 45}/day
• Stationed Hub: ${car.garageName || car.garageAddress || car.location || bookingState.pickupLocation}

RENTAL SCHEDULE & TIMING:
• Pickup Date & Time: ${bookingState.pickupDate} at ${bookingState.pickupTime || "10:00 AM"}
• Return Date & Time: ${bookingState.returnDate} at ${bookingState.returnTime || "10:00 AM"}
• Station Location: ${bookingState.pickupLocation}

CLIENT & DRIVER CREDENTIALS:
• Primary Driver: ${customer.firstName} ${customer.lastName}
• Direct Phone: ${customer.phone || "Not provided"}
• Email: ${customer.email}
• Driver License: ${customer.driverLicenseNum || "On file in verification vault"}

FINANCIAL AUDIT:
• Total Estimated Rental: $${totalAmount.toFixed(2)} (Payable at hub counter upon key handoff)
• Security Deposit Hold: $200.00 (Standard refundable pre-authorization)

========================================
DIRECT FLEET MANAGER REVIEW & APPROVAL LINK:
${adminApprovalLink}
(Click the link above to inspect driver credentials and accept or decline the reservation)`

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(templateMessageText)
    setCopiedWhatsApp(true)
    setTimeout(() => setCopiedWhatsApp(false), 3000)
  }

  const whatsAppUrls = getWhatsAppUrls(studioSettings.contact_phone, templateMessageText)
  const emailUrls = getEmailUrls(studioSettings.contact_email, emailSubject, emailBodyText)
  const isMobile = isMobileDevice()

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#141518] text-[#17191C] dark:text-stone-100 rounded-3xl max-w-xl w-full max-h-[94vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto border border-stone-200 dark:border-stone-800 animate-scale-up"
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
            Request Logged in Database • Pending Approval
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Booking Request Submitted!
          </h2>
          <p className="text-xs text-gray-500 dark:text-stone-400 max-w-md mx-auto">
            Zero online payment charged. Please alert the Fleet Manager via <strong>WhatsApp</strong> or <strong>Email</strong> below to approve and prep your vehicle.
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

        {/* ============================================================== */}
        {/* DEDICATED DISPATCH CENTER (WHATSAPP & EMAIL TO ADMIN) */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-4 bg-stone-50/80 dark:bg-stone-900/50">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Send Booking Request to Admin</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1-Click Dispatch
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Notify the fleet manager with pre-filled details so they can review credentials and release the car.
            </p>
          </div>

          {/* CHANNEL 1: WHATSAPP DISPATCH */}
          <div className="rounded-2xl bg-white dark:bg-stone-800/90 p-3.5 border border-stone-200 dark:border-stone-700/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <span className="text-base">💬</span>
                <span>WhatsApp Notification</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-stone-300">
                Admin: {whatsAppUrls.displayPhone}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* BUTTON 1: WhatsApp Mobile App (For Phone / Tablet) */}
              <a
                href={whatsAppUrls.appUrl}
                data-testid="whatsapp-mobile-btn"
                className={`p-3 rounded-xl transition flex flex-col items-start gap-1 cursor-pointer border ${
                  isMobile
                    ? "bg-[#25D366] hover:bg-[#20bd5a] text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                }`}
                title="Directly opens the WhatsApp application on mobile phones or tablets"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    <span>📱</span>
                    <span>WhatsApp Mobile (App)</span>
                  </div>
                  {isMobile ? (
                    <span className="text-[9px] font-mono font-bold bg-white text-emerald-700 px-1.5 py-0.2 rounded-full shadow-xs">
                      Mobile Device
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-medium opacity-75">
                      Phone App
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${isMobile ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-300"}`}>
                  Opens WhatsApp app on iPhone &amp; Android
                </span>
              </a>

              {/* BUTTON 2: WhatsApp Web (For Laptop / Desktop PC) */}
              <a
                href={whatsAppUrls.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="whatsapp-web-btn"
                className={`p-3 rounded-xl transition flex flex-col items-start gap-1 cursor-pointer border ${
                  !isMobile
                    ? "bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 border-stone-800 dark:border-white shadow-md ring-2 ring-stone-900/20"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                }`}
                title="Directly opens WhatsApp Web (web.whatsapp.com) for laptop or PC browsers"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    <span>💻</span>
                    <span>WhatsApp Web (Browser)</span>
                  </div>
                  {!isMobile ? (
                    <span className="text-[9px] font-mono font-bold bg-[#F97316] text-white px-1.5 py-0.2 rounded-full shadow-xs">
                      Desktop / PC
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-medium opacity-75">
                      Web Browser
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${!isMobile ? "text-stone-300 dark:text-stone-600" : "text-stone-500 dark:text-stone-400"}`}>
                  Opens web.whatsapp.com directly in browser
                </span>
              </a>
            </div>
          </div>

          {/* CHANNEL 2: EMAIL DISPATCH */}
          <div className="rounded-2xl bg-white dark:bg-stone-800/90 p-3.5 border border-stone-200 dark:border-stone-700/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                <span className="text-base">📧</span>
                <span>Email Notification</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-stone-300 truncate max-w-[220px]" title={studioSettings.contact_email}>
                To: {studioSettings.contact_email || "nanikoushik96@gmail.com"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* BUTTON 1: Open in Gmail (App / Web Compose) */}
              <a
                href={emailUrls.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="email-gmail-btn"
                className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition flex flex-col items-start gap-1 cursor-pointer border border-red-700 shadow-sm"
                title="Directly opens Gmail Web Compose with pre-filled booking details to Admin"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    <span>🔴</span>
                    <span>Send via Gmail</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                    Gmail App/Web
                  </span>
                </div>
                <span className="text-[10px] text-red-100 leading-tight">
                  Pre-fills To: {studioSettings.contact_email || "nanikoushik96@gmail.com"}
                </span>
              </a>

              {/* BUTTON 2: Default Mail App (mailto) */}
              <a
                href={emailUrls.mailtoUrl}
                data-testid="email-mailto-btn"
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex flex-col items-start gap-1 cursor-pointer border border-blue-700 shadow-sm"
                title="Opens your device's default email client (Apple Mail, Outlook, phone mail app)"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs">
                    <span>✉️</span>
                    <span>Default Mail App</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                    Mailto
                  </span>
                </div>
                <span className="text-[10px] text-blue-100 leading-tight">
                  Opens Apple Mail, Outlook, or phone app
                </span>
              </a>
            </div>
          </div>

          {/* Quick Copy & Preview Utilities */}
          <div className="flex flex-wrap items-center justify-between pt-0.5 gap-2 text-xs">
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
              <span>{copiedWhatsApp ? "Message Copied to Clipboard!" : "Copy Dispatch Message"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmailPreviewOpen(true)}
              className="text-[#F97316] hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <span>Preview Full Dispatch Template</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>

        {/* Customer Actions */}
        <div className="space-y-2 pt-1">
          {onNavigateMyBookings && (
            <button
              onClick={() => {
                onClose()
                onNavigateMyBookings()
              }}
              className="w-full py-3 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🎟️ View Digital Boarding Pass in My Trips</span>
              <ArrowRightIcon size={14} />
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

          {/* Staff Demo Shortcut - clearly labeled as staff only */}
          {onNavigateAdmin && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onNavigateAdmin()
                }}
                className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline cursor-pointer"
              >
                [Staff Demo Shortcut: Switch to Admin Console]
              </button>
            </div>
          )}
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
                    Recipient: {studioSettings.contact_email || "nanikoushik96@gmail.com"}
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

            <p className="text-xs text-stone-500">
              This message will be sent to the Fleet Operations Manager at{" "}
              <strong>{studioSettings.contact_email || "nanikoushik96@gmail.com"}</strong>.
              Upon receiving, the manager clicks their secure admin approval link to release your car.
            </p>

            {/* Email Preview Box */}
            <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50 space-y-3 text-xs font-mono whitespace-pre-wrap text-stone-700 max-h-60 overflow-y-auto leading-relaxed">
              {emailBodyText}
            </div>

            {/* Direct Send Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={emailUrls.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>🔴</span>
                  <span>Open in Gmail</span>
                </a>
                <a
                  href={emailUrls.mailtoUrl}
                  className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>✉️</span>
                  <span>Open Mail App</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(emailBodyText)
                  alert("Email template copied to clipboard!")
                }}
                className="w-full py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                📋 Copy Email Body
              </button>

              <button
                type="button"
                onClick={() => setIsEmailPreviewOpen(false)}
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
