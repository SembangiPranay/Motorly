import React from "react"
import type { Car } from "../../types"
import { ArrowLeftIcon, ArrowRightIcon } from "../../components/Icons"

interface CarDetailGalleryProps {
  car: Car
  galleryImages: string[]
  selectedPhotoIndex: number
  setSelectedPhotoIndex: React.Dispatch<React.SetStateAction<number>>
  onPrevPhoto: () => void
  onNextPhoto: () => void
}

export default function CarDetailGallery({
  car,
  galleryImages,
  selectedPhotoIndex,
  setSelectedPhotoIndex,
  onPrevPhoto,
  onNextPhoto,
}: CarDetailGalleryProps) {
  const isAvailable =
    car.status !== "Maintenance" &&
    car.status !== "Rented" &&
    car.statusForDates !== "Reserved" &&
    car.isAvailableForDates !== false

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Big Active Image */}
      <div className="relative h-64 sm:h-96 rounded-xl overflow-hidden bg-stone-50 flex items-center justify-center group border border-stone-100">
        <img
          src={galleryImages[selectedPhotoIndex] || car.image}
          alt={`${car.name} view ${selectedPhotoIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = car.image
          }}
        />

        {/* Prev / Next Arrows */}
        <button
          type="button"
          onClick={onPrevPhoto}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-800 shadow-md hover:bg-white hover:text-[#F97316] transition-colors cursor-pointer"
          aria-label="Previous photo"
        >
          <ArrowLeftIcon size={18} />
        </button>
        <button
          type="button"
          onClick={onNextPhoto}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-800 shadow-md hover:bg-white hover:text-[#F97316] transition-colors cursor-pointer"
          aria-label="Next photo"
        >
          <ArrowRightIcon size={18} />
        </button>

        {/* Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
          {selectedPhotoIndex + 1} / {galleryImages.length}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg shadow-xs text-xs font-bold flex items-center gap-1.5 border border-stone-200/70">
          <span
            className={`w-2 h-2 rounded-full ${
              isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="text-stone-800">
            {isAvailable ? "Ready in Garage Bay" : car.status || "Reserved"}
          </span>
        </div>
      </div>

      {/* Thumbnail Row */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPhotoIndex(idx)}
              className={`relative h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selectedPhotoIndex === idx
                  ? "border-[#F97316] ring-2 ring-orange-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = car.image
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
