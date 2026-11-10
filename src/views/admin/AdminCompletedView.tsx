import React, { useState, useMemo } from "react"
import type { BookingRecord, Car } from "../../types"
import {
  FileTextIcon,
  SearchIcon,
  CalendarIcon,
  CarIcon,
  DownloadIcon,
  CheckIcon,
} from "../../components/Icons"
import { downloadBookingInvoicePng, downloadBookingInvoicePdf } from "../../utils/invoiceGenerator"

interface AdminCompletedViewProps {
  bookings: BookingRecord[]
  cars: Car[]
  searchQuery: string
  onOpenInvoice: (booking: BookingRecord) => void
  onViewBookingDetails?: (booking: BookingRecord) => void
}

type DateRange = "all" | "7d" | "30d" | "month"

const getCustomerFullName = (b: BookingRecord) => {
  const first = b.customer?.firstName || ""
  const last = b.customer?.lastName || ""
  return `${first} ${last}`.trim() || "Valued Customer"
}

export default function AdminCompletedView({
  bookings,
  cars,
  searchQuery,
  onOpenInvoice,
  onViewBookingDetails,
}: AdminCompletedViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all")
  const [localSearch, setLocalSearch] = useState("")

  const carMap = useMemo(() => {
    const map = new Map<string, Car>()
    cars.forEach((c) => map.set(c.id, c))
    return map
  }, [cars])

  // All completed records
  const completedList = useMemo(() => {
    return bookings.filter((b) => (b.status || "").toLowerCase().includes("completed"))
  }, [bookings])

  // Filtered by date and search
  const filteredRecords = useMemo(() => {
    let list = completedList

    const now = Date.now()
    if (dateRange === "7d") {
      const cut = now - 7 * 24 * 60 * 60 * 1000
      list = list.filter((b) => new Date(b.returnDate || b.pickupDate).getTime() >= cut)
    } else if (dateRange === "30d") {
      const cut = now - 30 * 24 * 60 * 60 * 1000
      list = list.filter((b) => new Date(b.returnDate || b.pickupDate).getTime() >= cut)
    }

    const term = (localSearch || searchQuery).trim().toLowerCase()
    if (term) {
      list = list.filter((b) => {
        const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
        const cName = getCustomerFullName(b).toLowerCase()
        const cPhone = (b.customer?.phone || "").toLowerCase()
        return (
          b.id.toLowerCase().includes(term) ||
          cName.includes(term) ||
          cPhone.includes(term) ||
          (car && car.name.toLowerCase().includes(term)) ||
          (car && car.plateNumber && car.plateNumber.toLowerCase().includes(term))
        )
      })
    }

    return list
  }, [completedList, dateRange, localSearch, searchQuery, carMap])

  // Financial aggregates
  const totalRevenue = useMemo(() => {
    return filteredRecords.reduce((acc, b) => acc + (b.totalAmount || 0), 0)
  }, [filteredRecords])

  return (
    <div className="space-y-6">
      {/* Header and Financial Summary */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Completed Orders & Invoice Archive
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Historical trip logs, audit records, and printable billing receipts.
          </p>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Filtered Revenue
            </div>
            <div className="text-lg font-black text-emerald-600">
              €{totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="text-right border-l border-stone-200 pl-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Trips Closed
            </div>
            <div className="text-lg font-black text-stone-900">
              {filteredRecords.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all" as DateRange, label: "All Time" },
            { id: "7d" as DateRange, label: "Last 7 Days" },
            { id: "30d" as DateRange, label: "Last 30 Days" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDateRange(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                dateRange === d.id
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search completed trips..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Completed Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <FileTextIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No completed orders found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {localSearch || searchQuery
              ? "No trips matched your search criteria."
              : "Completed and audited trips will appear in this archive automatically."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Final Odometer</th>
                  <th className="py-3 px-4">Billed Amount</th>
                  <th className="py-3 px-4 text-right">Invoicing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((b) => {
                  const car = b.matchedCarId ? carMap.get(b.matchedCarId) : null
                  const cName = getCustomerFullName(b)
                  const cPhone = b.customer?.phone || ""
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/80 transition">
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
                        <div className="font-semibold text-stone-900">{cName}</div>
                        {cPhone && <div className="text-[11px] text-stone-500">{cPhone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800">
                          {car ? car.name : "Vehicle"}
                        </div>
                        {car?.plateNumber && (
                          <div className="text-[10px] font-mono text-stone-500">
                            {car.plateNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {b.pickupDate} → {b.returnDate}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {b.odometerIn ? `${b.odometerIn.toLocaleString()} km` : "Audited"}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                        €{b.totalAmount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenInvoice(b)}
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition"
                          >
                            View Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadBookingInvoicePng(b, car || undefined)}
                            title="Download PNG Invoice"
                            className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                          >
                            <DownloadIcon size={14} />
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
    </div>
  )
}
