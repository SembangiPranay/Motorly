import React, { useEffect, useRef, useState } from "react"

interface CarEntranceAnimationProps {
  onComplete: () => void
  onSkip?: () => void
}

type EntrancePhase = "dark" | "car" | "copy" | "exit"

export default function CarEntranceAnimation({
  onComplete,
  onSkip,
}: CarEntranceAnimationProps) {
  const [phase, setPhase] = useState<EntrancePhase>("dark")
  const completeRef = useRef(onComplete)
  const skipRef = useRef(onSkip)
  completeRef.current = onComplete
  skipRef.current = onSkip

  useEffect(() => {
    const car = window.setTimeout(() => setPhase("car"), 120)
    const copy = window.setTimeout(() => setPhase("copy"), 760)
    const exit = window.setTimeout(() => setPhase("exit"), 2450)
    const done = window.setTimeout(() => completeRef.current(), 2850)
    return () => {
      window.clearTimeout(car)
      window.clearTimeout(copy)
      window.clearTimeout(exit)
      window.clearTimeout(done)
    }
  }, [])

  const handleSkip = () => {
    if (skipRef.current) skipRef.current()
    else completeRef.current()
  }

  return (
    <div
      role="banner"
      aria-label="Pit Stop Car Hire welcome"
      className={`motorly-intro fixed inset-0 z-[10000] overflow-hidden bg-[#111211] text-white transition-[opacity,transform] duration-500 ease-in-out ${
        phase === "exit" ? "pointer-events-none opacity-0 scale-[1.015]" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(116,91,62,0.22),transparent_58%),linear-gradient(180deg,#171716_0%,#101110_65%,#0b0c0b_100%)]" />
      <div className="absolute left-1/2 top-[48%] h-px w-[min(78vw,1050px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 sm:px-10 sm:py-8 lg:px-16">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#e58a46] shadow-[0_0_14px_rgba(229,138,70,0.6)]" />
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/75 sm:text-xs">
            Pit Stop <span className="text-white/35">/</span> Malta
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 transition hover:border-white/50 hover:text-white sm:px-5 sm:text-[11px]"
        >
          Skip <span aria-hidden="true" className="ml-2 text-white/45">↗</span>
        </button>
      </header>

      <main className="relative z-10 flex h-[calc(100%-88px)] flex-col items-center justify-center px-5 pb-14 sm:h-[calc(100%-104px)]">
        <div className={`motorly-intro-car relative w-full max-w-[1180px] ${phase !== "dark" ? "is-visible" : ""}`}>
          <img
            src="/images/entrance/master_executive_gt.jpg"
            alt="A luxury grand touring car in a softly lit studio"
            className="block h-auto max-h-[57vh] w-full object-contain sm:max-h-[62vh]"
            fetchPriority="high"
          />
          <div className="pointer-events-none absolute inset-x-[12%] bottom-[2%] h-[9%] rounded-[50%] bg-[#ddd2c2]/10 blur-2xl" />
        </div>

        <div className={`motorly-intro-copy mt-3 text-center sm:mt-0 ${phase === "copy" || phase === "exit" ? "is-visible" : ""}`}>
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.36em] text-[#e6a36f] sm:text-[10px]">
            Your next journey starts here
          </p>
          <h1 className="font-heading text-3xl font-light tracking-[0.22em] text-white sm:text-5xl sm:tracking-[0.3em]">
            PIT STOP
          </h1>
          <p className="mt-3 text-[9px] font-light uppercase tracking-[0.22em] text-white/55 sm:text-[11px] sm:tracking-[0.3em]">
            Prestige car hire <span className="mx-2 text-[#e6a36f]">·</span> Mgarr, Malta
          </p>
        </div>
      </main>

      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-white/10">
        <div className={`motorly-intro-progress h-full bg-[#e6a36f] ${phase !== "dark" ? "is-moving" : ""}`} />
      </div>
    </div>
  )
}
