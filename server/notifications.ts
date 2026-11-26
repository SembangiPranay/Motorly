import type { DbExecutor } from "./db.ts"
import { getAppOrigin } from "./config.ts"
import {
  getSmtpConfig,
  isSyntheticEmail,
  parseEmailList,
  renderEmailShell,
  sendEmail,
  type EmailSendResult,
} from "./mailer.ts"

const recentDispatchCache = new Map<string, number>()
const DEDUPE_TTL_MS = 60_000

function wasRecentlyDispatched(key: string): boolean {
  const now = Date.now()
  for (const [k, ts] of recentDispatchCache.entries()) {
    if (now - ts > DEDUPE_TTL_MS) recentDispatchCache.delete(k)
  }
  const prev = recentDispatchCache.get(key)
  if (prev && now - prev < DEDUPE_TTL_MS) return true
  recentDispatchCache.set(key, now)
  return false
}

export async function getAdminNotificationConfig(db: DbExecutor): Promise<{
  primaryEmail: string
  additionalEmails: string[]
  allRecipients: string[]
  hubAddress: string
  contactPhone: string
  supportPhone: string
}> {
  const cfg = getSmtpConfig()
  let contactEmail = cfg.defaultAdminEmail
  let hasContactEmail = false
  let additionalRaw = ""
  let hubAddress = "36 Triq IL-Kbira, Mgarr, Malta"
  let contactPhone = "+356 9982 7192"
  let supportPhone = ""

  try {
    const rows = (await db
      .prepare("SELECT key, value FROM system_settings")
      .all()) as Array<{ key: string; value: string }>
    for (const r of rows || []) {
      if (r.key === "contact_email" && r.value) {
        contactEmail = String(r.value).trim()
        hasContactEmail = true
      }
      if (r.key === "company_email" && r.value && !hasContactEmail) {
        contactEmail = String(r.value).trim()
      }
      if (r.key === "admin_notification_emails" && r.value) additionalRaw = String(r.value)
      if (r.key === "hub_address" && r.value) hubAddress = String(r.value)
      if (r.key === "contact_phone" && r.value) contactPhone = String(r.value)
      if (r.key === "whatsapp_phone" && r.value && !contactPhone) {
        contactPhone = String(r.value)
      }
      if (r.key === "support_phone" && r.value) supportPhone = String(r.value)
      if (r.key === "company_phone" && r.value && !contactPhone) {
        contactPhone = String(r.value)
      }
    }
  } catch {}

  const envExtra = parseEmailList(process.env.ADMIN_NOTIFICATION_EMAIL)
  const additionalEmails = parseEmailList(additionalRaw)
  const primaryList = parseEmailList(contactEmail).filter((e) => !isSyntheticEmail(e))
  const combined = parseEmailList([
    ...primaryList,
    ...additionalEmails,
    ...envExtra,
    ...(primaryList.length === 0 && additionalEmails.length === 0
      ? [cfg.defaultAdminEmail]
      : []),
  ]).filter((e) => !isSyntheticEmail(e))

  const effectiveSupportPhone = supportPhone || contactPhone

  return {
    primaryEmail: primaryList[0] || cfg.defaultAdminEmail,
    additionalEmails,
    allRecipients: combined,
    hubAddress,
    contactPhone,
    supportPhone: effectiveSupportPhone,
  }
}

async function resolveVehicleLabel(
  db: DbExecutor,
  matchedCarId?: string | null,
  fallbackCategory?: string | null,
): Promise<string> {
  if (matchedCarId) {
    try {
      const car = (await db
        .prepare("SELECT name, year FROM vehicles WHERE id = ?")
        .get(matchedCarId)) as { name?: string; year?: number } | undefined
      if (car?.name) {
        return car.year ? `${car.name} (${car.year})` : car.name
      }
    } catch {}
  }
  return fallbackCategory ? `${fallbackCategory} (Pending Assignment)` : "Assigned Fleet Vehicle"
}

function customerFullName(booking: any): string {
  const first = booking.customer_first_name || booking.customer?.firstName || ""
  const last = booking.customer_last_name || booking.customer?.lastName || ""
  return `${first} ${last}`.trim() || "Valued Customer"
}

