/**
 * WhatsApp Direct Deep-Link & Phone Normalization Utilities
 *
 * Ensures direct redirection to WhatsApp Web (web.whatsapp.com) or WhatsApp Desktop/Native App
 * without getting stuck on intermediate api.whatsapp.com landing screens.
 * Automatically normalizes phone numbers (e.g. 10-digit Indian numbers 7780740223 -> +91 7780740223).
 */

export interface WhatsAppUrls {
  phone: string
  normalizedPhone: string
  displayPhone: string
  webUrl: string
  appUrl: string
  universalUrl: string
  smartUrl: string
  isMobile: boolean
}

function normalizeSingleWhatsAppSegment(segment?: string | null): string {
  if (!segment) return ""
  const trimmed = segment.trim()
  if (!trimmed) return ""

  const hasLeadingPlus = trimmed.startsWith("+")
  let digits = trimmed.replace(/\D/g, "")
  if (!digits) return ""

  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }

  if (!hasLeadingPlus && digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1)
  }

  // Maltese 8-digit landline/mobile numbers (e.g. 99827192, 99804255, 79123456)
  if (!hasLeadingPlus && digits.length === 8 && ["2", "7", "9"].includes(digits.charAt(0))) {
    return `356${digits}`
  }

  if (!hasLeadingPlus && digits.length === 10) {
    const firstDigit = digits.charAt(0)
    if (["6", "7", "8", "9"].includes(firstDigit)) {
      return `91${digits}`
    }
    if (["2", "3", "4", "5"].includes(firstDigit)) {
      return `1${digits}`
    }
  }

  // Guard against concatenated invalid numbers exceeding E.164 max 15 digits
  if (digits.length < 7 || digits.length > 15) {
    return ""
  }

  return digits
}

/**
 * Splits admin/customer input strings (e.g. "+356 99827192 / +356 99804255" or comma-separated)
 * into clean individual E.164 digit strings so two phone numbers are never concatenated together.
 */
export function extractPhoneNumbers(rawPhone?: string | null): string[] {
  if (!rawPhone) return []
  const raw = String(rawPhone).trim()
  if (!raw) return []

  const segments = raw
    .split(/[,;/|\r\n&]+|\s+or\s+|\s+(?=\+)|\s{2,}/i)
    .flatMap((part) => {
      // Also split space-separated adjacent full phone numbers like "35699827192 35699804255"
      const compact = part.trim()
      if (!compact) return []
      if (/^\d{8,13}\s+\d{8,13}$/.test(compact)) {
        return compact.split(/\s+/)
      }
      return [compact]
    })

  const unique: string[] = []
  for (const seg of segments) {
    const norm = normalizeSingleWhatsAppSegment(seg)
    if (norm && !unique.includes(norm)) {
      unique.push(norm)
    }
  }
  return unique
}

/**
 * Normalizes a phone input into the primary single E.164-compatible digit string (without '+').
 * When multiple numbers are present in one string, returns the first valid number cleanly.
 */
export function normalizeWhatsAppPhone(rawPhone?: string | null): string {
  return extractPhoneNumbers(rawPhone)[0] || ""
}

/**
 * Formats a clean tel: href for direct phone dialing using only the primary valid number.
 */
export function formatTelHref(rawPhone?: string | null): string {
  const norm = normalizeWhatsAppPhone(rawPhone)
  return norm ? `tel:+${norm}` : "tel:"
}

/**
 * Formats a normalized phone number for friendly human-readable UI display.
 */
export function formatInternationalPhoneDisplay(phone?: string | null): string {
  const norm = normalizeWhatsAppPhone(phone)
  if (!norm) return "Not configured"

  // Malta: 356 + 8 digits -> +356 9982 7192
  if (norm.startsWith("356") && norm.length === 11) {
    return `+356 ${norm.slice(3, 7)} ${norm.slice(7)}`
  }

  // India: 91 + 10 digits -> +91 77807 40223
  if (norm.startsWith("91") && norm.length === 12) {
    return `+91 ${norm.slice(2, 7)} ${norm.slice(7)}`
  }

  // US/Canada: 1 + 10 digits -> +1 (555) 789-0123
  if (norm.startsWith("1") && norm.length === 11) {
    return `+1 (${norm.slice(1, 4)}) ${norm.slice(4, 7)}-${norm.slice(7)}`
  }

  // UK: 44 + 10 digits -> +44 7911 123456
  if (norm.startsWith("44") && norm.length === 12) {
    return `+44 ${norm.slice(2, 6)} ${norm.slice(6)}`
  }

  return `+${norm}`
}

