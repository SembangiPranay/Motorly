import React, { useState, useMemo, useEffect } from "react"

import type {
  Car,
  BookingRecord,
  VehicleType,
  CarStatus,
  BookingStatus,
  Transmission,
  FuelType,
  CustomerUser,
  AdminCustomerRecord,
  PromoCode,
  MaintenanceLog,
  MaintenancePagination,
  InspectionChecklistOut,
  InspectionChecklistIn,
  ExtensionQuote,
} from "../types"

import { api } from "../services/api"

import GarageMapViewer from "../components/GarageMapViewer"

import {
  downloadBookingInvoicePng,
  downloadBookingInvoicePdf,
} from "../utils/invoiceGenerator"
import InvoiceModal from "../components/InvoiceModal"

import { getGoogleMapsUrl, openGoogleMaps } from "../utils/maps"

import { getEmailUrls } from "../utils/email"

import {
  getWhatsAppUrls,
  formatInternationalPhoneDisplay,
  normalizeWhatsAppPhone,
} from "../utils/whatsapp"

import {
  CarIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  WrenchIcon,
  LinkIcon,
  CheckIcon,
  ClockIcon,
  ShieldIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  LocationIcon,
  CalendarIcon,
  UserIcon,
  LockIcon,
  TagIcon,
  ZapIcon,
  SparklesIcon,
  QrCodeIcon,
  GridIcon,
  ListIcon,
  BellIcon,
  PhoneIcon,
  MailIcon,
  SettingsIcon,
  AlertTriangleIcon,
  KeyIcon,
  FlagIcon,
  DownloadIcon,
  CameraIcon,
  UploadIcon,
  RefreshCwIcon,
  FileTextIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  LogOutIcon,
  StarIcon,
  CrosshairIcon,
  NavigationIcon,
} from "../components/Icons"

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

export const formatFuelDisplay = (mileage?: string, fuelType?: string): string => {
  if (!mileage || !mileage.trim()) {
    return fuelType === "Electric" ? "100% EV" : "45 Liters"
  }
  const clean = mileage.trim()
  if (fuelType === "Electric") {
    if (clean.includes("%") || clean.toLowerCase().includes("kwh") || clean.toLowerCase().includes("ev")) {
      return clean
    }
    return `${clean} kWh`
  }
  if (/liters?|ltrs?|\bl\b/i.test(clean)) {
    return clean
  }
  if (/mpg|mpge/i.test(clean)) {
    const num = clean.replace(/[^0-9.]/g, "")
    return num ? `${num} Liters` : clean
  }
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return `${clean} Liters`
  }
  return `${clean} Liters`
}

interface AdminViewProps {
  cars: Car[]

  setCars: React.Dispatch<React.SetStateAction<Car[]>>

  bookings: BookingRecord[]

  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>

  onExitAdmin: () => void

  onLogoutAdmin?: () => void

  targetBookingId?: string
}