function customerEmailOf(booking: any): string {
  return String(booking.customer_email || booking.customer?.email || "").trim()
}

export async function notifyBookingCreated(
  db: DbExecutor,
  booking: any,
): Promise<{ customer: EmailSendResult; admin: EmailSendResult }> {
  const bookingId = String(booking.id || "")
  const customerEmail = customerEmailOf(booking)
  const adminCfg = await getAdminNotificationConfig(db)

  if (wasRecentlyDispatched(`new_booking:${bookingId}`)) {
    return {
      customer: { sent: false, skipped: true, reason: "Already dispatched.", recipients: [] },
      admin: { sent: false, skipped: true, reason: "Already dispatched.", recipients: [] },
    }
  }

  // Skip automated test/E2E traffic that uses synthetic emails
  if (isSyntheticEmail(customerEmail)) {
    return {
      customer: { sent: false, skipped: true, reason: "Synthetic test email.", recipients: [] },
      admin: { sent: false, skipped: true, reason: "Synthetic test booking.", recipients: [] },
    }
  }

  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(
    db,
    booking.matched_car_id,
    booking.requested_category,
  )
  const total = Number(booking.total_amount || 0).toFixed(2)
  const pickupDate = booking.pickup_date || "TBD"
  const returnDate = booking.return_date || "TBD"
  const pickupLocation = booking.pickup_location || adminCfg.hubAddress
  const adminLink = `${getAppOrigin()}/admin?bookingId=${encodeURIComponent(bookingId)}`

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Status", value: booking.status || "Pending Approval" },
    { label: "Vehicle", value: vehicle },
    { label: "Pickup", value: pickupDate },
    { label: "Return", value: returnDate },
    { label: "Location", value: pickupLocation },
    { label: "Trip Purpose", value: booking.trip_reason || "Travel & Leisure" },
    { label: "Total Amount", value: `€${total}` },
  ]

  const customerRes = await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Booking Request Received (${bookingId})`,
    text: `Hello ${name},\n\nThank you for reserving with Pit Stop Car Hire.\nBooking ID: ${bookingId}\nVehicle: ${vehicle}\nPickup: ${pickupDate}\nReturn: ${returnDate}\nLocation: ${pickupLocation}\nTotal: €${total}\n\nOur dispatch team is reviewing your reservation and will confirm shortly.\nQuestions? Call ${adminCfg.contactPhone} or reply to ${adminCfg.primaryEmail}.`,
    html: renderEmailShell({
      badge: "Booking Received",
      title: `Thank you, ${name}!`,
      subtitle: `Your reservation ${bookingId} has been received by Pit Stop Car Hire.`,
      rows,
      note: `A refundable €${Math.round(Number(booking.security_deposit) || 700)} security deposit pre-authorization applies at key handover. You will receive another confirmation email once our fleet manager approves your booking.`,
    }),
  })

  const adminRows = [
    ...rows,
    { label: "Customer", value: name },
    { label: "Customer Email", value: customerEmail },
    { label: "Customer Phone", value: booking.customer_phone || "Not provided" },
  ]

  const adminRes = await sendEmail({
    to: adminCfg.allRecipients,
    replyTo: customerEmail,
    subject: `[ADMIN ALERT] New Booking ${bookingId} – ${vehicle} (€${total})`,
    text: `New booking request ${bookingId}\nCustomer: ${name} (${customerEmail}, ${booking.customer_phone || "No phone"})\nVehicle: ${vehicle}\nPickup: ${pickupDate}\nReturn: ${returnDate}\nLocation: ${pickupLocation}\nTotal: €${total}\nReview: ${adminLink}`,
    html: renderEmailShell({
      badge: "New Booking Alert",
      badgeColor: "#DC2626",
      title: `New Reservation: ${bookingId}`,
      subtitle: `${name} requested ${vehicle} for €${total}.`,
      rows: adminRows,
      ctaLabel: "Review & Approve in Admin Console",
      ctaUrl: adminLink,
    }),
  })

  return { customer: customerRes, admin: adminRes }
}

export async function notifyBookingApproved(db: DbExecutor, booking: any) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(db, booking.matched_car_id, booking.requested_category)
  const total = Number(booking.total_amount || 0).toFixed(2)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Status", value: booking.status || "Assigned & Approved" },
    { label: "Vehicle", value: vehicle },
    { label: "Pickup", value: booking.pickup_date || "TBD" },
    { label: "Return", value: booking.return_date || "TBD" },
    { label: "Pickup Hub", value: booking.pickup_location || adminCfg.hubAddress },
    { label: "Total Amount", value: `€${total}` },
  ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Booking Approved (${bookingId})`,
    text: `Hello ${name},\n\nGreat news! Your booking ${bookingId} for ${vehicle} has been approved.\nPickup: ${booking.pickup_date}\nLocation: ${booking.pickup_location || adminCfg.hubAddress}\nTotal: €${total}\n\nPlease bring your valid driver's license and ID at pickup.`,
    html: renderEmailShell({
      badge: "Approved & Confirmed",
      badgeColor: "#16A34A",
      title: `Booking ${bookingId} Confirmed`,
      subtitle: `Your ${vehicle} is approved and scheduled for pickup.`,
      rows,
      note: `Please present your valid driver's license and government ID at key handover. Call ${adminCfg.supportPhone} if you need delivery assistance.`,
      footerNote: `Pit Stop Car Hire • ${adminCfg.hubAddress} • Support: ${adminCfg.supportPhone}`,
    }),
  })
  await sendEmail({
    to: adminCfg.allRecipients,
    subject: `[ADMIN LOG] Booking Approved – ${bookingId} (${name})`,
    text: `Booking ${bookingId} for ${name} (${customerEmail}) has been approved. Vehicle: ${vehicle}.`,
    html: renderEmailShell({
      badge: "Admin Log: Approved",
      badgeColor: "#16A34A",
      title: `Booking ${bookingId} Approved`,
      subtitle: `Customer ${name} (${customerEmail}) has been notified.`,
      rows,
    }),
  })
}

