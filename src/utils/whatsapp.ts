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
}

/**
 * Normalizes any phone number into an international E.164-compatible digit string without '+' or spaces.
 * - Handles Indian 10-digit mobile numbers starting with 6, 7, 8, 9 (prepends 91).
 * - Handles North American 10-digit numbers starting with 2, 3, 4, 5 (prepends 1).
 * - Strips leading zeroes (e.g., 07780740223 -> 917780740223).
 * - Retains explicit country codes like +91, +1, +44, etc.
 */
export function normalizeWhatsAppPhone(rawPhone?: string | null): string {
  if (!rawPhone) return ""

  const trimmed = rawPhone.trim()
  const hasLeadingPlus = trimmed.startsWith("+")

  // Strip all non-digit characters
  let digits = trimmed.replace(/\D/g, "")
  if (!digits) return ""

  // If had leading international 00 (e.g. 0091...), strip 00
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }

  // If user typed national trunk prefix 0 (e.g. 07780740223), strip it
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1)
  }

  // If user explicitly gave a country code with '+' or already has 11+ digits:
  if (hasLeadingPlus) {
    return digits
  }

  // If exactly 10 digits:
  if (digits.length === 10) {
    const firstDigit = digits.charAt(0)
    // Indian mobile numbers start with 6, 7, 8, or 9
    if (["6", "7", "8", "9"].includes(firstDigit)) {
      return `91${digits}`
    }
    // North American numbers typically start with 2..5
    if (["2", "3", "4", "5"].includes(firstDigit)) {
      return `1${digits}`
    }
  }

  return digits
}

/**
 * Formats a normalized phone number for friendly human-readable UI display.
 */
export function formatInternationalPhoneDisplay(phone?: string | null): string {
  const norm = normalizeWhatsAppPhone(phone)
  if (!norm) return "Not configured"

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

/**
 * Detects whether the current client is a mobile device or desktop browser.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

/**
 * Builds direct WhatsApp URLs that bypass intermediate landing pages.
 */
export function getWhatsAppUrls(
  rawPhone?: string | null,
  message: string = "",
): WhatsAppUrls {
  const normalizedPhone = normalizeWhatsAppPhone(rawPhone)
  const displayPhone = formatInternationalPhoneDisplay(rawPhone)
  const encodedText = encodeURIComponent(message)

  // Direct WhatsApp Web URL (bypasses api.whatsapp.com landing screen on desktop)
  const webUrl = normalizedPhone
    ? `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?text=${encodedText}`

  // Direct Native App URL protocol (triggers WhatsApp Desktop on PC/Mac or WhatsApp App on phone)
  const appUrl = normalizedPhone
    ? `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`

  // Universal wa.me URL
  const universalUrl = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`

  return {
    phone: rawPhone || "",
    normalizedPhone,
    displayPhone,
    webUrl,
    appUrl,
    universalUrl,
  }
}

/**
 * Directly opens WhatsApp Web or Native App without landing page prompts.
 */
export function openWhatsAppDirect(
  rawPhone?: string | null,
  message: string = "",
  mode: "web" | "app" | "auto" = "auto",
): void {
  const urls = getWhatsAppUrls(rawPhone, message)

  if (mode === "app") {
    // Direct native protocol
    window.location.href = urls.appUrl
    return
  }

  if (mode === "web") {
    // Direct WhatsApp Web tab
    window.open(urls.webUrl, "_blank", "noopener,noreferrer")
    return
  }

  // Auto mode:
  // If on mobile device, native app URL opens the app directly
  if (isMobileDevice()) {
    window.location.href = urls.appUrl
  } else {
    // On desktop, directly open WhatsApp Web tab
    window.open(urls.webUrl, "_blank", "noopener,noreferrer")
  }
}
