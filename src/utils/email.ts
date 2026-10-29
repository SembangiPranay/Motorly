/**
 * Direct Email Dispatch & Gmail Deep-Link Utilities
 *
 * Provides direct deep-linking into Gmail web compose and native mailto: protocols,
 * ensuring customer booking requests are pre-filled and sent to the Admin's email
 * (e.g. nanikoushik96@gmail.com) without intermediate redirect errors.
 */

export interface EmailUrls {
  recipient: string
  subject: string
  body: string
  gmailUrl: string
  mailtoUrl: string
}

/**
 * Generates direct email dispatch URLs:
 * 1. gmailUrl: Direct Gmail Web / App compose window with To, Subject, and Body pre-filled.
 * 2. mailtoUrl: Standard RFC 6068 mailto URI for native mobile/desktop email clients (Apple Mail, Outlook, Android Gmail).
 */
export function getEmailUrls(
  recipientEmail?: string | null,
  subject: string = "",
  body: string = "",
): EmailUrls {
  const recipient = (recipientEmail || "nanikoushik96@gmail.com").trim()
  const encodedTo = encodeURIComponent(recipient)
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)

  // Direct Gmail Web/App compose URL
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`

  // Standard mailto: protocol
  const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`

  return {
    recipient,
    subject,
    body,
    gmailUrl,
    mailtoUrl,
  }
}

/**
 * Directly triggers opening an email client.
 */
export function openEmailDirect(
  recipientEmail?: string | null,
  subject: string = "",
  body: string = "",
  mode: "gmail" | "mailto" | "auto" = "auto",
): void {
  const urls = getEmailUrls(recipientEmail, subject, body)

  if (mode === "gmail") {
    window.open(urls.gmailUrl, "_blank", "noopener,noreferrer")
    return
  }

  if (mode === "mailto") {
    window.location.href = urls.mailtoUrl
    return
  }

  // Auto mode: on mobile, try mailto to trigger Gmail/Mail app directly; on desktop open Gmail compose
  if (
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  ) {
    window.location.href = urls.mailtoUrl
  } else {
    window.open(urls.gmailUrl, "_blank", "noopener,noreferrer")
  }
}