export async function notifyBookingDeclined(db: DbExecutor, booking: any) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(db, booking.matched_car_id, booking.requested_category)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Status", value: "Declined / Cancelled" },
    { label: "Vehicle", value: vehicle },
    { label: "Requested Dates", value: `${booking.pickup_date || ""} – ${booking.return_date || ""}` },
  ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Reservation Update (${bookingId})`,
    text: `Hello ${name},\n\nUnfortunately, reservation ${bookingId} (${vehicle}) could not be accommodated for the requested dates. Please contact us at ${adminCfg.contactPhone} or ${adminCfg.primaryEmail} to arrange an alternative vehicle.`,
    html: renderEmailShell({
      badge: "Reservation Update",
      badgeColor: "#DC2626",
      title: `Update on Booking ${bookingId}`,
      subtitle: "Your requested reservation could not be confirmed.",
      rows,
      note: `No rental charge has been applied. Please reach out to us at ${adminCfg.contactPhone} or reply to this email for alternative vehicles.`,
    }),
  })
  await sendEmail({
    to: adminCfg.allRecipients,
    subject: `[ADMIN LOG] Booking Declined – ${bookingId}`,
    text: `Booking ${bookingId} for ${name} (${customerEmail}) was declined.`,
    html: renderEmailShell({
      badge: "Admin Log: Declined",
      badgeColor: "#DC2626",
      title: `Booking ${bookingId} Declined`,
      subtitle: `Customer ${name} (${customerEmail}) has been notified.`,
      rows,
    }),
  })
}

export async function notifyKeysHandedOver(
  db: DbExecutor,
  booking: any,
  checklist: { odometerOut: number; odometerUnit: string; fuelOut: string; staffSign: string },
) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(db, booking.matched_car_id, booking.requested_category)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Vehicle", value: vehicle },
    { label: "Odometer Out", value: `${checklist.odometerOut} ${checklist.odometerUnit}` },
    { label: "Fuel Level Out", value: checklist.fuelOut },
    { label: "Return Due", value: booking.return_date || "TBD" },
    { label: "Handled By", value: checklist.staffSign },
  ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Keys Handed Over (${bookingId})`,
    text: `Hello ${name},\n\nKeys have been handed over for ${bookingId} (${vehicle}).\nOdometer Out: ${checklist.odometerOut} ${checklist.odometerUnit}\nFuel Out: ${checklist.fuelOut}\nReturn Due: ${booking.return_date}\n\nHave a safe trip across Malta & Gozo!`,
    html: renderEmailShell({
      badge: "Checked Out • On Road",
      badgeColor: "#2563EB",
      title: `Enjoy Your Drive, ${name}!`,
      subtitle: `Your rental for ${vehicle} is now active.`,
      rows,
      note: `If your rental will be extended, please advise us in advance via the app or by calling ${adminCfg.supportPhone} (Clause 14).`,
      footerNote: `Pit Stop Car Hire • ${adminCfg.hubAddress} • Support: ${adminCfg.supportPhone}`,
    }),
  })
  await sendEmail({
    to: adminCfg.allRecipients,
    subject: `[ADMIN LOG] Keys Handed Over – ${bookingId} (${vehicle})`,
    text: `Keys handed over for ${bookingId} to ${name}. Odometer: ${checklist.odometerOut} ${checklist.odometerUnit}, Fuel: ${checklist.fuelOut}.`,
    html: renderEmailShell({
      badge: "Admin Log: Key Handover",
      badgeColor: "#2563EB",
      title: `Vehicle Checked Out (${bookingId})`,
      subtitle: `${vehicle} handed over to ${name}.`,
      rows,
    }),
  })
}

