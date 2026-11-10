import React, { useState, useEffect, useMemo } from "react"
import type {
  BookingRecord,
  BookingStatus,
  Car,
  CarStatus,
  PromoCode,
  AdminCustomerRecord,
  MaintenanceLog,
} from "../types"
import { api } from "../services/api"

import AdminSidebar, { type AdminTab } from "./admin/AdminSidebar"
import AdminTopHeader from "./admin/AdminTopHeader"
import AdminOrdersView from "./admin/AdminOrdersView"
import AdminNotificationsView from "./admin/AdminNotificationsView"
import AdminCompletedView from "./admin/AdminCompletedView"
import AdminFleetView from "./admin/AdminFleetView"
import AdminWalkinView from "./admin/AdminWalkinView"
import AdminPromosView from "./admin/AdminPromosView"
import AdminCrmView from "./admin/AdminCrmView"
import AdminMaintenanceView from "./admin/AdminMaintenanceView"
import AdminSettingsView from "./admin/AdminSettingsView"

import AdminKeyHandoverModal from "./admin/AdminKeyHandoverModal"
import AdminReturnModal from "./admin/AdminReturnModal"
import AdminCarModal from "./admin/AdminCarModal"
import InvoiceModal from "../components/InvoiceModal"

export interface AdminViewProps {
  cars: Car[]
  setCars: React.Dispatch<React.SetStateAction<Car[]>>
  bookings: BookingRecord[]
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  targetBookingId?: string
  onClearTargetBookingId?: () => void
}

