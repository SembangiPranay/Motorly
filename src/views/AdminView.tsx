import React, { useState, useEffect, useMemo } from "react"
import type { BookingRecord, BookingStatus, Car, CarStatus } from "../types"
import { api } from "../services/api"

import ElderlyTasksView from "./admin/ElderlyTasksView"
import ElderlyFleetView from "./admin/ElderlyFleetView"
import ElderlySettingsView from "./admin/ElderlySettingsView"
import ElderlyKeyHandoverModal from "./admin/ElderlyKeyHandoverModal"
import ElderlyReturnModal from "./admin/ElderlyReturnModal"
import ElderlyWalkinModal from "./admin/ElderlyWalkinModal"
import ElderlyCarModal from "./admin/ElderlyCarModal"
import InvoiceModal from "../components/InvoiceModal"

import {
  CarIcon,
  PhoneIcon,
  LogOutIcon,
  CheckIcon,
  SettingsIcon,
  ClockIcon,
} from "../components/Icons"

export interface AdminViewProps {
  cars: Car[]
  setCars: React.Dispatch<React.SetStateAction<Car[]>>
  bookings: BookingRecord[]
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>
  onExitAdmin: () => void
  onLogoutAdmin?: () => void
  targetBookingId?: string
}

type AdminTab = "tasks" | "fleet" | "settings"

