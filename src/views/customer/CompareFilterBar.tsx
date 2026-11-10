import React from "react"
import { TagIcon, FuelIcon, SparklesIcon } from "../../components/Icons"

interface CompareFilterBarProps {
  activeTab: "all" | "pricing" | "specs" | "garage" | "features"
  setActiveTab: (tab: "all" | "pricing" | "specs" | "garage" | "features") => void
  showOnlyDifferences: boolean
  setShowOnlyDifferences: React.Dispatch<React.SetStateAction<boolean>>
  differenceCount: number
}

export default function CompareFilterBar({
  activeTab,
  setActiveTab,
  showOnlyDifferences,
  setShowOnlyDifferences,
  differenceCount,
}: CompareFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Specs", icon: null },
          { id: "pricing", label: "Pricing & Tiers", icon: <TagIcon size={13} /> },
          { id: "specs", label: "Powertrain & Space", icon: <FuelIcon size={13} /> },
          { id: "garage", label: "Garage Hub", icon: null },
          { id: "features", label: "Equipment & Tech", icon: <SparklesIcon size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#17191C] text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Differences Toggle */}
      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyDifferences}
            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
            className="w-4 h-4 rounded text-[#F97316] focus:ring-[#F97316] accent-[#F97316] cursor-pointer"
          />
          <span>Show Differences Only</span>
          {differenceCount > 0 && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#F97316]">
              {differenceCount} Diffs
            </span>
          )}
        </label>
      </div>
    </div>
  )
}
