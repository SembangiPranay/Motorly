import { Router } from "express"
import { getActiveOperatingHub } from "../hub.ts"
import { db } from "../db.ts"
import { requireAdmin } from "../auth.ts"
import { formatCarRow, safeJsonStringify } from "../serializers.ts"
import { parseDateRangeStrict, datesOverlap, findVehicleBookingConflict } from "../booking-rules.ts"
import type { Car } from "../../src/types.ts"

type FleetCar = NonNullable<ReturnType<typeof formatCarRow>> &
  Pick<Car, "isAvailableForDates" | "conflict" | "statusForDates">

const router = Router()

// GET all cars with optional filters
router.get("/cars", async (req, res) => {
  const { status, type, search, maxPrice, pickupDate, returnDate } = req.query

  let query = "SELECT * FROM vehicles WHERE 1=1"
  const params: any[] = []

  if (status && status !== "all") {
    query += " AND status = ?"
    params.push(status)
  }

  if (type && type !== "all") {
    query += " AND type = ?"
    params.push(type)
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    query += " AND price_per_day <= ?"
    params.push(Number(maxPrice))
  }

  if (search) {
    query += " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(plate_number) LIKE ?)"
    const wildcard = `%${String(search).trim().toLowerCase()}%`
    params.push(wildcard, wildcard, wildcard)
  }

  query += " ORDER BY is_popular DESC, price_per_day ASC"

  const rows = await db.prepare(query).all(...params)
  const activeHub = await getActiveOperatingHub()
  const cars: FleetCar[] = rows
    .map((r) => formatCarRow(r, activeHub.address, activeHub.lat, activeHub.lng))
    .filter((car) => car !== null)

  // Dynamically evaluate conflict/availability against requested dates with optimized single batch query
  if (pickupDate && returnDate) {
    const range = parseDateRangeStrict(String(pickupDate), String(returnDate))
    if (!range.valid) {
      // Do not falsely lock the fleet when dates cannot be strictly parsed or are malformed.
      // Default to real physical vehicle availability so customers can still view and select cars.
      for (const car of cars) {
        car.isAvailableForDates = car.status !== "Maintenance"
        car.conflict = null
        car.statusForDates = car.status
      }
    } else {
      try {
        // Optimized single batch query: fetch all active matched reservations in 1 fast query
        const activeBookings = await db
          .prepare(
            `
            SELECT id, customer_first_name, customer_last_name, pickup_date, return_date, status, matched_car_id
            FROM bookings
            WHERE matched_car_id IS NOT NULL
              AND status NOT IN ('Completed', 'Cancelled', 'Declined')
          `,
          )
          .all()

        // Map active bookings by vehicle ID in memory (O(B))
        const bookingsByCar = new Map<string, any[]>()
        for (const b of activeBookings) {
          if (!b.matched_car_id) continue
          const list = bookingsByCar.get(b.matched_car_id) || []
          list.push(b)
          bookingsByCar.set(b.matched_car_id, list)
        }

        // Evaluate in-memory in O(1) per vehicle
        for (const car of cars) {
          if (car.status === "Maintenance") {
            car.isAvailableForDates = false
            car.conflict = {
              conflictingBookingId: "MAINTENANCE",
              customerName: "Fleet Maintenance",
              pickupDate: "Active",
              returnDate: "Scheduled",
              status: "Maintenance",
            }
            car.statusForDates = "Maintenance"
            continue
          }

          const carBookings = bookingsByCar.get(car.id) || []
          const activeCheckedOut =
            car.status === "Rented"
              ? carBookings.find((b) => b.status === "Checked Out")
              : undefined

          if (activeCheckedOut) {
            car.isAvailableForDates = false
            car.conflict = {
              conflictingBookingId: "RENTED",
              customerName: "Active rental in progress",
              pickupDate: activeCheckedOut.pickup_date,
              returnDate: activeCheckedOut.return_date,
              status: "Checked Out",
              reason: "Vehicle is currently out on an active rental until returned.",
            }
            car.statusForDates = "Rented"
            continue
          }

          let conflict: any = null

          for (const b of carBookings) {
            const bRange = parseDateRangeStrict(b.pickup_date, b.return_date)
            const bStart = bRange.valid ? bRange.start : Date.parse(b.pickup_date)
            const bEnd = bRange.valid ? bRange.end : Date.parse(b.return_date)

            if (
              !isNaN(bStart) &&
              !isNaN(bEnd) &&
              datesOverlap(range.start, range.end, bStart, bEnd)
            ) {
              conflict = {
                conflictingBookingId: "RESERVED",
                customerName: "Existing reservation",
                pickupDate: b.pickup_date,
                returnDate: b.return_date,
                status: b.status,
              }
              break
            }
          }

          car.isAvailableForDates = !conflict
          car.conflict = conflict || null
          car.statusForDates = conflict ? "Reserved" : car.status
        }
      } catch (err: any) {
        console.error("[Safe Availability Batch Error]", err?.message)
        // Fail safely: if query fails, mark vehicles as unavailable to prevent overbooking
        for (const car of cars) {
          car.isAvailableForDates = false
          car.conflict = {
            conflictingBookingId: "DB_FAILSAFE",
            customerName: "System Guard",
            pickupDate: String(pickupDate),
            returnDate: String(returnDate),
            status: "Degraded Safe",
            reason: "Availability check degraded safely to prevent overbooking.",
          }
          car.statusForDates = "Unavailable"
        }
      }
    }
  }

  return res.json(cars)
})

