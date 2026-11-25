import { db, type DbExecutor } from "./db.ts"

interface ParsedDateRange {
  start: number
  end: number
  valid: boolean
  durationHours?: number
  durationDays?: number
  error?: string
}

// Parses string with optional default time if only a date was supplied (e.g. "May 01, 2026")
function parseDateWithTime(
  dateStr: string,
  defaultTime: "09:00 AM" | "06:00 PM" = "09:00 AM",
): number {
  if (!dateStr || typeof dateStr !== "string") return NaN
  const trimmed = dateStr.trim()
  if (/today/i.test(trimmed) || /right now/i.test(trimmed)) {
    return Date.now()
  }
  const matchInDays = trimmed.match(/in\s+(\d+)\s+days?/i)
  if (matchInDays) {
    const days = parseInt(matchInDays[1], 10) || 3
    return Date.now() + days * 86400000
  }
  const hasTime = /\b(\d{1,2}:\d{2}(\s*(AM|PM))?|T\d{2}:\d{2})/i.test(trimmed)
  if (!hasTime) {
    const withTime = `${trimmed} ${defaultTime}`
    const parsedWithTime = Date.parse(withTime)
    if (!isNaN(parsedWithTime)) return parsedWithTime
  }
  return Date.parse(trimmed)
}

// Strict date range parser - fails safely if dates are missing, unparseable, or invalid
export function parseDateRangeStrict(
  pickupStr?: any,
  returnStr?: any,
  options?: { checkPastDates?: boolean },
): ParsedDateRange {
  if (!pickupStr || !returnStr || typeof pickupStr !== "string" || typeof returnStr !== "string") {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: "Both pickup date and return date are required valid strings.",
    }
  }

  const trimmedPickup = pickupStr.trim()
  const trimmedReturn = returnStr.trim()

  if (!trimmedPickup || !trimmedReturn) {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: "Pickup date and return date cannot be empty.",
    }
  }

  let start = parseDateWithTime(trimmedPickup, "09:00 AM")
  const end = parseDateWithTime(trimmedReturn, "06:00 PM")

  if (isNaN(start) || isNaN(end)) {
    return {
      start: 0,
      end: 0,
      valid: false,
      error: `Invalid date format provided (pickup: "${pickupStr}", return: "${returnStr}").`,
    }
  }

  if (end <= start) {
    return {
      start,
      end,
      valid: false,
      error: "Return date and time must be strictly after pickup date and time.",
    }
  }

  const durationMs = end - start
  const MIN_DURATION_MS = 3 * 3600 * 1000 // 3 hours minimum
  if (durationMs < MIN_DURATION_MS) {
    return {
      start,
      end,
      valid: false,
      error:
        "Minimum rental duration is 3 hours. Please select a return time at least 3 hours after pickup.",
    }
  }

  const MAX_DURATION_MS = 365 * 24 * 3600 * 1000 // 365 days maximum (supports monthly & multi-month rentals)
  if (durationMs > MAX_DURATION_MS) {
    return {
      start,
      end,
      valid: false,
      error:
        "Maximum online reservation duration is 365 days. For multi-year fleet leasing, please contact studio administration.",
    }
  }

  if (options?.checkPastDates) {
    const now = Date.now()
    const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24-hour grace period tolerance for timezones
    if (start < now - GRACE_PERIOD_MS) {
      if (end > now) {
        start = now
      } else {
        return {
          start,
          end,
          valid: false,
          error:
            "Pickup date and time cannot be in the past. Please select a future date and time.",
        }
      }
    } else if (start < now) {
      // Within 24-hour grace window, snap to now if return is in future
      if (end > now) {
        start = now
      }
    }
  }

  return {
    start,
    end,
    valid: true,
    durationHours: Math.round((durationMs / 3600000) * 10) / 10,
    durationDays: Math.max(1, Math.ceil(durationMs / 86400000)),
  }
}

// Validates customer contact details with graceful fallbacks
export function validateCustomerContact(customer: any): {
  valid: boolean
  error?: string
} {
  if (!customer) {
    return { valid: true }
  }
  const firstName = String(customer.firstName || "").trim()
  const lastName = String(customer.lastName || "").trim()
  const email = String(customer.email || "").trim()
  const phone = String(customer.phone || "").trim()

  if (!firstName && !lastName) {
    customer.firstName = "Guest"
    customer.lastName = "Customer"
  } else if (!lastName) {
    customer.lastName = "Customer"
  } else if (!firstName) {
    customer.firstName = "Guest"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    customer.email = "guest@pitstopcarhire.com"
  }
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    customer.phone = "+1 (555) 019-9000"
  }
  return { valid: true }
}