export default function AdminView({
  cars,

  setCars,

  bookings,

  setBookings,

  onExitAdmin,

  onLogoutAdmin,

  targetBookingId,
}: AdminViewProps) {
  // Navigation tabs (includes dedicated Settings tab)

  const [activeTab, setActiveTab] =
    useState<"manifest" | "completed" | "fleet" | "walkin" | "promos" | "crm" | "maintenance" | "settings">(
      "manifest",
    )

  // Completed Trips & Invoice Archive State
  const [completedSearchQuery, setCompletedSearchQuery] = useState("")
  const [completedDateFilter, setCompletedDateFilter] =
    useState<"all" | "7d" | "30d" | "month">("all")
  const [completedCategoryFilter, setCompletedCategoryFilter] =
    useState<string>("all")
  const [completedViewMode, setCompletedViewMode] = useState<"cards" | "table">(
    "cards",
  )
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] =
    useState<BookingRecord | null>(null)

  // Sidebar responsive & dynamic collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [globalAdminSearch, setGlobalAdminSearch] = useState("")

  // Studio Director Contact & Dispatch Settings State
  const [studioContact, setStudioContact] = useState<{
    contact_phone: string
    contact_email: string
    admin_name: string
    hub_address: string
    google_maps_url: string
    support_phone: string
    hub_lat?: number
    hub_lng?: number
  }>({
    contact_phone: "+91 99887 76655",
    contact_email: "concierge@motorly.com",
    admin_name: "Studio Director",
    hub_address: "3rd Street, Masjid Banda, Hyderabad, Telangana, 500084",
    google_maps_url: "",
    support_phone: "+91 99887 76655",
    hub_lat: 25.7959,
    hub_lng: -80.287,
  })

  const [isSyncingHub, setIsSyncingHub] = useState(false)
  const [syncHubFeedback, setSyncHubFeedback] = useState<string | null>(null)
  const [isLocatingHub, setIsLocatingHub] = useState(false)
  const [hubGpsSuccess, setHubGpsSuccess] = useState<string | null>(null)

  // Completed Bookings Filtering
  const filteredCompletedBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status === "Completed")
      .filter((b) => {
        if (!completedSearchQuery.trim()) return true
        const q = completedSearchQuery.toLowerCase()
        const car = cars.find((c) => c.id === b.matchedCarId)
        const customerName =
          (b.customer as any).name ||
          `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim()
        const customerLicense =
          b.driver?.licenseNumber || (b.customer as any).licenseNumber || ""
        return (
          b.id.toLowerCase().includes(q) ||
          customerName.toLowerCase().includes(q) ||
          (b.customer.phone && b.customer.phone.includes(q)) ||
          (b.customer.email && b.customer.email.toLowerCase().includes(q)) ||
          customerLicense.toLowerCase().includes(q) ||
          (car &&
            (car.brand.toLowerCase().includes(q) ||
              car.model.toLowerCase().includes(q) ||
              car.name.toLowerCase().includes(q) ||
              (car.plateNumber && car.plateNumber.toLowerCase().includes(q))))
        )
      })
      .filter((b) => {
        if (completedCategoryFilter === "all") return true
        const car = cars.find((c) => c.id === b.matchedCarId)
        const cat = car?.type || b.requestedCategory
        return cat === completedCategoryFilter
      })
      .filter((b) => {
        if (completedDateFilter === "all") return true
        const bDate = new Date(b.createdAt || Date.now()).getTime()
        const now = Date.now()
        if (completedDateFilter === "7d") {
          return now - bDate <= 7 * 24 * 60 * 60 * 1000
        }
        if (completedDateFilter === "30d") {
          return now - bDate <= 30 * 24 * 60 * 60 * 1000
        }
        if (completedDateFilter === "month") {
          const bMonth = new Date(bDate).getMonth()
          const currentMonth = new Date(now).getMonth()
          return bMonth === currentMonth
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
  }, [
    bookings,
    cars,
    completedSearchQuery,
    completedCategoryFilter,
    completedDateFilter,
  ])

  const completedStats = useMemo(() => {
    const allCompleted = bookings.filter((b) => b.status === "Completed")
    const totalCount = allCompleted.length
    const totalRevenue = allCompleted.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0,
    )
    const withExtensions = allCompleted.filter(
      (b) => b.extensionStatus === "Approved",
    ).length
    return {
      totalCount,
      totalRevenue,
      withExtensions,
      passRate: "100%",
    }
  }, [bookings])

  const handleExportCompletedCsv = () => {
    const completedList = bookings.filter((b) => b.status === "Completed")
    if (completedList.length === 0) {
      alert("No completed trips available to export.")
      return
    }

    const headers = [
      "Invoice / Order ID",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Driver License",
      "Vehicle",
      "Plate Number",
      "Pickup Date",
      "Return Date",
      "Extension Status",
      "Total Settled Amount (€)",
      "Status",
      "Created Date",
    ]

    const rows = completedList.map((b) => {
      const car = cars.find((c) => c.id === b.matchedCarId)
      const customerName =
        (b.customer as any).name ||
        `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim() ||
        "Verified Client"
      const customerLicense =
        b.driver?.licenseNumber ||
        (b.customer as any).licenseNumber ||
        "Verified"
      return [
        `INV-${b.id}`,
        `"${customerName.replace(/"/g, '""')}"`,
        `"${(b.customer.phone || "").replace(/"/g, '""')}"`,
        `"${(b.customer.email || "").replace(/"/g, '""')}"`,
        `"${customerLicense.replace(/"/g, '""')}"`,
        `"${
          car ? `${car.brand} ${car.model}` : b.requestedCategory || "Fleet"
        }"`,
        `"${car?.plateNumber || "FL-908-MTR"}"`,
        `"${b.pickupDate}"`,
        `"${b.returnDate}"`,
        `"${b.extensionStatus || "None"}"`,
        (Number(b.totalAmount) || 0).toFixed(2),
        b.status,
        `"${b.createdAt}"`,
      ]
    })

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `MOTORLY_Completed_Trips_Invoices_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSyncHubToFleet = async () => {
    if (!studioContact.hub_address) {
      alert("Please enter a valid hub address first.")
      return
    }

    setIsSyncingHub(true)
    setSyncHubFeedback(null)

    try {
      const res = await api.syncHubLocation(
        studioContact.hub_address,
        studioContact.google_maps_url,
        studioContact.hub_lat,
        studioContact.hub_lng,
      )

      if (res.success) {
        const freshCars = await api.getCars().catch(() => null)
        if (freshCars) {
          setCars(freshCars)
        } else {
          setCars((prev) =>
            prev.map((c) => ({
              ...c,
              garageName: studioContact.hub_address,
              garageAddress: studioContact.hub_address,
              garageLat: studioContact.hub_lat ?? c.garageLat,
              garageLng: studioContact.hub_lng ?? c.garageLng,
            })),
          )
        }

        const coordsText =
          studioContact.hub_lat && studioContact.hub_lng
            ? ` (${studioContact.hub_lat.toFixed(4)}, ${studioContact.hub_lng.toFixed(4)})`
            : ""
        setSyncHubFeedback(`Synced to ${cars.length} vehicles!`)
        notify(
          `Hub location and GPS coordinates${coordsText} applied to all ${cars.length} fleet vehicles in database!`,
        )
        setTimeout(() => setSyncHubFeedback(null), 4000)
      } else {
        alert("Failed to sync hub: " + res.message)
      }
    } catch (err: any) {
      alert("Sync failed: " + err.message)
    } finally {
      setIsSyncingHub(false)
    }
  }

  const [isSavingStudioContact, setIsSavingStudioContact] = useState(false)
  const [contactSaveFeedback, setContactSaveFeedback] = useState<string | null>(
    null,
  )

  // Browser GPS Geolocation + Reverse Geocode for Admin Garage Hub
  const handleLocateAdminHub = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocatingHub(true)
    setHubGpsSuccess(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        const directMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

        let resolvedAddress =
          studioContact.hub_address || `Garage Hub (${lat}, ${lng})`

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          )
          const data = await res.json()
          if (data && data.display_name) {
            const addr = data.address || {}
            const road =
              addr.road || addr.street || addr.pedestrian || addr.building || ""
            const suburb =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.quarter ||
              ""
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.county ||
              addr.state_district ||
              ""
            const state = addr.state || ""
            const postcode = addr.postcode || ""

            const cleanParts = [road, suburb, city, state, postcode].filter(
              Boolean,
            )
            if (cleanParts.length >= 2) {
              resolvedAddress = cleanParts.join(", ")
            } else {
              resolvedAddress = data.display_name
            }
          }
        } catch (e) {
          console.warn("Reverse geocode fetch failed, using coordinates:", e)
        }

        setStudioContact((prev) => ({
          ...prev,
          hub_address: resolvedAddress,
          hub_lat: lat,
          hub_lng: lng,
          google_maps_url: directMapsUrl,
        }))

        setHubGpsSuccess(
          `GPS Acquired: ${lat.toFixed(5)}, ${lng.toFixed(5)} • ${resolvedAddress}`,
        )
        setIsLocatingHub(false)
        setTimeout(() => setHubGpsSuccess(null), 6000)
      },
      (err) => {
        setIsLocatingHub(false)
        alert(
          `Location detection failed (${err.message}). Please ensure location permissions are enabled in your browser.`,
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  // Load Studio Settings from Supabase on mount
  useEffect(() => {
    api
      .getSettings()
      .then((res: any) => {
        if (res) {
          if (typeof res.reviews_enabled === "boolean") {
            setReviewsEnabled(res.reviews_enabled)
          }

          setStudioContact((prev) => ({
            ...prev,
            contact_phone: res.contact_phone || prev.contact_phone,
            contact_email: res.contact_email || prev.contact_email,
            admin_name: res.admin_name || prev.admin_name,
            hub_address: res.hub_address || prev.hub_address,
            google_maps_url: res.google_maps_url || prev.google_maps_url,
            support_phone: res.support_phone || prev.support_phone,
            hub_lat:
              res.hub_lat !== undefined && !isNaN(Number(res.hub_lat))
                ? Number(res.hub_lat)
                : prev.hub_lat,
            hub_lng:
              res.hub_lng !== undefined && !isNaN(Number(res.hub_lng))
                ? Number(res.hub_lng)
                : prev.hub_lng,
          }))
        }
      })
      .catch(() => {})
  }, [])

  // Save Studio Settings to Supabase database
  const handleSaveStudioContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSavingStudioContact(true)
    setContactSaveFeedback(null)

    try {
      const ok = await api.updateSettingsBatch({
        contact_phone: studioContact.contact_phone,
        contact_email: studioContact.contact_email,
        admin_name: studioContact.admin_name,
        hub_address: studioContact.hub_address,
        google_maps_url: studioContact.google_maps_url,
        support_phone: studioContact.support_phone,
        hub_lat: studioContact.hub_lat,
        hub_lng: studioContact.hub_lng,
      })

      if (ok) {
        setContactSaveFeedback(
          "Studio contact details and hub coordinates saved to Supabase.",
        )
        notify(
          "Studio contact details and hub coordinates saved to Supabase database.",
        )
        setTimeout(() => setContactSaveFeedback(null), 4000)
      } else {
        notify("Failed to save settings to database.")
      }
    } catch {
      notify("Network error saving settings.")
    } finally {
      setIsSavingStudioContact(false)
    }
  }

  // Notification Banner

  const [notification, setNotification] = useState<string | null>(null)

  const [isSyncing, setIsSyncing] = useState(false)

  const notify = (msg: string) => {
    setNotification(msg)

    setTimeout(() => setNotification(null), 4500)
  }

  // --- Slide-out Inspection Drawer State ---

  const [inspectedBooking, setInspectedBooking] =
    useState<BookingRecord | null>(null)

  // Auto-open requested booking from URL or direct action link

  useEffect(() => {
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null

    const urlBId = urlParams ? urlParams.get("bookingId") : null

    const activeBId = targetBookingId || urlBId

    if (activeBId && bookings.length > 0) {
      const found = bookings.find(
        (b) =>
          b.id.toLowerCase() === activeBId.toLowerCase() ||
          (b as any).bookingId?.toLowerCase() === activeBId.toLowerCase(),
      )

      if (found) {
        setActiveTab("manifest")

        setInspectedBooking(found)
      }
    }
  }, [targetBookingId, bookings])

  // --- Promos State ---

  const [promos, setPromos] = useState<PromoCode[]>([])

  const promoStats = useMemo(() => {
    const activeList = promos.filter((p) => p.isActive)
    const inactiveList = promos.filter((p) => !p.isActive)
    const totalRedemptions = promos.reduce(
      (sum, p) => sum + (p.usageCount || 0),
      0,
    )
    const sorted = [...promos].sort(
      (a, b) => (b.usageCount || 0) - (a.usageCount || 0),
    )
    const topVoucher = sorted[0] || null
    return {
      activeCount: activeList.length,
      inactiveCount: inactiveList.length,
      totalRedemptions,
      topVoucher,
    }
  }, [promos])

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false)

  const [newPromoData, setNewPromoData] = useState({
    code: "",

    discountPercent: 15,

    description: "",

    expiryDate: "2026-12-31",
  })

  // --- CRM Customers State ---

  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([])

  const [customerSearch, setCustomerSearch] = useState("")

  const [inspectedLicense, setInspectedLicense] = useState<{
    id?: string

    name: string

    licenseNum: string

    state: string

    expiry: string

    file?: string
  } | null>(null)

  // --- Reviews & Global System Settings State ---

  const [reviewsEnabled, setReviewsEnabled] = useState(true)

  const [isUpdatingReviewsSetting, setIsUpdatingReviewsSetting] =
    useState(false)

  // --- Notifications Popover & Admin Profile State ---

  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false)

  // --- Maintenance State ---

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])

  const [mntPagination, setMntPagination] = useState<MaintenancePagination>({
    page: 1,

    limit: 10,

    total: 0,

    totalPages: 1,

    hasNextPage: false,

    hasPrevPage: false,
  })

  const [mntSearch, setMntSearch] = useState("")

  const [mntStatusFilter, setMntStatusFilter] = useState("")

  const [mntLoading, setMntLoading] = useState(false)

  const fetchMaintenancePage = async (
    page: number,

    limit?: number,

    search?: string,

    status?: string,
  ) => {
    setMntLoading(true)

    try {
      const targetLimit = limit ?? mntPagination.limit

      const targetSearch = search !== undefined ? search : mntSearch

      const targetStatus = status !== undefined ? status : mntStatusFilter

      const res = await api.getMaintenanceLogs({
        page,

        limit: targetLimit,

        search: targetSearch || undefined,

        status: targetStatus || undefined,
      })

      const list = Array.isArray(res) ? res : res.data || []

      setMaintenanceLogs(list)

      if (res.pagination) {
        setMntPagination(res.pagination)
      }
    } catch (err: any) {
      console.warn("Failed to load maintenance page:", err?.message)
    } finally {
      setMntLoading(false)
    }
  }

  const [isMntModalOpen, setIsMntModalOpen] = useState(false)

  const [newMntData, setNewMntData] = useState({
    carId: cars[0]?.id || "",

    serviceType: "Synthetic Oil Change & Inspection",

    cost: 95,

    odometer: 15200,

    date: new Date().toISOString().split("T")[0],

    status: "Completed" as "Scheduled" | "In Progress" | "Completed",

    technicianNotes:
      "Routine maintenance completed to manufacturer specification.",

    setVehicleStatus: "",
  })

  // --- Walk-in Counter Dispatch State & Form Helpers ---

  const getWalkinPickupDefault = () => {
    const d = new Date()

    return (
      d.toLocaleDateString("en-US", {
        month: "short",

        day: "numeric",

        year: "numeric",
      }) + " 10:00 AM"
    )
  }

  const getWalkinReturnDefault = (days = 3) => {
    const d = new Date(Date.now() + days * 86400000)

    return (
      d.toLocaleDateString("en-US", {
        month: "short",

        day: "numeric",

        year: "numeric",
      }) + " 06:00 PM"
    )
  }

  const [walkinForm, setWalkinForm] = useState({
    firstName: "",

    lastName: "",

    email: "",

    phone: "",

    licenseNumber: "",

    licenseState: "Florida",

    licensePhotoFront: "",

    licensePhotoBack: "",

    licenseFileName: "",

    carId: cars.find((c) => c.status === "Available")?.id || cars[0]?.id || "",

    pickupDate: getWalkinPickupDefault(),

    returnDate: getWalkinReturnDefault(3),

    totalDays: 3,

    immediateCheckout: true,

    notes: "Counter express walk-in reservation.",
  })

  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false)

  // --- Flow E: Key Handover Checklist Modal State ---

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [isSubmittingKeyHandoff, setIsSubmittingKeyHandoff] = useState(false)

  const [keyModalBooking, setKeyModalBooking] = useState<BookingRecord | null>(
    null,
  )

  const [keyChecklist, setKeyChecklist] = useState<InspectionChecklistOut>({
    odometerOut: 15200,

    fuelLevelOut: "Full (100%)",

    cleanlinessVerified: true,

    tiresExteriorVerified: true,

    inspectorStaff: "Admin Operations Lead",

    timestamp: "",
  })

  // --- Flow F: Extension Quotation Modal State ---

  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)

  const [extensionBooking, setExtensionBooking] =
    useState<BookingRecord | null>(null)

  const [extensionQuoteData, setExtensionQuoteData] = useState<{
    rateType: "hour" | "day" | "month"

    rateAmount: number

    totalQuotedAmount: number

    notes: string
  }>({
    rateType: "day",

    rateAmount: 65,

    totalQuotedAmount: 130,

    notes: "Includes full comprehensive coverage and roadside assistance.",
  })

  // --- Flow G: Return Vehicle Inspection Modal State ---

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  const [returnModalBooking, setReturnModalBooking] =
    useState<BookingRecord | null>(null)

  const [returnChecklist, setReturnChecklist] = useState<InspectionChecklistIn>(
    {
      odometerIn: 15450,
      fuelLevelIn: "Full (100%)",
      cleanlinessPassed: true,
      damageFound: false,
      damageNotes: "",
      damageSeverity: "Minor Scratch / Scuff",
      damageLocation: "Front Right Bumper",
      damagePhotos: [],
      damageFee: 0,
      inspectionPassed: true,
      inspectorStaff: "Admin Operations Lead",
      timestamp: "",
    },
  )

  // --- Fleet Search & Modals ---

  const [fleetSearch, setFleetSearch] = useState("")

  const [fleetStatusFilter, setFleetStatusFilter] = useState("all")

  const [fleetViewMode, setFleetViewMode] = useState<"table" | "grid">("table")

  const [isCarModalOpen, setIsCarModalOpen] = useState(false)

  const [carModalTab, setCarModalTab] =
    useState<"identity" | "rates" | "insurance" | "garage">("identity")

  const [zoomedPhoto, setZoomedPhoto] = useState<{
    url: string

    title: string
  } | null>(null)

  const [editingCar, setEditingCar] = useState<Car | null>(null)

  const [deletingCar, setDeletingCar] = useState<Car | null>(null)

  const [isDeletingCar, setIsDeletingCar] = useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("")

  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0)

  const compressVehiclePhoto = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()

        img.onload = () => {
          let width = img.width

          let height = img.height

          const maxDim = 1200

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)

              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)

              height = maxDim
            }
          }

          const canvas = document.createElement("canvas")

          canvas.width = width

          canvas.height = height

          const ctx = canvas.getContext("2d")

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)

            resolve(canvas.toDataURL("image/jpeg", 0.8))
          } else {
            resolve(e.target?.result as string || "")
          }
        }

        img.onerror = () => resolve(e.target?.result as string || "")

        img.src = e.target?.result as string || ""
      }

      reader.onerror = () => resolve("")

      reader.readAsDataURL(file)
    })
  }

  // Multi-Photo Upload Handler supporting multiple files at once

  const handleDevicePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    setIsUploadingPhotos(true)

    try {
      const compressedList = await Promise.all(
        files.map((file) => compressVehiclePhoto(file)),
      )

      const validNewPhotos = compressedList.filter(Boolean)

      if (validNewPhotos.length > 0) {
        setCarFormData((prev) => {
          const existingGallery =
            prev.gallery && prev.gallery.length > 0
              ? prev.gallery
              : prev.image
                ? [prev.image]
                : []

          const updatedGallery = [...existingGallery, ...validNewPhotos]

          return {
            ...prev,

            gallery: updatedGallery,

            image: prev.image || updatedGallery[0],
          }
        })

        notify(
          `Added ${validNewPhotos.length} vehicle photo(s) to gallery successfully!`,
        )
      }
    } catch {
      notify("Failed to process photo(s).")
    } finally {
      setIsUploadingPhotos(false)

      if (e.target) e.target.value = ""
    }
  }

  // Add individual photo by URL link

  const handleAddPhotoUrl = () => {
    const trimmed = newPhotoUrlInput.trim()

    if (!trimmed) return

    setCarFormData((prev) => {
      const existingGallery =
        prev.gallery && prev.gallery.length > 0
          ? prev.gallery
          : prev.image
            ? [prev.image]
            : []

      const updatedGallery = [...existingGallery, trimmed]

      return {
        ...prev,

        gallery: updatedGallery,

        image: prev.image || updatedGallery[0],
      }
    })

    setNewPhotoUrlInput("")

    notify("Photo URL added to gallery.")
  }

  // Set selected photo as the Primary Cover photo (index 0)

  const handleSetCoverPhoto = (index: number) => {
    setCarFormData((prev) => {
      const currentGallery =
        prev.gallery && prev.gallery.length > 0
          ? [...prev.gallery]
          : prev.image
            ? [prev.image]
            : []

      if (index < 0 || index >= currentGallery.length) return prev

      const selected = currentGallery[index]

      currentGallery.splice(index, 1)

      currentGallery.unshift(selected)

      return {
        ...prev,

        gallery: currentGallery,

        image: selected,
      }
    })

    setPreviewPhotoIndex(0)

    notify("Primary cover photo updated.")
  }

  // Remove a photo from gallery

  const handleRemoveGalleryPhoto = (index: number) => {
    setCarFormData((prev) => {
      const currentGallery =
        prev.gallery && prev.gallery.length > 0
          ? [...prev.gallery]
          : prev.image
            ? [prev.image]
            : []

      const updatedGallery = currentGallery.filter((_, i) => i !== index)

      const nextCover = updatedGallery[0] || ""

      return {
        ...prev,

        gallery: updatedGallery,

        image: nextCover,
      }
    })

    setPreviewPhotoIndex(0)
  }

  // Reorder gallery photos left or right

  const handleMoveGalleryPhoto = (
    index: number,
    direction: "left" | "right",
  ) => {
    setCarFormData((prev) => {
      const currentGallery =
        prev.gallery && prev.gallery.length > 0
          ? [...prev.gallery]
          : prev.image
            ? [prev.image]
            : []

      const targetIndex = direction === "left" ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= currentGallery.length) return prev

      const temp = currentGallery[index]

      currentGallery[index] = currentGallery[targetIndex]

      currentGallery[targetIndex] = temp

      return {
        ...prev,

        gallery: currentGallery,

        image: currentGallery[0] || "",
      }
    })
  }

  // 1-Click Preset Multi-Angle Photo addition

  const handleAddPresetPhoto = (url: string) => {
    setCarFormData((prev) => {
      const existingGallery =
        prev.gallery && prev.gallery.length > 0
          ? prev.gallery
          : prev.image
            ? [prev.image]
            : []

      if (existingGallery.includes(url)) {
        notify("Photo is already in gallery.")

        return prev
      }

      const updatedGallery = [...existingGallery, url]

      return {
        ...prev,

        gallery: updatedGallery,

        image: prev.image || updatedGallery[0],
      }
    })

    notify("Sample photo added to gallery.")
  }

  const [carFormData, setCarFormData] = useState<Partial<Car>>({
    name: "Toyota Camry SE",

    brand: "Toyota",

    model: "Camry SE",

    year: 2024,

    type: "Sedan",

    pricePerDay: 55,

    pricePerHour: 8,

    pricePerMonth: 1210,

    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",

    gallery: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",

      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",

      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    ],

    seats: 5,

    transmission: "Automatic",

    fuelType: "Petrol",

    mileage: "45 Liters",

    luggage: "3 Bags",

    plateNumber: "TS-09-MTR-8820",

    location: "Operating Fleet Hub",

    status: "Available",

    description:
      "Pristine fleet rental vehicle with full telemetry.",

    features: ["Bluetooth", "Backup Camera", "Apple CarPlay"],

    insurancePolicy: "",

    insuranceProvider: "",

    insuranceExpiry: "",

    purchaseDate: "2024-01-15",

    purchaseCost: 32500,

    currentOdometer: 14200,

    garageName: "Operating Fleet Hub",

    garageAddress: "Operating Fleet Hub",

    garageLat: 17.4646,

    garageLng: 78.3582,

    garageBay: "Bay 1",
  })

  // Insurance optional details toggle for car modal
  const [addInsuranceDetails, setAddInsuranceDetails] = useState<boolean>(false)

  // Dynamic hub address resolver: replaces placeholders with admin's saved operating hub
  const getCleanHubAddress = (rawLocation?: string) => {
    const adminHub = studioContact?.hub_address?.trim()
    if (!rawLocation) return adminHub || "Operating Fleet Hub"
    const lower = rawLocation.toLowerCase()
    const isPlaceholder =
      lower.includes("miami") ||
      lower.includes("main garage") ||
      lower.includes("european atelier") ||
      lower.includes("atelier hub") ||
      lower.includes("central hub") ||
      lower.includes("central operations") ||
      lower.includes("bay 4") ||
      lower.includes("operating fleet hub")
    if (isPlaceholder) return adminHub || "Operating Fleet Hub"
    return rawLocation.replace(/\s*\([A-Z]{3,4}\)/, "").trim()
  }

  // Guard against duplicate vehicle creations / rapid double clicks
  const [isSavingCar, setIsSavingCar] = useState<boolean>(false)

  // Refreshing fleet manifest state
  const [isRefreshingFleet, setIsRefreshingFleet] = useState<boolean>(false)

  // --- Manifest Filters & View Mode ---

  const [manifestStatusFilter, setManifestStatusFilter] =
    useState<string>("all")

  const [manifestSearch, setManifestSearch] = useState("")

  const [manifestViewMode, setManifestViewMode] = useState<"cards" | "table">(
    "cards",
  )

  // Fetch initial secondary dataset (promos, maintenance, crm)

  const loadAuxiliaryData = async () => {
    try {
      const [remotePromos, remoteMnt, remoteCustomers] = await Promise.all([
        api.getPromos().catch(() => []),

        api

          .getMaintenanceLogs({ page: 1, limit: mntPagination.limit })

          .catch(() => ({
            data: [],

            pagination: {
              page: 1,

              limit: 10,

              total: 0,

              totalPages: 1,

              hasNextPage: false,

              hasPrevPage: false,
            },
          })),

        api.getAdminCustomers().catch(() => []),
      ])

      setPromos(remotePromos)

      const mntList = Array.isArray(remoteMnt)
        ? remoteMnt
        : remoteMnt?.data || []

      setMaintenanceLogs(mntList)

      if (remoteMnt?.pagination) {
        setMntPagination(remoteMnt.pagination)
      }

      setCustomers(remoteCustomers)

      api

        .getSettings()

        .then((s) => {
          if (typeof s?.reviews_enabled === "boolean") {
            setReviewsEnabled(s.reviews_enabled)
          }
        })

        .catch(() => {})
    } catch (e) {
      console.warn("Auxiliary data load:", e)
    }
  }

  const handleToggleReviews = async () => {
    setIsUpdatingReviewsSetting(true)

    const next = !reviewsEnabled

    try {
      await api.updateSetting("reviews_enabled", next)

      setReviewsEnabled(next)

      notify(
        next
          ? "Customer vehicle ratings & reviews ENABLED globally."
          : "Customer vehicle ratings & reviews DISABLED globally.",
      )
    } catch (err: any) {
      alert("Failed to update setting: " + err.message)
    } finally {
      setIsUpdatingReviewsSetting(false)
    }
  }

  useEffect(() => {
    loadAuxiliaryData()

    handleRefreshData()
    ;(window as any).__setAdminCarModalOpen = setIsCarModalOpen
    ;(window as any).__refreshAdminData = handleRefreshData

    return () => {
      delete (window as any).__setAdminCarModalOpen

      delete (window as any).__refreshAdminData
    }
  }, [])

  // Keyboard navigation: Escape key closes active drawers and modals

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomedPhoto) setZoomedPhoto(null)
        else if (deletingCar) setDeletingCar(null)
        else if (isNotificationOpen) setIsNotificationOpen(false)
        else if (isAdminProfileOpen) setIsAdminProfileOpen(false)
        else if (inspectedLicense) setInspectedLicense(null)
        else if (inspectedBooking) setInspectedBooking(null)
        else if (isCarModalOpen) setIsCarModalOpen(false)
        else if (isKeyModalOpen) setIsKeyModalOpen(false)
        else if (isReturnModalOpen) setIsReturnModalOpen(false)
        else if (isExtensionModalOpen) setIsExtensionModalOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    zoomedPhoto,

    deletingCar,

    isNotificationOpen,

    isAdminProfileOpen,

    inspectedLicense,

    inspectedBooking,

    isCarModalOpen,

    isKeyModalOpen,

    isReturnModalOpen,

    isExtensionModalOpen,
  ])

  // Date, Time & Duration formatting helpers for high-contrast presentation

  const formatFullDateTime = (dateStr?: string): string => {
    if (!dateStr) return "N/A"

    try {
      const d = new Date(dateStr)

      if (!isNaN(d.getTime())) {
        return (
          d.toLocaleDateString("en-US", {
            month: "short",

            day: "numeric",

            year: "numeric",
          }) +
          " at " +
          d.toLocaleTimeString("en-US", {
            hour: "numeric",

            minute: "2-digit",

            hour12: true,
          })
        )
      }
    } catch {}

    return dateStr
  }

  const formatReadableTime = (
    timeOrDateStr?: string,

    fallback = "10:00 AM",
  ): string => {
    if (!timeOrDateStr) return fallback

    if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(timeOrDateStr)) {
      return timeOrDateStr.toUpperCase()
    }

    try {
      const d = new Date(timeOrDateStr)

      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-US", {
          hour: "numeric",

          minute: "2-digit",

          hour12: true,
        })
      }
    } catch {}

    return fallback
  }

  const getBookingDurationInfo = (pickupDate?: string, returnDate?: string): {
    days: number

    hours: number

    label: string
  } => {
    if (!pickupDate || !returnDate) {
      return { days: 1, hours: 24, label: "1 Day (24 Hours)" }
    }

    try {
      const p = new Date(pickupDate)

      const r = new Date(returnDate)

      if (!isNaN(p.getTime()) && !isNaN(r.getTime())) {
        const isSame =
          p.getFullYear() === r.getFullYear() &&
          p.getMonth() === r.getMonth() &&
          p.getDate() === r.getDate()

        if (isSame) {
          const diffMs = Math.max(0, r.getTime() - p.getTime())

          const exactHours = Math.round(diffMs / (1000 * 60 * 60))

          const displayHours = exactHours > 0 ? exactHours : 8

          return {
            days: 1,

            hours: displayHours,

            label: `Same-Day (${displayHours} Hours)`,
          }
        }

        const diffMs = r.getTime() - p.getTime()

        const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))

        const hours = days * 24

        return {
          days,

          hours,

          label: `${days} ${days === 1 ? "Day" : "Days"} (${hours} Hours)`,
        }
      }
    } catch {}

    return { days: 3, hours: 72, label: "3 Days (72 Hours)" }
  }

  const getElapsedClock = (
    startTimeStr?: string,

    endTimeStr?: string,
  ): string => {
    if (!startTimeStr) return "Not Started"

    try {
      const start = new Date(startTimeStr).getTime()

      const end = endTimeStr ? new Date(endTimeStr).getTime() : Date.now()

      if (!isNaN(start) && !isNaN(end)) {
        const diffMs = Math.max(0, end - start)

        const totalMinutes = Math.floor(diffMs / (1000 * 60))

        const hours = Math.floor(totalMinutes / 60)

        const minutes = totalMinutes % 60

        const days = Math.floor(hours / 24)

        if (days > 0) {
          return `${days}d ${hours % 24}h ${minutes}m active`
        }

        return `${hours}h ${minutes}m active`
      }
    } catch {}

    return "Active"
  }

  // Sync entire dashboard from backend SQLite

  const handleRefreshData = async () => {
    setIsSyncing(true)

    try {
      const [freshCars, freshBookings] = await Promise.all([
        api.getCars(),

        api.getBookings(),
      ])

      setCars(freshCars)

      setBookings(freshBookings)

      await loadAuxiliaryData()

      notify("Fleet, manifest, and CRM synchronized with SQLite backend.")
    } catch {
      notify("Synchronization complete.")
    } finally {
      setIsSyncing(false)
    }
  }

  // Executive Fleet KPI calculations

  const stats = useMemo(() => {
    const total = cars.length

    const available = cars.filter(
      (c) => c.status === "Available" || !c.status,
    ).length

    const rented = cars.filter((c) => c.status === "Rented").length

    const maintenance = cars.filter((c) => c.status === "Maintenance").length

    const cleaning = cars.filter((c) => c.status === "Cleaning").length

    const utilization = total > 0 ? Math.round((rented / total) * 100) : 0

    const activeRevenue = cars

      .filter((c) => c.status === "Rented")

      .reduce((sum, c) => sum + c.pricePerDay, 0)

    const pendingMating = bookings.filter((b) => {
      if (
        b.status === "Cancelled" ||
        b.status === "Completed" ||
        b.status === "Checked Out" ||
        b.status === "Returned"
      ) {
        return false
      }
      if (b.status === "Assigned" && b.matchedCarId && b.approvedByAdmin) {
        return false
      }
      return !b.matchedCarId || b.status === "Pending Assignment" || !b.approvedByAdmin
    }).length

    const inDrive = bookings.filter((b) => b.status === "Checked Out").length

    const assigned = bookings.filter((b) => b.status === "Assigned").length

    return {
      total,

      available,

      rented,

      maintenance,

      cleaning,

      utilization,

      activeRevenue,

      pendingMating,

      inDrive,

      assigned,
    }
  }, [cars, bookings])

  // --- RESERVATION LIFECYCLE ACTIONS ---

  const handleMateCar = async (bookingId: string, carId: string) => {
    try {
      const res = await api.mateCar(bookingId, carId)

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        setCars((prev) => prev.map((c) => (c.id === carId ? res.car : c)))

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        notify(
          `Vehicle ${res.car.name} (${res.car.plateNumber}) mated to booking ${bookingId}.`,
        )
      }
    } catch (err: any) {
      alert("Mating failed: " + err.message)
    }
  }

  const handleUnmateCar = async (bookingId: string) => {
    try {
      const res = await api.unmateCar(bookingId)

      if (res.success) {
        const releasedCarId = bookings.find((b) => b.id === bookingId)
          ?.matchedCarId

        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        if (releasedCarId) {
          setCars((prev) =>
            prev.map((c) =>
              c.id === releasedCarId ? { ...c, status: "Available" } : c,
            ),
          )
        }

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        notify(`Vehicle released from booking ${bookingId}.`)
      }
    } catch (err: any) {
      alert("Unmating failed: " + err.message)
    }
  }

  const handleAutoMate = (booking: BookingRecord) => {
    // Find available vehicle matching requested category first, or any available

    const match =
      cars.find(
        (c) =>
          c.status === "Available" &&
          (!booking.requestedCategory || c.type === booking.requestedCategory),
      ) || cars.find((c) => c.status === "Available")

    if (match) {
      handleMateCar(booking.id, match.id)
    } else {
      alert(
        "No available vehicles currently in fleet to mate. Turn around a vehicle from cleaning or maintenance.",
      )
    }
  }

  const handleAdvanceStatus = async (
    bookingId: string,

    targetStatus: BookingStatus,
  ) => {
    try {
      const res = await api.updateBookingStatus(bookingId, {
        status: targetStatus,
      })

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        // Refresh cars to get updated car statuses (e.g. Cleaning / Available)

        const freshCars = await api.getCars()

        setCars(freshCars)

        notify(`Booking ${bookingId} transitioned to ${targetStatus}.`)
      }
    } catch (err: any) {
      alert("Status transition failed: " + err.message)
    }
  }

  // --- FLOW D: ADMIN APPROVAL ("ACCEPT REQUEST") ---

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await api.approveBooking(bookingId)

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        notify(
          `Request for ${bookingId} accepted by manager! Customer pickup clearance unlocked.`,
        )
      }
    } catch (err: any) {
      alert("Approval failed: " + err.message)
    }
  }

  const handleDeclineBooking = async (bookingId: string) => {
    if (!window.confirm(`Decline reservation request ${bookingId}?`)) return

    try {
      const res = await api.declineBooking(bookingId)

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        notify(`Request ${bookingId} has been declined.`)
      }
    } catch (err: any) {
      alert("Decline failed: " + err.message)
    }
  }

  // --- FLOW C: DOWNLOAD DRIVER LICENSE TICKET & ORIGINAL PHOTOS ---

  const handleDownloadLicense = (
    booking: BookingRecord,

    side: "front" | "back" | "certificate" = "front",
  ) => {
    const baseUrl = api.getLicenseDownloadUrl(booking.id, side)

    const url = baseUrl.includes("?")
      ? `${baseUrl}&download=1`
      : `${baseUrl}?download=1`

    window.open(url, "_blank")

    const label =
      side === "certificate"
        ? "Official SVG Certificate"
        : `${side.toUpperCase()} Driver License Photo`

    notify(
      `Downloading ${label} for ${booking.customer.firstName} ${booking.customer.lastName}.`,
    )
  }

  // --- FLOW E: KEY HANDOVER & RENTAL CLOCK START ---

  const handleOpenKeyHandoff = (b: BookingRecord) => {
    setKeyModalBooking(b)

    const matchedCar = cars.find((c) => c.id === b.matchedCarId)

    setKeyChecklist({
      odometerOut: matchedCar?.currentOdometer || 15200,
      odometerUnit: "mi",
      odometerPhoto: undefined,
      odometerNotes: "",
      fuelLevelOut: "Full (100%)",
      cleanlinessVerified: true,
      tiresExteriorVerified: true,
      inspectorStaff: "Admin Operations Lead",
      timestamp: new Date().toISOString(),
    })

    setIsKeyModalOpen(true)
  }

  const handleSubmitKeyHandoff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!keyModalBooking || isSubmittingKeyHandoff) return

    try {
      setIsSubmittingKeyHandoff(true)
      const res = await api.handoverKeys(keyModalBooking.id, {
        odometerOut: Number(keyChecklist.odometerOut),
        odometerUnit: keyChecklist.odometerUnit || "mi",
        odometerPhoto: keyChecklist.odometerPhoto,
        odometerNotes: keyChecklist.odometerNotes,
        fuelOut: keyChecklist.fuelLevelOut || "100%",
        exteriorClean: keyChecklist.cleanlinessVerified,
        tiresInspected: keyChecklist.tiresExteriorVerified,
        staffSign: keyChecklist.inspectorStaff,
      })

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === keyModalBooking.id ? res.booking : b)),
        )

        const freshCars = await api.getCars()

        setCars(freshCars)

        if (inspectedBooking?.id === keyModalBooking.id) {
          setInspectedBooking(res.booking)
        }

        setIsKeyModalOpen(false)

        notify(
          `Keys handed over for ${keyModalBooking.id}! Rental clock officially running.`,
        )
      }
    } catch (err: any) {
      alert("Key handover failed: " + err.message)
    } finally {
      setIsSubmittingKeyHandoff(false)
    }
  }

  // --- FLOW F: EXTENSION QUOTATION CONSOLE ---

  const handleOpenExtensionQuote = (b: BookingRecord) => {
    setExtensionBooking(b)

    const matchedCar = cars.find((c) => c.id === b.matchedCarId)

    const req = b.extensionRequest

    const durationVal = req?.durationValue || 1

    const unit = req?.durationUnit || "days"

    let rateType: "hour" | "day" | "month" = "day"

    let rateAmount = matchedCar?.pricePerDay || 65

    if (unit.startsWith("hour")) {
      rateType = "hour"

      rateAmount = matchedCar?.pricePerHour || 10
    } else if (unit.startsWith("month")) {
      rateType = "month"

      rateAmount =
        matchedCar?.pricePerMonth ||
        Math.round((matchedCar?.pricePerDay || 65) * 22)
    }

    const total = rateAmount * durationVal

    const existingQuote = b.extensionQuote
    if (existingQuote && b.extensionStatus === "Quoted") {
      setExtensionQuoteData({
        rateType: (existingQuote.rateType as any) || rateType,
        rateAmount: existingQuote.rateAmount ?? rateAmount,
        totalQuotedAmount: existingQuote.totalQuotedAmount ?? total,
        notes: existingQuote.notes || `Quotation for ${durationVal} ${unit} extension. Includes comprehensive fleet insurance.`,
      })
    } else {
      setExtensionQuoteData({
        rateType,
        rateAmount,
        totalQuotedAmount: total,
        notes: `Quotation for ${durationVal} ${unit} extension. Includes comprehensive fleet insurance.`,
      })
    }

    setIsExtensionModalOpen(true)
  }

  const handleSubmitExtensionQuote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!extensionBooking) return

    try {
      const res = await api.quoteExtension(extensionBooking.id, {
        rateType: extensionQuoteData.rateType,

        rateAmount: Number(extensionQuoteData.rateAmount),

        totalQuotedAmount: Number(extensionQuoteData.totalQuotedAmount),

        adminNotes: extensionQuoteData.notes,
      })

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === extensionBooking.id ? res.booking : b)),
        )

        if (inspectedBooking?.id === extensionBooking.id) {
          setInspectedBooking(res.booking)
        }

        setIsExtensionModalOpen(false)

        notify(
          `Extension quotation of €${extensionQuoteData.totalQuotedAmount} dispatched to customer.`,
        )
      }
    } catch (err: any) {
      alert("Quotation dispatch failed: " + err.message)
    }
  }

  const handleDeclineExtensionRequest = async (bookingId: string) => {
    if (!window.confirm("Decline this rental extension request?")) return

    try {
      const res = await api.declineExtension(bookingId)

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.booking : b)),
        )

        if (inspectedBooking?.id === bookingId) {
          setInspectedBooking(res.booking)
        }

        setIsExtensionModalOpen(false)

        notify("Extension request declined.")
      }
    } catch (err: any) {
      alert("Decline failed: " + err.message)
    }
  }

  // --- FLOW G: RETURN INSPECTION & RIDE COMPLETION ---

  const handleOpenReturnInspection = (b: BookingRecord) => {
    setReturnModalBooking(b)

    const matchedCar = cars.find((c) => c.id === b.matchedCarId)

    const currentOdo =
      b.checklistOut?.odometerOut || matchedCar?.currentOdometer || 15200

    setReturnChecklist({
      odometerIn: currentOdo + 120,
      fuelLevelIn: "Full (100%)",
      cleanlinessPassed: true,
      damageFound: false,
      damageNotes: "",
      damageSeverity: "Minor Scratch / Scuff",
      damageLocation: "Front Right Bumper",
      damagePhotos: [],
      damageFee: 0,
      inspectionPassed: true,
      inspectorStaff: "Admin Return Auditor",
      timestamp: new Date().toISOString(),
    })

    setIsReturnModalOpen(true)
  }

  const handleSubmitReturnInspection = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!returnModalBooking || isSubmittingReturn) return

    if (!returnChecklist.inspectionPassed) {
      alert(
        "Vehicle must be verified and marked as 'Inspection Passed' to close out the ride.",
      )

      return
    }

    try {
      setIsSubmittingReturn(true)
      const res = await api.returnInspection(returnModalBooking.id, {
        odometerIn: Number(returnChecklist.odometerIn),
        fuelIn: returnChecklist.fuelLevelIn || "100%",
        damageFound: returnChecklist.damageFound,
        cleanlinessPass: returnChecklist.cleanlinessPassed,
        inspectionPassed: returnChecklist.inspectionPassed,
        staffSign: returnChecklist.inspectorStaff,
        inspectionNotes: returnChecklist.damageNotes,
        damageNotes: returnChecklist.damageNotes,
        damageSeverity: returnChecklist.damageSeverity,
        damageLocation: returnChecklist.damageLocation,
        damagePhotos: returnChecklist.damagePhotos,
        damageFee: returnChecklist.damageFee,
      })

      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === returnModalBooking.id ? res.booking : b)),
        )

        const freshCars = await api.getCars()

        setCars(freshCars)

        if (inspectedBooking?.id === returnModalBooking.id) {
          setInspectedBooking(res.booking)
        }

        setIsReturnModalOpen(false)

        notify(
          `Return inspection certified! Booking ${returnModalBooking.id} completed and vehicle returned to fleet.`,
        )
      }
    } catch (err: any) {
      alert("Return inspection failed: " + err.message)
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  useEffect(() => {
    ;(window as any).__handleOpenExtensionQuote = (bookingId?: string) => {
      const target = bookingId
        ? bookings.find((b) => b.id === bookingId)
        : bookings.find(
            (b) =>
              b.extensionStatus === "Requested" ||
              b.extensionStatus === "Pending",
          ) ||
          bookings.find((b) => b.status === "Checked Out") ||
          bookings[0]

      if (target) handleOpenExtensionQuote(target)
    }
    ;(window as any).__handleOpenReturnInspection = (bookingId?: string) => {
      const target = bookingId
        ? bookings.find((b) => b.id === bookingId)
        : bookings.find((b) => b.status === "Checked Out") || bookings[0]

      if (target) handleOpenReturnInspection(target)
    }
    ;(window as any).__refreshAdminData = handleRefreshData

    return () => {
      delete (window as any).__handleOpenExtensionQuote

      delete (window as any).__handleOpenReturnInspection
    }
  }, [bookings, cars])

  // Live auto-polling to immediately detect customer extension requests & status transitions
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        api
          .getBookings()
          .then((fresh) => {
            if (Array.isArray(fresh) && fresh.length > 0) {
              setBookings(fresh)
            }
          })
          .catch(() => {})
      }
    }, 6000)

    const handleWindowFocus = () => {
      api
        .getBookings()
        .then((fresh) => {
          if (Array.isArray(fresh) && fresh.length > 0) {
            setBookings(fresh)
          }
        })
        .catch(() => {})
    }

    window.addEventListener("focus", handleWindowFocus)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [])

  // --- WALK-IN COUNTER DISPATCH ---

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walkinForm.carId) {
      alert("Please select a vehicle from the fleet.")

      return
    }

    setIsSubmittingWalkin(true)

    try {
      const selectedCar = cars.find((c) => c.id === walkinForm.carId)

      const totalAmount =
        (selectedCar ? selectedCar.pricePerDay : 65) * walkinForm.totalDays

      const res = await api.createCounterBooking({
        firstName: walkinForm.firstName || "Walk-In",

        lastName: walkinForm.lastName || "Guest",

        email: walkinForm.email || `walkin.${Date.now()}@motorly.com`,

        phone: walkinForm.phone || "+1 (555) 019-9922",

        licenseNumber: walkinForm.licenseNumber || "FL-WALKIN-882",

        licenseState: walkinForm.licenseState,

        licensePhotoFront: walkinForm.licensePhotoFront,

        licensePhotoBack: walkinForm.licensePhotoBack,

        licenseFileName: walkinForm.licenseFileName,

        carId: walkinForm.carId,

        pickupDate: walkinForm.pickupDate,

        returnDate: walkinForm.returnDate,

        totalAmount,

        immediateCheckout: walkinForm.immediateCheckout,

        notes: walkinForm.notes,
      })

      if (res.success) {
        setBookings((prev) => [res.booking, ...prev])

        const freshCars = await api.getCars()

        setCars(freshCars)

        notify(
          `Walk-in reservation ${res.booking.id} created! Keys dispatched.`,
        )

        // Reset form

        setWalkinForm({
          firstName: "",

          lastName: "",

          email: "",

          phone: "",

          licenseNumber: "",

          licenseState: "Florida",

          carId:
            cars.find((c) => c.status === "Available")?.id || cars[0]?.id || "",

          pickupDate: getWalkinPickupDefault(),

          returnDate: getWalkinReturnDefault(3),

          totalDays: 3,

          immediateCheckout: true,

          notes: "Counter express walk-in reservation.",
        })

        setActiveTab("manifest")
      }
    } catch (err: any) {
      alert("Counter dispatch failed: " + err.message)
    } finally {
      setIsSubmittingWalkin(false)
    }
  }

  // --- PROMO CODES ---

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const created = await api.createPromo(newPromoData)

      setPromos((prev) => [created, ...prev])

      setIsPromoModalOpen(false)

      setNewPromoData({
        code: "",

        discountPercent: 15,

        description: "",

        expiryDate: "2026-12-31",
      })

      notify(
        `Promo coupon ${created.code} (${created.discountPercent}%) created.`,
      )
    } catch (err: any) {
      alert("Failed to create promo: " + err.message)
    }
  }

  const handleTogglePromo = async (code: string) => {
    try {
      const updated = await api.togglePromo(code)

      setPromos((prev) => prev.map((p) => (p.code === code ? updated : p)))

      notify(
        `Promo code ${code} is now ${
          updated.isActive ? "ACTIVE" : "INACTIVE"
        }.`,
      )
    } catch (err: any) {
      alert("Failed to toggle promo: " + err.message)
    }
  }

  const handleDeletePromo = async (code: string) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return

    try {
      await api.deletePromo(code)

      setPromos((prev) => prev.filter((p) => p.code !== code))

      notify(`Promo code ${code} deleted.`)
    } catch (err: any) {
      alert("Failed to delete promo: " + err.message)
    }
  }

  // --- MAINTENANCE ---

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const created = await api.createMaintenanceLog(newMntData)

      await fetchMaintenancePage(1)

      setIsMntModalOpen(false)

      if (newMntData.setVehicleStatus) {
        const freshCars = await api.getCars()

        setCars(freshCars)
      }

      notify(`Service work order ${created.id} logged successfully.`)
    } catch (err: any) {
      alert("Failed to create maintenance log: " + err.message)
    }
  }

  // --- FLEET ADD / EDIT / DELETE ---

  const handleOpenAddCar = () => {
    setEditingCar(null)

    setPreviewPhotoIndex(0)

    setNewPhotoUrlInput("")

    const defaultCover =
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

    setCarFormData({
      name: "Toyota Camry SE",

      brand: "Toyota",

      model: "Camry SE",

      year: 2024,

      type: "Sedan",

      pricePerDay: 55,

      pricePerHour: 8,

      pricePerMonth: 1210,

      image: defaultCover,

      gallery: [
        defaultCover,

        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",

        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      ],

      seats: 5,

      transmission: "Automatic",

      fuelType: "Petrol",

      mileage: "45 Liters",

      luggage: "3 Bags",

      plateNumber: `TS-${Math.floor(10 + Math.random() * 90)}-MTR-${Math.floor(1000 + Math.random() * 9000)}`,

      location: studioContact.hub_address || "Operating Fleet Hub",

      status: "Available",

      description:
        "Pristine fleet rental vehicle with full telemetry.",

      features: ["Bluetooth", "Backup Camera", "Apple CarPlay"],

      insurancePolicy: "",

      insuranceProvider: "",

      insuranceExpiry: "",

      purchaseDate: new Date().toISOString().split("T")[0],

      purchaseCost: 32500,

      currentOdometer: 14200,

      garageName: studioContact.hub_address || "Operating Fleet Hub",

      garageAddress: studioContact.hub_address || "Operating Fleet Hub",

      garageLat: studioContact.hub_lat ?? 17.4646,

      garageLng: studioContact.hub_lng ?? 78.3582,

      garageBay: `Bay ${Math.floor(1 + Math.random() * 20)}-${["A", "B", "C"][Math.floor(Math.random() * 3)]}`,
    })

    setAddInsuranceDetails(false)
    setIsSavingCar(false)
    setIsCarModalOpen(true)
  }

  const handleOpenEditCar = (car: Car) => {
    setEditingCar(car)

    setPreviewPhotoIndex(0)

    setNewPhotoUrlInput("")

    const initialGallery =
      car.gallery && car.gallery.length > 0
        ? car.gallery
        : car.image
          ? [car.image]
          : []

    const hasInsurance = Boolean(
      car.insurancePolicy?.trim() || car.insuranceProvider?.trim(),
    )
    setAddInsuranceDetails(hasInsurance)
    setIsSavingCar(false)

    setCarFormData({
      ...car,

      image: car.image || initialGallery[0] || "",

      gallery: initialGallery,

      fuelType:
        ((car.fuelType === "Gasoline" ? "Petrol" : car.fuelType) as FuelType) ||
        "Petrol",

      mileage: car.mileage || "45 Liters",

      pricePerMonth:
        car.pricePerMonth || Math.round((car.pricePerDay || 55) * 22),

      insurancePolicy: car.insurancePolicy || "",

      insuranceProvider: car.insuranceProvider || "",

      insuranceExpiry: car.insuranceExpiry || "",

      purchaseDate: car.purchaseDate || "2024-01-15",

      purchaseCost: car.purchaseCost || 32500,

      currentOdometer: car.currentOdometer || 14200,

      garageName:
        car.garageName || studioContact.hub_address || "Operating Fleet Hub",

      garageAddress:
        car.garageAddress || studioContact.hub_address || "Operating Fleet Hub",

      location:
        car.location || studioContact.hub_address || "Operating Fleet Hub",

      garageLat: car.garageLat ?? studioContact.hub_lat ?? 17.4646,

      garageLng: car.garageLng ?? studioContact.hub_lng ?? 78.3582,

      garageBay: car.garageBay || "Bay 1",
    })

    setIsCarModalOpen(true)
  }

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSavingCar) return

    if (!editingCar && carModalTab !== "garage") {
      if (carModalTab === "identity") {
        if (!carFormData.brand || !carFormData.model) {
          alert("Please fill in Vehicle Brand and Model before proceeding.")
          return
        }
        setCarModalTab("rates")
      } else if (carModalTab === "rates") {
        if (!carFormData.pricePerDay || Number(carFormData.pricePerDay) <= 0) {
          alert("Please enter a valid daily rental rate (€/day).")
          return
        }
        setCarModalTab("insurance")
      } else if (carModalTab === "insurance") {
        setCarModalTab("garage")
      }
      return
    }

    setIsSavingCar(true)

    try {
      const rawGallery = (carFormData.gallery || []).filter(Boolean)

      const primaryImage =
        carFormData.image ||
        rawGallery[0] ||
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"

      const finalGallery =
        rawGallery.length > 0 ? [...rawGallery] : [primaryImage]

      // Ensure primary cover image is positioned at index 0 of gallery

      if (!finalGallery.includes(primaryImage)) {
        finalGallery.unshift(primaryImage)
      } else if (finalGallery[0] !== primaryImage) {
        const idx = finalGallery.indexOf(primaryImage)

        if (idx > -1) {
          finalGallery.splice(idx, 1)

          finalGallery.unshift(primaryImage)
        }
      }

      const finalPricePerDay = Number(carFormData.pricePerDay) || 55
      const parsedHour = Number(carFormData.pricePerHour)
      const finalPricePerHour =
        !isNaN(parsedHour) && parsedHour > 0
          ? parsedHour
          : Math.max(1, Math.round(finalPricePerDay / 8))
      const parsedMonth = Number(carFormData.pricePerMonth)
      const finalPricePerMonth =
        !isNaN(parsedMonth) && parsedMonth > 0
          ? parsedMonth
          : Math.round(finalPricePerDay * 22)

      const payload: Partial<Car> = {
        ...carFormData,
        pricePerDay: finalPricePerDay,
        pricePerHour: finalPricePerHour,
        pricePerMonth: finalPricePerMonth,
        year: Number(carFormData.year) || 2024,
        seats: Number(carFormData.seats) || 5,
        purchaseCost: Number(carFormData.purchaseCost) || 32500,
        currentOdometer: Number(carFormData.currentOdometer) || 14200,
        image: primaryImage,
        gallery: finalGallery,
        location:
          carFormData.location ||
          studioContact.hub_address ||
          "Operating Fleet Hub",
        garageName:
          carFormData.garageName ||
          studioContact.hub_address ||
          "Operating Fleet Hub",
        garageAddress:
          carFormData.garageAddress ||
          studioContact.hub_address ||
          "Operating Fleet Hub",
        garageLat: carFormData.garageLat ?? studioContact.hub_lat ?? 17.4646,
        garageLng: carFormData.garageLng ?? studioContact.hub_lng ?? 78.3582,
        insurancePolicy: addInsuranceDetails
          ? (carFormData.insurancePolicy || "").trim()
          : "",
        insuranceProvider: addInsuranceDetails
          ? (carFormData.insuranceProvider || "").trim()
          : "",
        insuranceExpiry: addInsuranceDetails
          ? (carFormData.insuranceExpiry || "").trim()
          : "",
      }

      if (editingCar) {
        const updated = await api.updateCar(editingCar.id, payload)

        setCars((prev) =>
          prev.map((c) => (c.id === editingCar.id ? updated : c)),
        )

        notify(
          `Vehicle ${updated.name} updated with ${updated.gallery?.length || 1} photo(s).`,
        )
      } else {
        const created = await api.createCar(payload)

        setCars((prev) => [created, ...prev])

        notify(
          `Vehicle ${created.name} registered into fleet with ${created.gallery?.length || 1} photo(s).`,
        )
      }

      // Re-fetch all cars fresh from backend to sync database state
      const freshFleet = await api.getCars().catch(() => null)
      if (freshFleet && Array.isArray(freshFleet)) {
        setCars(freshFleet)
      }

      setIsCarModalOpen(false)
    } catch (err: any) {
      alert("Failed to save car: " + (err?.message || "Unknown error"))
    } finally {
      setIsSavingCar(false)
    }
  }

  const handleConfirmDeleteCar = async () => {
    if (!deletingCar) return

    setIsDeletingCar(true)

    try {
      await api.deleteCar(deletingCar.id)

      setCars((prev) => prev.filter((c) => c.id !== deletingCar.id))

      const freshFleet = await api.getCars().catch(() => null)
      if (freshFleet && Array.isArray(freshFleet)) {
        setCars(freshFleet)
      }

      notify(
        `Vehicle ${deletingCar.name} (${deletingCar.plateNumber || deletingCar.id}) decommissioned and removed from fleet.`,
      )

      setDeletingCar(null)
    } catch (err: any) {
      alert("Failed to delete car: " + (err?.message || "Unknown error"))
    } finally {
      setIsDeletingCar(false)
    }
  }

  // Real-time ticker for ride completion notification
  const [tickerNow, setTickerNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setTickerNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Automated Ride Completion & Return Notification System (Accounts for Booking End Date & Approved Extensions)
  const getEffectiveBookingReturnInfo = (b: BookingRecord) => {
    let dateStr = b.returnDate || ""
    let isExtended = false
    let extensionLabel = ""

    if (b.extensionStatus === "Approved") {
      isExtended = true
      const extReq = b.extensionRequest
      if (extReq?.durationValue) {
        extensionLabel = `+${extReq.durationValue} ${extReq.durationUnit || "days"}`
      }
    }

    // Parse return date accurately
    let returnTs = Date.parse(dateStr)
    if (isNaN(returnTs) && dateStr) {
      const cleaned = dateStr.replace(/([0-9]+)(st|nd|rd|th)/gi, "$1")
      returnTs = Date.parse(cleaned)
    }

    if (isExtended && b.extensionQuote?.newReturnDate) {
      const extQuoteTs = Date.parse(b.extensionQuote.newReturnDate)
      if (!isNaN(extQuoteTs)) returnTs = extQuoteTs
    }

    const effectiveDate = !isNaN(returnTs) && returnTs > 0 ? new Date(returnTs) : null
    const now = tickerNow
    const isPastEndDate = effectiveDate ? now >= effectiveDate.getTime() : false
    const diffMs = effectiveDate ? now - effectiveDate.getTime() : 0
    const minutesPast = Math.max(0, Math.floor(diffMs / 60000))
    const hoursPast = Math.max(0, Math.floor(diffMs / 3600000))

    return {
      effectiveDate,
      dateStr,
      isExtended,
      extensionLabel,
      isPastEndDate,
      minutesPast,
      hoursPast,
    }
  }

  // Active bookings where rental period (original or extended) has completed and vehicle is due for return audit
  const completedRidesDue = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status !== "Checked Out") return false
      const info = getEffectiveBookingReturnInfo(b)
      return info.isPastEndDate
    })
  }, [bookings, tickerNow])

  const overdueBookings = useMemo(() => {
    return completedRidesDue
  }, [completedRidesDue])

  // Active Extension Requests Awaiting Manager Action
  const pendingExtensionBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status !== "Cancelled" &&
        b.status !== "Completed" &&
        (b.extensionStatus === "Requested" ||
          b.extensionStatus === "Pending" ||
          (b.notes &&
            (b.notes.includes("Extension requested") ||
              b.notes.includes("EXTENSION REQUEST") ||
              b.notes.includes("Customer requested extra")) &&
            b.extensionStatus !== "Approved" &&
            b.extensionStatus !== "Declined")),
    )
  }, [bookings])

  // New Customer Booking Requests Awaiting Manager Clearance & Vehicle Assignment
  const pendingNewBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        !b.approvedByAdmin &&
        b.status !== "Cancelled" &&
        b.status !== "Completed" &&
        b.status !== "Checked Out" &&
        b.status !== "Returned",
    )
  }, [bookings])

  // Dynamic Category Counts for Orders & Dispatch Registry

  const manifestCounts = useMemo(() => {
    const isPendingBooking = (b: BookingRecord) => {
      if (
        b.status === "Cancelled" ||
        b.status === "Completed" ||
        b.status === "Checked Out" ||
        b.status === "Returned"
      ) {
        return false
      }
      if (b.status === "Assigned" && b.matchedCarId && b.approvedByAdmin) {
        return false
      }
      return !b.matchedCarId || b.status === "Pending Assignment" || !b.approvedByAdmin
    }

    const isConfirmedBooking = (b: BookingRecord) =>
      !isPendingBooking(b) &&
      (b.status === "Assigned" ||
        (Boolean(b.approvedByAdmin) &&
          b.status !== "Checked Out" &&
          b.status !== "Returned" &&
          b.status !== "Completed" &&
          b.status !== "Cancelled"))

    const extensionRequests = bookings.filter(
      (b) =>
        b.extensionStatus === "Requested" || b.extensionStatus === "Pending",
    ).length

    return {
      all: bookings.length,

      pending: bookings.filter(isPendingBooking).length,

      confirmed: bookings.filter(isConfirmedBooking).length,

      active: bookings.filter((b) => b.status === "Checked Out").length,

      extensions: extensionRequests,

      returned: bookings.filter((b) => b.status === "Returned").length,

      completed: bookings.filter(
        (b) => b.status === "Completed" || b.status === "Cancelled",
      ).length,
    }
  }, [bookings])

  // Filtered reservations with priority ordering (Pending requests first)

  const filteredBookings = useMemo(() => {
    const isPendingBooking = (b: BookingRecord) => {
      if (
        b.status === "Cancelled" ||
        b.status === "Completed" ||
        b.status === "Checked Out" ||
        b.status === "Returned"
      ) {
        return false
      }
      if (b.status === "Assigned" && b.matchedCarId && b.approvedByAdmin) {
        return false
      }
      return !b.matchedCarId || b.status === "Pending Assignment" || !b.approvedByAdmin
    }

    const isConfirmedBooking = (b: BookingRecord) =>
      !isPendingBooking(b) &&
      (b.status === "Assigned" ||
        (Boolean(b.approvedByAdmin) &&
          b.status !== "Checked Out" &&
          b.status !== "Returned" &&
          b.status !== "Completed" &&
          b.status !== "Cancelled"))

    const list = bookings.filter((b) => {
      let matchStatus = false

      if (manifestStatusFilter === "all") {
        matchStatus = true
      } else if (
        manifestStatusFilter === "needs-car" ||
        manifestStatusFilter === "Pending Assignment"
      ) {
        matchStatus = isPendingBooking(b)
      } else if (
        manifestStatusFilter === "confirmed" ||
        manifestStatusFilter === "Assigned"
      ) {
        matchStatus = isConfirmedBooking(b)
      } else if (
        manifestStatusFilter === "active" ||
        manifestStatusFilter === "Checked Out"
      ) {
        matchStatus = b.status === "Checked Out"
      } else if (manifestStatusFilter === "extensions") {
        matchStatus =
          b.extensionStatus === "Requested" ||
          b.extensionStatus === "Pending" ||
          b.extensionStatus === "Quoted" ||
          b.extensionStatus === "Approved"
      } else if (
        manifestStatusFilter === "returned" ||
        manifestStatusFilter === "Returned"
      ) {
        matchStatus = b.status === "Returned"
      } else if (
        manifestStatusFilter === "completed" ||
        manifestStatusFilter === "Completed"
      ) {
        matchStatus = b.status === "Completed" || b.status === "Cancelled"
      } else {
        matchStatus = b.status === manifestStatusFilter
      }

      const query = manifestSearch.toLowerCase().trim()

      const matchSearch =
        !query ||
        b.id.toLowerCase().includes(query) ||
        b.customer.firstName.toLowerCase().includes(query) ||
        b.customer.lastName.toLowerCase().includes(query) ||
        b.customer.email.toLowerCase().includes(query) ||
        (b.driver?.licenseNumber &&
          b.driver.licenseNumber.toLowerCase().includes(query))

      return matchStatus && matchSearch
    })

    // Action priority:
    // -1: Pending extension request from active driver (critical timely response)
    // 0: Pending review / unassigned / needs car (highest priority actions)
    // 1: Confirmed (Assigned - ready for customer pickup)
    // 2: Active trips (Checked Out - on the road)
    // 3: Returned (Awaiting check-in inspection)
    // 4: Completed & Cancelled (Archived history)

    const parseBookingTime = (t?: string): number => {
      if (!t) return 0

      if (t === "Just now") return Date.now()

      const parsed = Date.parse(t)

      if (!isNaN(parsed)) return parsed

      if (t.startsWith("Today")) return Date.now() - 3600000

      if (t.startsWith("Yesterday")) return Date.now() - 86400000

      return 0
    }

    const getPriority = (b: BookingRecord): number => {
      if (b.extensionStatus === "Requested" || b.extensionStatus === "Pending")
        return -1

      if (isPendingBooking(b)) return 0

      if (b.status === "Assigned") return 1

      if (b.status === "Checked Out") return 2

      if (b.status === "Returned") return 3

      return 4
    }

    return [...list].sort((a, b) => {
      const pA = getPriority(a)

      const pB = getPriority(b)

      if (pA !== pB) return pA - pB

      const tA = parseBookingTime(a.createdAt)

      const tB = parseBookingTime(b.createdAt)

      if (tB !== tA) return tB - tA

      return (b.id || "").localeCompare(a.id || "")
    })
  }, [bookings, manifestStatusFilter, manifestSearch])

  // Filtered fleet

  const filteredFleet = useMemo(() => {
    return cars.filter((c) => {
      const matchStatus =
        fleetStatusFilter === "all" || c.status === fleetStatusFilter

      const query = fleetSearch.toLowerCase()

      const matchSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.brand.toLowerCase().includes(query) ||
        (c.plateNumber && c.plateNumber.toLowerCase().includes(query)) ||
        c.type.toLowerCase().includes(query)

      return matchStatus && matchSearch
    })
  }, [cars, fleetStatusFilter, fleetSearch])

  // Filtered CRM

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const query = customerSearch.toLowerCase()

      return (
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.driverLicenseNum && c.driverLicenseNum.toLowerCase().includes(query))
      )
    })
  }, [customers, customerSearch])

  // Theme state: defaults to Light Mode with LocalStorage persistence

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (
        localStorage.getItem("motorly_admin_theme") as "light" | "dark" ||
        "light"
      )
    } catch {
      return "light"
    }
  })

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"

    setTheme(next)

    try {
      localStorage.setItem("motorly_admin_theme", next)
    } catch {}
  }

  const isDark = theme === "dark"

  return (
    <div
      className={`w-full h-screen overflow-hidden font-sans transition-colors duration-200 flex flex-col lg:flex-row ${
        isDark
          ? "dark bg-[#111215] text-[#F3F4F6]"
          : "bg-[#FAF7F2] text-[#17191C]"
      }`}
    >
      {/* ========================================================
          1. LEFT SIDEBAR (Pinned & Dynamic Collapsible)
          ======================================================== */}
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:relative h-screen overflow-y-auto ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64 xl:w-72"
        } w-64 border-r flex flex-col justify-between shrink-0 transition-all duration-300 ${
          isMobileSidebarOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        } ${
          isDark
            ? "bg-[#141518] border-stone-800 text-stone-200"
            : "bg-[#FDFBF7] border-stone-200/90 text-stone-800"
        }`}
      >
        {/* Top Branding & Status */}
        <div className="p-5 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#F97316] to-amber-500 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm shrink-0">
                M
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="font-heading font-black text-sm tracking-tight leading-tight">
                    MOTORLY{" "}
                    <span className="text-[10px] font-mono font-bold text-[#F97316] uppercase">
                      ATELIER
                    </span>
                  </h1>
                  <p className="text-[10px] font-mono text-stone-400">
                    STUDIO DIRECTOR CONSOLE
                  </p>
                </div>
              )}
            </div>

            {/* Desktop collapse toggle button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="font-mono font-bold text-sm leading-none">{isSidebarCollapsed ? "»" : "«"}</span>
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
            >
              ✕
            </button>
          </div>

          {/* Database Live Status Pill */}
          {!isSidebarCollapsed ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DATABASE LIVE
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                14ms • Supabase
              </span>
            </div>
          ) : (
            <div className="mt-3 flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" title="Database Live: 14ms Supabase" />
            </div>
          )}
        </div>

        {/* Navigation Items (Matches Reference Image Side Bar with Detailing) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {!isSidebarCollapsed && (
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Console Pages
            </p>
          )}

          {[
            {
              id: "manifest",

              label: "Orders & Dispatch",

              icon: <CalendarIcon size={16} />,

              badge:
                stats.pendingMating > 0
                  ? `${stats.pendingMating}`
                  : `${bookings.length}`,

              badgeColor:
                stats.pendingMating > 0
                  ? "bg-amber-500 text-stone-950 font-black"
                  : "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "completed",

              label: "Completed & Invoices",

              icon: <FileTextIcon size={16} />,

              badge: `${bookings.filter((b) => b.status === "Completed").length}`,

              badgeColor:
                bookings.filter((b) => b.status === "Completed").length > 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
                  : "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "fleet",

              label: "Fleet & Inventory",

              icon: <CarIcon size={16} />,

              badge: `${cars.length}`,

              badgeColor:
                "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "promos",

              label: "Privileges & Coupons",

              icon: <TagIcon size={16} />,

              badge: `${promos.length}`,

              badgeColor:
                "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "crm",

              label: "Customers & Drivers",

              icon: <UserIcon size={16} />,

              badge: `${customers.length}`,

              badgeColor:
                "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "walkin",

              label: "Walk-in Counter",

              icon: <ZapIcon size={16} />,

              badge: "Fast",

              badgeColor:
                "bg-orange-500/15 text-[#F97316] font-bold border border-orange-500/20",
            },

            {
              id: "maintenance",

              label: "Vehicle Maintenance",

              icon: <WrenchIcon size={16} />,

              badge: `${mntPagination.total || maintenanceLogs.length}`,

              badgeColor:
                "bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
            },

            {
              id: "settings",

              label: "Studio & Dispatch Settings",

              icon: <SettingsIcon size={16} />,

              badge: "Phone & Mail",

              badgeColor:
                "bg-orange-500/15 text-[#F97316] font-bold border border-orange-500/20",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)

                  setIsMobileSidebarOpen(false)
                }}
                className={`w-full ${
                  isSidebarCollapsed ? "px-2 py-3 justify-center" : "px-3.5 py-2.5 justify-between"
                } rounded-2xl transition flex items-center text-xs cursor-pointer group relative ${
                  isActive
                    ? isDark
                      ? "bg-white text-stone-950 font-bold shadow-md"
                      : "bg-[#1C1917] text-white font-bold shadow-sm"
                    : isDark
                      ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60 font-semibold"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold"
                }`}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                  <span
                    className={
                      isActive
                        ? isDark
                          ? "text-stone-950"
                          : "text-white"
                        : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300"
                    }
                  >
                    {tab.icon}
                  </span>
                  {!isSidebarCollapsed && <span>{tab.label}</span>}
                </div>
                {!isSidebarCollapsed ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${tab.badgeColor} ${
                      isActive && !isDark ? "bg-white/20 text-white" : ""
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : (
                  tab.badge && (
                    <span
                      className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                        isActive ? "bg-[#F97316]" : "bg-orange-500/80"
                      }`}
                      title={tab.badge}
                    />
                  )
                )}
                {/* Floating Tooltip when Collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl border border-stone-800 transition flex items-center gap-2">
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col items-center gap-2">
          {!isSidebarCollapsed ? (
            <div className="w-full flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>MOTORLY OS v3.4</span>
              <button
                onClick={handleRefreshData}
                disabled={isSyncing}
                className="text-[#F97316] hover:underline cursor-pointer flex items-center gap-1 font-bold"
                title="Force database sync"
              >
                <span className={isSyncing ? "animate-spin" : ""}>↻</span>
                <span>Sync</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleRefreshData}
              disabled={isSyncing}
              className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] hover:bg-orange-500 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Force database sync"
            >
              <span className={isSyncing ? "animate-spin text-sm" : "text-sm font-bold"}>↻</span>
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. RIGHT MAIN COLUMN (Top Nav + Main Content - Independent Scroll)
          ======================================================== */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header
          className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
            isDark
              ? "bg-[#17191C]/95 border-stone-800"
              : "bg-white/95 border-stone-200/90 shadow-2xs"
          }`}
        >
          <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Left: Mobile Brand & Drawer Button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-sm">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer shrink-0"
                aria-label="Open Sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Mobile Branded Logo with Character */}
              <div className="flex items-center gap-2 lg:hidden select-none">
                <div className="w-6 h-5 relative flex items-end shrink-0">
                  <svg
                    viewBox="0 0 28 24"
                    fill="none"
                    className="w-full h-full"
                  >
                    <path
                      d="M2 22L7.5 3L11.5 13L15.5 3L21 22H16.5L14 11L11.5 17.5L9 11L6.5 22H2Z"
                      fill="#F97316"
                    />
                    <path
                      d="M21 22L26 5L24 22H21Z"
                      fill="#EA580C"
                      opacity="0.8"
                    />
                  </svg>
                </div>
                <span className="font-heading font-black text-xs tracking-tight text-stone-900 dark:text-white">
                  MOTORLY{" "}
                  <span className="text-[9px] font-mono font-bold text-[#F97316] uppercase ml-0.5">
                    CONSOLE
                  </span>
                </span>
              </div>

              {/* Desktop Universal Search Input */}
              <div className="relative w-full hidden lg:block">
                <SearchIcon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={globalAdminSearch}
                  onChange={(e) => {
                    const q = e.target.value

                    setGlobalAdminSearch(q)

                    setManifestSearch(q)

                    setFleetSearch(q)

                    setCustomerSearch(q)

                    setMntSearch(q)
                  }}
                  placeholder="Search clients, orders, creations, SKUs..."
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border transition focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                    isDark
                      ? "bg-stone-900 border-stone-700 text-white placeholder-stone-500"
                      : "bg-[#FDFBF7] border-stone-200 text-stone-900 placeholder-stone-400 shadow-2xs"
                  }`}
                />
              </div>
            </div>

            {/* Right: Actions (View Website, Phone/Mail Settings, Profile, Sign Out, Alerts) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Storefront Website SVG Button */}
              <button
                type="button"
                onClick={onExitAdmin}
                className={`h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                    : "bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs"
                }`}
                title="View customer storefront"
              >
                <GlobeIcon size={15} className="text-[#F97316]" />
                <span className="hidden xl:inline text-xs">Storefront</span>
              </button>

              {/* Quick Dispatch / Phone & Mail Settings SVG Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("settings")
                  setIsAdminProfileOpen(true)
                }}
                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "settings" || isAdminProfileOpen
                    ? "bg-[#F97316] text-white border-[#F97316] shadow-xs"
                    : isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                      : "bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs"
                }`}
                title="Dispatch & Notification Settings"
              >
                <SettingsIcon
                  size={15}
                  className={
                    activeTab === "settings" || isAdminProfileOpen
                      ? "text-white"
                      : "text-[#F97316]"
                  }
                />
                <span className="hidden xl:inline text-xs">Dispatch</span>
              </button>

              {/* Admin Profile Pill */}
              <button
                type="button"
                onClick={() => setIsAdminProfileOpen(true)}
                className={`h-9 px-2.5 rounded-lg text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                  isAdminProfileOpen
                    ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                    : isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                      : "bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs"
                }`}
                title="Studio Director Profile & Dispatch Configuration"
              >
                <div className="w-5 h-5 rounded-md bg-[#1C1917] text-[#F97316] font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-stone-700">
                  SD
                </div>
                <span className="hidden 2xl:inline text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {studioContact.admin_name || "Manager"}
                </span>
              </button>

              {/* SIGN OUT SVG Button */}
              <button
                type="button"
                onClick={onLogoutAdmin || onExitAdmin}
                className={`h-9 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-white hover:bg-rose-50 text-rose-700 border-stone-200 shadow-2xs"
                }`}
                title="Sign out of console"
              >
                <LogOutIcon
                  size={14}
                  className="text-rose-600 dark:text-rose-400"
                />
                <span className="hidden xl:inline text-xs">Exit</span>
              </button>

              {/* Overdue & Extension Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className={`relative p-2 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center ${
                    isNotificationOpen
                      ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                      : overdueBookings.length > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : pendingExtensionBookings.length > 0
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : isDark
                            ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                            : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Notifications & Fleet Alerts"
                >
                  <BellIcon size={16} />
                  {pendingNewBookings.length > 0 || overdueBookings.length > 0 || pendingExtensionBookings.length > 0 ? (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center animate-pulse ${
                      pendingNewBookings.length > 0 ? "bg-blue-600" : overdueBookings.length > 0 ? "bg-rose-600" : "bg-amber-500"
                    }`}>
                      {pendingNewBookings.length + overdueBookings.length + pendingExtensionBookings.length}
                    </span>
                  ) : null}
                </button>

                {/* Notifications Dropdown Popover */}
                {isNotificationOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border shadow-2xl p-4 z-50 animate-fade-in ${
                      isDark
                        ? "bg-[#1A1C20] border-stone-700 text-stone-100"
                        : "bg-white border-stone-200 text-stone-900"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10 text-[#F97316]">
                          <BellIcon size={16} />
                        </div>
                        <div>
                          <h4 className="font-black text-xs uppercase tracking-wider">
                            Fleet Alerts Center
                          </h4>
                          <p className="text-[10px] text-stone-500">
                            Real-time extensions &amp; return monitoring
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pendingNewBookings.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                            {pendingNewBookings.length} New
                          </span>
                        )}
                        {pendingExtensionBookings.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                            {pendingExtensionBookings.length} Ext
                          </span>
                        )}
                        {overdueBookings.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            {overdueBookings.length} Overdue
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsNotificationOpen(false)}
                          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold cursor-pointer flex items-center justify-center transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 max-h-80 overflow-y-auto space-y-3 pr-1">
                      {/* Section 0: New Customer Booking Requests */}
                      {pendingNewBookings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <BellIcon size={12} /> New Booking Orders ({pendingNewBookings.length})
                          </p>
                          {pendingNewBookings.map((nb) => {
                            const car = cars.find((c) => c.id === nb.matchedCarId)
                            return (
                              <div
                                key={`popover-new-${nb.id}`}
                                className={`p-3 rounded-xl border transition ${
                                  isDark
                                    ? "bg-blue-950/20 border-blue-500/40 hover:border-blue-500/70"
                                    : "bg-blue-50/80 border-blue-200 hover:border-blue-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs text-[#F97316]">
                                        {nb.id}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white uppercase font-mono">
                                        Pending Review
                                      </span>
                                    </div>
                                    <h5 className="font-bold text-xs text-stone-900 dark:text-white mt-1">
                                      {nb.customer?.firstName} {nb.customer?.lastName} • {car?.name || nb.carType || "Vehicle Request"}
                                    </h5>
                                    <p className="text-[11px] text-stone-600 dark:text-stone-300 font-mono mt-0.5">
                                      📅 {nb.pickupDate} → {nb.returnDate} • €{nb.totalAmount.toFixed(2)}
                                    </p>
                                    {(nb.tripReason || nb.notes) && (
                                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium truncate mt-0.5">
                                        ✈️ {nb.tripReason || nb.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsNotificationOpen(false)
                                        handleApproveBooking(nb.id)
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer text-center"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsNotificationOpen(false)
                                        setInspectedBooking(nb)
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition cursor-pointer text-center"
                                    >
                                      Inspect
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Section 1: Pending Extension Requests */}
                      {pendingExtensionBookings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <ZapIcon size={12} /> Pending Extension Requests ({pendingExtensionBookings.length})
                          </p>
                          {pendingExtensionBookings.map((b) => {
                            const car = cars.find((c) => c.id === b.matchedCarId)
                            const extReq = b.extensionRequest
                            const durationText = extReq?.durationValue
                              ? `+${extReq.durationValue} ${extReq.durationUnit || "days"}`
                              : "+Extra Duration"
                            return (
                              <div
                                key={`ext-${b.id}`}
                                className={`p-3 rounded-xl border transition ${
                                  isDark
                                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70"
                                    : "bg-amber-50/80 border-amber-200 hover:border-amber-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {b.id}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white font-mono">
                                        {durationText}
                                      </span>
                                    </div>
                                    <p className="font-bold text-xs mt-1 text-stone-900 dark:text-white">
                                      {b.customer.firstName} {b.customer.lastName}
                                    </p>
                                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                                      {car ? `${car.brand} ${car.model}` : "Rental Car"}
                                    </p>
                                    {extReq?.reason && (
                                      <p className="text-[10px] text-amber-700 dark:text-amber-400 italic mt-0.5 line-clamp-1">
                                        "{extReq.reason}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-500/30">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectedBooking(b)
                                      setIsNotificationOpen(false)
                                    }}
                                    className="text-[11px] font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
                                  >
                                    Inspect Manifest
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenExtensionQuote(b)
                                      setIsNotificationOpen(false)
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs flex items-center gap-1"
                                  >
                                    <ZapIcon size={12} />
                                    <span>Quote &amp; Approve →</span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Section 2: Overdue Vehicle Returns */}
                      {overdueBookings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                            Overdue Vehicle Returns ({overdueBookings.length})
                          </p>
                          {overdueBookings.map((b) => (
                            <div
                              key={`od-${b.id}`}
                              className={`p-3 rounded-xl border transition ${
                                isDark
                                  ? "bg-stone-900/90 border-rose-500/40 hover:border-rose-500/70"
                                  : "bg-rose-50/80 border-rose-200 hover:border-rose-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-mono font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                                    Rental Duration Finished
                                  </span>
                                  <p className="font-bold text-xs mt-1 text-stone-900 dark:text-white">
                                    {b.customer.firstName} {b.customer.lastName}{" "}
                                    <span className="font-mono text-stone-500 font-normal">
                                      ({b.id})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                                    <CarIcon
                                      size={14}
                                      className="text-[#F97316] inline"
                                    />{" "}
                                    {cars.find((c) => c.id === b.matchedCarId)
                                      ?.name ||
                                      b.requestedCategory ||
                                      "Rental Vehicle"}
                                  </p>
                                  <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                                    Scheduled Return:{" "}
                                    {formatFullDateTime(b.returnDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-rose-200/50 dark:border-rose-500/20">
                                <span className="text-[10px] text-stone-500 font-mono">
                                  Action needed:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab("manifest")

                                    setManifestStatusFilter("Checked Out")

                                    setInspectedBooking(b)

                                    setIsNotificationOpen(false)
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
                                >
                                  Inspect &amp; Return →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* If all zero */}
                      {pendingNewBookings.length === 0 && overdueBookings.length === 0 && pendingExtensionBookings.length === 0 && (
                        <div className="py-7 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 text-sm font-black">
                            ✓
                          </div>
                          <p className="font-bold text-xs">
                            All Clear &amp; On Schedule
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            No overdue rentals or pending extension requests. Fleet operating normally.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews System Toggle Button */}
              <button
                type="button"
                onClick={handleToggleReviews}
                disabled={isUpdatingReviewsSetting}
                className={`h-9 px-2 sm:px-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  reviewsEnabled
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                    : isDark
                      ? "bg-stone-800 text-stone-400 border-stone-700"
                      : "bg-stone-100 text-stone-500 border-stone-200"
                }`}
                title={
                  reviewsEnabled
                    ? "Customer Reviews: Active (Click to Pause)"
                    : "Customer Reviews: Paused (Click to Enable)"
                }
              >
                <StarIcon
                  size={14}
                  filled={reviewsEnabled}
                  className={
                    reviewsEnabled ? "text-amber-500" : "text-stone-400"
                  }
                />
                <span className="hidden 2xl:inline text-[11px]">
                  {reviewsEnabled ? "Reviews ON" : "Reviews OFF"}
                </span>
              </button>

              {/* Mood SVG Theme Toggle (Sun for Dark Mode, Moon for Light Mode) */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`h-9 w-9 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-amber-400 border-stone-700 shadow-xs"
                    : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs"
                }`}
                title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
              >
                {isDark ? (
                  <SunIcon size={16} className="text-amber-400" />
                ) : (
                  <MoonIcon size={16} className="text-stone-700" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-3 sm:space-y-6">
          {/* Toast Alert */}
          {notification && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in ${
                isDark
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckIcon size={16} className="text-emerald-500" />
                <span>{notification}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================
              PAGE HEADER (Matches Reference Image)
              Subtitle + Large Bold Title + Subtext + Action CTA
              ======================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-stone-200/60 dark:border-stone-800/60">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F97316]">
                Studio Director Console
              </p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-stone-900 dark:text-white uppercase mt-1">
                {activeTab === "promos" && "PRIVILEGES & COUPON REGISTRY"}
                {activeTab === "manifest" && "ORDERS & DISPATCH REGISTRY"}
                {activeTab === "completed" &&
                  "COMPLETED ORDERS & INVOICE ARCHIVE"}
                {activeTab === "fleet" && "FLEET & ASSET INVENTORY"}
                {activeTab === "crm" && "CUSTOMERS & VERIFIED DRIVER CRM"}
                {activeTab === "walkin" &&
                  "COUNTER DISPATCH & INSTANT CHECKOUT"}
                {activeTab === "maintenance" &&
                  "VEHICLE TELEMETRY & REPAIR AUDIT"}
                {activeTab === "settings" &&
                  "STUDIO CONTACT & COMMUNICATIONS REGISTRY"}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
                {activeTab === "promos" &&
                  "Curate exclusive VIP discount vouchers, regulate privileges, dismantle codes in real-time, and monitor live performance rankings."}
                {activeTab === "manifest" &&
                  "Review real-time reservation requests, inspect driver credentials, dispatch keys, and regulate fleet lifecycle across all station hubs."}
                {activeTab === "fleet" &&
                  "Manage vehicle specifications, multi-photo galleries, garage hub assignments, daily rates, and dynamic operational statuses."}
                {activeTab === "crm" &&
                  "Inspect client credentials, verify driver licenses, review customer rental history, and regulate security clearances."}
                {activeTab === "walkin" &&
                  "Execute fast counter bookings for airport and hub arrivals with automatic vehicle mating and on-the-spot key handoff."}
                {activeTab === "maintenance" &&
                  "Audit vehicle health scores, track preventative maintenance logs, and manage repair workflows with complete audit history."}
                {activeTab === "settings" &&
                  "Configure official dispatch WhatsApp phone numbers, direct notification emails, key handoff hub locations, and fleet manager credentials with Supabase PostgreSQL live synchronization."}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0 flex items-center gap-2">
              {activeTab === "promos" && (
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <PlusIcon size={14} />
                  <span>Create New Privilege</span>
                </button>
              )}

              {activeTab === "fleet" && (
                <button
                  type="button"
                  onClick={handleOpenAddCar}
                  className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <PlusIcon size={14} />
                  <span>Register Vehicle</span>
                </button>
              )}

              {activeTab === "manifest" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("walkin")}
                  className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <PlusIcon size={14} />
                  <span>Walk-in Dispatch</span>
                </button>
              )}

              {activeTab === "completed" && (
                <button
                  type="button"
                  onClick={handleExportCompletedCsv}
                  className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <DownloadIcon size={14} />
                  <span>Export Invoice CSV</span>
                </button>
              )}

              {activeTab === "maintenance" && (
                <button
                  type="button"
                  onClick={() => notify("Maintenance scheduler ready.")}
                  className="px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <PlusIcon size={14} />
                  <span>Schedule Service</span>
                </button>
              )}

              {activeTab === "settings" && (
                <button
                  type="button"
                  onClick={() => handleSaveStudioContact()}
                  disabled={isSavingStudioContact}
                  className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon size={14} />
                  <span>
                    {isSavingStudioContact
                      ? "Saving..."
                      : "Save Contact Details"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================
              PROMINENT NEW BOOKING ORDERS ALERT BANNER (TOP OF DASHBOARD)
              Shows at the very top of dashboard whenever new customer reservations are awaiting clearance
              ======================================================== */}
          {pendingNewBookings.length > 0 && (
            <div className="rounded-2xl border border-blue-400 bg-linear-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/20 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/50 p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                    <BellIcon size={20} className="animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-sm sm:text-base text-stone-900 dark:text-white uppercase tracking-tight">
                        🔔 New Booking Alert: {pendingNewBookings.length} Reservation Request{pendingNewBookings.length > 1 ? "s" : ""} Awaiting Review
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white animate-pulse">
                        Awaiting Manager Clearance
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      New customer reservation bookings received. Accept request to approve dates and vehicle assignment, or review details in manifest.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("manifest")
                      setManifestStatusFilter("needs-car")
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Filter Needs Car Tab</span>
                    <ArrowRightIcon size={13} />
                  </button>
                </div>
              </div>

              {/* Individual pending requests cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
                {pendingNewBookings.map((nb) => {
                  const car = cars.find((c) => c.id === nb.matchedCarId)
                  return (
                    <div
                      key={`top-new-bk-${nb.id}`}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                        isDark
                          ? "bg-[#18191D] border-blue-500/40 text-stone-200"
                          : "bg-white/95 border-blue-300 text-stone-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-[#F97316]">
                              {nb.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60">
                              €{nb.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 dark:text-white mt-1">
                            {car ? `${car.brand || ""} ${car.name}` : (nb.carType || "Vehicle Request")}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            Customer: <strong>{nb.customer?.firstName} {nb.customer?.lastName}</strong> ({nb.customer?.phone || "No phone"})
                          </p>
                          <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                            📅 {nb.pickupDate} → {nb.returnDate}
                          </p>
                          {(nb.tripReason || nb.notes) && (
                            <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                              <span>✈️ Purpose:</span>
                              <span className="font-bold truncate">{nb.tripReason || nb.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveBooking(nb.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                            title="Accept reservation request"
                          >
                            <CheckIcon size={12} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineBooking(nb.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                            title="Decline reservation request"
                          >
                            <span>Decline</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectedBooking(nb)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isDark
                              ? "bg-stone-800 hover:bg-stone-700 text-stone-200"
                              : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                          }`}
                          title="Open Full Reservation Manifest"
                        >
                          Manifest →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              PROMINENT EXTENSION REQUESTS ALERT BANNER (TOP OF DASHBOARD)
              Shows at the very top of dashboard whenever extension requests are pending
              ======================================================== */}
          {pendingExtensionBookings.length > 0 && (
            <div className="rounded-2xl border border-amber-400 bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/50 p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                    <ZapIcon size={20} className="animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-sm sm:text-base text-stone-900 dark:text-white uppercase tracking-tight">
                        ⚡ Action Required: {pendingExtensionBookings.length} Rental Extension Request{pendingExtensionBookings.length > 1 ? "s" : ""}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse">
                        Awaiting Manager Review &amp; Quote
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      Active drivers have requested extended rental durations. Review requested dates, price adjustment, and grant clearance.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("manifest")
                      setManifestStatusFilter("extensions")
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Filter Extensions Tab</span>
                    <ArrowRightIcon size={13} />
                  </button>
                </div>
              </div>

              {/* Individual pending requests cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
                {pendingExtensionBookings.map((eb) => {
                  const car = cars.find((c) => c.id === eb.matchedCarId)
                  const extReq = eb.extensionRequest
                  const durationText = extReq?.durationValue
                    ? `+${extReq.durationValue} ${extReq.durationUnit || "days"}`
                    : "+Extra Duration"
                  return (
                    <div
                      key={`top-ext-${eb.id}`}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                        isDark
                          ? "bg-[#18191D] border-amber-500/40 text-stone-200"
                          : "bg-white/95 border-amber-300 text-stone-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-[#F97316]">
                              {eb.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                              {durationText}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 dark:text-white mt-1">
                            {car ? `${car.brand} ${car.model}` : "Staged Fleet Car"}
                            {car?.plateNumber && (
                              <span className="ml-1 text-[10px] font-mono text-stone-400">
                                ({car.plateNumber})
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            Driver: {eb.customer.firstName} {eb.customer.lastName} • {eb.customer.phone || eb.customer.email}
                          </p>
                          {extReq?.reason && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 italic line-clamp-1 mt-1">
                              "{extReq.reason}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => handleOpenExtensionQuote(eb)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ZapIcon size={12} />
                          <span>Quote &amp; Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectedBooking(eb)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isDark
                              ? "bg-stone-800 hover:bg-stone-700 text-stone-200"
                              : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                          }`}
                          title="Open Full Reservation Manifest"
                        >
                          Manifest →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              PROMINENT RIDE COMPLETION & VEHICLE RETURN ALERTS BANNER
              Fires on-screen notification for every ride completion according to booking end date (including extensions)
              ======================================================== */}
          {completedRidesDue.length > 0 && (
            <div className="rounded-2xl border border-emerald-500 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                    <CheckCircleIcon size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-black text-sm sm:text-base text-stone-900 dark:text-white uppercase tracking-tight">
                        🏁 Ride Completed: {completedRidesDue.length} Vehicle{completedRidesDue.length > 1 ? "s" : ""} Due for Return Audit
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600 text-white animate-pulse">
                        Booking End Date Reached
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      The scheduled rental duration (accounting for approved extensions) has concluded. Please inspect return odometer, fuel level, and release deposit.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("manifest")
                      setManifestStatusFilter("checked-out")
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View In-Drive Fleet</span>
                    <ArrowRightIcon size={13} />
                  </button>
                </div>
              </div>

              {/* Individual completed rides cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
                {completedRidesDue.map((b) => {
                  const car = cars.find((c) => c.id === b.matchedCarId)
                  const returnInfo = getEffectiveBookingReturnInfo(b)
                  return (
                    <div
                      key={`top-complete-${b.id}`}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                        isDark
                          ? "bg-[#18191D] border-emerald-500/40 text-stone-200"
                          : "bg-white/95 border-emerald-300 text-stone-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs">
                              {b.id}
                            </span>
                            <span className="text-stone-400">•</span>
                            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              {car ? `${car.brand} ${car.name}` : "Vehicle Assigned"}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            Driver: <span className="font-medium text-stone-700 dark:text-stone-300">{b.customerName}</span> ({b.customerPhone})
                          </p>
                        </div>
                        {returnInfo.isExtended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            {returnInfo.extensionLabel || "Extended"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Trip Complete
                          </span>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Scheduled End:</span>
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                            {returnInfo.dateStr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Status Elapsed:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {returnInfo.hoursPast > 0 ? `${returnInfo.hoursPast}h ${returnInfo.minutesPast % 60}m past end time` : `${returnInfo.minutesPast}m past end time`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                        <button
                          type="button"
                          onClick={() => handleOpenReturnModal(b)}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircleIcon size={13} />
                          <span>Check-In &amp; Audit Return</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectedBooking(b)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isDark
                              ? "bg-stone-800 hover:bg-stone-700 text-stone-200"
                              : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                          }`}
                          title="Open Full Reservation Manifest"
                        >
                          Manifest →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              4 BETTER CARDS OF INFO (Matches Reference Image)
              Top uppercase label + Icon | Bold Value | Detail with dot
              ======================================================== */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {activeTab === "settings" && (
              <>
                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      WHATSAPP DISPATCH NUMBER
                    </p>
                    <span className="text-emerald-500">
                      <PhoneIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono my-1 text-stone-900 dark:text-white truncate">
                    {studioContact.contact_phone || "Not Configured"}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Automated client WhatsApp routing
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      DISPATCH NOTIFICATIONS EMAIL
                    </p>
                    <span className="text-[#F97316]">
                      <MailIcon size={14} />
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black font-mono my-1 text-stone-900 dark:text-white truncate">
                    {studioContact.contact_email || "Not Configured"}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Official fleet notification inbox
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      OPERATING HUB / GARAGE
                    </p>
                    <span className="text-sky-500">
                      <LocationIcon size={14} />
                    </span>
                  </div>
                  <p className="text-base font-black font-mono my-1 text-stone-900 dark:text-white truncate">
                    {studioContact.hub_address
                      ? studioContact.hub_address.split(",")[0] ||
                        studioContact.hub_address
                      : "Central Fleet Hub"}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Stationed vehicle dispatch counter
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      DATABASE STATUS
                    </p>
                    <span className="text-emerald-500">
                      <ShieldIcon size={14} />
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono my-1 text-emerald-500">
                    LIVE
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Supabase Cloud PostgreSQL
                  </p>
                </div>
              </>
            )}
            {activeTab === "promos" && (
              <>
                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      ACTIVE PRIVILEGES
                    </p>
                    <span className="text-emerald-500">
                      <TagIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {promoStats.activeCount}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Live &amp; redeemable at checkout
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      DISMANTLED CODES
                    </p>
                    <span className="text-amber-500">
                      <ShieldIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {promoStats.inactiveCount}
                  </p>
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Blocked from customer use
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      #1 TOP USED VOUCHER
                    </p>
                    <span className="text-amber-500">
                      <TagIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono my-1 text-stone-900 dark:text-white tracking-wider truncate">
                    {promoStats.topVoucher
                      ? promoStats.topVoucher.code
                      : "NONE"}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                    {promoStats.topVoucher
                      ? `${promoStats.topVoucher.usageCount} redemptions (${promoStats.topVoucher.discountPercent}% OFF)`
                      : "No active redemptions yet"}
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      TOTAL REDEMPTIONS
                    </p>
                    <span className="text-emerald-500">
                      <ZapIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {promoStats.totalRedemptions}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Fleet concessions redeemed
                  </p>
                </div>
              </>
            )}

            {activeTab === "manifest" && (
              <>
                <div
                  className={`border p-2.5 sm:p-5 rounded-xl flex flex-col justify-between min-h-[64px] sm:min-h-[110px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      ACTIVE RESERVATIONS
                    </p>
                    <span className="text-sky-500">
                      <CarIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {stats.rented}
                  </p>
                  <p className="hidden sm:flex text-[11px] font-medium text-emerald-600 dark:text-emerald-400 items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    On road &amp; in service
                  </p>
                </div>

                <div
                  className={`border p-2.5 sm:p-5 rounded-xl flex flex-col justify-between min-h-[64px] sm:min-h-[110px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      PENDING &amp; EXTENSIONS
                    </p>
                    <span className="text-amber-500">
                      <ZapIcon size={14} />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 my-0.5 sm:my-1">
                    <p
                      className={`text-xl sm:text-3xl font-black font-mono ${
                        stats.pendingMating > 0 || manifestCounts.extensions > 0
                          ? "text-amber-500"
                          : "text-stone-900 dark:text-white"
                      }`}
                    >
                      {stats.pendingMating + manifestCounts.extensions}
                    </p>
                    {manifestCounts.extensions > 0 && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
                        +{manifestCounts.extensions} Ext
                      </span>
                    )}
                  </div>
                  <p className="hidden sm:flex text-[11px] font-medium text-amber-600 dark:text-amber-400 items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    {manifestCounts.extensions > 0
                      ? `${manifestCounts.extensions} extension requests pending`
                      : "Awaiting manager clearance"}
                  </p>
                </div>

                <div
                  className={`border p-2.5 sm:p-5 rounded-xl flex flex-col justify-between min-h-[64px] sm:min-h-[110px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      COMPLETED TRIPS
                    </p>
                    <span className="text-emerald-500">
                      <CheckIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {bookings.filter((b) => b.status === "Completed").length}
                  </p>
                  <p className="hidden sm:block text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Successfully returned &amp; audited
                  </p>
                </div>

                <div
                  className={`border p-2.5 sm:p-5 rounded-xl flex flex-col justify-between min-h-[64px] sm:min-h-[110px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      TOTAL DISPATCH REVENUE
                    </p>
                    <span className="text-emerald-500">↗</span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    ${stats.activeRevenue.toLocaleString()}
                  </p>
                  <p className="hidden sm:block text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    From active reservation contracts
                  </p>
                </div>
              </>
            )}

            {activeTab === "fleet" && (
              <>
                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      REGISTERED FLEET
                    </p>
                    <span className="text-stone-400">
                      <CarIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {stats.total}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active in catalog
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      AVAILABLE IN GARAGE
                    </p>
                    <span className="text-emerald-500">
                      <CheckIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {stats.available}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Ready for immediate booking
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      MAINTENANCE &amp; WASH
                    </p>
                    <span className="text-rose-500">
                      <WrenchIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {stats.maintenance + stats.cleaning}
                  </p>
                  <p className="text-[11px] font-medium text-rose-500">
                    {stats.maintenance} Service • {stats.cleaning} Cleaning
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      FLEET UTILIZATION
                    </p>
                    <span className="text-emerald-500">
                      <ZapIcon size={14} />
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono my-1 text-emerald-500">
                    {stats.utilization}%
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Optimal operational capacity
                  </p>
                </div>
              </>
            )}

            {(activeTab === "crm" ||
              activeTab === "walkin" ||
              activeTab === "maintenance") && (
              <>
                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      TOTAL CLIENT DIRECTORY
                    </p>
                    <span className="text-stone-400">
                      <UserIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {customers.length || 12}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Verified client accounts
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      ACTIVE SERVICES / WORK
                    </p>
                    <span className="text-amber-500">
                      <WrenchIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {maintenanceLogs.filter((m) => m.status === "In Progress")
                      .length || 1}
                  </p>
                  <p className="text-[11px] font-medium text-amber-500">
                    Bay repair in progress
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      COUNTER SPEED
                    </p>
                    <span className="text-sky-500">
                      <ZapIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    3.5 Min
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Instant walk-in clearance
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      CLIENT SATISFACTION
                    </p>
                    <span className="text-amber-500">
                      <SparklesIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    4.9 / 5.0
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    From verified trip ratings
                  </p>
                </div>
              </>
            )}

            {activeTab === "completed" && (
              <>
                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      COMPLETED ORDERS
                    </p>
                    <span className="text-emerald-500">
                      <CheckIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {completedStats.totalCount}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Audited &amp; archived
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      SETTLED REVENUE
                    </p>
                    <span className="text-emerald-500">
                      <ZapIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    €{completedStats.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Cleared in registry
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      EXTENSIONS MONETIZED
                    </p>
                    <span className="text-amber-500">
                      <SparklesIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {completedStats.withExtensions}
                  </p>
                  <p className="text-[11px] font-medium text-amber-500">
                    Additional daily charges
                  </p>
                </div>

                <div
                  className={`border p-3 sm:p-5 rounded-xl flex flex-col justify-between min-h-[88px] sm:min-h-[120px] transition ${
                    isDark
                      ? "bg-[#17191C] border-stone-800 shadow-md"
                      : "bg-white border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                      RETURN AUDIT PASS
                    </p>
                    <span className="text-sky-500">
                      <ShieldIcon size={14} />
                    </span>
                  </div>
                  <p className="text-xl sm:text-3xl font-black font-mono my-0.5 sm:my-1 text-stone-900 dark:text-white">
                    {completedStats.passRate}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Zero dispute rate
                  </p>
                </div>
              </>
            )}
          </section>

          {/* ========================================================
            TAB: COMPLETED ORDERS & INVOICE ARCHIVE
            ======================================================== */}
          {activeTab === "completed" && (
            <section
              className={`border rounded-xl sm:rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              {/* Completed Toolbar */}
              <div
                className={`p-3 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                {/* Search Bar */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <SearchIcon
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="text"
                      value={completedSearchQuery}
                      onChange={(e) => setCompletedSearchQuery(e.target.value)}
                      placeholder="Search ID, customer, phone, plate..."
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                          : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Filter Controls: Date Range, Categories, View Toggle, Export */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Range Selector */}
                  <div
                    className={`flex items-center rounded-xl p-1 border ${
                      isDark
                        ? "bg-stone-900 border-stone-800"
                        : "bg-stone-100/80 border-stone-200"
                    }`}
                  >
                    {[
                      { id: "all", label: "All Time" },
                      { id: "7d", label: "7 Days" },
                      { id: "30d", label: "30 Days" },
                      { id: "month", label: "This Month" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCompletedDateFilter(d.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          completedDateFilter === d.id
                            ? isDark
                              ? "bg-stone-800 text-white shadow-2xs"
                              : "bg-white text-stone-900 shadow-2xs"
                            : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter Pills */}
                  <div
                    className={`hidden sm:flex items-center rounded-xl p-1 border ${
                      isDark
                        ? "bg-stone-900 border-stone-800"
                        : "bg-stone-100/80 border-stone-200"
                    }`}
                  >
                    {["all", "Sedan", "SUV", "Luxury"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCompletedCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                          completedCategoryFilter === cat
                            ? isDark
                              ? "bg-stone-800 text-white shadow-2xs"
                              : "bg-white text-stone-900 shadow-2xs"
                            : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        }`}
                      >
                        {cat === "all" ? "All Classes" : cat}
                      </button>
                    ))}
                  </div>

                  {/* View Mode Toggle: Cards vs Table */}
                  <div
                    className={`flex items-center rounded-xl p-1 border ${
                      isDark
                        ? "bg-stone-900 border-stone-800"
                        : "bg-stone-100/80 border-stone-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCompletedViewMode("cards")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        completedViewMode === "cards"
                          ? isDark
                            ? "bg-stone-800 text-white shadow-2xs"
                            : "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                      }`}
                      title="Card view"
                    >
                      <GridIcon size={13} />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletedViewMode("table")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        completedViewMode === "table"
                          ? isDark
                            ? "bg-stone-800 text-white shadow-2xs"
                            : "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                      }`}
                      title="Spreadsheet table view"
                    >
                      <ListIcon size={13} />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>

                  {/* Export CSV Button */}
                  <button
                    type="button"
                    onClick={handleExportCompletedCsv}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? "bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 shadow-2xs"
                    }`}
                    title="Export CSV spreadsheet"
                  >
                    <DownloadIcon size={13} />
                    <span className="hidden md:inline">Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Completed Body Content */}
              {filteredCompletedBookings.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 border ${
                      isDark
                        ? "bg-stone-900 border-stone-800 text-stone-600"
                        : "bg-stone-100 border-stone-200 text-stone-400"
                    }`}
                  >
                    <FileTextIcon size={26} />
                  </div>
                  <h4
                    className={`text-base font-bold font-heading ${
                      isDark ? "text-stone-200" : "text-stone-800"
                    }`}
                  >
                    No Completed Orders Found
                  </h4>
                  <p
                    className={`text-xs mt-1 max-w-md mx-auto ${
                      isDark ? "text-stone-500" : "text-stone-500"
                    }`}
                  >
                    {completedSearchQuery
                      ? "No records matched your search filter. Clear the search query to see all completed trip archives."
                      : "When returned reservations complete audit and payment settlement, their official invoices and inspection receipts will appear here automatically."}
                  </p>
                  {completedSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCompletedSearchQuery("")}
                      className="mt-4 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : completedViewMode === "cards" ? (
                /* Card View Grid */
                <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {filteredCompletedBookings.map((b) => {
                    const car = cars.find((c) => c.id === b.matchedCarId)
                    const customerName =
                      (b.customer as any).name ||
                      `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim() ||
                      "Verified Client"
                    const isExtension =
                      b.extensionStatus === "Approved" ||
                      Boolean(b.extensionQuote) ||
                      (b.notes && b.notes.includes("Extended"))

                    return (
                      <div
                        key={b.id}
                        className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition hover:shadow-md ${
                          isDark
                            ? "bg-stone-900/70 border-stone-800 hover:border-stone-700"
                            : "bg-stone-50/70 border-stone-200/90 hover:border-orange-200"
                        }`}
                      >
                        {/* Header Row: ID, Badges, Total Amount */}
                        <div>
                          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs tracking-wider text-stone-900 dark:text-white">
                                {b.id}
                              </span>
                              {b.notes?.includes("WALK-IN") ||
                              b.pickupLocation?.includes("Walk-In") ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  WALK-IN
                                </span>
                              ) : null}
                              {b.promoCode && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  {b.promoCode}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Completed
                              </span>
                              {b.checklistIn?.damageFound ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Damage (
                                  {b.checklistIn.damagePhotos?.length || 0}{" "}
                                  Photos)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Clean Audit
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-sm text-stone-900 dark:text-white">
                                €{Number(b.totalAmount || 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                                Settled
                              </span>
                            </div>
                          </div>

                          {/* Extension Banner */}
                          {isExtension && (
                            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                              <CheckIcon
                                size={14}
                                className="shrink-0 text-emerald-500"
                              />
                              <span className="truncate">
                                {b.notes?.includes("Extended")
                                  ? b.notes
                                  : "Extension Approved (+1 days)"}
                              </span>
                            </div>
                          )}

                          {/* Client Info Block */}
                          <div className="mt-3.5 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[#F97316] font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-800">
                              {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                {customerName}
                              </h5>
                              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                                {b.customer.phone || "+1 (555) 000-0000"} •{" "}
                                {b.customer.email}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                                    isDark
                                      ? "bg-stone-800 text-stone-300 border-stone-700"
                                      : "bg-stone-100 text-stone-700 border-stone-200"
                                  }`}
                                >
                                  Lic:{" "}
                                  {b.driver?.licenseNumber || "FL-VERIFIED"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Paired Vehicle Block */}
                          <div
                            className={`mt-3.5 p-3 rounded-xl border flex items-center gap-3 ${
                              isDark
                                ? "bg-stone-900/80 border-stone-800"
                                : "bg-white border-stone-200/80 shadow-2xs"
                            }`}
                          >
                            <div className="w-12 h-9 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
                              <img
                                src={car?.image || DEFAULT_FALLBACK_IMAGE}
                                alt={car?.name || "Vehicle"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h6 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                {car?.name ||
                                  b.requestedCategory ||
                                  "Fleet Vehicle"}
                              </h6>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                                  {car?.plateNumber || "FL-908-MTR"}
                                </span>
                                <span className="text-[10px] text-stone-400 truncate">
                                  {car?.garageBay || "Bay 5-C"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Dates Timeline */}
                          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono">
                            <div
                              className={`p-2.5 rounded-xl border ${
                                isDark
                                  ? "bg-stone-900/50 border-stone-800"
                                  : "bg-stone-100/70 border-stone-200/60"
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-wider text-stone-400 block mb-0.5">
                                Picked Up
                              </span>
                              <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate block">
                                {b.pickupDate}
                              </span>
                            </div>
                            <div
                              className={`p-2.5 rounded-xl border ${
                                isDark
                                  ? "bg-stone-900/50 border-stone-800"
                                  : "bg-stone-100/70 border-stone-200/60"
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-wider text-stone-400 block mb-0.5">
                                Returned &amp; Audited
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                                {b.returnDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-3.5 border-t border-stone-200/70 dark:border-stone-800/70 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceBooking(b)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileTextIcon size={14} />
                            <span>View &amp; Print Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectedBooking(b)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                              b.checklistIn?.damageFound
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30"
                                : isDark
                                  ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                                  : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs"
                            }`}
                            title="Inspect vehicle return sheet & damage photos"
                          >
                            <ShieldIcon
                              size={13}
                              className={
                                b.checklistIn?.damageFound
                                  ? "text-rose-500"
                                  : "text-emerald-500"
                              }
                            />
                            <span>
                              {b.checklistIn?.damageFound ? "Damage" : "Audit"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceBooking(b)}
                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                              isDark
                                ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                                : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs"
                            }`}
                            title="Download PNG invoice"
                          >
                            <DownloadIcon size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Spreadsheet Table View */
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-xs border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                          isDark
                            ? "bg-stone-900/80 border-stone-800 text-stone-400"
                            : "bg-stone-50/90 border-stone-200 text-stone-500"
                        }`}
                      >
                        <th className="px-5 py-3.5 w-36 whitespace-nowrap">
                          Invoice ID
                        </th>
                        <th className="px-5 py-3.5 w-52 whitespace-nowrap">
                          Customer Client
                        </th>
                        <th className="px-5 py-3.5 w-48 whitespace-nowrap">
                          Vehicle &amp; Plate
                        </th>
                        <th className="px-5 py-3.5 w-60 whitespace-nowrap">
                          Rental Timeline
                        </th>
                        <th className="px-5 py-3.5 w-32 text-right whitespace-nowrap">
                          Settled Total
                        </th>
                        <th className="px-5 py-3.5 w-44 text-center whitespace-nowrap">
                          Invoice Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y font-sans ${
                        isDark ? "divide-stone-800/60" : "divide-stone-100"
                      }`}
                    >
                      {filteredCompletedBookings.map((b) => {
                        const car = cars.find((c) => c.id === b.matchedCarId)
                        const customerName =
                          (b.customer as any).name ||
                          `${b.customer.firstName || ""} ${b.customer.lastName || ""}`.trim() ||
                          "Verified Client"
                        const isExtension =
                          b.extensionStatus === "Approved" ||
                          Boolean(b.extensionQuote) ||
                          (b.notes && b.notes.includes("Extended"))

                        return (
                          <tr
                            key={b.id}
                            className={`transition ${
                              isDark
                                ? "hover:bg-stone-800/40 border-stone-800/60"
                                : "hover:bg-orange-50/30 border-stone-100"
                            }`}
                          >
                            {/* Invoice ID */}
                            <td className="px-5 py-3.5 align-middle">
                              <span className="font-mono font-bold text-xs text-stone-900 dark:text-white block">
                                {b.id}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-block">
                                  COMPLETED
                                </span>
                                {b.checklistIn?.damageFound ? (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 inline-block">
                                    DAMAGE (
                                    {b.checklistIn.damagePhotos?.length || 0})
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block">
                                    CLEAN
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="px-5 py-3.5 align-middle">
                              <div className="font-bold text-xs text-stone-900 dark:text-white">
                                {customerName}
                              </div>
                              <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                                {b.customer.phone || "+1 (555) 000-0000"}
                              </div>
                              <div className="text-[10px] text-stone-400 truncate max-w-[190px]">
                                {b.customer.email}
                              </div>
                            </td>

                            {/* Vehicle */}
                            <td className="px-5 py-3.5 align-middle">
                              <div className="font-bold text-xs text-stone-900 dark:text-white">
                                {car?.name ||
                                  b.requestedCategory ||
                                  "Fleet Vehicle"}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                                  {car?.plateNumber || "FL-908-MTR"}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  {car?.garageBay || "Bay 5-C"}
                                </span>
                              </div>
                            </td>

                            {/* Timeline */}
                            <td className="px-5 py-3.5 align-middle">
                              <div className="font-mono text-[11px] text-stone-800 dark:text-stone-200">
                                {b.pickupDate} → {b.returnDate}
                              </div>
                              {isExtension && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block mt-1">
                                  +1 Day Extension Approved
                                </span>
                              )}
                            </td>

                            {/* Settled Total */}
                            <td className="px-5 py-3.5 align-middle text-right">
                              <span className="font-mono font-black text-sm text-stone-900 dark:text-white block">
                                €{Number(b.totalAmount || 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Paid &amp; Settled
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 align-middle text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceBooking(b)}
                                  className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="View and print official tax invoice"
                                >
                                  <FileTextIcon size={13} />
                                  <span>Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectedBooking(b)}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    b.checklistIn?.damageFound
                                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30"
                                      : isDark
                                        ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                                        : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs"
                                  }`}
                                  title="Inspect return check & damage photos"
                                >
                                  <ShieldIcon
                                    size={12}
                                    className={
                                      b.checklistIn?.damageFound
                                        ? "text-rose-500"
                                        : "text-emerald-500"
                                    }
                                  />
                                  <span>
                                    {b.checklistIn?.damageFound
                                      ? "Damage"
                                      : "Audit"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceBooking(b)}
                                  className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                    isDark
                                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                                      : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs"
                                  }`}
                                  title="View and Download Invoice (PNG and PDF)"
                                >
                                  <DownloadIcon size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ========================================================
            TAB 1: RESERVATION MANIFEST & MATING
            ======================================================== */}
          {activeTab === "manifest" && (
            <section
              className={`border rounded-xl sm:rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              {/* Manifest Toolbar: 2-Tier Structured Layout (No Cutoffs, All Chips Immediately Visible) */}
              <div
                className={`p-3 sm:p-4 lg:p-5 border-b space-y-3 ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                {/* Row 1: Search Bar (Left) + View Switcher & Walk-In Button (Right) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <SearchIcon
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="text"
                      value={manifestSearch}
                      onChange={(e) => setManifestSearch(e.target.value)}
                      placeholder="Search ID, customer, phone, car..."
                      className={`w-full pl-9.5 pr-8 py-2 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                          : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                      }`}
                    />
                    {manifestSearch && (
                      <button
                        type="button"
                        onClick={() => setManifestSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Actions: View Switcher (Cards vs Table) + Direct Walk-In CTA */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setManifestViewMode("cards")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          manifestViewMode === "cards"
                            ? "bg-white dark:bg-stone-800 text-[#F97316] shadow-xs"
                            : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                        }`}
                        title="Card Grid View"
                      >
                        <GridIcon size={13} />
                        <span>Cards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManifestViewMode("table")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          manifestViewMode === "table"
                            ? "bg-white dark:bg-stone-800 text-[#F97316] shadow-xs"
                            : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                        }`}
                        title="Compact Table View"
                      >
                        <ListIcon size={13} />
                        <span>Table</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("walkin")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
                        isDark
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs"
                      }`}
                    >
                      <ZapIcon size={14} className="text-amber-500" />
                      <span>+ Direct Walk-In</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Status Filter Chips with flex-wrap - ALL visible on first load without scrolling! */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-stone-100 dark:border-stone-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-400 dark:text-stone-500 mr-1 hidden sm:inline">
                    Status:
                  </span>
                  {[
                    {
                      id: "all",
                      label: "All Reservations",
                      count: manifestCounts.all,
                    },
                    {
                      id: "extensions",
                      label: "Extensions",
                      count: manifestCounts.extensions,
                      hasBadge: manifestCounts.extensions > 0,
                      isAmber: true,
                    },
                    {
                      id: "needs-car",
                      legacyId: "Pending Assignment",
                      label: "Needs Car",
                      count: manifestCounts.pending,
                      hasBadge: manifestCounts.pending > 0,
                    },
                    {
                      id: "confirmed",
                      legacyId: "Assigned",
                      label: "Confirmed",
                      count: manifestCounts.confirmed,
                    },
                    {
                      id: "active",
                      legacyId: "Checked Out",
                      label: "Active Trips",
                      count: manifestCounts.active,
                    },
                    {
                      id: "returned",
                      legacyId: "Returned",
                      label: "Returned",
                      count: manifestCounts.returned,
                    },
                    {
                      id: "completed",
                      legacyId: "Completed",
                      label: "Completed",
                      count: manifestCounts.completed,
                    },
                  ].map((s) => {
                    const isSelected =
                      manifestStatusFilter === s.id ||
                      manifestStatusFilter === (s as any).legacyId

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setManifestStatusFilter(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
                          isSelected
                            ? "bg-[#F97316] text-white shadow-md ring-2 ring-orange-400/40"
                            : (s as any).isAmber && (s as any).count > 0
                              ? isDark
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                              : isDark
                                ? "bg-stone-900 text-stone-300 hover:text-white border border-stone-800 hover:bg-stone-800/80"
                                : "bg-white text-stone-700 hover:text-stone-950 border border-stone-200 hover:bg-stone-100/80"
                        }`}
                      >
                        <span>{s.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : s.hasBadge
                                ? "bg-amber-500 text-stone-950 font-black animate-pulse"
                                : isDark
                                  ? "bg-stone-800 text-stone-400"
                                  : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {s.count}
                        </span>
                      </button>
                    )
                  })}

                  {/* Quick Reset Button if filter or search is active */}
                  {(manifestStatusFilter !== "all" || manifestSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setManifestStatusFilter("all")
                        setManifestSearch("")
                      }}
                      className="ml-auto text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Cards Container (< lg screens) */}
              <div className="block lg:hidden p-2 sm:p-3.5 space-y-2.5 sm:space-y-3.5">
                {filteredBookings.length === 0 ? (
                  <div
                    className={`py-12 text-center text-xs ${
                      isDark ? "text-stone-500" : "text-stone-500 font-medium"
                    }`}
                  >
                    No reservations match the filter criteria.
                  </div>
                ) : (
                  filteredBookings.map((b) => {
                    const matedCar = cars.find((c) => c.id === b.matchedCarId)

                    const isWalkIn =
                      b.id.startsWith("MTR-") ||
                      b.createdAt?.toLowerCase().includes("counter dispatch") ||
                      b.createdAt?.toLowerCase().includes("walk-in")

                    const initials =
                      (b.customer?.firstName?.[0] || "C") +
                      (b.customer?.lastName?.[0] || "")

                    const cleanLocation = getCleanHubAddress(b.pickupLocation)

                    const formattedAmount = Number(
                      b.totalAmount || 0,
                    ).toLocaleString("en-IE", {
                      style: "currency",

                      currency: "EUR",
                    })

                    const isPendingReview =
                      !b.approvedByAdmin &&
                      b.status !== "Cancelled" &&
                      b.status !== "Completed" &&
                      b.status !== "Checked Out" &&
                      b.status !== "Returned"

                    return (
                      <div
                        key={b.id}
                        onClick={() => setInspectedBooking(b)}
                        className={`group p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-2.5 shadow-2xs hover:shadow-md ${
                          isDark
                            ? "bg-stone-900/90 border-stone-800 hover:border-orange-500/50"
                            : "bg-white border-stone-200/90 hover:border-orange-400 hover:bg-orange-50/10"
                        }`}
                      >
                        {/* Top Header Row: ID, Lifecycle Badge & Total Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-extrabold text-xs text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-[#F97316] transition-colors">
                                {b.id}
                              </span>
                              {isWalkIn && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Walk-In
                                </span>
                              )}
                              {b.promoCode && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  {b.promoCode}
                                </span>
                              )}
                            </div>

                            <div>
                              {isPendingReview ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Pending Review
                                </span>
                              ) : b.status === "Assigned" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Confirmed (Ready)
                                </span>
                              ) : b.status === "Pending Assignment" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  {b.approvedByAdmin
                                    ? "Approved (Assign Car)"
                                    : "Pending Mating"}
                                </span>
                              ) : b.status === "Checked Out" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  Active Trip
                                </span>
                              ) : b.status === "Returned" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                  Returned
                                </span>
                              ) : b.status === "Completed" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700">
                                  Completed
                                </span>
                              ) : b.status === "Cancelled" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                  Declined
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700">
                                  {b.status}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-sm sm:text-base text-[#F97316] block leading-tight">
                              {formattedAmount}
                            </span>
                            <span className="text-[10px] font-medium text-stone-400 block mt-0.5">
                              {b.status === "Completed"
                                ? "Settled"
                                : "Pay on pickup"}
                            </span>
                          </div>
                        </div>

                        {/* Flow F: Extension Request Alert Banner on Card */}
                        {(b.extensionStatus === "Requested" ||
                          b.extensionStatus === "Pending") && (
                          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 animate-pulse">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ClockIcon
                                size={14}
                                className="text-amber-600 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-[11px] leading-tight">
                                  Extension Requested: +
                                  {b.extensionRequest?.durationValue ??
                                    b.extensionRequest?.extraDuration ??
                                    1}{" "}
                                  {b.extensionRequest?.durationUnit ??
                                    b.extensionRequest?.unit ??
                                    "days"}
                                </p>
                                {b.extensionRequest?.customerNotes && (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                                    &quot;{b.extensionRequest.customerNotes}
                                    &quot;
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenExtensionQuote(b)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[10px] shrink-0 shadow-xs cursor-pointer"
                            >
                              Quote
                            </button>
                          </div>
                        )}
                        {b.extensionStatus === "Quoted" && (
                          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-[11px] flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold flex items-center gap-1">
                                <SparklesIcon
                                  size={13}
                                  className="text-sky-500 shrink-0"
                                />
                                Quoted: €{b.extensionQuote?.totalQuotedAmount}{" "}
                                (€{b.extensionQuote?.rateAmount}/
                                {b.extensionQuote?.rateType})
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                                Awaiting customer approval in app
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenExtensionQuote(b)
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold border border-sky-400 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer shrink-0"
                            >
                              Re-Quote
                            </button>
                          </div>
                        )}
                        {b.extensionStatus === "Approved" && (
                          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
                            <CheckIcon
                              size={12}
                              className="text-emerald-500 shrink-0"
                            />
                            <span>
                              Extension Approved (+
                              {b.extensionRequest?.durationValue ?? 1}{" "}
                              {b.extensionRequest?.durationUnit ?? "days"}) •
                              Extended to {b.returnDate}
                            </span>
                          </div>
                        )}

                        {/* Customer Profile Row */}
                        <div className="flex items-center justify-between gap-2.5 pt-0.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-[#F97316] font-extrabold text-xs flex items-center justify-center shrink-0 border border-orange-500/20">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                {b.customer?.firstName} {b.customer?.lastName}
                              </h4>
                              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
                                {b.customer?.phone ||
                                  b.customer?.email ||
                                  "No contact info"}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 shrink-0">
                            {b.requestedCategory || "Vehicle"}
                          </span>
                        </div>

                        {/* Vehicle Tile */}
                        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-2.5">
                          {matedCar ? (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={matedCar.image}
                                alt={matedCar.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null

                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80"
                                }}
                                className="w-12 h-9 rounded-lg object-cover shrink-0 border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-stone-900 dark:text-white truncate block">
                                  {matedCar.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100/90 text-amber-800 border border-amber-200/80">
                                    {matedCar.plateNumber}
                                  </span>
                                  <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                                    {matedCar.garageBay || "Bay 1"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
                                <AlertTriangleIcon
                                  size={13}
                                  className="text-amber-500 inline"
                                />
                                <span>Vehicle unassigned</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()

                                  handleAutoMate(b)
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <ZapIcon size={12} />
                                <span>Auto-Assign</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Schedule & Location Block */}
                        <div className="rounded-xl bg-stone-50/60 dark:bg-stone-800/30 border border-stone-200/60 dark:border-stone-800/80 p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-stone-800 dark:text-stone-200 flex-wrap gap-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CalendarIcon
                                size={13}
                                className="text-[#F97316] shrink-0"
                              />
                              <span>{b.pickupDate}</span>
                            </div>
                            <span className="text-stone-400 font-bold text-[11px]">
                              →
                            </span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <ClockIcon
                                size={13}
                                className="text-stone-400 shrink-0"
                              />
                              <span>{b.returnDate}</span>
                            </div>
                            {getBookingDurationInfo(b.pickupDate, b.returnDate)
                              .hours < 24 && (
                              <span className="text-[9.5px] font-black text-[#F97316] bg-orange-100/90 dark:bg-orange-950/60 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-900/60 shrink-0">
                                <ZapIcon
                                  size={13}
                                  className="text-[#F97316] inline"
                                />{" "}
                                {
                                  getBookingDurationInfo(
                                    b.pickupDate,
                                    b.returnDate,
                                  ).label
                                }
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <LocationIcon
                                size={12}
                                className="text-[#F97316]/70 shrink-0"
                              />
                              <span className="truncate">{cleanLocation}</span>
                            </div>
                            <a
                              href={getGoogleMapsUrl(
                                cleanLocation,
                                studioContact.google_maps_url,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold text-[10px] shrink-0 flex items-center gap-0.5 hover:underline cursor-pointer ml-1"
                              title="Open location on Google Maps"
                            >
                              <span>Maps</span>
                            </a>
                          </div>
                        </div>

                        {/* Trip Purpose Banner */}
                        {(b.tripReason || b.notes) && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/40 text-[11px]">
                            <span className="text-[#F97316] font-bold">✈️ Purpose:</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                              {b.tripReason || b.notes}
                            </span>
                          </div>
                        )}

                        {/* Action Toolbar: Structured 2-Row Layout Preventing Overlap */}
                        <div
                          className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-col gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Row 1: Primary Lifecycle CTA */}
                          <div className="w-full">
                            {isPendingReview ? (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleApproveBooking(b.id)}
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  title="Accept reservation request"
                                >
                                  <CheckIcon size={13} />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineBooking(b.id)}
                                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs transition cursor-pointer whitespace-nowrap text-center"
                                  title="Decline reservation request"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : !isPendingReview && b.status === "Pending Assignment" ? (
                              <button
                                type="button"
                                onClick={() => handleAutoMate(b)}
                                className="w-full py-2 px-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <ZapIcon size={13} />
                                <span>Auto-Assign Vehicle</span>
                              </button>
                            ) : !isPendingReview && b.status === "Assigned" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenKeyHandoff(b)}
                                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <KeyIcon size={13} className="text-amber-400" />
                                <span>Handover Keys</span>
                              </button>
                            ) : (b.extensionStatus === "Requested" || b.extensionStatus === "Pending") ? (
                              <button
                                type="button"
                                onClick={() => handleOpenExtensionQuote(b)}
                                className="w-full py-2 px-3.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                              >
                                <ZapIcon size={13} />
                                <span>Quote Extension</span>
                              </button>
                            ) : b.extensionStatus === "Quoted" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenExtensionQuote(b)}
                                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <SparklesIcon size={13} />
                                <span>Modify Quote</span>
                              </button>
                            ) : b.status === "Checked Out" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReturnInspection(b)}
                                className="w-full py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <FlagIcon size={13} className="text-purple-300" />
                                <span>Return Inspection</span>
                              </button>
                            ) : b.status === "Returned" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReturnInspection(b)}
                                className="w-full py-2 px-3.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckIcon size={13} />
                                <span>Verify Audit</span>
                              </button>
                            ) : (
                              <div className="py-1 px-3 text-center text-xs font-mono text-stone-400">
                                {b.status === "Completed" ? "✓ Trip Concluded" : "Reservation Active"}
                              </div>
                            )}
                          </div>

                          {/* Row 2: Secondary Utility CTAs: Invoice & Details */}
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceBooking(b)}
                              className="py-1.5 px-3 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200 dark:border-stone-700"
                              title="View & Download Official Invoice (PNG / PDF)"
                            >
                              <DownloadIcon size={13} className="text-stone-500" />
                              <span>Invoice</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectedBooking(b)}
                              className="py-1.5 px-3 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200 dark:border-stone-700"
                            >
                              <span>Details</span>
                              <ArrowRightIcon size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Desktop Views (>= lg screens): Cards Grid OR Spreadsheet Table */}
              {manifestViewMode === "cards" ? (
                <div className="hidden lg:block p-4 sm:p-5">
                  {filteredBookings.length === 0 ? (
                    <div
                      className={`py-16 text-center text-xs ${
                        isDark ? "text-stone-500" : "text-stone-400 font-medium"
                      }`}
                    >
                      No reservations match the filter criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                      {filteredBookings.map((b) => {
                        const matedCar = cars.find(
                          (c) => c.id === b.matchedCarId,
                        )

                        const isWalkIn =
                          b.id.startsWith("MTR-") ||
                          b.createdAt

                            ?.toLowerCase()

                            .includes("counter dispatch") ||
                          b.createdAt?.toLowerCase().includes("walk-in")

                        const initials =
                          (b.customer?.firstName?.[0] || "C") +
                          (b.customer?.lastName?.[0] || "")

                        const cleanLocation = getCleanHubAddress(b.pickupLocation)

                        const formattedAmount = Number(
                          b.totalAmount || 0,
                        ).toLocaleString("en-IE", {
                          style: "currency",

                          currency: "EUR",
                        })

                        const isPendingReview =
                          !b.approvedByAdmin &&
                          b.status !== "Cancelled" &&
                          b.status !== "Completed" &&
                          b.status !== "Checked Out" &&
                          b.status !== "Returned"

                        return (
                          <div
                            key={b.id}
                            onClick={() => setInspectedBooking(b)}
                            className={`group p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 shadow-2xs hover:shadow-md ${
                              isDark
                                ? "bg-stone-900/90 border-stone-800 hover:border-orange-500/50 hover:bg-stone-900"
                                : "bg-white border-stone-200/90 hover:border-orange-400 hover:bg-orange-50/10"
                            }`}
                          >
                            {/* Top Header Row: ID, Lifecycle Pill & Total Amount */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-extrabold text-xs text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-[#F97316] transition-colors">
                                    {b.id}
                                  </span>
                                  {isWalkIn && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      Walk-In
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isPendingReview ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Pending Review
                                    </span>
                                  ) : b.status === "Assigned" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Confirmed (Ready)
                                    </span>
                                  ) : b.status === "Pending Assignment" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      {b.approvedByAdmin
                                        ? "Approved (Assign Car)"
                                        : "Pending Mating"}
                                    </span>
                                  ) : b.status === "Checked Out" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                      Active Trip
                                    </span>
                                  ) : b.status === "Returned" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                      Returned
                                    </span>
                                  ) : b.status === "Completed" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700">
                                      Completed
                                    </span>
                                  ) : b.status === "Cancelled" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                      Declined
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700">
                                      {b.status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono font-black text-base text-[#F97316] block leading-tight">
                                  {formattedAmount}
                                </span>
                                <span className="text-[10px] font-medium text-stone-400 block mt-0.5">
                                  {b.status === "Completed"
                                    ? "Settled"
                                    : "Pay on pickup"}
                                </span>
                              </div>
                            </div>

                            {/* Flow F: Extension Request Alert Banner on Card */}
                            {(b.extensionStatus === "Requested" ||
                              b.extensionStatus === "Pending") && (
                              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 animate-pulse">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <ClockIcon
                                    size={14}
                                    className="text-amber-600 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-bold text-[11px] leading-tight">
                                      Extension Requested: +
                                      {b.extensionRequest?.durationValue ??
                                        b.extensionRequest?.extraDuration ??
                                        1}{" "}
                                      {b.extensionRequest?.durationUnit ??
                                        b.extensionRequest?.unit ??
                                        "days"}
                                    </p>
                                    {b.extensionRequest?.customerNotes && (
                                      <p className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                                        &quot;{b.extensionRequest.customerNotes}
                                        &quot;
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenExtensionQuote(b)
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[10px] shrink-0 shadow-xs cursor-pointer"
                                >
                                  Quote
                                </button>
                              </div>
                            )}
                            {b.extensionStatus === "Quoted" && (
                              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-[11px] flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-bold flex items-center gap-1">
                                    <SparklesIcon
                                      size={13}
                                      className="text-sky-500 shrink-0"
                                    />
                                    Quoted: €
                                    {b.extensionQuote?.totalQuotedAmount} (€
                                    {b.extensionQuote?.rateAmount}/
                                    {b.extensionQuote?.rateType})
                                  </span>
                                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                                    Awaiting customer approval in app
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenExtensionQuote(b)
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold border border-sky-400 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer shrink-0"
                                >
                                  Re-Quote
                                </button>
                              </div>
                            )}
                            {b.extensionStatus === "Approved" && (
                              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
                                <CheckIcon
                                  size={12}
                                  className="text-emerald-500 shrink-0"
                                />
                                <span>
                                  Extension Approved (+
                                  {b.extensionRequest?.durationValue ?? 1}{" "}
                                  {b.extensionRequest?.durationUnit ?? "days"})
                                  • Extended to {b.returnDate}
                                </span>
                              </div>
                            )}

                            {/* Customer Profile Row */}
                            <div className="flex items-center justify-between gap-2.5 pt-0.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-[#F97316] font-extrabold text-xs flex items-center justify-center shrink-0 border border-orange-500/20">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                    {b.customer?.firstName}{" "}
                                    {b.customer?.lastName}
                                  </h4>
                                  <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
                                    {b.customer?.phone ||
                                      b.customer?.email ||
                                      "No contact info"}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 shrink-0">
                                {b.requestedCategory || "Vehicle"}
                              </span>
                            </div>

                            {/* Vehicle Tile */}
                            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-2.5">
                              {matedCar ? (
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={matedCar.image}
                                    alt={matedCar.name}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null

                                      e.currentTarget.src =
                                        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80"
                                    }}
                                    className="w-12 h-9 rounded-lg object-cover shrink-0 border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-xs text-stone-900 dark:text-white truncate block">
                                      {matedCar.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100/90 text-amber-800 border border-amber-200/80">
                                        {matedCar.plateNumber}
                                      </span>
                                      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                                        {matedCar.garageBay || "Bay 1"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
                                    <AlertTriangleIcon
                                      size={13}
                                      className="text-amber-500 inline"
                                    />
                                    <span>Vehicle unassigned</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      handleAutoMate(b)
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                                  >
                                    <ZapIcon size={12} />
                                    <span>Auto-Assign</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Schedule & Location Block */}
                            <div className="rounded-xl bg-stone-50/60 dark:bg-stone-800/30 border border-stone-200/60 dark:border-stone-800/80 p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-stone-800 dark:text-stone-200 flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <CalendarIcon
                                    size={13}
                                    className="text-[#F97316] shrink-0"
                                  />
                                  <span>{b.pickupDate}</span>
                                </div>
                                <span className="text-stone-400 font-bold text-[11px]">
                                  →
                                </span>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <ClockIcon
                                    size={13}
                                    className="text-stone-400 shrink-0"
                                  />
                                  <span>{b.returnDate}</span>
                                </div>
                                {getBookingDurationInfo(
                                  b.pickupDate,
                                  b.returnDate,
                                ).hours < 24 && (
                                  <span className="text-[9.5px] font-black text-[#F97316] bg-orange-100/90 dark:bg-orange-950/60 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-900/60 shrink-0">
                                    <ZapIcon
                                      size={11}
                                      className="inline text-[#F97316]"
                                    />{" "}
                                    {
                                      getBookingDurationInfo(
                                        b.pickupDate,
                                        b.returnDate,
                                      ).label
                                    }
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <LocationIcon
                                    size={12}
                                    className="text-[#F97316]/70 shrink-0"
                                  />
                                  <span className="truncate">
                                    {cleanLocation}
                                  </span>
                                </div>
                                <a
                                  href={getGoogleMapsUrl(
                                    cleanLocation,
                                    studioContact.google_maps_url,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold text-[10px] shrink-0 flex items-center gap-0.5 hover:underline cursor-pointer ml-1"
                                  title="Open location on Google Maps"
                                >
                                  <span>Maps</span>
                                </a>
                              </div>
                            </div>

                            {/* Action Toolbar: Structured 2-Row Layout Preventing Overlap */}
                            <div
                              className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-col gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Row 1: Primary Lifecycle CTA */}
                              <div className="w-full">
                                {isPendingReview ? (
                                  <div className="grid grid-cols-2 gap-2 w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveBooking(b.id)}
                                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                      title="Accept reservation request"
                                    >
                                      <CheckIcon size={13} />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeclineBooking(b.id)}
                                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs transition cursor-pointer whitespace-nowrap text-center"
                                      title="Decline reservation request"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : !isPendingReview && b.status === "Pending Assignment" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAutoMate(b)}
                                    className="w-full py-2 px-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <ZapIcon size={13} />
                                    <span>Auto-Assign Vehicle</span>
                                  </button>
                                ) : !isPendingReview && b.status === "Assigned" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenKeyHandoff(b)}
                                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <KeyIcon size={13} className="text-amber-400" />
                                    <span>Handover Keys</span>
                                  </button>
                                ) : (b.extensionStatus === "Requested" || b.extensionStatus === "Pending") ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenExtensionQuote(b)}
                                    className="w-full py-2 px-3.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                                  >
                                    <ZapIcon size={13} />
                                    <span>Quote Extension</span>
                                  </button>
                                ) : b.extensionStatus === "Quoted" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenExtensionQuote(b)}
                                    className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <SparklesIcon size={13} />
                                    <span>Modify Quote</span>
                                  </button>
                                ) : b.status === "Checked Out" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnInspection(b)}
                                    className="w-full py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <FlagIcon size={13} className="text-purple-300" />
                                    <span>Return Inspection</span>
                                  </button>
                                ) : b.status === "Returned" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnInspection(b)}
                                    className="w-full py-2 px-3.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckIcon size={13} />
                                    <span>Verify Audit</span>
                                  </button>
                                ) : (
                                  <div className="py-1 px-3 text-center text-xs font-mono text-stone-400">
                                    {b.status === "Completed" ? "✓ Trip Concluded" : "Reservation Active"}
                                  </div>
                                )}
                              </div>

                              {/* Row 2: Secondary Utility CTAs: Invoice & Details */}
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceBooking(b)}
                                  className="py-1.5 px-3 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200 dark:border-stone-700"
                                  title="View & Download Official Invoice (PNG / PDF)"
                                >
                                  <DownloadIcon size={13} className="text-stone-500" />
                                  <span>Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectedBooking(b)}
                                  className="py-1.5 px-3 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200 dark:border-stone-700"
                                >
                                  <span>Details</span>
                                  <ArrowRightIcon size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Manifest Table (Desktop >= lg screens) */

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                          isDark
                            ? "bg-stone-900/80 border-stone-800 text-stone-400"
                            : "bg-stone-50/90 border-stone-200 text-stone-500"
                        }`}
                      >
                        <th className="px-4 py-3.5 w-36 text-left">
                          Reservation
                        </th>
                        <th className="px-4 py-3.5 w-48 text-left">
                          Customer / Driver
                        </th>
                        <th className="px-4 py-3.5 w-56 text-left">
                          Pickup Hub & Dates
                        </th>
                        <th className="px-3 py-3.5 w-24 text-center">
                          Category
                        </th>
                        <th className="px-4 py-3.5 w-52 text-left">
                          Mated Vehicle
                        </th>
                        <th className="px-4 py-3.5 w-44 text-left">
                          Lifecycle &amp; Signals
                        </th>
                        <th className="px-4 py-3.5 w-28 text-right">Amount</th>
                        <th className="px-4 py-3.5 w-44 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y font-sans ${
                        isDark ? "divide-stone-800/60" : "divide-stone-100"
                      }`}
                    >
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className={`py-12 text-center text-xs ${
                              isDark ? "text-stone-500" : "text-stone-400"
                            }`}
                          >
                            No reservations match the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const matedCar = cars.find(
                            (c) => c.id === b.matchedCarId,
                          )

                          const isWalkIn =
                            b.id.startsWith("MTR-") ||
                            b.createdAt

                              ?.toLowerCase()

                              .includes("counter dispatch") ||
                            b.createdAt?.toLowerCase().includes("walk-in")

                          const cleanCreatedDate = b.createdAt
                            ? b.createdAt

                                .replace(/Counter Dispatch\s*\(/i, "")

                                .replace(/\)$/, "")

                                .trim()
                            : "Recently"

                          // Format location string cleanly without text blowout

                          const codeMatch =
                            b.pickupLocation?.match(/\(([A-Z]{3,4})\)/)

                          const airportCode = codeMatch ? codeMatch[1] : ""

                          const hubCleanName = (
                            b.pickupLocation || "Station Hub"
                          )

                            .replace(/\s*\([A-Z]{3,4}\)/, "")

                            .replace(/International Airport/i, "Intl")

                            .replace(/Airport/i, "Hub")

                            .trim()

                          return (
                            <tr
                              key={b.id}
                              onClick={() => setInspectedBooking(b)}
                              className={`cursor-pointer transition group ${
                                isDark
                                  ? "hover:bg-stone-800/50 border-stone-800/60"
                                  : "hover:bg-orange-50/40 border-stone-100"
                              }`}
                            >
                              {/* Col 1: ID & Date */}
                              <td className="px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono font-bold text-xs block group-hover:text-[#F97316] transition ${
                                      isDark ? "text-white" : "text-stone-900"
                                    }`}
                                  >
                                    {b.id}
                                  </span>
                                  {isWalkIn && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                      Walk-In
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-[11px] font-mono mt-0.5 whitespace-nowrap ${
                                    isDark ? "text-stone-400" : "text-stone-500"
                                  }`}
                                >
                                  {cleanCreatedDate}
                                </p>
                              </td>

                              {/* Col 2: Customer / Driver */}
                              <td className="px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                      isDark
                                        ? "bg-stone-800 text-stone-300 border border-stone-700"
                                        : "bg-orange-50 text-orange-700 border border-orange-200/80"
                                    }`}
                                  >
                                    {(b.customer.firstName?.[0] || "U") +
                                      (b.customer.lastName?.[0] || "")}
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      className={`font-semibold text-xs truncate max-w-[130px] ${
                                        isDark
                                          ? "text-stone-100"
                                          : "text-stone-900"
                                      }`}
                                      title={`${b.customer.firstName} ${b.customer.lastName}`}
                                    >
                                      {b.customer.firstName}{" "}
                                      {b.customer.lastName}
                                    </div>
                                    <div
                                      className="text-[11px] font-mono text-stone-400 truncate max-w-[130px]"
                                      title={
                                        b.customer.phone || b.customer.email
                                      }
                                    >
                                      {b.customer.phone ||
                                        b.customer.email ||
                                        "No contact"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Col 3: Route & Hub */}
                              <td className="px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-1.5 font-medium text-xs leading-tight">
                                  {airportCode && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                                        isDark
                                          ? "bg-stone-800 text-stone-200 border-stone-700"
                                          : "bg-stone-100 text-stone-700 border-stone-200"
                                      }`}
                                    >
                                      {airportCode}
                                    </span>
                                  )}
                                  <span
                                    className={`truncate max-w-[130px] ${
                                      isDark
                                        ? "text-stone-200"
                                        : "text-stone-800"
                                    }`}
                                    title={b.pickupLocation}
                                  >
                                    {hubCleanName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-1 whitespace-nowrap">
                                  <CalendarIcon
                                    size={12}
                                    className="text-stone-400 shrink-0"
                                  />
                                  <span>
                                    {b.pickupDate} → {b.returnDate}
                                  </span>
                                </div>
                              </td>

                              {/* Col 4: Category */}
                              <td className="px-3 py-3.5 align-middle text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-block ${
                                    b.requestedCategory === "SUV"
                                      ? isDark
                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : b.requestedCategory === "Luxury"
                                        ? isDark
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                        : b.requestedCategory === "Electric"
                                          ? isDark
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : isDark
                                            ? "bg-stone-800 text-stone-300 border-stone-700"
                                            : "bg-stone-100 text-stone-700 border-stone-200"
                                  }`}
                                >
                                  {b.requestedCategory || "Standard"}
                                </span>
                              </td>

                              {/* Col 5: Mated Car */}
                              <td className="px-4 py-3.5 align-middle">
                                {matedCar ? (
                                  <div>
                                    <div
                                      className={`font-bold text-xs truncate max-w-[170px] ${
                                        isDark
                                          ? "text-stone-200"
                                          : "text-stone-900"
                                      }`}
                                      title={matedCar.name}
                                    >
                                      {matedCar.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border inline-block shrink-0 ${
                                          isDark
                                            ? "bg-stone-800 text-amber-400 border-stone-700"
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                        }`}
                                      >
                                        {matedCar.plateNumber || "NO-PLATE"}
                                      </span>
                                      <span
                                        className={`text-[10px] font-mono truncate max-w-[110px] ${
                                          isDark
                                            ? "text-stone-400"
                                            : "text-stone-500"
                                        }`}
                                        title={matedCar.garageBay || "Bay 14-B"}
                                      >
                                        {matedCar.garageBay || "Bay 14-B"}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <span
                                      className={`px-2 py-1 rounded-md text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                                        isDark
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Unassigned
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Col 6: Status & Signals */}
                              <td className="px-4 py-3.5 align-middle">
                                <div className="flex flex-col gap-1 items-start">
                                  {b.status === "Pending Assignment" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      Pending Mating
                                    </span>
                                  )}
                                  {b.status === "Assigned" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                          : "bg-sky-50 text-sky-800 border-sky-200"
                                      }`}
                                    >
                                      Assigned / Staged
                                    </span>
                                  )}
                                  {b.status === "Checked Out" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      }`}
                                    >
                                      In Drive
                                    </span>
                                  )}
                                  {b.status === "Returned" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                          : "bg-purple-50 text-purple-800 border-purple-200"
                                      }`}
                                    >
                                      Returned (Audit)
                                    </span>
                                  )}
                                  {b.status === "Completed" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-stone-700/40 text-stone-400 border-stone-700"
                                          : "bg-stone-100 text-stone-600 border-stone-200"
                                      }`}
                                    >
                                      Completed
                                    </span>
                                  )}
                                  {b.status === "Cancelled" && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block whitespace-nowrap ${
                                        isDark
                                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                          : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      Cancelled
                                    </span>
                                  )}

                                  {/* Operational Signals in neat secondary row */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {b.approvedByAdmin ||
                                    b.status === "Completed" ||
                                    b.status === "Checked Out" ||
                                    b.status === "Assigned" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                                        Accepted
                                      </span>
                                    ) : b.status !== "Cancelled" ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()

                                            handleApproveBooking(b.id)
                                          }}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                            isDark
                                              ? "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border-emerald-500/40"
                                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                          }`}
                                          title="Accept booking request from customer"
                                        >
                                          Accept Request
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()

                                            handleDeclineBooking(b.id)
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                            isDark
                                              ? "bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border-rose-500/40"
                                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                          }`}
                                          title="Decline booking request"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    ) : null}

                                    {(b.extensionStatus === "Pending" ||
                                      b.extensionStatus === "Requested") && (
                                      <button
                                        data-testid="quote-extension-btn"
                                        onClick={(e) => {
                                          e.stopPropagation()

                                          handleOpenExtensionQuote(b)
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 animate-pulse cursor-pointer whitespace-nowrap ${
                                          isDark
                                            ? "bg-amber-500/20 hover:bg-amber-500 text-amber-200 border-amber-500/40"
                                            : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                        }`}
                                        title="Customer requested booking extension - click to quote"
                                      >
                                        Quote Ext
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Col 7: Total Amount */}
                              <td className="px-4 py-3.5 text-right align-middle">
                                <div
                                  className={`font-mono font-black text-xs ${
                                    isDark ? "text-white" : "text-stone-900"
                                  }`}
                                >
                                  €{b.totalAmount.toFixed(2)}
                                </div>
                                <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                                  {b.status === "Completed"
                                    ? "Settled"
                                    : "Auth Captured"}
                                </div>
                              </td>

                              {/* Col 8: Lifecycle Actions */}
                              <td
                                className="px-4 py-3.5 text-right align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                  {b.status === "Pending Assignment" && (
                                    <button
                                      onClick={() => handleAutoMate(b)}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <ZapIcon size={12} /> Auto-Mate
                                    </button>
                                  )}

                                  {b.status === "Assigned" && (
                                    <>
                                      <button
                                        onClick={() => handleOpenKeyHandoff(b)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Handoff keys & start rental clock"
                                      >
                                        <ZapIcon size={12} /> Keys
                                      </button>
                                      <button
                                        onClick={() => handleUnmateCar(b.id)}
                                        className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                                          isDark
                                            ? "bg-stone-800 hover:bg-rose-900/40 hover:text-rose-400 hover:border-rose-700/50 text-stone-400 border-stone-700"
                                            : "bg-stone-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-600 border-stone-200"
                                        }`}
                                        title="Unassign vehicle from reservation"
                                      >
                                        <TrashIcon size={12} />
                                      </button>
                                    </>
                                  )}

                                  {b.status === "Checked Out" && (
                                    <button
                                      data-testid="return-audit-btn"
                                      onClick={() =>
                                        handleOpenReturnInspection(b)
                                      }
                                      className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      title="Perform return vehicle audit"
                                    >
                                      <WrenchIcon size={12} /> Return Audit
                                    </button>
                                  )}

                                  {b.status === "Returned" && (
                                    <button
                                      onClick={() =>
                                        handleOpenReturnInspection(b)
                                      }
                                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold text-xs transition shadow-2xs cursor-pointer whitespace-nowrap"
                                    >
                                      Verify Audit
                                    </button>
                                  )}

                                  {b.status === "Completed" && (
                                    <span className="text-[11px] font-mono text-stone-400 px-2 py-1">
                                      Archived
                                    </span>
                                  )}

                                  {/* Trip Invoice & Download Options (PNG / PDF) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedInvoiceBooking(b)
                                    }}
                                    className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition border flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                                      isDark
                                        ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                                    }`}
                                    title="View & Download Official Invoice (PNG / PDF)"
                                  >
                                    <DownloadIcon
                                      size={12}
                                      className="inline mr-1 text-orange-500"
                                    />
                                    <span className="text-[10px]">
                                      Invoice
                                    </span>
                                  </button>

                                  {/* Secondary Action: Download Driver ID Verification */}
                                  <button
                                    onClick={() => handleDownloadLicense(b)}
                                    className={`p-1.5 rounded-lg text-xs transition border flex items-center justify-center cursor-pointer shrink-0 ${
                                      isDark
                                        ? "bg-stone-800 hover:bg-[#F97316] text-stone-400 hover:text-white border-stone-700"
                                        : "bg-stone-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-stone-600 border-stone-200"
                                    }`}
                                    title="Download Driver ID Verification Documents"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      />
                                    </svg>
                                  </button>

                                  {/* Secondary Action: Inspect Details Modal */}
                                  <button
                                    onClick={() => setInspectedBooking(b)}
                                    className={`p-1.5 rounded-lg text-xs transition border flex items-center justify-center cursor-pointer shrink-0 ${
                                      isDark
                                        ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                                    }`}
                                    title="Inspect Full Booking Details & Telemetry"
                                  >
                                    <ArrowRightIcon size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ========================================================
            TAB 2: FLEET TELEMETRY & INVENTORY
            ======================================================== */}
          {activeTab === "fleet" && (
            <section
              className={`border rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              {/* Toolbar */}
              <div
                className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-72">
                    <SearchIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="text"
                      value={fleetSearch}
                      onChange={(e) => setFleetSearch(e.target.value)}
                      placeholder="Search plate, model, make..."
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                          : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                      }`}
                    />
                  </div>

                  {/* Status chips */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {[
                      "all",

                      "Available",

                      "Rented",

                      "Maintenance",

                      "Cleaning",
                    ].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFleetStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          fleetStatusFilter === st
                            ? "bg-sky-600 text-white font-bold shadow-xs"
                            : isDark
                              ? "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                              : "bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {st === "all" ? "All Fleet" : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center rounded-lg p-0.5 border ${
                      isDark
                        ? "bg-stone-900 border-stone-800"
                        : "bg-stone-100 border-stone-200"
                    }`}
                  >
                    <button
                      onClick={() => setFleetViewMode("table")}
                      className={`p-1.5 rounded cursor-pointer ${
                        fleetViewMode === "table"
                          ? isDark
                            ? "bg-stone-800 text-white"
                            : "bg-white text-stone-900 shadow-2xs font-bold"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <ListIcon size={16} />
                    </button>
                    <button
                      onClick={() => setFleetViewMode("grid")}
                      className={`p-1.5 rounded cursor-pointer ${
                        fleetViewMode === "grid"
                          ? isDark
                            ? "bg-stone-800 text-white"
                            : "bg-white text-stone-900 shadow-2xs font-bold"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <GridIcon size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isRefreshingFleet}
                    onClick={async () => {
                      setIsRefreshingFleet(true)
                      try {
                        const refreshed = await api.getCars()
                        if (Array.isArray(refreshed)) {
                          setCars(refreshed)
                          notify(
                            `Fleet refreshed (${refreshed.length} vehicles synced).`,
                          )
                        }
                      } catch (e: any) {
                        alert(
                          "Failed to refresh fleet: " +
                            (e?.message || "Network error"),
                        )
                      } finally {
                        setIsRefreshingFleet(false)
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                        : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs"
                    }`}
                    title="Refresh fleet list directly from database"
                  >
                    <RefreshCwIcon
                      size={13}
                      className={
                        isRefreshingFleet
                          ? "animate-spin text-[#F97316]"
                          : "text-stone-400"
                      }
                    />
                    <span>{isRefreshingFleet ? "Syncing..." : "Refresh"}</span>
                  </button>

                  <button
                    onClick={handleOpenAddCar}
                    className="px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusIcon size={14} />+ Register Vehicle
                  </button>
                </div>
              </div>

              {/* Fleet View Mode */}
              {fleetViewMode === "table" ? (
                <div>
                  {/* Mobile Fleet Cards (< lg screens) */}
                  <div
                    className={`block lg:hidden divide-y ${
                      isDark ? "divide-stone-800/80" : "divide-stone-100"
                    }`}
                  >
                    {filteredFleet.length === 0 ? (
                      <div
                        className={`py-12 text-center text-xs ${
                          isDark ? "text-stone-500" : "text-stone-400"
                        }`}
                      >
                        No vehicles match the selected filter.
                      </div>
                    ) : (
                      filteredFleet.map((c) => {
                        const cleanHub = getCleanHubAddress(c.location || c.garageAddress)

                        return (
                          <div
                            key={c.id}
                            className={`p-4 transition ${
                              isDark
                                ? "hover:bg-stone-800/40 border-b border-stone-800/40"
                                : "hover:bg-orange-50/30 border-b border-stone-100"
                            }`}
                          >
                            {/* Top Row: Thumbnail + Identity */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border relative ${
                                  isDark
                                    ? "bg-stone-800 border-stone-700"
                                    : "bg-stone-100 border-stone-200"
                                }`}
                              >
                                <img
                                  src={c.image}
                                  alt={c.name}
                                  className="w-full h-full object-cover"
                                />
                                {c.gallery && c.gallery.length > 1 && (
                                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[8px] font-bold font-mono flex items-center gap-0.5 shadow-xs">
                                    <CameraIcon
                                      size={13}
                                      className="inline text-stone-500"
                                    />
                                    <span>{c.gallery.length}</span>
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4
                                    className={`font-bold text-sm truncate ${
                                      isDark ? "text-white" : "text-stone-900"
                                    }`}
                                  >
                                    {c.name}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border shrink-0 ${
                                      isDark
                                        ? "bg-stone-900 border-stone-700 text-stone-200"
                                        : "bg-stone-100 border-stone-200 text-stone-800"
                                    }`}
                                  >
                                    {c.plateNumber || "N/A"}
                                  </span>
                                </div>

                                <p
                                  className={`text-xs mt-0.5 ${
                                    isDark ? "text-stone-400" : "text-stone-500"
                                  }`}
                                >
                                  {c.year} • {c.type} • {c.fuelType}
                                </p>
                              </div>
                            </div>

                            {/* Middle Metrics Row */}
                            <div
                              className={`mt-3 grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl border ${
                                isDark
                                  ? "bg-stone-900/60 border-stone-800 text-stone-300"
                                  : "bg-stone-50 border-stone-200 text-stone-700"
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-[10px] text-stone-400 block font-mono uppercase">
                                  Hub Location
                                </span>
                                <span
                                  className="font-medium text-[11px] truncate block"
                                  title={c.location || studioContact.hub_address}
                                >
                                  {cleanHub}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 block font-mono uppercase">
                                  Fuel / Tank Capacity
                                </span>
                                <span className="font-mono text-[11px] font-bold text-orange-500">
                                  {formatFuelDisplay(c.mileage, c.fuelType)}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Row: Status Dropdown + Rates + Actions */}
                            <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                <select
                                  value={c.status || "Available"}
                                  onChange={async (e) => {
                                    const newStatus = e.target
                                      .value as CarStatus

                                    const updated = await api.updateCarStatus(
                                      c.id,

                                      newStatus,
                                    )

                                    setCars((prev) =>
                                      prev.map((x) =>
                                        x.id === c.id ? updated : x,
                                      ),
                                    )

                                    notify(
                                      `${c.name} status updated to ${newStatus}.`,
                                    )
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                                    c.status === "Available"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                      : c.status === "Rented"
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                        : c.status === "Maintenance"
                                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                          : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                  }`}
                                >
                                  <option value="Available">Available</option>
                                  <option value="Rented">Rented</option>
                                  <option value="Maintenance">
                                    Maintenance
                                  </option>
                                  <option value="Cleaning">Cleaning</option>
                                </select>

                                <span className="font-mono font-bold text-xs text-stone-900 dark:text-white">
                                  €{c.pricePerDay}
                                  <span className="text-[10px] font-normal text-stone-400">
                                    /day
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCar(c)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                                    isDark
                                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                      : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300"
                                  }`}
                                  title="Edit specifications"
                                >
                                  <EditIcon size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeletingCar(c)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer text-xs font-medium ${
                                    isDark
                                      ? "bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border-stone-700"
                                      : "bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border-stone-300"
                                  }`}
                                  title="Decommission vehicle"
                                >
                                  <TrashIcon size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Desktop Manifest Table (>= lg screens or horizontal scroll) */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-xs border-collapse">
                      <thead>
                        <tr
                          className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                            isDark
                              ? "bg-stone-900/80 border-stone-800 text-stone-400"
                              : "bg-stone-50/90 border-stone-200 text-stone-500"
                          }`}
                        >
                          <th className="px-5 py-3.5 w-72 whitespace-nowrap">
                            Vehicle / Specs
                          </th>
                          <th className="px-5 py-3.5 w-52 whitespace-nowrap">
                            Plate & Hub
                          </th>
                          <th className="px-5 py-3.5 w-36 whitespace-nowrap">
                            Status Override
                          </th>
                          <th className="px-5 py-3.5 w-40 whitespace-nowrap">
                            Fuel / Tank Capacity
                          </th>
                          <th className="px-5 py-3.5 w-36 text-right whitespace-nowrap">
                            Daily Rate
                          </th>
                          <th className="px-5 py-3.5 w-28 text-center whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y font-sans ${
                          isDark ? "divide-stone-800/60" : "divide-stone-100"
                        }`}
                      >
                        {filteredFleet.map((c) => {
                          const cleanHub = (c.location || studioContact.hub_address || "Operating Fleet Hub")

                            .replace(/International Airport/i, "Intl")

                            .replace(/Airport/i, "Hub")

                            .trim()

                          return (
                            <tr
                              key={c.id}
                              className={`transition ${
                                isDark
                                  ? "hover:bg-stone-800/50 border-stone-800/60"
                                  : "hover:bg-orange-50/40 border-stone-100"
                              }`}
                            >
                              {/* Vehicle details */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-9 rounded-lg overflow-hidden shrink-0 border relative ${
                                      isDark
                                        ? "bg-stone-800 border-stone-700"
                                        : "bg-stone-100 border-stone-200"
                                    }`}
                                  >
                                    <img
                                      src={c.image}
                                      alt={c.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {c.gallery && c.gallery.length > 1 && (
                                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 backdrop-blur-xs text-white text-[8px] font-bold font-mono flex items-center gap-0.5 shadow-xs">
                                        <CameraIcon
                                          size={10}
                                          className="inline mr-1"
                                        />
                                        <span>{c.gallery.length}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      className={`font-bold text-xs whitespace-nowrap ${
                                        isDark ? "text-white" : "text-stone-900"
                                      }`}
                                    >
                                      {c.name}
                                    </div>
                                    <div
                                      className={`text-[11px] whitespace-nowrap mt-0.5 ${
                                        isDark
                                          ? "text-stone-400"
                                          : "text-stone-500"
                                      }`}
                                    >
                                      {c.year} • {c.type} • {c.fuelType}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Plate & Hub */}
                              <td className="px-5 py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border inline-block whitespace-nowrap ${
                                    isDark
                                      ? "bg-stone-900 border-stone-700 text-stone-200"
                                      : "bg-stone-100 border-stone-200 text-stone-800"
                                  }`}
                                >
                                  {c.plateNumber || "N/A"}
                                </span>
                                <div
                                  className={`text-[11px] mt-1 font-medium whitespace-nowrap ${
                                    isDark ? "text-stone-400" : "text-stone-500"
                                  }`}
                                  title={c.location || studioContact.hub_address}
                                >
                                  {cleanHub}
                                </div>
                              </td>

                              {/* Status Override */}
                              <td className="px-5 py-3.5">
                                <select
                                  value={c.status || "Available"}
                                  onChange={async (e) => {
                                    const newStatus = e.target
                                      .value as CarStatus

                                    const updated = await api.updateCarStatus(
                                      c.id,

                                      newStatus,
                                    )

                                    setCars((prev) =>
                                      prev.map((x) =>
                                        x.id === c.id ? updated : x,
                                      ),
                                    )

                                    notify(
                                      `${c.name} status updated to ${newStatus}.`,
                                    )
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                                    c.status === "Available"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                      : c.status === "Rented"
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                        : c.status === "Maintenance"
                                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                          : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                  }`}
                                >
                                  <option value="Available">Available</option>
                                  <option value="Rented">Rented</option>
                                  <option value="Maintenance">
                                    Maintenance
                                  </option>
                                  <option value="Cleaning">Cleaning</option>
                                </select>
                              </td>

                              {/* Fuel & Tank Capacity in Liters */}
                              <td
                                className={`px-5 py-3.5 font-mono ${
                                  isDark ? "text-stone-300" : "text-stone-700"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-semibold">
                                  {formatFuelDisplay(c.mileage, c.fuelType)}
                                </span>
                              </td>

                              {/* Daily, Hourly & Monthly Dynamic Rates */}
                              <td className="px-5 py-3.5 text-right font-mono">
                                <span
                                  className={`font-bold block ${
                                    isDark ? "text-white" : "text-stone-900"
                                  }`}
                                >
                                  €{c.pricePerDay}/day
                                </span>
                                <span className="text-[11px] text-stone-400 block font-normal">
                                  €{c.pricePerHour || 8}/hr • €
                                  {c.pricePerMonth ||
                                    Math.round(c.pricePerDay * 22)}
                                  /mo
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditCar(c)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      isDark
                                        ? "hover:bg-stone-800 text-stone-400 hover:text-white border-stone-800"
                                        : "hover:bg-stone-100 text-stone-600 hover:text-stone-900 border-stone-200"
                                    }`}
                                    title="Edit specifications"
                                  >
                                    <EditIcon size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingCar(c)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      isDark
                                        ? "hover:bg-stone-800 text-stone-500 hover:text-rose-400 border-stone-800"
                                        : "hover:bg-rose-50 text-stone-500 hover:text-rose-600 border-stone-200"
                                    }`}
                                    title="Decommission vehicle"
                                  >
                                    <TrashIcon size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid view */

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFleet.map((c) => (
                    <div
                      key={c.id}
                      className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
                        isDark
                          ? "bg-stone-900/60 border-stone-800 hover:border-stone-700"
                          : "bg-white border-stone-200 shadow-2xs hover:border-orange-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div
                          className={`aspect-video rounded-xl overflow-hidden mb-3 border relative ${
                            isDark
                              ? "bg-stone-800 border-stone-800"
                              : "bg-stone-100 border-stone-200"
                          }`}
                        >
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                          {c.gallery && c.gallery.length > 1 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                              {c.gallery.length} Photos
                            </span>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-bold text-sm ${
                                isDark ? "text-white" : "text-stone-900"
                              }`}
                            >
                              {c.name}
                            </h4>
                            <p
                              className={`text-xs ${
                                isDark ? "text-stone-400" : "text-stone-500"
                              }`}
                            >
                              {c.year} • {c.type}
                            </p>
                          </div>
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                              isDark
                                ? "text-amber-400 bg-stone-800 border-stone-700"
                                : "text-amber-800 bg-amber-50 border-amber-200"
                            }`}
                          >
                            {c.plateNumber}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`mt-4 pt-3 border-t flex items-center justify-between ${
                          isDark ? "border-stone-800" : "border-stone-100"
                        }`}
                      >
                        <div>
                          <span
                            className={`font-mono font-bold text-sm block ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            €{c.pricePerDay}/day
                          </span>
                          <span className="font-mono text-[10px] text-stone-400 block font-medium">
                            €{c.pricePerHour || 8}/hr • €
                            {c.pricePerMonth || Math.round(c.pricePerDay * 22)}
                            /mo
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCar(c)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              isDark
                                ? "bg-stone-800 text-stone-300 hover:text-white border-stone-700"
                                : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200 shadow-2xs"
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingCar(c)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isDark
                                ? "hover:bg-stone-800 text-stone-500 hover:text-rose-400 border-stone-800"
                                : "hover:bg-rose-50 text-stone-500 hover:text-rose-600 border-stone-200"
                            }`}
                            title="Decommission vehicle"
                          >
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ========================================================
            TAB 3: WALK-IN COUNTER DISPATCH (< 60s)
            ======================================================== */}
          {activeTab === "walkin" && (
            <section
              className={`border rounded-xl p-3.5 sm:p-8 max-w-4xl mx-auto transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-2xl text-white"
                  : "bg-white border-stone-200/90 shadow-xs text-stone-900"
              }`}
            >
              <div
                className={`flex items-center gap-3 pb-6 border-b ${
                  isDark ? "border-stone-800" : "border-stone-200/80"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <ZapIcon size={20} />
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-black ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    Direct Walk-In Rental Booking
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Create an immediate rental for walk-in garage customers with
                    direct vehicle assignment.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleWalkinSubmit}
                className="mt-4 sm:mt-6 space-y-4 sm:space-y-6"
              >
                {/* Step 1: Customer Details */}
                <div>
                  <h4
                    className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Step 1: Driver Identification
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={walkinForm.firstName}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,

                            firstName: e.target.value,
                          })
                        }
                        placeholder="e.g. Marcus"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={walkinForm.lastName}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,

                            lastName: e.target.value,
                          })
                        }
                        placeholder="e.g. Vance"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        Email (For e-Receipt)
                      </label>
                      <input
                        type="email"
                        required
                        value={walkinForm.email}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="customer@email.com"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={walkinForm.phone}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+1 (555) 000-0000"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        Driver License Number
                      </label>
                      <input
                        type="text"
                        required
                        value={walkinForm.licenseNumber}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,

                            licenseNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. FL-9940182"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDark ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        Issuing State / Jurisdiction
                      </label>
                      <input
                        type="text"
                        value={walkinForm.licenseState}
                        onChange={(e) =>
                          setWalkinForm({
                            ...walkinForm,

                            licenseState: e.target.value,
                          })
                        }
                        placeholder="Florida"
                        className={`w-full px-3.5 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>

                    {/* Real Driver License Document Upload Area */}
                    <div className="col-span-2 pt-2">
                      <label
                        className={`block text-xs font-semibold mb-1.5 ${
                          isDark ? "text-stone-300" : "text-stone-700"
                        }`}
                      >
                        Physical Driver License Identification (Front Photo / Scan)
                      </label>
                      
                      {walkinForm.licensePhotoFront ? (
                        <div className="flex items-center gap-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20">
                          <img
                            src={walkinForm.licensePhotoFront}
                            alt="Scanned License Front"
                            className="w-28 h-18 object-cover rounded-lg border border-emerald-500/30 shadow-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                              ✓ {walkinForm.licenseFileName || "driver_license_front.jpg"}
                            </span>
                            <span className="text-[10px] text-stone-500 block mt-0.5">
                              Real driver license document attached to booking manifest.
                            </span>
                            <button
                              type="button"
                              onClick={() => setWalkinForm({ ...walkinForm, licensePhotoFront: "", licenseFileName: "" })}
                              className="text-[11px] font-bold text-rose-600 hover:underline mt-1 cursor-pointer"
                            >
                              ✕ Remove &amp; Re-upload
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-stone-50/50 dark:bg-stone-900/50">
                          <CameraIcon size={22} className="text-[#F97316] mb-1.5" />
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            Upload or Snap Driver's License Document
                          </span>
                          <span className="text-[11px] text-stone-500 mt-0.5">
                            PNG, JPG or WEBP (Saved directly to booking records)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                  setWalkinForm({
                                    ...walkinForm,
                                    licensePhotoFront: ev.target?.result as string,
                                    licenseFileName: file.name,
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Available Vehicle Selector */}
                <div
                  className={`pt-4 border-t ${
                    isDark ? "border-stone-800" : "border-stone-200/80"
                  }`}
                >
                  <h4
                    className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Step 2: Assign Staged Vehicle
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cars

                      .filter((c) => c.status === "Available")

                      .map((car) => {
                        const isSelected = walkinForm.carId === car.id

                        return (
                          <div
                            key={car.id}
                            onClick={() =>
                              setWalkinForm({ ...walkinForm, carId: car.id })
                            }
                            className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                              isSelected
                                ? isDark
                                  ? "bg-amber-500/10 border-amber-500 text-white"
                                  : "bg-amber-50 border-amber-400 text-stone-900 shadow-2xs"
                                : isDark
                                  ? "bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700"
                                  : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300"
                            }`}
                          >
                            <div
                              className={`w-12 h-9 rounded overflow-hidden shrink-0 ${
                                isDark ? "bg-stone-800" : "bg-stone-200"
                              }`}
                            >
                              <img
                                src={car.image}
                                alt={car.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-bold text-xs truncate ${
                                  isDark ? "text-white" : "text-stone-900"
                                }`}
                              >
                                {car.name}
                              </p>
                              <p
                                className={`text-[10px] font-mono ${
                                  isDark ? "text-stone-400" : "text-stone-500"
                                }`}
                              >
                                {car.plateNumber} • €{car.pricePerDay}/day
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Step 3: Rental Parameters & Immediate Dispatch */}
                <div
                  className={`pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                    isDark ? "border-stone-800" : "border-stone-200/80"
                  }`}
                >
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Rental Duration (Days)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="3"
                      value={walkinForm.totalDays ?? ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "") {
                          setWalkinForm({
                            ...walkinForm,
                            totalDays: "" as any,
                          })
                          return
                        }
                        const days = Math.max(1, Number(val) || 1)
                        setWalkinForm({
                          ...walkinForm,
                          totalDays: days,
                          returnDate: getWalkinReturnDefault(days),
                        })
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white"
                          : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Pickup Time
                    </label>
                    <input
                      type="text"
                      value={walkinForm.pickupDate}
                      onChange={(e) =>
                        setWalkinForm({
                          ...walkinForm,

                          pickupDate: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white"
                          : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Return Schedule
                    </label>
                    <input
                      type="text"
                      value={walkinForm.returnDate}
                      onChange={(e) =>
                        setWalkinForm({
                          ...walkinForm,

                          returnDate: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark
                          ? "bg-stone-900 border border-stone-700 text-white"
                          : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="immediateCheckout"
                    checked={walkinForm.immediateCheckout}
                    onChange={(e) =>
                      setWalkinForm({
                        ...walkinForm,

                        immediateCheckout: e.target.checked,
                      })
                    }
                    className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="immediateCheckout"
                    className={`text-xs font-medium cursor-pointer ${
                      isDark ? "text-stone-300" : "text-stone-700"
                    }`}
                  >
                    Dispatch Keys Immediately (Sets lifecycle directly to{" "}
                    <span className="text-emerald-500 font-bold">
                      Checked Out
                    </span>
                    )
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingWalkin}
                  className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <ZapIcon size={16} />
                  {isSubmittingWalkin
                    ? "Issuing Reservation..."
                    : "Complete Counter Walk-In & Hand Over Keys"}
                </button>
              </form>
            </section>
          )}

          {/* ========================================================
            TAB 4: RATE RULES & PROMO COUPONS
            ======================================================== */}
          {activeTab === "promos" && (
            <section
              className={`border rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              <div
                className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`text-base font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    <TagIcon size={16} className="text-emerald-500" />
                    Atelier Privilege &amp; Voucher Registry
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Confidential concession vouchers. These codes are strictly
                    visible to the Studio Director and protected from public
                    inspection.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ● {promos.filter((p) => p.isActive).length} Active Rules
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                        isDark
                          ? "bg-stone-900/80 border-stone-800 text-stone-400"
                          : "bg-stone-50/90 border-stone-200 text-stone-500"
                      }`}
                    >
                      <th className="px-5 py-3.5">Coupon Code</th>
                      <th className="px-5 py-3.5">Discount</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Expiration</th>
                      <th className="px-5 py-3.5">Usage Count</th>
                      <th className="px-5 py-3.5">Active Status</th>
                      <th className="px-5 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-sans ${
                      isDark ? "divide-stone-800/60" : "divide-stone-100"
                    }`}
                  >
                    {promos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-stone-500 font-mono text-xs"
                        >
                          No privilege vouchers configured yet. Click "Create
                          New Privilege" above to mint a concession code.
                        </td>
                      </tr>
                    ) : (
                      promos.map((p) => (
                        <tr
                          key={p.code}
                          className={`transition ${
                            isDark
                              ? "hover:bg-stone-800/50 border-stone-800/60"
                              : "hover:bg-orange-50/40 border-stone-100"
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs border inline-block ${
                                isDark
                                  ? "bg-stone-900 text-emerald-400 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {p.code}
                            </span>
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono font-black text-sm ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            {p.discountPercent}% OFF
                          </td>
                          <td
                            className={`px-5 py-3.5 max-w-xs ${
                              isDark ? "text-stone-300" : "text-stone-700"
                            }`}
                          >
                            {p.description}
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono ${
                              isDark ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {p.expiryDate}
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono ${
                              isDark ? "text-stone-300" : "text-stone-700"
                            }`}
                          >
                            {p.usageCount} redemptions
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleTogglePromo(p.code)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                p.isActive
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : isDark
                                    ? "bg-stone-800 text-stone-500 border-stone-700"
                                    : "bg-stone-100 text-stone-400 border-stone-200"
                              }`}
                            >
                              {p.isActive ? "● Active" : "○ Inactive"}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => handleDeletePromo(p.code)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isDark
                                  ? "hover:bg-stone-800 text-stone-500 hover:text-rose-400 border-stone-800"
                                  : "hover:bg-rose-50 text-stone-400 hover:text-rose-600 border-stone-200"
                              }`}
                              title="Delete coupon"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========================================================
            TAB 5: CUSTOMER CRM & DRIVER VERIFICATION
            ======================================================== */}
          {activeTab === "crm" && (
            <section
              className={`border rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              <div
                className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`text-base font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    <UserIcon size={16} className="text-purple-500" />
                    Customer Directory & Driver CRM
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Lifetime rental spend, driver license verification, and VIP
                    tiering.
                  </p>
                </div>

                <div className="relative w-64">
                  <SearchIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Filter customer name or email..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark
                        ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                        : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                        isDark
                          ? "bg-stone-900/80 border-stone-800 text-stone-400"
                          : "bg-stone-50/90 border-stone-200 text-stone-500"
                      }`}
                    >
                      <th className="px-5 py-3.5">Customer Name</th>
                      <th className="px-5 py-3.5">Contact Email & Phone</th>
                      <th className="px-5 py-3.5">Driver License</th>
                      <th className="px-5 py-3.5">VIP Tier</th>
                      <th className="px-5 py-3.5">Trips Count</th>
                      <th className="px-5 py-3.5 text-right">Lifetime Spend</th>
                      <th className="px-5 py-3.5 text-center">Verification</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-sans ${
                      isDark ? "divide-stone-800/60" : "divide-stone-100"
                    }`}
                  >
                    {filteredCustomers.map((cust) => (
                      <tr
                        key={cust.id}
                        className={`transition ${
                          isDark
                            ? "hover:bg-stone-800/50 border-stone-800/60"
                            : "hover:bg-orange-50/40 border-stone-100"
                        }`}
                      >
                        <td
                          className={`px-5 py-3.5 font-semibold ${
                            isDark ? "text-white" : "text-stone-900"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDark
                                  ? "bg-stone-800 text-stone-300"
                                  : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {(cust.name || cust.email || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{cust.name}</span>
                                {cust.hasAccount && (
                                  <span className="text-[10px] text-emerald-500 font-mono font-bold">
                                    ✓ App
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-stone-400 block mt-0.5">
                                User ID:{" "}
                                <span className="text-orange-500 font-semibold font-mono">
                                  {cust.id}
                                </span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div
                            className={`font-mono text-[11px] ${
                              isDark ? "text-stone-300" : "text-stone-700"
                            }`}
                          >
                            {cust.email}
                          </div>
                          <div
                            className={`text-[10px] font-mono ${
                              isDark ? "text-stone-500" : "text-stone-400"
                            }`}
                          >
                            {cust.phone || "No phone"}
                          </div>
                        </td>
                        <td
                          className={`px-5 py-3.5 font-mono ${
                            isDark ? "text-stone-300" : "text-stone-700"
                          }`}
                        >
                          {cust.driverLicenseNum || "Unverified"}
                          {cust.driverLicenseState && (
                            <span
                              className={`text-[10px] ${
                                isDark ? "text-stone-500" : "text-stone-400"
                              }`}
                            >
                              {" "}
                              ({cust.driverLicenseState})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              cust.vipTier === "VIP"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                : cust.vipTier === "Gold"
                                  ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/30"
                                  : isDark
                                    ? "bg-stone-800 text-stone-400"
                                    : "bg-stone-100 text-stone-600 border border-stone-200"
                            }`}
                          >
                            {cust.vipTier || "Standard"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3.5 font-mono ${
                            isDark ? "text-stone-300" : "text-stone-700"
                          }`}
                        >
                          {cust.totalBookings || 0} trips
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-mono font-bold ${
                            isDark ? "text-white" : "text-stone-900"
                          }`}
                        >
                          ${(cust.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() =>
                              setInspectedLicense({
                                id: cust.id,

                                name: cust.name,

                                licenseNum: cust.driverLicenseNum || "DL-99018",

                                state: cust.driverLicenseState || "Florida",

                                expiry: cust.driverLicenseExpiry || "12/2029",

                                file: "driver_license_front.jpg",
                              })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              isDark
                                ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                                : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200 shadow-2xs"
                            }`}
                          >
                            View ID
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========================================================
            TAB 6: MAINTENANCE & FLEET HEALTH
            ======================================================== */}
          {activeTab === "maintenance" && (
            <section
              className={`border rounded-2xl overflow-hidden transition ${
                isDark
                  ? "bg-[#17191C] border-stone-800 shadow-xl"
                  : "bg-white border-stone-200/90 shadow-xs"
              }`}
            >
              <div
                className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDark
                    ? "border-stone-800 bg-[#17191C]"
                    : "border-stone-200/80 bg-white"
                }`}
              >
                <div>
                  <h3
                    className={`text-base font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    <WrenchIcon size={16} className="text-rose-500" />
                    Fleet Maintenance & Service Logs
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Track oil services, ceramic brake overhauls, EV battery
                    diagnostics, and service work orders with pagination.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search */}
                  <div className="relative">
                    <SearchIcon
                      size={14}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                        isDark ? "text-stone-500" : "text-stone-400"
                      }`}
                    />
                    <input
                      type="text"
                      value={mntSearch}
                      onChange={(e) => {
                        const val = e.target.value

                        setMntSearch(val)

                        fetchMaintenancePage(
                          1,

                          mntPagination.limit,

                          val,

                          mntStatusFilter,
                        )
                      }}
                      placeholder="Search logs or car..."
                      className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none transition w-44 md:w-52 ${
                        isDark
                          ? "bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-600 focus:border-rose-500"
                          : "bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400 focus:border-rose-500"
                      }`}
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={mntStatusFilter}
                    onChange={(e) => {
                      const val = e.target.value

                      setMntStatusFilter(val)

                      fetchMaintenancePage(
                        1,
                        mntPagination.limit,
                        mntSearch,
                        val,
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs border outline-none transition cursor-pointer ${
                      isDark
                        ? "bg-stone-900 border-stone-800 text-stone-300 focus:border-rose-500"
                        : "bg-stone-50 border-stone-200 text-stone-700 focus:border-rose-500"
                    }`}
                  >
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>

                  <button
                    onClick={() => setIsMntModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <PlusIcon size={14} />+ Log Service Ticket
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative">
                {mntLoading && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-stone-900 text-white border border-stone-700 shadow-md">
                      Loading records...
                    </span>
                  </div>
                )}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                        isDark
                          ? "bg-stone-900/80 border-stone-800 text-stone-400"
                          : "bg-stone-50/90 border-stone-200 text-stone-500"
                      }`}
                    >
                      <th className="px-5 py-3.5">Work Order ID</th>
                      <th className="px-5 py-3.5">Vehicle</th>
                      <th className="px-5 py-3.5">Service Type</th>
                      <th className="px-5 py-3.5">Odometer</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Cost</th>
                      <th className="px-5 py-3.5">Technician Notes</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-sans ${
                      isDark ? "divide-stone-800/60" : "divide-stone-100"
                    }`}
                  >
                    {maintenanceLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className={`text-center py-10 text-xs ${
                            isDark ? "text-stone-500" : "text-stone-400"
                          }`}
                        >
                          No maintenance work orders found matching filters.
                        </td>
                      </tr>
                    ) : (
                      maintenanceLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`transition ${
                            isDark
                              ? "hover:bg-stone-800/50 border-stone-800/60"
                              : "hover:bg-orange-50/40 border-stone-100"
                          }`}
                        >
                          <td
                            className={`px-5 py-3.5 font-mono font-bold ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            {log.id}
                          </td>
                          <td
                            className={`px-5 py-3.5 font-semibold ${
                              isDark ? "text-stone-200" : "text-stone-900"
                            }`}
                          >
                            {log.carName || log.carId}
                          </td>
                          <td
                            className={`px-5 py-3.5 ${
                              isDark ? "text-stone-300" : "text-stone-700"
                            }`}
                          >
                            {log.serviceType}
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono ${
                              isDark ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {log.odometer ? log.odometer.toLocaleString() : "0"}{" "}
                            mi
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono ${
                              isDark ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {log.date}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                log.status === "Completed"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td
                            className={`px-5 py-3.5 text-right font-mono font-bold ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            ${(log.cost || 0).toFixed(2)}
                          </td>
                          <td
                            className={`px-5 py-3.5 max-w-xs truncate ${
                              isDark ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {log.technicianNotes || "N/A"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div
                className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                  isDark
                    ? "border-stone-800 bg-stone-900/50 text-stone-400"
                    : "border-stone-200 bg-stone-50/70 text-stone-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>
                    Showing{" "}
                    <strong
                      className={isDark ? "text-white" : "text-stone-900"}
                    >
                      {mntPagination.total === 0
                        ? 0
                        : (mntPagination.page - 1) * mntPagination.limit + 1}
                    </strong>{" "}
                    to{" "}
                    <strong
                      className={isDark ? "text-white" : "text-stone-900"}
                    >
                      {Math.min(
                        mntPagination.page * mntPagination.limit,

                        mntPagination.total,
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong
                      className={isDark ? "text-white" : "text-stone-900"}
                    >
                      {mntPagination.total}
                    </strong>{" "}
                    work orders
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px]">Rows:</span>
                    <select
                      value={mntPagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value, 10)

                        fetchMaintenancePage(
                          1,

                          newLimit,

                          mntSearch,

                          mntStatusFilter,
                        )
                      }}
                      className={`px-2 py-1 rounded text-xs border outline-none cursor-pointer ${
                        isDark
                          ? "bg-stone-900 border-stone-800 text-stone-300"
                          : "bg-white border-stone-200 text-stone-700"
                      }`}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!mntPagination.hasPrevPage || mntLoading}
                    onClick={() =>
                      fetchMaintenancePage(
                        mntPagination.page - 1,

                        mntPagination.limit,

                        mntSearch,

                        mntStatusFilter,
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition text-xs font-semibold ${
                      !mntPagination.hasPrevPage || mntLoading
                        ? "opacity-40 cursor-not-allowed border-transparent"
                        : isDark
                          ? "bg-stone-800 border-stone-700 hover:bg-stone-700 text-white cursor-pointer"
                          : "bg-white border-stone-200 hover:bg-stone-100 text-stone-800 cursor-pointer shadow-xs"
                    }`}
                  >
                    <ArrowLeftIcon size={12} /> Previous
                  </button>

                  <div className="px-3 py-1 text-xs font-mono font-medium">
                    Page {mntPagination.page} of {mntPagination.totalPages}
                  </div>

                  <button
                    disabled={!mntPagination.hasNextPage || mntLoading}
                    onClick={() =>
                      fetchMaintenancePage(
                        mntPagination.page + 1,

                        mntPagination.limit,

                        mntSearch,

                        mntStatusFilter,
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition text-xs font-semibold ${
                      !mntPagination.hasNextPage || mntLoading
                        ? "opacity-40 cursor-not-allowed border-transparent"
                        : isDark
                          ? "bg-stone-800 border-stone-700 hover:bg-stone-700 text-white cursor-pointer"
                          : "bg-white border-stone-200 hover:bg-stone-100 text-stone-800 cursor-pointer shadow-xs"
                    }`}
                  >
                    Next <ArrowRightIcon size={12} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
            TAB 6: STUDIO CONTACT & COMMUNICATIONS SETTINGS (Edit Phone & Email)
            ======================================================== */}
          {activeTab === "settings" && (
            <section
              className={`border rounded-xl overflow-hidden transition shadow-sm p-6 sm:p-8 space-y-6 ${
                isDark
                  ? "bg-[#17191C] border-stone-800 text-white"
                  : "bg-white border-stone-200/90 text-stone-900"
              }`}
            >
              {/* Header Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-orange-500/10 text-[#F97316]">
                      <SettingsIcon size={20} />
                    </span>
                    <div>
                      <h3 className="text-xl font-heading font-black">
                        Studio Communications &amp; Dispatch Settings
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Directly configure your WhatsApp phone number and
                        notification email with live Supabase database sync.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    DATABASE CONNECTED
                  </span>
                </div>
              </div>

              {/* Editable Contact Fields Form */}
              <form onSubmit={handleSaveStudioContact} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Official Dispatch WhatsApp Phone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-stone-700 dark:text-stone-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <PhoneIcon size={14} className="text-emerald-500" />
                        <span>WhatsApp Dispatch Phone Number</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ● Active Dispatch Number
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={studioContact.contact_phone}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          contact_phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 234-5678"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-mono border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white placeholder-stone-600"
                          : "bg-stone-50/70 border-stone-200 text-stone-900 placeholder-stone-400"
                      }`}
                    />
                    {studioContact.contact_phone && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <span>WhatsApp routing:</span>
                        <span className="font-bold">
                          {formatInternationalPhoneDisplay(
                            studioContact.contact_phone,
                          )}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          ({normalizeWhatsAppPhone(studioContact.contact_phone)}
                          )
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                      When customers submit a booking and click{" "}
                      <strong className="text-emerald-600">
                        Share Dispatch on WhatsApp
                      </strong>
                      , the reservation summary and direct admin approval link
                      will be delivered directly to this phone number.
                    </p>
                  </div>

                  {/* 2. Dispatch Notifications Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-stone-700 dark:text-stone-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MailIcon size={14} className="text-[#F97316]" />
                        <span>Dispatch &amp; Notifications Email</span>
                      </span>
                      <span className="text-[10px] text-[#F97316] font-bold">
                        ● Admin Notification Inbox
                      </span>
                    </label>
                    <input
                      type="email"
                      value={studioContact.contact_email}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          contact_email: e.target.value,
                        })
                      }
                      placeholder="concierge@motorly.com"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-mono border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white placeholder-stone-600"
                          : "bg-stone-50/70 border-stone-200 text-stone-900 placeholder-stone-400"
                      }`}
                    />
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                      This email is displayed in official customer dispatch
                      receipts and is designated for incoming automated
                      reservation alerts and digital audit summaries.
                    </p>
                  </div>

                  {/* 3. Studio Director / Admin Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <UserIcon size={14} className="text-stone-400" />
                      <span>Studio Director / Fleet Manager Name</span>
                    </label>
                    <input
                      type="text"
                      value={studioContact.admin_name}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          admin_name: e.target.value,
                        })
                      }
                      placeholder="Studio Director"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white placeholder-stone-600"
                          : "bg-stone-50/70 border-stone-200 text-stone-900 placeholder-stone-400"
                      }`}
                    />
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Administrator title or name displayed in the top
                      navigation console pill and on digital key handoff logs.
                    </p>
                  </div>

                  {/* 4. Stationed Garage / Terminal Hub & Google Maps Navigation */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider font-mono text-stone-700 dark:text-stone-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <LocationIcon size={14} className="text-sky-500" />
                          <span>Stationed Hub &amp; Key Handoff Counter</span>
                        </span>
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                          ● Active Fleet Hub
                        </span>
                      </label>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={studioContact.hub_address}
                          onChange={(e) =>
                            setStudioContact({
                              ...studioContact,
                              hub_address: e.target.value,
                            })
                          }
                          placeholder="3rd Street, Masjid Banda, Hyderabad, Telangana, 500084"
                          className={`flex-1 px-4 py-3 rounded-2xl text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border-stone-700 text-white placeholder-stone-600"
                              : "bg-stone-50/70 border-stone-200 text-stone-900 placeholder-stone-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleLocateAdminHub}
                          disabled={isLocatingHub}
                          className="px-4 py-3 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                          title="Automatically detect current GPS coordinates and resolve physical garage address"
                        >
                          <CrosshairIcon
                            size={16}
                            className={
                              isLocatingHub
                                ? "animate-spin text-emerald-200"
                                : ""
                            }
                          />
                          <span>
                            {isLocatingHub ? "Detecting GPS..." : "Locate Me"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Latitude & Longitude Inputs */}
                    <div className="p-3.5 rounded-2xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <CrosshairIcon
                            size={14}
                            className="text-emerald-500"
                          />
                          <span>Garage GPS Pinpoint Coordinates</span>
                        </span>
                        {studioContact.hub_lat && studioContact.hub_lng ? (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                            GPS: {studioContact.hub_lat.toFixed(5)},{" "}
                            {studioContact.hub_lng.toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-400">
                            Click Locate Me to auto-detect
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                            Latitude (GPS Lat)
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={studioContact.hub_lat ?? ""}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value)
                              setStudioContact((prev) => {
                                const updated = { ...prev, hub_lat: val }
                                if (
                                  val !== undefined &&
                                  prev.hub_lng !== undefined
                                ) {
                                  updated.google_maps_url = `https://www.google.com/maps?q=${val},${prev.hub_lng}`
                                }
                                return updated
                              })
                            }}
                            placeholder="25.795900"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                              isDark
                                ? "bg-stone-950 border-stone-700 text-white"
                                : "bg-white border-stone-200 text-stone-900"
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                            Longitude (GPS Lng)
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={studioContact.hub_lng ?? ""}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value)
                              setStudioContact((prev) => {
                                const updated = { ...prev, hub_lng: val }
                                if (
                                  prev.hub_lat !== undefined &&
                                  val !== undefined
                                ) {
                                  updated.google_maps_url = `https://www.google.com/maps?q=${prev.hub_lat},${val}`
                                }
                                return updated
                              })
                            }}
                            placeholder="-80.287000"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                              isDark
                                ? "bg-stone-950 border-stone-700 text-white"
                                : "bg-white border-stone-200 text-stone-900"
                            }`}
                          />
                        </div>
                      </div>

                      {hubGpsSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                          <CheckIcon
                            size={14}
                            className="text-emerald-500 shrink-0"
                          />
                          <span className="truncate">{hubGpsSuccess}</span>
                        </div>
                      )}
                    </div>

                    {/* Google Maps Location Link Field */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <LocationIcon size={14} />
                          <span>
                            Google Maps Location URL (Direct Pin / Navigation)
                          </span>
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal font-mono">
                          Auto-syncs with coordinates
                        </span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="url"
                          value={studioContact.google_maps_url || ""}
                          onChange={(e) =>
                            setStudioContact({
                              ...studioContact,
                              google_maps_url: e.target.value,
                            })
                          }
                          placeholder="https://maps.google.com/?q=..."
                          className={`flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl text-xs font-mono border transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border-stone-700 text-white placeholder-stone-600"
                              : "bg-white border-stone-200 text-stone-900 placeholder-stone-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openGoogleMaps(
                              studioContact.hub_address,
                              studioContact.google_maps_url,
                              studioContact.hub_lat,
                              studioContact.hub_lng,
                            )
                          }
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          title="Open this location in Google Maps"
                        >
                          <LocationIcon size={14} />
                          <span>View Maps</span>
                        </button>
                        <a
                          href={
                            studioContact.hub_lat && studioContact.hub_lng
                              ? `https://www.google.com/maps/dir/?api=1&destination=${studioContact.hub_lat},${studioContact.hub_lng}`
                              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  studioContact.hub_address || "",
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          title="Direct turn-by-turn navigation route to this garage"
                        >
                          <NavigationIcon size={14} />
                          <span>Navigate</span>
                        </a>
                      </div>
                    </div>

                    {/* Propagate Hub Location to All Cars */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sky-700 dark:text-sky-300 block">
                          Propagate Hub Location to All Fleet Cars
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                          Applies this hub and garage address across all{" "}
                          {cars.length} active vehicles in database.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncHubToFleet}
                        disabled={isSyncingHub}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCwIcon
                          size={14}
                          className={isSyncingHub ? "animate-spin" : ""}
                        />
                        <span>
                          {isSyncingHub
                            ? "Syncing to Fleet..."
                            : "Sync Hub to All Cars"}
                        </span>
                      </button>
                    </div>
                    {syncHubFeedback && (
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                        <CheckIcon size={14} />
                        <span>{syncHubFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons & feedback */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingStudioContact}
                      className="px-6 py-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckIcon size={16} />
                      <span>
                        {isSavingStudioContact
                          ? "Saving to Supabase..."
                          : "Save Contact Settings"}
                      </span>
                    </button>

                    {/* Test Dispatch triggers (WhatsApp Web, WhatsApp App, Gmail, Default Mail) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={
                          getWhatsAppUrls(
                            studioContact.contact_phone,
                            "MOTORLY ATELIER: Test connection from Studio Director Console. Your WhatsApp dispatch integration is active!",
                          ).appUrl
                        }
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? "bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-800"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs"
                        }`}
                        title="Directly opens WhatsApp Native App on phone or desktop"
                      >
                        <PhoneIcon size={14} />
                        <span>Test WhatsApp Mobile (App)</span>
                      </a>

                      <a
                        href={
                          getWhatsAppUrls(
                            studioContact.contact_phone,
                            "MOTORLY ATELIER: Test connection from Studio Director Console. Your WhatsApp dispatch integration is active!",
                          ).webUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200"
                        }`}
                        title="Directly opens WhatsApp Web (web.whatsapp.com) without landing screen"
                      >
                        <MonitorIcon size={14} />
                        <span>Test WhatsApp Web</span>
                      </a>

                      <a
                        href={
                          getEmailUrls(
                            studioContact.contact_email,
                            "MOTORLY ATELIER: Email Dispatch Test",
                            "This is a test notification from the MOTORLY Studio Director Console confirming that your email dispatch integration is operating correctly.",
                          ).gmailUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Directly opens Gmail compose with test email"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1" />
                        <span>Test Gmail Compose</span>
                      </a>

                      <a
                        href={
                          getEmailUrls(
                            studioContact.contact_email,
                            "MOTORLY ATELIER: Email Dispatch Test",
                            "This is a test notification from the MOTORLY Studio Director Console confirming that your email dispatch integration is operating correctly.",
                          ).mailtoUrl
                        }
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? "bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 border-blue-800"
                            : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs"
                        }`}
                        title="Opens device's native mail client"
                      >
                        <MailIcon size={14} />
                        <span>Test Default Mail</span>
                      </a>
                    </div>
                  </div>

                  {contactSaveFeedback && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in">
                      <CheckIcon size={14} />
                      <span>{contactSaveFeedback}</span>
                    </div>
                  )}
                </div>
              </form>
            </section>
          )}
        </main>
      </div>

      {/* ========================================================
          FULL-SCREEN RESERVATION INSPECTION MANIFEST
          ======================================================== */}
      {inspectedBooking && (
        <div
          className={`fixed inset-0 z-[100] w-screen h-screen flex flex-col overflow-hidden animate-fade-in ${
            isDark ? "bg-[#14161A] text-white" : "bg-[#FAF7F2] text-stone-900"
          }`}
        >
          {/* Modal Top Header */}
          <div
            className={`p-3 sm:p-5 lg:p-6 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 ${
              isDark
                ? "bg-[#17191C] border-stone-800"
                : "bg-white border-stone-200 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setInspectedBooking(null)}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                    : "bg-stone-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-stone-700 border border-stone-200 shadow-2xs"
                }`}
                title="Return to Manifest Table (or press Esc)"
              >
                <ArrowLeftIcon size={14} />
                <span>Back</span>
              </button>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-wider block truncate">
                  RESERVATION MANIFEST • FULL VIEW
                </span>
                <h3
                  className={`text-lg sm:text-xl font-black font-mono mt-0.5 leading-none truncate ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {inspectedBooking.id}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoiceBooking(inspectedBooking)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-sm transition flex items-center gap-1 cursor-pointer"
                title="View and inspect full rendered official tax invoice on-screen without downloading"
              >
                <FileTextIcon size={12} className="inline mr-0.5" />
                <span>View Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const matched = cars.find(
                    (c) => c.id === inspectedBooking.matchedCarId,
                  )

                  downloadBookingInvoicePng(
                    inspectedBooking,
                    matched,
                    studioContact,
                  )
                }}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white shadow-sm transition flex items-center gap-1 cursor-pointer"
                title="Download official high-resolution PNG invoice for this trip"
              >
                <DownloadIcon size={12} className="inline mr-0.5 sm:mr-1" />
                <span><span className="hidden sm:inline">Download </span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const matched = cars.find(
                    (c) => c.id === inspectedBooking.matchedCarId,
                  )

                  downloadBookingInvoicePdf(
                    inspectedBooking,
                    matched,
                    studioContact,
                  )
                }}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-sm transition flex items-center gap-1 cursor-pointer"
                title="Download official printable A4 PDF invoice for this trip"
              >
                <DownloadIcon size={12} className="inline mr-0.5 sm:mr-1" />
                <span><span className="hidden sm:inline">Download </span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectedBooking(null)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold cursor-pointer transition ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 shadow-2xs"
                }`}
                title="Close Manifest"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 w-full max-w-[1600px] mx-auto">
            {/* Status Banner with Green Signal */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`my-3 p-4 rounded-xl border space-y-3 transition ${
                isDark
                  ? "bg-stone-900 border-stone-800 text-white"
                  : "bg-white border-stone-200 text-stone-900 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                    Current Lifecycle Stage
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                      inspectedBooking.status === "Completed"
                        ? isDark
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                          : "bg-emerald-50 text-emerald-900 border-emerald-300"
                        : inspectedBooking.status === "Checked Out"
                          ? isDark
                            ? "bg-sky-950/40 text-sky-300 border-sky-500/30"
                            : "bg-sky-50 text-sky-900 border-sky-200"
                          : inspectedBooking.status === "Assigned"
                            ? isDark
                              ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                              : "bg-amber-50 text-amber-900 border-amber-200"
                            : isDark
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                              : "bg-orange-50 text-orange-900 border-orange-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        inspectedBooking.status === "Completed"
                          ? "bg-emerald-500"
                          : inspectedBooking.status === "Checked Out"
                            ? "bg-sky-500 animate-pulse"
                            : "bg-orange-500 animate-pulse"
                      }`}
                    />
                    {inspectedBooking.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {inspectedBooking.status === "Pending Assignment" && (
                    <button
                      onClick={() => handleAutoMate(inspectedBooking)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <ZapIcon size={13} /> Auto-Mate Vehicle
                    </button>
                  )}
                  {inspectedBooking.status === "Assigned" && inspectedBooking.approvedByAdmin && (
                    <button
                      onClick={() => handleOpenKeyHandoff(inspectedBooking)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <ZapIcon size={13} /> Handoff Keys &amp; Start Clock
                    </button>
                  )}
                  {inspectedBooking.status === "Checked Out" && (
                    <button
                      onClick={() =>
                        handleOpenReturnInspection(inspectedBooking)
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <WrenchIcon size={13} /> Return Inspection
                    </button>
                  )}
                  {inspectedBooking.status === "Returned" && (
                    <button
                      onClick={() =>
                        handleOpenReturnInspection(inspectedBooking)
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckIcon size={13} /> Verify Turnaround Audit
                    </button>
                  )}
                </div>
              </div>

              {/* Flow D: Green Signal Approval Banner */}
              {inspectedBooking.approvedByAdmin ? (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    isDark
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-emerald-50 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse shrink-0" />
                    <span
                      className={`font-bold ${
                        isDark ? "text-emerald-300" : "text-emerald-950"
                      }`}
                    >
                      Green Signal Active — Garage Clearance Granted
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${
                      isDark
                        ? "bg-emerald-900/50 text-emerald-300 border-emerald-700"
                        : "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                    }`}
                  >
                    {inspectedBooking.approvedAt
                      ? `Approved ${formatFullDateTime(inspectedBooking.approvedAt)}`
                      : "Verified"}
                  </span>
                </div>
              ) : !inspectedBooking.approvedByAdmin &&
                inspectedBooking.status !== "Completed" &&
                inspectedBooking.status !== "Checked Out" &&
                inspectedBooking.status !== "Cancelled" &&
                inspectedBooking.status !== "Returned" ? (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    isDark
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div>
                    <p
                      className={`font-bold text-sm ${
                        isDark ? "text-amber-300" : "text-amber-950"
                      }`}
                    >
                      Pending Manager Review
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-stone-400" : "text-amber-800"
                      }`}
                    >
                      Review customer dates and vehicle schedule.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveBooking(inspectedBooking.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckIcon size={14} /> Accept Request
                    </button>
                    <button
                      onClick={() => handleDeclineBooking(inspectedBooking.id)}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Flow E: Key Handoff Clock Status */}
              {inspectedBooking.keysHandedAt && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                    isDark
                      ? "bg-stone-950 border-stone-800 text-stone-200"
                      : "bg-sky-50 border-sky-200 text-sky-950"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        isDark ? "text-sky-400" : "text-sky-950"
                      }`}
                    >
                      <ClockIcon size={14} className="text-sky-500" />
                      Rental Clock Active (Keys Handed Over)
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                        isDark
                          ? "bg-stone-800 text-stone-300 border-stone-700"
                          : "bg-white text-sky-950 border-sky-200 shadow-2xs"
                      }`}
                    >
                      {formatFullDateTime(inspectedBooking.keysHandedAt)}
                    </span>
                  </div>
                  {inspectedBooking.checklistOut && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p
                        className={`text-xs ${
                          isDark ? "text-stone-400" : "text-sky-900"
                        }`}
                      >
                        Departure Odometer:{" "}
                        <span
                          className={`font-mono font-bold ${
                            isDark ? "text-white" : "text-sky-950"
                          }`}
                        >
                          {inspectedBooking.checklistOut.odometerOut.toLocaleString()}{" "}
                          {inspectedBooking.checklistOut.odometerUnit || "mi"}
                        </span>{" "}
                        • Fuel Level:{" "}
                        <span
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-sky-950"
                          }`}
                        >
                          {inspectedBooking.checklistOut.fuelLevelOut}
                        </span>{" "}
                        • Dispatch Officer:{" "}
                        <span
                          className={`font-semibold ${
                            isDark ? "text-stone-200" : "text-sky-950"
                          }`}
                        >
                          {inspectedBooking.checklistOut.inspectorStaff ||
                            "Admin Lead"}
                        </span>
                        {inspectedBooking.checklistOut.odometerNotes && (
                          <span className="block text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                            Notes: &quot;{inspectedBooking.checklistOut.odometerNotes}&quot;
                          </span>
                        )}
                      </p>
                      {inspectedBooking.checklistOut.odometerPhoto && (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomedPhoto({
                              url: inspectedBooking.checklistOut!.odometerPhoto!,
                              title: `Departure Odometer & Cluster Proof (${inspectedBooking.id})`,
                            })
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-xs font-bold cursor-pointer transition shrink-0"
                          title="Click to view departure odometer photo"
                        >
                          <CameraIcon size={13} />
                          <span>View Odometer Photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Flow F: High-Priority Extension Request Action Banner (Full-Width Top Alert) */}
            {(inspectedBooking.extensionStatus === "Pending" ||
              inspectedBooking.extensionStatus === "Requested" ||
              inspectedBooking.extensionStatus === "Quoted") && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`p-4 sm:p-5 rounded-2xl border text-xs transition shadow-sm ${
                  inspectedBooking.extensionStatus === "Quoted"
                    ? isDark
                      ? "bg-sky-950/40 border-sky-500/50 text-sky-200"
                      : "bg-sky-50 border-sky-300 text-sky-950"
                    : isDark
                      ? "bg-amber-950/40 border-amber-500/60 text-amber-200"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      inspectedBooking.extensionStatus === "Quoted"
                        ? "bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400"
                        : "bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                    }`}>
                      {inspectedBooking.extensionStatus === "Quoted" ? <SparklesIcon size={20} /> : <ZapIcon size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black font-heading tracking-tight">
                          {inspectedBooking.extensionStatus === "Quoted"
                            ? "Active Extension Quotation Dispatched"
                            : "Customer Requested Rental Extension"}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          inspectedBooking.extensionStatus === "Quoted"
                            ? "bg-sky-500/20 text-sky-800 dark:text-sky-300"
                            : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                        }`}>
                          {inspectedBooking.extensionStatus === "Quoted" ? "Quoted • Awaiting Customer Approval" : "Action Required"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                        <span>
                          Extra Time Requested:{" "}
                          <strong className="font-mono font-bold">
                            +{inspectedBooking.extensionRequest?.durationValue ?? 1}{" "}
                            {inspectedBooking.extensionRequest?.durationUnit ?? "days"}
                          </strong>
                        </span>
                        {inspectedBooking.extensionQuote && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Current Quote: €{inspectedBooking.extensionQuote.totalQuotedAmount} (€{inspectedBooking.extensionQuote.rateAmount}/{inspectedBooking.extensionQuote.rateType})
                          </span>
                        )}
                        {inspectedBooking.extensionRequest?.reason && (
                          <span className="italic text-stone-600 dark:text-stone-300">
                            &quot;{inspectedBooking.extensionRequest.reason}&quot;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenExtensionQuote(inspectedBooking)}
                      className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                        inspectedBooking.extensionStatus === "Quoted"
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "bg-[#F97316] hover:bg-orange-600"
                      }`}
                    >
                      {inspectedBooking.extensionStatus === "Quoted" ? (
                        <>
                          <SparklesIcon size={14} />
                          <span>Modify / Re-Quote Extension →</span>
                        </>
                      ) : (
                        <>
                          <ZapIcon size={14} />
                          <span>Create Quotation &amp; Set Extra Pay →</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeclineExtensionRequest(inspectedBooking.id)
                      }
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isDark
                          ? "bg-stone-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border-stone-700 hover:border-rose-700/50"
                          : "bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border-stone-200 hover:border-rose-200"
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TWO-COLUMN EXECUTIVE LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Vehicle Details, Driver Dossier, Key Handover Checklist (lg:col-span-7 space-y-5) */}
              <div className="lg:col-span-7 space-y-5">
              {/* Mated Vehicle Card & Exact Garage Hub */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`p-4 rounded-xl border transition ${
                  isDark
                    ? "bg-stone-900/60 border-stone-800"
                    : "bg-stone-50 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <CarIcon size={14} className="text-sky-500" /> Staged
                    Vehicle & Garage Allocation
                  </h4>
                  {inspectedBooking.matchedCarId && (
                    <button
                      onClick={() => handleUnmateCar(inspectedBooking.id)}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Unmate / Release
                    </button>
                  )}
                </div>

                {inspectedBooking.matchedCarId ? (
                  (() => {
                    const c = cars.find(
                      (x) => x.id === inspectedBooking.matchedCarId,
                    )

                    return c ? (
                      <div className="space-y-3">
                        <div
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            isDark
                              ? "bg-stone-950 border-stone-800"
                              : "bg-white border-stone-200"
                          }`}
                        >
                          <div className="w-16 h-12 rounded bg-stone-200 dark:bg-stone-800 overflow-hidden shrink-0">
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-bold text-sm ${
                                  isDark ? "text-white" : "text-stone-900"
                                }`}
                              >
                                {c.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                                  isDark
                                    ? "bg-stone-800 text-amber-400 border-stone-700"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {c.plateNumber}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isDark ? "text-stone-400" : "text-stone-500"
                              }`}
                            >
                              {c.type} • {c.location || studioContact.hub_address} • {formatFuelDisplay(c.mileage, c.fuelType)}
                            </p>
                          </div>
                        </div>

                        {/* Flow A/B: Exact Garage Hub & Bay Location */}
                        <div
                          className={`p-3 rounded-lg border text-xs space-y-1 ${
                            isDark
                              ? "bg-stone-950 border-stone-800"
                              : "bg-white border-stone-200"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">
                            Assigned Garage Hub & Stall
                          </span>
                          <p
                            className={`font-bold ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            {c.garageName &&
                            c.garageName !== c.garageAddress &&
                            !c.garageName.includes("Street") &&
                            !c.garageName.includes("terminal") &&
                            !c.garageName.includes("Banda")
                              ? c.garageName
                              : "Operating Station & Dispatch Counter"}
                          </p>
                          <p
                            className={`font-mono text-[11px] ${
                              isDark ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {getCleanHubAddress(
                              c.garageAddress || c.garageName || studioContact.hub_address,
                            )}
                          </p>
                          <p className="text-amber-600 font-mono font-bold text-[11px]">
                            Allocated Bay: {c.garageBay || "Bay 14-B"}
                          </p>
                        </div>
                      </div>
                    ) : null
                  })()
                ) : (
                  <div>
                    <p className="text-xs text-amber-600 font-semibold mb-2">
                      No vehicle currently mated. Select an available car below:
                    </p>
                    <select
                      onChange={(e) => {
                        if (e.target.value)
                          handleMateCar(inspectedBooking.id, e.target.value)
                      }}
                      defaultValue=""
                      className={`w-full px-3 py-2 rounded-lg text-xs transition ${
                        isDark
                          ? "bg-stone-950 border border-stone-700 text-white"
                          : "bg-white border border-stone-200 text-stone-900"
                      }`}
                    >
                      <option value="" disabled>
                        -- Choose Vehicle to Mate --
                      </option>
                      {cars

                        .filter((c) => c.status === "Available")

                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.plateNumber}) - {c.type} (€
                            {c.pricePerDay}/day)
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className={`p-4 rounded-xl border transition ${
                  isDark
                    ? "bg-stone-900/60 border-stone-800 text-white"
                    : "bg-white border-stone-200 text-stone-900 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-[#F97316]" /> Customer
                    &amp; Driver Information
                  </h4>
                  <button
                    onClick={() =>
                      handleDownloadLicense(inspectedBooking, "certificate")
                    }
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition border flex items-center gap-1.5 shadow-sm ${
                      isDark
                        ? "bg-stone-800 hover:bg-[#F97316] text-stone-300 hover:text-white border-stone-700"
                        : "bg-white hover:bg-[#F97316] text-stone-700 hover:text-white border-stone-200"
                    }`}
                    title="Download Official SVG ID Certificate"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download SVG Certificate
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs pt-1">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-0.5">
                      Legal Name
                    </span>
                    <p
                      className={`font-bold text-sm ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      {inspectedBooking.customer.firstName}{" "}
                      {inspectedBooking.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-0.5">
                      Phone Contact
                    </span>
                    <p
                      className={`font-semibold text-sm ${
                        isDark ? "text-stone-100" : "text-stone-900"
                      }`}
                    >
                      {inspectedBooking.customer.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-0.5">
                      Email Address
                    </span>
                    <p
                      className={`font-medium ${
                        isDark ? "text-stone-300" : "text-stone-700"
                      }`}
                    >
                      {inspectedBooking.customer.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-0.5">
                      Driver License
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                          isDark
                            ? "bg-amber-950/40 text-amber-300 border-amber-600/40"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {inspectedBooking.driver?.licenseNumber ||
                          "FL-VND-88912"}
                      </span>
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        ({inspectedBooking.driver?.licenseState || "FL"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flow C: Customer Real Driver License Identification Photos */}
                <div
                  className={`mt-4 pt-3.5 border-t space-y-2.5 ${
                    isDark ? "border-stone-800" : "border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Uploaded Driver License Documents
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold">
                      High-Resolution Real Uploads
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Photo Card */}
                    {(() => {
                      const frontSrc =
                        (inspectedBooking.driver?.licenseFileName?.startsWith(
                          "data:",
                        )
                          ? inspectedBooking.driver.licenseFileName
                          : null) ||
                        (inspectedBooking.driver?.licensePhotoFront?.startsWith(
                          "data:",
                        )
                          ? inspectedBooking.driver.licensePhotoFront
                          : null) ||
                        api.getLicenseDownloadUrl(
                          inspectedBooking.id,

                          "front",
                        )

                      return (
                        <div
                          className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isDark
                              ? "bg-stone-950 border-stone-800"
                              : "bg-white border-stone-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-700 dark:text-stone-300">
                              License Front Photo
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {inspectedBooking.driver?.licenseFileName ||
                                "front_id.png"}
                            </span>
                          </div>
                          <div
                            onClick={() =>
                              setZoomedPhoto({
                                url: frontSrc,

                                title: `Driver License Front - ${inspectedBooking.customer.firstName} ${inspectedBooking.customer.lastName}`,
                              })
                            }
                            className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 cursor-zoom-in group flex items-center justify-center p-2"
                            title="Click to zoom / view full resolution"
                          >
                            <img
                              src={frontSrc}
                              alt="Driver License Front"
                              className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-102 transition-transform drop-shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-xl backdrop-blur-xs">
                              Click to Zoom High-Res
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadLicense(
                                  inspectedBooking,

                                  "front",
                                )
                              }
                              className="flex-1 py-1.5 px-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Download Front
                            </button>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Back Photo Card */}
                    {(() => {
                      const backSrc =
                        (inspectedBooking.driver?.licenseBackFileName?.startsWith(
                          "data:",
                        )
                          ? inspectedBooking.driver.licenseBackFileName
                          : null) ||
                        (inspectedBooking.driver?.licensePhotoBack?.startsWith(
                          "data:",
                        )
                          ? inspectedBooking.driver.licensePhotoBack
                          : null) ||
                        api.getLicenseDownloadUrl(inspectedBooking.id, "back")

                      return (
                        <div
                          className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isDark
                              ? "bg-stone-950 border-stone-800"
                              : "bg-white border-stone-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-700 dark:text-stone-300">
                              License Back Barcode
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {inspectedBooking.driver?.licenseBackFileName ||
                                "back_id.png"}
                            </span>
                          </div>
                          <div
                            onClick={() =>
                              setZoomedPhoto({
                                url: backSrc,

                                title: `Driver License Back - ${inspectedBooking.customer.firstName} ${inspectedBooking.customer.lastName}`,
                              })
                            }
                            className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 cursor-zoom-in group flex items-center justify-center p-2"
                            title="Click to zoom / view full resolution"
                          >
                            <img
                              src={backSrc}
                              alt="Driver License Back"
                              className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-102 transition-transform drop-shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-xl backdrop-blur-xs">
                              Click to Zoom High-Res
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadLicense(
                                  inspectedBooking,

                                  "back",
                                )
                              }
                              className="flex-1 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Download Back
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* FLOW E: Embedded Key Handover & Departure Station */}
              {inspectedBooking.status === "Assigned" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`p-5 rounded-2xl border space-y-4 transition shadow-xs ${
                    inspectedBooking.approvedByAdmin
                      ? isDark
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-emerald-50/70 border-emerald-200"
                      : isDark
                        ? "bg-amber-950/20 border-amber-500/30"
                        : "bg-amber-50/70 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                          inspectedBooking.approvedByAdmin
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        <ZapIcon size={16} />
                      </span>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-stone-900 dark:text-white">
                          Key Handover &amp; Departure Checklist
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {inspectedBooking.approvedByAdmin
                            ? "Inspect vehicle odometer, certify departure fuel, and hand over keys."
                            : "Awaiting manager clearance before physical keys can be dispatched."}
                        </p>
                      </div>
                    </div>
                    {inspectedBooking.approvedByAdmin ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                        Clearance Granted
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApproveBooking(inspectedBooking.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckIcon size={14} /> Accept Request First
                      </button>
                    )}
                  </div>

                  {inspectedBooking.approvedByAdmin ? (
                    <div className="space-y-3.5">
                      {(() => {
                        const matched = cars.find(
                          (c) => c.id === inspectedBooking.matchedCarId,
                        )
                        const baselineOdo = matched?.currentOdometer || 15200
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block font-bold text-stone-700 dark:text-stone-300">
                                    Departure Odometer
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setKeyChecklist((prev) => ({
                                          ...prev,
                                          odometerOut: baselineOdo,
                                        }))
                                      }
                                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                      title="Sync with fleet baseline odometer"
                                    >
                                      <RefreshCwIcon size={10} /> Sync ({baselineOdo.toLocaleString()})
                                    </button>
                                    <div className="inline-flex rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 text-[10px] font-bold">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setKeyChecklist((prev) => ({
                                            ...prev,
                                            odometerUnit: "mi",
                                          }))
                                        }
                                        className={`px-1.5 py-0.5 rounded transition ${
                                          keyChecklist.odometerUnit !== "km"
                                            ? "bg-amber-500 text-white"
                                            : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                                        }`}
                                      >
                                        mi
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setKeyChecklist((prev) => ({
                                            ...prev,
                                            odometerUnit: "km",
                                          }))
                                        }
                                        className={`px-1.5 py-0.5 rounded transition ${
                                          keyChecklist.odometerUnit === "km"
                                            ? "bg-amber-500 text-white"
                                            : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                                        }`}
                                      >
                                        km
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={keyChecklist.odometerOut}
                                    onChange={(e) =>
                                      setKeyChecklist({
                                        ...keyChecklist,
                                        odometerOut: Number(e.target.value),
                                      })
                                    }
                                    className={`w-full pr-12 px-3 py-2 rounded-xl font-mono text-xs font-bold transition ${
                                      isDark
                                        ? "bg-stone-950 border border-stone-700 text-white"
                                        : "bg-white border border-stone-200 text-stone-900 shadow-2xs"
                                    }`}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-400 font-mono pointer-events-none">
                                    {keyChecklist.odometerUnit || "mi"}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                                  Departure Fuel / Battery Level
                                </label>
                                <select
                                  value={keyChecklist.fuelLevelOut}
                                  onChange={(e) =>
                                    setKeyChecklist({
                                      ...keyChecklist,
                                      fuelLevelOut: e.target.value,
                                    })
                                  }
                                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition ${
                                    isDark
                                      ? "bg-stone-950 border border-stone-700 text-white"
                                      : "bg-white border border-stone-200 text-stone-900 shadow-2xs"
                                  }`}
                                >
                                  <option value="Full (100%)">Full (100%)</option>
                                  <option value="90%">90%</option>
                                  <option value="80%">80%</option>
                                  <option value="75%">75%</option>
                                  <option value="50%">50%</option>
                                </select>
                              </div>
                            </div>

                            {/* Odometer Proof Photo & Cluster Verification */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <CameraIcon size={13} className="text-amber-500" />
                                    <span>Cluster &amp; Odometer Photo</span>
                                  </span>
                                  <span className="text-[10px] font-normal text-stone-500">Optional</span>
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  id="manifest-odo-photo"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const compressed = await compressVehiclePhoto(file)
                                      setKeyChecklist((prev) => ({
                                        ...prev,
                                        odometerPhoto: compressed,
                                      }))
                                    }
                                  }}
                                />
                                {keyChecklist.odometerPhoto ? (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                    <div
                                      onClick={() =>
                                        setZoomedPhoto({
                                          url: keyChecklist.odometerPhoto!,
                                          title: `Odometer Proof Photo - ${inspectedBooking.id}`,
                                        })
                                      }
                                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                    >
                                      <img
                                        src={keyChecklist.odometerPhoto}
                                        alt="Odometer Proof"
                                        className="w-10 h-8 object-cover rounded-lg border border-emerald-500/40 shrink-0"
                                      />
                                      <div className="min-w-0 text-[11px]">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                          Photo Attached ✓
                                        </p>
                                        <p className="text-[10px] text-stone-500 truncate">
                                          Click to preview full size
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setKeyChecklist((prev) => ({
                                          ...prev,
                                          odometerPhoto: undefined,
                                        }))
                                      }
                                      className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold transition cursor-pointer shrink-0"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor="manifest-odo-photo"
                                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed cursor-pointer transition text-xs font-medium ${
                                      isDark
                                        ? "bg-stone-950/60 border-stone-700 hover:border-amber-500 text-stone-300"
                                        : "bg-stone-50 border-stone-300 hover:border-amber-500 text-stone-700"
                                    }`}
                                  >
                                    <CameraIcon size={14} className="text-amber-500" />
                                    <span>Upload / Snap Dashboard Proof</span>
                                  </label>
                                )}
                              </div>
                              <div>
                                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                                  Odometer / Cluster Notes
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Clean dashboard, zero warning lights"
                                  value={keyChecklist.odometerNotes || ""}
                                  onChange={(e) =>
                                    setKeyChecklist({
                                      ...keyChecklist,
                                      odometerNotes: e.target.value,
                                    })
                                  }
                                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                                    isDark
                                      ? "bg-stone-950 border border-stone-700 text-white"
                                      : "bg-white border border-stone-200 text-stone-900 shadow-2xs"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer ${
                          isDark ? "bg-stone-900/60 border-stone-800" : "bg-white border-stone-200 shadow-2xs"
                        }`}>
                          <input
                            type="checkbox"
                            checked={keyChecklist.cleanlinessVerified}
                            onChange={(e) =>
                              setKeyChecklist({
                                ...keyChecklist,
                                cleanlinessVerified: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                          />
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            Interior Sanitized &amp; Vacuumed
                          </span>
                        </label>
                        <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer ${
                          isDark ? "bg-stone-900/60 border-stone-800" : "bg-white border-stone-200 shadow-2xs"
                        }`}>
                          <input
                            type="checkbox"
                            checked={keyChecklist.tiresExteriorVerified}
                            onChange={(e) =>
                              setKeyChecklist({
                                ...keyChecklist,
                                tiresExteriorVerified: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                          />
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            Exterior Walkaround &amp; Tires Certified
                          </span>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="w-full sm:w-auto flex-1 text-xs">
                          <input
                            type="text"
                            placeholder="Dispatch Staff Name"
                            value={keyChecklist.inspectorStaff}
                            onChange={(e) =>
                              setKeyChecklist({
                                ...keyChecklist,
                                inspectorStaff: e.target.value,
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                              isDark
                                ? "bg-stone-950 border border-stone-700 text-white"
                                : "bg-white border border-stone-200 text-stone-900 shadow-2xs"
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isSubmittingKeyHandoff}
                          onClick={async () => {
                            if (!inspectedBooking || isSubmittingKeyHandoff) return
                            try {
                              setIsSubmittingKeyHandoff(true)
                              const matched = cars.find(
                                (c) => c.id === inspectedBooking.matchedCarId,
                              )
                              const res = await api.handoverKeys(inspectedBooking.id, {
                                odometerOut: Number(keyChecklist.odometerOut) || matched?.currentOdometer || 15200,
                                odometerUnit: keyChecklist.odometerUnit || "mi",
                                odometerPhoto: keyChecklist.odometerPhoto,
                                odometerNotes: keyChecklist.odometerNotes,
                                fuelOut: keyChecklist.fuelLevelOut || "Full (100%)",
                                exteriorClean: keyChecklist.cleanlinessVerified,
                                tiresInspected: keyChecklist.tiresExteriorVerified,
                                staffSign: keyChecklist.inspectorStaff,
                              })
                              if (res.success) {
                                setBookings((prev) =>
                                  prev.map((b) => (b.id === inspectedBooking.id ? res.booking : b)),
                                )
                                setInspectedBooking(res.booking)
                                const freshCars = await api.getCars()
                                setCars(freshCars)
                                notify(`Keys handed over for ${inspectedBooking.id}! Live rental timer initiated.`)
                              }
                            } catch (err: any) {
                              alert("Key handoff failed: " + err.message)
                            } finally {
                              setIsSubmittingKeyHandoff(false)
                            }
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          {isSubmittingKeyHandoff ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Starting Trip...</span>
                            </>
                          ) : (
                            <>
                              <ZapIcon size={14} />
                              <span>Confirm Key Handover &amp; Start Clock</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      Please click <strong>Accept Request First</strong> to grant garage clearance before dispatching keys to the client.
                    </div>
                  )}
                </div>
              )}

              </div>

              {/* RIGHT COLUMN: Rental Schedule, Billing, Extension, Return Audit (lg:col-span-5 space-y-5) */}
              <div className="lg:col-span-5 space-y-5">
            {/* RENTAL TIME, SCHEDULE & DURATION CARD */}
            {(() => {
              const durationInfo = getBookingDurationInfo(
                inspectedBooking.pickupDate,

                inspectedBooking.returnDate,
              )

              const pickupTimeStr = formatReadableTime(
                inspectedBooking.pickupDate?.includes(":")
                  ? inspectedBooking.pickupDate
                  : undefined,

                "10:00 AM",
              )

              const returnTimeStr = formatReadableTime(
                inspectedBooking.returnDate?.includes(":")
                  ? inspectedBooking.returnDate
                  : undefined,

                "10:00 AM",
              )

              const elapsedClock = getElapsedClock(
                inspectedBooking.keysHandedAt,

                inspectedBooking.checklistIn?.timestamp,
              )

              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`my-3 p-4 rounded-xl border transition ${
                    isDark
                      ? "bg-stone-900/60 border-stone-800 text-white"
                      : "bg-white border-stone-200 text-stone-900 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
                        <ClockIcon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Rental Time &amp; Duration
                        </h4>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">
                          Booked schedule &amp; active rental duration
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
                      ⏱️ {durationInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5">
                    {/* Pickup Details */}
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-stone-950 border-stone-800"
                          : "bg-stone-50 border-stone-200"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Pickup Schedule
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-white mt-1">
                        {inspectedBooking.pickupDate}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Scheduled Time: {pickupTimeStr}
                      </p>
                      <p
                        className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate"
                        title={inspectedBooking.pickupLocation}
                      >
                        {inspectedBooking.pickupLocation}
                      </p>
                    </div>

                    {/* Return Details */}
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-stone-950 border-stone-800"
                          : "bg-stone-50 border-stone-200"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Return Schedule
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-white mt-1">
                        {inspectedBooking.returnDate}
                      </p>
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
                        Scheduled Time: {returnTimeStr}
                      </p>
                      <p
                        className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate"
                        title={inspectedBooking.returnLocation}
                      >
                        {inspectedBooking.returnLocation}
                      </p>
                    </div>
                  </div>

                  {/* Active Clock Duration Bar if Dispatched */}
                  {inspectedBooking.keysHandedAt && (
                    <div
                      className={`mt-3 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isDark
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                          : "bg-emerald-50 border-emerald-200 text-emerald-950"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-semibold">
                          Rental Clock Started:{" "}
                          <span className="font-normal">
                            {formatFullDateTime(inspectedBooking.keysHandedAt)}
                          </span>
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold border shrink-0 ${
                          isDark
                            ? "bg-emerald-900/50 text-emerald-300 border-emerald-700"
                            : "bg-white text-emerald-900 border-emerald-300 shadow-2xs"
                        }`}
                      >
                        {inspectedBooking.status === "Completed"
                          ? "Completed Duration"
                          : "Elapsed Time"}
                        : {elapsedClock}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

              {/* TRIP LOGISTICS & CONTRACT BILLING CARD */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                  isDark
                    ? "bg-stone-900/60 border-stone-800 text-white"
                    : "bg-white border-stone-200 text-stone-900 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <TagIcon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Trip Logistics &amp; Contract Billing
                      </h4>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">
                        Routing hub, return point &amp; total invoice
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pickup Location:</span>
                  <span
                    className={`font-medium ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedBooking.pickupLocation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pickup Date/Time:</span>
                  <span
                    className={`font-mono ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedBooking.pickupDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Return Location:</span>
                  <span
                    className={`font-medium ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedBooking.returnLocation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Return Date/Time:</span>
                  <span
                    className={`font-mono ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedBooking.returnDate}
                  </span>
                </div>
                {inspectedBooking.promoCode && (
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    <span className="flex items-center gap-1.5">
                      <TagIcon size={12} />
                      Privilege Voucher:
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20">
                      {inspectedBooking.promoCode}
                    </span>
                  </div>
                )}
                {(inspectedBooking.tripReason || inspectedBooking.notes) && (
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200/80 dark:border-stone-800 text-xs">
                    <span className="text-stone-500 font-medium">Trip Purpose:</span>
                    <span className="font-bold text-[#F97316] bg-orange-500/10 dark:bg-orange-950/40 border border-orange-500/20 px-2.5 py-0.5 rounded-md text-xs">
                      {inspectedBooking.tripReason || inspectedBooking.notes}
                    </span>
                  </div>
                )}
                <div
                  className={`pt-2 border-t flex justify-between font-mono font-bold text-sm ${
                    isDark
                      ? "border-stone-800 text-white"
                      : "border-stone-200 text-stone-900"
                  }`}
                >
                  <span>Total Billing:</span>
                  <span className="text-emerald-500">
                    €{inspectedBooking.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

            {/* Flow F: Extension Request Alert Banner */}
            {(inspectedBooking.extensionStatus === "Pending" ||
              inspectedBooking.extensionStatus === "Requested") && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`mb-4 p-4 rounded-xl border text-xs space-y-2 transition ${
                  isDark
                    ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-sm">
                    Customer Requested Rental Extension
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase">
                    Action Required
                  </span>
                </div>
                <div
                  className={`p-2.5 rounded-lg border space-y-1 ${
                    isDark
                      ? "bg-stone-950 border-stone-800 text-stone-300"
                      : "bg-white border-stone-200 text-stone-700"
                  }`}
                >
                  <p>
                    Extra Time Requested:{" "}
                    <strong
                      className={`font-mono ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      +{inspectedBooking.extensionRequest?.durationValue}{" "}
                      {inspectedBooking.extensionRequest?.durationUnit}
                    </strong>
                  </p>
                  <p>
                    Customer Notes:{" "}
                    <em
                      className={isDark ? "text-stone-400" : "text-stone-600"}
                    >
                      "
                      {inspectedBooking.extensionRequest?.reason ||
                        "Trip extended."}
                      "
                    </em>
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleOpenExtensionQuote(inspectedBooking)}
                    className="flex-1 py-2 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs transition shadow-sm"
                  >
                    Create &amp; Send Quotation →
                  </button>
                  <button
                    onClick={() =>
                      handleDeclineExtensionRequest(inspectedBooking.id)
                    }
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      isDark
                        ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {inspectedBooking.extensionStatus === "Quoted" &&
              inspectedBooking.extensionQuote && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`mb-4 p-3.5 rounded-xl border text-xs space-y-2.5 transition ${
                    isDark
                      ? "bg-sky-950/40 border-sky-500/40 text-sky-200"
                      : "bg-sky-50 border-sky-200 text-sky-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <SparklesIcon size={14} className="text-sky-500" />
                      Quotation Dispatched to Customer
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      +€
                      {inspectedBooking.extensionQuote.totalQuotedAmount.toFixed(
                        2,
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Rate: €{inspectedBooking.extensionQuote.rateAmount} /{" "}
                    {inspectedBooking.extensionQuote.rateType} • Awaiting
                    customer approval in self-service portal.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenExtensionQuote(inspectedBooking)}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SparklesIcon size={13} />
                      <span>Modify / Re-Quote Extension →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeclineExtensionRequest(inspectedBooking.id)
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                        isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                          : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

            {inspectedBooking.extensionStatus === "Approved" &&
              inspectedBooking.extensionQuote && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`mb-4 p-3.5 rounded-xl border text-xs flex items-center justify-between transition ${
                    isDark
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-emerald-50 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Extension Approved &amp; Added to Billing (+€
                    {inspectedBooking.extensionQuote.totalQuotedAmount.toFixed(
                      2,
                    )}
                    )
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      isDark
                        ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
                        : "bg-white text-emerald-900 border-emerald-300 shadow-2xs"
                    }`}
                  >
                    Bill Total Updated
                  </span>
                </div>
              )}

              {/* Flow G: Return Inspection Summary if Completed */}
              {inspectedBooking.checklistIn && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`p-4 rounded-2xl border text-xs space-y-3 transition ${
                    isDark
                      ? "bg-stone-900/60 border-stone-800"
                      : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inspectedBooking.checklistIn.damageFound
                            ? "bg-rose-500 animate-pulse"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span
                        className={`font-bold uppercase tracking-wider text-xs font-heading ${
                          inspectedBooking.checklistIn.damageFound
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {inspectedBooking.checklistIn.damageFound
                          ? "Post-Trip Inspection: Damage Documented"
                          : "Post-Trip Inspection: 0 Damage Passed Clean"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      Audited{" "}
                      {inspectedBooking.checklistIn.timestamp
                        ? new Date(
                            inspectedBooking.checklistIn.timestamp,
                          ).toLocaleDateString()
                        : "Certified"}
                    </span>
                  </div>

                  {/* Return Metrics: Odometer, Fuel, Auditor */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                      <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                        Return Odometer
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {inspectedBooking.checklistIn.odometerIn.toLocaleString()}{" "}
                        mi
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                      <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                        Return Fuel
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {inspectedBooking.checklistIn.fuelLevelIn}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                        Certified Auditor
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white truncate block">
                        {inspectedBooking.checklistIn.inspectorStaff ||
                          "Lead Auditor"}
                      </span>
                    </div>
                  </div>

                  {/* Damage Incident Details if Damage Found */}
                  {inspectedBooking.checklistIn.damageFound ? (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600 text-white font-mono">
                            {inspectedBooking.checklistIn.damageSeverity ||
                              "Damage Incident"}
                          </span>
                          {inspectedBooking.checklistIn.damageLocation && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-mono">
                              {inspectedBooking.checklistIn.damageLocation}
                            </span>
                          )}
                        </div>
                        {Number(inspectedBooking.checklistIn.damageFee) > 0 && (
                          <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                            Repair Surcharge: €
                            {Number(
                              inspectedBooking.checklistIn.damageFee,
                            ).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {inspectedBooking.checklistIn.damageNotes && (
                        <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                          <strong className="text-rose-600 dark:text-rose-400 font-bold">
                            Auditor Notes:
                          </strong>{" "}
                          {inspectedBooking.checklistIn.damageNotes}
                        </p>
                      )}

                      {/* Attached Damage Photos */}
                      {inspectedBooking.checklistIn.damagePhotos &&
                        inspectedBooking.checklistIn.damagePhotos.length >
                          0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400 font-mono block">
                              Documented Photo Evidence (
                              {inspectedBooking.checklistIn.damagePhotos.length}{" "}
                              photos):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {inspectedBooking.checklistIn.damagePhotos.map(
                                (photo, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() =>
                                      setZoomedPhoto({
                                        url: photo,
                                        title: `Damage Audit Photo #${pIdx + 1} (${inspectedBooking.id})`,
                                      })
                                    }
                                    className="group relative aspect-video rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 cursor-pointer shadow-xs bg-black"
                                  >
                                    <img
                                      src={photo}
                                      alt={`Damage Evidence ${pIdx + 1}`}
                                      className="w-full h-full object-cover transition group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition pointer-events-none" />
                                    <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                                      #{pIdx + 1} Click to zoom
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      <CheckIcon
                        size={14}
                        className="text-emerald-500 shrink-0"
                      />
                      <span>
                        Zero new damage recorded. Vehicle cleared return audit
                        with full deposit release.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`pt-4 sm:pt-6 border-t flex flex-col sm:flex-row gap-2 sm:gap-3 ${
              isDark ? "border-stone-800" : "border-stone-200"
            }`}
          >
            <button
              onClick={() => setInspectedBooking(null)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark
                  ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 shadow-2xs"
              }`}
            >
              Close Inspection Sheet
            </button>
            {inspectedBooking.status !== "Cancelled" && (
              <button
                onClick={() => {
                  if (window.confirm("Cancel this reservation?")) {
                    handleAdvanceStatus(inspectedBooking.id, "Cancelled")
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================
          FULL-SCREEN VEHICLE STUDIO (Flow A: Fleet, Insurance & Garage Map)
          ======================================================== */}
      {isCarModalOpen && (
        <div
          className={`fixed inset-0 z-[100] w-screen h-screen flex flex-col overflow-hidden animate-fade-in ${
            isDark ? "bg-[#14161A] text-white" : "bg-[#FAF7F2] text-stone-900"
          }`}
        >
          {/* Executive Full-Width Studio Header */}
          <div
            className={`px-4 sm:px-8 py-3.5 sm:py-4 border-b flex items-center justify-between shrink-0 ${
              isDark
                ? "border-stone-800 bg-stone-900/60"
                : "border-stone-200/90 bg-white shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="back-car-modal"
                onClick={() => setIsCarModalOpen(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                }`}
              >
                <span>&larr;</span>
                <span>Back</span>
              </button>
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center font-black shrink-0">
                <CarIcon size={18} />
              </div>
              <div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-wider">
                    FLEET MANAGEMENT • BAY 1
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    LIVE SYNC
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black font-heading tracking-tight">
                  {editingCar
                    ? `Edit Vehicle: ${editingCar.name}`
                    : "Add New Vehicle to Fleet"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsCarModalOpen(false)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById(
                    "car-studio-form",
                  ) as HTMLFormElement

                  if (form) form.requestSubmit()
                }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm items-center gap-1.5 cursor-pointer font-heading"
              >
                <CheckIcon size={14} />
                <span>
                  {editingCar ? "Save Changes" : "Save & Add to Fleet"}
                </span>
              </button>
              <button
                type="button"
                data-testid="close-car-modal"
                onClick={() => setIsCarModalOpen(false)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200"
                }`}
                title="Close Studio"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Segmented Top Section Tabs */}
          <div
            className={`px-6 py-2.5 border-b flex overflow-x-auto no-scrollbar gap-2 shrink-0 ${
              isDark
                ? "border-stone-800 bg-stone-900/20"
                : "border-stone-200/80 bg-stone-100/40"
            }`}
          >
            {[
              {
                id: "identity",
                label: "1. Details",
                fullLabel: "1. Vehicle Details",
                icon: <CarIcon size={14} />,
                desc: "Make, Model, Year & Photo",
              },
              {
                id: "rates",
                label: "2. Pricing",
                fullLabel: "2. Pricing & Engine",
                icon: <ClockIcon size={14} />,
                desc: "Rates, Fuel & Specs",
              },
              {
                id: "insurance",
                label: "3. Insurance",
                fullLabel: "3. Insurance & Policy",
                icon: <ShieldIcon size={14} />,
                desc: "Coverage & Mileage",
              },
              {
                id: "garage",
                label: "4. Garage",
                fullLabel: "4. Garage Location",
                icon: <LocationIcon size={14} />,
                desc: "Facility & Parking Bay",
              },
            ].map((tab) => {
              const isActive = carModalTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCarModalTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#F97316] text-white shadow-sm"
                      : isDark
                        ? "bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800"
                        : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="font-heading hidden sm:inline">
                    {tab.fullLabel}
                  </span>
                  <span className="font-heading sm:hidden">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Studio Body: Two-Column Full-Screen Layout */}
          <form
            id="car-studio-form"
            noValidate
            onSubmit={handleSaveCar}
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
          >
            {/* Left Column (Inputs for Active Tab) */}
            <div className="lg:col-span-7 space-y-5">
              {/* TAB 1: IDENTITY & CLASSIFICATION */}
              {carModalTab === "identity" && (
                <div className="space-y-4 animate-fade-in">
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                      Vehicle Identity & Category
                    </h4>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Brand, Model & Visual Photo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Manufacturer / Brand{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Toyota, BMW, Mercedes"
                        value={carFormData.brand || ""}
                        onChange={(e) => {
                          const newBrand = e.target.value

                          setCarFormData({
                            ...carFormData,

                            brand: newBrand,

                            name: `${newBrand} ${carFormData.model || ""}`.trim(),
                          })
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Model Name & Trim{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Camry XSE, 330i M-Sport"
                        value={carFormData.model || ""}
                        onChange={(e) => {
                          const newModel = e.target.value

                          setCarFormData({
                            ...carFormData,

                            model: newModel,

                            name: `${carFormData.brand || ""} ${newModel}`.trim(),
                          })
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Model Year
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="2024"
                        value={carFormData.year ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "")
                          setCarFormData({
                            ...carFormData,
                            year: val === "" ? "" as any : val,
                          })
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        License Plate Registration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FL-882-MTR"
                        value={carFormData.plateNumber || ""}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            plateNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-amber-400"
                            : "bg-white border border-stone-300 text-amber-700 focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Category Selector with Interactive Chips */}
                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${
                        isDark ? "text-stone-300" : "text-stone-800"
                      }`}
                    >
                      Car Category
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        "Economy",

                        "Sedan",

                        "SUV",

                        "Luxury",

                        "Van",
                      ] as VehicleType[]).map((cat) => {
                        const isSelected = (carFormData.type || "Sedan") === cat

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() =>
                              setCarFormData({ ...carFormData, type: cat })
                            }
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              isSelected
                                ? "bg-[#F97316] text-white border-[#F97316] shadow-sm"
                                : isDark
                                  ? "bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500"
                                  : "bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <span className="text-stone-400 group-hover:text-stone-600">
                              {cat === "Sedan" ? (
                                <CarIcon size={14} />
                              ) : cat === "SUV" ? (
                                <ShieldIcon size={14} />
                              ) : cat === "Luxury" ? (
                                <SparklesIcon size={14} />
                              ) : cat === "Economy" ? (
                                <ClockIcon size={14} />
                              ) : (
                                <CarIcon size={14} />
                              )}
                            </span>
                            <span className="text-[11px] font-heading">
                              {cat}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Vehicle Photos & Multi-Angle Gallery Studio */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label
                          className={`block text-xs font-bold ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Vehicle Photos & Multi-Angle Gallery
                        </label>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Upload multiple exterior, interior, cockpit, and angle
                          photos. First photo serves as primary listing cover.
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[#F97316] border border-orange-500/20">
                        {(carFormData.gallery || []).length} Photo
                        {(carFormData.gallery || []).length !== 1 ? "s" : ""} in
                        Gallery
                      </span>
                    </div>

                    {/* Hidden Multi-File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleDevicePhotoUpload}
                    />

                    {/* Photo Upload Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Device Multi-Upload Button */}
                      <button
                        type="button"
                        disabled={isUploadingPhotos}
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 text-[#F97316] border-2 border-dashed border-orange-300 dark:border-orange-500/40 hover:border-orange-500 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs group disabled:opacity-50"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">
                          {isUploadingPhotos ? "Uploading..." : "Add Photo"}
                        </span>
                        <span>
                          {isUploadingPhotos
                            ? "Processing & Optimizing Photos..."
                            : "Upload Multiple Photos (Device / Camera)"}
                        </span>
                      </button>

                      {/* Web URL Input Box */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Paste image web link (https://...)"
                          value={newPhotoUrlInput}
                          onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()

                              handleAddPhotoUrl()
                            }
                          }}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                              : "bg-white border border-stone-300 text-stone-900 placeholder-stone-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddPhotoUrl}
                          className="px-3.5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>

                    {/* 1-Click Multi-Angle Sample Photos */}
                    <div className="space-y-1 pt-0.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isDark ? "text-stone-400" : "text-stone-500"
                        }`}
                      >
                        Quick Add Preset Multi-Angle Photos:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          {
                            label: "+ Front Angle (Sedan)",

                            url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
                          },

                          {
                            label: "+ Rear & Side Profile",

                            url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                          },

                          {
                            label: "+ Luxury Cockpit / Interior",

                            url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
                          },

                          {
                            label: "+ Black SUV Angle",

                            url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
                          },

                          {
                            label: "+ Red Coupe View",

                            url: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80",
                          },

                          {
                            label: "+ Tesla EV Front",

                            url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
                          },
                        ].map((preset) => {
                          const isAlreadyAdded = (carFormData.gallery || [])

                            .includes(preset.url)

                          return (
                            <button
                              key={preset.label}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddPresetPhoto(preset.url)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                                isAlreadyAdded
                                  ? "opacity-40 cursor-not-allowed bg-stone-200 dark:bg-stone-800 text-stone-500 border-transparent"
                                  : isDark
                                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                                    : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                              }`}
                            >
                              {isAlreadyAdded ? "Added" : preset.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Interactive Gallery Thumbnails & Reordering Grid */}
                    <div className="pt-2">
                      {(carFormData.gallery || []).length === 0 ? (
                        <div
                          className={`p-6 rounded-2xl border-2 border-dashed text-center ${
                            isDark
                              ? "border-stone-800 bg-stone-900/30 text-stone-400"
                              : "border-stone-200 bg-stone-50 text-stone-500"
                          }`}
                        >
                          <p className="text-sm font-bold">
                            No photos in gallery
                          </p>
                          <p className="text-xs mt-1">
                            Upload multiple photos from your device or use the
                            sample angles above.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(carFormData.gallery || []).map((imgUrl, idx) => {
                            const isCover =
                              idx === 0 || imgUrl === carFormData.image

                            return (
                              <div
                                key={idx}
                                className={`group relative rounded-2xl overflow-hidden border transition flex flex-col justify-between ${
                                  isCover
                                    ? "border-[#F97316] ring-2 ring-orange-500/30 shadow-md " +
                                      (isDark
                                        ? "bg-stone-900"
                                        : "bg-orange-50/20")
                                    : isDark
                                      ? "border-stone-800 bg-stone-900/60 hover:border-stone-700"
                                      : "border-stone-200 bg-white hover:border-stone-300 shadow-2xs"
                                }`}
                              >
                                {/* Thumbnail Image */}
                                <div className="relative aspect-video w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                                  <img
                                    src={imgUrl}
                                    alt={`Gallery photo ${idx + 1}`}
                                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                    onError={(e) => {
                                      ;(e.target as any).src =
                                        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"
                                    }}
                                  />

                                  {/* Cover / Position Badge */}
                                  {isCover ? (
                                    <span className="absolute top-2 left-2 bg-[#F97316] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                                      Primary Cover
                                    </span>
                                  ) : (
                                    <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                                      Photo #{idx + 1}
                                    </span>
                                  )}

                                  {/* Lightbox Zoom Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomedPhoto({
                                        url: imgUrl,

                                        title: `${carFormData.name || "Vehicle"} - Photo ${idx + 1}${
                                          isCover ? " (Cover)" : ""
                                        }`,
                                      })
                                    }
                                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white text-xs flex items-center justify-center transition cursor-pointer"
                                    title="Inspect photo full size"
                                  >
                                    <SearchIcon size={12} />
                                  </button>
                                </div>

                                {/* Card Action Controls */}
                                <div className="p-2 flex items-center justify-between gap-1 text-[11px]">
                                  {/* Set as Cover / Cover Label */}
                                  {isCover ? (
                                    <span className="text-[10px] font-bold text-[#F97316] flex items-center gap-1">
                                      Main Display
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetCoverPhoto(idx)}
                                      className="text-[10px] font-bold text-[#F97316] hover:underline cursor-pointer"
                                      title="Make this photo the primary cover image"
                                    >
                                      Set as Cover
                                    </button>
                                  )}

                                  {/* Reorder and Delete Buttons */}
                                  <div className="flex items-center gap-1">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveGalleryPhoto(idx, "left")
                                        }
                                        className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold flex items-center justify-center cursor-pointer text-[10px]"
                                        title="Move left"
                                      >
                                        ←
                                      </button>
                                    )}
                                    {idx <
                                      (carFormData.gallery || []).length -
                                        1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveGalleryPhoto(idx, "right")
                                        }
                                        className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold flex items-center justify-center cursor-pointer text-[10px]"
                                        title="Move right"
                                      >
                                        →
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveGalleryPhoto(idx)
                                      }
                                      className="w-5 h-5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center cursor-pointer text-[10px]"
                                      title="Remove photo from gallery"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Operational Status & Capacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Availability Status
                      </label>
                      <select
                        value={carFormData.status || "Available"}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            status: e.target.value as CarStatus,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      >
                        <option value="Available">Available for Rent</option>
                        <option value="Rented">Rented (Active Trip)</option>
                        <option value="Maintenance">In Maintenance</option>
                        <option value="Cleaning">Being Cleaned</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Seating Capacity
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="5"
                        value={carFormData.seats ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "")
                          setCarFormData({
                            ...carFormData,
                            seats: val === "" ? "" as any : val,
                          })
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Luggage Capacity
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="e.g. 3 Bags"
                          value={carFormData.luggage ?? ""}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,

                              luggage: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 pr-8 py-2.5 rounded-xl text-xs transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                        {carFormData.luggage ? (
                          <button
                            type="button"
                            onClick={() =>
                              setCarFormData({
                                ...carFormData,
                                luggage: "",
                              })
                            }
                            className="absolute right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                            title="Clear luggage input"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Step 1 of 4 Navigation */}
                  <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCarModalOpen(false)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !carFormData.brand?.trim() ||
                          !carFormData.model?.trim()
                        ) {
                          alert(
                            "Please fill in Vehicle Brand and Model before proceeding to Pricing.",
                          )
                          return
                        }
                        setCarModalTab("rates")
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer font-heading"
                    >
                      <span>Next: Pricing &amp; Engine</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: RATES & POWERTRAIN */}
              {carModalTab === "rates" && (
                <div className="space-y-4 animate-fade-in">
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                      Pricing &amp; Engine Specifications
                    </h4>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Daily/Hourly Rates &amp; Drivetrain
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price Per Day */}
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Price Per Day (€){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 font-bold text-stone-400 text-sm">
                          €
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="55"
                          value={carFormData.pricePerDay ?? ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "")
                            setCarFormData({
                              ...carFormData,
                              pricePerDay: val === "" ? "" as any : val,
                            })
                          }}
                          className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-black transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-orange-400"
                              : "bg-white border border-stone-300 text-orange-600 focus:bg-white"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 font-mono">
                        Weekly Est: €
                        {((Number(carFormData.pricePerDay) || 55) * 7).toFixed(
                          0,
                        )}{" "}
                        • Monthly Est: €
                        {((Number(carFormData.pricePerDay) || 55) * 30).toFixed(
                          0,
                        )}
                      </p>
                    </div>

                    {/* Price Per Hour */}
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Price Per Hour (€/hr)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 font-bold text-stone-400 text-sm">
                          €
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="8"
                          value={carFormData.pricePerHour ?? ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "")
                            setCarFormData({
                              ...carFormData,
                              pricePerHour: val === "" ? "" as any : val,
                            })
                          }}
                          className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Price Per Month */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          className={`block text-xs font-bold ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Price Per Month (€/mo)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const calculated = Math.round(
                              (Number(carFormData.pricePerDay) || 55) * 22,
                            )

                            setCarFormData({
                              ...carFormData,

                              pricePerMonth: calculated,
                            })
                          }}
                          className="text-[10px] font-bold text-orange-500 hover:text-orange-600 cursor-pointer underline"
                        >
                          Auto-calculate (~27% off)
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 font-bold text-stone-400 text-sm">
                          €
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="1210"
                          value={carFormData.pricePerMonth ?? ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "")
                            setCarFormData({
                              ...carFormData,
                              pricePerMonth: val === "" ? "" as any : val,
                            })
                          }}
                          className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-emerald-400"
                              : "bg-white border border-stone-300 text-emerald-600 focus:bg-white"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 font-mono">
                        Effective: €
                        {(
                          (Number(carFormData.pricePerMonth) ||
                            Math.round(
                              (Number(carFormData.pricePerDay) || 55) * 22,
                            )) / 30
                        ).toFixed(1)}
                        /day
                      </p>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Transmission
                      </label>
                      <select
                        value={carFormData.transmission || "Automatic"}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            transmission: e.target.value as Transmission,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      >
                        <option value="Automatic">
                          Automatic Transmission
                        </option>
                        <option value="Manual">Manual 6-Speed</option>
                      </select>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Fuel &amp; Powertrain
                      </label>
                      <select
                        value={carFormData.fuelType || "Petrol"}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            fuelType: e.target.value as FuelType,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      >
                        <option value="Petrol">1) Petrol</option>
                        <option value="Diesel">2) Diesel</option>
                        <option value="Electric">3) Electric</option>
                        <option value="Hybrid">4) Hybrid</option>
                        <option value="Gasoline" className="hidden">
                          Gasoline
                        </option>
                      </select>
                    </div>

                    {/* Fuel / Tank Capacity in Liters */}
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Tank / Bunk Capacity (Liters)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="e.g. 45 Liters"
                          value={carFormData.mileage ?? ""}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,

                              mileage: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 pr-8 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                        {carFormData.mileage ? (
                          <button
                            type="button"
                            onClick={() =>
                              setCarFormData({
                                ...carFormData,
                                mileage: "",
                              })
                            }
                            className="absolute right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                            title="Clear tank capacity input"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 font-mono">
                        Tank volume in Liters (or battery capacity for EV)
                      </p>
                    </div>
                  </div>

                  {/* Step 2 of 4 Navigation */}
                  <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCarModalTab("identity")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                    >
                      <span>&larr;</span>
                      <span>Back: Vehicle Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !carFormData.pricePerDay ||
                          Number(carFormData.pricePerDay) <= 0
                        ) {
                          alert("Please specify a valid daily rate (€/day).")
                          return
                        }
                        setCarModalTab("insurance")
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer font-heading"
                    >
                      <span>Next: Insurance &amp; Policy</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: INSURANCE & ACQUISITION */}
              {carModalTab === "insurance" && (
                <div className="space-y-4 animate-fade-in">
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                      Commercial Insurance &amp; Policy Details
                    </h4>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Liability &amp; Odometer Record
                    </span>
                  </div>

                  {/* Optional Commercial Insurance Toggle */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                      addInsuranceDetails
                        ? isDark
                          ? "bg-emerald-950/20 border-emerald-500/40"
                          : "bg-emerald-50 border-emerald-300"
                        : isDark
                          ? "bg-stone-900/60 border-stone-800 hover:border-stone-700"
                          : "bg-stone-50 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={addInsuranceDetails}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setAddInsuranceDetails(checked)
                        if (!checked) {
                          setCarFormData((prev) => ({
                            ...prev,
                            insuranceProvider: "",
                            insurancePolicy: "",
                            insuranceExpiry: "",
                          }))
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div
                        className={`text-xs font-bold ${
                          isDark ? "text-stone-200" : "text-stone-900"
                        }`}
                      >
                        Add Commercial Insurance Details (Optional)
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        If unchecked, commercial policy is skipped for this car and recorded as standard self-insured.
                      </div>
                    </div>
                  </label>

                  {addInsuranceDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Insurance Carrier
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. State Farm Commercial, Geico Fleet"
                          value={carFormData.insuranceProvider ?? ""}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,

                              insuranceProvider: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Policy Certificate ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. POL-STF-994021"
                          value={carFormData.insurancePolicy ?? ""}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,

                              insurancePolicy: e.target.value.toUpperCase(),
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-emerald-400"
                              : "bg-white border border-stone-300 text-emerald-700 focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Insurance Expiry Date
                        </label>
                        <input
                          type="date"
                          value={carFormData.insuranceExpiry ?? ""}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,

                              insuranceExpiry: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-1 max-w-sm">
                    <label
                      className={`block text-xs font-bold mb-1 ${
                        isDark ? "text-stone-300" : "text-stone-800"
                      }`}
                    >
                      Current Odometer (km / mi)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="any"
                        placeholder="14200"
                        value={carFormData.currentOdometer ?? ""}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const val = e.target.value
                          setCarFormData({
                            ...carFormData,
                            currentOdometer:
                              val === "" ? ("" as any) : Number(val),
                          })
                        }}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-amber-300"
                            : "bg-white border border-stone-300 text-amber-700 focus:bg-white"
                        }`}
                      />
                      <span className="absolute right-3.5 font-mono text-xs font-bold text-stone-400">
                        mi
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1 font-mono">
                      Initial odometer baseline used for dispatch handoff &amp; return verification.
                    </p>
                  </div>

                  {/* Step 3 of 4 Navigation */}
                  <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCarModalTab("rates")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                    >
                      <span>&larr;</span>
                      <span>Back: Pricing &amp; Engine</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarModalTab("garage")}
                      className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer font-heading"
                    >
                      <span>Next: Garage Location</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GARAGE HUB & GPS MAP ENGINE */}
              {carModalTab === "garage" && (
                <div className="space-y-4 animate-fade-in">
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-500">
                        Assigned Garage Location &amp; Map
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setCarFormData((prev) => ({
                            ...prev,
                            garageName:
                              studioContact.hub_address || "Operating Fleet Hub",
                            garageAddress:
                              studioContact.hub_address || "Operating Fleet Hub",
                            location:
                              studioContact.hub_address || "Operating Fleet Hub",
                            garageLat: studioContact.hub_lat ?? 17.4646,
                            garageLng: studioContact.hub_lng ?? 78.3582,
                          }))
                          notify("Inherited Operating Hub address & GPS location.")
                        }}
                        className="px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 text-[10px] font-bold transition cursor-pointer"
                        title="Click to use Operating Hub address from Settings"
                      >
                        Use Operating Hub Address
                      </button>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      GPS: {carFormData.garageLat?.toFixed(4)},{" "}
                      {carFormData.garageLng?.toFixed(4)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Garage Facility Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          studioContact.hub_address || "Operating Fleet Hub"
                        }
                        value={carFormData.garageName ?? ""}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            garageName: e.target.value,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Facility Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          studioContact.hub_address || "Operating Fleet Hub"
                        }
                        value={carFormData.garageAddress ?? ""}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            garageAddress: e.target.value,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isDark ? "text-stone-300" : "text-stone-800"
                        }`}
                      >
                        Parking Bay Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bay 14-B"
                        value={carFormData.garageBay ?? ""}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,

                            garageBay: e.target.value,
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-sky-400"
                            : "bg-white border border-stone-300 text-sky-700 focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-stone-300" : "text-stone-800"}`}>
                        GPS Latitude <span className="text-stone-400 font-normal font-mono">(North/South, e.g. 17.4646)</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={carFormData.garageLat ?? 17.4646}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,
                            garageLat: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-stone-300" : "text-stone-800"}`}>
                        GPS Longitude <span className="text-stone-400 font-normal font-mono">(East/West, e.g. 78.3582)</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={carFormData.garageLng ?? 78.3582}
                        onChange={(e) =>
                          setCarFormData({
                            ...carFormData,
                            garageLng: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          isDark
                            ? "bg-stone-900 border border-stone-700 text-white"
                            : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Integrated Interactive Map Engine */}
                  <div className="pt-2">
                    <GarageMapViewer
                      garageName={carFormData.garageName}
                      garageAddress={carFormData.garageAddress}
                      garageBay={carFormData.garageBay}
                      lat={carFormData.garageLat}
                      lng={carFormData.garageLng}
                      isEditable={true}
                      height="260px"
                      onLocationChange={(lat, lng, address) => {
                        setCarFormData((prev) => ({
                          ...prev,

                          garageLat: lat,

                          garageLng: lng,

                          garageAddress: address || prev.garageAddress,

                          location: address || prev.location,
                        }))
                      }}
                    />
                  </div>

                  {/* Step 4 of 4 Navigation (Final Review & Save) */}
                  <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCarModalTab("insurance")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                    >
                      <span>&larr;</span>
                      <span>Back: Insurance &amp; Odometer</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCar}
                      className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-md flex items-center gap-2 font-heading ${
                        isSavingCar
                          ? "bg-orange-400 cursor-not-allowed opacity-80"
                          : "bg-[#F97316] hover:bg-orange-600 cursor-pointer"
                      }`}
                    >
                      {isSavingCar ? (
                        <>
                          <RefreshCwIcon size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon size={14} />
                          <span>
                            {editingCar
                              ? "Save Changes"
                              : "Review & Add to Fleet"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Customer Storefront Card Preview */}
            <div className="lg:col-span-5 sticky top-2 space-y-4">
              <div
                className={`p-5 rounded-xl border shadow-lg space-y-4 transition ${
                  isDark
                    ? "bg-stone-900/90 border-stone-800"
                    : "bg-stone-50 border-stone-200"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b pb-3 ${
                    isDark ? "border-stone-800" : "border-stone-200"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F97316] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Customer Preview
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    How customers see this car
                  </span>
                </div>

                {/* Customer Storefront Vehicle Card */}
                <div
                  className={`rounded-2xl border overflow-hidden shadow-sm transition ${
                    isDark
                      ? "bg-stone-950 border-stone-800"
                      : "bg-white border-stone-200"
                  }`}
                >
                  {/* Image Preview with Multi-Photo Gallery Selector */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden">
                    <img
                      src={
                        (carFormData.gallery &&
                          carFormData.gallery[previewPhotoIndex]) ||
                        carFormData.image ||
                        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={carFormData.name || "Vehicle Preview"}
                      className="w-full h-full object-cover transition-all duration-300"
                      onError={(e) => {
                        ;(e.target as any).src =
                          "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-[#17191C]/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {carFormData.type || "Sedan"}
                    </span>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <SparklesIcon size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-stone-900">
                        5.0 (New)
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-400 text-stone-950 shadow-xs">
                        {carFormData.plateNumber || "FL-882-MTR"}
                      </span>
                    </div>
                    {(carFormData.gallery || []).length > 1 && (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold shadow-xs">
                        {previewPhotoIndex + 1} /{" "}
                        {(carFormData.gallery || []).length} Photos
                      </div>
                    )}
                  </div>

                  {/* Interactive Customer Thumbnail Strip */}
                  {(carFormData.gallery || []).length > 1 && (
                    <div className="p-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex gap-1.5 overflow-x-auto no-scrollbar">
                      {(carFormData.gallery || []).map((thumb, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => setPreviewPhotoIndex(tIdx)}
                          className={`relative w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                            previewPhotoIndex === tIdx
                              ? "border-[#F97316] ring-1 ring-orange-400"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {tIdx === 0 && (
                            <span className="absolute top-0 left-0 bg-[#F97316] text-[7px] text-white font-bold px-0.5">
                              ★
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h4
                          className={`font-heading font-extrabold text-base tracking-tight ${
                            isDark ? "text-white" : "text-stone-900"
                          }`}
                        >
                          {carFormData.brand || "Brand"}{" "}
                          {carFormData.model || "Model"}{" "}
                          <span className="text-stone-400 text-xs font-normal">
                            ({carFormData.year || 2024})
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
                          {carFormData.seats || 5} Seats •{" "}
                          {carFormData.transmission || "Automatic"} •{" "}
                          {carFormData.fuelType || "Petrol"} •{" "}
                          {formatFuelDisplay(
                            carFormData.mileage,
                            carFormData.fuelType,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Trust & Guarantee Chips */}
                    <div
                      className={`space-y-1.5 pt-1 border-t text-[11px] ${
                        isDark ? "border-stone-800" : "border-stone-100"
                      }`}
                    >
                      {addInsuranceDetails && carFormData.insurancePolicy ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <ShieldIcon size={13} className="shrink-0" />
                          <span className="font-semibold truncate">
                            {carFormData.insuranceProvider ||
                              "Commercial Insurance"}{" "}
                            ({carFormData.insurancePolicy})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-stone-400">
                          <ShieldIcon size={13} className="shrink-0" />
                          <span className="font-medium">
                            Standard Self-Insured Fleet
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sky-600">
                        <LocationIcon size={13} className="shrink-0" />
                        <span className="font-medium truncate">
                          {carFormData.garageName ||
                            studioContact.hub_address ||
                            "Operating Fleet Hub"}{" "}
                          • {carFormData.garageBay || "Bay 1"}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Footer */}
                    <div
                      className={`pt-2 border-t flex items-center justify-between ${
                        isDark ? "border-stone-800" : "border-stone-100"
                      }`}
                    >
                      <div>
                        <span className="text-xl font-black text-[#F97316] font-heading">
                          €{carFormData.pricePerDay || 55}
                        </span>
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {" "}
                          / day
                        </span>
                        <span className="text-[10px] text-stone-400 block font-medium">
                          €{carFormData.pricePerHour || 8}/hr • €
                          {carFormData.pricePerMonth ||
                            Math.round((carFormData.pricePerDay || 55) * 22)}
                          /mo
                        </span>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-[#F97316] border border-orange-500/20 text-xs font-bold font-heading">
                        Instant Book Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCarModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                  }`}
                >
                  Cancel
                </button>
                {carModalTab !== "garage" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (carModalTab === "identity") {
                        if (
                          !carFormData.brand?.trim() ||
                          !carFormData.model?.trim()
                        ) {
                          alert(
                            "Please fill in Vehicle Brand and Model before proceeding.",
                          )
                          return
                        }
                        setCarModalTab("rates")
                      } else if (carModalTab === "rates") {
                        if (
                          !carFormData.pricePerDay ||
                          Number(carFormData.pricePerDay) <= 0
                        ) {
                          alert("Please enter a valid daily rate.")
                          return
                        }
                        setCarModalTab("insurance")
                      } else if (carModalTab === "insurance") {
                        setCarModalTab("garage")
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-heading"
                  >
                    <span>
                      {carModalTab === "identity" &&
                        "Continue to Pricing (2/4) →"}
                      {carModalTab === "rates" &&
                        "Continue to Insurance (3/4) →"}
                      {carModalTab === "insurance" &&
                        "Continue to Garage (4/4) →"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSavingCar}
                    className={`flex-1 py-3 rounded-xl text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 font-heading ${
                      isSavingCar
                        ? "bg-orange-400 cursor-not-allowed opacity-80"
                        : "bg-[#F97316] hover:bg-orange-600 cursor-pointer"
                    }`}
                  >
                    {isSavingCar ? (
                      <>
                        <RefreshCwIcon size={14} className="animate-spin" />
                        <span>Saving Vehicle to Fleet...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon size={14} />
                        <span>
                          {editingCar ? "Save Changes" : "Review & Add to Fleet"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE PROMO CODE
          ======================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <h3
              className={`text-lg font-black mb-4 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              Create New Promotional Coupon
            </h3>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Promo Code String
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH30"
                  value={newPromoData.code}
                  onChange={(e) =>
                    setNewPromoData({
                      ...newPromoData,

                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-emerald-500 transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="15"
                  required
                  value={newPromoData.discountPercent ?? ""}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewPromoData({
                      ...newPromoData,
                      discountPercent: val === "" ? "" as any : Number(val),
                    })
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Description / Campaign
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30% Flash Weekend Discount"
                  value={newPromoData.description}
                  onChange={(e) =>
                    setNewPromoData({
                      ...newPromoData,

                      description: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={newPromoData.expiryDate}
                  onChange={(e) =>
                    setNewPromoData({
                      ...newPromoData,

                      expiryDate: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE MAINTENANCE LOG
          ======================================================== */}
      {isMntModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <h3
              className={`text-lg font-black mb-4 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              Log Fleet Maintenance Work Order
            </h3>
            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Target Vehicle
                </label>
                <select
                  value={newMntData.carId}
                  onChange={(e) =>
                    setNewMntData({ ...newMntData, carId: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Service Type
                </label>
                <input
                  type="text"
                  required
                  value={newMntData.serviceType}
                  onChange={(e) =>
                    setNewMntData({
                      ...newMntData,

                      serviceType: e.target.value,
                    })
                  }
                  placeholder="e.g. Synthetic Oil Change, Brake Inspection, Tire Rotation"
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Cost (€)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="150"
                    value={newMntData.cost ?? ""}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) =>
                      setNewMntData({
                        ...newMntData,
                        cost:
                          e.target.value === ""
                            ? "" as any
                            : Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition ${
                      isDark
                        ? "bg-stone-900 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Odometer Mileage
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="15000"
                    value={newMntData.odometer ?? ""}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) =>
                      setNewMntData({
                        ...newMntData,
                        odometer:
                          e.target.value === ""
                            ? "" as any
                            : Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition ${
                      isDark
                        ? "bg-stone-900 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Technician Notes
                </label>
                <textarea
                  rows={2}
                  value={newMntData.technicianNotes}
                  onChange={(e) =>
                    setNewMntData({
                      ...newMntData,

                      technicianNotes: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-900 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMntModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Log Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DRIVER LICENSE PREVIEW
          ======================================================== */}
      {inspectedLicense && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-xl max-w-md w-full p-6 shadow-2xl transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-stone-800" : "border-stone-200"
              }`}
            >
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldIcon size={16} className="text-emerald-500" />
                Verified Driver Identification
              </h3>
              <button
                onClick={() => setInspectedLicense(null)}
                className={`font-bold transition ${
                  isDark
                    ? "text-stone-400 hover:text-white"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                ✕
              </button>
            </div>

            {/* License Card Mock */}
            <div
              className={`my-5 p-5 rounded-2xl border relative overflow-hidden transition ${
                isDark
                  ? "bg-gradient-to-br from-stone-900 to-stone-950 border-stone-700"
                  : "bg-stone-50 border-stone-200/90"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b pb-2 mb-3 ${
                  isDark ? "border-stone-800" : "border-stone-200"
                }`}
              >
                <span className="text-[10px] font-bold tracking-widest text-[#F97316]">
                  OFFICIAL DRIVER LICENSE RECORD
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                  STATE CERTIFIED
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <div
                  className={`w-16 h-20 rounded-lg border flex items-center justify-center text-xs font-mono font-bold ${
                    isDark
                      ? "bg-stone-800 border-stone-700 text-stone-400"
                      : "bg-stone-200 border-stone-300 text-stone-500"
                  }`}
                >
                  PHOTO
                </div>
                <div className="space-y-1 text-xs">
                  {inspectedLicense.id && (
                    <span className="font-mono text-[10px] font-bold text-orange-500 block">
                      USER PROFILE ID: {inspectedLicense.id}
                    </span>
                  )}
                  <p
                    className={`font-bold text-sm ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedLicense.name}
                  </p>
                  <p
                    className={`font-mono ${
                      isDark ? "text-stone-300" : "text-stone-700 font-semibold"
                    }`}
                  >
                    DL: {inspectedLicense.licenseNum}
                  </p>
                  <p className={isDark ? "text-stone-400" : "text-stone-600"}>
                    Jurisdiction: {inspectedLicense.state}
                  </p>
                  <p
                    className={`font-mono text-[11px] ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    Expires: {inspectedLicense.expiry}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInspectedLicense(null)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                isDark
                  ? "bg-stone-800 hover:bg-stone-700 text-white"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-800"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL: KEY HANDOVER CHECKLIST (Flow E: Timer Starts)
          ======================================================== */}
      {isKeyModalOpen && keyModalBooking && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-stone-800" : "border-stone-200"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                  FLOW E: KEY HANDOVER PROTOCOL
                </span>
                <h3 className="text-lg font-black mt-0.5 flex items-center gap-2">
                  <ZapIcon size={18} className="text-emerald-500" />
                  Key Handoff & Clock Initiation
                </h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className={`font-bold transition ${
                  isDark
                    ? "text-stone-400 hover:text-white"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Vehicle & Customer Capsule */}
            <div
              className={`my-4 p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark
                  ? "bg-stone-900 border-stone-800"
                  : "bg-stone-50 border-stone-200"
              }`}
            >
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>
                  Reservation ID:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {keyModalBooking.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>
                  Customer:
                </span>
                <span
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {keyModalBooking.customer.firstName}{" "}
                  {keyModalBooking.customer.lastName}
                </span>
              </div>
              {(() => {
                const c = cars.find(
                  (x) => x.id === keyModalBooking.matchedCarId,
                )

                return c ? (
                  <div
                    className={`pt-2.5 mt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {c.image && (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-12 h-9 object-cover rounded-lg border border-stone-300 dark:border-stone-700 shrink-0"
                        />
                      )}
                      <div>
                        <span className="font-bold text-amber-500 block">
                          {c.name} ({c.plateNumber})
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {c.garageBay || "Bay 16-C"}
                        </span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">
                        Registered Baseline Odometer
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {(c.currentOdometer || 15200).toLocaleString()}{" "}
                        {keyChecklist.odometerUnit || "mi"}
                      </span>
                    </div>
                  </div>
                ) : null
              })()}
            </div>

            <form onSubmit={handleSubmitKeyHandoff} className="space-y-4">
              {(() => {
                const c = cars.find(
                  (x) => x.id === keyModalBooking.matchedCarId,
                )
                const baselineOdo = c?.currentOdometer || 15200
                return (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            className={`block font-semibold ${
                              isDark ? "text-stone-400" : "text-stone-600"
                            }`}
                          >
                            Departure Odometer
                          </label>
                          <div className="flex items-center gap-1.5">
                            {c && (
                              <button
                                type="button"
                                onClick={() =>
                                  setKeyChecklist((prev) => ({
                                    ...prev,
                                    odometerOut: baselineOdo,
                                  }))
                                }
                                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Reset to vehicle baseline mileage"
                              >
                                <RefreshCwIcon size={10} /> Sync ({baselineOdo.toLocaleString()})
                              </button>
                            )}
                            <div className="inline-flex rounded-lg border border-stone-300 dark:border-stone-700 p-0.5 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() =>
                                  setKeyChecklist((prev) => ({
                                    ...prev,
                                    odometerUnit: "mi",
                                  }))
                                }
                                className={`px-1.5 py-0.5 rounded transition ${
                                  keyChecklist.odometerUnit !== "km"
                                    ? "bg-amber-500 text-white"
                                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                                }`}
                              >
                                mi
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setKeyChecklist((prev) => ({
                                    ...prev,
                                    odometerUnit: "km",
                                  }))
                                }
                                className={`px-1.5 py-0.5 rounded transition ${
                                  keyChecklist.odometerUnit === "km"
                                    ? "bg-amber-500 text-white"
                                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                                }`}
                              >
                                km
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            value={keyChecklist.odometerOut}
                            onChange={(e) =>
                              setKeyChecklist({
                                ...keyChecklist,
                                odometerOut: Number(e.target.value),
                              })
                            }
                            className={`w-full pr-12 px-3 py-2 rounded-xl text-xs font-mono font-bold transition ${
                              isDark
                                ? "bg-stone-950 border border-stone-700 text-white"
                                : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-400 font-mono pointer-events-none">
                            {keyChecklist.odometerUnit || "mi"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-semibold mb-1 ${
                            isDark ? "text-stone-400" : "text-stone-600"
                          }`}
                        >
                          Departure Fuel Level
                        </label>
                        <select
                          value={keyChecklist.fuelLevelOut}
                          onChange={(e) =>
                            setKeyChecklist({
                              ...keyChecklist,
                              fuelLevelOut: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                            isDark
                              ? "bg-stone-950 border border-stone-700 text-white"
                              : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                          }`}
                        >
                          <option value="Full (100%)">Full (100%)</option>
                          <option value="90%">90%</option>
                          <option value="80%">80%</option>
                          <option value="75%">75%</option>
                          <option value="50%">50%</option>
                        </select>
                      </div>
                    </div>

                    {/* Odometer Proof Photo & Cluster Verification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            className={`block font-semibold ${
                              isDark ? "text-stone-400" : "text-stone-600"
                            }`}
                          >
                            Odometer &amp; Cluster Proof Photo
                          </label>
                          <span className="text-[10px] text-stone-500">Optional</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id="modal-odo-photo"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const compressed = await compressVehiclePhoto(file)
                              setKeyChecklist((prev) => ({
                                ...prev,
                                odometerPhoto: compressed,
                              }))
                            }
                          }}
                        />
                        {keyChecklist.odometerPhoto ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                            <div
                              onClick={() =>
                                setZoomedPhoto({
                                  url: keyChecklist.odometerPhoto!,
                                  title: `Odometer Proof Photo - ${keyModalBooking.id}`,
                                })
                              }
                              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            >
                              <img
                                src={keyChecklist.odometerPhoto}
                                alt="Odometer Proof"
                                className="w-10 h-8 object-cover rounded-lg border border-emerald-500/40 shrink-0"
                              />
                              <div className="min-w-0 text-[11px]">
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                  Proof Attached ✓
                                </p>
                                <p className="text-[10px] text-stone-500 truncate">
                                  Click to preview
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setKeyChecklist((prev) => ({
                                  ...prev,
                                  odometerPhoto: undefined,
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold transition cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="modal-odo-photo"
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed cursor-pointer transition text-xs font-medium ${
                              isDark
                                ? "bg-stone-950/60 border-stone-700 hover:border-amber-500 text-stone-300"
                                : "bg-stone-50 border-stone-300 hover:border-amber-500 text-stone-700"
                            }`}
                          >
                            <CameraIcon size={14} className="text-amber-500" />
                            <span>Capture / Upload Cluster Photo</span>
                          </label>
                        )}
                      </div>
                      <div>
                        <label
                          className={`block font-semibold mb-1 ${
                            isDark ? "text-stone-400" : "text-stone-600"
                          }`}
                        >
                          Odometer &amp; Cluster Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Cluster clean, 0 warning lights"
                          value={keyChecklist.odometerNotes || ""}
                          onChange={(e) =>
                            setKeyChecklist({
                              ...keyChecklist,
                              odometerNotes: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                            isDark
                              ? "bg-stone-950 border border-stone-700 text-white"
                              : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div
                className={`space-y-2 pt-2 border-t text-xs ${
                  isDark ? "border-stone-800" : "border-stone-200"
                }`}
              >
                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    isDark
                      ? "bg-stone-900 border-stone-800 hover:bg-stone-850"
                      : "bg-stone-50 border-stone-200 hover:bg-stone-100/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={keyChecklist.cleanlinessVerified}
                    onChange={(e) =>
                      setKeyChecklist({
                        ...keyChecklist,

                        cleanlinessVerified: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span
                      className={`font-semibold block ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      Vehicle Sanitized & Cleaned
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      Pristine condition certified for customer.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    isDark
                      ? "bg-stone-900 border-stone-800 hover:bg-stone-850"
                      : "bg-stone-50 border-stone-200 hover:bg-stone-100/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={keyChecklist.tiresExteriorVerified}
                    onChange={(e) =>
                      setKeyChecklist({
                        ...keyChecklist,

                        tiresExteriorVerified: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span
                      className={`font-semibold block ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      Tires & Exterior Walkaround Complete
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      No unauthorized baseline scratches or damage.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Dispatch Staff Member
                </label>
                <input
                  type="text"
                  required
                  value={keyChecklist.inspectorStaff}
                  onChange={(e) =>
                    setKeyChecklist({
                      ...keyChecklist,

                      inspectorStaff: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-950 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              {/* Notice */}
              <div
                className={`p-3 rounded-xl border text-[11px] ${
                  isDark
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <strong>Clock Start Notice:</strong> Submitting will record this
                exact timestamp, start the customer's live rental timer, and
                transition this vehicle to <strong>Rented</strong>.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckIcon size={14} /> Keys Given & Start Clock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EXTENSION QUOTATION CONSOLE (Flow F)
          ======================================================== */}
      {isExtensionModalOpen && extensionBooking && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-stone-800" : "border-stone-200"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  FLOW F: EXTENSION PRICING CONSOLE
                </span>
                <h3 className="text-lg font-black mt-0.5 flex items-center gap-2">
                  {extensionBooking.extensionStatus === "Quoted" ? (
                    <>
                      <SparklesIcon size={18} className="text-sky-500" />
                      <span>Modify / Re-quote Extension Quotation</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon size={18} className="text-amber-500" />
                      <span>Dispatch Extension Quotation</span>
                    </>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className={`font-bold transition ${
                  isDark
                    ? "text-stone-400 hover:text-white"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Request Details */}
            <div
              className={`my-4 p-3.5 rounded-xl border text-xs space-y-1.5 ${
                isDark
                  ? "bg-amber-950/30 border-amber-500/30"
                  : "bg-amber-50/80 border-amber-200"
              }`}
            >
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-600"}>
                  Requested Extension:
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  +{extensionBooking.extensionRequest?.durationValue}{" "}
                  {extensionBooking.extensionRequest?.durationUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-600"}>
                  Customer Reason:
                </span>
                <span
                  className={`italic truncate max-w-xs ${
                    isDark ? "text-stone-300" : "text-stone-700"
                  }`}
                >
                  "
                  {extensionBooking.extensionRequest?.reason || "Extended trip"}
                  "
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitExtensionQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Rate Basis
                  </label>
                  <select
                    value={extensionQuoteData.rateType}
                    onChange={(e) => {
                      const newType = e.target.value as "hour" | "day" | "month"

                      const matchedCar = cars.find(
                        (c) => c.id === extensionBooking.matchedCarId,
                      )

                      let newRate = matchedCar?.pricePerDay || 65

                      if (newType === "hour")
                        newRate = matchedCar?.pricePerHour || 10

                      if (newType === "month")
                        newRate =
                          matchedCar?.pricePerMonth ||
                          Math.round((matchedCar?.pricePerDay || 65) * 22)

                      const duration =
                        extensionBooking.extensionRequest?.durationValue || 1

                      setExtensionQuoteData({
                        ...extensionQuoteData,

                        rateType: newType,

                        rateAmount: newRate,

                        totalQuotedAmount: newRate * duration,
                      })
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                      isDark
                        ? "bg-stone-950 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  >
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Rate Amount (€)
                  </label>
                  <input
                    type="number"
                    required
                    value={extensionQuoteData.rateAmount}
                    onChange={(e) => {
                      const amt = Number(e.target.value)

                      const duration =
                        extensionBooking.extensionRequest?.durationValue || 1

                      setExtensionQuoteData({
                        ...extensionQuoteData,

                        rateAmount: amt,

                        totalQuotedAmount: amt * duration,
                      })
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition ${
                      isDark
                        ? "bg-stone-950 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Total Extension Quoted (€)
                </label>
                <input
                  type="number"
                  required
                  value={extensionQuoteData.totalQuotedAmount}
                  onChange={(e) =>
                    setExtensionQuoteData({
                      ...extensionQuoteData,

                      totalQuotedAmount: Number(e.target.value),
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-bold transition ${
                    isDark
                      ? "bg-stone-950 border border-stone-700 text-emerald-400"
                      : "bg-stone-50 border border-stone-200 text-emerald-600 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Quotation Conditions / Message to Customer
                </label>
                <textarea
                  rows={2}
                  value={extensionQuoteData.notes}
                  onChange={(e) =>
                    setExtensionQuoteData({
                      ...extensionQuoteData,

                      notes: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-950 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDeclineExtensionRequest(extensionBooking.id)
                  }
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isDark
                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                  }`}
                >
                  Decline
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    extensionBooking.extensionStatus === "Quoted"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-[#F97316] hover:bg-orange-600"
                  }`}
                >
                  {extensionBooking.extensionStatus === "Quoted" ? (
                    <>
                      <SparklesIcon size={14} /> Update &amp; Re-send Quotation to Customer
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon size={14} /> Send Quotation to Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RETURN VEHICLE INSPECTION & AUDIT (Flow G)
          ======================================================== */}
      {isReturnModalOpen && returnModalBooking && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`border rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? "border-stone-800" : "border-stone-200"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-500 uppercase tracking-wider">
                  FLOW G: POST-TRIP AUDIT
                </span>
                <h3 className="text-lg font-black mt-0.5 flex items-center gap-2">
                  <WrenchIcon size={18} className="text-purple-500" />
                  Vehicle Return Inspection & Closeout
                </h3>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className={`font-bold transition ${
                  isDark
                    ? "text-stone-400 hover:text-white"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                ✕
              </button>
            </div>

            <div
              className={`my-4 p-3 rounded-xl border text-xs space-y-1 ${
                isDark
                  ? "bg-stone-900 border-stone-800"
                  : "bg-stone-50 border-stone-200"
              }`}
            >
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>
                  Reservation:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {returnModalBooking.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>
                  Customer:
                </span>
                <span
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {returnModalBooking.customer.firstName}{" "}
                  {returnModalBooking.customer.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>
                  Departure Odometer:
                </span>
                <span
                  className={`font-mono ${
                    isDark ? "text-stone-300" : "text-stone-700 font-semibold"
                  }`}
                >
                  {returnModalBooking.checklistOut?.odometerOut || 15200} mi
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReturnInspection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Return Odometer (mi)
                  </label>
                  <input
                    type="number"
                    required
                    value={returnChecklist.odometerIn}
                    onChange={(e) =>
                      setReturnChecklist({
                        ...returnChecklist,

                        odometerIn: Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition ${
                      isDark
                        ? "bg-stone-950 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Return Fuel Level
                  </label>
                  <select
                    value={returnChecklist.fuelLevelIn}
                    onChange={(e) =>
                      setReturnChecklist({
                        ...returnChecklist,

                        fuelLevelIn: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                      isDark
                        ? "bg-stone-950 border border-stone-700 text-white"
                        : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                    }`}
                  >
                    <option value="Full (100%)">Full (100%)</option>
                    <option value="90%">90%</option>
                    <option value="80%">80%</option>
                    <option value="75%">75%</option>
                    <option value="50%">50%</option>
                  </select>
                </div>
              </div>

              <div
                className={`space-y-2 pt-2 border-t text-xs ${
                  isDark ? "border-stone-800" : "border-stone-200"
                }`}
              >
                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    isDark
                      ? "bg-stone-900 border-stone-800 hover:bg-stone-850"
                      : "bg-stone-50 border-stone-200 hover:bg-stone-100/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={returnChecklist.cleanlinessPassed}
                    onChange={(e) =>
                      setReturnChecklist({
                        ...returnChecklist,

                        cleanlinessPassed: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span
                      className={`font-semibold block ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      Interior Cleanliness Verified
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      No excessive trash, odors, or spills.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    isDark
                      ? "bg-stone-900 border-stone-800 hover:bg-stone-850"
                      : "bg-stone-50 border-stone-200 hover:bg-stone-100/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={returnChecklist.damageFound}
                    onChange={(e) =>
                      setReturnChecklist({
                        ...returnChecklist,

                        damageFound: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-rose-500 focus:ring-0"
                  />
                  <div>
                    <span
                      className={`font-semibold block ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}
                    >
                      Damage Identified on Return
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      Check if scratches, dents, or wheel rash found.
                    </span>
                  </div>
                </label>

                {returnChecklist.damageFound && (
                  <div
                    className={`p-3.5 sm:p-4 border rounded-2xl space-y-3 ${
                      isDark
                        ? "bg-rose-950/25 border-rose-500/30 text-white"
                        : "bg-rose-50/80 border-rose-200 text-stone-900"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 dark:border-rose-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
                          Damage Incident &amp; Photo Audit
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-bold">
                        Photo Evidence Required
                      </span>
                    </div>

                    {/* Damage Severity & Location Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Damage Severity Class
                        </label>
                        <select
                          value={
                            returnChecklist.damageSeverity ||
                            "Minor Scratch / Scuff"
                          }
                          onChange={(e) =>
                            setReturnChecklist({
                              ...returnChecklist,
                              damageSeverity: e.target.value,
                            })
                          }
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs transition ${
                            isDark
                              ? "bg-stone-950 border border-stone-700 text-white"
                              : "bg-white border border-stone-200 text-stone-900"
                          }`}
                        >
                          <option value="Minor Scratch / Scuff">
                            Minor Scratch / Surface Scuff
                          </option>
                          <option value="Body Dent / Panel Crease">
                            Body Dent / Panel Crease
                          </option>
                          <option value="Wheel / Rim Curb Rash">
                            Wheel / Rim Curb Rash
                          </option>
                          <option value="Glass / Windshield Crack">
                            Glass / Windshield Crack
                          </option>
                          <option value="Bumper / Trim Displacement">
                            Bumper / Trim Displacement
                          </option>
                          <option value="Mechanical / Underbody Impact">
                            Mechanical / Underbody Impact
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Affected Vehicle Area
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Front Right Bumper &amp; Wheel"
                          value={returnChecklist.damageLocation || ""}
                          onChange={(e) =>
                            setReturnChecklist({
                              ...returnChecklist,
                              damageLocation: e.target.value,
                            })
                          }
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs transition ${
                            isDark
                              ? "bg-stone-950 border border-stone-700 text-white"
                              : "bg-white border border-stone-200 text-stone-900"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Damage Assessment Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Damage Assessment &amp; Inspection Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Document exact location, depth of scratch/dent, and whether paint is cracked..."
                        value={returnChecklist.damageNotes}
                        onChange={(e) =>
                          setReturnChecklist({
                            ...returnChecklist,
                            damageNotes: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                          isDark
                            ? "bg-stone-950 border border-stone-700 text-white placeholder-stone-500"
                            : "bg-white border border-stone-200 text-stone-900 placeholder-stone-400"
                        }`}
                      />
                    </div>

                    {/* Deductible / Repair Estimate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Estimated Repair Cost / Deductible (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                            €
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={returnChecklist.damageFee || 0}
                            onChange={(e) =>
                              setReturnChecklist({
                                ...returnChecklist,
                                damageFee: Number(e.target.value),
                              })
                            }
                            className={`w-full pl-7 pr-3 py-1.5 rounded-xl text-xs font-mono transition ${
                              isDark
                                ? "bg-stone-950 border border-stone-700 text-white"
                                : "bg-white border border-stone-200 text-stone-900"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col justify-end">
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          * Vehicle will be routed directly to Fleet Maintenance
                          for shop inspection.
                        </p>
                      </div>
                    </div>

                    {/* Inspection Photos Inclusion Section */}
                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <CameraIcon size={14} className="text-rose-500" />
                          <span>
                            Damage Inspection Photos (
                            {returnChecklist.damagePhotos?.length || 0})
                          </span>
                        </label>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                          Click photo to preview full size
                        </span>
                      </div>

                      {/* Photo Gallery Grid */}
                      {returnChecklist.damagePhotos &&
                        returnChecklist.damagePhotos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                            {returnChecklist.damagePhotos.map(
                              (photoUrl, idx) => (
                                <div
                                  key={idx}
                                  className="relative group rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 bg-black aspect-video flex items-center justify-center cursor-pointer shadow-xs"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: photoUrl,
                                      title: `Damage Inspection Photo #${idx + 1} - ${returnModalBooking?.id || "Audit"}`,
                                    })
                                  }
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`Damage ${idx + 1}`}
                                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                  />
                                  <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const nextPhotos = (
                                        returnChecklist.damagePhotos || []
                                      ).filter((_, i) => i !== idx)
                                      setReturnChecklist({
                                        ...returnChecklist,
                                        damagePhotos: nextPhotos,
                                      })
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                                    title="Remove photo"
                                  >
                                    <TrashIcon size={12} />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                      {/* Upload Controls & Fast Preset Triggers */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs">
                          <UploadIcon size={13} />
                          <span>Attach Inspection Photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || [])
                              if (files.length === 0) return
                              const compressed = await Promise.all(
                                files.map((f) => compressVehiclePhoto(f)),
                              )
                              const valid = compressed.filter(Boolean)
                              if (valid.length > 0) {
                                setReturnChecklist({
                                  ...returnChecklist,
                                  damagePhotos: [
                                    ...(returnChecklist.damagePhotos || []),
                                    ...valid,
                                  ],
                                })
                              }
                              e.target.value = ""
                            }}
                          />
                        </label>

                        {/* Quick Sample Photos for Testing/Verification */}
                        <button
                          type="button"
                          onClick={() => {
                            const sample =
                              "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"
                            setReturnChecklist({
                              ...returnChecklist,
                              damagePhotos: [
                                ...(returnChecklist.damagePhotos || []),
                                sample,
                              ],
                            })
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white/60 dark:bg-stone-900 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 transition cursor-pointer"
                        >
                          + Sample Scuff Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sample =
                              "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80"
                            setReturnChecklist({
                              ...returnChecklist,
                              damagePhotos: [
                                ...(returnChecklist.damagePhotos || []),
                                sample,
                              ],
                            })
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white/60 dark:bg-stone-900 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 transition cursor-pointer"
                        >
                          + Sample Dent Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    isDark
                      ? "bg-purple-950/30 border-purple-500/40"
                      : "bg-purple-50 border-purple-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={returnChecklist.inspectionPassed}
                    onChange={(e) =>
                      setReturnChecklist({
                        ...returnChecklist,

                        inspectionPassed: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-purple-500 focus:ring-0"
                  />
                  <div>
                    <span
                      className={`font-bold block ${
                        isDark ? "text-purple-300" : "text-purple-800"
                      }`}
                    >
                      Complete Inspection Certified & Passed
                    </span>
                    <span
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Vehicle is cleared to complete the rental ride and release
                      custody.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Inspector / Lead Auditor
                </label>
                <input
                  type="text"
                  required
                  value={returnChecklist.inspectorStaff}
                  onChange={(e) =>
                    setReturnChecklist({
                      ...returnChecklist,

                      inspectorStaff: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs transition ${
                    isDark
                      ? "bg-stone-950 border border-stone-700 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Complete Ride & Release Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: FULL IMAGE ZOOM INSPECTION FOR DRIVER LICENSE
          ======================================================== */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className={`max-w-3xl w-full rounded-xl p-5 border shadow-2xl relative space-y-4 ${
              isDark
                ? "bg-[#17191C] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm tracking-tight">
                  {zoomedPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center min-h-[360px] max-h-[70vh]">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-stone-500 font-mono text-[11px]">
                Official Verified Customer Verification Record
              </span>
              <div className="flex gap-2">
                <a
                  href={zoomedPhoto.url}
                  download="Driver_License_Capture.png"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  Download Image File
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN PROFILE & SYSTEM DETAILS MODAL                                      */}
      {/* ========================================================================= */}
      {isAdminProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-profile-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAdminProfileOpen(false)
          }}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl p-6 sm:p-8 relative ${
              isDark
                ? "bg-[#181A1E] border-stone-800 text-stone-100"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-linear-to-tr from-[#F97316] to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                  AV
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      id="admin-profile-title"
                      className="font-black text-lg sm:text-xl tracking-tight"
                    >
                      Alex Vance
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-[#F97316] border border-orange-500/20">
                      SUPER ADMIN • TIER 4
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Fleet Operations Director & Lead Systems Administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminProfileOpen(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 flex items-center justify-center text-sm font-bold transition cursor-pointer"
                aria-label="Close Admin Profile"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid Details */}
            <div className="mt-6 space-y-6">
              {/* Studio Dispatch Contact Information (Directly Editable) */}
              <div className="p-5 rounded-2xl border bg-orange-500/5 border-orange-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SettingsIcon size={14} className="text-[#F97316]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-stone-900 dark:text-white">
                      Edit Dispatch Phone &amp; Email
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Database Edit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                      WhatsApp Dispatch Phone Number
                    </label>
                    <input
                      type="tel"
                      value={studioContact.contact_phone}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          contact_phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 234-5678"
                      className={`w-full px-3 py-2 rounded-xl border font-mono transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    />
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Destination for customer WhatsApp booking shares
                    </span>
                    {studioContact.contact_phone && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                        Auto-formatted:{" "}
                        {formatInternationalPhoneDisplay(
                          studioContact.contact_phone,
                        )}{" "}
                        ({normalizeWhatsAppPhone(studioContact.contact_phone)})
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Fleet Dispatch &amp; Notification Email
                    </label>
                    <input
                      type="email"
                      value={studioContact.contact_email}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          contact_email: e.target.value,
                        })
                      }
                      placeholder="concierge@motorly.com"
                      className={`w-full px-3 py-2 rounded-xl border font-mono transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    />
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Inbox receiving automated booking alerts
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Studio Director Name
                    </label>
                    <input
                      type="text"
                      value={studioContact.admin_name}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          admin_name: e.target.value,
                        })
                      }
                      placeholder="Studio Director"
                      className={`w-full px-3 py-2 rounded-xl border font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Stationed Terminal Hub
                      </label>
                      <button
                        type="button"
                        onClick={handleLocateAdminHub}
                        disabled={isLocatingHub}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Auto-detect current GPS location"
                      >
                        <CrosshairIcon
                          size={12}
                          className={isLocatingHub ? "animate-spin" : ""}
                        />
                        <span>
                          {isLocatingHub ? "Detecting..." : "Locate Me"}
                        </span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={studioContact.hub_address}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          hub_address: e.target.value,
                        })
                      }
                      placeholder="Terminal Garage B • Bay 4 HQ"
                      className={`w-full px-3 py-2 rounded-xl border font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    />

                    {/* Coordinates Mini Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                          Latitude
                        </span>
                        <input
                          type="number"
                          step="0.000001"
                          value={studioContact.hub_lat ?? ""}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            setStudioContact((prev) => ({
                              ...prev,
                              hub_lat: val,
                            }))
                          }}
                          placeholder="25.7959"
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition focus:outline-none focus:ring-1 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border-stone-700 text-white"
                              : "bg-white border-stone-200 text-stone-900"
                          }`}
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                          Longitude
                        </span>
                        <input
                          type="number"
                          step="0.000001"
                          value={studioContact.hub_lng ?? ""}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            setStudioContact((prev) => ({
                              ...prev,
                              hub_lng: val,
                            }))
                          }}
                          placeholder="-80.2870"
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition focus:outline-none focus:ring-1 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border-stone-700 text-white"
                              : "bg-white border-stone-200 text-stone-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                      <span>Google Maps Hub URL</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openGoogleMaps(
                              studioContact.hub_address,
                              studioContact.google_maps_url,
                              studioContact.hub_lat,
                              studioContact.hub_lng,
                            )
                          }
                          className="text-blue-500 hover:underline text-[10px] font-bold"
                        >
                          View Map
                        </button>
                        <a
                          href={
                            studioContact.hub_lat && studioContact.hub_lng
                              ? `https://www.google.com/maps/dir/?api=1&destination=${studioContact.hub_lat},${studioContact.hub_lng}`
                              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  studioContact.hub_address || "",
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:underline text-[10px] font-bold"
                        >
                          Navigate
                        </a>
                      </div>
                    </label>
                    <input
                      type="url"
                      value={studioContact.google_maps_url || ""}
                      onChange={(e) =>
                        setStudioContact({
                          ...studioContact,
                          google_maps_url: e.target.value,
                        })
                      }
                      placeholder="https://maps.app.goo.gl/..."
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                        isDark
                          ? "bg-stone-900 border-stone-700 text-white"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSaveStudioContact()}
                    disabled={isSavingStudioContact}
                    className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckIcon size={14} />
                    <span>
                      {isSavingStudioContact
                        ? "Saving..."
                        : "Save Contact Info to Database"}
                    </span>
                  </button>
                  {contactSaveFeedback && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      {contactSaveFeedback}
                    </span>
                  )}
                </div>
              </div>

              {/* Real-time Fleet Telemetry Snapshot */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider font-mono text-stone-400 mb-3">
                  Live System & Fleet Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark
                        ? "bg-stone-900/60 border-stone-800"
                        : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-[#F97316]">
                      {cars.length}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Fleet Vehicles
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark
                        ? "bg-stone-900/60 border-stone-800"
                        : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-emerald-500">
                      {
                        bookings.filter((b) => b.status === "Checked Out")
                          .length
                      }
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Active Trips
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark
                        ? "bg-stone-900/60 border-stone-800"
                        : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-amber-500">
                      {
                        bookings.filter(
                          (b) => b.status === "Pending Assignment",
                        ).length
                      }
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Pending Requests
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark
                        ? "bg-stone-900/60 border-stone-800"
                        : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p
                      className={`text-xl font-black ${
                        overdueBookings.length > 0
                          ? "text-rose-500"
                          : "text-stone-400"
                      }`}
                    >
                      {overdueBookings.length}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Overdue Trips
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Security Integrity */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider font-mono text-stone-400 mb-3">
                  Infrastructure & Database Security
                </h4>
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                    isDark
                      ? "bg-stone-900/60 border-stone-800"
                      : "bg-stone-50 border-stone-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Database Engine:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      Supabase PostgreSQL (aws-0-us-east-1)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">
                      Security / Password Auth:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Salted Bcrypt PBKDF2 (Zero Plaintext)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Backend API Gateway:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      Express Gateway • Port 3001
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">
                      Public Reviews Setting:
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        reviewsEnabled ? "text-amber-500" : "text-stone-400"
                      }`}
                    >
                      {reviewsEnabled
                        ? "Enabled (Public Feedback ON)"
                        : "Disabled (Reviews Suppressed)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions inside Profile */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleToggleReviews}
                  disabled={isUpdatingReviewsSetting}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                    reviewsEnabled
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                  }`}
                >
                  <span>★</span>
                  <span>
                    {reviewsEnabled
                      ? "Disable Customer Reviews"
                      : "Enable Customer Reviews"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshData}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span className={isSyncing ? "animate-spin" : ""}>↻</span>
                  <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer with Sign Out */}
            <div className="mt-8 pt-5 border-t border-stone-200 dark:border-stone-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsAdminProfileOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition cursor-pointer"
              >
                Close Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdminProfileOpen(false)

                  if (onLogoutAdmin) {
                    onLogoutAdmin()
                  } else {
                    onExitAdmin()
                  }
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOutIcon size={14} className="inline mr-1" />
                <span>Sign Out of Admin Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DECOMMISSION & DELETE VEHICLE CONFIRMATION INFO CARD
          ======================================================== */}
      {deletingCar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-car-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingCar)
              setDeletingCar(null)
          }}
        >
          <div
            className={`w-full max-w-lg rounded-xl border shadow-2xl p-6 sm:p-7 relative overflow-hidden transition ${
              isDark
                ? "bg-[#16181C] border-stone-800 text-stone-100"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/20 flex items-center justify-center font-black text-lg shrink-0">
                  <TrashIcon size={20} />
                </div>
                <div>
                  <h3
                    id="delete-car-title"
                    className="font-black text-base sm:text-lg tracking-tight text-stone-900 dark:text-white"
                  >
                    Decommission Vehicle
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Review the vehicle info card below before confirming
                    deletion
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingCar}
                onClick={() => setDeletingCar(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 flex items-center justify-center text-sm font-bold transition cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Vehicle Info Card */}
            <div className="mt-5 space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? "bg-stone-900/80 border-stone-800"
                    : "bg-stone-50 border-stone-200/90 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-24 h-20 sm:w-28 sm:h-22 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 shrink-0">
                    <img
                      src={deletingCar.image}
                      alt={deletingCar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as any).src =
                          "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"
                      }}
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold">
                      {(deletingCar.gallery || [deletingCar.image]).length}{" "}
                      photo
                      {(deletingCar.gallery || [deletingCar.image]).length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-400 text-stone-950 shadow-2xs">
                        {deletingCar.plateNumber || "NO-PLATE"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {deletingCar.type}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm sm:text-base mt-1 text-stone-900 dark:text-white truncate">
                      {deletingCar.name}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {deletingCar.brand} {deletingCar.model} •{" "}
                      {deletingCar.year}
                    </p>

                    <div className="mt-2 text-xs font-mono font-bold text-[#F97316]">
                      €{deletingCar.pricePerDay}/day • €
                      {deletingCar.pricePerHour || 8}/hr
                    </div>
                  </div>
                </div>

                {/* Additional Spec Matrix */}
                <div className="mt-3.5 pt-3 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">
                      Location Hub
                    </span>
                    <span className="font-medium text-stone-700 dark:text-stone-300 truncate block">
                      <LocationIcon
                        size={12}
                        className="inline mr-1 text-[#F97316]"
                      />
                      {deletingCar.location ||
                        deletingCar.garageName ||
                        "MIA Hub"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">
                      Assigned Bay
                    </span>
                    <span className="font-medium text-stone-700 dark:text-stone-300 block">
                      <TagIcon
                        size={12}
                        className="inline mr-1 text-stone-400"
                      />
                      {deletingCar.garageBay || "Bay 14-B"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">
                      Current Status
                    </span>
                    <span
                      className={`font-bold inline-block ${
                        deletingCar.status === "Available"
                          ? "text-emerald-500"
                          : deletingCar.status === "Rented"
                            ? "text-sky-500"
                            : "text-amber-500"
                      }`}
                    >
                      ● {deletingCar.status || "Available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">
                      Fuel / Tank Capacity
                    </span>
                    <span className="font-mono font-bold text-stone-700 dark:text-stone-300 block">
                      {formatFuelDisplay(deletingCar.mileage, deletingCar.fuelType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangleIcon size={14} className="text-rose-500" />
                  <span>Irreversible Deletion</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">
                  Removing <strong>{deletingCar.name}</strong> will permanently
                  drop its record from Supabase PostgreSQL and remove it from
                  all storefront catalog searches. Historical completed trip
                  receipts will remain preserved.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingCar}
                onClick={() => setDeletingCar(null)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Cancel & Keep
              </button>

              <button
                type="button"
                disabled={isDeletingCar}
                onClick={handleConfirmDeleteCar}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingCar ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <TrashIcon size={14} />
                )}
                <span>
                  {isDeletingCar
                    ? "Deleting Vehicle..."
                    : "Permanently Delete Vehicle"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice & Settlement Modal */}
      {selectedInvoiceBooking && (
        <InvoiceModal
          booking={selectedInvoiceBooking}
          car={cars.find((c) => c.id === selectedInvoiceBooking?.matchedCarId)}
          settings={studioContact}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      )}
    </div>
  )
}
