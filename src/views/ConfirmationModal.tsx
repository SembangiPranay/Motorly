import React from "react"
import { createPortal } from "react-dom"
import type { Car, BookingState, CustomerInfo } from "../types"
import {
  CheckIcon,
  CalendarIcon,
  LocationIcon,
  QrCodeIcon,
} from "../components/Icons"

interface ConfirmationModalProps {
  bookingId: string
  car: Car
  bookingState: BookingState
  customer: CustomerInfo
  totalAmount: number
  onClose: () => void
  onNavigateHome: () => void
  onNavigateListing: () => void
  onNavigateAdmin?: () => void
  onNavigateMyBookings?: () => void
}

export default function ConfirmationModal({
  bookingId,
  car,
  bookingState,
  customer,
  totalAmount,
  onClose,
  onNavigateHome,
  onNavigateListing,
  onNavigateAdmin,
  onNavigateMyBookings,
}: ConfirmationModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative space-y-5 my-auto border border-stone-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close cross */}
        <button
          data-testid="close-confirmation-modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Success Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckIcon size={32} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
            Request Submitted • Awaiting Manager Acceptance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
            Booking Request Sent!
          </h2>
          <p className="text-xs text-gray-500">
            Zero online payment charged. Our fleet manager will review your dates and accept your request. You will pay at the garage hub when collecting your keys!
          </p>
        </div>

        {/* Boarding Pass Style Voucher */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-4 text-xs relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Reservation Reference
              </p>
              <p className="font-extrabold text-[#F97316] text-base font-mono">
                {bookingId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Primary Driver
              </p>
              <p className="font-bold text-gray-800 text-sm">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
          </div>

          {/* Vehicle mini details */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0">
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 font-heading text-sm truncate">
                {car.name}
              </h4>
              <p className="text-gray-500 text-[11px]">
                {car.type} • {car.transmission} •{" "}
                {car.plateNumber || "FL-492-MTR"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-emerald-700 font-bold uppercase">
                Due on Pickup
              </p>
              <p className="font-extrabold text-base text-gray-900 font-mono">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Itinerary */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
            <div>
              <div className="flex items-center gap-1 text-gray-400 font-semibold mb-0.5">
                <LocationIcon size={12} className="text-[#F97316]" />
                <span>Garage Location</span>
              </div>
              <p className="font-bold text-gray-800 text-[11px] leading-tight">
                {car.garageName ||
                  car.garageAddress ||
                  car.location ||
                  bookingState.pickupLocation}
              </p>
              {car.garageBay && (
                <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                  {car.garageBay}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1 text-gray-400 font-semibold mb-0.5">
                <CalendarIcon size={12} className="text-[#F97316]" />
                <span>Rental Dates</span>
              </div>
              <p className="font-bold text-gray-800 text-[11px] leading-tight">
                {bookingState.pickupDate} → {bookingState.returnDate}
              </p>
              <p className="text-gray-500 text-[10px] mt-0.5">
                {bookingState.pickupTime} Pickup
              </p>
            </div>
          </div>

          {/* Contactless QR Code section */}
          <div className="pt-3 border-t border-dashed border-gray-200 flex items-center justify-between bg-white relative z-10 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
                <QrCodeIcon size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-xs">
                  Direct Garage Handoff
                </p>
                <p className="text-[10px] text-gray-400">
                  Show confirmation upon arrival at the garage
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#F97316] font-bold bg-orange-50 px-2 py-1 rounded shrink-0">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          {onNavigateMyBookings && (
            <button
              onClick={() => {
                onClose()
                onNavigateMyBookings()
              }}
              className="w-full py-3 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🎟️ View Digital Boarding Pass in My Trips</span>
            </button>
          )}

          {onNavigateAdmin && (
            <button
              onClick={() => {
                onClose()
                onNavigateAdmin()
              }}
              className="w-full py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>⚙️ Inspect in Fleet Admin Mating Queue</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Download Voucher PDF
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                onClose()
                onNavigateListing()
              }}
              className="py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Browse Fleet
            </button>
            <button
              onClick={() => {
                onClose()
                onNavigateHome()
              }}
              className="py-2.5 bg-[#17191C] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
