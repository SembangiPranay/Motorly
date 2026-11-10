import React from "react"
import type { VehicleType } from "../../types"
import { ArrowRightIcon } from "../../components/Icons"

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

export interface FleetCategoryItem {
  type: VehicleType
  label: string
  price: string
  image: string
  description: string
}

export const FLEET_CATEGORIES: FleetCategoryItem[] = [
  {
    type: "Sedan",
    label: "Sedan",
    price: "From €45/day",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
    description: "Quiet, executive comfort for city and highway travel.",
  },
  {
    type: "SUV",
    label: "SUV & 4x4",
    price: "From €65/day",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    description: "All-terrain confidence with generous passenger space.",
  },
  {
    type: "Luxury",
    label: "Performance GT",
    price: "From €120/day",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    description: "Refined German engineering and high-output dynamics.",
  },
  {
    type: "Economy",
    label: "Economy Flex",
    price: "From €35/day",
    image:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    description: "Smart daily commuters with exceptional fuel efficiency.",
  },
]

interface HomeCategoriesProps {
  onSelectCategory: (category: VehicleType) => void
  onViewAll?: () => void
}

export default function HomeCategories({
  onSelectCategory,
  onViewAll,
}: HomeCategoriesProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="fleet-categories">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
              CURATED CATEGORIES
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
            Explore Fleet by Format
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            High-definition category selection inspired by classic automotive ateliers.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F97316] hover:text-[#EA580C] transition-colors group cursor-pointer"
        >
          <span>View All Categories</span>
          <ArrowRightIcon
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>

      {/* 4 Landscape Editorial Cards (Matching Reference bottom row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {FLEET_CATEGORIES.map((cat) => (
          <div
            key={cat.type}
            onClick={() => onSelectCategory(cat.type)}
            className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
          >
            {/* 16:10 Landscape Cinematic Vehicle Photography */}
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
              <img
                src={cat.image}
                alt={cat.label}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Floating Minimal Spec Tag */}
              <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                {cat.price}
              </div>
            </div>

            {/* Minimalist Card Footer */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#17191C] font-heading group-hover:text-[#F97316] transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  {cat.description}
                </p>
              </div>
              <span className="w-7 h-7 rounded-lg bg-stone-50 group-hover:bg-orange-50 text-stone-400 group-hover:text-[#F97316] border border-stone-200/80 flex items-center justify-center transition-colors shrink-0 ml-2">
                <ArrowRightIcon
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