// GET single car
router.get("/cars/:id", async (req, res) => {
  const row = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id)
  if (!row) {
    return res.status(404).json({ error: "Vehicle not found." })
  }
  const activeHub = await getActiveOperatingHub()
  return res.json(formatCarRow(row, activeHub.address, activeHub.lat, activeHub.lng))
})

// POST add new vehicle
router.post("/cars", requireAdmin, async (req, res) => {
  const car = req.body
  const newId =
    car.id ||
    (car.name || "vehicle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`

  const galleryJson = safeJsonStringify(
    car.gallery && car.gallery.length
      ? car.gallery
      : [
          car.image ||
            "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        ],
  )
  const featuresJson = safeJsonStringify(car.features || ["Bluetooth", "Apple CarPlay"])
  const activeHub = await getActiveOperatingHub()

  await db
    .prepare(
      `
    INSERT INTO vehicles (
      id, name, brand, model, year, type, price_per_day, price_per_hour, price_per_week, price_per_month,
      image, gallery, rating, reviews_count, seats, transmission, fuel_type,
      mileage, luggage, features, description, is_popular, status, plate_number, location, health_score,
      insurance_policy, insurance_provider, insurance_expiry, purchase_date, purchase_cost, current_odometer,
      garage_name, garage_address, garage_lat, garage_lng, garage_bay, vat_rate, security_deposit
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `,
    )
    .run(
      newId,
      car.name || "Custom Vehicle",
      car.brand || "Toyota",
      car.model || "Camry",
      Number(car.year) || 2024,
      car.type || "Sedan",
      Number(car.pricePerDay) || 50,
      Number(car.pricePerHour) || 7,
      Number(car.pricePerWeek) || Math.round((Number(car.pricePerDay) || 50) * 6),
      Number(car.pricePerMonth) || Math.round((Number(car.pricePerDay) || 50) * 22),
      car.image ||
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      galleryJson,
      Number(car.rating) || 5.0,
      Number(car.reviewsCount) || 1,
      Number(car.seats) || 5,
      car.transmission || "Automatic",
      car.fuelType || "Petrol",
      car.mileage || "45 Liters",
      car.luggage || "3 Bags",
      featuresJson,
      car.description || "Premium rental vehicle.",
      car.isPopular ? 1 : 0,
      car.status || "Available",
      car.plateNumber || `FL-${Math.floor(100 + Math.random() * 900)}-MTR`,
      car.location || activeHub.address,
      Number(car.healthScore) || 98,
      car.insurancePolicy !== undefined ? car.insurancePolicy : "",
      car.insuranceProvider !== undefined ? car.insuranceProvider : "",
      car.insuranceExpiry !== undefined ? car.insuranceExpiry : "",
      car.purchaseDate || new Date().toISOString().split("T")[0],
      Number(car.purchaseCost) || 32500,
      Number(car.currentOdometer) || 14200,
      car.garageName || car.location || activeHub.address,
      car.garageAddress || car.location || activeHub.address,
      Number(car.garageLat) || activeHub.lat || 17.4587,
      Number(car.garageLng) || activeHub.lng || 78.3506,
      car.garageBay || "Bay 1",
      car.vatRate != null && !isNaN(Number(car.vatRate)) ? Number(car.vatRate) : 18.0,
      car.securityDeposit != null && !isNaN(Number(car.securityDeposit))
        ? Number(car.securityDeposit)
        : 1000,
    )

  const created = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(newId)
  return res.status(201).json(formatCarRow(created))
})

// PUT update vehicle
router.put("/cars/:id", requireAdmin, async (req, res) => {
  const car = req.body
  const carId = req.params.id

  const existing = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  const updatedName = car.name || existing.name || "Custom Vehicle"
  const updatedBrand = car.brand || existing.brand || "Toyota"
  const updatedModel = car.model || existing.model || "Camry"
  const updatedYear = Number(car.year) || existing.year || 2024
  const updatedType = car.type || existing.type || "Sedan"
  const updatedDaily = Number(car.pricePerDay) || existing.price_per_day || 50
  const updatedHourly =
    Number(car.pricePerHour) || existing.price_per_hour || Math.max(1, Math.round(updatedDaily / 8))
  const updatedWeekly =
    Number(car.pricePerWeek) || existing.price_per_week || Math.round(updatedDaily * 6)
  const updatedMonthly =
    Number(car.pricePerMonth) || existing.price_per_month || Math.round(updatedDaily * 22)
  const updatedImage =
    car.image ||
    existing.image ||
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"
  const galleryJson = safeJsonStringify(
    car.gallery && car.gallery.length > 0
      ? car.gallery
      : existing.gallery
        ? typeof existing.gallery === "string"
          ? JSON.parse(existing.gallery)
          : existing.gallery
        : [updatedImage],
  )
  const updatedSeats = Number(car.seats) || existing.seats || 5
  const updatedTransmission = car.transmission || existing.transmission || "Automatic"
  const updatedFuel = car.fuelType || existing.fuel_type || "Petrol"
  const updatedMileage = car.mileage || existing.mileage || "45 Liters"
  const updatedLuggage = car.luggage || existing.luggage || "3 Bags"
  const featuresJson = safeJsonStringify(
    car.features && car.features.length > 0
      ? car.features
      : existing.features
        ? typeof existing.features === "string"
          ? JSON.parse(existing.features)
          : existing.features
        : ["Bluetooth", "Apple CarPlay"],
  )
  const updatedDesc = car.description || existing.description || "Premium rental vehicle."
  const updatedStatus = car.status || existing.status || "Available"
  const updatedPlate =
    car.plateNumber || existing.plate_number || `FL-${Math.floor(100 + Math.random() * 900)}-MTR`
  const updatedLocation = car.location || existing.location || "Operating Fleet Hub"
  const updatedHealth = Number(car.healthScore) || existing.health_score || 95
  const updatedPopular =
    car.isPopular !== undefined ? (car.isPopular ? 1 : 0) : existing.is_popular ? 1 : 0
  const updatedBay = car.garageBay || existing.garage_bay || "Bay 1"
  const updatedVat =
    car.vatRate != null && !isNaN(Number(car.vatRate))
      ? Number(car.vatRate)
      : existing.vat_rate != null
        ? Number(existing.vat_rate)
        : 18.0
  const updatedDeposit =
    car.securityDeposit != null && !isNaN(Number(car.securityDeposit))
      ? Number(car.securityDeposit)
      : existing.security_deposit != null
        ? Number(existing.security_deposit)
        : 1000

  await db
    .prepare(
      `
    UPDATE vehicles SET
      name = ?, brand = ?, model = ?, year = ?, type = ?, price_per_day = ?, price_per_hour = ?, price_per_week = ?, price_per_month = ?,
      image = ?, gallery = ?, seats = ?, transmission = ?, fuel_type = ?,
      mileage = ?, luggage = ?, features = ?, description = ?, is_popular = ?, status = ?,
      plate_number = ?, location = ?, health_score = ?,
      insurance_policy = ?, insurance_provider = ?, insurance_expiry = ?,
      purchase_date = ?, purchase_cost = ?, current_odometer = ?,
      garage_name = ?, garage_address = ?, garage_lat = ?, garage_lng = ?, garage_bay = ?,
      vat_rate = ?, security_deposit = ?
    WHERE id = ?
  `,
    )
    .run(
      updatedName,
      updatedBrand,
      updatedModel,
      updatedYear,
      updatedType,
      updatedDaily,
      updatedHourly,
      updatedWeekly,
      updatedMonthly,
      updatedImage,
      galleryJson,
      updatedSeats,
      updatedTransmission,
      updatedFuel,
      updatedMileage,
      updatedLuggage,
      featuresJson,
      updatedDesc,
      updatedPopular,
      updatedStatus,
      updatedPlate,
      updatedLocation,
      updatedHealth,
      car.insurancePolicy !== undefined ? car.insurancePolicy : existing.insurance_policy || "",
      car.insuranceProvider !== undefined
        ? car.insuranceProvider
        : existing.insurance_provider || "",
      car.insuranceExpiry !== undefined ? car.insuranceExpiry : existing.insurance_expiry || "",
      car.purchaseDate || existing.purchase_date || "2024-01-10",
      Number(car.purchaseCost) || existing.purchase_cost || 28500,
      Number(car.currentOdometer) || existing.current_odometer || 14250,
      car.garageName || existing.garage_name || updatedLocation,
      car.garageAddress || existing.garage_address || updatedLocation,
      Number(car.garageLat) || existing.garage_lat || 17.4646,
      Number(car.garageLng) || existing.garage_lng || 78.3582,
      updatedBay,
      updatedVat,
      updatedDeposit,
      carId,
    )

  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  return res.json(formatCarRow(updated))
})

// PATCH dynamic vehicle pricing (per hour, per day, per week, per month)
router.patch("/cars/:id/pricing", requireAdmin, async (req, res) => {
  const { pricePerHour, pricePerDay, pricePerWeek, pricePerMonth } = req.body
  const carId = req.params.id

  const existing = await db
    .prepare(
      "SELECT id, price_per_day, price_per_hour, price_per_week, price_per_month FROM vehicles WHERE id = ?",
    )
    .get(carId)
  if (!existing) {
    return res.status(404).json({ error: "Vehicle not found." })
  }

  const newPricePerDay =
    pricePerDay !== undefined && !isNaN(Number(pricePerDay))
      ? Number(pricePerDay)
      : Number(existing.price_per_day)
  const newPricePerHour =
    pricePerHour !== undefined && !isNaN(Number(pricePerHour))
      ? Number(pricePerHour)
      : Number(existing.price_per_hour)
  const newPricePerWeek =
    pricePerWeek !== undefined && !isNaN(Number(pricePerWeek))
      ? Number(pricePerWeek)
      : existing.price_per_week
        ? Number(existing.price_per_week)
        : Math.round(newPricePerDay * 6)
  const newPricePerMonth =
    pricePerMonth !== undefined && !isNaN(Number(pricePerMonth))
      ? Number(pricePerMonth)
      : existing.price_per_month
        ? Number(existing.price_per_month)
        : Math.round(newPricePerDay * 22)

  if (
    newPricePerHour <= 0 ||
    newPricePerDay <= 0 ||
    newPricePerWeek <= 0 ||
    newPricePerMonth <= 0
  ) {
    return res.status(400).json({ error: "Prices must be positive numbers greater than 0." })
  }

  await db
    .prepare(
      "UPDATE vehicles SET price_per_hour = ?, price_per_day = ?, price_per_week = ?, price_per_month = ? WHERE id = ?",
    )
    .run(newPricePerHour, newPricePerDay, newPricePerWeek, newPricePerMonth, carId)

  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  return res.json({
    success: true,
    message: "Vehicle dynamic pricing updated successfully.",
    car: formatCarRow(updated),
  })
})

// PATCH car status
router.patch("/cars/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body
  const carId = req.params.id

  if (!status) return res.status(400).json({ error: "Status is required." })

  await db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(status, carId)
  const updated = await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)
  return res.json(formatCarRow(updated))
})

