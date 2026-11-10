import React, { useState, useMemo, useEffect } from "react"
import type { BookingRecord, BookingStatus, Car } from "../../types"
import {
  CalendarIcon,
  CarIcon,
  ClockIcon,
  CheckIcon,
  PhoneIcon,
  SearchIcon,
  AlertTriangleIcon,
  ZapIcon,
  KeyIcon,
  FileTextIcon,
  ArrowRightIcon,
} from "../../components/Icons"
import { getWhatsAppUrls } from "../../utils/whatsapp"

interface AdminOrdersViewProps {
  bookings: BookingRecord[]
  cars: Car[]
  searchQuery: string
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onOpenGiveKeys: (booking: BookingRecord) => void
  onOpenReturn: (booking: BookingRecord) => void
  onOpenWalkin: () => void
  onOpenInvoice: (booking: BookingRecord) => void
  targetBookingId?: string
  onClearTargetBookingId?: () => void
}

type FilterTab = "all" | "pending" | "pickups" | "active" | "returns" | "completed"

const getCustomerFullName = (b: BookingRecord) => {
  const first = b.customer?.firstName || ""
  const last = b.customer?.lastName || ""
  return `${first} ${last}`.trim() || "Valued Customer"
}

export default function AdminOrdersView({
  bookings,
  cars,
  searchQuery,
  onApprove,
  onDecline,
  onOpenGiveKeys,
  onOpenReturn,
  onOpenWalkin,
  onOpenInvoice,
  targetBookingId,
  onClearTargetBookingId,
}: AdminOrdersViewProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>("all")
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<BookingRecord | null>(null)
  const [isAlertDismissed, setIsAlertDismissed] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Auto-focus target booking if passed from URL deep link
  useEffect(() => {
    if (targetBookingId) {
      const target = bookings.find((b) => b.id === targetBookingId)
      if (target) {
        setSelectedBookingForDetails(target)
      }
      if (onClearTargetBookingId) {
        onClearTargetBookingId()
      }
    }
  }, [targetBookingId, bookings, onClearTargetBookingId])

  // Helper map for car lookups
  const carMap = useMemo(() => {
    const map = new Map<string, Car>()
    cars.forEach((c) => map.set(c.id, c))
    return map
  }, [cars])

  // Categorized booking counts
  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("pending") || s.includes("advance")
    })
  }, [bookings])

  const readyForPickup = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("assigned") || s.includes("approved") || s.includes("confirmed")
    })
  }, [bookings])

  const activeRentals = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("checked out") || s.includes("checked_out") || s.includes("active")
    })
  }, [bookings])

  const returnsDue = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase()
      return s.includes("checked out") || s.includes("checked_out") || s.includes("active")
    })
  }, [bookings])

  const completedTrips = useMemo(() => {
    return bookings.filter((b) => (b.status || "").toLowerCase().includes("completed"))
  }, [bookings])

  // Filtered list based on active filter tab & search query
  const filteredBookings = useMemo(() => {
    let list = bookings

    if (filterTab === "pending") {
      list = pendingRequests
    } else if (filterTab === "pickups") {
      list = readyForPickup
    } else if (filterTab === "active") {
      list = activeRentals
    } else if (filterTab === "returns") {
      list = returnsDue
    } else if (filterTab === "completed") {
      list = completedTrips
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((b) => {
        const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
        const cName = getCustomerFullName(b).toLowerCase()
        const cPhone = (b.customer?.phone || "").toLowerCase()
        return (
          b.id.toLowerCase().includes(q) ||
          cName.includes(q) ||
          cPhone.includes(q) ||
          (car && car.name.toLowerCase().includes(q)) ||
          (car && car.plateNumber && car.plateNumber.toLowerCase().includes(q))
        )
      })
    }

    return list
  }, [
    bookings,
    filterTab,
    pendingRequests,
    readyForPickup,
    activeRentals,
    returnsDue,
    completedTrips,
    searchQuery,
    carMap,
  ])

  // Action handlers with local busy state
  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await onApprove(id)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (id: string) => {
    if (!window.confirm("Are you sure you want to decline this booking request?")) return
    setProcessingId(id)
    try {
      await onDecline(id)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Alert - Isolated to Main Dashboard */}
      {!isAlertDismissed && pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangleIcon size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                <span>{pendingRequests.length} New Booking Request{pendingRequests.length > 1 ? "s" : ""} Awaiting Review</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200/80 text-amber-950 font-black">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Customers are waiting for reservation confirmation and vehicle allocation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs"
            >
              Review Requests
            </button>
            <button
              type="button"
              onClick={() => setIsAlertDismissed(true)}
              className="px-2.5 py-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100 text-xs font-semibold transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Metrics Header Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Pending */}
        <div
          onClick={() => setFilterTab("pending")}
          className={`cursor-pointer rounded-xl border p-4 bg-white transition hover:border-amber-400 hover:shadow-xs ${
            filterTab === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-stone-200"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Pending Clearance
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {pendingRequests.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Requests to approve</div>
        </div>

        {/* Stat 2: Ready for Pickup */}
        <div
          onClick={() => setFilterTab("pickups")}
          className={`cursor-pointer rounded-xl border p-4 bg-white transition hover:border-blue-400 hover:shadow-xs ${
            filterTab === "pickups" ? "border-blue-500 ring-2 ring-blue-500/10" : "border-stone-200"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Ready For Pickup
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {readyForPickup.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Awaiting key handover</div>
        </div>

        {/* Stat 3: Active on Road */}
        <div
          onClick={() => setFilterTab("active")}
          className={`cursor-pointer rounded-xl border p-4 bg-white transition hover:border-emerald-400 hover:shadow-xs ${
            filterTab === "active" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-stone-200"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Active On Road
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {activeRentals.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Vehicles currently dispatched</div>
        </div>

        {/* Stat 4: Completed */}
        <div
          onClick={() => setFilterTab("completed")}
          className={`cursor-pointer rounded-xl border p-4 bg-white transition hover:border-stone-400 hover:shadow-xs ${
            filterTab === "completed" ? "border-stone-500 ring-2 ring-stone-500/10" : "border-stone-200"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Completed Trips
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {completedTrips.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Archived rentals</div>
        </div>
      </div>

      {/* Main Section Controls: Filter Tabs & Walk-in Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all" as FilterTab, label: "All Bookings", count: bookings.length },
            { id: "pending" as FilterTab, label: "Needs Clearance", count: pendingRequests.length },
            { id: "pickups" as FilterTab, label: "Give Keys", count: readyForPickup.length },
            { id: "active" as FilterTab, label: "Active Rentals", count: activeRentals.length },
            { id: "completed" as FilterTab, label: "Completed", count: completedTrips.length },
          ].map((tab) => {
            const isActive = filterTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Action: Counter Walk-In */}
        <button
          type="button"
          onClick={onOpenWalkin}
          className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <ZapIcon size={14} />
          <span>+ Walk-In Rental</span>
        </button>
      </div>

      {/* Orders List / Table */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <CalendarIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No orders found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No bookings match your search query "${searchQuery}".`
              : "There are currently no bookings in this view category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
            const customerName = getCustomerFullName(b)
            const customerPhone = b.customer?.phone || ""
            const customerEmail = b.customer?.email || ""

            const isPending =
              (b.status || "").toLowerCase().includes("pending") ||
              (b.status || "").toLowerCase().includes("advance")
            const isAssigned =
              (b.status || "").toLowerCase().includes("assigned") ||
              (b.status || "").toLowerCase().includes("approved") ||
              (b.status || "").toLowerCase().includes("confirmed")
            const isActiveRental =
              (b.status || "").toLowerCase().includes("checked out") ||
              (b.status || "").toLowerCase().includes("checked_out") ||
              (b.status || "").toLowerCase().includes("active")
            const isCompleted = (b.status || "").toLowerCase().includes("completed")
            const isBusy = processingId === b.id

            const { webUrl } = getWhatsAppUrls(
              customerPhone,
              `Hello ${customerName}, this is Motorly Dispatch regarding your reservation ${b.id}.`
            )

            return (
              <div
                key={b.id}
                className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-4 transition shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Column 1: Booking ID & Car Info */}
                <div className="flex items-start gap-3 min-w-[240px]">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200">
                    <CarIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900">{b.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPending
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : isAssigned
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : isActiveRental
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isCompleted
                            ? "bg-stone-100 text-stone-700 border border-stone-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-stone-900 mt-1">
                      {car ? car.name : "Unassigned Vehicle"}
                    </div>
                    {car?.plateNumber && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        {car.plateNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 2: Customer Details & WhatsApp */}
                <div className="min-w-[200px]">
                  <div className="text-xs font-bold text-stone-900">{customerName}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <span>{customerPhone || "No Phone"}</span>
                    {customerPhone && (
                      <a
                        href={webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                        title="Open WhatsApp chat"
                      >
                        <PhoneIcon size={12} />
                        <span className="text-[11px]">Chat</span>
                      </a>
                    )}
                  </div>
                  {customerEmail && (
                    <div className="text-[11px] text-stone-400 truncate max-w-[220px]">
                      {customerEmail}
                    </div>
                  )}
                </div>

                {/* Column 3: Dates & Total */}
                <div className="min-w-[200px] text-xs">
                  <div className="text-stone-500 flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-stone-400" />
                    <span>
                      {b.pickupDate} → {b.returnDate}
                    </span>
                  </div>
                  <div className="text-stone-900 font-bold mt-1">
                    Total: €{b.totalAmount}
                  </div>
                </div>

                {/* Column 4: Contextual Actions */}
                <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                  {/* Case 1: Pending -> Accept / Decline */}
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                      >
                        <CheckIcon size={13} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecline(b.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* Case 2: Assigned -> Give Keys */}
                  {isAssigned && (
                    <button
                      type="button"
                      onClick={() => onOpenGiveKeys(b)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <KeyIcon size={13} />
                      <span>Give Keys</span>
                    </button>
                  )}

                  {/* Case 3: Checked Out -> Return Inspection */}
                  {isActiveRental && (
                    <button
                      type="button"
                      onClick={() => onOpenReturn(b)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <CheckIcon size={13} />
                      <span>Inspect Return</span>
                    </button>
                  )}

                  {/* Case 4: Completed -> View Invoice */}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => onOpenInvoice(b)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1 border border-stone-200"
                    >
                      <FileTextIcon size={13} />
                      <span>Invoice</span>
                    </button>
                  )}

                  {/* Details Quick Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDetails(b)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition border border-stone-200"
                  >
                    Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details Slideover / Modal */}
      {selectedBookingForDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Reservation Manifest
                </span>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>{selectedBookingForDetails.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                    {selectedBookingForDetails.status}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Customer Information
              </div>
              <div className="text-xs font-semibold text-stone-900">
                {getCustomerFullName(selectedBookingForDetails)}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                Phone: {selectedBookingForDetails.customer?.phone || "No phone"}
              </div>
              {selectedBookingForDetails.customer?.email && (
                <div className="text-xs text-stone-600">
                  Email: {selectedBookingForDetails.customer.email}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Allocated Vehicle
              </div>
              {(() => {
                const c = selectedBookingForDetails.matchedCarId
                  ? carMap.get(selectedBookingForDetails.matchedCarId)
                  : null
                return c ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={c.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"}
                      alt={c.name}
                      className="w-16 h-12 rounded object-cover border border-stone-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-900">{c.name}</div>
                      <div className="text-[11px] text-stone-500">
                        {c.type || "Sedan"} • {c.plateNumber || "No plate"} • Daily Rate: €{c.pricePerDay}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500 italic">No vehicle assigned yet.</div>
                )
              })()}
            </div>

            {/* Dates & Logistics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Pickup Date</span>
                <p className="font-bold text-stone-800 mt-0.5">
                  {selectedBookingForDetails.pickupDate}
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Return Date</span>
                <p className="font-bold text-stone-800 mt-0.5">
                  {selectedBookingForDetails.returnDate}
                </p>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  const b = selectedBookingForDetails
                  setSelectedBookingForDetails(null)
                  onOpenInvoice(b)
                }}
                className="px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileTextIcon size={14} />
                <span>View Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
