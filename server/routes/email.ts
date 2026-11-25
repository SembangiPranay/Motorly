import { Router } from "express"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import {
  getSmtpConfig,
  parseEmailList,
  renderEmailShell,
  sendEmail,
  verifySmtpConnection,
} from "../mailer.ts"
import { getAdminNotificationConfig, sendContactInquiryEmails } from "../notifications.ts"

const router = Router()

// Admin Email Status & Diagnostics
router.get("/admin/email-status", requireAdmin, async (_req, res) => {
  try {
    const [smtp, adminCfg] = await Promise.all([
      verifySmtpConnection(),
      getAdminNotificationConfig(db),
    ])
    return res.json({
      success: true,
      smtp,
      adminRecipients: adminCfg.allRecipients,
      primaryEmail: adminCfg.primaryEmail,
      additionalEmails: adminCfg.additionalEmails,
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to check email status.",
    })
  }
})

// Admin Live SMTP Test Email Endpoint
router.post("/admin/test-email", requireAdmin, async (req, res) => {
  try {
    const { to, subject, message } = req.body || {}
    const adminCfg = await getAdminNotificationConfig(db)
    const requestedRecipients = parseEmailList(to)
    const recipients = requestedRecipients.length > 0 ? requestedRecipients : adminCfg.allRecipients

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid recipient email address configured.",
      })
    }

    const emailSubject = subject || "Pit Stop Car Hire – Admin SMTP Live Verification"
    const bodyNote =
      message ||
      "This test email confirms that automated Gmail SMTP notifications (customer confirmations & admin alerts) are active and delivering properly."

    const result = await sendEmail({
      to: recipients,
      replyTo: adminCfg.primaryEmail,
      subject: emailSubject,
      text: `${emailSubject}\n\n${bodyNote}\n\nConfigured Admin Recipients: ${adminCfg.allRecipients.join(", ")}\nTimestamp: ${new Date().toISOString()}`,
      html: renderEmailShell({
        badge: "SMTP Live Test",
        badgeColor: "#16A34A",
        title: "Pit Stop Email Dispatch Active",
        subtitle: "Verified from the Admin Operations Console.",
        rows: [
          { label: "SMTP Sender", value: getSmtpConfig().user || "Not set" },
          { label: "Recipients", value: recipients.join(", ") },
          {
            label: "Admin Alert List",
            value: adminCfg.allRecipients.join(", "),
          },
          { label: "Verified At", value: new Date().toISOString() },
        ],
        note: bodyNote,
      }),
    })

    if (!result.sent) {
      return res.status(result.skipped ? 400 : 502).json({
        success: false,
        error: result.error || result.reason || "Failed to send test email.",
        result,
      })
    }

    return res.json({
      success: true,
      message: `Test email delivered to ${result.recipients.join(", ")}`,
      sentTo: result.recipients,
      messageId: result.messageId,
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send test email.",
    })
  }
})

// Customer Contact & Rental Inquiry Endpoint (Sends Email to Admin + Auto-Reply to Customer)
router.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, dates, preferredVehicle, message } = req.body || {}
    const cleanName = String(name || "").trim()
    const cleanEmail = String(email || "").trim()
    const cleanMessage = String(message || "").trim()

    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanMessage) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required.",
      })
    }

    const result = await sendContactInquiryEmails(db, {
      name: cleanName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : "",
      dates: dates ? String(dates).trim() : "",
      preferredVehicle: preferredVehicle ? String(preferredVehicle).trim() : "",
      message: cleanMessage,
    })

    if (!result.admin.sent) {
      return res
        .status(503)
        .json({
          success: false,
          error: "Email delivery is unavailable. Please contact the garage by phone.",
        })
    }

    return res.json({
      success: true,
      adminNotified: result.admin.sent,
      customerAcknowledged: result.customer.sent,
      message: result.customer.sent
        ? "Inquiry sent! A confirmation copy has been emailed to you."
        : "Inquiry sent to the garage.",
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send contact inquiry.",
    })
  }
})

export default router
