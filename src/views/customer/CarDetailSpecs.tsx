import React, { useState } from "react"
import type { Car } from "../../types"
import GarageMapViewer from "../../components/GarageMapViewer"
import {
  StarIcon,
  CheckIcon,
  LocationIcon,
  ShieldIcon,
  LuggageIcon,
  TransmissionIcon,
  FuelIcon,
  UserIcon,
  SparklesIcon,
} from "../../components/Icons"

interface CarDetailSpecsProps {
  car: Car
  reviewsEnabled?: boolean
  reviewsCount?: number
  onSelectTab?: (tab: string) => void
}

const formatFuelDisplay = (mileage?: string, fuelType?: string): string => {
  if (!mileage || !mileage.trim()) {
    return fuelType === "Electric" ? "100% EV" : "45 Liters"
  }
  const clean = mileage.trim()
  if (fuelType === "Electric") {
    if (
      clean.includes("%") ||
      clean.toLowerCase().includes("kwh") ||
      clean.toLowerCase().includes("ev")
    ) {
      return clean
    }
    return `${clean} kWh`
  }
  return clean
}

export default function CarDetailSpecs({
  car,
  reviewsEnabled = false,
  reviewsCount = 0,
}: CarDetailSpecsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "garage" | "features" | "rates" | "reviews"
  >("overview")

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] font-heading">
              {car.name}
            </h1>
            <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              {car.type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-600 font-medium">
            <span className="flex items-center text-amber-500 font-bold gap-1">
              <StarIcon size={14} filled /> {car.rating}
            </span>
            <span>•</span>
            <span>({car.reviewsCount || 48}+ verified reviews)</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              Garage Inspected &amp; Ready
            </span>
          </div>
        </div>

        {/* Health Score Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <SparklesIcon size={16} className="text-emerald-600" />
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase block leading-none">
              Vehicle Health
            </span>
            <span className="text-xs font-extrabold text-emerald-700">
              {car.healthScore || 98}% Certified Clean
            </span>
          </div>
        </div>
      </div>

      {/* Quick Specs Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <UserIcon size={18} className="text-[#F97316]" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Capacity
            </p>
            <p className="text-xs font-bold text-stone-800">
              {car.seats} Passengers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <TransmissionIcon size={18} className="text-[#F97316]" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Transmission
            </p>
            <p className="text-xs font-bold text-stone-800">
              {car.transmission}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <FuelIcon size={18} className="text-[#F97316]" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Powertrain
            </p>
            <p className="text-xs font-bold text-stone-800">
              {car.fuelType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <LuggageIcon size={18} className="text-[#F97316]" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Luggage
            </p>
            <p className="text-xs font-bold text-stone-800">
              {car.luggage || "2 Bags"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <ShieldIcon size={18} className="text-emerald-600" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Deposit
            </p>
            <p className="text-xs font-bold text-stone-900">
              €{(car.securityDeposit || 1000).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <LocationIcon size={18} className="text-orange-500" />
          <div>
            <p className="text-[10px] text-stone-400 font-semibold uppercase">
              Garage Bay
            </p>
            <p className="text-xs font-bold text-stone-900 truncate">
              {car.garageBay || "Bay 01"}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-6 sm:gap-8 text-sm font-bold overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Overview & Specs" },
            { id: "garage", label: "Garage & Map Location" },
            { id: "features", label: "Features & Tech" },
            { id: "rates", label: "Rental Rates" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 font-heading transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "text-[#F97316] border-[#F97316]"
                  : "text-stone-500 border-transparent hover:text-stone-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 pt-2 animate-fade-in">
          <p className="text-sm text-stone-600 leading-relaxed">
            {car.description ||
              "Precision-engineered vehicle curated and serviced inside the Pit Stop Car Hire garage fleet. Available for daily and long-term reservation."}
          </p>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-stone-50 border border-stone-200/80">
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block">
                Manufacturer
              </span>
              <span className="text-sm font-bold text-stone-900">
                {car.brand}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block">
                Model Year
              </span>
              <span className="text-sm font-bold text-stone-900">
                {car.year}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block">
                Plate Registration
              </span>
              <span className="text-sm font-bold font-mono text-[#F97316]">
                {car.plateNumber || "FL-492-MTR"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block">
                Garage Location
              </span>
              <span className="text-sm font-bold text-stone-900 block truncate">
                {car.garageName || car.location || "Main Garage Facility"}
              </span>
              <a
                href={
                  car.garageLat && car.garageLng
                    ? `https://www.google.com/maps/search/?api=1&query=${car.garageLat},${car.garageLng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        car.garageAddress ||
                          car.garageName ||
                          car.location ||
                          "Pit Stop Central Garage (Mgarr)",
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F97316] hover:text-[#EA580C] hover:underline mt-0.5"
                title="View exact garage coordinates on Google Maps"
              >
                <LocationIcon size={12} />
                <span>Open in Google Maps ↗</span>
              </a>
            </div>
          </div>

          {/* Insurance & Acquisition History Box */}
          <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldIcon size={14} className="text-amber-600" />
                Comprehensive Insurance &amp; Ownership Verification
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                100% COVERED
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700">
              <div>
                <span className="text-[11px] text-stone-500 block">
                  Insurance Provider:
                </span>
                <span className="font-bold">
                  {car.insuranceProvider || "State Farm Commercial"}
                </span>
                <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                  {car.insurancePolicy || "POL-STF-994021"}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">
                  Fleet Acquisition:
                </span>
                <span className="font-bold">
                  {car.purchaseDate || "Jan 10, 2024"}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Purchased new for fleet
                </p>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">
                  Certified Mileage:
                </span>
                <span className="font-bold font-mono text-stone-900">
                  {car.currentOdometer
                    ? `${car.currentOdometer.toLocaleString()} mi`
                    : car.mileage}
                </span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  Odometer Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Garage & Exact Map Engine */}
      {activeTab === "garage" && (
        <div className="pt-2 animate-fade-in space-y-4">
          <p className="text-xs text-stone-600">
            This vehicle is staged and ready for pickup at our dedicated garage
            facility. Use the map below to locate the garage bay.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">
                {car.garageName || "Main Operations Hub"}
              </span>
              <span className="text-stone-500">
                {car.garageAddress || "Garage Facility"} • Bay:{" "}
                {car.garageBay || "Assigned Stall"}
              </span>
            </div>
            <a
              href={
                car.garageLat && car.garageLng
                  ? `https://www.google.com/maps/search/?api=1&query=${car.garageLat},${car.garageLng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      car.garageAddress ||
                        car.garageName ||
                        car.location ||
                        "Pit Stop Central Garage (Mgarr)",
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-2xs"
            >
              <LocationIcon size={13} />
              <span>Open in Google Maps ↗</span>
            </a>
          </div>
          <GarageMapViewer
            garageName={car.garageName || "Main Garage Facility"}
            garageAddress={
              car.garageAddress || car.location || "Main Garage Bay"
            }
            garageBay={car.garageBay || "Bay 14-B"}
            lat={car.garageLat || 25.7959}
            lng={car.garageLng || -80.287}
            height="300px"
          />
        </div>
      )}

      {/* Tab 3: Features */}
      {activeTab === "features" && (
        <div className="pt-2 animate-fade-in space-y-4">
          <p className="text-xs text-stone-500">
            All equipment is thoroughly inspected and disinfected between each
            rental.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Array.isArray(car?.features) ? car.features : []).map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 border border-stone-100"
                >
                  <CheckIcon size={14} className="text-[#F97316]" />
                  <span>{feature}</span>
                </div>
              ),
            )}
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 border border-stone-100">
              <CheckIcon size={14} className="text-[#F97316]" />
              <span>Emergency SOS Roadside</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 border border-stone-100">
              <CheckIcon size={14} className="text-[#F97316]" />
              <span>Keyless Digital Lock</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Rental Rates */}
      {activeTab === "rates" && (
        <div className="pt-2 animate-fade-in space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
              <span className="text-xs font-bold text-stone-500 uppercase">
                Hourly Flex
              </span>
              <p className="text-2xl font-black text-[#17191C] font-heading mt-1">
                €{car.pricePerHour}
              </p>
              <span className="text-[11px] text-stone-400">
                Fuel &amp; 30 miles included
              </span>
            </div>
            <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 text-center relative">
              <span className="absolute -top-2.5 right-4 bg-[#F97316] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Popular
              </span>
              <span className="text-xs font-bold text-[#F97316] uppercase">
                Daily Standard
              </span>
              <p className="text-2xl font-black text-[#F97316] font-heading mt-1">
                €{car.pricePerDay}
              </p>
              <span className="text-[11px] text-stone-500">
                Unlimited miles across state
              </span>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-center relative">
              <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Save ~14%
              </span>
              <span className="text-xs font-bold text-blue-800 uppercase">
                Weekly (7+ Days)
              </span>
              <p className="text-2xl font-black text-blue-900 font-heading mt-1">
                €{car.pricePerWeek || Math.round(car.pricePerDay * 6)}
              </p>
              <span className="text-[11px] text-blue-700 font-medium">
                Extended road trip discount
              </span>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center relative">
              <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Best Value
              </span>
              <span className="text-xs font-bold text-emerald-800 uppercase">
                Monthly (30+ Days)
              </span>
              <p className="text-2xl font-black text-emerald-900 font-heading mt-1">
                €{car.pricePerMonth || Math.round(car.pricePerDay * 22)}
              </p>
              <span className="text-[11px] text-emerald-700 font-bold">
                Includes garage perks
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
