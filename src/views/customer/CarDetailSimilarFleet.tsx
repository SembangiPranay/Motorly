import React from "react"
import type { Car } from "../../types"

interface CarDetailSimilarFleetProps {
  similarCars: Car[]
  onSelectSimilarCar: (carId: string) => void
}

export default function CarDetailSimilarFleet({
  similarCars,
  onSelectSimilarCar,
}: CarDetailSimilarFleetProps) {
  if (similarCars.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#17191C] font-heading">
        Similar Vehicles You May Like
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {similarCars.map((sCar) => (
          <div
            key={sCar.id}
            onClick={() => onSelectSimilarCar(sCar.id)}
            className="bg-white rounded-xl border border-stone-200/90 hover:border-orange-300 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="h-32 rounded-lg overflow-hidden bg-stone-50 mb-3 border border-stone-100 flex items-center justify-center">
              <img
                src={sCar.image}
                alt={sCar.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {sCar.brand}
            </span>
            <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#F97316] transition-colors truncate">
              {sCar.name}
            </h4>
            <p className="text-xs font-bold text-[#F97316] mt-1">
              €{sCar.pricePerDay} <span className="text-stone-400 font-normal">/day</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
