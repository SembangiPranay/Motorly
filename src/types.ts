export type VehicleType = "Economy" | "Sedan" | "SUV" | "Luxury" | "Van" | "Electric"
export type Transmission = "Automatic" | "Manual"
export type FuelType = "Gasoline" | "Hybrid" | "Electric"
export type CarStatus = "Available" | "Rented" | "Maintenance" | "Cleaning"

export type BookingStatus = "Pending Assignment" | "Assigned" | "Checked Out" | "Returned" | "Completed" | "Cancelled"

export interface Car {
  id: string
  name: string
  brand: string
  model: string
  year: number
  type: VehicleType
  pricePerDay: number
  pricePerHour: number
  image: string
  gallery: string[]
  rating: number
  reviewsCount: number
  seats: number
  transmission: Transmission
  fuelType: FuelType
  mileage: string
  luggage: string
  features: string[]
  description: string
  isPopular?: boolean
  status?: CarStatus
  plateNumber?: string
  location?: string
  healthScore?: number
  // Vehicle History & Insurance Details
  insurancePolicy?: string
  insuranceProvider?: string
  insuranceExpiry?: string
  purchaseDate?: string
  purchaseCost?: number
  currentOdometer?: number
  // Garage & Interactive Map Engine Location
  garageName?: string
  garageAddress?: string
  garageLat?: number
  garageLng?: number
  garageBay?: string
  // Dynamic backend availability & conflict details
  isAvailableForDates?: boolean
  conflict?: any
  statusForDates?: string
}

export interface BookingState {
  carId: string
  pickupLocation: string
  pickupDate: string
  pickupTime: string
  returnLocation: string
  returnDate: string
  returnTime: string
  rentalDurationDays: number
  protectionPlan: boolean
  rentalPlan: "hourly" | "daily" | "weekly" | "monthly"
}

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface DriverInfo {
  dateOfBirth: string
  licenseNumber: string
  licenseState: string
  licenseExpiry: string
  licenseFileName?: string
  licenseBackFileName?: string
  licensePhotoFront?: string
  licensePhotoBack?: string
  selfieFileName?: string
}

export interface PaymentInfo {
  method: "card" | "pickup"
  cardNumber: string
  expiryDate: string
  cvv: string
  cardHolderName: string
}

export interface FilterState {
  types: VehicleType[]
  maxPrice: number
  transmissions: Transmission[]
  fuelTypes: FuelType[]
  seats: number[]
  features: string[]
  sortBy: "recommended" | "price-asc" | "price-desc" | "rating"
}

export interface ExtensionRequest {
  extraDuration: number
  durationValue?: number
  unit: "hours" | "days" | "months"
  durationUnit?: "hours" | "days" | "months" | string
  newReturnDate?: string
  customerNotes?: string
  reason?: string
  requestedAt?: string
}

export interface ExtensionQuote {
  rateType?: "hour" | "day" | "month" | string
  rateAmount?: number
  totalQuotedAmount: number
  durationValue?: number
  durationUnit?: "hours" | "days" | "months" | string
  adminNotes?: string
  notes?: string
  quotedAt?: string
}

export interface InspectionChecklistOut {
  odometerOut: number
  fuelOut?: string
  fuelLevelOut?: string
  exteriorClean?: boolean
  cleanlinessVerified?: boolean
  tiresInspected?: boolean
  tiresExteriorVerified?: boolean
  keysGiven?: boolean
  staffSign?: string
  inspectorStaff?: string
  timestamp: string
}

export interface InspectionChecklistIn {
  odometerIn: number
  fuelIn?: string
  fuelLevelIn?: string
  damageFound?: boolean
  damageNotes?: string
  cleanlinessPass?: boolean
  cleanlinessPassed?: boolean
  inspectionPassed?: boolean
  staffSign?: string
  inspectorStaff?: string
  timestamp: string
}

export interface BookingRecord {
  id: string
  customer: CustomerInfo
  driver?: DriverInfo
  pickupLocation: string
  returnLocation: string
  pickupDate: string
  returnDate: string
  requestedCategory?: VehicleType
  matchedCarId?: string
  status: BookingStatus
  totalAmount: number
  createdAt: string
  userId?: string
  odometerOut?: number
  odometerIn?: number
  fuelLevelOut?: string
  fuelLevelIn?: string
  notes?: string
  promoCode?: string
  // Step D: Admin Approval ("Green Signal")
  approvedByAdmin?: boolean
  approvedAt?: string
  // Step E: Key Handoff & Clock Start
  keysHandedAt?: string
  checklistOut?: InspectionChecklistOut
  // Step F: Extension Negotiation
  extensionStatus?: "None" | "Requested" | "Quoted" | "Approved" | "Declined" | "Pending"
  extensionRequest?: ExtensionRequest
  extensionQuote?: ExtensionQuote
  // Step G: Return Inspection
  checklistIn?: InspectionChecklistIn
  inspectionNotes?: string
  inspectionPassed?: boolean
}

export interface CustomerUser {
  id: string
  email: string
  name: string
  phone: string
  driverLicenseNum?: string
  driverLicenseState?: string
  driverLicenseExpiry?: string
  vipTier?: "Standard" | "Silver" | "Gold" | "VIP"
  role?: "customer" | "staff" | "admin"
  totalBookings?: number
  totalSpent?: number
  createdAt?: string
}

export type AdminCustomerRecord = CustomerUser & {
  hasAccount: boolean
  latestBooking: string
}

export interface PromoCode {
  code: string
  discountPercent: number
  description: string
  isActive: boolean
  expiryDate: string
  usageCount: number
}

export interface MaintenanceLog {
  id: string
  carId: string
  carName?: string
  serviceType: string
  cost: number
  odometer: number
  date: string
  status: "Scheduled" | "In Progress" | "Completed"
  technicianNotes: string
}

export interface MaintenancePagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface PaginatedMaintenanceLogs {
  data: MaintenanceLog[]
  pagination: MaintenancePagination
}

export type ViewMode = "home" | "listing" | "detail" | "checkout" | "admin" | "my-bookings" | "compare" | "auth"
