import React, { useState, useEffect } from "react"
import type {
  ViewMode,
  Car,
  BookingState,
  FilterState,
  VehicleType,
  CustomerInfo,
  DriverInfo,
  PaymentInfo,
  BookingRecord,
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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>("home")
  const [authInitialTab, setAuthInitialTab] = useState<"customer" | "admin">("customer")
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
  const [showDevNav, setShowDevNav] = useState(false)

  // Customer Authentication Profile State
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null)

  // Dynamic Fleet State (synced with SQLite Backend)
  const [cars, setCars] = useState<Car[]>(CARS)

  // Dynamic Bookings State (for car mating / allocation)
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS)

  // Admin Authentication State (Password 0709)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  // Booking parameters matching reference design
  const [bookingState, setBookingState] = useState<BookingState>({
    carId: "toyota-camry",
    pickupLocation: "Miami International Airport (MIA)",
    pickupDate: "Mar 15, 2026",
    pickupTime: "10:00 AM",
    returnLocation: "Miami International Airport (MIA)",
    returnDate: "Mar 18, 2026",
    returnTime: "10:00 AM",
    rentalDurationDays: 3,
    protectionPlan: true,
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

  // Sync with Backend SQLite on initial application mount
  useEffect(() => {
    async function initData() {
      try {
        const isAuth = await api.verifyAdminSession()
        setIsAdminAuthenticated(isAuth)

        // Load customer session if present
        const customerProfile = await api.getCustomerProfile().catch(() => null)
        if (customerProfile) {
          setCurrentUser(customerProfile)
        }

        const [remoteCars, remoteBookings] = await Promise.all([
          api.getCars().catch(() => null),
          api.getBookings().catch(() => null),
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
    // Show confirmation modal to customer
    setConfirmedBooking({
      bookingId: details.bookingId,
      car: activeCar,
      customer: details.customer,
      totalAmount: details.totalAmount,
    })

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
      createdAt: "Just now",
      userId: currentUser?.id,
    }

    // Optimistic state update
    setBookings((prev) => [newRecordPayload, ...prev])
    setCars((prev) =>
      prev.map((c) => (c.id === activeCar.id ? { ...c, status: "Rented" } : c)),
    )

    // Dynamic backend sync into SQLite
    try {
      await api.createBooking(newRecordPayload)
      await api.updateCarStatus(activeCar.id, "Rented").catch(() => {})
      const freshCars = await api.getCars().catch(() => null)
      if (freshCars) setCars(freshCars)
    } catch (e) {
      console.warn("Booking backend persistence:", e)
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
            onQuickBook={(carId) => {
              setSelectedCarId(carId)
              setBookingState((prev) => ({ ...prev, carId }))
              setCurrentView("checkout")
            }}
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
            onQuickBook={(carId) => {
              setSelectedCarId(carId)
              setBookingState((prev) => ({ ...prev, carId }))
              setCurrentView("checkout")
            }}
          />
        )}

        {currentView === "compare" && (
          <CompareView
            cars={cars}
            compareIds={compareIds}
            setCompareIds={setCompareIds}
            onSelectCar={handleSelectCar}
            onQuickBook={(carId) => {
              setSelectedCarId(carId)
              setBookingState((prev) => ({ ...prev, carId }))
              setCurrentView("checkout")
            }}
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
            onProceedToBooking={() => setCurrentView("checkout")}
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

      {/* Collapsible portal switcher on bottom-left (hidden in Admin & Auth view) */}
      {currentView !== "admin" && currentView !== "auth" && (
        <aside
          aria-label="Screen Flow Preview"
          className="fixed bottom-5 left-5 z-40 transition-all duration-300"
        >
          {showDevNav ? (
            <div className="bg-[#17191C]/95 text-white backdrop-blur-md rounded-2xl shadow-2xl p-2 flex items-center gap-1.5 text-xs border border-white/10 animate-fade-in max-w-[calc(100vw-2.5rem)] overflow-x-auto no-scrollbar">
              <span className="text-gray-400 font-semibold px-2">Views:</span>
              <button
                onClick={() => setCurrentView("home")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "home"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                1. Home
              </button>
              <button
                onClick={() => setCurrentView("listing")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "listing"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                2. Fleet
              </button>
              <button
                onClick={() => setCurrentView("detail")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "detail"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                3. Details
              </button>
              <button
                onClick={() => setCurrentView("checkout")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "checkout"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                4. Checkout
              </button>
              <button
                onClick={() => setCurrentView("my-bookings")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "my-bookings"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                5. My Trips
              </button>
              <button
                onClick={() => setCurrentView("compare")}
                className={`px-2.5 py-1.5 rounded-xl transition-colors font-medium ${
                  currentView === "compare"
                    ? "bg-[#F97316] text-white font-bold"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                6. Compare
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => handleNavigate("admin")}
                className="px-3 py-1.5 rounded-xl transition-colors font-bold flex items-center gap-1 bg-orange-500/20 text-[#F97316] hover:bg-orange-500/30"
              >
                ⚙️ Admin Panel
              </button>
              <button
                onClick={() => setShowDevNav(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg ml-1 hover:bg-white/10"
                title="Close Preview Drawer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDevNav(true)}
              className="bg-[#17191C]/85 hover:bg-[#17191C] text-gray-300 hover:text-white backdrop-blur-md rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold border border-white/10 transition-all opacity-70 hover:opacity-100"
            >
              <span>⚡ Portal Switcher</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            </button>
          )}
        </aside>
      )}
    </div>
  )
}