export async function notifyExtensionRequested(
  db: DbExecutor,
  booking: any,
  extRequest: { extraDuration: number; unit: string; customerNotes: string },
) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(db, booking.matched_car_id, booking.requested_category)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Customer", value: `${name} (${customerEmail})` },
    { label: "Vehicle", value: vehicle },
    { label: "Extra Duration", value: `+${extRequest.extraDuration} ${extRequest.unit}` },
    { label: "Current Return", value: booking.return_date || "TBD" },
    { label: "Notes", value: extRequest.customerNotes },
  ]

  await sendEmail({
    to: adminCfg.allRecipients,
    replyTo: customerEmail,
    subject: `[ADMIN ALERT] Extension Requested – ${bookingId} (+${extRequest.extraDuration} ${extRequest.unit})`,
    text: `${name} requested a +${extRequest.extraDuration} ${extRequest.unit} extension for ${bookingId} (${vehicle}). Notes: ${extRequest.customerNotes}`,
    html: renderEmailShell({
      badge: "Extension Request",
      badgeColor: "#D97706",
      title: `Extension Requested: ${bookingId}`,
      subtitle: `${name} requested +${extRequest.extraDuration} ${extRequest.unit}.`,
      rows,
      note: "Open the Admin Console to send a rate quotation for this extension.",
    }),
  })
}

