import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import {
  BellIcon,
  CheckIcon,
  CarIcon,
  KeyIcon,
  UserIcon,
  CalendarIcon,
  WhatsAppIcon,
  ClockIcon,
  FileTextIcon,
} from "../../components/Icons"
import { openWhatsAppDirect } from "../../utils/whatsapp"

interface ElderlyNotificationsViewProps {
  bookings: BookingRecord[]
  cars: Car[]
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onOpenGiveKeys: (booking: BookingRecord) => void
  onOpenReturn: (booking: BookingRecord) => void
  onOpenInvoice: (booking: BookingRecord) => void
}

export default function ElderlyNotificationsView({
  bookings,
  cars,
  onApprove,
  onDecline,
  onOpenGiveKeys,
  onOpenReturn,
  onOpenInvoice,
}: ElderlyNotificationsViewProps) {
  const [filter, setFilter] = useState<"all" | "requests" | "returns" | "pickups">("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const getCarForBooking = (b: BookingRecord): Car | undefined => {
    if (b.matchedCarId) {
      const found = cars.find((c) => c.id === b.matchedCarId)
      if (found) return found
    }
    if (b.carType) {
      const foundByType = cars.find(
        (c) =>
          c.type.toLowerCase() === b.carType?.toLowerCase() ||
          c.name.toLowerCase().includes(b.carType?.toLowerCase() || "")
      )
      if (foundByType) return foundByType
    }
    return undefined
  }

  // Categorize alerts
  const isRequest = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return s.includes("pending") || s.includes("advance")
  }

  const isReturn = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return s.includes("checked out") || s.includes("checked_out") || s.includes("active")
  }

  const isPickup = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return (
      s.includes("assigned") ||
      s.includes("approved") ||
      s.includes("deposit") ||
      s.includes("confirmed")
    )
  }

  const requests = bookings.filter(isRequest)
  const returns = bookings.filter(isReturn)
  const pickups = bookings.filter(isPickup)
  const totalAlerts = requests.length + returns.length + pickups.length

  const handleApprove = async (id: string) => {
    if (processingId) return
    try {
      setProcessingId(id)
      await onApprove(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (id: string) => {
    if (processingId) return
    if (!window.confirm("Are you sure you want to decline this request?")) return
    try {
      setProcessingId(id)
      await onDecline(id)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-3xl shadow-sm">
            <BellIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Notification Center
            </h1>
            <p className="text-stone-500 font-medium text-lg mt-1">
              {totalAlerts === 0
                ? "No unread alerts. You are completely caught up."
                : `You have ${totalAlerts} active ${
                    totalAlerts === 1 ? "notification" : "notifications"
                  } needing attention.`}
            </p>
          </div>
        </div>

        {totalAlerts > 0 && (
          <div className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-900 font-bold border border-amber-200 text-base">
            ⚠️ {totalAlerts} Action Required
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-5 py-3 rounded-2xl font-bold text-base transition flex items-center gap-2 min-h-[48px] ${
            filter === "all"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <span>All Notifications</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              filter === "all" ? "bg-stone-700 text-white" : "bg-stone-100 text-stone-800"
            }`}
          >
            {totalAlerts}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("requests")}
          className={`px-5 py-3 rounded-2xl font-bold text-base transition flex items-center gap-2 min-h-[48px] ${
            filter === "requests"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <span>New Requests</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              filter === "requests" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("returns")}
          className={`px-5 py-3 rounded-2xl font-bold text-base transition flex items-center gap-2 min-h-[48px] ${
            filter === "returns"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <span>Returns Due</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              filter === "returns" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {returns.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("pickups")}
          className={`px-5 py-3 rounded-2xl font-bold text-base transition flex items-center gap-2 min-h-[48px] ${
            filter === "pickups"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-50"
          }`}
        >
          <span>Pickups</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              filter === "pickups" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-900"
            }`}
          >
            {pickups.length}
          </span>
        </button>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-4">
        {/* 1. New Requests */}
        {(filter === "all" || filter === "requests") &&
          requests.map((booking) => {
            const car = getCarForBooking(booking)
            const customerName = `${booking.customer.firstName || ""} ${
              booking.customer.lastName || ""
            }`.trim() || "Customer"

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl shrink-0 mt-1">
                    🔔
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                        New Booking Request
                      </span>
                      <span className="font-mono text-xs font-bold text-stone-400">
                        {booking.id}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 mt-1">
                      {car?.name || booking.carType || "Vehicle Request"}
                    </h3>
                    <div className="text-base text-stone-600 font-medium flex flex-wrap items-center gap-3 mt-1">
                      <span>Customer: <strong>{customerName}</strong></span>
                      {booking.customer.phone && (
                        <span className="font-mono text-sm">• {booking.customer.phone}</span>
                      )}
                      <span>• Total: <strong>${booking.totalAmount}</strong></span>
                    </div>
                    <div className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
                      <CalendarIcon size={16} />
                      <span>{booking.pickupDate} to {booking.returnDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {booking.customer.phone && (
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsAppDirect(
                          booking.customer.phone,
                          `Hello ${customerName}, regarding your booking at Motorly Garage...`
                        )
                      }
                      className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition flex items-center gap-2"
                    >
                      <WhatsAppIcon size={18} className="text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={processingId === booking.id}
                    onClick={() => handleDecline(booking.id)}
                    className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 font-bold text-sm transition"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={processingId === booking.id}
                    onClick={() => handleApprove(booking.id)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md transition flex items-center gap-2"
                  >
                    <CheckIcon size={20} />
                    <span>Accept Booking</span>
                  </button>
                </div>
              </div>
            )
          })}

        {/* 2. Returns Due */}
        {(filter === "all" || filter === "returns") &&
          returns.map((booking) => {
            const car = getCarForBooking(booking)
            const customerName = `${booking.customer.firstName || ""} ${
              booking.customer.lastName || ""
            }`.trim() || "Customer"

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0 mt-1">
                    🏁
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
                        Vehicle Return Due
                      </span>
                      {car?.plateNumber && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-800 font-mono font-bold text-xs rounded">
                          {car.plateNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 mt-1">
                      {car?.name || booking.carType || "Rented Vehicle"}
                    </h3>
                    <div className="text-base text-stone-600 font-medium flex flex-wrap items-center gap-3 mt-1">
                      <span>Customer: <strong>{customerName}</strong></span>
                      <span>• Due Date: <strong>{booking.returnDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenReturn(booking)}
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md transition flex items-center gap-2 min-h-[48px]"
                  >
                    <span>📥</span>
                    <span>Take Car Back</span>
                  </button>
                </div>
              </div>
            )
          })}

        {/* 3. Pickups Due */}
        {(filter === "all" || filter === "pickups") &&
          pickups.map((booking) => {
            const car = getCarForBooking(booking)
            const customerName = `${booking.customer.firstName || ""} ${
              booking.customer.lastName || ""
            }`.trim() || "Customer"

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border-2 border-blue-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl shrink-0 mt-1">
                    🔑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
                        Key Handover Awaiting
                      </span>
                      {car?.plateNumber && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-800 font-mono font-bold text-xs rounded">
                          {car.plateNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 mt-1">
                      {car?.name || booking.carType || "Assigned Vehicle"}
                    </h3>
                    <div className="text-base text-stone-600 font-medium flex flex-wrap items-center gap-3 mt-1">
                      <span>Customer: <strong>{customerName}</strong></span>
                      <span>• Pickup Date: <strong>{booking.pickupDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenGiveKeys(booking)}
                    className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-md transition flex items-center gap-2 min-h-[48px]"
                  >
                    <KeyIcon size={20} />
                    <span>Give Keys</span>
                  </button>
                </div>
              </div>
            )
          })}

        {/* Empty state */}
        {totalAlerts === 0 && (
          <div className="bg-white rounded-3xl p-12 border-2 border-stone-200 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-2xl font-black text-stone-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-stone-500 font-medium text-base">
              There are no new booking alerts or vehicle return audits waiting for your review.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
