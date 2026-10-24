import React, { useState, useEffect } from "react"
import type {
  Car,
  BookingRecord,
  BookingState,
  CustomerInfo,
  DriverInfo,
  PaymentInfo,
  FilterState,
  VehicleType,
  ViewMode,
  CustomerUser,
} from "./types"
import { CARS } from "./data/cars"
import { INITIAL_BOOKINGS } from "./data/initialBookings"
import { api } from "./services/api"
import Header from "./components/Header"
import Footer from "./components/Footer"
import HomeView from "./views/HomeView"
import ListingView from "./views/ListingView"
import CarDetailView from "./views/CarDetailView"
import CheckoutView from "./views/CheckoutView"
import ConfirmationModal from "./views/ConfirmationModal"
import AdminView from "./views/AdminView"
import AdminLoginModal from "./components/AdminLoginModal"
import MyBookingsView from "./views/MyBookingsView"
import CompareView from "./views/CompareView"
import AuthView from "./views/AuthView"

function getUpcomingFormattedDate(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function App() {
  // Customer Authentication Profile State with localStorage persistence
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem("motorly_customer_user")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Admin Authentication State with localStorage token persistence
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(
    () => {
      return Boolean(localStorage.getItem("motorly_admin_token"))
    },
  )

  // Current View State with persistent reload restore
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(
        "motorly_current_view",
      ) as ViewMode | null
      const hasAdminToken = Boolean(localStorage.getItem("motorly_admin_token"))
      if (saved === "admin" && !hasAdminToken) return "home"
      const validViews: ViewMode[] = [
        "home",
        "listing",
        "detail",
        "checkout",
        "admin",
        "my-bookings",
        "compare",
        "auth",
      ]
      if (saved && validViews.includes(saved)) {
        return saved
      }
    } catch {}
    return "home"
  })

  // Persist currentView to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("motorly_current_view", currentView)
    } catch {}
  }, [currentView])

  const [authInitialTab, setAuthInitialTab] = useState<"customer" | "admin">(
    "customer",
  )
  const [authReturnView, setAuthReturnView] = useState<ViewMode>("home")
  const [selectedCarId, setSelectedCarId] = useState<string>("toyota-camry")
  const [favorites, setFavorites] = useState<string[]>([
    "toyota-camry",
    "bmw-3-series",
  ])
  const [compareIds, setCompareIds] = useState<string[]>([
    "toyota-camry",
    "bmw-3-series",
  ])

  // Dynamic Fleet State (synced with Supabase Backend)
  const [cars, setCars] = useState<Car[]>(CARS)

  // Dynamic Bookings State (for car mating / allocation)
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS)

  // Admin Authentication Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  // Booking parameters matching reference design with dynamic upcoming dates
  const [bookingState, setBookingState] = useState<BookingState>({
    carId: "toyota-camry",
    pickupLocation: "Main Garage Facility",
    pickupDate: getUpcomingFormattedDate(2),
    pickupTime: "10:00 AM",
    returnLocation: "Main Garage Facility",
    returnDate: getUpcomingFormattedDate(5),
    returnTime: "10:00 AM",
    rentalDurationDays: 3,
    protectionPlan: false,
    rentalPlan: "daily",
  })

  // Filters for vehicle listing
  const [filterState, setFilterState] = useState<FilterState>({
    types: [],
    maxPrice: 500,
    transmissions: [],
    fuelTypes: [],
    seats: [],
    features: [],
    sortBy: "recommended",
  })

  // Confirmed booking modal state
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingId: string
    car: Car
    customer: CustomerInfo
    totalAmount: number
  } | null>(null)

  // Sync with Backend (Supabase PostgreSQL / SQLite fallback) on initial mount
  useEffect(() => {
    async function initData() {
      try {
        const isAuth = await api.verifyAdminSession().catch(() => false)
        if (isAuth) {
          setIsAdminAuthenticated(true)
        } else if (localStorage.getItem("motorly_admin_token")) {
          // Keep optimistic true if token exists
          setIsAdminAuthenticated(true)
        }

        // Load customer session if present
        const customerProfile = await api.getCustomerProfile().catch(() => null)
        if (customerProfile) {
          setCurrentUser(customerProfile)
        }

        const hasAdmin = api.hasAdminToken()
        const [remoteCars, remoteBookings] = await Promise.all([
          api.getCars().catch(() => null),
          hasAdmin ? api.getBookings().catch(() => null) : Promise.resolve(null),
        ])

        if (remoteCars && remoteCars.length > 0) {
          setCars(remoteCars)
          setIsBackendConnected(true)
        }
        if (remoteBookings && remoteBookings.length > 0) {
          setBookings(remoteBookings)
        }
      } catch (err) {
        console.warn("Backend dynamic load:", err)
      }
    }
    initData()
  }, [])

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentView, selectedCarId])

  const activeCar = cars.find((c) => c.id === selectedCarId) || cars[0]

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId)
    setBookingState((prev) => ({ ...prev, carId }))
    setCurrentView("detail")
  }

  const handleSelectCategory = (category: VehicleType) => {
    setFilterState((prev) => ({
      ...prev,
      types: [category],
    }))
    setCurrentView("listing")
  }

  // Enforce customer login for booking reservations
  const handleProceedToCheckout = (carId?: string) => {
    if (carId) {
      setSelectedCarId(carId)
      setBookingState((prev) => ({ ...prev, carId }))
    }
    if (!currentUser) {
      setAuthInitialTab("customer")
      setAuthReturnView("checkout")
      setCurrentView("auth")
    } else {
      setCurrentView("checkout")
    }
  }

  // Guard navigation to Admin view with backend password authentication
  const handleNavigate = (view: ViewMode) => {
    if (view === "admin") {
      if (isAdminAuthenticated) {
        setCurrentView("admin")
      } else {
        setAuthInitialTab("admin")
        setAuthReturnView("admin")
        setCurrentView("auth")
      }
    } else if (view === "auth") {
      setAuthInitialTab("customer")
      setAuthReturnView(currentView !== "auth" ? currentView : "home")
      setCurrentView("auth")
    } else {
      setCurrentView(view)
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleConfirmBooking = async (details: {
    customer: CustomerInfo
    driver: DriverInfo
    payment: PaymentInfo
    totalAmount: number
    bookingId: string
  }) => {
    if (!currentUser) {
      setAuthInitialTab("customer")
      setAuthReturnView("checkout")
      setCurrentView("auth")
      return
    }

    const garageLoc =
      activeCar.garageAddress ||
      activeCar.garageName ||
      activeCar.location ||
      "MOTORLY Central Hub"

    const newRecordPayload = {
      id: details.bookingId,
      customer: details.customer,
      driver: details.driver,
      pickupLocation: garageLoc,
      returnLocation: garageLoc,
      pickupDate: bookingState.pickupDate,
      returnDate: bookingState.returnDate,
      requestedCategory: activeCar.type,
      matchedCarId: activeCar.id,
      status: "Assigned" as const,
      totalAmount: details.totalAmount,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id,
    }

    // Dynamic backend sync into Supabase PostgreSQL
    try {
      const created = await api.createBooking(newRecordPayload)
      // Successfully saved in Supabase PostgreSQL!
      setBookings((prev) => [
        created,
        ...prev.filter((b) => b.id !== created.id),
      ])
      const freshCars = await api.getCars().catch(() => null)
      if (freshCars) setCars(freshCars)

      // Show confirmation modal to customer only after verified persistence
      setConfirmedBooking({
        bookingId: created.id,
        car: activeCar,
        customer: details.customer,
        totalAmount: details.totalAmount,
      })
    } catch (e: any) {
      console.error("Booking backend persistence error:", e)
      alert(
        `Reservation Failed: ${
          e.message ||
          "Could not reserve vehicle. Please select alternative dates or car."
        }`,
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#17191C]">
      {/* Header (hidden in dedicated full-screen admin & auth mode for cleaner layout) */}
      {currentView !== "admin" && currentView !== "auth" && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          compareCount={compareIds.length}
          onLogoutCustomer={() => {
            api.logoutCustomer()
            setCurrentUser(null)
          }}
        />
      )}

      {/* Main Flow Views */}
      <main className="flex-1">
        {currentView === "home" && (
          <HomeView
            cars={cars}
            bookingState={bookingState}
            setBookingState={setBookingState}
            onSearch={() => setCurrentView("listing")}
            onSelectCategory={handleSelectCategory}
            onSelectCar={handleSelectCar}
            onQuickBook={handleProceedToCheckout}
            onNavigateCompare={() => setCurrentView("compare")}
          />
        )}

        {currentView === "listing" && (
          <ListingView
            cars={cars}
            bookingState={bookingState}
            setBookingState={setBookingState}
            filterState={filterState}
            setFilterState={setFilterState}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            compareIds={compareIds}
            setCompareIds={setCompareIds}
            onNavigateCompare={() => setCurrentView("compare")}
            onSelectCar={handleSelectCar}
            onQuickBook={handleProceedToCheckout}
          />
        )}

        {currentView === "compare" && (
          <CompareView
            cars={cars}
            compareIds={compareIds}
            setCompareIds={setCompareIds}
            onSelectCar={handleSelectCar}
            onQuickBook={handleProceedToCheckout}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {currentView === "detail" && (
          <CarDetailView
            car={activeCar}
            allCars={cars}
            bookingState={bookingState}
            setBookingState={setBookingState}
            onProceedToBooking={() => handleProceedToCheckout()}
            onSelectSimilarCar={handleSelectCar}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {currentView === "checkout" && (
          <CheckoutView
            car={activeCar}
            bookingState={bookingState}
            setBookingState={setBookingState}
            currentUser={currentUser}
            onNavigateAuth={(returnView) => {
              setAuthInitialTab("customer")
              setAuthReturnView(returnView || "checkout")
              setCurrentView("auth")
            }}
            onConfirmBooking={handleConfirmBooking}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {currentView === "my-bookings" && (
          <MyBookingsView
            cars={cars}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            allBookings={bookings}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {/* Dedicated Modern JWT Authentication Page */}
        {currentView === "auth" && (
          <AuthView
            initialTab={authInitialTab}
            onSuccess={(role, user) => {
              if (role === "admin") {
                setIsAdminAuthenticated(true)
                setCurrentView("admin")
              } else {
                if (user) setCurrentUser(user)
                setCurrentView(
                  authReturnView === "admin"
                    ? "my-bookings"
                    : authReturnView || "my-bookings",
                )
              }
            }}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {/* Dynamic Admin Panel View */}
        {currentView === "admin" && (
          <AdminView
            cars={cars}
            setCars={setCars}
            bookings={bookings}
            setBookings={setBookings}
            onExitAdmin={() => setCurrentView("home")}
            onLogoutAdmin={() => {
              api.logoutAdmin()
              setIsAdminAuthenticated(false)
              localStorage.setItem("motorly_current_view", "home")
              setCurrentView("home")
            }}
          />
        )}
      </main>

      {/* Footer (only on customer storefront views) */}
      {currentView !== "admin" && currentView !== "auth" && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* Booking Confirmation Modal */}
      {confirmedBooking && (
        <ConfirmationModal
          bookingId={confirmedBooking.bookingId}
          car={confirmedBooking.car}
          bookingState={bookingState}
          customer={confirmedBooking.customer}
          totalAmount={confirmedBooking.totalAmount}
          onClose={() => setConfirmedBooking(null)}
          onNavigateHome={() => {
            setConfirmedBooking(null)
            setCurrentView("home")
          }}
          onNavigateListing={() => {
            setConfirmedBooking(null)
            setCurrentView("listing")
          }}
          onNavigateAdmin={() => {
            setConfirmedBooking(null)
            handleNavigate("admin")
          }}
          onNavigateMyBookings={() => {
            setConfirmedBooking(null)
            setCurrentView("my-bookings")
          }}
        />
      )}

      {/* Admin Authentication Modal (Password: 0709) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true)
          setIsAdminModalOpen(false)
          setCurrentView("admin")
        }}
      />
    </div>
  )
}
