import React, { useMemo } from "react"
import type { BookingRecord, Car } from "../../types"
import {
  BellIcon,
  CheckIcon,
  PhoneIcon,
  KeyIcon,
  AlertTriangleIcon,
  CalendarIcon,
  CarIcon,
  ArrowRightIcon,
} from "../../components/Icons"
import { getWhatsAppUrls } from "../../utils/whatsapp"

interface AdminNotificationsViewProps {
  bookings: BookingRecord[]
  cars: Car[]
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onOpenGiveKeys: (booking: BookingRecord) => void
  onOpenReturn: (booking: BookingRecord) => void
  onOpenInvoice: (booking: BookingRecord) => void
}

const getCustomerFullName = (b: BookingRecord) => {
  const first = b.customer?.firstName || ""
  const last = b.customer?.lastName || ""
  return `${first} ${last}`.trim() || "Valued Customer"
}

export default function AdminNotificationsView({
  bookings,
  cars,
  onApprove,
  onDecline,
  onOpenGiveKeys,
  onOpenReturn,
  onOpenInvoice,
}: AdminNotificationsViewProps) {
  const carMap = useMemo(() => {
    const map = new Map<string, Car>()
    cars.forEach((c) => map.set(c.id, c))
    return map
  }, [cars])

  // 1. Pending approvals
  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("pending") || s.includes("advance")
    })
  }, [bookings])

  // 2. Pickups awaiting key handover
  const pendingPickups = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("assigned") || s.includes("approved") || s.includes("confirmed")
    })
  }, [bookings])

  // 3. Active trips due for return audit
  const pendingReturns = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("checked out") || s.includes("checked_out") || s.includes("active")
    })
  }, [bookings])

  const totalAlertsCount =
    pendingRequests.length + pendingPickups.length + pendingReturns.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">
              Notification & Clearance Center
            </h2>
            {totalAlertsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {totalAlertsCount} Action{totalAlertsCount > 1 ? "s" : ""} Required
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                All Clear
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Review incoming reservation requests, dispatch vehicle keys, and audit completed returns.
          </p>
        </div>
      </div>

      {totalAlertsCount === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckIcon size={24} />
          </div>
          <h3 className="text-sm font-bold text-stone-800">All caught up!</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            There are currently no pending reservation requests, vehicle dispatches, or returns needing audit.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: New Reservation Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <h3 className="text-sm font-bold text-amber-950">
                    New Reservation Requests Awaiting Clearance ({pendingRequests.length})
                  </h3>
                </div>
                <span className="text-xs text-amber-800 font-semibold">Immediate Action</span>
              </div>

              <div className="space-y-3">
                {pendingRequests.map((b) => {
                  const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                  const cName = getCustomerFullName(b)
                  const cPhone = b.customer?.phone || ""
                  const { webUrl } = getWhatsAppUrls(
                    cPhone,
                    `Hello ${cName}, regarding your Motorly reservation ${b.id}...`
                  )

                  return (
                    <div
                      key={b.id}
                      className="border border-stone-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50 hover:bg-stone-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {b.id}
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {cName}
                          </span>
                          {cPhone && <span className="text-xs text-stone-500">({cPhone})</span>}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-2">
                          <CarIcon size={14} className="text-stone-400" />
                          <span>{car ? car.name : "Vehicle Requested"}</span>
                          <span>•</span>
                          <CalendarIcon size={14} className="text-stone-400" />
                          <span>
                            {b.pickupDate} to {b.returnDate}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-stone-800">Total: €{b.totalAmount}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cPhone && (
                          <a
                            href={webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <PhoneIcon size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onApprove(b.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <CheckIcon size={13} />
                          <span>Accept Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecline(b.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 2: Approved / Ready for Pickup */}
          {pendingPickups.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    <KeyIcon size={14} />
                  </div>
                  <h3 className="text-sm font-bold text-blue-950">
                    Ready For Key Handover ({pendingPickups.length})
                  </h3>
                </div>
                <span className="text-xs text-blue-800 font-semibold">Customer Arriving</span>
              </div>

              <div className="space-y-3">
                {pendingPickups.map((b) => {
                  const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                  const cName = getCustomerFullName(b)
                  const cPhone = b.customer?.phone || ""
                  return (
                    <div
                      key={b.id}
                      className="border border-stone-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50 hover:bg-stone-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {b.id}
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {cName}
                          </span>
                          {cPhone && <span className="text-xs text-stone-500">({cPhone})</span>}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-2">
                          <CarIcon size={14} className="text-stone-400" />
                          <span>{car ? `${car.name} (${car.plateNumber || "No Plate"})` : "Vehicle"}</span>
                          <span>•</span>
                          <CalendarIcon size={14} className="text-stone-400" />
                          <span>Pickup: {b.pickupDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenGiveKeys(b)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <KeyIcon size={13} />
                          <span>Hand Over Keys</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 3: Active Rentals / Returns Inspection */}
          {pendingReturns.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-stone-800 text-white flex items-center justify-center text-xs font-bold">
                    <CheckIcon size={14} />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Active Rentals & Due Returns ({pendingReturns.length})
                  </h3>
                </div>
                <span className="text-xs text-stone-500 font-semibold">Audit Checkpoint</span>
              </div>

              <div className="space-y-3">
                {pendingReturns.map((b) => {
                  const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                  const cName = getCustomerFullName(b)
                  const cPhone = b.customer?.phone || ""
                  return (
                    <div
                      key={b.id}
                      className="border border-stone-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50 hover:bg-stone-50 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {b.id}
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {cName}
                          </span>
                          {cPhone && <span className="text-xs text-stone-500">({cPhone})</span>}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-2">
                          <CarIcon size={14} className="text-stone-400" />
                          <span>{car ? `${car.name} (${car.plateNumber || "No Plate"})` : "Vehicle"}</span>
                          <span>•</span>
                          <CalendarIcon size={14} className="text-stone-400" />
                          <span>Return Target: {b.returnDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenReturn(b)}
                          className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckIcon size={13} />
                          <span>Inspect & Check In</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
