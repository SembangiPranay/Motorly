import React, { useEffect, useRef, useState } from "react"

interface CarEntranceAnimationProps {
  onComplete: () => void
  onSkip?: () => void
}

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  const [exiting, setExiting] = useState(false)
  const completeRef = useRef(onComplete)
  const skipRef = useRef(onSkip)
  const videoRef = useRef<HTMLVideoElement>(null)
  completeRef.current = onComplete
  skipRef.current = onSkip

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const exitAt = reducedMotion ? 100 : 2650
    const completeAt = reducedMotion ? 300 : 3200
    const exitTimer = window.setTimeout(() => setExiting(true), exitAt)
    const completeTimer = window.setTimeout(() => completeRef.current(), completeAt)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(completeTimer)
    }
  }, [])

  const handleSkip = () => {
    if (skipRef.current) skipRef.current()
    else completeRef.current()
  }

  const handleVideoReady = () => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 2.25
    void video.play().catch(() => {
      // Keep the skip control available if the browser blocks autoplay.
    })
  }

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire cinematic welcome"
      className={`motorly-intro fixed inset-0 z-[10000] overflow-hidden bg-black text-white ${exiting ? "is-exiting" : ""}`}
    >
      <video
        ref={videoRef}
        className="motorly-intro-video absolute inset-0 h-full w-full object-contain"
        src="/videos/motorly-entrance.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="A car emerges from darkness and its headlights turn on"
        onLoadedMetadata={handleVideoReady}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      <div className="motorly-intro-warm-reflection pointer-events-none absolute inset-0" />

      <p className="motorly-intro-brand pointer-events-none absolute bottom-[7vh] left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.42em] text-white/55 sm:text-[10px]">
        PIT STOP <span className="mx-2 text-white/25">/</span> MALTA
      </p>

      <button
        type="button"
        onClick={handleSkip}
        className="absolute right-5 top-5 z-10 rounded-full border border-white/25 bg-black/25 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm transition hover:border-white/55 hover:text-white sm:right-8 sm:top-8"
      >
        Skip <span aria-hidden="true" className="ml-2 text-white/50">↗</span>
      </button>
    </div>
  )
}
