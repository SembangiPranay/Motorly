import React, { useState, useEffect } from "react"
import { ShieldIcon, FileTextIcon, CheckIcon, LockIcon } from "./Icons"

export interface LegalPoliciesModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "privacy" | "terms" | "deposit" | "insurance"
}

export default function LegalPoliciesModal({
  isOpen,
  onClose,
  initialTab = "terms",
}: LegalPoliciesModalProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "deposit" | "insurance">(initialTab)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // Esc key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/90 text-white flex items-center justify-center font-black shrink-0">
              <ShieldIcon size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                Regulatory Disclosures &amp; Rental Agreements
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                Motorly Atelier — Operating Policies &amp; Legal Disclosures
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50/80 px-4 sm:px-6 overflow-x-auto shrink-0 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === "terms"
                ? "border-orange-600 text-orange-600 bg-white/60"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            Rental Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === "privacy"
                ? "border-orange-600 text-orange-600 bg-white/60"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            US Privacy &amp; CAN-SPAM Notice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deposit")}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === "deposit"
                ? "border-orange-600 text-orange-600 bg-white/60"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            Security Deposit Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("insurance")}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === "insurance"
                ? "border-orange-600 text-orange-600 bg-white/60"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            Protection &amp; Liability
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-xs text-stone-700 space-y-4 leading-relaxed">
          {/* TAB 1: RENTAL TERMS */}
          {activeTab === "terms" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Master Vehicle Rental Agreement (US Operations)
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Governs all vehicle requests, garage handovers, and vehicle operations.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    1. Authorized Driver Qualifications
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    All primary and additional drivers must be at least <strong>18 years of age</strong> (25+ for selected high-performance exotic vehicles) and hold a valid, unexpired driver&apos;s license issued by a recognized government jurisdiction or international driving authority.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    2. Station Check-In &amp; Physical Verification
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Vehicle keys are dispatched at the operating garage facility following physical identity verification, driver&apos;s license presentation, and credit card pre-authorization. Zero charges are assessed online until the vehicle is physically inspected and accepted at handover.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    3. Prohibited Uses of Fleet Vehicles
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Vehicles may not be used: (a) by unauthorized drivers; (b) for speed contests, racing, or track exhibitions; (c) for subleasing, commercial towing, or illicit transport; (d) on unpaved or non-public roadways; or (e) while under the influence of alcohol, narcotics, or intoxicating substances.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    4. Fuel and Mileage Policy
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Vehicles are delivered with a 100% full tank or 90%+ battery charge and must be returned at the equivalent level. Standard unlimited mileage applies across all domestic state borders unless explicitly indicated otherwise on the booking manifest.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & CAN-SPAM */}
          {activeTab === "privacy" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  US Privacy Notice &amp; CAN-SPAM Email Disclosure
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Compliance with Federal Trade Commission (FTC) standards, CAN-SPAM Act of 2003 (15 U.S.C. § 7701), and the California Consumer Privacy Act (CCPA/CPRA).
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-amber-950">
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    <LockIcon size={13} className="text-amber-700" />
                    Notice at Collection: What We Collect &amp; Why
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    When you enter your <strong>Email Address</strong>, Phone Number, Name, and Driver Credentials, we collect this data strictly for:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    <li>Sending transactional reservation vouchers, key codes, and digital receipt invoices.</li>
                    <li>Notifying you when the Fleet Operations Manager accepts and assigns your vehicle.</li>
                    <li>Regulatory fraud prevention, identity authentication, and vehicle safety audits.</li>
                  </ul>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Zero Data-Selling Guarantee
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Motorly Atelier never sells, rents, leases, or trades your email address or personal contact information to external third-party advertisers, telemarketers, or commercial data brokers.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    CAN-SPAM Electronic Communications Consent &amp; Opt-Out
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    By submitting a reservation request, you consent to receive direct electronic messages regarding your trip itinerary. All promotional or marketing communications (such as privilege codes) contain a 1-click unsubscribe link. Transactional booking confirmations cannot be unsubscribed while a trip is active.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Your Privacy Rights (CCPA / State Privacy Rights)
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    You hold the right to request access to the personal data we hold about you, request corrections, or request deletion of account records following the conclusion of your rental audit. Direct privacy inquiries to: <span className="font-mono text-stone-800">privacy@motorly.com</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY DEPOSIT POLICY */}
          {activeTab === "deposit" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Vehicle-Specific Refundable Security Deposit Policy
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Tiered deposits, pre-authorization hold procedures, and release timeline.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    1. Tiered Security Deposit Schedule
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Each fleet asset carries a customized refundable deposit reflective of vehicle value:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <div className="p-2 bg-white rounded-lg border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Economy / Sedan</span>
                      <strong className="text-sm font-black text-stone-900">€500 – €800</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">SUVs / Crossovers</span>
                      <strong className="text-sm font-black text-stone-900">€1,200 – €1,800</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Luxury / Supercars</span>
                      <strong className="text-sm font-black text-stone-900">€2,500 – €3,500</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    2. Pre-Authorization (Not an Immediate Charge)
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    The security deposit is placed as a temporary credit card pre-authorization hold at the time of key handover. Funds remain in your account but are temporarily ring-fenced by your issuing bank.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    3. Release Schedule Upon Return
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Upon checking the vehicle back into the garage and completing the joint walk-around inspection without unrecorded exterior damage, the hold is immediately released by our dispatch terminal. Depending on your financial institution, funds reflect within 24 to 72 business hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSURANCE & LIABILITY */}
          {activeTab === "insurance" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Comprehensive Fleet Protection &amp; Liability Coverage
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Coverage tiers, liability boundaries, and roadside emergency dispatch.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Comprehensive Premium Shield (€0 Deductible Included)
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    All Motorly Atelier rentals automatically include primary collision damage waiver (CDW), third-party bodily injury liability up to statutory limits, and comprehensive theft protection with €0 deductible under normal permitted operating conditions.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    24/7 Concierge Roadside Dispatch
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    In the event of tire puncture, mechanical fault, or battery depletion, 24/7 expedited emergency assistance and vehicle replacement are accessible directly through our dedicated dispatch hotline: <strong>(555) 019-9922</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>US FTC, CAN-SPAM &amp; CCPA Regulatory Compliance Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Print Policy Copy
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs transition shadow-xs cursor-pointer"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
