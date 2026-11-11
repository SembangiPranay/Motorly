import React from "react"

export interface PitStopLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  subtitle?: string
  caption?: string
  layout?: "horizontal" | "grounded" | "stacked" | "unified-card"
  singleLine?: boolean
  className?: string
  theme?: "light" | "dark" | "orange"
  variant?: "badge" | "minimal"
}

// Master Mathematical F1 Single-Seater Racing Silhouette Path
// 1:1 Vector Extraction from Pit Stop Car Hire Mgarr Agreement Paper
export const PIT_STOP_F1_PATH =
  "M 8.550 16.919 C 8.217 17.458, 8.899 18.411, 10.066 19.035 L 12.188 20.171 10 22.500 C 7.843 24.796, 7.840 24.844, 9.786 25.885 C 10.871 26.466, 12.580 28.867, 13.584 31.221 C 15.355 35.377, 15.418 35.419, 15.777 32.679 C 15.980 31.128, 15.690 28.551, 15.133 26.952 C 14.452 24.998, 14.450 23.840, 15.128 23.421 C 15.683 23.078, 15.879 22.128, 15.565 21.309 C 15.074 20.028, 16.217 19.919, 23.747 20.529 C 28.561 20.919, 33.057 21.685, 33.738 22.232 C 34.609 22.930, 35.165 22.733, 35.612 21.569 C 36.361 19.617, 35.544 18.581, 33.197 18.506 C 30.405 18.417, 15.740 16.958, 12.328 16.430 C 10.583 16.160, 8.883 16.380, 8.550 16.919 M 73.071 17.607 C 67.561 18.811, 51.463 26.360, 48.550 29.105 C 46.997 30.568, 51.242 30.120, 54 28.529 C 64.281 22.600, 74.160 19.321, 78.480 20.405 C 80.855 21.002, 82.081 23, 80.071 23 C 78.645 23, 76 25.970, 76 27.571 C 76 28.357, 76.891 29, 77.980 29 C 80.745 29, 88 32.017, 88 33.168 C 88 33.690, 87.628 33.888, 87.173 33.607 C 86.034 32.903, 68.599 35.598, 60.398 37.746 C 56.694 38.717, 53.454 40.139, 53.198 40.907 C 52.847 41.960, 53.318 42.129, 55.116 41.592 C 68.815 37.503, 85.350 36.325, 106.500 37.933 C 114.200 38.518, 121.963 39.214, 123.750 39.479 C 128.710 40.215, 127.620 38.393, 122.297 37.053 C 115.970 35.460, 118.300 34.036, 127.266 34.015 L 134.032 34 130.981 36.750 C 128.972 38.561, 127.718 40.833, 127.309 43.405 C 126.860 46.230, 127.008 47.113, 127.844 46.596 C 128.480 46.203, 129.010 45.121, 129.022 44.191 C 129.050 42.055, 131.838 38.573, 134.684 37.117 C 137.919 35.463, 146.851 35.708, 148.643 37.500 C 149.976 38.833, 149.975 39, 148.630 39 C 147.799 39, 146.840 38.550, 146.500 38 C 146.160 37.450, 143.813 37, 141.285 37 C 134.996 37, 129.966 40.726, 130.079 45.301 C 130.122 47.060, 130.404 47.825, 130.704 47 C 131.004 46.175, 132.403 44.262, 133.812 42.750 C 135.733 40.688, 137.319 40, 140.148 40 C 147.092 40, 150.316 46.785, 145.988 52.288 C 143.026 56.053, 138.886 56.607, 133.434 53.968 C 130.938 52.760, 128.618 52.048, 128.280 52.387 C 126.988 53.678, 130.392 57.873, 134.081 59.537 C 141.124 62.712, 149.565 60.176, 154.173 53.500 C 157.296 48.975, 157.781 44.020, 155.523 39.692 C 154.110 36.982, 154.136 36.905, 156.279 37.505 C 162.760 39.317, 174 45.164, 174 46.723 C 174 47.490, 173.555 47.843, 173.011 47.507 C 172.464 47.169, 172.266 47.530, 172.568 48.317 C 172.913 49.215, 172.265 49.964, 170.807 50.355 C 167.319 51.289, 161 51.121, 161 50.094 C 161 48.075, 156.933 50.428, 155.517 53.266 C 154.683 54.939, 153.999 56.576, 153.998 56.904 C 153.997 57.232, 158.884 57.361, 164.858 57.190 L 175.719 56.880 176.860 53.074 C 178.379 48.002, 178.302 43.495, 176.671 42.142 C 174.908 40.678, 163.437 36.357, 153.500 33.412 C 147.301 31.576, 143.137 31.043, 135 31.045 C 123.819 31.048, 117.175 32.099, 115.966 34.056 C 115.557 34.716, 114.783 34.984, 114.245 34.652 C 113.707 34.319, 109.719 33.787, 105.383 33.469 C 101.048 33.151, 97.073 32.466, 96.550 31.946 C 96.027 31.426, 94.817 31, 93.859 31 C 92.901 31, 91.880 30.615, 91.589 30.144 C 91.298 29.674, 92.172 29.501, 93.530 29.761 C 96.453 30.320, 96.867 28.379, 94.250 26.392 C 92.170 24.813, 88.370 24.592, 87.500 26 C 87.160 26.550, 85.671 26.993, 84.191 26.985 C 82.711 26.976, 81.950 26.639, 82.500 26.235 C 84.070 25.081, 87.097 17.966, 86.458 16.931 C 85.678 15.670, 80.806 15.915, 73.071 17.607 M 26.075 26.260 C 22.067 27.711, 20.212 30.801, 24.116 29.523 C 29.628 27.719, 35.443 27.880, 38.724 29.927 C 41.911 31.916, 45 37.446, 45 41.162 C 45 43.909, 41.371 50.644, 39.504 51.360 C 38.469 51.757, 38.843 50.761, 40.590 48.470 C 42.870 45.482, 43.180 44.291, 42.727 40.269 C 42.319 36.647, 41.481 34.925, 39.083 32.782 C 36.584 30.550, 35.010 30, 31.119 30 C 27.722 30, 25.478 30.623, 23.625 32.080 C 22.171 33.224, 21.250 34.596, 21.579 35.129 C 21.956 35.738, 22.666 35.692, 23.492 35.007 C 27.880 31.365, 35.560 32.153, 38.434 36.540 C 42.942 43.420, 36.565 53.268, 28.900 51.263 C 27.165 50.810, 26.796 51.026, 27.257 52.226 C 27.707 53.399, 27.352 53.643, 25.791 53.235 C 24.342 52.856, 23.868 53.103, 24.190 54.069 C 24.868 56.104, 31.610 57.182, 36.099 55.973 C 40.961 54.664, 46.596 48.965, 47.432 44.512 C 48.678 37.872, 45.285 30.437, 39.759 27.697 C 34.843 25.259, 30.191 24.771, 26.075 26.260 M 106.500 29 C 105.598 30.459, 106.842 31.998, 108.431 31.388 C 109.183 31.100, 110.099 31.352, 110.468 31.948 C 111.421 33.491, 113 32.239, 113 29.941 C 113 28.460, 112.304 28, 110.059 28 C 108.441 28, 106.840 28.450, 106.500 29 M 135.813 29.683 C 136.534 29.972, 137.397 29.936, 137.729 29.604 C 138.061 29.272, 137.471 29.036, 136.417 29.079 C 135.252 29.127, 135.015 29.364, 135.813 29.683 M 103 46.684 C 84.722 51.399, 75.353 51.501, 60.750 47.142 C 57.038 46.033, 54 45.472, 54 45.894 C 54 46.838, 56.821 48.244, 64 50.878 L 69.500 52.896 61.667 52.948 C 55.858 52.987, 53.943 53.323, 54.258 54.250 C 54.536 55.068, 56.900 55.519, 61.091 55.556 C 77.036 55.694, 126.576 57.284, 127.250 57.679 C 128.307 58.298, 128.190 55.235, 127.131 54.581 C 126.654 54.286, 125.977 52.260, 125.629 50.080 C 125.280 47.899, 124.502 45.810, 123.900 45.438 C 121.275 43.816, 111.967 44.371, 103 46.684 M 108.500 49.450 C 92.404 52.298, 89.784 52.988, 97.500 52.347 C 100.800 52.073, 107.212 51.758, 111.750 51.647 C 119.017 51.469, 120.185 51.181, 121.557 49.223 C 122.413 48, 122.750 47.034, 122.307 47.075 C 121.863 47.117, 115.650 48.185, 108.500 49.450 M 34.813 53.683 C 35.534 53.972, 36.397 53.936, 36.729 53.604 C 37.061 53.272, 36.471 53.036, 35.417 53.079 C 34.252 53.127, 34.015 53.364, 34.813 53.683 M 70.750 53.662 C 71.438 53.940, 72.563 53.940, 73.250 53.662 C 73.938 53.385, 73.375 53.158, 72 53.158 C 70.625 53.158, 70.063 53.385, 70.750 53.662"

