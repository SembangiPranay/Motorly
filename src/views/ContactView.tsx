import React, { useState } from "react"
import type { ViewMode } from "../types"
import {
  LocationIcon,
  ClockIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldIcon,
  CarIcon,
} from "../components/Icons"

interface ContactViewProps {
  onNavigate: (view: ViewMode) => void
}

export default function ContactView({ onNavigate }: ContactViewProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dates: "",
    preferredVehicle: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const ownerPhone = "+1 (555) 123-4567"
  const ownerEmail = "nanikoushik96@gmail.com"
  const garageAddress =
    "Main Garage Facility, Bay 1 Handoff Station, Miami, FL 33101"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    // Automatically construct formatted WhatsApp inquiry
    const inquiryText = `🚗 *MOTORLY – RENTAL INQUIRY*
----------------------------------------
*From:* ${formData.name}
*Phone:* ${formData.phone || "Not provided"}
*Email:* ${formData.email}
*Preferred Dates:* ${formData.dates || "Flexible"}
*Preferred Vehicle:* ${formData.preferredVehicle || "Any available"}

*Message:*
${formData.message}

_Sent via MOTORLY Direct Contact Portal_`

    const cleanPhone = ownerPhone.replace(/[^\d]/g, "")
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(inquiryText)}`

    // Open WhatsApp in new tab for direct conversation
    try {
      window.open(whatsappUrl, "_blank")
    } catch {}
  }

  const faqs = [
    {
      q: "Can I pick up or drop off outside normal operating hours?",
      a: "Yes. Because our garage operates with direct owner coordination, early morning flights (e.g. 5:00 AM) or late night arrivals (e.g. 11:30 PM) can easily be accommodated with advance notice.",
    },
    {
      q: "What payment methods are accepted at the garage bay?",
      a: "We accept all major credit cards (Visa, MasterCard, Amex), debit cards, and contactless digital payments upon key handoff. You inspect the vehicle first before any charge is processed.",
    },
    {
      q: "What is the security deposit policy?",
      a: "A standard refundable pre-authorization hold of $200 is placed at key handoff and released immediately when the car is returned with no new damages and agreed fuel level.",
    },
    {
      q: "How does fuel work?",
      a: "Vehicles are handed over with a full tank of fuel. Simply return the car with the same fuel level. If you don't have time to refuel, we refill it at local pump rate with no penalty surcharge.",
    },
    {
      q: "What documents must I present?",
      a: "A valid, unexpired driver's license (US or international) and matching government photo ID. Drivers must be at least 21 years of age.",
    },
  ]

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
          <span className="text-stone-900 font-bold">
            Contact &amp; Bay Location
          </span>
        </nav>
      </div>

      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/90 text-[#F97316] text-xs font-black uppercase tracking-wider">
            <SparklesIcon size={14} className="text-[#F97316]" />
            <span>Direct Manager Communication</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 font-heading tracking-tight leading-tight">
            Speak Directly with the <br />
            <span className="text-[#F97316]">Person Who Holds Your Keys.</span>
          </h1>
          <p className="text-base text-stone-600 leading-relaxed">
            No automated phone trees. No offshore ticket queues. When you reach
            out to MOTORLY, you are speaking directly with the garage owner who
            personally services and prepares your vehicle.
          </p>
        </div>
      </section>

      {/* 3 Direct Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Direct Phone */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center text-xl font-bold">
                📞
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-heading">
                Direct Cellular Phone
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Direct mobile line to the garage manager for urgent bookings,
                airport flight delay updates, or inquiries.
              </p>
              <div className="text-base font-extrabold text-stone-900 font-mono">
                {ownerPhone}
              </div>
            </div>
            <a
              href={`tel:${ownerPhone.replace(/[^\d]/g, "")}`}
              className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-[#F97316] font-bold text-xs rounded-xl border border-orange-200 text-center transition block cursor-pointer"
            >
              Call Manager Directly
            </a>
          </div>

          {/* Card 2: WhatsApp Chat */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                💬
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-heading">
                Instant WhatsApp Chat
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Send vehicle photos, custom dates, or driver license
                pre-clearance directly over WhatsApp.
              </p>
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                ⚡ Typical response: Under 5 mins
              </div>
            </div>
            <a
              href={`https://api.whatsapp.com/send?phone=${ownerPhone.replace(/[^\d]/g, "")}&text=${encodeURIComponent("Hello! I am interested in renting a car from MOTORLY.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center transition block cursor-pointer shadow-xs"
            >
              Open Direct WhatsApp
            </a>
          </div>

          {/* Card 3: Priority Email */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center text-xl font-bold">
                ✉️
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-heading">
                Priority Email Inbox
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Send corporate travel invoices, long-term flex lease inquiries,
                or special vehicle requests.
              </p>
              <div className="text-xs font-mono font-bold text-stone-800 break-all">
                {ownerEmail}
              </div>
            </div>
            <a
              href={`mailto:${ownerEmail}?subject=MOTORLY%20Rental%20Inquiry`}
              className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl text-center transition block cursor-pointer"
            >
              Send Direct Email
            </a>
          </div>
        </div>
      </section>

      {/* Main Grid: Bay Facility Details + Interactive Contact Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Garage Facility Location & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600">
                  Key Handoff Facility
                </span>
                <h3 className="text-xl font-black text-stone-900 font-heading mt-1">
                  Garage Bay 1 Location
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  All vehicle handoffs and returns take place directly at our
                  dedicated private facility.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
                    <LocationIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      Physical Facility Address
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-mono">
                      {garageAddress}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Enter Gate B &bull; Drive straight to Bay 1 inspection
                      staging
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ClockIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      Operating Bay Hours
                    </h4>
                    <div className="text-xs text-stone-600 space-y-0.5 mt-1">
                      <p>
                        <strong className="text-stone-800">
                          Monday – Saturday:
                        </strong>{" "}
                        8:00 AM – 8:00 PM
                      </p>
                      <p>
                        <strong className="text-stone-800">Sunday:</strong> 9:00
                        AM – 6:00 PM
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold pt-1">
                        &bull; 24/7 Roadside Assistance for all active rentals
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      Handoff Process (Under 3 Mins)
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      1. Park in customer bay &bull; 2. 60-second visual
                      walkaround with the owner &bull; 3. Collect keys and drive
                      off.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Map Visual Staging Card */}
            <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-900 p-6 text-white space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 font-mono">
                  GPS Coordinates
                </span>
                <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                  Miami Central
                </span>
              </div>
              <h4 className="text-lg font-bold font-heading">
                Need Directions or Airport Pickup?
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                If you are arriving at Miami International Airport (MIA), our
                facility is a quick 8-minute ride. Contact the manager in
                advance to stage your vehicle ready at the curb.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://maps.google.com/?q=${encodeURIComponent(garageAddress)}`,
                    "_blank",
                  )
                }}
                className="w-full py-2.5 bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Open in Google Maps</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: Direct Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-xl space-y-6">
              <div>
                <h3 className="text-2xl font-black text-stone-900 font-heading">
                  Send a Direct Message to the Manager
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Have a custom question, need special booking dates, or want to
                  check vehicle availability? Fill in the details below and we
                  will get back to you immediately.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3 animate-fade-in text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-base font-extrabold font-heading">
                    Inquiry Dispatched Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
                    Your message has been sent to the garage manager via
                    WhatsApp and priority email. Marcus will contact you shortly
                    to confirm availability and discuss your request.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({
                        name: "",
                        phone: "",
                        email: "",
                        dates: "",
                        preferredVehicle: "",
                        message: "",
                      })
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Alex Mercer"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Phone Number (WhatsApp Preferred) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+1 (305) 555-0199"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="alex@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Intended Rental Dates
                      </label>
                      <input
                        type="text"
                        value={formData.dates}
                        onChange={(e) =>
                          setFormData({ ...formData, dates: e.target.value })
                        }
                        placeholder="e.g. Nov 5 - Nov 9, 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Preferred Vehicle Category or Specific Model
                    </label>
                    <input
                      type="text"
                      value={formData.preferredVehicle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredVehicle: e.target.value,
                        })
                      }
                      placeholder="e.g. Premium SUV, Sedan, or specific model"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Message or Special Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Tell us about your trip, flight details, or specific vehicle preferences..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <span>Send Message Directly to Manager</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F97316]">
            Clear Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-heading">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-stone-900 hover:text-orange-600 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span
                    className={`text-base font-mono transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
