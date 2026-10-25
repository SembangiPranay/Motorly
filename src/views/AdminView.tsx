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
} from "../components/Icons"

interface AdminViewProps {
  cars: Car[]
  setCars: React.Dispatch<React.SetStateAction<Car[]>>
  bookings: BookingRecord[]
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
}

export default function AdminView({
  cars,
  setCars,
  bookings,
  setBookings,
  onExitAdmin,
  onLogoutAdmin,
}: AdminViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] =
    useState<"manifest" | "fleet" | "walkin" | "promos" | "crm" | "maintenance">(
      "manifest",
    )

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

  // --- Promos State ---
  const [promos, setPromos] = useState<PromoCode[]>([])
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
  const [isUpdatingReviewsSetting, setIsUpdatingReviewsSetting] = useState(false)

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
    carId: cars[0]?.id || "toyota-camry",
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
  const [returnModalBooking, setReturnModalBooking] =
    useState<BookingRecord | null>(null)
  const [returnChecklist, setReturnChecklist] = useState<InspectionChecklistIn>(
    {
      odometerIn: 15450,
      fuelLevelIn: "Full (100%)",
      cleanlinessPassed: true,
      damageFound: false,
      damageNotes: "",
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
            resolve((e.target?.result as string) || "")
          }
        }
        img.onerror = () => resolve((e.target?.result as string) || "")
        img.src = (e.target?.result as string) || ""
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
  const handleMoveGalleryPhoto = (index: number, direction: "left" | "right") => {
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
    fuelType: "Gasoline",
    mileage: "32 MPG",
    luggage: "3 Large Bags",
    plateNumber: "FL-882-MTR",
    location: "Miami International Airport (MIA)",
    status: "Available",
    healthScore: 98,
    description:
      "Pristine fleet rental vehicle with full telemetry and insurance certification.",
    features: ["Bluetooth", "Backup Camera", "Apple CarPlay"],
    insurancePolicy: "POL-FL-883201",
    insuranceProvider: "Geico Commercial Fleet",
    insuranceExpiry: "2027-12-31",
    purchaseDate: "2024-01-15",
    purchaseCost: 32500,
    currentOdometer: 14200,
    garageName: "Miami Airport Hub (MIA - Garage Bay 4)",
    garageAddress: "4200 NW 21st St, Miami, FL 33142",
    garageLat: 25.7959,
    garageLng: -80.287,
    garageBay: "Bay 14-B",
  })

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

    const pendingMating = bookings.filter(
      (b) => b.status === "Pending Assignment",
    ).length
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
    if (!keyModalBooking) return
    try {
      const res = await api.handoverKeys(keyModalBooking.id, {
        odometerOut: Number(keyChecklist.odometerOut),
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
    setExtensionQuoteData({
      rateType,
      rateAmount,
      totalQuotedAmount: total,
      notes: `Quotation for ${durationVal} ${unit} extension. Includes comprehensive fleet insurance.`,
    })
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
          `Extension quotation of $${extensionQuoteData.totalQuotedAmount} dispatched to customer.`,
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
      inspectionPassed: true,
      inspectorStaff: "Admin Return Auditor",
      timestamp: new Date().toISOString(),
    })
    setIsReturnModalOpen(true)
  }

  const handleSubmitReturnInspection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnModalBooking) return
    if (!returnChecklist.inspectionPassed) {
      alert(
        "Vehicle must be verified and marked as 'Inspection Passed' to close out the ride.",
      )
      return
    }
    try {
      const res = await api.returnInspection(returnModalBooking.id, {
        odometerIn: Number(returnChecklist.odometerIn),
        fuelIn: returnChecklist.fuelLevelIn || "100%",
        damageFound: returnChecklist.damageFound,
        cleanlinessPass: returnChecklist.cleanlinessPassed,
        inspectionPassed: returnChecklist.inspectionPassed,
        staffSign: returnChecklist.inspectorStaff,
        inspectionNotes: returnChecklist.damageNotes,
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
      fuelType: "Gasoline",
      mileage: "32 MPG",
      luggage: "3 Bags",
      plateNumber: `FL-${Math.floor(100 + Math.random() * 900)}-MTR`,
      location: "Miami International Airport (MIA)",
      status: "Available",
      healthScore: 98,
      description:
        "Pristine fleet rental vehicle with full insurance certification.",
      features: ["Bluetooth", "Backup Camera", "Apple CarPlay"],
      insurancePolicy: `POL-FL-${Math.floor(100000 + Math.random() * 900000)}`,
      insuranceProvider: "Geico Commercial Fleet",
      insuranceExpiry: "2027-12-31",
      purchaseDate: "2024-01-15",
      purchaseCost: 32500,
      currentOdometer: 14200,
      garageName: "Miami Airport Hub (MIA - Garage Bay 4)",
      garageAddress: "4200 NW 21st St, Miami, FL 33142",
      garageLat: 25.7959,
      garageLng: -80.287,
      garageBay: `Bay ${Math.floor(1 + Math.random() * 20)}-${["A", "B", "C"][Math.floor(Math.random() * 3)]}`,
    })
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
    setCarFormData({
      ...car,
      image: car.image || initialGallery[0] || "",
      gallery: initialGallery,
      pricePerMonth:
        car.pricePerMonth || Math.round((car.pricePerDay || 55) * 22),
      insurancePolicy: car.insurancePolicy || "POL-FL-883201",
      insuranceProvider: car.insuranceProvider || "Geico Commercial Fleet",
      insuranceExpiry: car.insuranceExpiry || "2027-12-31",
      purchaseDate: car.purchaseDate || "2024-01-15",
      purchaseCost: car.purchaseCost || 32500,
      currentOdometer: car.currentOdometer || 14200,
      garageName: car.garageName || "Miami Airport Hub (MIA - Garage Bay 4)",
      garageAddress: car.garageAddress || "4200 NW 21st St, Miami, FL 33142",
      garageLat: car.garageLat || 25.7959,
      garageLng: car.garageLng || -80.287,
      garageBay: car.garageBay || "Bay 14-B",
    })
    setIsCarModalOpen(true)
  }

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const rawGallery = (carFormData.gallery || []).filter(Boolean)
      const primaryImage =
        carFormData.image ||
        rawGallery[0] ||
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"
      const finalGallery = rawGallery.length > 0 ? [...rawGallery] : [primaryImage]

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

      const payload: Partial<Car> = {
        ...carFormData,
        image: primaryImage,
        gallery: finalGallery,
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
      setIsCarModalOpen(false)
    } catch (err: any) {
      alert("Failed to save car: " + err.message)
    }
  }

  const handleDeleteCar = async (carId: string, carName: string) => {
    if (
      !window.confirm(
        `Decommission and remove ${carName} from fleet inventory?`,
      )
    )
      return
    try {
      await api.deleteCar(carId)
      setCars((prev) => prev.filter((c) => c.id !== carId))
      notify(`Vehicle ${carName} removed from fleet.`)
    } catch (err: any) {
      alert("Failed to delete car: " + err.message)
    }
  }

  // Automated Overdue / Trip-Elapsed Notification System (Bug 4)
  const overdueBookings = useMemo(() => {
    const now = Date.now()
    return bookings.filter((b) => {
      if (b.status !== "Checked Out") return false
      try {
        const returnTs = Date.parse(b.returnDate)
        if (!isNaN(returnTs) && returnTs < now) {
          return true
        }
      } catch {}
      return false
    })
  }, [bookings])

  // Filtered reservations with priority ordering (Pending requests first)
  const filteredBookings = useMemo(() => {
    const list = bookings.filter((b) => {
      const matchStatus =
        manifestStatusFilter === "all" || b.status === manifestStatusFilter
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
      const isPending =
        !b.approvedByAdmin &&
        b.status !== "Cancelled" &&
        b.status !== "Completed" &&
        b.status !== "Checked Out"
      if (isPending || b.status === "Pending Assignment") return 0
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
      className={`w-full max-w-full overflow-x-hidden min-h-screen pb-24 font-sans transition-colors duration-200 ${
        isDark
          ? "dark bg-[#111215] text-[#F3F4F6]"
          : "bg-[#FAF7F2] text-[#17191C]"
      }`}
    >
      {/* Top Operations Header Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          isDark
            ? "bg-[#17191C]/95 border-stone-800"
            : "bg-white/95 border-stone-200/90 shadow-2xs"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          {/* Mobile Header (< sm screens) */}
          <div className="flex flex-col gap-2.5 py-2.5 sm:hidden">
            <div className="flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-black text-xs tracking-wider shadow-sm">
                  M
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-black text-sm tracking-tight ${
                      isDark ? "text-white" : "text-[#17191C]"
                    }`}
                  >
                    MOTORLY
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                      isDark
                        ? "bg-orange-500/10 text-[#F97316] border-orange-500/20"
                        : "bg-orange-50 text-[#F97316] border-orange-200"
                    }`}
                  >
                    Admin
                  </span>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5">
                {/* Mobile Notification Bell */}
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className={`relative p-1.5 rounded-lg text-xs font-bold border transition ${
                    isNotificationOpen
                      ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                      : overdueBookings.length > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : isDark
                          ? "bg-stone-800 text-stone-200 border-stone-700"
                          : "bg-white text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Notifications & Fleet Alerts"
                  aria-label="Fleet Notifications"
                >
                  <BellIcon size={15} />
                  {overdueBookings.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                      {overdueBookings.length}
                    </span>
                  )}
                </button>

                {/* Mobile Admin Profile Button */}
                <button
                  type="button"
                  onClick={() => setIsAdminProfileOpen(true)}
                  className={`p-1.5 rounded-lg text-xs font-bold border transition flex items-center justify-center ${
                    isAdminProfileOpen
                      ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                      : isDark
                        ? "bg-stone-800 text-stone-200 border-stone-700"
                        : "bg-white text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Admin Profile & System Settings"
                  aria-label="Admin Profile"
                >
                  <div className="w-4 h-4 rounded-full bg-linear-to-tr from-[#F97316] to-amber-500 text-white font-black text-[9px] flex items-center justify-center">
                    A
                  </div>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-lg text-xs font-bold border transition ${
                    isDark
                      ? "bg-stone-800 text-stone-200 border-stone-700"
                      : "bg-white text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Toggle Light / Dark Mode"
                >
                  {isDark ? "🌙" : "☀️"}
                </button>

                <button
                  type="button"
                  onClick={handleRefreshData}
                  disabled={isSyncing}
                  className={`p-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 disabled:opacity-50 ${
                    isDark
                      ? "bg-stone-800 text-stone-300 border-stone-700"
                      : "bg-white text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Sync with Database"
                >
                  <span className={isSyncing ? "animate-spin" : ""}>↻</span>
                </button>

                <button
                  type="button"
                  onClick={onLogoutAdmin || onExitAdmin}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition ${
                    isDark
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                  title="Sign Out of Admin Console"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile Storefront CTA Row */}
            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ← Return to Customer Storefront
            </button>
          </div>

          {/* Desktop Header (>= sm screens) */}
          <div className="hidden sm:flex items-center justify-between h-16">
            {/* Brand & Mode */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
                  M
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-black text-base tracking-tight ${
                        isDark ? "text-white" : "text-[#17191C]"
                      }`}
                    >
                      MOTORLY
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isDark
                          ? "bg-orange-500/10 text-[#F97316] border-orange-500/20"
                          : "bg-orange-50 text-[#F97316] border-orange-200"
                      }`}
                    >
                      FLEET OPS CONSOLE
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-mono ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    HQ Rental / Fleetio Enterprise Standard • Supabase Synced
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Exit */}
            <div className="flex items-center gap-2">
              {/* Notification Center Button & Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className={`relative p-2 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center ${
                    isNotificationOpen
                      ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                      : overdueBookings.length > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        : isDark
                          ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                          : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs"
                  }`}
                  title="Notifications & Fleet Alerts"
                  aria-label="Fleet Notifications"
                >
                  <BellIcon size={17} />
                  {overdueBookings.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                      {overdueBookings.length}
                    </span>
                  )}
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
                            Real-time rental return monitoring
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {overdueBookings.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                            {overdueBookings.length} Overdue
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsNotificationOpen(false)}
                          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold cursor-pointer flex items-center justify-center transition"
                          aria-label="Close notifications"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {overdueBookings.length === 0 ? (
                        <div className="py-7 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 text-sm font-black">
                            ✓
                          </div>
                          <p className="font-bold text-xs">All Clear & On Schedule</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            No overdue rentals. All vehicles operating within scheduled trip time.
                          </p>
                        </div>
                      ) : (
                        overdueBookings.map((b) => (
                          <div
                            key={b.id}
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
                                  🚗{" "}
                                  {cars.find((c) => c.id === b.matchedCarId)
                                    ?.name ||
                                    b.requestedCategory ||
                                    "Rental Vehicle"}
                                </p>
                                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                                  Scheduled Return: {formatFullDateTime(b.returnDate)}
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
                                Inspect & Return →
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {overdueBookings.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("manifest")
                            setManifestStatusFilter("Checked Out")
                            setIsNotificationOpen(false)
                          }}
                          className="text-[#F97316] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          View in Active Manifest →
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-[11px] cursor-pointer"
                        >
                          Dismiss Dropdown
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Global Reviews System Toggle Button */}
              <button
                type="button"
                onClick={handleToggleReviews}
                disabled={isUpdatingReviewsSetting}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  reviewsEnabled
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/25"
                    : isDark
                      ? "bg-stone-800 text-stone-400 border-stone-700"
                      : "bg-stone-100 text-stone-500 border-stone-200"
                }`}
                title="Toggle Customer Reviews & Feedback Globally"
              >
                <span>★</span>
                <span>{reviewsEnabled ? "Reviews: ON" : "Reviews: OFF"}</span>
              </button>

              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                    : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs"
                }`}
                title="Toggle Light / Dark Mode"
              >
                <span>{isDark ? "🌙 Dark" : "☀️ Light"}</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshData}
                disabled={isSyncing}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
                    : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs"
                }`}
                title="Force refresh database records"
              >
                <span className={isSyncing ? "animate-spin" : ""}>↻</span>
                <span>{isSyncing ? "Syncing..." : "Sync DB"}</span>
              </button>

              {/* Admin Profile Trigger Button */}
              <button
                type="button"
                onClick={() => setIsAdminProfileOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                  isAdminProfileOpen
                    ? "bg-orange-500/15 text-[#F97316] border-orange-500/40"
                    : isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                      : "bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs"
                }`}
                title="View Admin Profile & System Details"
              >
                <div className="w-5 h-5 rounded-full bg-linear-to-tr from-[#F97316] to-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  A
                </div>
                <span className="font-semibold">Alex Vance</span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                  title="System Lead Active"
                />
              </button>

              <button
                type="button"
                onClick={onExitAdmin}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition border border-stone-200 dark:border-stone-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Browse customer storefront without logging out"
              >
                ← Storefront
              </button>

              {/* Direct Sign Out Button */}
              <button
                type="button"
                onClick={onLogoutAdmin || onExitAdmin}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500/50"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                }`}
                title="Sign Out of Admin Console"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div
            className={`flex overflow-x-auto touch-pan-x flex-nowrap no-scrollbar gap-1 pt-1.5 pb-2 border-t text-xs font-medium ${
              isDark ? "border-stone-800/80" : "border-stone-200/80"
            }`}
          >
            {[
              {
                id: "manifest",
                label: "Active Bookings",
                icon: <LinkIcon size={14} className="text-[#F97316]" />,
                badge:
                  overdueBookings.length > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      {overdueBookings.length} Overdue
                    </span>
                  ) : stats.pendingMating > 0 ? (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                        isDark
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {stats.pendingMating}
                    </span>
                  ) : null,
              },
              {
                id: "fleet",
                label: "Fleet Vehicles",
                icon: <CarIcon size={14} className="text-sky-500" />,
                badge: (
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    ({cars.length})
                  </span>
                ),
              },
              {
                id: "walkin",
                label: "Walk-In Booking",
                icon: <ZapIcon size={14} className="text-amber-500" />,
                badge: null,
              },
              {
                id: "promos",
                label: "Coupons & Discounts",
                icon: <TagIcon size={14} className="text-emerald-500" />,
                badge: (
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    ({promos.length})
                  </span>
                ),
              },
              {
                id: "crm",
                label: "Customers & Drivers",
                icon: <UserIcon size={14} className="text-purple-500" />,
                badge: (
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    ({customers.length})
                  </span>
                ),
              },
              {
                id: "maintenance",
                label: "Vehicle Maintenance",
                icon: <WrenchIcon size={14} className="text-rose-500" />,
                badge: (
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    ({mntPagination.total || maintenanceLogs.length})
                  </span>
                ),
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-stone-800 text-white font-bold shadow-sm"
                        : "bg-[#17191C] text-white font-bold shadow-xs"
                      : isDark
                        ? "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
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



        {/* Executive KPI Bar */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Total Fleet
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black font-mono my-1 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              {stats.total}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="text-emerald-600 font-bold">
                {stats.available} Available
              </span>
              <span className={isDark ? "text-stone-600" : "text-stone-300"}>
                •
              </span>
              <span className="text-amber-600 font-semibold">
                {stats.rented} Rented
              </span>
            </div>
          </div>

          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Fleet Utilization
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono my-1 text-emerald-500">
              {stats.utilization}%
            </p>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDark ? "bg-stone-800" : "bg-stone-100"
              }`}
            >
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.utilization}%` }}
              />
            </div>
          </div>

          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Active Daily Rev
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black font-mono my-1 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              ${stats.activeRevenue.toLocaleString()}
            </p>
            <p
              className={`text-[11px] ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              From active contracts
            </p>
          </div>

          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Needs Car Assigned
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black font-mono my-1 ${
                stats.pendingMating > 0
                  ? "text-amber-500"
                  : isDark
                    ? "text-stone-300"
                    : "text-stone-900"
              }`}
            >
              {stats.pendingMating}
            </p>
            <p
              className={`text-[11px] ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Awaiting car assignment
            </p>
          </div>

          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Active Trips (On Road)
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono my-1 text-sky-500">
              {stats.inDrive}
            </p>
            <p
              className={`text-[11px] ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Keys handed over
            </p>
          </div>

          <div
            className={`border p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[118px] transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-md"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Maintenance / Wash
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black font-mono my-1 ${
                isDark ? "text-stone-300" : "text-stone-900"
              }`}
            >
              {stats.maintenance + stats.cleaning}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="text-rose-500 font-semibold">
                {stats.maintenance} Service
              </span>
              <span className={isDark ? "text-stone-600" : "text-stone-300"}>
                •
              </span>
              <span className="text-amber-500 font-semibold">
                {stats.cleaning} Cleaning
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================
            TAB 1: RESERVATION MANIFEST & MATING
            ======================================================== */}
        {activeTab === "manifest" && (
          <section
            className={`border rounded-2xl overflow-hidden transition ${
              isDark
                ? "bg-[#17191C] border-stone-800 shadow-xl"
                : "bg-white border-stone-200/90 shadow-xs"
            }`}
          >
            {/* Manifest Toolbar */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDark
                  ? "border-stone-800 bg-[#17191C]"
                  : "border-stone-200/80 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <SearchIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    value={manifestSearch}
                    onChange={(e) => setManifestSearch(e.target.value)}
                    placeholder="Search ID, customer, license..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark
                        ? "bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                        : "bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white"
                    }`}
                  />
                </div>

                {/* Status Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  {[
                    { id: "all", label: "All Reservations" },
                    { id: "Pending Assignment", label: "Needs Car" },
                    { id: "Assigned", label: "Confirmed" },
                    { id: "Checked Out", label: "Active Trips" },
                    { id: "Returned", label: "Returned" },
                    { id: "Completed", label: "Completed" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setManifestStatusFilter(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        manifestStatusFilter === s.id
                          ? "bg-[#F97316] text-white font-bold shadow-xs"
                          : isDark
                            ? "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                            : "bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right tools */}
              <div className="flex items-center gap-2">
                {/* Desktop View Switcher: Cards vs Table */}
                <div className="hidden lg:flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setManifestViewMode("cards")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      manifestViewMode === "cards"
                        ? "bg-white dark:bg-stone-800 text-[#F97316] shadow-xs"
                        : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                    }`}
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
                  >
                    <ListIcon size={13} />
                    <span>Table</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab("walkin")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs"
                  }`}
                >
                  <ZapIcon size={14} />+ Direct Walk-In
                </button>
              </div>
            </div>

            {/* Mobile Cards Container (< lg screens) */}
            <div className="block lg:hidden p-3.5 space-y-3.5">
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
                  const cleanLocation =
                    b.pickupLocation?.replace(/\s*\([A-Z]{3,4}\)/, "") ||
                    "Main Garage Facility"
                  const formattedAmount = Number(
                    b.totalAmount || 0,
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })
                  const isPendingReview =
                    !b.approvedByAdmin &&
                    b.status !== "Cancelled" &&
                    b.status !== "Completed" &&
                    b.status !== "Checked Out"

                  return (
                    <div
                      key={b.id}
                      onClick={() => setInspectedBooking(b)}
                      className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 shadow-2xs hover:shadow-md ${
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
                              <span>⚠️</span>
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
                          {getBookingDurationInfo(b.pickupDate, b.returnDate).hours < 24 && (
                            <span className="text-[9.5px] font-black text-[#F97316] bg-orange-100/90 dark:bg-orange-950/60 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-900/60 shrink-0">
                              ⚡ {getBookingDurationInfo(b.pickupDate, b.returnDate).label}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                          <LocationIcon
                            size={12}
                            className="text-[#F97316]/70 shrink-0"
                          />
                          <span className="truncate">{cleanLocation}</span>
                        </div>
                      </div>

                      {/* Action Toolbar */}
                      <div
                        className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {isPendingReview && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveBooking(b.id)}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckIcon size={13} />
                                <span>Accept Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineBooking(b.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {!isPendingReview && b.status === "Assigned" && (
                            <button
                              type="button"
                              onClick={() => handleOpenKeyHandoff(b)}
                              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🔑</span>
                              <span>Handover Keys</span>
                            </button>
                          )}

                          {!isPendingReview &&
                            b.status === "Pending Assignment" && (
                              <button
                                type="button"
                                onClick={() => handleAutoMate(b)}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ZapIcon size={13} />
                                <span>Auto-Assign</span>
                              </button>
                            )}

                          {b.status === "Checked Out" && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnInspection(b)}
                              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🏁</span>
                              <span>Return Check</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectedBooking(b)}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Details</span>
                          <ArrowRightIcon size={12} />
                        </button>
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
                      const matedCar = cars.find((c) => c.id === b.matchedCarId)
                      const isWalkIn =
                        b.id.startsWith("MTR-") ||
                        b.createdAt
                          ?.toLowerCase()
                          .includes("counter dispatch") ||
                        b.createdAt?.toLowerCase().includes("walk-in")
                      const initials =
                        (b.customer?.firstName?.[0] || "C") +
                        (b.customer?.lastName?.[0] || "")
                      const cleanLocation =
                        b.pickupLocation?.replace(/\s*\([A-Z]{3,4}\)/, "") ||
                        "Main Garage Facility"
                      const formattedAmount = Number(
                        b.totalAmount || 0,
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                      const isPendingReview =
                        !b.approvedByAdmin &&
                        b.status !== "Cancelled" &&
                        b.status !== "Completed" &&
                        b.status !== "Checked Out"

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
                                  <span>⚠️</span>
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
                              {getBookingDurationInfo(b.pickupDate, b.returnDate).hours < 24 && (
                                <span className="text-[9.5px] font-black text-[#F97316] bg-orange-100/90 dark:bg-orange-950/60 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-900/60 shrink-0">
                                  ⚡ {getBookingDurationInfo(b.pickupDate, b.returnDate).label}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                              <LocationIcon
                                size={12}
                                className="text-[#F97316]/70 shrink-0"
                              />
                              <span className="truncate">{cleanLocation}</span>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div
                            className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {isPendingReview && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveBooking(b.id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <CheckIcon size={13} />
                                    <span>Accept Request</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineBooking(b.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {!isPendingReview &&
                                b.status === "Pending Assignment" && (
                                  <button
                                    type="button"
                                    onClick={() => handleAutoMate(b)}
                                    className="px-3 py-1.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ZapIcon size={13} />
                                    <span>Auto-Assign</span>
                                  </button>
                                )}

                              {!isPendingReview && b.status === "Assigned" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenKeyHandoff(b)}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>🔑</span>
                                  <span>Handover Keys</span>
                                </button>
                              )}

                              {b.status === "Checked Out" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReturnInspection(b)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>🏁</span>
                                  <span>Return Check</span>
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setInspectedBooking(b)}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 transition shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Details</span>
                              <ArrowRightIcon size={12} />
                            </button>
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
                      <th className="px-3 py-3.5 w-24 text-center">Category</th>
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
                        const hubCleanName = (b.pickupLocation || "Station Hub")
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
                                    {b.customer.firstName} {b.customer.lastName}
                                  </div>
                                  <div
                                    className="text-[11px] font-mono text-stone-400 truncate max-w-[130px]"
                                    title={b.customer.phone || b.customer.email}
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
                                    isDark ? "text-stone-200" : "text-stone-800"
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
                                  {b.approvedByAdmin ? (
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
                                      🔔 Quote Ext
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
                                ${b.totalAmount.toFixed(2)}
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
                  onClick={handleOpenAddCar}
                  className="px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon size={14} />+ Register Vehicle
                </button>
              </div>
            </div>

            {/* Fleet View Mode */}
            {fleetViewMode === "table" ? (
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
                      <th className="px-5 py-3.5">Vehicle / Specs</th>
                      <th className="px-5 py-3.5">Plate & Hub</th>
                      <th className="px-5 py-3.5">Status Override</th>
                      <th className="px-5 py-3.5">Health & Sanitation</th>
                      <th className="px-5 py-3.5">Fuel / Battery</th>
                      <th className="px-5 py-3.5 text-right">Daily Rate</th>
                      <th className="px-5 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-sans ${
                      isDark ? "divide-stone-800/60" : "divide-stone-100"
                    }`}
                  >
                    {filteredFleet.map((c) => (
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
                                <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl bg-black/80 text-white text-[8px] font-bold font-mono">
                                  {c.gallery.length}
                                </span>
                              )}
                            </div>
                            <div>
                              <div
                                className={`font-bold text-xs ${
                                  isDark ? "text-white" : "text-stone-900"
                                }`}
                              >
                                {c.name}
                              </div>
                              <div
                                className={`text-[11px] ${
                                  isDark ? "text-stone-400" : "text-stone-500"
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
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border inline-block ${
                              isDark
                                ? "bg-stone-900 border-stone-700 text-stone-200"
                                : "bg-stone-100 border-stone-200 text-stone-800"
                            }`}
                          >
                            {c.plateNumber || "N/A"}
                          </span>
                          <div
                            className={`text-[11px] mt-1 truncate max-w-[150px] ${
                              isDark ? "text-stone-500" : "text-stone-400"
                            }`}
                          >
                            {c.location || "Miami MIA"}
                          </div>
                        </td>

                        {/* Status Override */}
                        <td className="px-5 py-3.5">
                          <select
                            value={c.status || "Available"}
                            onChange={async (e) => {
                              const newStatus = e.target.value as CarStatus
                              const updated = await api.updateCarStatus(
                                c.id,
                                newStatus,
                              )
                              setCars((prev) =>
                                prev.map((x) => (x.id === c.id ? updated : x)),
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
                            <option value="Maintenance">Maintenance</option>
                            <option value="Cleaning">Cleaning</option>
                          </select>
                        </td>

                        {/* Health score */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold ${
                                isDark ? "text-white" : "text-stone-900"
                              }`}
                            >
                              {c.healthScore || 98}%
                            </span>
                            <div
                              className={`w-16 h-1.5 rounded-full overflow-hidden ${
                                isDark ? "bg-stone-800" : "bg-stone-100"
                              }`}
                            >
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${c.healthScore || 98}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={`text-[10px] ${
                              isDark ? "text-stone-500" : "text-stone-400"
                            }`}
                          >
                            Inspection Pass
                          </span>
                        </td>

                        {/* Fuel */}
                        <td
                          className={`px-5 py-3.5 font-mono ${
                            isDark ? "text-stone-300" : "text-stone-700"
                          }`}
                        >
                          {c.mileage || "30 MPG"}
                        </td>

                        {/* Daily, Hourly & Monthly Dynamic Rates */}
                        <td className="px-5 py-3.5 text-right font-mono">
                          <span
                            className={`font-bold block ${
                              isDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            ${c.pricePerDay}/day
                          </span>
                          <span className="text-[11px] text-stone-400 block font-normal">
                            ${c.pricePerHour || 8}/hr • $
                            {c.pricePerMonth || Math.round(c.pricePerDay * 22)}/mo
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
                              onClick={() => handleDeleteCar(c.id, c.name)}
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
                    ))}
                  </tbody>
                </table>
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
                            📷 {c.gallery.length}
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
                          ${c.pricePerDay}/day
                        </span>
                        <span className="font-mono text-[10px] text-stone-400 block font-medium">
                          ${c.pricePerHour || 8}/hr • $
                          {c.pricePerMonth || Math.round(c.pricePerDay * 22)}/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            TAB 3: ⚡ WALK-IN COUNTER DISPATCH (< 60s)
            ======================================================== */}
        {activeTab === "walkin" && (
          <section
            className={`border rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto transition ${
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
                  className={`text-lg font-black ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                >
                  ⚡ Direct Walk-In Rental Booking
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

            <form onSubmit={handleWalkinSubmit} className="mt-6 space-y-6">
              {/* Step 1: Customer Details */}
              <div>
                <h4
                  className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Step 1: Driver Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        setWalkinForm({ ...walkinForm, email: e.target.value })
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
                        setWalkinForm({ ...walkinForm, phone: e.target.value })
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
                              {car.plateNumber} • ${car.pricePerDay}/day
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
                    min="1"
                    max="60"
                    value={walkinForm.totalDays}
                    onChange={(e) => {
                      const days = Math.max(1, Number(e.target.value) || 1)
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
                  Promo Coupon Rule Engine
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Dynamic discounts applied live during customer checkout and
                  rate calculation.
                </p>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <PlusIcon size={14} />+ Create Promo Code
              </button>
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
                  {promos.map((p) => (
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
                  ))}
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
                            {cust.name.charAt(0)}
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
                    fetchMaintenancePage(1, mntPagination.limit, mntSearch, val)
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
                  <strong className={isDark ? "text-white" : "text-stone-900"}>
                    {mntPagination.total === 0
                      ? 0
                      : (mntPagination.page - 1) * mntPagination.limit + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className={isDark ? "text-white" : "text-stone-900"}>
                    {Math.min(
                      mntPagination.page * mntPagination.limit,
                      mntPagination.total,
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong className={isDark ? "text-white" : "text-stone-900"}>
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
      </main>

      {/* ========================================================
          FULL-PAGE RESERVATION INSPECTION MANIFEST (Bug 5: Full View)
          ======================================================== */}
      {inspectedBooking && (
        <div
          onClick={() => setInspectedBooking(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-6xl max-h-[94vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition cursor-default my-auto ${
              isDark
                ? "bg-[#14161A] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            {/* Modal Top Header */}
            <div
              className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
                isDark
                  ? "bg-[#17191C] border-stone-800"
                  : "bg-white border-stone-200 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInspectedBooking(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                      : "bg-stone-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-stone-700 border border-stone-200 shadow-2xs"
                  }`}
                  title="Return to Manifest Table (or press Esc)"
                >
                  <ArrowLeftIcon size={14} />
                  <span>Back</span>
                </button>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-wider block">
                    RESERVATION INSPECTION MANIFEST • FULL PAGE VIEW
                  </span>
                  <h3
                    className={`text-xl font-black font-mono mt-0.5 leading-none ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {inspectedBooking.id}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedBooking(null)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold cursor-pointer transition ${
                  isDark
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 shadow-2xs"
                }`}
                title="Close Manifest"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
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
                    {inspectedBooking.status === "Assigned" && (
                      <button
                        onClick={() => handleOpenKeyHandoff(inspectedBooking)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <ZapIcon size={13} /> Handoff Keys & Start Clock
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
                ) : (
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
                        onClick={() =>
                          handleApproveBooking(inspectedBooking.id)
                        }
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckIcon size={14} /> Accept Request
                      </button>
                      <button
                        onClick={() =>
                          handleDeclineBooking(inspectedBooking.id)
                        }
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

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
                        🕒 {formatFullDateTime(inspectedBooking.keysHandedAt)}
                      </span>
                    </div>
                    {inspectedBooking.checklistOut && (
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
                          mi
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
                      </p>
                    )}
                  </div>
                )}
              </div>

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
                          🕒 Scheduled Time: {pickupTimeStr}
                        </p>
                        <p
                          className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate"
                          title={inspectedBooking.pickupLocation}
                        >
                          📍 {inspectedBooking.pickupLocation}
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
                          🕒 Scheduled Time: {returnTimeStr}
                        </p>
                        <p
                          className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate"
                          title={inspectedBooking.returnLocation}
                        >
                          📍 {inspectedBooking.returnLocation}
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
                              {formatFullDateTime(
                                inspectedBooking.keysHandedAt,
                              )}
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
                      🔔 Customer Requested Rental Extension
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
                    className={`mb-4 p-3 rounded-xl border text-xs space-y-1 transition ${
                      isDark
                        ? "bg-sky-950/40 border-sky-500/40 text-sky-200"
                        : "bg-sky-50 border-sky-200 text-sky-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        Quotation Dispatched to Customer
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        +$
                        {inspectedBooking.extensionQuote.totalQuotedAmount.toFixed(
                          2,
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Rate: ${inspectedBooking.extensionQuote.rateAmount} /{" "}
                      {inspectedBooking.extensionQuote.rateType} • Awaiting
                      customer approval in self-service portal.
                    </p>
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
                      Extension Approved &amp; Added to Billing (+$
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

              {/* Customer Profile & Verification */}
              <div className="space-y-4">
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
                        ✓ High-Resolution Real Uploads
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
                              className="relative h-28 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 cursor-zoom-in group"
                              title="Click to zoom / view full resolution"
                            >
                              <img
                                src={frontSrc}
                                alt="Driver License Front"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                🔍 Click to Zoom
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
                                📥 Download Front
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
                              className="relative h-28 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 cursor-zoom-in group"
                              title="Click to zoom / view full resolution"
                            >
                              <img
                                src={backSrc}
                                alt="Driver License Back"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                🔍 Click to Zoom
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
                                📥 Download Back
                              </button>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

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
                                {c.type} • {c.location} • Health {c.healthScore}
                                %
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
                              {c.garageName ||
                                "MOTORLY Central Hub & Garage Bay 4"}
                            </p>
                            <p
                              className={`font-mono text-[11px] ${
                                isDark ? "text-stone-400" : "text-stone-500"
                              }`}
                            >
                              {c.garageAddress ||
                                "4200 NW 21st St, Miami, FL 33142"}
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
                        No vehicle currently mated. Select an available car
                        below:
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
                              {c.name} ({c.plateNumber}) - {c.type} ($
                              {c.pricePerDay}/day)
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Itinerary */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition ${
                    isDark
                      ? "bg-stone-900/60 border-stone-800"
                      : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Trip Logistics
                  </h4>
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
                  <div
                    className={`pt-2 border-t flex justify-between font-mono font-bold text-sm ${
                      isDark
                        ? "border-stone-800 text-white"
                        : "border-stone-200 text-stone-900"
                    }`}
                  >
                    <span>Total Billing:</span>
                    <span className="text-emerald-500">
                      ${inspectedBooking.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Flow G: Return Inspection Summary if Completed */}
                {inspectedBooking.checklistIn && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                      isDark
                        ? "bg-stone-900/60 border-stone-800"
                        : "bg-stone-50 border-stone-200"
                    }`}
                  >
                    <span className="font-bold text-emerald-500">
                      ✓ Return Vehicle Inspection Audit Completed
                    </span>
                    <p
                      className={`text-[11px] ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Odometer In:{" "}
                      <span
                        className={`font-mono ${
                          isDark ? "text-white" : "text-stone-900"
                        }`}
                      >
                        {inspectedBooking.checklistIn.odometerIn.toLocaleString()}{" "}
                        mi
                      </span>{" "}
                      • Fuel In:{" "}
                      <span
                        className={`font-mono ${
                          isDark ? "text-white" : "text-stone-900"
                        }`}
                      >
                        {inspectedBooking.checklistIn.fuelLevelIn}
                      </span>{" "}
                      • Auditor:{" "}
                      <span
                        className={
                          isDark
                            ? "text-stone-300"
                            : "text-stone-700 font-medium"
                        }
                      >
                        {inspectedBooking.checklistIn.inspectorStaff}
                      </span>
                    </p>
                    {inspectedBooking.checklistIn.damageFound && (
                      <p className="text-[11px] text-rose-500">
                        Damage Notes: {inspectedBooking.checklistIn.damageNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`pt-6 border-t flex gap-3 ${
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
          MODAL: ADD / EDIT VEHICLE (Flow A: Fleet, Insurance & Garage Map)
          ======================================================== */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div
            className={`border rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden transition ${
              isDark
                ? "bg-[#14161A] border-stone-800 text-white"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            {/* Executive Header */}
            <div
              className={`px-6 py-4.5 border-b flex items-center justify-between shrink-0 ${
                isDark
                  ? "border-stone-800 bg-stone-900/40"
                  : "border-stone-200/90 bg-stone-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center font-black">
                  <CarIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-wider">
                      FLEET MANAGEMENT • GARAGE HUB
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      LIVE SYNC
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-heading tracking-tight mt-0.5">
                    {editingCar
                      ? `Edit Vehicle: ${editingCar.name}`
                      : "Add New Vehicle"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="close-car-modal"
                  onClick={() => setIsCarModalOpen(false)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                    isDark
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200"
                  }`}
                  title="Close Modal"
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
                  label: "1. Vehicle Details",
                  icon: "🏷️",
                  desc: "Make, Model, Year & Photo",
                },
                {
                  id: "rates",
                  label: "2. Pricing & Engine",
                  icon: "💰",
                  desc: "Rates, Fuel & Specs",
                },
                {
                  id: "insurance",
                  label: "3. Insurance & Policy",
                  icon: "🛡️",
                  desc: "Coverage & Mileage",
                },
                {
                  id: "garage",
                  label: "4. Garage Location",
                  icon: "📍",
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
                    <span>{tab.icon}</span>
                    <span className="font-heading">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Modal Body: Two-Column Studio Layout */}
            <form
              onSubmit={handleSaveCar}
              className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
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
                          type="number"
                          min="2018"
                          max="2027"
                          value={carFormData.year || 2024}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,
                              year: Number(e.target.value),
                            })
                          }
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
                          const isSelected =
                            (carFormData.type || "Sedan") === cat
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
                              <span>
                                {cat === "Sedan"
                                  ? "🚗"
                                  : cat === "SUV"
                                    ? "🚙"
                                    : cat === "Luxury"
                                      ? "✨"
                                      : cat === "Economy"
                                        ? "⚡"
                                        : "🚐"}
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
                            Upload multiple exterior, interior, cockpit, and angle photos. First photo serves as primary listing cover.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[#F97316] border border-orange-500/20">
                          {(carFormData.gallery || []).length} Photo{(carFormData.gallery || []).length !== 1 ? "s" : ""} in Gallery
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
                            {isUploadingPhotos ? "⏳" : "📷"}
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
                            const isAlreadyAdded = (
                              carFormData.gallery || []
                            ).includes(preset.url)
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
                                {isAlreadyAdded ? "✓ Added" : preset.label}
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
                            <p className="text-sm font-bold">No photos in gallery</p>
                            <p className="text-xs mt-1">
                              Upload multiple photos from your device or use the sample angles above.
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
                                        ★ Primary Cover
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
                                          title: `${carFormData.name || "Vehicle"} - Photo ${idx + 1}${isCover ? " (Cover)" : ""}`,
                                        })
                                      }
                                      className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white text-xs flex items-center justify-center transition cursor-pointer"
                                      title="Inspect photo full size"
                                    >
                                      🔍
                                    </button>
                                  </div>

                                  {/* Card Action Controls */}
                                  <div className="p-2 flex items-center justify-between gap-1 text-[11px]">
                                    {/* Set as Cover / Cover Label */}
                                    {isCover ? (
                                      <span className="text-[10px] font-bold text-[#F97316] flex items-center gap-1">
                                        ✓ Main Display
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetCoverPhoto(idx)}
                                        className="text-[10px] font-bold text-[#F97316] hover:underline cursor-pointer"
                                        title="Make this photo the primary cover image"
                                      >
                                        ★ Set as Cover
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
                          type="number"
                          min="2"
                          max="9"
                          value={carFormData.seats || 5}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,
                              seats: Number(e.target.value),
                            })
                          }
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
                        <input
                          type="text"
                          placeholder="e.g. 3 Bags"
                          value={carFormData.luggage || "3 Bags"}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,
                              luggage: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>
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
                          Price Per Day ($){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 font-bold text-stone-400 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            min="10"
                            max="2500"
                            value={carFormData.pricePerDay || 55}
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                pricePerDay: Number(e.target.value),
                              })
                            }
                            className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-black transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                              isDark
                                ? "bg-stone-900 border border-stone-700 text-orange-400"
                                : "bg-white border border-stone-300 text-orange-600 focus:bg-white"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 font-mono">
                          Weekly Est: $
                          {((carFormData.pricePerDay || 55) * 7).toFixed(0)} •
                          Monthly Est: $
                          {((carFormData.pricePerDay || 55) * 30).toFixed(0)}
                        </p>
                      </div>

                      {/* Price Per Hour */}
                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Price Per Hour ($/hr)
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 font-bold text-stone-400 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            min="2"
                            max="500"
                            value={carFormData.pricePerHour || 8}
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                pricePerHour: Number(e.target.value),
                              })
                            }
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
                            Price Per Month ($/mo)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const calculated = Math.round((carFormData.pricePerDay || 55) * 22)
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
                            $
                          </span>
                          <input
                            type="number"
                            min="100"
                            max="50000"
                            value={
                              carFormData.pricePerMonth !== undefined
                                ? carFormData.pricePerMonth
                                : Math.round((carFormData.pricePerDay || 55) * 22)
                            }
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                pricePerMonth: Number(e.target.value),
                              })
                            }
                            className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-mono font-bold transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                              isDark
                                ? "bg-stone-900 border border-stone-700 text-emerald-400"
                                : "bg-white border border-stone-300 text-emerald-600 focus:bg-white"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 font-mono">
                          Effective: $
                          {(
                            (carFormData.pricePerMonth ||
                              Math.round((carFormData.pricePerDay || 55) * 22)) /
                            30
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
                            ⚙️ Automatic Transmission
                          </option>
                          <option value="Manual">🕹️ Manual 6-Speed</option>
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
                          value={carFormData.fuelType || "Gasoline"}
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
                          <option value="Gasoline">
                            ⛽ Gasoline (Standard)
                          </option>
                          <option value="Hybrid">
                            🔋 Hybrid Electric (Eco)
                          </option>
                          <option value="Electric">
                            ⚡ Full Electric (EV)
                          </option>
                        </select>
                      </div>

                      {/* Fuel Efficiency */}
                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Fuel Economy / Mileage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 32 MPG or 118 MPGe"
                          value={carFormData.mileage || "32 MPG"}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,
                              mileage: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-[#F97316] ${
                            isDark
                              ? "bg-stone-900 border border-stone-700 text-white"
                              : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                          }`}
                        />
                      </div>

                      {/* Health Score */}
                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Vehicle Condition Score (
                          {carFormData.healthScore || 98}%)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="50"
                            max="100"
                            value={carFormData.healthScore || 98}
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                healthScore: Number(e.target.value),
                              })
                            }
                            className="flex-1 accent-[#F97316] cursor-pointer"
                          />
                          <span className="font-mono text-xs font-bold text-emerald-500 w-10 text-right">
                            {carFormData.healthScore || 98}%
                          </span>
                        </div>
                      </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Insurance Carrier{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. State Farm Commercial, Geico Fleet"
                          value={carFormData.insuranceProvider || ""}
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
                          Policy Certificate ID{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. POL-STF-994021"
                          value={carFormData.insurancePolicy || ""}
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
                          value={carFormData.insuranceExpiry || "2027-12-31"}
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

                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={carFormData.purchaseDate || "2024-01-15"}
                          onChange={(e) =>
                            setCarFormData({
                              ...carFormData,
                              purchaseDate: e.target.value,
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
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
                          Vehicle Purchase Price ($)
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 font-bold text-stone-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="32500"
                            value={carFormData.purchaseCost || 32500}
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                purchaseCost: Number(e.target.value),
                              })
                            }
                            className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-xs font-mono transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isDark
                                ? "bg-stone-900 border border-stone-700 text-white"
                                : "bg-white border border-stone-300 text-stone-900 focus:bg-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-xs font-bold mb-1 ${
                            isDark ? "text-stone-300" : "text-stone-800"
                          }`}
                        >
                          Current Odometer (mi){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            placeholder="14200"
                            value={carFormData.currentOdometer || 14200}
                            onChange={(e) =>
                              setCarFormData({
                                ...carFormData,
                                currentOdometer: Number(e.target.value),
                              })
                            }
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
                      </div>
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
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-500">
                        Assigned Garage Location &amp; Map
                      </h4>
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
                          placeholder="e.g. Miami Airport Central Garage"
                          value={carFormData.garageName || ""}
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
                          Facility Address{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4200 NW 21st St, Miami, FL 33142"
                          value={carFormData.garageAddress || ""}
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
                          value={carFormData.garageBay || "Bay 14-B"}
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
                            garageAddress: address,
                          }))
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Customer Storefront Card Preview */}
              <div className="lg:col-span-5 sticky top-2 space-y-4">
                <div
                  className={`p-5 rounded-3xl border shadow-lg space-y-4 transition ${
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
                        <span className="text-amber-500 text-xs">★</span>
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
                          {previewPhotoIndex + 1} / {(carFormData.gallery || []).length} Photos
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
                            {carFormData.fuelType || "Gasoline"} •{" "}
                            {carFormData.mileage || "30 MPG"}
                          </p>
                        </div>
                      </div>

                      {/* Trust & Guarantee Chips */}
                      <div
                        className={`space-y-1.5 pt-1 border-t text-[11px] ${
                          isDark ? "border-stone-800" : "border-stone-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <span>🛡️</span>
                          <span className="font-semibold">
                            {carFormData.insuranceProvider ||
                              "Commercial Insurance"}{" "}
                            ({carFormData.insurancePolicy || "Verified"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sky-600">
                          <span>📍</span>
                          <span className="font-medium truncate">
                            {carFormData.garageName || "Central Garage"} •{" "}
                            {carFormData.garageBay || "Bay 14-B"}
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
                            ${carFormData.pricePerDay || 55}
                          </span>
                          <span className="text-[10px] text-stone-400 font-semibold">
                            {" "}
                            / day
                          </span>
                          <span className="text-[10px] text-stone-400 block font-medium">
                            ${carFormData.pricePerHour || 8}/hr • $
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
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-heading"
                  >
                    <CheckIcon size={14} />
                    <span>
                      {editingCar ? "Save Changes" : "Save & Add to Fleet"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE PROMO CODE
          ======================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                  min="5"
                  max="75"
                  required
                  value={newPromoData.discountPercent}
                  onChange={(e) =>
                    setNewPromoData({
                      ...newPromoData,
                      discountPercent: Number(e.target.value),
                    })
                  }
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    value={newMntData.cost}
                    onChange={(e) =>
                      setNewMntData({
                        ...newMntData,
                        cost: Number(e.target.value),
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
                    value={newMntData.odometer}
                    onChange={(e) =>
                      setNewMntData({
                        ...newMntData,
                        odometer: Number(e.target.value),
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl transition ${
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition ${
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
              className={`my-4 p-3 rounded-xl border text-xs space-y-1 ${
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
                    className={`flex justify-between pt-1 border-t text-amber-500 font-medium ${
                      isDark ? "border-stone-800" : "border-stone-200"
                    }`}
                  >
                    <span>Vehicle & Stall:</span>
                    <span className="font-mono font-bold">
                      {c.name} ({c.plateNumber}) • {c.garageBay || "Bay 14-B"}
                    </span>
                  </div>
                ) : null
              })()}
            </div>

            <form onSubmit={handleSubmitKeyHandoff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    Departure Odometer (mi)
                  </label>
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
                ⚡ <strong>Clock Start Notice:</strong> Submitting will record
                this exact timestamp, start the customer's live rental timer,
                and transition this vehicle to <strong>Rented</strong>.
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl transition ${
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
                  <ClockIcon size={18} className="text-amber-500" />
                  Dispatch Extension Quotation
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
                    Rate Amount ($)
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
                  Total Extension Quoted ($)
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
                  className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowRightIcon size={14} /> Send Quotation to Customer
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition ${
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
                    className={`p-3 border rounded-xl space-y-1 ${
                      isDark
                        ? "bg-rose-950/30 border-rose-500/40"
                        : "bg-rose-50 border-rose-200"
                    }`}
                  >
                    <label
                      className={`block text-[11px] font-bold ${
                        isDark ? "text-rose-400" : "text-rose-600"
                      }`}
                    >
                      Damage Assessment Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe location and severity of damage..."
                      value={returnChecklist.damageNotes}
                      onChange={(e) =>
                        setReturnChecklist({
                          ...returnChecklist,
                          damageNotes: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs transition ${
                        isDark
                          ? "bg-stone-950 border border-stone-700 text-white"
                          : "bg-white border border-stone-200 text-stone-900 focus:bg-white"
                      }`}
                    />
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className={`max-w-3xl w-full rounded-3xl p-5 border shadow-2xl relative space-y-4 ${
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
                  📥 Download Image File
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
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8 relative ${
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
                    <h3 id="admin-profile-title" className="font-black text-lg sm:text-xl tracking-tight">
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
              {/* Identity & Clearance Info */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider font-mono text-stone-400 mb-3">
                  Administrator Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Official Email</span>
                    <p className="font-bold font-mono mt-0.5 text-stone-800 dark:text-stone-200">
                      admin@motorly.com
                    </p>
                    <span className="text-[10px] text-emerald-500 font-semibold mt-1 inline-block">
                      ● Verified Root Console Account
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Clearance Level</span>
                    <p className="font-bold mt-0.5 text-stone-800 dark:text-stone-200">
                      Tier 4 (Master Controller)
                    </p>
                    <span className="text-[10px] text-stone-500 font-mono mt-1 inline-block">
                      Full Read / Write / Overrides / CRM
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Stationed Hub</span>
                    <p className="font-bold mt-0.5 text-stone-800 dark:text-stone-200">
                      Miami Intl Airport (MIA)
                    </p>
                    <span className="text-[10px] text-stone-500 font-mono mt-1 inline-block">
                      Terminal Garage B • Bay 4 HQ
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Active Session</span>
                    <p className="font-bold font-mono mt-0.5 text-stone-800 dark:text-stone-200">
                      #ADM-9842-SEC
                    </p>
                    <span className="text-[10px] text-emerald-500 font-semibold mt-1 inline-block">
                      ● Authenticated via Secure Token
                    </span>
                  </div>
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
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-[#F97316]">{cars.length}</p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Fleet Vehicles</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-emerald-500">
                      {bookings.filter((b) => b.status === "Checked Out").length}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Active Trips</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p className="text-xl font-black text-amber-500">
                      {
                        bookings.filter((b) => b.status === "Pending Assignment")
                          .length
                      }
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Pending Requests</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                    }`}
                  >
                    <p
                      className={`text-xl font-black ${
                        overdueBookings.length > 0 ? "text-rose-500" : "text-stone-400"
                      }`}
                    >
                      {overdueBookings.length}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Overdue Trips</span>
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
                    isDark ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Database Engine:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      Supabase PostgreSQL (aws-0-us-east-1)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Security / Password Auth:</span>
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
                    <span className="text-stone-500">Public Reviews Setting:</span>
                    <span
                      className={`font-mono font-bold ${
                        reviewsEnabled ? "text-amber-500" : "text-stone-400"
                      }`}
                    >
                      {reviewsEnabled ? "Enabled (Public Feedback ON)" : "Disabled (Reviews Suppressed)"}
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
                  <span>{reviewsEnabled ? "Disable Customer Reviews" : "Enable Customer Reviews"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isDark ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}</span>
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
                <span>🚪</span>
                <span>Sign Out of Admin Console</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
