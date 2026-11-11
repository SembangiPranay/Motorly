import React from "react"
import type { BookingRecord, Car } from "../types"
import {
  FileTextIcon,
  PrinterIcon,
  DownloadIcon,
  PhoneIcon,
  MailIcon,
  CheckIcon,
  ShieldIcon,
  LocationIcon,
  CarIcon,
  ClockIcon,
  CalendarIcon,
  SparklesIcon,
  TagIcon,
} from "./Icons"
import {
  downloadBookingInvoicePng,
  downloadBookingInvoicePdf,
  type InvoiceSettings,
} from "../utils/invoiceGenerator"
import { openWhatsAppDirect } from "../utils/whatsapp"
import PitStopLogo from "./PitStopLogo"

interface InvoiceModalProps {
  booking: BookingRecord | null
  car?: Car
  settings?: InvoiceSettings
  onClose: () => void
}

export default function InvoiceModal({
  booking,
  car,
  settings,
  onClose,
}: InvoiceModalProps) {
  if (!booking) return null

  const hubAddress =
    settings?.hub_address ||
    car?.garageAddress ||
    car?.garageName ||
    "Main Garage Facility, Bay 1 Handoff Station, Miami, FL 33101"
  const contactPhone = settings?.contact_phone || "+1 (555) 234-5678"
  const contactEmail = settings?.contact_email || "rentals@pitstopcarhire.com"
  const adminName = settings?.admin_name || "Studio Director"

  const customerName =
    (booking.customer as any).name ||
    `${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() ||
    "Verified Client"
  const customerLicense =
    booking.driver?.licenseNumber ||
    (booking.customer as any).licenseNumber ||
    "FL-VERIFIED-CLEARED"

  // Calculate pricing components
  const dailyRate = car?.pricePerDay || 55
  const totalAmount = Number(booking.totalAmount) || 0
  const isExtensionApproved =
    booking.extensionStatus === "Approved" && Boolean(booking.extensionQuote)
  const extensionAmount = isExtensionApproved
    ? Number(
        booking.extensionQuote?.totalQuotedAmount ||
          (booking.extensionQuote as any)?.quotedPrice ||
          (booking.extensionQuote as any)?.rateAmount ||
          0,
      )
    : 0

  // Damage details from return inspection
  const damageFee = Number(booking.checklistIn?.damageFee) || 0
  const hasDamage = Boolean(booking.checklistIn?.damageFound || damageFee > 0)
  const damageSeverity = booking.checklistIn?.damageSeverity || "Damage"
  const damageLocation = booking.checklistIn?.damageLocation || "Exterior"
  const damageNotes = booking.checklistIn?.damageNotes || ""

  const baseRentalSubtotal = Math.max(0, totalAmount - extensionAmount - damageFee)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPng = async () => {
    try {
      await downloadBookingInvoicePng(booking, car, settings)
    } catch (err) {
      console.error("Failed to generate invoice PNG", err)
      alert("Failed to generate invoice image. Please use Print / Save as PDF.")
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await downloadBookingInvoicePdf(booking, car, settings)
    } catch (err) {
      console.error("Failed to generate invoice PDF", err)
      alert("Failed to generate invoice PDF. Please try Print / Save as PDF.")
    }
  }

  const handleSendWhatsApp = () => {
    const text = `*PIT STOP CAR HIRE - OFFICIAL TRIP INVOICE*\nInvoice #${booking.id}\nClient: ${customerName}\nVehicle: ${car?.brand || ""} ${car?.model || "Fleet Vehicle"} (${car?.plateNumber || "FL-908-MTR"})\nDuration: ${booking.pickupDate} to ${booking.returnDate}\nTotal Settled: €${totalAmount.toFixed(2)}\nStatus: PAID & AUDITED\n\nThank you for choosing Pit Stop Car Hire (Mgarr, Malta)!`
    openWhatsAppDirect(booking.customer.phone, text)
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      `Pit Stop Car Hire - Trip Invoice #${booking.id}`,
    )
    const body = encodeURIComponent(
      `Hello ${customerName},\n\nPlease find your official trip receipt and completed rental invoice for reservation #${booking.id}.\n\nVehicle: ${car?.brand || ""} ${car?.model || "Fleet Vehicle"} (${car?.plateNumber || "FL-908-MTR"})\nRental Period: ${booking.pickupDate} to ${booking.returnDate}\nTotal Amount Paid: €${totalAmount.toFixed(2)}\nReturn Status: Inspected & Settled\n\nThank you for driving with Pit Stop Car Hire.\n\nBest regards,\n${adminName}\nPit Stop Fleet Management`,
    )
    window.location.href = `mailto:${booking.customer.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div
        className="bg-white text-stone-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 print:hidden">
          <div className="flex items-center gap-2">
            <PitStopLogo size="sm" showText={false} variant="badge" />
            <div>
              <span className="font-heading font-black text-xs sm:text-sm tracking-wide uppercase">
                Official Trip Invoice
              </span>
              <span className="ml-2 font-mono text-[10px] text-stone-400">
                #{booking.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print or Save as PDF"
            >
              <PrinterIcon size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Download high-resolution PNG image"
            >
              <DownloadIcon size={14} />
              <span className="hidden sm:inline">Download PNG</span>
            </button>

            {booking.customer.phone && (
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Send invoice summary via WhatsApp"
              >
                <PhoneIcon size={13} />
                <span className="hidden md:inline">WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Document Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 print:p-8 print:overflow-visible">
          {/* Header row: Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <PitStopLogo size="lg" showText={false} variant="badge" />
                <div>
                  <h1 className="font-heading font-black text-xl tracking-tight text-stone-950">
                    PIT STOP CAR HIRE
                  </h1>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                    Executive Fleet Management &amp; Dispatch
                  </p>
                </div>
              </div>
              <div className="text-xs text-stone-500 mt-3 space-y-0.5 font-sans leading-relaxed">
                <p className="flex items-center gap-1">
                  <LocationIcon size={12} className="text-[#F97316] shrink-0" />
                  <span>{hubAddress}</span>
                </p>
                <p>
                  Tel: {contactPhone} • Email: {contactEmail}
                </p>
                <p className="text-[10px] font-mono text-stone-400">
                  Tax / Commercial Registry: MT-MGARR-PS-99827
                </p>
              </div>
            </div>

            <div className="sm:text-right flex flex-col sm:items-end">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold tracking-wider uppercase mb-1.5">
                ● PAID &amp; SETTLED
              </span>
              <div className="font-mono text-xs text-stone-500 space-y-0.5">
                <p>
                  <strong className="text-stone-800">Invoice:</strong> INV-
                  {booking.id}
                </p>
                <p>
                  <strong className="text-stone-800">Booking Ref:</strong>{" "}
                  {booking.id}
                </p>
                <p>
                  <strong className="text-stone-800">Date Issued:</strong>{" "}
                  {new Date(booking.createdAt || Date.now()).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
                <p>
                  <strong className="text-stone-800">Type:</strong>{" "}
                  {booking.notes?.includes("WALK-IN") ||
                  booking.notes?.includes("Walk-In")
                    ? "Counter Walk-In Dispatch"
                    : "Direct Web Reservation"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-stone-200 text-xs">
            {/* Client Info */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                Billed To (Client &amp; Verified Driver)
              </span>
              <p className="font-bold text-stone-900 text-sm">{customerName}</p>
              <p className="text-stone-600 font-mono">
                Phone: {booking.customer.phone || "On File"}
              </p>
              <p className="text-stone-600">
                Email: {booking.customer.email || "guest@pitstopcarhire.com"}
              </p>
              <p className="text-stone-500 text-[11px] pt-1 border-t border-stone-200/60">
                Driver License:{" "}
                <span className="font-mono font-bold text-stone-800">
                  {customerLicense}
                </span>
              </p>
            </div>

            {/* Vehicle & Hub Specs */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                Mated Fleet Vehicle &amp; Staging
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-sm">
                  {car?.brand || "Fleet"} {car?.model || "Vehicle"} (
                  {car?.year || 2024})
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-stone-200 text-stone-800">
                  {car?.type || "Sedan"}
                </span>
              </div>
              <p className="text-stone-700 font-mono font-bold">
                Plate: {car?.plateNumber || "FL-908-MTR"}
              </p>
              <p className="text-stone-600">
                Handoff Hub: {car?.garageName || "Main Garage Facility"} (
                {car?.garageBay || "Bay 5-C"})
              </p>
              <p className="text-stone-500 text-[11px] pt-1 border-t border-stone-200/60">
                Policy Coverage: {car?.insurancePolicy || "POL-STF-994021"}
              </p>
            </div>
          </div>

          {/* Trip Timeline & Inspection Telemetry */}
          <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-orange-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ClockIcon size={14} className="text-[#F97316]" />
                Trip Itinerary &amp; Audit Return Verification
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Audit Pass (98%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
              <div className="space-y-1">
                <p className="text-[10px] text-stone-500 uppercase font-mono font-bold">
                  Departure &amp; Key Release
                </p>
                <p className="font-bold text-stone-900">{booking.pickupDate}</p>
                <p className="text-[11px] text-stone-500 font-mono">
                  Odometer Out:{" "}
                  {booking.odometerOut ?? car?.currentOdometer ?? 14250} mi •
                  Fuel: {booking.fuelLevelOut ?? "Full (100%)"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-stone-500 uppercase font-mono font-bold">
                  Final Return &amp; Key Check-in
                </p>
                <p className="font-bold text-stone-900">{booking.returnDate}</p>
                <p className="text-[11px] text-stone-500 font-mono">
                  Odometer In:{" "}
                  {booking.odometerIn ?? (car?.currentOdometer ?? 14250) + 380}{" "}
                  mi • Fuel: {booking.fuelLevelIn ?? "Full (100%)"}
                </p>
              </div>
            </div>

            {isExtensionApproved && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckIcon size={14} className="text-emerald-600 shrink-0" />
                  Trip Extension Approved (+
                  {booking.extensionQuote?.durationValue ?? 1}{" "}
                  {booking.extensionQuote?.durationUnit ?? "days"})
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  +€${extensionAmount.toFixed(2)} added
                </span>
              </div>
            )}

            {booking.checklistIn?.damageFound && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="flex items-center gap-1.5 font-bold text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Return Damage Incident:{" "}
                    {booking.checklistIn.damageSeverity || "Documented"} (
                    {booking.checklistIn.damageLocation || "Exterior"})
                  </span>
                  {booking.checklistIn.damageNotes && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      {booking.checklistIn.damageNotes}
                    </p>
                  )}
                </div>
                {Number(booking.checklistIn.damageFee) > 0 && (
                  <span className="font-mono font-bold text-rose-700">
                    +€${Number(booking.checklistIn.damageFee).toFixed(2)}{" "}
                    assessment
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-500 mb-2">
              Itemized Rental Charges &amp; Settlements
            </h4>
            <div className="rounded-xl border border-stone-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-700 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Description</th>
                    <th className="py-2.5 px-4 font-bold text-center">
                      Unit Rate
                    </th>
                    <th className="py-2.5 px-4 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900">
                        Primary Vehicle Rental Reservation
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {car?.brand || "Fleet"} {car?.model || "Car"} • Initial
                        booked duration
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-stone-600">
                      €${dailyRate}/day
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      €${baseRentalSubtotal.toFixed(2)}
                    </td>
                  </tr>

                  {isExtensionApproved && (
                    <tr className="bg-emerald-50/30">
                      <td className="py-3 px-4">
                        <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckIcon size={12} className="text-emerald-600" />
                          Manager-Quoted Extension (+
                          {booking.extensionQuote?.durationValue ?? 1}{" "}
                          {booking.extensionQuote?.durationUnit ?? "days"})
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Authorized extension to {booking.returnDate}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-600">
                        Flat Quote
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        +€${extensionAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {booking.promoCode && (
                    <tr className="bg-emerald-50/20">
                      <td className="py-3 px-4">
                        <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <TagIcon size={12} className="text-emerald-600" />
                          Atelier Privilege Voucher ({booking.promoCode})
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Promotional privilege discount recognized and settled
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">
                        Privilege
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        Applied
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-stone-800">
                        Collision Damage Waiver &amp; Roadside Protection
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Full comprehensive commercial insurance
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-stone-500">
                      Standard
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-stone-600">
                      €0.00 (Included)
                    </td>
                  </tr>

                  {/* Vehicle Damage Assessment line item when damage is recorded */}
                  {(damageFee > 0 || hasDamage) && (
                    <tr className="bg-rose-50/70 border-t border-rose-200">
                      <td className="py-2.5 px-4">
                        <p className="font-bold text-rose-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                          Vehicle Damage Assessment &amp; Repair
                        </p>
                        <p className="text-[11px] text-rose-700">
                          [{damageSeverity}] {damageLocation}
                          {damageNotes ? ` • ${damageNotes}` : ""}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-rose-800 text-xs font-semibold">
                        Certified
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                        +€{damageFee.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-stone-800">
                        Sanitation, Inspection &amp; Bay Staging Prep
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-stone-500">
                      Comp
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-stone-600">
                      €0.00
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-stone-800">
                        Refundable Security Deposit
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Returned in full after vehicle audit clearance
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-stone-500">
                      €250.00
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                      Released (€0.00 net)
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-stone-50/80 border-t border-stone-200">
                  <tr>
                    <td
                      colSpan={2}
                      className="py-3.5 px-4 text-right font-bold text-stone-700 text-sm font-heading"
                    >
                      TOTAL SETTLED AMOUNT PAID:
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-xl text-[#F97316]">
                      €{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Sign-off & Stamp */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="font-bold text-stone-800">
                Audited &amp; Authorized By: {adminName}
              </p>
              <p className="text-[11px]">
                Pit Stop Central Garage (36 Triq Il-Kbira, Mgarr) • Vehicle Keys Returned
                &amp; Checked
              </p>
            </div>

            <div className="border-2 border-emerald-600/40 rounded-xl px-4 py-2 text-center text-emerald-800 font-mono font-black tracking-widest uppercase text-xs rotate-[-2deg] bg-emerald-50/50">
              ✓ OFFICIAL RECEIPT · PAID
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="p-3 sm:px-6 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <p className="text-[11px] text-stone-500 font-mono">
            Generated directly from Pit Stop Car Hire Dispatch Database
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <MailIcon size={13} />
              <span>Email Receipt</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download high-resolution image format"
            >
              <DownloadIcon size={14} />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download printable official A4 PDF document"
            >
              <DownloadIcon size={14} />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
