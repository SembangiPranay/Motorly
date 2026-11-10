import React, { useState } from "react"
import type { PromoCode } from "../../types"
import { TagIcon, PlusIcon, TrashIcon, CheckIcon } from "../../components/Icons"

interface AdminPromosViewProps {
  promos: PromoCode[]
  onCreatePromo: (data: {
    code: string
    discountPercent: number
    description: string
    expiryDate: string
  }) => Promise<void>
  onTogglePromo: (code: string) => Promise<void>
  onDeletePromo: (code: string) => Promise<void>
}

export default function AdminPromosView({
  promos,
  onCreatePromo,
  onTogglePromo,
  onDeletePromo,
}: AdminPromosViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [discountPercent, setDiscountPercent] = useState(15)
  const [description, setDescription] = useState("")
  const [expiryDate, setExpiryDate] = useState("2027-12-31")
  const [isBusy, setIsBusy] = useState(false)

  const activeCount = promos.filter((p) => p.isActive).length
  const inactiveCount = promos.length - activeCount
  const totalRedemptions = promos.reduce((sum, p) => sum + (p.usageCount || 0), 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return
    setIsBusy(true)
    try {
      await onCreatePromo({
        code: newCode.trim().toUpperCase(),
        discountPercent,
        description: description.trim() || `VIP Privilege ${newCode.trim().toUpperCase()}`,
        expiryDate: expiryDate || "2027-12-31",
      })
      setNewCode("")
      setDescription("")
      setDiscountPercent(15)
      setIsModalOpen(false)
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (code: string) => {
    if (window.confirm(`Delete promo voucher code "${code}"?`)) {
      await onDeletePromo(code)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Privileges & Coupon Registry
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Curate exclusive VIP discount vouchers, regulate privileges, and monitor redemption rankings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <PlusIcon size={14} />
          <span>+ Create New Privilege</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Active Rules
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Live at customer checkout</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Blocked / Paused
          </div>
          <div className="text-2xl font-black text-stone-600 mt-1">{inactiveCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Disabled vouchers</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Redemptions
          </div>
          <div className="text-2xl font-black text-orange-600 mt-1">{totalRedemptions}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Applied fleet discounts</div>
        </div>
      </div>

      {/* Promos Table */}
      {promos.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <TagIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No promo codes registered</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Click "+ Create New Privilege" to add your first discount code for customer bookings.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Concession</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {promos.map((p) => (
                  <tr key={p.code} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 font-mono">
                      {p.discountPercent}% OFF
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {p.description || "VIP Privilege Voucher"}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700">
                      {p.usageCount || 0} times
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "PAUSED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onTogglePromo(p.code)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                            p.isActive
                              ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {p.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.code)}
                          className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete promo"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Promo Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Create New Privilege Voucher
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP2026 or SUMMER20"
                  className="w-full h-9 px-3 text-xs uppercase font-mono font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 10)}
                  className="w-full h-9 px-3 text-xs font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekend special discount"
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
                >
                  {isBusy ? "Saving..." : "Create Privilege"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