export default function PitStopLogo({
  size = "md",
  showText = true,
  subtitle = "Car Hire • Malta",
  caption,
  layout = "horizontal",
  singleLine = false,
  className = "",
  theme = "orange",
  variant = "badge",
}: PitStopLogoProps) {
  // Dimension tokens tailored to authentic 3.63:1 aspect ratio
  const dimensions =
    size === "sm"
      ? { width: 42, height: 12, boxClass: "px-2 py-1", titleClass: "text-xs", subClass: "text-[8px]", capClass: "text-[7.5px]" }
      : size === "lg"
      ? { width: 78, height: 22, boxClass: "px-3 py-2", titleClass: "text-lg", subClass: "text-[10px]", capClass: "text-[9px]" }
      : size === "xl"
      ? { width: 110, height: 31, boxClass: "px-4 py-2.5", titleClass: "text-2xl", subClass: "text-xs", capClass: "text-[10px]" }
      : { width: 56, height: 16, boxClass: "px-2.5 py-1.5", titleClass: "text-sm sm:text-base", subClass: "text-[9px]", capClass: "text-[8.5px]" }

  const carColorClass =
    theme === "dark"
      ? "text-stone-900"
      : theme === "light"
      ? "text-white"
      : "text-[#F97316]"

  const titleColorClass =
    theme === "light"
      ? "text-white"
      : "text-[#17191C]"

  const dividerColorClass =
    theme === "light"
      ? "border-white/20"
      : "border-stone-200/80"

  const captionColorClass =
    theme === "light"
      ? "text-stone-300"
      : "text-stone-600"

  // 1:1 F1 Vector Element
  const carSvg = (
    <svg
      viewBox="5.8 13.7 174.5 51.0"
      fill="currentColor"
      fillRule="evenodd"
      className={`${carColorClass} transition-transform duration-300 group-hover:scale-105 shrink-0`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <path d={PIT_STOP_F1_PATH} />
    </svg>
  )

  const carBadge =
    variant === "badge" ? (
      <div
        className={`${dimensions.boxClass} bg-[#141619] rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-stone-800/90 group-hover:border-orange-500/50 transition-colors`}
        title="Pit Stop Car Hire (Mgarr, Malta)"
      >
        {carSvg}
      </div>
    ) : (
      carSvg
    )

  // Layout 1: Stacked Centered Racing Crest (Car on top, wording directly below it)
  if (layout === "stacked") {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {carBadge}
        {showText && (
          <div className="flex flex-col items-center mt-2 leading-tight">
            <span className={`${dimensions.titleClass} font-black tracking-tight ${titleColorClass} font-heading`}>
              PIT STOP
            </span>
            {subtitle && (
              <span className={`${dimensions.subClass} font-extrabold tracking-[0.25em] uppercase text-orange-600 mt-0.5`}>
                {subtitle}
              </span>
            )}
            {caption && (
              <div className={`w-full flex items-center justify-center gap-2 mt-2 pt-1 border-t ${dividerColorClass}`}>
                <span className={`${dimensions.capClass} font-bold tracking-[0.2em] uppercase ${captionColorClass}`}>
                  {caption}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Layout 2: Unified Motorsport Chassis Card
  if (layout === "unified-card") {
    return (
      <div className={`bg-[#141619] rounded-xl p-3 border border-stone-800 shadow-sm flex flex-col items-center select-none ${className}`}>
        <div className="flex items-center gap-3">
          {carSvg}
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-tight">PIT STOP</span>
            <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-orange-500">
              {subtitle || "Car Hire"}
            </span>
          </div>
        </div>
        {caption && (
          <div className="w-full mt-2 pt-1.5 border-t border-stone-800/80 flex items-center justify-center text-[8.5px] font-bold tracking-[0.18em] uppercase text-stone-400">
            {caption}
          </div>
        )}
      </div>
    )
  }

  // Layout 3: Grounded (or Horizontal with balancing baseline caption directly below it)
  const isGrounded = layout === "grounded" || Boolean(caption)

  return (
    <div className={`flex flex-col select-none ${className}`}>
      {/* Top Branding Lockup */}
      <div className="flex items-center gap-2.5">
        {carBadge}

        {showText && (
          singleLine ? (
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className={`${dimensions.titleClass} font-black tracking-tight ${titleColorClass} font-heading`}>
                PIT STOP
              </span>
              {subtitle && (
                <span className={`${dimensions.subClass} font-extrabold tracking-[0.16em] uppercase text-orange-600`}>
                  {subtitle}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center leading-tight">
              <span className={`${dimensions.titleClass} font-black tracking-tight ${titleColorClass} font-heading`}>
                PIT STOP
              </span>
              {subtitle && (
                <span className={`${dimensions.subClass} font-extrabold tracking-[0.22em] uppercase text-orange-600 mt-0.5`}>
                  {subtitle}
                </span>
              )}
            </div>
          )
        )}
      </div>

      {/* Balancing Caption directly down below the logo! */}
      {isGrounded && caption && (
        <div className={`mt-2 pt-1.5 border-t ${dividerColorClass} flex items-center justify-between text-[8.5px] sm:text-[9px] font-bold tracking-[0.18em] uppercase ${captionColorClass}`}>
          <span>{caption}</span>
        </div>
      )}
    </div>
  )
}