export default function AdminView({
  cars,
  setCars,
  bookings,
  setBookings,
  onExitAdmin,
  onLogoutAdmin,
  targetBookingId,
  onClearTargetBookingId,
}: AdminViewProps) {
  // Navigation tab state with URL and localStorage sync
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const tabParam = params.get("tab") as AdminTab
        const validTabs: AdminTab[] = [
          "manifest",
          "notifications",
          "completed",
          "fleet",
          "walkin",
          "promos",
          "crm",
          "maintenance",
          "settings",
        ]
        if (tabParam && validTabs.includes(tabParam)) return tabParam
      }
      const savedTab =
        typeof localStorage !== "undefined"
          ? (localStorage.getItem("motorly_admin_active_tab") as AdminTab)
          : null
      const validTabs: AdminTab[] = [
        "manifest",
        "notifications",
        "completed",
        "fleet",
        "walkin",
        "promos",
        "crm",
        "maintenance",
        "settings",
      ]
      if (savedTab && validTabs.includes(savedTab)) return savedTab
    } catch {}
    return "manifest"
  })

  // Synchronize activeTab to URL and localStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("motorly_admin_active_tab", activeTab)
      }
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", activeTab)
        window.history.replaceState(null, "", url.toString())
      }
    } catch {}
  }, [activeTab])

  // Clear bookingId query param from URL on mount so refreshing never loops
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.has("bookingId")) {
          url.searchParams.delete("bookingId")
          window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""))
        }
      } catch {}
    }
  }, [])

  // Header Search Query
  const [searchQuery, setSearchQuery] = useState("")

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Responsive sidebar collapse state (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("motorly_admin_sidebar_collapsed") === "true"
      }
    } catch {}
    return false
  })

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("motorly_admin_sidebar_collapsed", String(isSidebarCollapsed))
      }
    } catch {}
  }, [isSidebarCollapsed])

  // Secondary Datasets (Promos, CRM, Maintenance)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [adminCustomers, setAdminCustomers] = useState<AdminCustomerRecord[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])

  // Modals state
  const [activeGiveKeysBooking, setActiveGiveKeysBooking] = useState<BookingRecord | null>(null)
  const [activeReturnBooking, setActiveReturnBooking] = useState<BookingRecord | null>(null)
  const [editingCar, setEditingCar] = useState<Car | null | "new">(null)
  const [activeInvoiceBooking, setActiveInvoiceBooking] = useState<BookingRecord | null>(null)

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 4000)
  }

  // Initial data loading
  useEffect(() => {
    let mounted = true

    async function refreshPrimary() {
      try {
        const [latestBookings, latestCars] = await Promise.allSettled([
          api.getBookings(),
          api.getCars(),
        ])
        if (mounted) {
          if (latestBookings.status === "fulfilled" && Array.isArray(latestBookings.value)) {
            setBookings(latestBookings.value)
          }
          if (latestCars.status === "fulfilled" && Array.isArray(latestCars.value)) {
            setCars(latestCars.value)
          }
        }
      } catch (err) {
        console.warn("[AdminView] Primary data load error:", err)
      }
    }

    async function refreshSecondary() {
      try {
        const [remotePromos, remoteMnt, remoteCustomers] = await Promise.allSettled([
          api.getPromos(),
          api.getMaintenanceLogs({ page: 1, limit: 30 }),
          api.getAdminCustomers(),
        ])
        if (mounted) {
          if (remotePromos.status === "fulfilled" && Array.isArray(remotePromos.value)) {
            setPromos(remotePromos.value)
          }
          if (remoteMnt.status === "fulfilled") {
            const val = remoteMnt.value
            const list = Array.isArray(val) ? val : (val as any)?.data || []
            setMaintenanceLogs(list)
          }
          if (remoteCustomers.status === "fulfilled" && Array.isArray(remoteCustomers.value)) {
            setAdminCustomers(remoteCustomers.value)
          }
        }
      } catch (err) {
        console.warn("[AdminView] Secondary data load error:", err)
      }
    }

    refreshPrimary()
    refreshSecondary()

    return () => {
      mounted = false
    }
  }, [setBookings, setCars])

  // Count pending items requiring admin action
  const notificationsCount = useMemo(() => {
    return bookings.filter((b) => {
      const s = String(b.status || "").toLowerCase()
      return (
        s.includes("pending") ||
        s.includes("advance") ||
        s.includes("assigned") ||
        s.includes("approved") ||
        s.includes("checked out") ||
        s.includes("checked_out")
      )
    }).length
  }, [bookings])

  // Active bookings count
  const ordersCount = useMemo(() => {
    return bookings.filter((b) => {
      const s = String(b.status || "").toLowerCase()
      return !s.includes("cancelled") && !s.includes("declined")
    }).length
  }, [bookings])

  // Available cars for walk-in dispatch
  const availableCars = useMemo(() => {
    return cars.filter((c) => !c.status || c.status.toLowerCase() === "available")
  }, [cars])

  // --- Handlers & API Operations ---

  // 1. Approve Booking
  const handleApproveBooking = async (id: string) => {
    try {
      await api.approveBooking(id)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "Assigned" as BookingStatus, approvedByAdmin: true } : b
        )
      )
      showToast("Booking request approved! Customer can now pick up the car.")
    } catch (err: any) {
      alert("Failed to approve booking: " + (err?.message || "Unknown error"))
    }
  }

  // 2. Decline Booking
  const handleDeclineBooking = async (id: string) => {
    try {
      await api.declineBooking(id)
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" as BookingStatus } : b))
      )
      showToast("Booking has been declined.")
    } catch (err: any) {
      alert("Failed to decline booking: " + (err?.message || "Unknown error"))
    }
  }

  // 3. Confirm Key Handover
  const handleConfirmGiveKeys = async (odometerOut: number) => {
    if (!activeGiveKeysBooking) return
    const bookingId = activeGiveKeysBooking.id
    const carId = activeGiveKeysBooking.matchedCarId

    await api.handoverKeys(bookingId, {
      odometerOut,
      fuelOut: "Full",
      exteriorClean: true,
      tiresInspected: true,
      staffSign: "Garage Dispatch Officer",
    })

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "Checked Out" as BookingStatus,
              odometerOut,
              keysHandedAt: new Date().toISOString(),
            }
          : b
      )
    )

    if (carId) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === carId
            ? { ...c, status: "Rented" as CarStatus, currentOdometer: odometerOut }
            : c
        )
      )
    }

    setActiveGiveKeysBooking(null)
    showToast("Keys handed over! Rental has officially started.")
  }

  // 4. Confirm Return Inspection
  const handleConfirmReturn = async (data: {
    odometerIn: number
    cleanlinessPass: boolean
    damageFound: boolean
  }) => {
    if (!activeReturnBooking) return
    const bookingId = activeReturnBooking.id
    const carId = activeReturnBooking.matchedCarId

    await api.returnInspection(bookingId, {
      odometerIn: data.odometerIn,
      fuelIn: "Full",
      cleanlinessPass: data.cleanlinessPass,
      damageFound: data.damageFound,
      staffSign: "Garage Inspection Lead",
    })

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "Completed" as BookingStatus,
              odometerIn: data.odometerIn,
            }
          : b
      )
    )

    const nextStatus: CarStatus = data.damageFound ? "Maintenance" : "Available"
    if (carId) {
      await api.updateCarStatus(carId, nextStatus).catch(() => {})
      setCars((prev) =>
        prev.map((c) =>
          c.id === carId
            ? {
                ...c,
                status: nextStatus,
                currentOdometer: data.odometerIn,
              }
            : c
        )
      )
    }

    setActiveReturnBooking(null)
    showToast(
      data.damageFound
        ? "Vehicle return audited and routed to maintenance for service."
        : "Vehicle checked in successfully! Ready for the next customer."
    )
  }

  // 5. Walk-In Instant Booking
  const handleCreateWalkin = async (data: {
    customerName: string
    customerPhone: string
    carId: string
    totalDays: number
    dailyRate: number
    totalPrice: number
  }) => {
    const today = new Date().toISOString().split("T")[0]
    const returnDate = new Date(Date.now() + data.totalDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const names = data.customerName.trim().split(" ")
    const firstName = names[0] || "Walkin"
    const lastName = names.slice(1).join(" ") || "Customer"

    const result = await api.createCounterBooking({
      firstName,
      lastName,
      email: `walkin_${Date.now()}@motorly.local`,
      phone: data.customerPhone,
      carId: data.carId,
      pickupDate: today,
      returnDate,
      totalAmount: data.totalPrice,
      immediateCheckout: true,
      notes: "Direct counter walk-in rental",
    })

    if (result && result.booking) {
      setBookings((prev) => [result.booking, ...prev])
    }

    setCars((prev) =>
      prev.map((c) => (c.id === data.carId ? { ...c, status: "Rented" as CarStatus } : c))
    )

    showToast(`Walk-in customer registered! Keys dispatched for ${data.customerName}.`)
  }

  // 6. Car Add / Edit
  const handleSaveCar = async (carData: Partial<Car>) => {
    if (editingCar === "new") {
      const created = await api.createCar(carData)
      setCars((prev) => [created, ...prev])
      showToast(`Added "${created.name}" to the garage fleet.`)
    } else if (editingCar && typeof editingCar === "object") {
      const updated = await api.updateCar(editingCar.id, carData)
      setCars((prev) =>
        prev.map((c) => (c.id === editingCar.id ? { ...c, ...updated } : c))
      )
      showToast(`Updated "${updated.name}" specifications.`)
    }
    setEditingCar(null)
  }

  // 7. Car Delete
  const handleDeleteCar = async (id: string) => {
    await api.deleteCar(id)
    setCars((prev) => prev.filter((c) => c.id !== id))
    showToast("Vehicle removed from fleet inventory.")
  }

  // 8. Car Status Toggle
  const handleUpdateCarStatus = async (id: string, status: CarStatus) => {
    await api.updateCarStatus(id, status)
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    showToast(status === "Available" ? "Vehicle set to Available." : "Vehicle routed to Service.")
  }

  // 9. Promos: Create, Toggle, Delete
  const handleCreatePromo = async (data: {
    code: string
    discountPercent: number
    description: string
    expiryDate: string
  }) => {
    const created = await api.createPromo(data)
    setPromos((prev) => [created, ...prev])
    showToast(`Privilege code "${created.code}" created successfully.`)
  }

  const handleTogglePromo = async (code: string) => {
    const updated = await api.togglePromo(code)
    setPromos((prev) => prev.map((p) => (p.code === code ? updated : p)))
    showToast(`Promo "${code}" is now ${updated.isActive ? "ACTIVE" : "PAUSED"}.`)
  }

  const handleDeletePromo = async (code: string) => {
    await api.deletePromo(code)
    setPromos((prev) => prev.filter((p) => p.code !== code))
    showToast(`Promo "${code}" removed.`)
  }

  // 10. Maintenance Log Create
  const handleCreateMaintenanceLog = async (data: {
    carId: string
    serviceType: string
    cost: number
    odometer: number
    date: string
    status: "Completed" | "Scheduled" | "In Progress"
    technicianNotes: string
  }) => {
    const created = await api.createMaintenanceLog(data)
    setMaintenanceLogs((prev) => [created, ...prev])
    showToast("Service entry recorded in maintenance audit.")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-stone-900 flex antialiased font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs shadow-xl border border-stone-700 flex items-center gap-2.5 animate-fadeIn max-w-md"
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            ✓
          </span>
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modern Studio Left Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        ordersCount={ordersCount}
        notificationsCount={notificationsCount}
        fleetCount={cars.length}
        promosCount={promos.length}
        onExitAdmin={onExitAdmin}
        onLogoutAdmin={onLogoutAdmin}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Workspace - Independent scroll container so sidebar never scrolls away */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Crisp Medium Top Header Bar */}
        <AdminTopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notificationsCount={notificationsCount}
          onOpenNotifications={() => setActiveTab("notifications")}
          onExitAdmin={onExitAdmin}
          onLogoutAdmin={onLogoutAdmin}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Scrollable Subview Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: Orders & Dispatch (Main Dashboard) */}
          {activeTab === "manifest" && (
            <AdminOrdersView
              bookings={bookings}
              cars={cars}
              searchQuery={searchQuery}
              onApprove={handleApproveBooking}
              onDecline={handleDeclineBooking}
              onOpenGiveKeys={(b) => setActiveGiveKeysBooking(b)}
              onOpenReturn={(b) => setActiveReturnBooking(b)}
              onOpenWalkin={() => setActiveTab("walkin")}
              onOpenInvoice={(b) => setActiveInvoiceBooking(b)}
              targetBookingId={targetBookingId}
              onClearTargetBookingId={onClearTargetBookingId}
            />
          )}

          {/* TAB 2: Notifications & Action Center */}
          {activeTab === "notifications" && (
            <AdminNotificationsView
              bookings={bookings}
              cars={cars}
              onApprove={handleApproveBooking}
              onDecline={handleDeclineBooking}
              onOpenGiveKeys={(b) => setActiveGiveKeysBooking(b)}
              onOpenReturn={(b) => setActiveReturnBooking(b)}
              onOpenInvoice={(b) => setActiveInvoiceBooking(b)}
            />
          )}

          {/* TAB 3: Completed Orders & Invoice Archive (ZERO ALERTS) */}
          {activeTab === "completed" && (
            <AdminCompletedView
              bookings={bookings}
              cars={cars}
              searchQuery={searchQuery}
              onOpenInvoice={(b) => setActiveInvoiceBooking(b)}
            />
          )}

          {/* TAB 4: Fleet & Asset Inventory (ZERO ALERTS) */}
          {activeTab === "fleet" && (
            <AdminFleetView
              cars={cars}
              searchQuery={searchQuery}
              onAddCar={() => setEditingCar("new")}
              onEditCar={(c) => setEditingCar(c)}
              onDeleteCar={handleDeleteCar}
              onUpdateStatus={handleUpdateCarStatus}
            />
          )}

          {/* TAB 5: Walk-In Counter Dispatch (ZERO ALERTS) */}
          {activeTab === "walkin" && (
            <AdminWalkinView
              availableCars={availableCars}
              onSubmitWalkin={handleCreateWalkin}
            />
          )}

          {/* TAB 6: Privileges & Coupon Registry (ZERO ALERTS) */}
          {activeTab === "promos" && (
            <AdminPromosView
              promos={promos}
              onCreatePromo={handleCreatePromo}
              onTogglePromo={handleTogglePromo}
              onDeletePromo={handleDeletePromo}
            />
          )}

          {/* TAB 7: Customers & Verified Drivers CRM (ZERO ALERTS) */}
          {activeTab === "crm" && (
            <AdminCrmView
              customers={adminCustomers}
              bookings={bookings}
              searchQuery={searchQuery}
            />
          )}

          {/* TAB 8: Vehicle Telemetry & Maintenance Audit (ZERO ALERTS) */}
          {activeTab === "maintenance" && (
            <AdminMaintenanceView
              logs={maintenanceLogs}
              cars={cars}
              onCreateLog={handleCreateMaintenanceLog}
            />
          )}

          {/* TAB 9: Studio Settings & Assistance (ZERO ALERTS) */}
          {activeTab === "settings" && (
            <AdminSettingsView
              onExitAdmin={onExitAdmin}
              onLogoutAdmin={onLogoutAdmin}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* --- Contextual Modals --- */}

      {/* 1. Key Handover Modal */}
      {activeGiveKeysBooking && (
        <AdminKeyHandoverModal
          booking={activeGiveKeysBooking}
          car={cars.find((c) => c.id === activeGiveKeysBooking.matchedCarId)}
          onConfirm={handleConfirmGiveKeys}
          onClose={() => setActiveGiveKeysBooking(null)}
        />
      )}

      {/* 2. Return Inspection Modal */}
      {activeReturnBooking && (
        <AdminReturnModal
          booking={activeReturnBooking}
          car={cars.find((c) => c.id === activeReturnBooking.matchedCarId)}
          onConfirm={handleConfirmReturn}
          onClose={() => setActiveReturnBooking(null)}
        />
      )}

      {/* 3. Car Add / Edit Modal */}
      {editingCar && (
        <AdminCarModal
          car={editingCar === "new" ? null : editingCar}
          onSave={handleSaveCar}
          onClose={() => setEditingCar(null)}
        />
      )}

      {/* 4. Invoice Viewer Modal */}
      {activeInvoiceBooking && (
        <InvoiceModal
          booking={activeInvoiceBooking}
          car={cars.find((c) => c.id === activeInvoiceBooking.matchedCarId)}
          onClose={() => setActiveInvoiceBooking(null)}
        />
      )}
    </div>
  )
}
