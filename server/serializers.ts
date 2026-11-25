import { cachedHubAddress } from "./hub.ts"

// Helper to format car row from SQLite
export function formatCarRow(
  row: any,
  fallbackHub?: string,
  fallbackLat?: number | null,
  fallbackLng?: number | null,
) {
  if (!row) return null

  const isStaleMiami = (val?: string) =>
    !val ||
    val.includes("Miami") ||
    val.includes("Central Hub & Garage Bay 4") ||
    val.includes("4200 NW 21st St")

  const cleanHub =
    fallbackHub && fallbackHub.trim().length > 2
      ? fallbackHub.trim()
      : "36 Triq Il-Kbira, Mgarr, Malta"

  const cleanGarageAddress = !isStaleMiami(row.garage_address)
    ? row.garage_address
    : !isStaleMiami(row.location)
      ? row.location
      : cleanHub

  const cleanGarageName = !isStaleMiami(row.garage_name) ? row.garage_name : cleanGarageAddress

  const cleanLocation = !isStaleMiami(row.location) ? row.location : cleanGarageAddress

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year,
    type: row.type,
    pricePerDay: Number(row.price_per_day),
    pricePerHour: Number(row.price_per_hour),
    pricePerWeek:
      row.price_per_week != null && !isNaN(Number(row.price_per_week))
        ? Number(row.price_per_week)
        : Math.round(Number(row.price_per_day) * 6),
    pricePerMonth:
      row.price_per_month != null && !isNaN(Number(row.price_per_month))
        ? Number(row.price_per_month)
        : Math.round(Number(row.price_per_day) * 22),
    image: row.image,
    gallery: (() => {
      if (Array.isArray(row.gallery)) return row.gallery
      if (typeof row.gallery === "string") {
        try {
          const parsed = JSON.parse(row.gallery)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    })(),
    rating: Number(row.rating) || 5.0,
    reviewsCount: Number(row.reviews_count) || 0,
    seats: Number(row.seats) || 5,
    transmission: row.transmission || "Automatic",
    fuelType: row.fuel_type || "Petrol",
    mileage: row.mileage || "45 Liters",
    luggage: row.luggage || "3 Bags",
    features: (() => {
      if (Array.isArray(row.features)) return row.features
      if (typeof row.features === "string") {
        try {
          const parsed = JSON.parse(row.features)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    })(),
    description: row.description,
    isPopular: Boolean(row.is_popular),
    status: row.status,
    plateNumber: row.plate_number,
    location: cleanLocation,
    healthScore: row.health_score,
    insurancePolicy: row.insurance_policy || "",
    insuranceProvider: row.insurance_provider || "",
    insuranceExpiry: row.insurance_expiry || "",
    purchaseDate: row.purchase_date || "2024-01-10",
    purchaseCost: Number(row.purchase_cost) || 28500,
    currentOdometer: Number(row.current_odometer) || 14250,
    garageName: cleanGarageName,
    garageAddress: cleanGarageAddress,
    garageLat: Number(row.garage_lat) || fallbackLat || 17.4586,
    garageLng: Number(row.garage_lng) || fallbackLng || 78.3606,
    garageBay: row.garage_bay || "Bay 14-B",
    vatRate: row.vat_rate != null && !isNaN(Number(row.vat_rate)) ? Number(row.vat_rate) : 18.0,
    securityDeposit:
      row.security_deposit != null && !isNaN(Number(row.security_deposit))
        ? Number(row.security_deposit)
        : (() => {
            const p = Number(row.price_per_day) || 75
            const t = (row.type || "").toLowerCase()
            if (t === "economy") return 500
            if (t === "sedan") return 800
            if (t === "suv" || t === "van") return 1200
            if (t === "luxury" || t === "electric") return 2000
            return Math.max(500, Math.round(p * 8))
          })(),
  }
}

// Helper to sort bookings chronologically so recent bookings are always at the top
export function parseBookingDateSort(val: any): number {
  if (!val) return 0
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim()
    if (lower === "just now" || lower.startsWith("just now")) {
      return Date.now() + 1000000 // Always prioritize newest bookings at the top
    }
    if (lower.startsWith("today")) {
      return Date.now() - 3600 * 1000
    }
    if (lower.startsWith("yesterday")) {
      return Date.now() - 86400 * 1000
    }
    if (lower.includes("days ago")) {
      const match = lower.match(/(\d+)\s*days\s*ago/)
      const days = match ? parseInt(match[1], 10) : 3
      return Date.now() - days * 86400 * 1000
    }
    let cleanStr = val
      .replace(/Counter Dispatch\s*\(/i, "")
      .replace(/\)$/, "")
      .trim()
    if (!cleanStr.match(/\b20\d\d\b/)) {
      cleanStr = `${cleanStr}, 2026`
    }
    const parsed = Date.parse(cleanStr)
    if (!isNaN(parsed)) return parsed
  }
  if (val instanceof Date) return val.getTime()
  return 0
}

// Helper to format booking row from SQLite
export function formatBookingRow(row: any) {
  if (!row) return null

  let checklistOut = undefined
  let checklistIn = undefined
  let extensionRequest = undefined
  let extensionQuote = undefined

  try {
    if (row.checklist_out) {
      const parsed = JSON.parse(row.checklist_out)
      checklistOut = {
        ...parsed,
        fuelLevelOut: parsed.fuelLevelOut || parsed.fuelOut || "100%",
      }
    }
  } catch {}
  try {
    if (row.checklist_in) {
      const parsed = JSON.parse(row.checklist_in)
      checklistIn = {
        ...parsed,
        fuelLevelIn: parsed.fuelLevelIn || parsed.fuelIn || "100%",
        damagePhotos: Array.isArray(parsed.damagePhotos) ? parsed.damagePhotos : [],
        damageNotes: parsed.damageNotes || parsed.inspectionNotes || "",
        damageSeverity: parsed.damageSeverity || "",
        damageLocation: parsed.damageLocation || "",
        damageFee: Number(parsed.damageFee) || 0,
      }
    }
  } catch {}
  try {
    if (row.extension_request) {
      const parsed = JSON.parse(row.extension_request)
      extensionRequest = {
        ...parsed,
        durationValue: parsed.durationValue ?? parsed.extraDuration ?? 1,
        durationUnit: parsed.durationUnit ?? parsed.unit ?? "days",
        reason: parsed.reason ?? parsed.customerNotes ?? "",
      }
    }
  } catch {}
  try {
    if (row.extension_quote) extensionQuote = JSON.parse(row.extension_quote)
  } catch {}

  // Compact photo reference to avoid sending megabytes of base64 in list API responses
  const hasFrontBase64 = row.driver_license_file && row.driver_license_file.startsWith("data:")
  const hasBackBase64 =
    row.driver_license_back_file && row.driver_license_back_file.startsWith("data:")

  const licenseFileName = hasFrontBase64
    ? "driver_license_front.jpg"
    : row.driver_license_file || undefined
  const licenseBackFileName = hasBackBase64
    ? "driver_license_back.jpg"
    : row.driver_license_back_file || undefined

  const licensePhotoFront = hasFrontBase64
    ? `/api/bookings/${row.id}/download-license?side=front`
    : undefined
  const licensePhotoBack = hasBackBase64
    ? `/api/bookings/${row.id}/download-license?side=back`
    : undefined

  const isStaleMiamiLoc = (loc?: string) =>
    !loc || loc.includes("Miami") || loc.includes("Main Garage")

  const defaultHub = cachedHubAddress || "36 Triq Il-Kbira, Mgarr, Malta"

  const cleanPickupLoc = !isStaleMiamiLoc(row.pickup_location) ? row.pickup_location : defaultHub

  const cleanReturnLoc = !isStaleMiamiLoc(row.return_location) ? row.return_location : defaultHub

  return {
    id: row.id,
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    driver: {
      dateOfBirth: row.driver_dob || "",
      licenseNumber: row.driver_license_num || "",
      licenseState: row.driver_license_state || "",
      licenseExpiry: row.driver_license_expiry || "",
      licenseFileName,
      licenseBackFileName,
      licensePhotoFront,
      licensePhotoBack,
      selfieFileName: row.driver_selfie_file || undefined,
    },
    pickupLocation: cleanPickupLoc,
    returnLocation: cleanReturnLoc,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    requestedCategory: row.requested_category,
    matchedCarId: row.matched_car_id,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    userId: row.user_id || undefined,
    odometerOut: row.odometer_out || undefined,
    odometerIn: row.odometer_in || undefined,
    fuelLevelOut: row.fuel_level_out || undefined,
    fuelLevelIn: row.fuel_level_in || undefined,
    notes: row.notes || undefined,
    tripReason:
      row.trip_reason ||
      (row.notes && row.notes.includes("Trip Purpose:")
        ? row.notes.split("Trip Purpose:")[1]?.split("-")[0]?.trim()
        : undefined) ||
      "Travel & Leisure",
    promoCode: row.promo_code || undefined,
    approvedByAdmin: Boolean(row.approved_by_admin),
    approvedAt: row.approved_at || undefined,
    keysHandedAt: row.keys_handed_at || undefined,
    checklistOut,
    checklistIn,
    extensionStatus: row.extension_status || "None",
    extensionRequest,
    extensionQuote,
    inspectionNotes: row.inspection_notes || undefined,
    inspectionPassed: Boolean(row.inspection_passed),
    // Pit Stop Rental Agreement Record Properties
    deliveryType: row.delivery_type || "garage",
    deliveryLocationCustom: row.delivery_location_custom || undefined,
    deliveryFee: Number(row.delivery_fee) || 0,
    returnType: row.return_type || "garage",
    returnLocationCustom: row.return_location_custom || undefined,
    returnFee: Number(row.return_fee) || 0,
    optionalServices: (() => {
      if (!row.optional_services) return []
      try {
        const parsed = JSON.parse(row.optional_services)
        return Array.isArray(parsed) ? parsed : [row.optional_services]
      } catch {
        return String(row.optional_services)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    })(),
    optionalServicesCost: Number(row.optional_services_cost) || 0,
    securityDeposit: Number(row.security_deposit) || 700,
    remarks: row.remarks || undefined,
    clientSignature: row.client_signature || undefined,
    conditionPins: (() => {
      if (!row.condition_pins) return []
      try {
        const parsed = JSON.parse(row.condition_pins)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
    conditionPhotos: (() => {
      if (!row.condition_photos) return []
      try {
        const parsed = JSON.parse(row.condition_photos)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })(),
    deliveryCoordinates: (() => {
      if (!row.delivery_coordinates) return undefined
      try {
        return typeof row.delivery_coordinates === "string"
          ? JSON.parse(row.delivery_coordinates)
          : row.delivery_coordinates
      } catch {
        return undefined
      }
    })(),
    returnCoordinates: (() => {
      if (!row.return_coordinates) return undefined
      try {
        return typeof row.return_coordinates === "string"
          ? JSON.parse(row.return_coordinates)
          : row.return_coordinates
      } catch {
        return undefined
      }
    })(),
  }
}

// Helper to format user row
export function formatUserRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || "",
    driverLicenseNum: row.driver_license_num || "",
    driverLicenseState: row.driver_license_state || "",
    driverLicenseExpiry: row.driver_license_expiry || "",
    role: row.role || "customer",
    vipTier: row.vip_tier || "Standard",
    createdAt: row.created_at,
  }
}

// Helper to format promo row
export function formatPromoRow(row: any) {
  if (!row) return null
  return {
    code: row.code,
    discountPercent: row.discount_percent,
    description: row.description || "",
    isActive: Boolean(row.is_active),
    expiryDate: row.expiry_date || "2026-12-31",
    usageCount: row.usage_count || 0,
  }
}

// Helper to format maintenance row
export function formatMaintenanceRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    carId: row.car_id,
    carName: row.car_name || undefined,
    serviceType: row.service_type,
    cost: row.cost,
    odometer: row.odometer,
    date: row.date,
    status: row.status,
    technicianNotes: row.technician_notes || "",
  }
}

export function safeJsonStringify(val: any, fallback: string = "[]"): string {
  if (!val) return fallback
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      return JSON.stringify(parsed)
    } catch {
      return JSON.stringify([val])
    }
  }
  if (Array.isArray(val) || (typeof val === "object" && val !== null)) {
    return JSON.stringify(val)
  }
  return fallback
}
