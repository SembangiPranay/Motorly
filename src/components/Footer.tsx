import React from "react"
import type { ViewMode } from "../types"

export default function Footer({
  onNavigate,
}: {
  onNavigate: (view: ViewMode) => void
}) {
  return (
    <footer className="bg-[#17191C] text-white pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F97316] rounded-xl flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-extrabold tracking-tight font-heading">
                MOTORLY
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Local garage fleet and vehicle rentals. Clean cars, transparent
              pricing, and direct manager service.
            </p>
            <div className="text-xs text-gray-400">
              <p>Garage Service Facility • Bay 1 Handoff</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Garage Fleet
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  All Garage Vehicles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  Sedans &amp; Hatchbacks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  SUVs &amp; Crossovers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("compare")}
                  className="text-amber-500 hover:text-amber-400 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Side-by-Side Compare</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Rental Info
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li
                onClick={() => onNavigate("home")}
                className="hover:text-[#F97316] transition-colors cursor-pointer"
              >
                How It Works
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                Pay Upon Vehicle Pickup
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                Direct Inspection &amp; Keys
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                Frequently Asked Questions
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Garage Hours &amp; Contact
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Phone:</span>
                <a
                  href="tel:+15551234567"
                  className="hover:text-white transition-colors"
                >
                  +1 (555) 123-4567
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Email:</span>
                <a
                  href="mailto:nanikoushik96@gmail.com?subject=Motorly%20Fleet%20Inquiry"
                  className="hover:text-white transition-colors underline"
                >
                  nanikoushik96@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Hours:</span>
                <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 Garage Fleet Management. All rights reserved.</p>
          <div className="flex space-x-6 items-center">
            <span className="hover:text-gray-400 cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-gray-400 cursor-pointer">
              Rental Agreement
            </span>
            <span className="hover:text-gray-400 cursor-pointer">
              Garage Policies
            </span>
            <button
              onClick={() => onNavigate("admin")}
              className="text-stone-600 hover:text-stone-400 text-[11px] font-mono transition cursor-pointer"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
