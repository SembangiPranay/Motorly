import React from "react"
import type { Car, BookingState } from "../../types"
import {
  LocationIcon,
  CalendarIcon,
  TagIcon,
  CheckIcon,
  ZapIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
} from "../../components/Icons"

interface AvailabilityCheckState {
  isAvailable: boolean
  conflict?: {
    pickupDate: string
    returnDate: string
    reason?: string
  }
  loading: boolean
}

interface PricingResult {
  tier: "hourly" | "daily" | "weekly" | "monthly"
  basePrice: number
  rateApplied: number
  rateLabel: string
  durationText: string
}

interface CarDetailBookingCardProps {
  car: Car
  bookingState: BookingState
  availabilityCheck: AvailabilityCheckState
  pricingResult: PricingResult
  days: number
  isSameDayBooking: boolean
  sameDayHours: number
  baseRental: number
  promoApplied: boolean
  discountPercent: number
  promoCode: string
  setPromoCode: (code: string) => void
  promoDiscountAmount: number
  vatPercent: number
  taxes: number
  grandTotal: number
  quoteMessage: string | null
  isQuoteSuccess: boolean
  isValidatingPromo: boolean
  onApplyPromo: () => void
  onRemovePromo: () => void
  onOpenScheduleModal: () => void
  onProceedToBooking: () => void
}

