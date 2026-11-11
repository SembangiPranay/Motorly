import React from "react"

interface PitStopLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  subtitle?: string
  className?: string
}

export default function PitStopLogo({
  size = "md",
  showText = true,
  subtitle = "Car Hire • Malta",
  className = "",
}: PitStopLogoProps) {
  const iconSizeClass =
    size === "sm"
      ? "w-7 h-6"
      : size === "lg"
        ? "w-10 h-9"
        : "w-8 h-7"

  const titleSizeClass =
    size === "sm"
      ? "text-sm"
      : size === "lg"
        ? "text-xl"
        : "text-base sm:text-lg"

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Race Car Silhouette Icon (Direct reproduction of the official Pit Stop paper logo) */}
      <div
        className={`${iconSizeClass} bg-[#17191C] rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs border border-stone-800`}
        title="Pit Stop Car Hire (Mgarr, Malta)"
      >
        <svg viewBox="0 0 36 20" fill="none" className="w-full h-full">
          {/* Aerodynamic Formula / Race Car Profile */}
          <path
            d="M3 15L5 15C6 11 11 11 12 15L24 15C25 11 30 11 31 15L34 15C35 15 35.5 13.5 35 12L32 11L28 9L23 5L15 5L10 11L5 12C3 12 2 13.5 3 15Z"
            fill="#F97316"
          />
          {/* Driver Cockpit */}
          <circle cx="18" cy="7" r="2.2" fill="#FFFFFF" />
          {/* Rear Spoiler */}
          <path d="M4 8L8 8L6 11L3 11Z" fill="#FFFFFF" />
          {/* Front Nose Wing */}
          <path d="M33 13L36 13L35 15L32 15Z" fill="#FFFFFF" />
          {/* Front Racing Wheel */}
          <circle cx="27.5" cy="15" r="3.2" fill="#27272A" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="27.5" cy="15" r="1.2" fill="#F97316" />
          {/* Rear Racing Wheel */}
          <circle cx="8.5" cy="15" r="3.2" fill="#27272A" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="8.5" cy="15" r="1.2" fill="#F97316" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`${titleSizeClass} font-black tracking-tight text-[#17191C] font-heading leading-none`}
          >
            PIT STOP
          </span>
          {subtitle && (
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-orange-600 leading-none mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