// DELETE car
router.delete("/cars/:id", requireAdmin, async (req, res) => {
  await db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id)
  return res.json({
    success: true,
    message: "Vehicle decommissioned and removed.",
  })
})

// GET vehicle date availability check with fail-safe error handling
router.get("/cars/:id/availability", async (req, res) => {
  const carId = req.params.id
  const pickupDate = (req.query.pickupDate as string) || "Mar 15, 2026"
  const returnDate = (req.query.returnDate as string) || "Mar 18, 2026"

  try {
    const car = (await db.prepare("SELECT * FROM vehicles WHERE id = ?").get(carId)) as any
    if (!car) {
      return res.status(404).json({
        carId,
        isAvailable: false,
        error: "Vehicle not found.",
      })
    }

    const range = parseDateRangeStrict(pickupDate, returnDate)
    if (!range.valid) {
      return res.status(400).json({
        carId,
        isAvailable: false,
        carStatus: car.status,
        conflict: null,
        error: range.error,
      })
    }

    if (car.status === "Maintenance") {
      return res.json({
        carId,
        isAvailable: false,
        carStatus: car.status,
        conflict: {
          conflictingBookingId: "MAINTENANCE",
          customerName: "Fleet Maintenance",
          pickupDate: "Active",
          returnDate: "Scheduled End",
          status: "Maintenance",
          reason: "Vehicle is currently under maintenance.",
        },
      })
    }

    if (car.status === "Rented") {
      const activeRental = (await db
        .prepare(
          "SELECT id, pickup_date, return_date, status FROM bookings WHERE matched_car_id = ? AND status = 'Checked Out' LIMIT 1",
        )
        .get(carId)) as any
      if (activeRental) {
        return res.json({
          carId,
          isAvailable: false,
          carStatus: car.status,
          conflict: {
            conflictingBookingId: "RENTED",
            customerName: "Active rental in progress",
            pickupDate: activeRental.pickup_date,
            returnDate: activeRental.return_date,
            status: "Checked Out",
            reason: "Vehicle is currently out on an active rental until returned.",
          },
        })
      }
    }

    const conflict = await findVehicleBookingConflict(carId, pickupDate, returnDate)
    const isAvailable = !conflict && car.status !== "Maintenance"

    return res.json({
      carId,
      isAvailable,
      carStatus: car.status,
      conflict: conflict
        ? {
            ...conflict,
            conflictingBookingId: "RESERVED",
            customerName: "Existing reservation",
          }
        : null,
    })
  } catch (err: any) {
    console.error(`[Fail-Safe Check Error] Vehicle ${carId}:`, err?.message)
    return res.status(500).json({
      carId,
      isAvailable: false,
      carStatus: "Unavailable",
      conflict: {
        conflictingBookingId: "FAILSAFE_ERROR",
        customerName: "System Fail-Safe",
        pickupDate,
        returnDate,
        status: "Error",
        reason:
          "Availability check encountered an unexpected error. Fail-safe engaged to prevent double booking.",
      },
      error: "Availability verification failed safely.",
    })
  }
})

export default router
