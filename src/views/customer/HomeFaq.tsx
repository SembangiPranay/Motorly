import React, { useState } from "react"

interface FaqItem {
  q: string
  a: string
}

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    q: "How do I request a vehicle from the garage?",
    a: "Browse the available fleet, choose your preferred vehicle, and submit your rental dates along with your contact information. The garage manager reviews and confirms your request promptly.",
  },
  {
    q: "How does the 4-tier pricing (Hourly, Daily, Weekly, Monthly) work?",
    a: "Our fleet automatically adjusts rates to the best tier for your duration. Same-day rentals use transparent hourly rates, medium trips benefit from weekly savings, and extended stays receive discounted monthly rates with vehicle-specific VAT clearly calculated.",
  },
  {
    q: "When and how do I pay?",
    a: "No online payment or advance deposit is required upfront. You simply pay directly at the garage when you inspect the vehicle and collect the keys.",
  },
  {
    q: "What documents do I need to bring for handover?",
    a: "Please bring a valid driver's license and a government-issued photo ID upon vehicle pickup at the garage bay. The manager verifies credentials on-site.",
  },
  {
    q: "Where do I pick up and return the car?",
    a: "All pickups and returns occur directly at our garage facility. The manager inspects the car with you at pickup and drop-off, documenting mileage and condition.",
  },
]

export default function HomeFaq() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" id="faq">
      <div className="text-center mb-8">
        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#F97316] mb-1">
          QUESTIONS &amp; ANSWERS
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-2.5">
        {DEFAULT_FAQ_ITEMS.map((item, idx) => {
          const isOpen = expandedFaq === idx

          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#17191C] font-heading hover:text-[#F97316] transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <span
                  className={`text-[#F97316] text-base transform transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 text-xs text-stone-500 leading-relaxed animate-fade-in border-t border-stone-100">
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
