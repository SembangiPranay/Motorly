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
  onViewBookingDetails?: (booking: BookingRecord) => void
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
  onViewBookingDetails,
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
            <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <h3 className="text-sm font-bold text-amber-950">
                    New Reservation Requests Awaiting Clearance ({pendingRequests.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Action Required
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5 px-4 w-36">Booking Ref</th>
                      <th className="py-2.5 px-4">Requested Vehicle</th>
                      <th className="py-2.5 px-4">Customer Contact</th>
                      <th className="py-2.5 px-4">Requested Dates</th>
                      <th className="py-2.5 px-4">Total Amount</th>
                      <th className="py-2.5 px-4 text-right min-w-[160px]">Immediate Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingRequests.map((b) => {
                      const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                      const cName = getCustomerFullName(b)
                      const cPhone = b.customer?.phone || ""
                      const { webUrl } = getWhatsAppUrls(
                        cPhone,
                        `Hello ${cName}, regarding your Pit Stop Car Hire reservation ${b.id}...`
                      )

                      return (
                        <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {onViewBookingDetails ? (
                              <button
                                type="button"
                                onClick={() => onViewBookingDetails(b)}
                                className="hover:text-orange-600 underline decoration-stone-300 hover:decoration-orange-500 transition text-left"
                                title="View booking details"
                              >
                                {b.id} ↗
                              </button>
                            ) : (
                              b.id
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">
                              {car ? car.name : "Vehicle Requested"}
                            </div>
                            {car?.plateNumber && (
                              <div className="text-[10px] font-mono text-stone-500">
                                {car.plateNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{cName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-stone-500 text-[11px]">
                                {cPhone || "—"}
                              </span>
                              {cPhone && (
                                <a
                                  href={webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/80"
                                >
                                  <PhoneIcon size={9} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-700">
                            {b.pickupDate} → {b.returnDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            €{b.totalAmount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onApprove(b.id)}
                                className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                              >
                                <CheckIcon size={12} />
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDecline(b.id)}
                                className="h-8 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Approved / Ready for Pickup */}
          {pendingPickups.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    <KeyIcon size={13} />
                  </div>
                  <h3 className="text-sm font-bold text-blue-950">
                    Ready For Key Handover ({pendingPickups.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  Customer Arriving
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5 px-4 w-36">Booking Ref</th>
                      <th className="py-2.5 px-4">Allocated Car</th>
                      <th className="py-2.5 px-4">Driver Name</th>
                      <th className="py-2.5 px-4">Pickup Date</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4 text-right min-w-[140px]">Key Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingPickups.map((b) => {
                      const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                      const cName = getCustomerFullName(b)
                      const cPhone = b.customer?.phone || ""
                      return (
                        <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {onViewBookingDetails ? (
                              <button
                                type="button"
                                onClick={() => onViewBookingDetails(b)}
                                className="hover:text-orange-600 underline decoration-stone-300 hover:decoration-orange-500 transition text-left"
                                title="View booking details"
                              >
                                {b.id} ↗
                              </button>
                            ) : (
                              b.id
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">
                              {car ? car.name : "Vehicle"}
                            </div>
                            {car?.plateNumber && (
                              <div className="text-[10px] font-mono text-stone-500">
                                {car.plateNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{cName}</div>
                            <div className="text-[11px] font-mono text-stone-500">
                              {cPhone || "—"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-700">{b.pickupDate}</td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            €{b.totalAmount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenGiveKeys(b)}
                              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                            >
                              <KeyIcon size={12} />
                              <span>Give Keys</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Active Rentals / Returns Inspection */}
          {pendingReturns.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-stone-800 text-white flex items-center justify-center text-xs font-bold">
                    <CheckIcon size={13} />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Active Rentals & Due Returns ({pendingReturns.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Audit Checkpoint
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5 px-4 w-36">Booking Ref</th>
                      <th className="py-2.5 px-4">Vehicle On Road</th>
                      <th className="py-2.5 px-4">Renting Driver</th>
                      <th className="py-2.5 px-4">Return Schedule</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4 text-right min-w-[140px]">Audit Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingReturns.map((b) => {
                      const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                      const cName = getCustomerFullName(b)
                      const cPhone = b.customer?.phone || ""
                      return (
                        <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {onViewBookingDetails ? (
                              <button
                                type="button"
                                onClick={() => onViewBookingDetails(b)}
                                className="hover:text-orange-600 underline decoration-stone-300 hover:decoration-orange-500 transition text-left"
                                title="View booking details"
                              >
                                {b.id} ↗
                              </button>
                            ) : (
                              b.id
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">
                              {car ? car.name : "Vehicle"}
                            </div>
                            {car?.plateNumber && (
                              <div className="text-[10px] font-mono text-stone-500">
                                {car.plateNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{cName}</div>
                            <div className="text-[11px] font-mono text-stone-500">
                              {cPhone || "—"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-700">{b.returnDate}</td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            €{b.totalAmount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenReturn(b)}
                              className="h-8 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                            >
                              <CheckIcon size={12} />
                              <span>Inspect Return</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