export default function CarDetailBookingCard({
  car,
  bookingState,
  availabilityCheck,
  pricingResult,
  days,
  isSameDayBooking,
  sameDayHours,
  baseRental,
  promoApplied,
  discountPercent,
  promoCode,
  setPromoCode,
  promoDiscountAmount,
  vatPercent,
  taxes,
  grandTotal,
  quoteMessage,
  isQuoteSuccess,
  isValidatingPromo,
  onApplyPromo,
  onRemovePromo,
  onOpenScheduleModal,
  onProceedToBooking,
}: CarDetailBookingCardProps) {
  return (
    <>
      {/* Desktop Sticky Fare Calculator Column */}
      <div className="lg:col-span-4 sticky top-28 space-y-4">
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Price Header & Live Date Availability */}
          <div className="border-b border-stone-100 pb-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-[#17191C] font-heading">
                  €{car.pricePerDay}
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  {" "}
                  / day
                </span>
              </div>
              <span className="text-xs font-semibold text-stone-400">
                €{car.pricePerHour} / hour
              </span>
            </div>

            {/* Availability Status Badge */}
            <div className="pt-1">
              {availabilityCheck.loading ? (
                <span className="text-[11px] text-stone-400 animate-pulse">
                  Checking live calendar dates...
                </span>
              ) : availabilityCheck.isAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Available for {bookingState.pickupDate} →{" "}
                  {bookingState.returnDate}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                  Reserved / Unavailable for Selected Dates
                </span>
              )}
            </div>
          </div>

          {/* Trip Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Garage Location (Pickup &amp; Return)
              </label>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <LocationIcon
                  size={16}
                  className="text-[#F97316] mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-stone-900 truncate">
                    {car.garageName || car.garageAddress || "Pit Stop Central Garage (36 Triq Il-Kbira, Mgarr)"}
                  </p>
                  <p className="text-[11px] text-stone-600 truncate mt-0.5">
                    {car.garageAddress || car.location || "Main Garage Facility"}
                  </p>
                  {car.garageBay && (
                    <span className="inline-block mt-1 text-[10px] font-mono font-bold text-amber-800 bg-white border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                      Stall: {car.garageBay}
                    </span>
                  )}
                  <a
                    href={
                      car.garageLat && car.garageLng
                        ? `https://www.google.com/maps/search/?api=1&query=${car.garageLat},${car.garageLng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            car.garageAddress ||
                              car.garageName ||
                              car.location ||
                              "Pit Stop Central Garage (36 Triq Il-Kbira, Mgarr)",
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:text-[#EA580C] bg-white border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition shadow-2xs"
                  >
                    <LocationIcon size={13} />
                    <span>📍 View on Google Maps ↗</span>
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Trip Dates &amp; Scheduling
                </label>
                <button
                  type="button"
                  onClick={onOpenScheduleModal}
                  className="text-[11px] font-bold text-[#F97316] hover:underline cursor-pointer"
                >
                  Change Dates
                </button>
              </div>
              <div
                onClick={onOpenScheduleModal}
                className="p-3 bg-stone-50 hover:bg-orange-50/50 border border-stone-200 hover:border-orange-400 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarIcon
                    size={16}
                    className="text-[#F97316] group-hover:scale-110 transition-transform shrink-0"
                  />
                  <div className="text-xs">
                    {isSameDayBooking ? (
                      <>
                        <div className="font-extrabold text-stone-900 flex items-center gap-1.5">
                          <span>{bookingState.pickupDate}</span>
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded border border-orange-200">
                            Same-Day
                          </span>
                        </div>
                        <div className="text-stone-600 text-[11px] font-medium mt-0.5">
                          Schedule:{" "}
                          <strong className="text-stone-900">
                            {bookingState.pickupTime} → {bookingState.returnTime}
                          </strong>{" "}
                          ({sameDayHours} Hours)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-stone-900">
                          {bookingState.pickupDate} ({bookingState.pickupTime})
                        </div>
                        <div className="text-stone-500 text-[11px]">
                          to {bookingState.returnDate} ({bookingState.returnTime})
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#F97316] bg-orange-100/80 px-2.5 py-1 rounded-lg shrink-0 border border-orange-200">
                  {isSameDayBooking
                    ? `${sameDayHours} Hours`
                    : `${days} ${days === 1 ? "day" : "days"}`}
                </span>
              </div>
            </div>

            {/* Atelier Privilege Voucher Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-stone-500">
                  Privilege Voucher Code
                </span>
                {promoApplied && (
                  <button
                    type="button"
                    onClick={onRemovePromo}
                    className="text-[10px] font-mono text-stone-400 hover:text-stone-900 transition cursor-pointer underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {promoApplied ? (
                <div className="p-3 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-50/80 flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <TagIcon size={13} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-stone-900 tracking-wider">
                          {promoCode}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white">
                          {discountPercent}% OFF
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Atelier Privilege Applied
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-700">
                    -€{promoDiscountAmount.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="text"
                      placeholder="ENTER PRIVILEGE CODE"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          onApplyPromo()
                        }
                      }}
                      className="w-full pl-8 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isValidatingPromo}
                    onClick={onApplyPromo}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isValidatingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {quoteMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold text-center animate-fade-in ${
                isQuoteSuccess
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-stone-100 text-stone-700 border border-stone-200"
              }`}
            >
              {quoteMessage}
            </div>
          )}

          {/* Calculated Breakdown */}
          <div className="space-y-2 pt-3 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>
                {pricingResult.tier === "hourly"
                  ? `Base Rental (${pricingResult.durationText} @ ${pricingResult.rateLabel})`
                  : pricingResult.tier === "weekly"
                    ? `Base Rental (${pricingResult.durationText} @ ${pricingResult.rateLabel})`
                    : pricingResult.tier === "monthly"
                      ? `Base Rental (${pricingResult.durationText} @ ${pricingResult.rateLabel})`
                      : `Base (€${car.pricePerDay} × ${days} ${
                          days === 1 ? "day" : "days"
                        })`}
              </span>
              <span className="font-semibold text-stone-900">
                €{baseRental.toFixed(2)}
              </span>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <TagIcon size={12} />
                  Privilege Voucher ({promoCode} • {discountPercent}% OFF)
                </span>
                <span className="font-mono">
                  -€{promoDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Dynamic Taxes (VAT {vatPercent}%)</span>
              <span className="font-semibold text-stone-900">
                €{taxes.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200 text-base font-extrabold text-[#17191C] font-heading">
              <span>Estimated Total</span>
              <span className="text-[#F97316] text-xl font-black">
                €{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Refundable Security Deposit Card */}
            <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/90 flex items-center justify-between text-xs mt-2">
              <div>
                <span className="font-bold text-stone-900 block">
                  Refundable Security Deposit
                </span>
                <span className="text-[11px] text-stone-500">
                  Pre-authorized hold at garage key release
                </span>
              </div>
              <span className="font-mono font-bold text-stone-900 text-sm">
                €{(car.securityDeposit || 1000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Book Now Primary Button */}
          <div className="space-y-2.5 pt-2">
            {!availabilityCheck.isAvailable && (
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-stone-900 text-xs space-y-2.5 shadow-2xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-stone-900">
                    <span className="w-5 h-5 rounded-md bg-amber-200/60 text-amber-800 flex items-center justify-center text-xs">
                      <AlertTriangleIcon size={13} className="text-amber-800" />
                    </span>
                    <span>Schedule Conflict</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Reserved
                  </span>
                </div>
                <div className="p-2.5 bg-white/95 rounded-lg border border-amber-200/70 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-stone-800 font-mono text-xs font-bold">
                    <CalendarIcon size={13} className="text-amber-700 shrink-0" />
                    <span>
                      {availabilityCheck.conflict?.pickupDate ||
                        bookingState.pickupDate}
                    </span>
                    <span className="text-stone-400">→</span>
                    <span>
                      {availabilityCheck.conflict?.returnDate ||
                        bookingState.returnDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    This car already has an approved reservation during this
                    period.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenScheduleModal}
                  className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 rounded-lg font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon size={13} className="text-[#F97316]" />
                  <span>Adjust Rental Dates</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onProceedToBooking}
              disabled={!availabilityCheck.isAvailable}
              className={`w-full py-3.5 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group text-sm cursor-pointer ${
                !availabilityCheck.isAvailable
                  ? "bg-stone-300 text-stone-600 cursor-not-allowed opacity-80"
                  : "bg-[#F97316] hover:bg-[#EA580C] text-white hover:shadow-lg active:scale-[0.99]"
              }`}
            >
              {!availabilityCheck.isAvailable ? (
                <span>Unavailable for Selected Dates</span>
              ) : (
                <>
                  <ZapIcon size={16} />
                  <span>Request This Car (Pay on Pickup)</span>
                  <ArrowRightIcon
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <CheckIcon size={14} className="text-emerald-600 flex-shrink-0" />
              <span>Zero online payment • 100% free reservation request</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon size={14} className="text-emerald-600 flex-shrink-0" />
              <span>Pay at garage when manager accepts your request</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon size={14} className="text-emerald-600 flex-shrink-0" />
              <span>Free cancellation anytime before vehicle key handover</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Sticky Floating Booking Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between lg:hidden shadow-2xl">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-stone-900 font-heading">
              €{car.pricePerDay}
            </span>
            <span className="text-xs text-stone-500 font-semibold">/day</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700">
            €{grandTotal.toFixed(2)} total • {days} {days === 1 ? "day" : "days"}
          </p>
        </div>
        <button
          type="button"
          onClick={onProceedToBooking}
          disabled={!availabilityCheck.isAvailable}
          className={`h-11 px-5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
            !availabilityCheck.isAvailable
              ? "bg-stone-300 text-stone-600 cursor-not-allowed"
              : "bg-[#F97316] hover:bg-[#EA580C] text-white active:scale-95"
          }`}
        >
          <ZapIcon size={14} />
          <span>
            {availabilityCheck.isAvailable ? "Instant Book" : "Reserved"}
          </span>
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </>
  )
}
