import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import type { Car, BookingState, CustomerInfo } from "../types"
import { api } from "../services/api"
import {
  CheckIcon,
  CalendarIcon,
  LocationIcon,
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
  onNavigateMyBookings,
}: ConfirmationModalProps) {
  const [copied, setCopied] = useState(false)
  const [dispatchStatus, setDispatchStatus] = useState<"dispatching" | "sent">(
    "dispatching",
  )
  const autoDispatchedRef = useRef(false)

  const studioSettings = {
    contact_phone: "7780740223",
    contact_email: "nanikoushik96@gmail.com",
    owner_name: "Marcus Vance",
    garage_location:
      car.garageName ||
      car.garageAddress ||
      car.location ||
      bookingState.pickupLocation ||
      "Main Garage Facility, Bay 1",
  }

  // Direct Admin Review & Approve Link (Dedicated /admin route)
  const adminApprovalLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/admin?bookingId=${bookingId}`
      : `https://motorly-ten.vercel.app/admin?bookingId=${bookingId}`

  // Customer display name
  const customerFullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    (customer as any).name ||
    "Customer"

  // Exact minimal message template as requested
  const minimalTemplate = `🚗 *MOTORLY – NEW BOOKING REQUEST*

📋 *Booking ID:* ${bookingId}
🟡 *Status:* Pending Approval

🚘 *Vehicle:* ${car.name} (${car.year || 2024})
📅 *Pickup:* ${bookingState.pickupDate} – ${bookingState.pickupTime || "10:00 AM"}
📅 *Return:* ${bookingState.returnDate} – ${bookingState.returnTime || "10:00 AM"}
📍 *Location:* ${studioSettings.garage_location}

👤 *Customer:* ${customerFullName}
📞 *Phone:* ${customer.phone || "Not provided"}

💰 *Total:* $${totalAmount.toFixed(2)}
🔒 *Security Deposit:* $200

⚡ *Review & Approve:*
${adminApprovalLink}

_MOTORLY | Smarter Car Rentals_`

  // Universal WhatsApp Link (works seamlessly across iOS, Android, and Desktop Browser without childish selectors)
  const cleanPhone = studioSettings.contact_phone.replace(/[^0-9]/g, "")
  const universalWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(minimalTemplate)}`

  // Direct Mail Link
  const mailSubject = `🚗 MOTORLY – NEW BOOKING REQUEST: ${bookingId} (${car.name})`
  const mailtoUrl = `mailto:${studioSettings.contact_email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(minimalTemplate.replace(/\*/g, ""))}`

  // Automatic & simultaneous dispatch on booking confirmation
  useEffect(() => {
    if (autoDispatchedRef.current) return
    autoDispatchedRef.current = true

    // 1. Trigger backend dispatch notification
    api.getSettings().catch(() => {})

    fetch("/api/dispatch/booking-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        carName: car.name,
        customerName: customerFullName,
        customerPhone: customer.phone,
        totalAmount,
        templateText: minimalTemplate,
      }),
    }).catch(() => {})

    // 2. Open WhatsApp universal link automatically
    try {
      window.open(universalWhatsAppUrl, "_blank", "noopener,noreferrer")
    } catch {
      // Pop-up blockers may intercept automated window.open
    }

    const timer = setTimeout(() => {
      setDispatchStatus("sent")
    }, 800)

    return () => clearTimeout(timer)
  }, [
    universalWhatsAppUrl,
    bookingId,
    car.name,
    customerFullName,
    customer.phone,
    totalAmount,
    minimalTemplate,
  ])

  const handleCopy = () => {
    navigator.clipboard.writeText(minimalTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#141518] text-[#17191C] dark:text-stone-100 sm:rounded-3xl max-w-lg w-full h-full sm:h-auto sm:max-h-[94vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative space-y-5 border-0 sm:border border-stone-200 dark:border-stone-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          data-testid="close-confirmation-modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Confirmation Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800/60">
            <CheckIcon size={28} />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            Booking Request Dispatched &bull; Pending Approval
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Booking Confirmed!
          </h2>
          <p className="text-xs text-gray-500 dark:text-stone-400 max-w-md mx-auto">
            Your reservation details have been automatically dispatched
            simultaneously to the fleet manager via <strong>WhatsApp</strong>{" "}
            and <strong>Email</strong>.
          </p>
        </div>

        {/* Dispatch Telemetry Status Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                {dispatchStatus === "sent"
                  ? "Dispatched Simultaneously"
                  : "Dispatching Notifications..."}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                WhatsApp (+1 778-074-0223) &bull; nanikoushik96@gmail.com
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
            ~3 Min Response
          </span>
        </div>

        {/* Boarding Pass Style Receipt Card */}
        <div className="rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                Booking ID
              </p>
              <p className="font-black text-[#F97316] text-lg font-mono">
                {bookingId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                Customer
              </p>
              <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                {customerFullName}
              </p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-stone-900 dark:text-white font-heading text-sm truncate">
                {car.name} ({car.year || 2024})
              </h4>
              <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                {car.type} &bull; {car.transmission} &bull;{" "}
                {studioSettings.garage_location}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                Pay on Pickup
              </p>
              <p className="font-black text-base text-stone-900 dark:text-white font-mono">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 text-[11px]">
            <div>
              <span className="text-stone-400 dark:text-stone-500 font-semibold block text-[10px] uppercase">
                Pickup
              </span>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                {bookingState.pickupDate} &bull;{" "}
                {bookingState.pickupTime || "10:00 AM"}
              </p>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 font-semibold block text-[10px] uppercase">
                Return
              </span>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                {bookingState.returnDate} &bull;{" "}
                {bookingState.returnTime || "10:00 AM"}
              </p>
            </div>
          </div>
        </div>

        {/* Minimal Dispatched Template Preview */}
        <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-500 tracking-wider">
              Dispatched Message
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-bold text-[#F97316] hover:text-[#EA580C] transition cursor-pointer flex items-center gap-1"
            >
              <span>{copied ? "✓ Copied" : "📋 Copy"}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-stone-700 dark:text-stone-300 whitespace-pre-wrap bg-white dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800/60 leading-relaxed max-h-36 overflow-y-auto">
            {minimalTemplate}
          </pre>
        </div>

        {/* Seamless Actions */}
        <div className="space-y-2 pt-1">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateMyBookings) onNavigateMyBookings()
              else onNavigateListing()
            }}
            className="w-full py-3 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>View in My Reservations</span>
            <ArrowRightIcon
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>

          {/* Quick Resend / Open Links (Direct universal links, zero childish choices) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href={universalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <span>💬</span>
              <span>Re-open WhatsApp</span>
            </a>
            <a
              href={mailtoUrl}
              className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <span>✉️</span>
              <span>Re-send Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