export async function notifyExtensionQuoted(
  db: DbExecutor,
  booking: any,
  quote: { durationValue: number; durationUnit: string; totalQuotedAmount: number; adminNotes: string },
) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Requested Extension", value: `+${quote.durationValue} ${quote.durationUnit}` },
    { label: "Quoted Cost", value: `€${Number(quote.totalQuotedAmount).toFixed(2)}` },
    { label: "Manager Notes", value: quote.adminNotes },
  ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Extension Quote Ready (${bookingId})`,
    text: `Hello ${name},\n\nYour rental extension quote for ${bookingId} (+${quote.durationValue} ${quote.durationUnit}) is €${Number(quote.totalQuotedAmount).toFixed(2)}.\nPlease open My Bookings in the app to approve or decline.`,
    html: renderEmailShell({
      badge: "Extension Quoted",
      badgeColor: "#D97706",
      title: `Extension Quote for ${bookingId}`,
      subtitle: "Review and approve your extension quote in My Bookings.",
      rows,
    }),
  })
}

export async function notifyExtensionOutcome(
  db: DbExecutor,
  booking: any,
  outcome: "Approved" | "Declined",
  details: { additionalCost?: number; newReturnDate?: string; newTotal?: number; actor?: string },
) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)

  const isApproved = outcome === "Approved"
  const rows = isApproved
    ? [
        { label: "Booking ID", value: bookingId },
        { label: "Extension Status", value: "Approved" },
        { label: "Additional Cost", value: `€${Number(details.additionalCost || 0).toFixed(2)}` },
        { label: "New Return Date", value: details.newReturnDate || booking.return_date || "" },
        { label: "Updated Total", value: `€${Number(details.newTotal || booking.total_amount || 0).toFixed(2)}` },
      ]
    : [
        { label: "Booking ID", value: bookingId },
        { label: "Extension Status", value: `Declined (${details.actor || "customer"})` },
        { label: "Original Return Date", value: booking.return_date || "" },
      ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Extension ${outcome} (${bookingId})`,
    text: isApproved
      ? `Hello ${name},\n\nYour extension for ${bookingId} is approved. New return date: ${details.newReturnDate}. Updated total: €${Number(details.newTotal || 0).toFixed(2)}.`
      : `Hello ${name},\n\nThe extension quotation for ${bookingId} was declined. Original return date remains ${booking.return_date}.`,
    html: renderEmailShell({
      badge: `Extension ${outcome}`,
      badgeColor: isApproved ? "#16A34A" : "#6B7280",
      title: `Extension ${outcome} (${bookingId})`,
      rows,
    }),
  })
  await sendEmail({
    to: adminCfg.allRecipients,
    subject: `[ADMIN LOG] Extension ${outcome} – ${bookingId}`,
    text: `Extension for ${bookingId} (${name}) was ${outcome.toLowerCase()}.`,
    html: renderEmailShell({
      badge: `Admin: Extension ${outcome}`,
      badgeColor: isApproved ? "#16A34A" : "#6B7280",
      title: `Extension ${outcome}: ${bookingId}`,
      subtitle: `Customer: ${name} (${customerEmail})`,
      rows,
    }),
  })
}

export async function notifyReturnInspectionCompleted(
  db: DbExecutor,
  booking: any,
  checklistIn: {
    odometerIn: number
    fuelIn: string
    damageFound: boolean
    damageFee: number
    damageSeverity?: string
    damageLocation?: string
    damageNotes?: string
  },
  newTotal: number,
) {
  const customerEmail = customerEmailOf(booking)
  if (isSyntheticEmail(customerEmail)) return
  const adminCfg = await getAdminNotificationConfig(db)
  const bookingId = String(booking.id || "")
  const name = customerFullName(booking)
  const vehicle = await resolveVehicleLabel(db, booking.matched_car_id, booking.requested_category)

  const rows = [
    { label: "Booking ID", value: bookingId },
    { label: "Vehicle", value: vehicle },
    { label: "Odometer In", value: String(checklistIn.odometerIn) },
    { label: "Fuel Level In", value: checklistIn.fuelIn },
    {
      label: "Inspection Result",
      value: checklistIn.damageFound
        ? `Damage Reported (${checklistIn.damageSeverity || "Minor"} - ${checklistIn.damageLocation || "Exterior"})`
        : "Passed Clean (0 Damage)",
    },
    ...(checklistIn.damageFee > 0
      ? [{ label: "Damage / Cleaning Fee", value: `€${checklistIn.damageFee.toFixed(2)}` }]
      : []),
    { label: "Final Total", value: `€${newTotal.toFixed(2)}` },
  ]

  await sendEmail({
    to: customerEmail,
    replyTo: adminCfg.primaryEmail,
    subject: `Pit Stop Car Hire – Return Receipt & Inspection Summary (${bookingId})`,
    text: `Hello ${name},\n\nThank you for returning ${vehicle} (${bookingId}).\nInspection: ${checklistIn.damageFound ? "Damage reported" : "Passed clean"}\nFinal Total: €${newTotal.toFixed(2)}\n\nWe appreciate your business!`,
    html: renderEmailShell({
      badge: "Trip Completed",
      badgeColor: checklistIn.damageFound ? "#D97706" : "#16A34A",
      title: `Return Receipt: ${bookingId}`,
      subtitle: `Thank you for riding with Pit Stop Car Hire, ${name}.`,
      rows,
      note: checklistIn.damageNotes || undefined,
    }),
  })
  await sendEmail({
    to: adminCfg.allRecipients,
    subject: `[ADMIN LOG] Return Inspection ${checklistIn.damageFound ? "⚠️ DAMAGE" : "Completed"} – ${bookingId}`,
    text: `Return inspection finalized for ${bookingId} (${vehicle}, ${name}). Final total: €${newTotal.toFixed(2)}.`,
    html: renderEmailShell({
      badge: checklistIn.damageFound ? "Admin: Damage Reported" : "Admin: Return Completed",
      badgeColor: checklistIn.damageFound ? "#DC2626" : "#16A34A",
      title: `Return Finalized (${bookingId})`,
      subtitle: `Customer: ${name} (${customerEmail})`,
      rows,
      note: checklistIn.damageNotes || undefined,
    }),
  })
}

