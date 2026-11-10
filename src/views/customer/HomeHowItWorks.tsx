import React from "react"
import { CarIcon, ShieldIcon, ZapIcon } from "../../components/Icons"

interface StepItem {
  step: string
  title: string
  desc: string
  icon: React.ReactNode
}

const STEPS: StepItem[] = [
  {
    step: "01",
    title: "1. Choose a Vehicle",
    desc: "Explore available cars in our garage with clear daily, weekly, and monthly rates.",
    icon: <CarIcon size={20} />,
  },
  {
    step: "02",
    title: "2. Submit Request",
    desc: "Pick your rental dates and fill in your contact details. No online payment required upfront.",
    icon: <ShieldIcon size={20} />,
  },
  {
    step: "03",
    title: "3. Manager Approval & Pickup",
    desc: "The garage manager approves your request. Inspect your car, pay on arrival, and pick up the keys.",
    icon: <ZapIcon size={20} />,
  },
]

export default function HomeHowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="how-it-works">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316] mb-1">
          SIMPLE PROCESS
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
          How It Works
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Straightforward rental reservation and pickup in three simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-2xs relative group hover:shadow-md transition-shadow"
          >
            <span className="text-3xl font-black text-stone-200 font-heading absolute top-5 right-5 pointer-events-none select-none">
              {s.step}
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-4">
              {s.icon}
            </div>
            <h3 className="text-base font-bold text-[#17191C] font-heading mb-1.5">
              {s.title}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
