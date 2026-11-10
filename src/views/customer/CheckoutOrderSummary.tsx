import React from "react"
import type { Car, BookingState } from "../../types"
import {
  CalendarIcon,
  TagIcon,
  CheckIcon,
  ZapIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
} from "../../components/Icons"

interface PricingResult {
  tier: "hourly" | "daily" | "weekly" | "monthly"
  basePrice: number
  rateApplied: number
  rateLabel: string
  durationText: string
}

interface ConflictData {
  pickupDate: string
  returnDate: string
  status?: string
}

interface CheckoutOrderSummaryProps {
  car: Car
  bookingState: BookingState
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
  conflict: ConflictData | null
  submitting: boolean
  onApplyPromo: () => void
  onRemovePromo: () => void
  onOpenScheduleModal: () => void
}

export default function CheckoutOrderSummary({
  car,
  bookingState,
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
  conflict,
  submitting,
  onApplyPromo,
  onRemovePromo,
  onOpenScheduleModal,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="lg:col-span-4 sticky top-28 space-y-4">
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="font-heading font-extrabold text-base text-[#17191C] border-b border-stone-100 pb-3">
          Rental Summary
        </h3>

        {/* Vehicle Mini Card */}
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
          <div className="w-16 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-stone-200 flex items-center justify-center">
            <img
              src={car.image}
              alt={car.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-stone-900 truncate font-heading">
              {car.name}
            </h4>
            <p className="text-[10px] text-stone-500">
              {car.type} • {car.transmission} • {car.fuelType}
            </p>
          </div>
        </div>

        {/* Itinerary */}
        <div className="space-y-3 text-xs border-b border-stone-100 pb-4">
          <div
            onClick={onOpenScheduleModal}
            className="flex items-start justify-between p-2.5 rounded-xl hover:bg-orange-50/50 border border-transparent hover:border-orange-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-2">
              <CalendarIcon
                size={14}
                className="text-[#F97316] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform"
              />
              <div>
                {isSameDayBooking ? (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-stone-900 block text-xs">
                        Same-Day Rental ({sameDayHours} Hours)
                      </span>
                      <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.2 rounded">
                        Same-Day Return
                      </span>
                    </div>
                    <span className="text-stone-700 text-xs font-semibold block mt-0.5">
                      Date:{" "}
                      <span className="text-stone-900 font-bold">
                        {bookingState.pickupDate}
                      </span>
                    </span>
                    <span className="text-stone-500 text-[11px] block mt-0.5">
                      Schedule:{" "}
                      <strong className="text-stone-800">
                        {bookingState.pickupTime} → {bookingState.returnTime}
                      </strong>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-stone-900 block text-xs">
                      Dates ({days} {days === 1 ? "Day" : "Days"} Duration)
                    </span>
                    <span className="text-stone-500 text-xs">
                      {bookingState.pickupDate} ({bookingState.pickupTime}) →{" "}
                      {bookingState.returnDate} ({bookingState.returnTime})
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenScheduleModal()
              }}
              className="text-[#F97316] text-[11px] font-bold hover:underline cursor-pointer ml-2 shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* European Atelier Privilege Voucher Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
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
        </div>

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
        </div>

        {/* Conflict Warning */}
        {conflict && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangleIcon size={14} className="text-amber-700" />
              <span>Schedule Conflict Warning</span>
            </div>
            <p className="text-[11px] text-amber-800">
              This vehicle already has a reservation on selected dates.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group text-sm cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <span>Securing Reservation Request...</span>
          ) : (
            <>
              <ZapIcon size={16} />
              <span>Confirm Reservation (Pay on Pickup)</span>
              <ArrowRightIcon
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          )}
        </button>

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
  )
}