export default function AdminView({
  cars,
  setCars,
  bookings,
  setBookings,
  onExitAdmin,
  onLogoutAdmin,
  targetBookingId,
}: AdminViewProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>("tasks")

  // Modals state
  const [activeGiveKeysBooking, setActiveGiveKeysBooking] = useState<BookingRecord | null>(null)
  const [activeReturnBooking, setActiveReturnBooking] = useState<BookingRecord | null>(null)
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState<boolean>(false)
  const [editingCar, setEditingCar] = useState<Car | null | "new">(null)
  const [activeInvoiceBooking, setActiveInvoiceBooking] = useState<BookingRecord | null>(null)

  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 4500)
  }

  // Initial data refresh from backend
  useEffect(() => {
    let mounted = true
    async function refreshData() {
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
        console.warn("[AdminView] Initial refresh error:", err)
      }
    }
    refreshData()
    return () => {
      mounted = false
    }
  }, [setBookings, setCars])

  // Count pending actions for badge (safe case-insensitive)
  const pendingActionsCount = useMemo(() => {
    return bookings.filter((b) => {
      const s = String(b.status || "").toLowerCase()
      return (
        s.includes("pending") ||
        s.includes("advance") ||
        s.includes("assigned") ||
        s.includes("approved") ||
        s.includes("deposit") ||
        s.includes("confirmed") ||
        s.includes("checked out") ||
        s.includes("checked_out") ||
        s.includes("active")
      )
    }).length
  }, [bookings])

  // Available cars for walk-ins
  const availableCars = useMemo(() => {
    return cars.filter(
      (c) => !c.status || c.status.toLowerCase() === "available"
    )
  }, [cars])

  // --- Operational Handlers ---

  // 1. Approve Booking
  const handleApproveBooking = async (id: string) => {
    try {
      await api.approveBooking(id)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: "Assigned" as BookingStatus, approvedByAdmin: true }
            : b
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
        prev.map((b) =>
          b.id === id ? { ...b, status: "Cancelled" as BookingStatus } : b
        )
      )
      showToast("Booking has been declined and cancelled.")
    } catch (err: any) {
      alert("Failed to decline booking: " + (err?.message || "Unknown error"))
    }
  }

  // 3. Hand over keys
  const handleConfirmGiveKeys = async (odometerOut: number) => {
    if (!activeGiveKeysBooking) return
    const bookingId = activeGiveKeysBooking.id
    const carId = activeGiveKeysBooking.matchedCarId

    await api.handoverKeys(bookingId, {
      odometerOut,
      fuelOut: "Full",
      exteriorClean: true,
      tiresInspected: true,
      staffSign: "Garage Manager",
    })

    // Update booking state
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

    // Update car status to rented
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

  // 4. Complete return
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
      staffSign: "Garage Manager",
    })

    // Update booking state
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

    // Release car back to available or maintenance
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
        ? "Car returned and marked for cleaning/repairs."
        : "Car returned successfully! Ready on the garage floor for next rental."
    )
  }

  // 5. Create Walk-In Booking
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
      notes: "Walk-in counter customer",
    })

    // Prepend or refresh bookings
    if (result && result.booking) {
      setBookings((prev) => [result.booking, ...prev])
    }

    // Mark car rented
    setCars((prev) =>
      prev.map((c) => (c.id === data.carId ? { ...c, status: "Rented" as CarStatus } : c))
    )

    setIsWalkinModalOpen(false)
    showToast(`Walk-in rental registered for ${data.customerName}!`)
  }

  // 6. Save or Add Car
  const handleSaveCar = async (carData: Partial<Car>) => {
    if (editingCar === "new") {
      const created = await api.createCar(carData)
      setCars((prev) => [created, ...prev])
      showToast(`Added "${created.name}" to your garage fleet!`)
    } else if (editingCar && typeof editingCar === "object") {
      const updated = await api.updateCar(editingCar.id, carData)
      setCars((prev) =>
        prev.map((c) => (c.id === editingCar.id ? { ...c, ...updated } : c))
      )
      showToast(`Updated "${updated.name}" details.`)
    }
    setEditingCar(null)
  }

  // 7. Delete Car
  const handleDeleteCar = async (id: string) => {
    await api.deleteCar(id)
    setCars((prev) => prev.filter((c) => c.id !== id))
    showToast("Vehicle removed from fleet.")
  }

  // 8. Update Car Status (Available <-> Maintenance)
  const handleUpdateCarStatus = async (id: string, status: CarStatus) => {
    await api.updateCarStatus(id, status)
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    showToast(
      status === "Available"
        ? "Car marked ready to rent."
        : "Car sent for cleaning/service."
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-stone-900 pb-20 antialiased font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-stone-900 text-white font-bold text-lg shadow-2xl border-2 border-stone-700 flex items-center gap-3 animate-fadeIn max-w-lg w-11/12"
        >
          <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ✓
          </span>
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white font-bold text-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Application Header */}
      <header className="bg-white border-b-2 border-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Garage Badge */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow">
              <CarIcon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-stone-900 tracking-tight">
                  MOTORLY
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 text-xs font-black uppercase tracking-wider">
                  Garage Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Console Active • Senior Mode</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Phone Help, Exit, Sign Out */}
          <div className="flex items-center gap-3">
            <a
              href="tel:5550199922"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-sm border border-emerald-200 transition"
              title="Call Human Support"
            >
              <PhoneIcon size={18} className="text-emerald-600" />
              <span>Help: (555) 019-9922</span>
            </a>

            <button
              type="button"
              onClick={onExitAdmin}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition"
            >
              View Public Website
            </button>

            {onLogoutAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Do you want to log out of the console?")) {
                    onLogoutAdmin()
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition flex items-center gap-1.5"
              >
                <LogOutIcon size={16} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* The 3 Primary Senior-Friendly Navigation Hub Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0">
          <nav
            aria-label="Admin Navigation"
            className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar border-t border-stone-100 pt-3"
          >
            {/* Tab 1: Today's Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={`pb-4 px-4 sm:px-6 font-black text-lg sm:text-xl transition flex items-center gap-3 border-b-4 -mb-[2px] whitespace-nowrap min-h-[52px] ${
                activeTab === "tasks"
                  ? "border-emerald-600 text-emerald-950 font-black"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              <span className="text-2xl">🟢</span>
              <span>1. Today's Tasks</span>
              {pendingActionsCount > 0 && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeTab === "tasks"
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {pendingActionsCount}
                </span>
              )}
            </button>

            {/* Tab 2: My Fleet */}
            <button
              type="button"
              onClick={() => setActiveTab("fleet")}
              className={`pb-4 px-4 sm:px-6 font-black text-lg sm:text-xl transition flex items-center gap-3 border-b-4 -mb-[2px] whitespace-nowrap min-h-[52px] ${
                activeTab === "fleet"
                  ? "border-blue-600 text-blue-950 font-black"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              <span className="text-2xl">🚗</span>
              <span>2. My Cars ({cars.length})</span>
            </button>

            {/* Tab 3: Settings & Help */}
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`pb-4 px-4 sm:px-6 font-black text-lg sm:text-xl transition flex items-center gap-3 border-b-4 -mb-[2px] whitespace-nowrap min-h-[52px] ${
                activeTab === "settings"
                  ? "border-stone-900 text-stone-950 font-black"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              <span className="text-2xl">⚙️</span>
              <span>3. Settings & Help</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "tasks" && (
          <ElderlyTasksView
            bookings={bookings}
            cars={cars}
            onApprove={handleApproveBooking}
            onDecline={handleDeclineBooking}
            onOpenGiveKeys={(booking) => setActiveGiveKeysBooking(booking)}
            onOpenReturn={(booking) => setActiveReturnBooking(booking)}
            onOpenWalkin={() => setIsWalkinModalOpen(true)}
            onOpenInvoice={(booking) => setActiveInvoiceBooking(booking)}
            targetBookingId={targetBookingId}
          />
        )}

        {activeTab === "fleet" && (
          <ElderlyFleetView
            cars={cars}
            onAddCar={() => setEditingCar("new")}
            onEditCar={(car) => setEditingCar(car)}
            onDeleteCar={handleDeleteCar}
            onUpdateStatus={handleUpdateCarStatus}
          />
        )}

        {activeTab === "settings" && (
          <ElderlySettingsView
            onExitAdmin={onExitAdmin}
            onLogoutAdmin={onLogoutAdmin}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* --- Simple Guided Modals --- */}

      {/* 1. Key Handover Modal */}
      {activeGiveKeysBooking && (
        <ElderlyKeyHandoverModal
          booking={activeGiveKeysBooking}
          car={cars.find((c) => c.id === activeGiveKeysBooking.matchedCarId)}
          onConfirm={handleConfirmGiveKeys}
          onClose={() => setActiveGiveKeysBooking(null)}
        />
      )}

      {/* 2. Return Inspection Modal */}
      {activeReturnBooking && (
        <ElderlyReturnModal
          booking={activeReturnBooking}
          car={cars.find((c) => c.id === activeReturnBooking.matchedCarId)}
          onConfirm={handleConfirmReturn}
          onClose={() => setActiveReturnBooking(null)}
        />
      )}

      {/* 3. Walk-In Customer Modal */}
      {isWalkinModalOpen && (
        <ElderlyWalkinModal
          availableCars={availableCars}
          onConfirm={handleCreateWalkin}
          onClose={() => setIsWalkinModalOpen(false)}
        />
      )}

      {/* 4. Add / Edit Car Modal */}
      {editingCar && (
        <ElderlyCarModal
          car={editingCar === "new" ? null : editingCar}
          onSave={handleSaveCar}
          onClose={() => setEditingCar(null)}
        />
      )}

      {/* 5. Invoice Viewer Modal */}
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