export function formatPhoneListDisplay(rawPhone?: string | null): string[] {
  return extractPhoneNumbers(rawPhone).map((digits) =>
    formatInternationalPhoneDisplay(`+${digits}`),
  )
}

/**
 * Multi-tiered detection: accurately detects whether the current client is
 * a mobile handheld device (iOS/Android) or a Laptop/Desktop browser.
 *
 * Checks:
 * 1. User Agent regex (iPhone, Android, Mobile, etc.)
 * 2. Modern iPadOS detection (iPads reporting as MacIntel with touch points)
 * 3. Primary pointer coarse check (touchscreen phones vs mouse/trackpad laptop)
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false
  }

  const ua =
    navigator.userAgent || navigator.vendor || (window as any).opera || ""

  // 1. Mobile User-Agent matching
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|Windows Phone/i.test(
      ua,
    )
  if (isMobileUA) return true

  // 2. Modern iPadOS heuristic (reports as MacIntel platform with multi-touch points)
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true
  }

  // 3. Pointer media query check: coarse touchscreen device with mobile viewport
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(hover: hover)").matches &&
    window.innerWidth <= 840
  ) {
    return true
  }

  return false
}

/**
 * Builds direct WhatsApp URLs that bypass intermediate landing pages and
 * prevents forcing the WhatsApp Desktop App on laptops.
 */
export function getWhatsAppUrls(
  rawPhone?: string | null,
  message: string = "",
): WhatsAppUrls {
  const normalizedPhone = normalizeWhatsAppPhone(rawPhone)
  const displayPhone = formatInternationalPhoneDisplay(rawPhone)
  const encodedText = encodeURIComponent(message)
  const isMobile = isMobileDevice()

  // 1. Direct WhatsApp Web URL
  // On Laptop/Desktop: opens WhatsApp directly in the browser tab (zero desktop app prompts!)
  const webUrl = normalizedPhone
    ? `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?text=${encodedText}`

  // 2. Direct Native App URL protocol
  // Opens WhatsApp App on Mobile (or WhatsApp Desktop on PC/Mac if user explicitly wants app)
  const appUrl = normalizedPhone
    ? `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`

  // 3. Universal api.whatsapp.com / wa.me URL
  // Best suited for Mobile OS deep-linking
  const universalUrl = normalizedPhone
    ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`

  // 4. Smart URL: Automatically routes to WhatsApp Web on Laptop/Desktop, and to WhatsApp App on Mobile
  const smartUrl = isMobile ? universalUrl : webUrl

  return {
    phone: rawPhone || "",
    normalizedPhone,
    displayPhone,
    webUrl,
    appUrl,
    universalUrl,
    smartUrl,
    isMobile,
  }
}

/**
 * Returns the optimal smart URL for the user's active device:
 * - On Laptop / Desktop (Web): returns web.whatsapp.com (in-browser, no desktop app required)
 * - On Mobile (iOS / Android): returns api.whatsapp.com (opens native phone app)
 */
export function getSmartWhatsAppUrl(
  rawPhone?: string | null,
  message: string = "",
): string {
  return getWhatsAppUrls(rawPhone, message).smartUrl
}

/**
 * Directly opens WhatsApp Web or Native App without landing page prompts.
 */
export function openWhatsAppDirect(
  rawPhone?: string | null,
  message: string = "",
  mode: "auto" | "web" | "app" = "auto",
): Window | null {
  const urls = getWhatsAppUrls(rawPhone, message)

  if (mode === "app") {
    window.location.href = urls.appUrl
    return null
  }

  if (mode === "web") {
    return window.open(urls.webUrl, "_blank", "noopener,noreferrer")
  }

  // Auto mode:
  if (urls.isMobile) {
    // Mobile device: open native app or universal redirect
    return window.open(urls.universalUrl, "_blank", "noopener,noreferrer")
  } else {
    // Laptop / Desktop: directly open WhatsApp Web tab (bypasses WhatsApp Desktop app prompt)
    return window.open(urls.webUrl, "_blank", "noopener,noreferrer")
  }
}
