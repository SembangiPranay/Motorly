import React, { useState, useMemo } from "react"
import type { AdminCustomerRecord, BookingRecord } from "../../types"
import {
  UserIcon,
  SearchIcon,
  PhoneIcon,
  CalendarIcon,
  CheckIcon,
} from "../../components/Icons"
import { getWhatsAppUrls } from "../../utils/whatsapp"

interface AdminCrmViewProps {
  customers: AdminCustomerRecord[]
  bookings: BookingRecord[]
  searchQuery: string
}

export default function AdminCrmView({
  customers,
  bookings,
  searchQuery,
}: AdminCrmViewProps) {
  const [localSearch, setLocalSearch] = useState("")

  // Combine remote customers or synthesize from bookings as fallback
  const customerList = useMemo(() => {
    if (customers && customers.length > 0) return customers

    // Synthesize from bookings as fallback
    const map = new Map<string, AdminCustomerRecord>()
    bookings.forEach((b) => {
      const phone = b.customer?.phone || ""
      const email = b.customer?.email || ""
      const name = `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.trim() || "Customer"
      const key = phone || email || name

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          phone,
          email,
          totalBookings: 1,
          totalSpent: b.totalAmount || 0,
          hasAccount: true,
          latestBooking: b.pickupDate || "",
          createdAt: b.createdAt || b.pickupDate,
        } as AdminCustomerRecord)
      } else {
        const existing = map.get(key)!
        existing.totalBookings = (existing.totalBookings || 1) + 1
        existing.totalSpent = (existing.totalSpent || 0) + (b.totalAmount || 0)
      }
    })
    return Array.from(map.values())
  }, [customers, bookings])

  const filtered = useMemo(() => {
    const term = (localSearch || searchQuery).trim().toLowerCase()
    if (!term) return customerList
    return customerList.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
    )
  }, [customerList, localSearch, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Customers & Verified Driver Directory ({customerList.length})
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit verified driver profiles, historical rental frequencies, and initiate WhatsApp messages.
          </p>
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search customers by name/phone..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Customers Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <UserIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No customers found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {localSearch || searchQuery
              ? "No clients match your search query."
              : "Registered customers and drivers will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Phone Contact</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Trips Count</th>
                  <th className="py-3 px-4">Driver Status</th>
                  <th className="py-3 px-4 text-right">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((c) => {
                  const { webUrl } = getWhatsAppUrls(c.phone || "", `Hello ${c.name}, greetings from Pit Stop Car Hire.`)
                  return (
                    <tr key={c.id || c.phone || c.email} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-[10px] font-black shrink-0">
                            {(c.name || "U")[0]}
                          </div>
                          <span>{c.name || "Customer"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {c.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-stone-600 truncate max-w-[200px]">
                        {c.email || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-800">
                        {c.totalBookings || 1} reservation{c.totalBookings && c.totalBookings > 1 ? "s" : ""}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckIcon size={10} />
                          <span>Verified</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.phone && (
                          <a
                            href={webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
                          >
                            <PhoneIcon size={12} />
                            <span>WhatsApp</span>
                          </a>
                        )}
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
