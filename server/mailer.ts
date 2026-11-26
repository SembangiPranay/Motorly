import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

export interface EmailSendOptions {
  to: string | string[]
  cc?: string | string[]
  replyTo?: string
  subject: string
  text: string
  html: string
  allowTestDomains?: boolean
}

export interface EmailSendResult {
  sent: boolean
  skipped?: boolean
  reason?: string
  messageId?: string
  recipients: string[]
  error?: string
}

const SYNTHETIC_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "email.com",
  "pitstopcarhire.io",
  "pitstop-test.io",
  "pitstop.test",
  "stress-test.org",
  "adversarial.com",
  "attacker.org",
  "vipclient.com",
  "techventure.io",
  "atelier.fr",
  "cyberdyne.org",
  "executive.com",
  "amazon.com",
  "gamil.com",
  "pitstopcarhire.com",
])

const SYNTHETIC_EXACT_EMAILS = new Set([
  "test@gmail.com",
  "customer@example.com",
  "admin@pitstopcarhire.com",
  "concierge@pitstopcarhire.com",
])

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseEmailList(input?: string | string[] | null): string[] {
  if (!input) return []
  const rawList = Array.isArray(input) ? input : String(input).split(/[,\n;]+/)
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of rawList) {
    const clean = String(item || "").trim()
    const lower = clean.toLowerCase()
    if (clean && EMAIL_REGEX.test(clean) && !seen.has(lower)) {
      seen.add(lower)
      result.push(clean)
    }
  }
  return result
}

export function isSyntheticEmail(email: string): boolean {
  const lower = String(email || "").trim().toLowerCase()
  if (!lower || !EMAIL_REGEX.test(lower)) return true
  if (SYNTHETIC_EXACT_EMAILS.has(lower)) return true
  const domain = lower.split("@")[1] || ""
  return SYNTHETIC_DOMAINS.has(domain)
}

export function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim()
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465
  const user = (process.env.SMTP_USER || "").trim()
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim()
  const fromName = (process.env.SMTP_FROM_NAME || "Pit Stop Car Hire").trim()
  const defaultAdminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    user ||
    "pitstopcarhire@gmail.com"
  ).trim()

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    defaultAdminEmail,
    configured: Boolean(host && user && pass),
  }
}

let cachedTransporter: Transporter | null = null
let cachedTransporterKey = ""

function getTransporter(): Transporter | null {
  const cfg = getSmtpConfig()
  if (!cfg.configured) return null

  const key = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}:${cfg.pass}`
  if (cachedTransporter && cachedTransporterKey === key) {
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 12000,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  })
  cachedTransporterKey = key
  return cachedTransporter
}

export async function verifySmtpConnection(): Promise<{
  configured: boolean
  verified: boolean
  user: string
  host: string
  port: number
  error?: string
}> {
  const cfg = getSmtpConfig()
  const transporter = getTransporter()
  if (!transporter) {
    return {
      configured: false,
      verified: false,
      user: cfg.user,
      host: cfg.host,
      port: cfg.port,
      error: "SMTP_USER or SMTP_PASS is not configured.",
    }
  }
  try {
    await transporter.verify()
    return {
      configured: true,
      verified: true,
      user: cfg.user,
      host: cfg.host,
      port: cfg.port,
    }
  } catch (err: any) {
    return {
      configured: true,
      verified: false,
      user: cfg.user,
      host: cfg.host,
      port: cfg.port,
      error: err?.message || "SMTP verification failed.",
    }
  }
}

export async function sendEmail(
  options: EmailSendOptions,
): Promise<EmailSendResult> {
  const cfg = getSmtpConfig()
  const allRecipients = parseEmailList(options.to)
  const recipients = options.allowTestDomains
    ? allRecipients
    : allRecipients.filter((addr) => !isSyntheticEmail(addr))

  if (recipients.length === 0) {
    return {
      sent: false,
      skipped: true,
      reason:
        allRecipients.length > 0
          ? "Skipped synthetic/test recipient address."
          : "No valid recipient email address provided.",
      recipients: [],
    }
  }

  const transporter = getTransporter()
  if (!transporter) {
    return {
      sent: false,
      skipped: true,
      reason: "SMTP credentials not configured.",
      recipients,
    }
  }

  const ccList = parseEmailList(options.cc).filter(
    (addr) => options.allowTestDomains || !isSyntheticEmail(addr),
  )

  const mailPayload = {
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: recipients.join(", "),
    ...(ccList.length > 0 ? { cc: ccList.join(", ") } : {}),
    ...(options.replyTo && EMAIL_REGEX.test(options.replyTo.trim())
      ? { replyTo: options.replyTo.trim() }
      : {}),
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const activeTransporter = getTransporter()
      if (!activeTransporter) break
      const info = await activeTransporter.sendMail(mailPayload)

      console.log(
        `[Email Sent] "${options.subject}" -> ${recipients.join(", ")} (${info.messageId})`,
      )
      return {
        sent: true,
        messageId: info.messageId,
        recipients,
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "")
      const transient = /ECONNRESET|ETIMEDOUT|EPIPE|ESOCKET|ECONNECTION|Connection unexpectedly closed/i.test(
        msg,
      )
      if (attempt === 1 && transient) {
        cachedTransporter = null
        cachedTransporterKey = ""
        await new Promise((r) => setTimeout(r, 350))
        continue
      }
      console.error(
        `[Email Error] "${options.subject}" -> ${recipients.join(", ")}:`,
        msg,
      )
      return {
        sent: false,
        recipients,
        error: msg || "Failed to send email.",
      }
    }
  }

  return {
    sent: false,
    recipients,
    error: "Failed to send email.",
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function renderEmailShell(params: {
  badge: string
  badgeColor?: string
  title: string
  subtitle?: string
  rows?: Array<{ label: string; value: string }>
  note?: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}): string {
  const badgeColor = params.badgeColor || "#F97316"
  const rowsHtml = (params.rows || [])
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #ece7df;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;width:38%;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #ece7df;font-size:14px;font-weight:600;color:#17191C;">${escapeHtml(r.value)}</td>
        </tr>`,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17191C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF7F2;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e1d7;box-shadow:0 6px 24px rgba(23,25,28,0.06);">
          <tr>
            <td style="background:#17191C;padding:22px 28px;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#F97316;">PIT STOP CAR HIRE &bull; MALTA &amp; GOZO</div>
              <div style="margin-top:8px;display:inline-block;padding:4px 10px;border-radius:999px;background:${badgeColor};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(params.badge)}</div>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">${escapeHtml(params.title)}</h1>
              ${
                params.subtitle
                  ? `<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:#d6d3cd;">${escapeHtml(params.subtitle)}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              ${
                rowsHtml
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece7df;border-radius:12px;overflow:hidden;border-collapse:collapse;">${rowsHtml}</table>`
                  : ""
              }
              ${
                params.note
                  ? `<div style="margin-top:18px;padding:14px 16px;border-radius:10px;background:#FAF7F2;border-left:4px solid ${badgeColor};font-size:13px;line-height:1.55;color:#374151;">${escapeHtml(params.note)}</div>`
                  : ""
              }
              ${
                params.ctaLabel && params.ctaUrl
                  ? `<div style="margin-top:22px;text-align:center;"><a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#F97316;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(params.ctaLabel)}</a></div>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#FAF7F2;border-top:1px solid #ece7df;font-size:11px;line-height:1.5;color:#6b7280;">
              ${escapeHtml(
                params.footerNote ||
                  "Pit Stop Car Hire • 36 Triq IL-Kbira, Mgarr, Malta • Tel: +356 9982 7192 / +356 9980 4255",
              )}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