interface DriverValidationResult {
  valid: boolean
  error?: string
}

// Validates driver license expiration and minimum age (18+)
export function validateDriverInfo(
  driver: any,
  pickupTimestamp: number,
  returnTimestamp: number,
): DriverValidationResult {
  if (!driver) return { valid: true }

  // Driver licenses with date-only expirations remain valid through that date.
  if (driver.licenseExpiry) {
    const expiryStr = String(driver.licenseExpiry).trim()
    const expiryTimestamp =
      Date.parse(expiryStr) + (/^\d{4}-\d{2}-\d{2}$/.test(expiryStr) ? 86399999 : 0)
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp < returnTimestamp) {
      return { valid: false, error: "The driver license must be valid through the return date." }
    }
  }

  // 2. Minimum Age Check (18+ Years)
  if (driver.dateOfBirth) {
    const dobStr = String(driver.dateOfBirth).trim()
    const dobTimestamp = Date.parse(dobStr)
    if (!Number.isFinite(dobTimestamp)) {
      return { valid: false, error: "Date of birth is invalid." }
    } else {
      const pickupDate = new Date(pickupTimestamp)
      const birthDate = new Date(dobTimestamp)
      let age = pickupDate.getFullYear() - birthDate.getFullYear()
      const m = pickupDate.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && pickupDate.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        return {
          valid: false,
          error: "Driver must be at least 18 years old to rent a vehicle.",
        }
      }
    }
  }

  return { valid: true }
}

// Helper to parse date strings (e.g. "Mar 15, 2026", "2026-03-15", "Mar 15, 2026 10:00 AM") into timestamp ms
export function parseDateRange(pickupStr: string, returnStr: string) {
  const strict = parseDateRangeStrict(pickupStr, returnStr)
  if (strict.valid) return { start: strict.start, end: strict.end }
  let start = Date.parse(pickupStr)
  let end = Date.parse(returnStr)
  if (isNaN(start)) start = Date.now()
  if (isNaN(end)) end = start + 3 * 24 * 60 * 60 * 1000
  if (end <= start) end = start + 24 * 60 * 60 * 1000
  return { start, end }
}

// Check if two date intervals [startA, endA] and [startB, endB] overlap
export function datesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

// Function to find any conflicting active booking for a given vehicle with fail-safe error handling
export async function findVehicleBookingConflict(
  carId: string,
  pickupStr: string,
  returnStr: string,
  excludeBookingId?: string,
  executor: DbExecutor = db,
) {
  const range = parseDateRangeStrict(pickupStr, returnStr)
  if (!range.valid) {
    return null
  }

  try {
    let query = `
      SELECT id, customer_first_name, customer_last_name, pickup_date, return_date, status
      FROM bookings
      WHERE matched_car_id = ?
        AND status NOT IN ('Completed', 'Cancelled', 'Declined')
    `
    const params: any[] = [carId]
    if (excludeBookingId) {
      query += " AND id != ?"
      params.push(excludeBookingId)
    }

    const activeBookings = (await executor.prepare(query).all(...params)) as any[]

    for (const b of activeBookings) {
      const bRange = parseDateRangeStrict(b.pickup_date, b.return_date)
      const bStart = bRange.valid ? bRange.start : Date.parse(b.pickup_date)
      const bEnd = bRange.valid ? bRange.end : Date.parse(b.return_date)

      if (!isNaN(bStart) && !isNaN(bEnd) && datesOverlap(range.start, range.end, bStart, bEnd)) {
        return {
          conflictingBookingId: b.id,
          customerName: `${b.customer_first_name} ${b.customer_last_name}`,
          pickupDate: b.pickup_date,
          returnDate: b.return_date,
          status: b.status,
        }
      }
    }

    return null
  } catch (err: any) {
    console.error(
      `[Fail-Safe Availability] Database error checking conflicts for ${carId}:`,
      err?.message,
    )
    return {
      conflictingBookingId: "DB_FAILSAFE",
      customerName: "System Fail-Safe",
      pickupDate: String(pickupStr || ""),
      returnDate: String(returnStr || ""),
      status: "FailSafe Locked",
      reason: "Database query error during availability check. Vehicle blocked for safety.",
    }
  }
}
