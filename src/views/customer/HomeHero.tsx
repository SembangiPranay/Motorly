import React from "react"
import { ArrowRightIcon } from "../../components/Icons"

interface HomeHeroProps {
  onSearch: () => void
}

export default function HomeHero({ onSearch }: HomeHeroProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Content Column: Bold Editorial Typography & Direct Atelier Narrative */}
        <div className="lg:col-span-6 z-10 flex flex-col justify-center space-y-6 lg:pr-4">
          {/* Eyebrow - Clean uppercase text with generous tracking */}
          <div className="inline-flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316]">
              MOTORLY ATELIER • PRIVATE FLEET CONCIERGE
            </p>
          </div>

          {/* Bold Graphic Editorial Headline (Matching Reference "NEW LUXURY") */}
          <h1 className="text-5xl sm:text-7xl lg:text-[76px] font-black tracking-[-0.035em] text-[#17191C] leading-[1.02] font-heading">
            NEW LUXURY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-orange-500 to-amber-500">
              MOBILITY.
            </span>
          </h1>

          {/* Editorial Narrative */}
          <p className="text-base sm:text-lg text-stone-600 max-w-lg leading-relaxed font-normal">
            No middleman fleet site. Exclusively dedicated to verified garage collections, luxury highway cruisers, and pristine private rentals. Transparent rates, direct manager handoff, zero counter queues.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSearch}
              className="px-6 py-3.5 bg-[#17191C] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Explore The Fleet</span>
              <ArrowRightIcon
                size={14}
                className="group-hover:translate-x-1 transition-transform text-[#F97316]"
              />
            </button>
            <a
              href="#fleet-categories"
              className="px-5 py-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Curated Categories
            </a>
          </div>
        </div>

        {/* Right Hero Image: Unboxed Staging Floating on Canvas (Matching Reference) */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          <div className="w-full relative flex flex-col items-center justify-center group">
            {/* Subtle Studio Ambient Spotlight behind car */}
            <div className="absolute w-[460px] h-[240px] bg-gradient-to-tr from-orange-500/10 via-amber-200/15 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* The Unboxed Hero Vehicle Image (Clean, No Box Border) */}
            <div className="relative w-full max-w-xl aspect-[16/10] flex items-center justify-center overflow-visible">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury flagship performance vehicle staged at atelier"
                className="w-full h-full object-contain filter drop-shadow-[0_22px_38px_rgba(0,0,0,0.18)] group-hover:scale-[1.02] transition-transform duration-700 select-none"
              />
              {/* Natural Ground Contact Shadow */}
              <div className="absolute -bottom-1 inset-x-10 h-6 bg-stone-900/15 rounded-full blur-md -z-10" />
            </div>

            {/* Minimalist Editorial Floating Spec Badge */}
            <div className="mt-3 inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-stone-200/80 shadow-xs text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-stone-900 font-heading">
                Atelier Staged Vehicle
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500 font-medium">
                Pre-inspected &amp; Bay Sanitized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
