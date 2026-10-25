import type {
  Car,
  BookingRecord,
  CarStatus,
  VehicleType,
  CustomerUser,
  AdminCustomerRecord,
  PromoCode,
  MaintenanceLog,
  PaginatedMaintenanceLogs,
  BookingStatus,
} from "../types"

// Base API endpoints - supports relative proxy or direct backend port
const PRIMARY_BASE = "/api"
const FALLBACK_BASE = "http://localhost:3001/api"

class ApiService {
  private getHeaders(role?: "admin" | "customer"): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const adminToken = localStorage.getItem("motorly_admin_token")
    const customerToken = localStorage.getItem("motorly_customer_token")

    if (role === "customer") {
      if (customerToken) {
        headers["Authorization"] = `Bearer ${customerToken}`
      }
    } else if (role === "admin") {
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`
      }
    } else {
      // Default: if customer token exists and no explicit admin role requested, use customer token; otherwise admin token
      if (customerToken) {
        headers["Authorization"] = `Bearer ${customerToken}`
      } else if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`
      }
    }
    return headers
  }

  async safeJson(res: Response, fallback: any = null): Promise<any> {
    try {
      const text = await res.text()
      return text ? JSON.parse(text) : fallback
    } catch {
      return fallback
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    role?: "admin" | "customer",
  ): Promise<Response> {
    const mergedHeaders = {
      ...this.getHeaders(role),
      ...(options.headers as Record<string, string> || {}),
    }
    const config: RequestInit = {
      ...options,
      headers: mergedHeaders,
    }

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")

    // Try relative URL first (standard in Vercel and Vite dev proxy)
    try {
      const res = await fetch(`${PRIMARY_BASE}${endpoint}`, config)
      if (
        !isLocalhost ||
        (res.status !== 404 &&
          res.status !== 500 &&
          res.status !== 502 &&
          res.status !== 503)
      ) {
        return res
      }
    } catch (e) {
      if (!isLocalhost) throw e
    }

    // In local development only, fallback to direct backend port 3001
    if (isLocalhost) {
      return fetch(`${FALLBACK_BASE}${endpoint}`, config)
    }

    throw new Error("Unable to reach backend service.")
  }

  // --- Customer Authentication & Self-Service Portal ---
  async registerCustomer(userData: {
    email: string
    password: string
    name: string
    phone?: string
    driverLicenseNum?: string
    driverLicenseState?: string
    driverLicenseExpiry?: string
  }): Promise<{
    success: boolean
    token?: string
    user?: CustomerUser
    message?: string
  }> {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    const data = await this.safeJson(res, null)
    if (!res.ok || !data) {
      return {
        success: false,
        message:
          data?.message ||
          data?.error ||
          `Registration failed (HTTP ${res.status}).`,
      }
    }
    if (data.token) {
      localStorage.setItem("motorly_customer_token", data.token)
      localStorage.setItem("motorly_customer_user", JSON.stringify(data.user))
    }
    return data
  }

  async loginCustomer(credentials: {
    email: string
    password: string
  }): Promise<{
    success: boolean
    token?: string
    user?: CustomerUser
    message?: string
  }> {
    const res = await this.request("/auth/customer-login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
    const data = await this.safeJson(res, null)
    if (!res.ok || !data) {
      return {
        success: false,
        message:
          data?.message ||
          data?.error ||
          (res.status === 500
            ? "Server error. Please verify backend database configuration."
            : `Login failed (HTTP ${res.status}).`),
      }
    }
    if (data.token) {
      localStorage.setItem("motorly_customer_token", data.token)
      localStorage.setItem("motorly_customer_user", JSON.stringify(data.user))
    }
    return data
  }

  async getCustomerProfile(): Promise<CustomerUser | null> {
    const token = localStorage.getItem("motorly_customer_token")
    if (!token) {
      // Check stored user fallback
      const stored = localStorage.getItem("motorly_customer_user")
      try {
        return stored ? JSON.parse(stored) : null
      } catch {
        return null
      }
    }

    try {
      const res = await this.request("/auth/customer-me", {}, "customer")
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("motorly_customer_token")
          localStorage.removeItem("motorly_customer_user")
          return null
        }
        // If server 500 or timeout, preserve cached user from localStorage
        const stored = localStorage.getItem("motorly_customer_user")
        return stored ? JSON.parse(stored) : null
      }
      const data = await this.safeJson(res, null)
      if (data?.user) {
        localStorage.setItem("motorly_customer_user", JSON.stringify(data.user))
      }
      return data?.user || null
    } catch {
      // Network hiccup - return cached user if available
      const stored = localStorage.getItem("motorly_customer_user")
      try {
        return stored ? JSON.parse(stored) : null
      } catch {
        return null
      }
    }
  }

  logoutCustomer() {
    localStorage.removeItem("motorly_customer_token")
    localStorage.removeItem("motorly_customer_user")
    this.request("/auth/customer-logout", { method: "POST" }, "customer").catch(
      () => {},
    )
  }

  async getCustomerBookings(email?: string): Promise<BookingRecord[]> {
    const query = email ? `?email=${encodeURIComponent(email)}` : ""
    const res = await this.request(`/users/bookings${query}`, {}, "customer")
    if (!res.ok) throw new Error("Failed to fetch customer reservations")
    const data = await this.safeJson(res, [])
    return Array.isArray(data) ? data : []
  }

  // --- Auth & Admin Verification ---
  async adminLogin(password: string, email?: string): Promise<{
    success: boolean
    token?: string
    role?: string
    user?: any
    message?: string
  }> {
    try {
      const res = await this.request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ password, email }),
        },
        "admin",
      )
      const data = await this.safeJson(res, null)
      if (!res.ok || !data) {
        return {
          success: false,
          message:
            data?.message ||
            data?.error ||
            (res.status === 500
              ? "Backend server error. Please verify your Supabase DATABASE_URL in Vercel settings."
              : `Authentication failed (HTTP ${res.status}).`),
        }
      }
      if (data.token) {
        localStorage.setItem("motorly_admin_token", data.token)
        if (data.user) {
          localStorage.setItem("motorly_admin_user", JSON.stringify(data.user))
        }
      }
      return data
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach backend.",
      }
    }
  }

  hasAdminToken(): boolean {
    try {
      return Boolean(
        typeof localStorage !== "undefined" &&
          localStorage.getItem("motorly_admin_token"),
      )
    } catch {
      return false
    }
  }

  logoutAdmin() {
    localStorage.removeItem("motorly_admin_token")
    localStorage.removeItem("motorly_admin_user")
  }

  async verifyAdminSession(): Promise<boolean> {
    const token = localStorage.getItem("motorly_admin_token")
    if (!token) return false

    try {
      const res = await this.request(
        "/auth/verify",
        {
          method: "POST",
          body: JSON.stringify({ token }),
        },
        "admin",
      )
      const data = await this.safeJson(res, null)
      return Boolean(data?.authenticated)
    } catch {
      return false
    }
  }

  // --- Cars / Fleet Management ---
  async getCars(filters?: {
    status?: string
    type?: string
    search?: string
    maxPrice?: number
    pickupDate?: string
    returnDate?: string
  }): Promise<Car[]> {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== "all")
      params.append("status", filters.status)
    if (filters?.type && filters.type !== "all")
      params.append("type", filters.type)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.maxPrice)
      params.append("maxPrice", filters.maxPrice.toString())
    if (filters?.pickupDate) params.append("pickupDate", filters.pickupDate)
    if (filters?.returnDate) params.append("returnDate", filters.returnDate)

    const queryString = params.toString() ? `?${params.toString()}` : ""
    const res = await this.request(`/cars${queryString}`)
    if (!res.ok) throw new Error("Failed to fetch vehicles from backend")
    return res.json()
  }

  async getCarById(id: string): Promise<Car> {
    const res = await this.request(`/cars/${id}`)
    if (!res.ok) throw new Error(`Vehicle ${id} not found`)
    return res.json()
  }

  async createCar(car: Partial<Car>): Promise<Car> {
    const res = await this.request("/cars", {
      method: "POST",
      body: JSON.stringify(car),
    })
    if (!res.ok) throw new Error("Failed to create vehicle")
    return res.json()
  }

  async updateCar(id: string, car: Partial<Car>): Promise<Car> {
    const res = await this.request(`/cars/${id}`, {
      method: "PUT",
      body: JSON.stringify(car),
    })
    if (!res.ok) throw new Error("Failed to update vehicle")
    return res.json()
  }

  async updateCarStatus(id: string, status: CarStatus): Promise<Car> {
    const res = await this.request(`/cars/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error("Failed to update vehicle status")
    return res.json()
  }

  async updateCarPricing(
    id: string,
    pricing: { pricePerHour: number; pricePerDay: number; pricePerMonth: number },
  ): Promise<{ success: boolean; message: string; car: Car }> {
    const res = await this.request(`/cars/${id}/pricing`, {
      method: "PATCH",
      body: JSON.stringify(pricing),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to update vehicle pricing")
    }
    return res.json()
  }

  async deleteCar(id: string): Promise<boolean> {
    const res = await this.request(`/cars/${id}`, {
      method: "DELETE",
    })
    return res.ok
  }

  // --- Bookings & Vehicle Mating ---
  async getBookings(): Promise<BookingRecord[]> {
    if (!this.hasAdminToken()) return []
    const res = await this.request("/bookings", {}, "admin")
    if (!res.ok) throw new Error("Failed to fetch bookings")
    return res.json()
  }

  async createBooking(bookingData: any): Promise<BookingRecord> {
    const res = await this.request(
      "/bookings",
      {
        method: "POST",
        body: JSON.stringify(bookingData),
      },
      "customer",
    )
    if (!res.ok) throw new Error("Failed to create booking")
    return res.json()
  }

  async mateCar(bookingId: string, carId: string): Promise<{
    success: boolean
    booking: BookingRecord
    car: Car
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/mate`,
      {
        method: "POST",
        body: JSON.stringify({ carId }),
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to mate vehicle to booking")
    return res.json()
  }

  async unmateCar(bookingId: string): Promise<{
    success: boolean
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/unmate`,
      {
        method: "POST",
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to release vehicle")
    return res.json()
  }

  async updateBookingStatus(
    bookingId: string,
    data: {
      status: BookingStatus
      odometerOut?: number
      odometerIn?: number
      fuelLevelOut?: string
      fuelLevelIn?: string
      notes?: string
    },
  ): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to advance booking lifecycle")
    return res.json()
  }

  // --- Step D: Admin Approval ("Accept Request") ---
  async approveBooking(bookingId: string): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/accept`,
      {
        method: "POST",
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to approve reservation request")
    return res.json()
  }

  async declineBooking(bookingId: string): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/decline`,
      {
        method: "POST",
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to decline reservation request")
    return res.json()
  }

  // --- Step E: Key Handoff & Checklist (Timer Starts) ---
  async handoverKeys(
    bookingId: string,
    data: {
      odometerOut: number
      fuelOut: string
      exteriorClean?: boolean
      tiresInspected?: boolean
      staffSign?: string
    },
  ): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/handover-keys`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to confirm key handover")
    return res.json()
  }

  // --- Step F: Extension Negotiation Workflow ---
  async requestExtension(
    bookingId: string,
    data: {
      extraDuration: number
      unit: "hours" | "days" | "months"
      customerNotes?: string
    },
  ): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/request-extension`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "customer",
    )
    if (!res.ok) throw new Error("Failed to submit extension request")
    return res.json()
  }

  async quoteExtension(
    bookingId: string,
    data: {
      rateType: "hour" | "day" | "month"
      rateAmount: number
      totalQuotedAmount: number
      adminNotes?: string
    },
  ): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/quote-extension`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to send extension quotation")
    return res.json()
  }

  async approveExtension(bookingId: string): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/approve-extension`,
      {
        method: "POST",
      },
      "customer",
    )
    if (!res.ok) throw new Error("Failed to approve quotation")
    return res.json()
  }

  async declineExtension(bookingId: string): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/decline-extension`,
      {
        method: "POST",
      },
      "customer",
    )
    if (!res.ok) throw new Error("Failed to decline extension")
    return res.json()
  }

  // --- Step G: Return Inspection Checklist ---
  async returnInspection(
    bookingId: string,
    data: {
      odometerIn: number
      fuelIn: string
      damageFound?: boolean
      cleanlinessPass?: boolean
      inspectionPassed?: boolean
      staffSign?: string
      inspectionNotes?: string
    },
  ): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request(
      `/bookings/${bookingId}/return-inspection`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "admin",
    )
    if (!res.ok) throw new Error("Failed to complete return inspection")
    return res.json()
  }

  // Driver License Download URL
  getLicenseDownloadUrl(
    bookingId: string,
    side: "front" | "back" | "certificate" = "front",
  ): string {
    const adminToken = localStorage.getItem("motorly_admin_token")
    const customerToken = localStorage.getItem("motorly_customer_token")
    const token = adminToken || customerToken
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ""
    return `/api/bookings/${bookingId}/download-license?side=${side}${tokenParam}`
  }

  // Check vehicle availability for specific date range
  async checkCarAvailability(
    carId: string,
    pickupDate: string,
    returnDate: string,
  ): Promise<{
    carId: string
    isAvailable: boolean
    carStatus: string
    conflict?: {
      conflictingBookingId: string
      customerName: string
      pickupDate: string
      returnDate: string
      status: string
    } | null
  }> {
    try {
      const res = await this.request(
        `/cars/${carId}/availability?pickupDate=${encodeURIComponent(
          pickupDate,
        )}&returnDate=${encodeURIComponent(returnDate)}`,
      )
      if (!res.ok) return { carId, isAvailable: true, carStatus: "Available" }
      return res.json()
    } catch {
      return { carId, isAvailable: true, carStatus: "Available" }
    }
  }

  async createCounterBooking(data: {
    firstName: string
    lastName: string
    email: string
    phone: string
    carId: string
    pickupDate?: string
    returnDate?: string
    totalAmount?: number
    immediateCheckout?: boolean
    licenseNumber?: string
    licenseState?: string
    notes?: string
  }): Promise<{
    success: boolean
    message: string
    booking: BookingRecord
  }> {
    const res = await this.request("/admin/counter-booking", {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to dispatch counter reservation")
    return res.json()
  }

  // --- CRM & Customers Directory ---
  async getAdminCustomers(): Promise<AdminCustomerRecord[]> {
    const res = await this.request("/admin/customers")
    if (!res.ok) throw new Error("Failed to fetch customer directory")
    return res.json()
  }

  // --- Promo Codes & Dynamic Coupons ---
  async getPromos(): Promise<PromoCode[]> {
    const res = await this.request("/promos")
    if (!res.ok) throw new Error("Failed to fetch promo rules")
    return res.json()
  }

  async createPromo(data: {
    code: string
    discountPercent: number
    description: string
    expiryDate: string
  }): Promise<PromoCode> {
    const res = await this.request("/promos", {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create promo code")
    return res.json()
  }

  async togglePromo(code: string): Promise<PromoCode> {
    const res = await this.request(
      `/promos/${encodeURIComponent(code)}/toggle`,
      {
        method: "PATCH",
      },
    )
    if (!res.ok) throw new Error("Failed to toggle promo code")
    return res.json()
  }

  async deletePromo(code: string): Promise<boolean> {
    const res = await this.request(`/promos/${encodeURIComponent(code)}`, {
      method: "DELETE",
    })
    return res.ok
  }

  async validatePromo(code: string): Promise<{
    valid: boolean
    code: string
    discountPercent: number
    description: string
    message: string
  }> {
    try {
      const res = await this.request("/promos/validate", {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      const data = await this.safeJson(res, null)
      if (data && typeof data.valid === "boolean") {
        return data
      }
      return {
        valid: false,
        code,
        discountPercent: 0,
        description: "",
        message: data?.message || "Invalid or inactive promo code.",
      }
    } catch {
      return {
        valid: false,
        code,
        discountPercent: 0,
        description: "",
        message: "Unable to validate coupon code at this time.",
      }
    }
  }

  // --- Maintenance & Service Logs ---
  async getMaintenanceLogs(params?: {
    page?: number
    limit?: number
    carId?: string
    status?: string
    search?: string
    all?: boolean
  }): Promise<PaginatedMaintenanceLogs> {
    const query = new URLSearchParams()
    if (params?.page) query.set("page", String(params.page))
    if (params?.limit) query.set("limit", String(params.limit))
    if (params?.carId) query.set("carId", params.carId)
    if (params?.status) query.set("status", params.status)
    if (params?.search) query.set("search", params.search)
    if (params?.all) query.set("all", "true")

    const queryString = query.toString() ? `?${query.toString()}` : ""
    const res = await this.request(`/maintenance${queryString}`)
    if (!res.ok) throw new Error("Failed to fetch maintenance logs")
    const json = await res.json()

    if (Array.isArray(json)) {
      return {
        data: json,
        pagination: {
          page: 1,
          limit: json.length,
          total: json.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }
    }
    return json
  }

  async createMaintenanceLog(data: {
    carId: string
    serviceType: string
    cost: number
    odometer: number
    date: string
    status: "Scheduled" | "In Progress" | "Completed"
    technicianNotes: string
    setVehicleStatus?: string
  }): Promise<MaintenanceLog> {
    const res = await this.request("/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create maintenance work order")
    return res.json()
  }

  async updateMaintenanceStatus(
    id: string,
    status: string,
  ): Promise<MaintenanceLog> {
    const res = await this.request(`/maintenance/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error("Failed to update maintenance status")
    return res.json()
  }

  // --- Admin Stats ---
  async getAdminStats(): Promise<{
    fleet: {
      total: number
      available: number
      rented: number
      maintenance: number
      cleaning: number
      utilization: number
      activeRevenue: number
    }
    bookings: {
      total: number
      pendingMating: number
      assigned: number
    }
  }> {
    const res = await this.request("/admin/stats")
    if (!res.ok) throw new Error("Failed to fetch admin stats")
    return res.json()
  }

  // --- File Upload ---
  async uploadLicenseFile(fileName: string): Promise<{
    success: boolean
    fileName: string
    url: string
  }> {
    try {
      const res = await this.request("/upload", {
        method: "POST",
        body: JSON.stringify({ fileName }),
      })
      const data = await this.safeJson(res, null)
      if (data && data.url) return data
      return { success: false, fileName, url: "" }
    } catch {
      return { success: false, fileName, url: "" }
    }
  }
}

export const api = new ApiService()