export async function sendContactInquiryEmails(
  db: DbExecutor,
  payload: {
    name: string
    email: string
    phone?: string
    dates?: string
    preferredVehicle?: string
    message: string
  },
): Promise<{ admin: EmailSendResult; customer: EmailSendResult }> {
  const adminCfg = await getAdminNotificationConfig(db)
  const rows = [
    { label: "From", value: payload.name },
    { label: "Email", value: payload.email },
    { label: "Phone", value: payload.phone || "Not provided" },
    { label: "Preferred Dates", value: payload.dates || "Flexible" },
    { label: "Preferred Vehicle", value: payload.preferredVehicle || "Any available" },
  ]

  const admin = await sendEmail({
    to: adminCfg.allRecipients,
    replyTo: payload.email,
    subject: `[PIT STOP INQUIRY] Message from ${payload.name}`,
    text: `New rental inquiry from ${payload.name} (${payload.email}, ${payload.phone || "No phone"})\nDates: ${payload.dates || "Flexible"}\nVehicle: ${payload.preferredVehicle || "Any"}\n\nMessage:\n${payload.message}`,
    html: renderEmailShell({
      badge: "Customer Inquiry",
      title: `New Inquiry from ${payload.name}`,
      subtitle: "Submitted via Pit Stop Car Hire Contact Form.",
      rows,
      note: payload.message,
    }),
  })

  const customer = await sendEmail({
    to: payload.email,
    replyTo: adminCfg.primaryEmail,
    subject: "Pit Stop Car Hire – We Received Your Inquiry",
    text: `Hello ${payload.name},\n\nThank you for contacting Pit Stop Car Hire. We have received your inquiry and will reply shortly.\nFor urgent requests, call ${adminCfg.contactPhone}.`,
    html: renderEmailShell({
      badge: "Inquiry Received",
      badgeColor: "#16A34A",
      title: `Thanks for reaching out, ${payload.name}!`,
      subtitle: "Our Mgarr operations team has received your message.",
      rows,
      note: `Your message: "${payload.message}"`,
    }),
  })

  return { admin, customer }
}

export async function sendPasswordResetEmail(
  db: DbExecutor,
  payload: { to: string; name: string; token: string; resetUrl: string },
): Promise<EmailSendResult> {
  const adminCfg = await getAdminNotificationConfig(db)
  return await sendEmail({
    to: payload.to,
    replyTo: adminCfg.primaryEmail,
    subject: "Pit Stop Car Hire – Password Reset Instructions",
    text: `Hello ${payload.name},\n\nWe received a request to reset your Pit Stop Car Hire account password.\n\nReset Code: ${payload.token}\nReset Link: ${payload.resetUrl}\n\nThis code expires in 60 minutes. If you did not request this, you can safely ignore this email.`,
    html: renderEmailShell({
      badge: "Account Security",
      title: "Reset Your Account Password",
      subtitle: `Hello ${payload.name}, use the button or verification code below to set a new password.`,
      rows: [
        { label: "Account Email", value: payload.to },
        { label: "Verification Code", value: payload.token },
        { label: "Valid For", value: "60 Minutes (One-Time Use)" },
      ],
      note: `If clicking the button does not work, copy the verification code ${payload.token} and paste it in the Reset Account Password form on the sign-in screen. Call ${adminCfg.supportPhone} if you need assistance.`,
      ctaLabel: "Reset Password Now",
      ctaUrl: payload.resetUrl,
      footerNote: `Pit Stop Car Hire • ${adminCfg.hubAddress} • Support: ${adminCfg.supportPhone}`,
    }),
  })
}
