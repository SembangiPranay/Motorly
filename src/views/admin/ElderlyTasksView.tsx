import React, { useState } from "react"
import type { BookingRecord, Car } from "../../types"
import {
  KeyIcon,
  CheckIcon,
  CarIcon,
  PhoneIcon,
  FileTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  WhatsAppIcon,
} from "../../components/Icons"
import { openWhatsAppDirect } from "../../utils/whatsapp"

interface ElderlyTasksViewProps {
  bookings: BookingRecord[]
  cars: Car[]
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onOpenGiveKeys: (booking: BookingRecord) => void
  onOpenReturn: (booking: BookingRecord) => void
  onOpenWalkin: () => void
  onOpenInvoice: (booking: BookingRecord) => void
  targetBookingId?: string
  onClearTargetBookingId?: () => void
}

export default function ElderlyTasksView({
  bookings,
  cars,
  onApprove,
  onDecline,
  onOpenGiveKeys,
  onOpenReturn,
  onOpenWalkin,
  onOpenInvoice,
  targetBookingId,
  onClearTargetBookingId,
}: ElderlyTasksViewProps) {
  const [filter, setFilter] = useState<"all" | "requests" | "pickups" | "returns" | "completed">("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Map helper to find car by ID or type
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

  // Safe case-insensitive status matching
  const isRequest = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return s.includes("pending") || s.includes("advance")
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

  const isReturn = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return s.includes("checked out") || s.includes("checked_out") || s.includes("active")
  }

  const isCompleted = (b: BookingRecord) => {
    const s = String(b.status || "").toLowerCase()
    return s.includes("completed") || s.includes("returned") || s.includes("cancelled")
  }

  // Sort target booking to top if present
  const sortTargetFirst = (list: BookingRecord[]) => {
    if (!targetBookingId) return list
    return [...list].sort((a, b) => {
      if (a.id === targetBookingId) return -1
      if (b.id === targetBookingId) return 1
      return 0
    })
  }

  const requests = sortTargetFirst(bookings.filter(isRequest))
  const pickups = sortTargetFirst(bookings.filter(isPickup))
  const returns = sortTargetFirst(bookings.filter(isReturn))
  const completed = sortTargetFirst(bookings.filter(isCompleted))

  const totalActionItems = requests.length + pickups.length + returns.length

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  const handleApproveClick = async (id: string) => {
    if (processingId) return
    try {
      setProcessingId(id)
      await onApprove(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeclineClick = async (id: string) => {
    if (processingId) return
    const confirmed = window.confirm("Are you sure you want to decline this booking request?")
    if (!confirmed) return
    try {
      setProcessingId(id)
      await onDecline(id)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Today's Action Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold tracking-wide uppercase mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Today is {todayStr}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Today's Action Items
          </h1>
          <p className="text-stone-500 font-medium text-lg mt-1">
            {totalActionItems === 0
              ? "All caught up! No pending bookings waiting for action."
              : `You have ${totalActionItems} booking ${
                  totalActionItems === 1 ? "task" : "tasks"
                } requiring your attention.`}
          </p>
        </div>

        {/* Big Walk-in Button */}
        <div>
          <button
            type="button"
            onClick={onOpenWalkin}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-3 min-h-[56px]"
          >
            <span className="text-2xl">🚶</span>
            <span>+ New Walk-In Customer</span>
          </button>
        </div>
      </div>

      {/* Target Booking Alert Banner if opened via direct link */}
      {targetBookingId && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-2xl font-black">
              🎯
            </div>
            <div>
              <div className="font-bold text-amber-950 text-lg">
                Highlighting Reservation: <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-amber-300">{targetBookingId}</span>
              </div>
              <div className="text-sm text-amber-800 font-medium">
                This customer's request has been brought to the top for your review.
              </div>
            </div>
          </div>
          {onClearTargetBookingId && (
            <button
              type="button"
              onClick={onClearTargetBookingId}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-amber-100 text-amber-950 font-bold text-base border-2 border-amber-300 transition shadow-sm"
            >
              Show All Bookings ✕
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs for Easy Touch */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-5 py-3.5 rounded-2xl font-bold text-base sm:text-lg transition flex items-center gap-2.5 min-h-[48px] ${
            filter === "all"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <span>All Tasks</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              filter === "all" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-800"
            }`}
          >
            {totalActionItems}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("requests")}
          className={`px-5 py-3.5 rounded-2xl font-bold text-base sm:text-lg transition flex items-center gap-2.5 min-h-[48px] ${
            filter === "requests"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <span>🔔 New Requests</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              filter === "requests" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("pickups")}
          className={`px-5 py-3.5 rounded-2xl font-bold text-base sm:text-lg transition flex items-center gap-2.5 min-h-[48px] ${
            filter === "pickups"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <span>🔑 Pickups Today</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              filter === "pickups" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-900"
            }`}
          >
            {pickups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("returns")}
          className={`px-5 py-3.5 rounded-2xl font-bold text-base sm:text-lg transition flex items-center gap-2.5 min-h-[48px] ${
            filter === "returns"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <span>📥 Returns Today</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              filter === "returns" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {returns.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`px-5 py-3.5 rounded-2xl font-bold text-base sm:text-lg transition flex items-center gap-2.5 min-h-[48px] ${
            filter === "completed"
              ? "bg-stone-700 text-white shadow-md"
              : "bg-white text-stone-600 border-2 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <span>📋 Past Trips</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              filter === "completed" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            {completed.length}
          </span>
        </button>
      </div>

      {/* Main Task List Cards */}
      <div className="space-y-6">
        {/* SECTION 1: New Requests Waiting for Approval */}
        {(filter === "all" || filter === "requests") && requests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                New Requests Waiting for Approval ({requests.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {requests.map((booking) => {
                const car = getCarForBooking(booking)
                const customerName = `${booking.customer.firstName || ""} ${
                  booking.customer.lastName || ""
                }`.trim() || "Customer"
                const isTarget = targetBookingId && targetBookingId === booking.id

                return (
                  <div
                    key={booking.id}
                    className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition shadow-sm ${
                      isTarget
                        ? "border-amber-500 ring-4 ring-amber-500/20"
                        : "border-amber-200 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 sm:gap-6">
                        {car?.image ? (
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-2xl border border-stone-200 bg-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-20 sm:w-28 sm:h-24 bg-amber-50 text-amber-700 rounded-2xl border-2 border-amber-200 flex items-center justify-center shrink-0">
                            <CarIcon size={36} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                            Needs Approval
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                            {car?.name || booking.carType || "Reserved Car"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base sm:text-lg text-stone-600 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-stone-900">
                              <UserIcon size={18} className="text-stone-400" />
                              {customerName}
                            </span>
                            {booking.customer.phone && (
                              <span className="text-stone-600 font-mono">
                                • {booking.customer.phone}
                              </span>
                            )}
                          </div>
                          <div className="text-stone-600 font-medium text-base flex flex-wrap items-center gap-2 pt-1">
                            <CalendarIcon size={18} className="text-stone-400" />
                            <span>
                              <strong>{booking.pickupDate}</strong> to{" "}
                              <strong>{booking.returnDate}</strong>
                            </span>
                            <span className="text-stone-400">•</span>
                            <span className="font-bold text-stone-900">
                              Total: ${booking.totalAmount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                        {booking.customer.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppDirect(
                                booking.customer.phone,
                                `Hello ${customerName}, regarding your reservation with Motorly Garage...`
                              )
                            }
                            className="px-4 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-base transition flex items-center gap-2 border border-emerald-200 min-h-[52px]"
                          >
                            <WhatsAppIcon size={20} className="text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={processingId === booking.id}
                          onClick={() => handleDeclineClick(booking.id)}
                          className="px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 font-bold text-base transition min-h-[52px] border border-stone-200"
                        >
                          ✕ Decline
                        </button>

                        <button
                          type="button"
                          disabled={processingId === booking.id}
                          onClick={() => handleApproveClick(booking.id)}
                          className="px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-lg shadow-lg shadow-emerald-600/30 transition flex items-center gap-2.5 min-h-[52px]"
                        >
                          <CheckIcon size={22} />
                          <span>
                            {processingId === booking.id
                              ? "Approving..."
                              : "Accept & Reserve Car"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Pickups Due (Give Keys) */}
        {(filter === "all" || filter === "pickups") && pickups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500"></span>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                Pickups Waiting for Keys ({pickups.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {pickups.map((booking) => {
                const car = getCarForBooking(booking)
                const customerName = `${booking.customer.firstName || ""} ${
                  booking.customer.lastName || ""
                }`.trim() || "Customer"

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-200 hover:border-blue-300 transition shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 sm:gap-6">
                        {car?.image ? (
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-2xl border border-stone-200 bg-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-20 sm:w-28 sm:h-24 bg-blue-50 text-blue-700 rounded-2xl border-2 border-blue-200 flex items-center justify-center shrink-0">
                            <CarIcon size={36} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
                              Ready for Pickup
                            </span>
                            {car?.plateNumber && (
                              <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono font-bold text-xs">
                                Plate: {car.plateNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                            {car?.name || booking.carType || "Assigned Vehicle"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base sm:text-lg text-stone-600 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-stone-900">
                              <UserIcon size={18} className="text-stone-400" />
                              {customerName}
                            </span>
                            {booking.customer.phone && (
                              <span className="text-stone-600 font-mono">
                                • {booking.customer.phone}
                              </span>
                            )}
                          </div>
                          <div className="text-stone-600 font-medium text-base flex flex-wrap items-center gap-2 pt-1">
                            <ClockIcon size={18} className="text-stone-400" />
                            <span>
                              Pickup Date: <strong>{booking.pickupDate}</strong>
                            </span>
                            <span className="text-stone-400">•</span>
                            <span>
                              Return Due: <strong>{booking.returnDate}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                        {booking.customer.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppDirect(
                                booking.customer.phone,
                                `Hello ${customerName}, your vehicle at Motorly Garage is ready for pickup!`
                              )
                            }
                            className="px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base transition flex items-center gap-2 min-h-[56px]"
                            title="Message on WhatsApp"
                          >
                            <WhatsAppIcon size={20} className="text-emerald-600" />
                            <span>Chat</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenInvoice(booking)}
                          className="px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base transition flex items-center gap-2 min-h-[56px]"
                        >
                          <FileTextIcon size={20} />
                          <span>Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenGiveKeys(booking)}
                          className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-3 min-h-[56px]"
                        >
                          <KeyIcon size={24} />
                          <span>Give Keys to Customer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: Returns Due Today / In Trip */}
        {(filter === "all" || filter === "returns") && returns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                Active Trips / Returns Due ({returns.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {returns.map((booking) => {
                const car = getCarForBooking(booking)
                const customerName = `${booking.customer.firstName || ""} ${
                  booking.customer.lastName || ""
                }`.trim() || "Customer"

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-200 hover:border-emerald-300 transition shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 sm:gap-6">
                        {car?.image ? (
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-2xl border border-stone-200 bg-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-20 sm:w-28 sm:h-24 bg-emerald-50 text-emerald-700 rounded-2xl border-2 border-emerald-200 flex items-center justify-center shrink-0">
                            <CarIcon size={36} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
                              Currently With Customer
                            </span>
                            {car?.plateNumber && (
                              <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono font-bold text-xs">
                                Plate: {car.plateNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                            {car?.name || booking.carType || "Rented Vehicle"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base sm:text-lg text-stone-600 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-stone-900">
                              <UserIcon size={18} className="text-stone-400" />
                              {customerName}
                            </span>
                            {booking.customer.phone && (
                              <span className="text-stone-600 font-mono">
                                • {booking.customer.phone}
                              </span>
                            )}
                          </div>
                          <div className="text-stone-600 font-medium text-base flex flex-wrap items-center gap-2 pt-1">
                            <CalendarIcon size={18} className="text-stone-400" />
                            <span>
                              Due Back: <strong>{booking.returnDate}</strong>
                            </span>
                            {booking.odometerOut && (
                              <>
                                <span className="text-stone-400">•</span>
                                <span className="text-stone-500 font-mono text-sm">
                                  Out at {booking.odometerOut.toLocaleString()} mi
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                        {booking.customer.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppDirect(
                                booking.customer.phone,
                                `Hello ${customerName}, hope you're enjoying your trip with Motorly Garage!`
                              )
                            }
                            className="px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base transition flex items-center gap-2 min-h-[56px]"
                            title="Message on WhatsApp"
                          >
                            <WhatsAppIcon size={20} className="text-emerald-600" />
                            <span>Chat</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenInvoice(booking)}
                          className="px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-base transition flex items-center gap-2 min-h-[56px]"
                        >
                          <FileTextIcon size={20} />
                          <span>Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenReturn(booking)}
                          className="px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-3 min-h-[56px]"
                        >
                          <span className="text-2xl">📥</span>
                          <span>Take Car Back (Return)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: Past & Completed Trips (if selected or empty) */}
        {(filter === "completed" || (filter === "all" && totalActionItems === 0)) && (
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Past Completed Trips ({completed.length})
            </h2>

            {completed.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 text-center text-stone-500 font-medium">
                No past completed bookings yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {completed.map((booking) => {
                  const car = getCarForBooking(booking)
                  const customerName = `${booking.customer.firstName || ""} ${
                    booking.customer.lastName || ""
                  }`.trim() || "Customer"

                  const s = String(booking.status || "").toLowerCase()
                  const isDone = s.includes("completed") || s.includes("returned")

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              isDone
                                ? "bg-stone-100 text-stone-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                          <span className="font-bold text-stone-900 text-lg">
                            {car?.name || booking.carType || "Vehicle"}
                          </span>
                        </div>
                        <div className="text-sm text-stone-500 mt-1">
                          Customer: <strong>{customerName}</strong> • {booking.pickupDate} to{" "}
                          {booking.returnDate} • ${booking.totalAmount}
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => onOpenInvoice(booking)}
                          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition flex items-center gap-2"
                        >
                          <FileTextIcon size={16} />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Comforting Empty State when all actions are done */}
        {totalActionItems === 0 && filter !== "completed" && (
          <div className="bg-white rounded-3xl p-10 sm:p-14 border-2 border-emerald-200 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-4xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-3xl font-black text-stone-900 tracking-tight mb-2">
              You're All Caught Up!
            </h3>
            <p className="text-stone-500 font-medium text-lg max-w-md mx-auto mb-6">
              There are no new booking requests, pickups, or returns waiting for your action right now.
            </p>
            <button
              type="button"
              onClick={onOpenWalkin}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xl transition shadow-lg"
            >
              <span>+ Rent to Walk-In Customer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
