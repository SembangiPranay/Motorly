import React from "react"
import { SparklesIcon } from "../../components/Icons"

interface PresetItem {
  name: string
  badge: string
  ids: string[]
}

interface ComparePresetsProps {
  presets: PresetItem[]
  onApplyPreset: (ids: string[]) => void
}

export default function ComparePresets({
  presets,
  onApplyPreset,
}: ComparePresetsProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-7 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#F97316] border border-orange-200 mb-2.5">
            <SparklesIcon size={14} />
            <span>Smart Vehicle Comparison Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17191C] font-heading">
            Side-by-Side Fleet Matcher
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Compare rental rates across tiers, seating capacity, powertrains, and garage stalls side by side.
          </p>
        </div>

        {/* Curated Presets */}
        <div className="flex-1 lg:max-w-md">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Instant Comparison Presets:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onApplyPreset(preset.ids)}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="min-w-0 pr-1">
                  <span className="text-xs font-bold text-stone-900 group-hover:text-[#F97316] transition-colors block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Fleet Presets
                  </span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
