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
              Premium car rental service designed for modern travelers. Clean
              cars, transparent pricing, and effortless booking.
            </p>
            <div className="text-xs text-gray-400">
              <p>Miami • Los Angeles • New York • Orlando</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Fleet &amp; Booking
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  All Vehicles (17)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  Economy &amp; Compact
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  Sedans &amp; Luxury
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  SUVs &amp; 4x4
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("listing")}
                  className="hover:text-[#F97316] transition-colors"
                >
                  Passenger Vans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("compare")}
                  className="text-amber-500 hover:text-amber-400 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>⚡ Side-by-Side Compare</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Support &amp; Policies
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                How It Works
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                Insurance &amp; Coverage
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                Free 24h Cancellation
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                24/7 Roadside Assistance
              </li>
              <li className="hover:text-[#F97316] transition-colors cursor-pointer">
                FAQs
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-200 mb-4 font-heading">
              Contact &amp; Assistance
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Phone:</span>
                <a
                  href="tel:+13051234567"
                  className="hover:text-white transition-colors"
                >
                  +1 (305) 123-4567
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Email:</span>
                <span>support@motorly.com</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#F97316] font-semibold">Hours:</span>
                <span>24/7 Available Worldwide</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 MOTORLY Rental Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-gray-400 cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-gray-400 cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-gray-400 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
