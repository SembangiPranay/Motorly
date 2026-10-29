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
import AdminLoginGate from "./components/AdminLoginGate"
import MyBookingsView from "./views/MyBookingsView"
import CompareView from "./views/CompareView"
import AuthView from "./views/AuthView"
import AboutView from "./views/AboutView"
import ContactView from "./views/ContactView"
import CustomerSidebar from "./components/CustomerSidebar" 

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

  // Current View State with persistent reload restore + dedicated /admin URL routing
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname.toLowerCase()
        if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin")) {
          return "admin"
        }
        const params = new URLSearchParams(window.location.search)
        if (params.get("view") === "admin" || params.get("bookingId")) {
          return "admin"
        }
      }
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
        "about",
        "contact",
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

  // Direct Deep Link Support (e.g. ?view=admin&bookingId=MTR-XXXXXX)
  const [targetBookingId, setTargetBookingId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get("bookingId")
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname.toLowerCase()
        const params = new URLSearchParams(window.location.search)
        const bId = params.get("bookingId")
        if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin")) {
          setCurrentView("admin")
          if (bId) setTargetBookingId(bId)
        } else if (bId) {
          setTargetBookingId(bId)
          setCurrentView("admin")
        } else if (params.get("view") === "admin") {
          setCurrentView("admin")
        }
      }
    } catch {}
  }, [])

  // Listen for browser forward/back buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return
      const pathname = window.location.pathname.toLowerCase()
      if (pathname === "/admin" || pathname.startsWith("/admin")) {
        setCurrentView("admin")
        return
      }
      const params = new URLSearchParams(window.location.search)
      const v = (params.get("view") as ViewMode) || "home"
      setCurrentView(v)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const [authInitialTab, setAuthInitialTab] = useState<"customer" | "admin">(
    "customer",
  )
  const [authReturnView, setAuthReturnView] = useState<ViewMode>("home")
  const [selectedCarId, setSelectedCarId] = useState<string>(() => {
    return localStorage.getItem("motorly_selected_car_id") || ""
  })
  const [favorites, setFavorites] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])

  // Dynamic Fleet State (strictly synced with database)
  const [cars, setCars] = useState<Car[]>([])

  // Dynamic Bookings State (strictly synced with database)
  const [bookings, setBookings] = useState<BookingRecord[]>([])

  // Immediately purge any stale client cache from older mock/demo sessions
  useEffect(() => {
    try {
      localStorage.removeItem("motorly_cached_cars")
      localStorage.removeItem("motorly_cached_bookings")
    } catch {}
  }, [])

  // Admin Authentication Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  // Booking parameters matching reference design with dynamic upcoming dates
  const [bookingState, setBookingState] = useState<BookingState>({
    carId: "",
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingId: string
    car: Car
    customer: CustomerInfo
    totalAmount: number
  } | null>(null)

  useEffect(() => {
    ;(window as any).__setConfirmedBooking = setConfirmedBooking
    return () => {
      delete (window as any).__setConfirmedBooking
    }
  }, [])

  // Sync with Backend (Supabase PostgreSQL / SQLite fallback) on initial mount
  useEffect(() => {
    async function initData() {
      try {
        const isAuth = await api.verifyAdminSession().catch(() => false)
        if (isAuth) {
          setIsAdminAuthenticated(true)
        } else {
          // Token is missing, expired, or rejected: purge stale credentials
          localStorage.removeItem("motorly_admin_token")
          localStorage.removeItem("motorly_admin_user")
          setIsAdminAuthenticated(false)
        }

        // Load customer session if present
        const customerProfile = await api.getCustomerProfile().catch(() => null)
        if (customerProfile) {
          setCurrentUser(customerProfile)
        }

        const hasAdmin = api.hasAdminToken()
        const [remoteCars, remoteBookings] = await Promise.all([
          api.getCars().catch(() => null),
          hasAdmin
            ? api.getBookings().catch(() => null)
            : Promise.resolve(null),
        ])

        if (Array.isArray(remoteCars)) {
          setCars(remoteCars)
          setIsBackendConnected(true)
        }
        if (Array.isArray(remoteBookings)) {
          setBookings(remoteBookings)
        }
      } catch (err) {
        console.warn("Backend dynamic load:", err)
      }
    }
    initData()
  }, [])

  // Handle 401 Unauthorized globally for admin and customer sessions
  useEffect(() => {
    const handleAdminUnauthorized = () => {
      setIsAdminAuthenticated(false)
      localStorage.removeItem("motorly_admin_token")
      localStorage.removeItem("motorly_admin_user")
      if (currentView === "admin") {
        setAuthInitialTab("admin")
        setAuthReturnView("admin")
        setCurrentView("auth")
      }
    }

    const handleCustomerUnauthorized = () => {
      setCurrentUser(null)
      localStorage.removeItem("motorly_customer_token")
      localStorage.removeItem("motorly_customer_user")
    }

    window.addEventListener(
      "motorly_admin_unauthorized",
      handleAdminUnauthorized,
    )
    window.addEventListener(
      "motorly_customer_unauthorized",
      handleCustomerUnauthorized,
    )
    return () => {
      window.removeEventListener(
        "motorly_admin_unauthorized",
        handleAdminUnauthorized,
      )
      window.removeEventListener(
        "motorly_customer_unauthorized",
        handleCustomerUnauthorized,
      )
    }
  }, [currentView])

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
    localStorage.setItem("motorly_selected_car_id", carId)
    setSelectedCarId(carId)
    setBookingState((prev) => ({ ...prev, carId }))
    setCurrentView("detail")
  }

  const handleSelectCategory = (category: VehicleType | "All") => {
    if (category === "All") {
      setFilterState((prev) => ({
        ...prev,
        types: [],
      }))
    } else {
      setFilterState((prev) => ({
        ...prev,
        types: [category],
      }))
    }
    setCurrentView("listing")
  }

  const handleSelectDuration = (tier: "Hourly" | "Daily" | "Weekly" | "Monthly") => {
    if (tier === "Hourly") {
      setBookingState((prev) => ({
        ...prev,
        rentalPlan: "hourly",
        rentalDurationDays: 1,
        returnDate: prev.pickupDate,
      }))
    } else {
      const days = tier === "Daily" ? 3 : tier === "Weekly" ? 7 : 30
      const parsed = Date.parse(bookingState.pickupDate)
      let newReturnDate = bookingState.returnDate
      if (!isNaN(parsed)) {
        const next = new Date(parsed + days * 24 * 60 * 60 * 1000)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        newReturnDate = `${monthNames[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`
      }
      setBookingState((prev) => ({
        ...prev,
        rentalPlan: tier.toLowerCase() as BookingState["rentalPlan"],
        rentalDurationDays: days,
        returnDate: newReturnDate,
      }))
    }
  }

  // Enforce customer login for booking reservations
  const handleProceedToCheckout = (carId?: string) => {
    const targetId = carId || selectedCarId
    if (targetId) {
      setSelectedCarId(targetId)
      setBookingState((prev) => ({ ...prev, carId: targetId }))
    }
    if (!currentUser) {
      setAuthReturnView("checkout")
      setCurrentView("auth")
    } else {
      setCurrentView("checkout")
    }
  }

  // Guard navigation to Admin view with dedicated /admin routing
  const handleNavigate = (view: ViewMode) => {
    if (view === "admin") {
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", "/admin")
      }
      setCurrentView("admin")
    } else if (view === "auth") {
      setAuthReturnView(currentView !== "auth" ? currentView : "home")
      setCurrentView("auth")
    } else {
      if (typeof window !== "undefined") {
        if (view === "home") {
          window.history.pushState(null, "", "/")
        } else {
          window.history.pushState(null, "", `/?view=${view}`)
        }
      }
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
      setAuthReturnView("checkout")
      setCurrentView("auth")
      return
    }

    if (!activeCar) {
      alert("No vehicle selected. Please select a vehicle from our fleet catalog.")
      setCurrentView("listing")
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
      pickupDate: bookingState.pickupTime
        ? `${bookingState.pickupDate} ${bookingState.pickupTime}`
        : bookingState.pickupDate,
      returnDate: bookingState.returnTime
        ? `${bookingState.returnDate} ${bookingState.returnTime}`
        : bookingState.returnDate,
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
    <div
      className={`w-full max-w-full overflow-x-hidden min-h-screen flex flex-col bg-[#FAF7F2] text-[#17191C] ${
        currentView !== "admin" && currentView !== "auth" ? "lg:pl-60" : ""
      }`}
    >
      {/* Desktop Persistent Minimal Left Sidebar & Mobile Drawer (Portals Only) */}
      {currentView !== "admin" && currentView !== "auth" && (
        <CustomerSidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogoutCustomer={() => {
            api.logoutCustomer()
            setCurrentUser(null)
          }}
          compareCount={compareIds.length}
          activeBookingsCount={
            bookings.filter(
              (b) => b.status === "Pending Assignment" || b.status === "Assigned" || b.status === "Checked Out",
            ).length
          }
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Header (hidden in dedicated full-screen admin & auth mode for cleaner layout) */}
      {currentView !== "admin" && currentView !== "auth" && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          compareCount={compareIds.length}
          isAdminAuthenticated={isAdminAuthenticated}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
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

        {/* Dedicated 1-Person Boutique Garage About Page */}
        {currentView === "about" && (
          <AboutView onNavigate={handleNavigate} />
        )}

        {/* Dedicated Direct Garage Owner Contact & Inquiry Page */}
        {currentView === "contact" && (
          <ContactView onNavigate={handleNavigate} />
        )}

        {/* Dedicated Modern JWT Customer Authentication Page */}
        {currentView === "auth" && (
          <AuthView
            initialMode="signin"
            onSuccess={(_role, user) => {
              if (user) setCurrentUser(user)
              setCurrentView(
                authReturnView === "admin"
                  ? "my-bookings"
                  : authReturnView || "my-bookings",
              )
            }}
            onNavigateHome={() => setCurrentView("home")}
            onNavigateListing={() => setCurrentView("listing")}
          />
        )}

        {/* Dynamic Admin Panel View (Only accessible when verified authenticated) */}
        {currentView === "admin" && isAdminAuthenticated && (
          <AdminView
            cars={cars}
            setCars={setCars}
            bookings={bookings}
            setBookings={setBookings}
            targetBookingId={targetBookingId || undefined}
            onExitAdmin={() => {
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "/")
              }
              setCurrentView("home")
            }}
            onLogoutAdmin={() => {
              api.logoutAdmin()
              setIsAdminAuthenticated(false)
              localStorage.setItem("motorly_current_view", "home")
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "/")
              }
              setCurrentView("home")
            }}
          />
        )}

        {/* Isolated Secure Executive Staff Gate */}
        {currentView === "admin" && !isAdminAuthenticated && (
          <AdminLoginGate
            onSuccess={() => {
              setIsAdminAuthenticated(true)
              api.getBookings().then((b) => b && setBookings(b)).catch(() => {})
            }}
            onNavigateHome={() => setCurrentView("home")}
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
          onNavigateMyBookings={() => {
            setConfirmedBooking(null)
            setCurrentView("my-bookings")
          }}
        />
      )}

      {/* Admin Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false)
          if (currentView === "admin") {
            setCurrentView("home")
          }
        }}
        onSuccess={() => {
          setIsAdminAuthenticated(true)
          setIsAdminModalOpen(false)
          setCurrentView("admin")
          api.getBookings().then((b) => b && setBookings(b)).catch(() => {})
        }}
      />
    </div>
  )
}
