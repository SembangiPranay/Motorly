import React, { useState, useEffect } from "react"
import { ShieldIcon, CheckIcon, LockIcon, AlertTriangleIcon } from "./Icons"

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
        className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shrink-0">
              <ShieldIcon size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-orange-400">
                Official Pit Stop Car Hire Rental Agreement (Mgarr, Malta)
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                36 Triq Il-Kbira, Mgarr • 21 Operating Clauses &amp; Legal Disclosures
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
            21 Rental Clauses (Authentic Agreement)
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
            €700 Excess &amp; €80 Cleaning Fee (Clauses 4 &amp; 16)
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
            Comprehensive Cover &amp; Flood Policy
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
            GDPR &amp; Malta Privacy Notice
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-xs text-stone-700 space-y-4 leading-relaxed">
          {/* TAB 1: 21 AUTHENTIC CLAUSES */}
          {activeTab === "terms" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Pit Stop Car Hire — Official Rental Agreement Terms &amp; Conditions
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Verbatim replication of the physical rental contract executed at 36 Triq Il-Kbira, Mgarr, Malta (Tel: 99827192 / 99804255).
                </p>
              </div>

              <div className="space-y-3 font-normal text-stone-800">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    1) Territorial Scope &amp; Authorized Equipment
                  </strong>
                  The vehicle (Car, Van and Scooter) and other rentals (Stroller, Booster and Playpen) shall be used exclusively for the purpose of social domestic and pleasure purposes or business purposes within Malta and Gozo.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    2) Mechanical Condition &amp; Return Obligation
                  </strong>
                  The vehicle is in good mechanical condition, and state of repair and must be returned in the same state and condition, wear and tear excepted at the termination of hire.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    3) Damage Reporting &amp; Unauthorized Repairs Prohibition
                  </strong>
                  The Person who is using our rental services must inform Pit Stop Car Hire of any loss of damage/s to, or fault/s in the vehicle or rental. Use of the vehicle or rental when damaged or faulty shall be at the person&apos;s responsibility/risk who is using our rental. Unauthorized repairs are not allowed, and if such repairs are done, the Person who is using our rental services shall be responsible for any faults/issues or damages caused as a result.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    4) Standard €700 Insurance Excess
                  </strong>
                  The Person who is using our rental services shall be responsible for the normal insurance excess amount of €700 in respect to any claims that could rise. This amount may only be exempt in accordance with the option given overleaf at an extra cost.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    5) Comprehensive Insurance &amp; Hirer Breach Liability
                  </strong>
                  The vehicle is provided with fully comprehensive insurance. If the vehicle is used or driven against the terms of either this agreement or the insurance policy, the Person who is using our rental services shall be liable for the payment of all damages.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    6) Examination &amp; Acceptance of Insurance Policy
                  </strong>
                  The Person who is using our rental services declares that he/she has examined the insurance policy regarding the vehicle, accepts the terms, and acknowledges that he/she is aware of his/her rights and responsibilities under the said insurance policy and that these have been explained to him/her.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    8) Subrogation of Legal Remedies
                  </strong>
                  The Person who is using our rental services is responsible to delegate and replace to Pit Stop Car Hire in any right or remedies for the scope of enforcing such rights and remedies or to obtain relief or compensation from third parties in respect of any loss or damage to or in relation with their agreement within the time the rental is being used.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    9) Stored / Transported Property Liability Disclaimer
                  </strong>
                  Pit Stop Car Hire shall not be responsible for any loss of or damage to any loss of property, stored property or transported property in the vehicle by the Person who is using our rental services. The Person who is using our rental services will be responsible for all risks during the duration of the agreement and yields all claims against Pit Stop Car Hire.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    10) Right of Repossession
                  </strong>
                  Pit Stop Car Hire may at any time repossess the vehicle without giving notice to the Person who is using our rental services provided there is a justified reason. Rights under this agreement may only be waived when a written instrument duly signed by accredited representative is presented.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    11) Traffic Fines, Contraventions &amp; Towing Fees
                  </strong>
                  The Person who is using our rental services accepts to pay any fines for traffic violations or road contraventions. The Person who is using our rental services will be also responsible for any related fees incurred for recovery of a towed vehicle due to law infringement. The Person who is using our rental services gives permission to Pit Stop Car Hire to charge them to his/her credit card account (including in his absence) along with any administration charges. However such fees may instead be paid for on the spot in cash and receipts are provided.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    12) Breakdown Delays Limitation
                  </strong>
                  Pit Stop Car Hire does not accept liability for delays as a consequence of breakdowns or similar occurrences.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    13) Tyres &amp; Punctures Hirer Responsibility
                  </strong>
                  Any tyre damages, including punctures are the Hiree&apos;s (Person who is using our rental services) responsibility and as such shall be paid by Person who is using our rental services.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    14) 24-Hour Billing &amp; Key Return Rule
                  </strong>
                  The Person who is using our rental services will be charged accordingly on a minimum of a 24hours basis. However this is waived off if the car keys are left at our premises at the agreed date, time and place. If the Hiree does not do so (Leave the car keys at the agreed date, time and place), then it will be understood that the Hiree intends to extend the Hire of his/her rental.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    15) Rental Extension Authorization
                  </strong>
                  Pit Stop Car Hire cannot guarantee the automatic extension of any rental agreement and reserves the right to claim back the rental from Person who is using our rental services in the case of an unauthorized rental extension.
                </div>

                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-rose-950">
                  <strong className="text-rose-900 block font-bold mb-1">
                    16) €80 Cleaning Fee Penalty
                  </strong>
                  A fee of €80 will be charged if necessary if the vehicle is returned excessively/unusually dirty (e.g. pet hair, spilled food/drink, excessive garbage, stickers on windows, the presence of bodily fluids, etc).
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-amber-950">
                  <strong className="text-amber-900 block font-bold mb-1">
                    17) Excessive Speeding &amp; Offroading Prohibition
                  </strong>
                  The Person who is using our rental services agrees to and is responsible not to drive the vehicle at excessive speeds which go above the local laws and offroading is forbidden.
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-amber-950">
                  <strong className="text-amber-900 block font-bold mb-1">
                    18) Floodwater Driving Prohibition
                  </strong>
                  The Person who is using our rental services agrees and must not drive the vehicle through floodwater, park in any known flood areas according to the list supplied with the vehicle. The Person who is using our rental services shall be responsible for any costs and damages induced by non-conforming to these related terms.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    19) Anti-Theft Precautions &amp; Key Removal
                  </strong>
                  The Person who is using our rental services agrees to never leave vehicle prior to engaging the steering lock, removing the key from the ignition and arming the anti-theft device where applicable. The Person who is using our rental services will be liable for any costs and damages induced by non-conforming to these related terms.
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    20) Non-Allowed Prohibited Uses
                  </strong>
                  The Person who is using our rental services also agrees that the vehicle shall not be used by or for the following non allowed purposes:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-stone-700">
                    <li>a) By a driver who is not authorized to use the vehicle.</li>
                    <li>b) By any driver known or suspected to be under the influence of alcohol, drugs, or anything else known to cause deficiency in driving ability.</li>
                    <li>c) For any unlawful purpose.</li>
                    <li>d) In any abusive or careless manner.</li>
                    <li>e) To carry individuals or property for rental.</li>
                    <li>f) To tow or push anything.</li>
                    <li>g) For any race, competition or training activity.</li>
                  </ul>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <strong className="text-stone-900 block font-bold mb-1">
                    21) Client Endorsement &amp; Signature
                  </strong>
                  The Person who is using our rental services acknowledges having carefully read, understood and agreed to each of the terms contained within this agreement and endorses the condition schematic on the front page.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: €700 EXCESS & €80 CLEANING FEE */}
          {activeTab === "deposit" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Security Deposit, Insurance Excess &amp; Cleaning Fee Schedule
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Governed strictly under Clause 4 and Clause 16 of the Pit Stop Car Hire Agreement.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Clause 4 — Normal Insurance Excess (€700)
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px] leading-relaxed">
                    Under the standard comprehensive policy, the renter is liable for up to €700 excess per incident. A pre-authorization hold is placed on your credit or debit card at garage pickup. This hold is released immediately when the vehicle is returned in good mechanical and cosmetic condition (fair wear and tear excepted per Clause 2).
                  </p>
                </div>

                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-rose-950">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-rose-900">
                    <AlertTriangleIcon size={14} className="text-rose-600" />
                    Clause 16 — Excessive Dirtiness Penalty (€80 Cleaning Fee)
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Vehicles must be returned in a clean and respectable state. An automatic fee of <strong>€80</strong> will be assessed if the vehicle is returned unusually or excessively dirty. This includes:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    <li>Pet hair or animal fur on upholstery</li>
                    <li>Spilled drinks, coffee, sugary fluids or food stains</li>
                    <li>Excessive beach sand, mud, or garbage accumulation</li>
                    <li>Adhesive stickers or decals applied to windows or bodywork</li>
                    <li>Bodily fluids or biohazards requiring professional ozone sanitization</li>
                  </ul>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Optional Collision Excess Waiver (+€15/Day)
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px] leading-relaxed">
                    You can elect to hire the optional Excess Reduction Waiver in Clause 1, which reduces the €700 standard excess down to €0 liability for covered accidental bodywork damages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPREHENSIVE COVER & FLOOD POLICY */}
          {activeTab === "insurance" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Comprehensive Insurance Scope &amp; Environmental Exclusions
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Operates under Malta insurance guidelines and Pit Stop fleet standards.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Clause 5 — Fully Comprehensive Fleet Insurance
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    All Pit Stop Car Hire vehicles are provided with third-party liability and comprehensive insurance coverage within the Maltese Islands (Malta &amp; Gozo).
                  </p>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-amber-950">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                    <AlertTriangleIcon size={14} className="text-amber-600" />
                    Clause 18 — Floodwater Driving &amp; Low-Lying Parking Prohibition
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    During sudden Mediterranean storm downpours, flash floods can occur in specific valley routes (e.g. Msida Valley, Birkirkara, Qormi, Burmarrad). Driving through standing floodwater or parking in known flood zones is strictly prohibited. Water ingestion into engine intakes is not covered by insurance and the hirer is 100% liable for resulting mechanical repairs.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    Clause 13 — Tyres, Punctures &amp; Wheel Rims
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Under standard rental terms across Malta, tyre punctures and curb sidewall cuts are the hirer&apos;s direct responsibility. A spare wheel or repair sealant kit is supplied with every vehicle.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GDPR & MALTA PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Malta Data Protection Act (Cap. 586) &amp; EU GDPR Notice
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Lawful data processing for car rental dispatch, identity verification, and police contravention compliance.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <LockIcon size={13} className="text-orange-600" />
                    Purpose of Collection
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px] leading-relaxed">
                    We collect your full name, ID / Passport number, mobile phone number, driver&apos;s license number, and email address strictly to execute the rental agreement (Art. 6(1)(b) GDPR) and to comply with legal traffic contravention notification requirements under Maltese law (Art. 6(1)(c) GDPR).
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CheckIcon size={13} className="text-emerald-600" />
                    No Commercial Third-Party Sharing
                  </h4>
                  <p className="mt-1 text-stone-600 text-[11px]">
                    Your information is never sold, leased, or distributed to advertising agencies. Data is disclosed only to authorized government authorities (e.g. LESA Local Enforcement System Agency, Malta Police Force, Transport Malta) in the event of unpaid parking or speeding contraventions incurred during your rental.
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
            <span>Pit Stop Car Hire (Mgarr, Malta) • Official Registered Fleet Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Print Agreement Copy
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs transition shadow-xs cursor-pointer"
            >
              I Understand &amp; Endorse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
