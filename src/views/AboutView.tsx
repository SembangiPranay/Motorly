import React from "react"
import type { ViewMode } from "../types"
import {
  ShieldIcon,
  CheckIcon,
  CarIcon,
  SparklesIcon,
  ArrowRightIcon,
  LocationIcon,
  ClockIcon,
} from "../components/Icons"

interface AboutViewProps {
  onNavigate: (view: ViewMode) => void
}

export default function AboutView({ onNavigate }: AboutViewProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17191C] animate-fade-in pb-24">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <button
            onClick={() => onNavigate("home")}
            className="hover:text-[#F97316] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>&gt;</span>
          <span className="text-stone-900 font-bold">About the Garage</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/90 text-[#F97316] text-xs font-black uppercase tracking-wider">
              <SparklesIcon size={14} className="text-[#F97316]" />
              <span>Independent Boutique Car Rental</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#17191C] tracking-tight font-heading leading-[1.08]">
              One Owner. One Garage. <br />
              <span className="text-[#F97316]">Zero Counter Nonsense.</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
              MOTORLY was built as the direct antithesis to corporate airport
              car rental agencies. We are an independent, single-operator garage
              fleet where every vehicle is personally owned, meticulously
              inspected, and handed over to you directly by the owner in under 3
              minutes.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="text-2xl font-black text-[#F97316] font-heading">
                  3 Min
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  Average Bay Handoff
                </div>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="text-2xl font-black text-emerald-600 font-heading">
                  100%
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  Exact Car Guarantee
                </div>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="text-2xl font-black text-stone-900 font-heading">
                  $0
                </div>
                <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                  Hidden Airport Fees
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-stone-200 bg-stone-900 relative aspect-4/3 group">
              <img
                src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
                alt="Garage fleet facility and pristine vehicles"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
                  Main Bay Facility
                </span>
                <h3 className="text-base font-bold font-heading">
                  Direct Bay 1 Key Exchange
                </h3>
                <p className="text-xs text-stone-300">
                  Clean, climate-controlled inspection bay with dedicated owner
                  walkaround.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Independent Boutique vs Corporate Agencies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#17191C] font-heading">
            Why Rent from an Independent Garage?
          </h2>
          <p className="text-sm text-stone-500">
            Big rental corporations treat you like a barcode in a 50-person
            terminal line. Here is how renting from a dedicated owner makes all
            the difference.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600 font-heading">
                  <th className="py-4 px-6 font-bold">
                    Rental Experience Feature
                  </th>
                  <th className="py-4 px-6 font-extrabold text-[#F97316] bg-orange-50/50">
                    MOTORLY (Independent Owner)
                  </th>
                  <th className="py-4 px-6 font-semibold text-stone-500">
                    Corporate Agencies (Hertz / Avis / Budget)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    Vehicle Selection
                  </td>
                  <td className="py-4 px-6 bg-orange-50/30 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckIcon
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>
                      Exact model guaranteed. The photos you see are the exact
                      car you get.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    "Or similar" disclaimer. Frequent downgrades to whatever is
                    left in the lot.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    Pickup Speed
                  </td>
                  <td className="py-4 px-6 bg-orange-50/30 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckIcon
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>
                      Under 3 minutes. Meet the owner at the bay, inspect, and
                      take the keys.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    30–60 minute terminal queues, aggressive counter upsells,
                    and slow paperwork.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    Pricing &amp; Transparency
                  </td>
                  <td className="py-4 px-6 bg-orange-50/30 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckIcon
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>
                      Total quoted is total paid upon pickup. Zero surprise fees
                      or credit holds.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    Airport concession fees, energy recovery fees, and
                    unexpected toll charges.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    Vehicle Cleanliness &amp; Care
                  </td>
                  <td className="py-4 px-6 bg-orange-50/30 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckIcon
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>
                      Personally detailed, sanitized, and mechanically checked
                      by the owner.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    Rushed 2-minute automated car washes, lingering odors, and
                    neglected wiper blades.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-stone-900">
                    Customer Support
                  </td>
                  <td className="py-4 px-6 bg-orange-50/30 text-emerald-700 font-bold flex items-center gap-2">
                    <CheckIcon
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <span>
                      Direct cellular &amp; WhatsApp phone line to the owner.
                      Instant response.
                    </span>
                  </td>
                  <td className="py-4 px-6 text-stone-500">
                    Offshore call center phone trees with 45-minute hold times.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The 5 Pillars of Our Service */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F97316]">
            Our Operating Principles
          </span>
          <h2 className="text-3xl font-black text-stone-900 font-heading">
            The 5 Commitments of Every Rental
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              100% Guaranteed Exact Model
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              When you reserve a Honda Civic or a Porsche Panamera, that is the
              exact vehicle waiting for you. We never play the "or similar
              vehicle" substitution trick.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              Pay Upon Vehicle Pickup
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              No online credit card pre-charges or advance lock-ins. You inspect
              the vehicle in person, verify its pristine condition, and pay
              directly upon key handoff.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              Direct Garage Manager Service
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              You deal directly with the person who owns the fleet. Any
              question, custom schedule adjustment, or flight delay is handled
              immediately via direct phone or WhatsApp.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              4
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              Cleanliness &amp; Safety First
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Every car goes through a multi-point inspection before release:
              tire pressures, synthetic oils, brake wear, interior sanitization,
              and full exterior detailing.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
              5
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              Flexible Rental Durations
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Whether you need a car for 3 hours to attend an executive client
              meeting, a weekend getaway, or a multi-month flexible
              subscription, we have custom rates designed for you.
            </p>
          </div>

          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-orange-400">
                Ready to Experience It?
              </span>
              <h3 className="text-xl font-bold font-heading mt-1">
                Browse Available Fleet
              </h3>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Check our live certified inventory and submit a reservation
                request in seconds.
              </p>
            </div>
            <button
              onClick={() => onNavigate("listing")}
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <span>Explore All Vehicles</span>
              <ArrowRightIcon size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Owner Profile & Facility Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3">
              <div className="w-28 h-28 rounded-full bg-stone-900 text-white flex items-center justify-center text-4xl font-extrabold shadow-lg border-4 border-orange-100">
                M
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-stone-900 font-heading">
                  Marcus Vance
                </h3>
                <p className="text-xs text-[#F97316] font-bold">
                  Owner &amp; Fleet Director
                </p>
              </div>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                12+ years of automotive management and private fleet operations.
                Personally guarantees every reservation.
              </p>
            </div>

            <div className="lg:col-span-8 border-t lg:border-t-0 lg:border-l border-stone-200 pt-6 lg:pt-0 lg:pl-10 space-y-5">
              <h3 className="text-2xl font-black text-stone-900 font-heading">
                "When you rent from me, my reputation is on the line with every
                key turn."
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                I started this garage because I was tired of corporate car
                rental bait-and-switch tactics. When people travel for business
                or a family vacation, the last thing they need is counter
                hostility, surprise insurance hard-sells, or finding out the
                vehicle they reserved isn't on the lot.
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                Every vehicle in my garage is serviced on an aggressive
                preventative schedule. When you land or arrive at our facility,
                your car is staged in Bay 1, spotless, filled with fuel, and
                ready for you to drive off in minutes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate("contact")}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Contact Owner Directly
                </button>
                <button
                  onClick={() => onNavigate("listing")}
                  className="px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  View Garage Vehicles
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
